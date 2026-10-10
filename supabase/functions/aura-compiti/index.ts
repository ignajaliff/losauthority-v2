/**
 * aura-compiti — il piano d'azione del cliente scritto da Aura dalla sua (unica)
 * call con Wesley, direttamente in `compiti` (tappe + sotto-compiti). Niente
 * Notion, niente bottone: la call entra in coda dal trigger del database appena
 * ha cliente e riassunto (migrazioni 44-45) e questa funzione la lavora.
 *   · `{}` (trigger, cron ogni 10 min, team): svuota la coda (`da_generare`, o
 *     `in_corso` ferma da più di 10 minuti), al massimo due call per giro; dopo
 *     tre prese in carico senza esito la call passa a `errore`.
 *   · `{ chiamata_id, rigenera?: true }` (team): lavora quella call adesso;
 *     con `rigenera` sostituisce il piano di Aura già presente.
 * Stati: in_corso → pronto | errore (motivo in `piano_errore`) | saltato (il
 * cliente ha già un piano di Aura e non si rigenera). Telegram quando è pronto.
 */
import type { SupabaseClient } from "npm:@supabase/supabase-js@2";
import { errore, gestisciErrore, json, leggiBody, preflight } from "../_shared/http.ts";
import { adminClient, richiediCronOTeam } from "../_shared/supabase.ts";
import { HAS_ANTHROPIC } from "../_shared/anthropic.ts";
import { logError } from "../_shared/log.ts";
import { notifyTelegram } from "../_shared/telegram.ts";
import { rigaLink, sitoGestionale } from "../_shared/sito.ts";
import { fathomConfigurato, getFathomTranscript, traduciRiassunto } from "../_shared/fathom.ts";
import { leggiContesto } from "./contesto.ts";
import { generaSottoCompiti, generaTappe } from "./genera.ts";
import type { CallLetta } from "./prompt.ts";
import { cancellaPerChiamata, cancellaPianoAura, haPianoAura, scriviPiano } from "./scrivi.ts";

type Body = {
  chiamata_id?: unknown;
  rigenera?: unknown;
};

interface RigaChiamata {
  id: string;
  cliente_id: string | null;
  titolo: string | null;
  registrata_il: string | null;
  riassunto: string | null;
  riassunto_originale: string | null;
  trascrizione: string | null;
  fathom_recording_id: string | null;
  piano_stato: string | null;
  piano_tentativi: number;
}
const COLONNE =
  "id, cliente_id, titolo, registrata_il, riassunto, riassunto_originale, trascrizione, fathom_recording_id, piano_stato, piano_tentativi";

/** Un'elaborazione `in_corso` da più di tanto è caduta: si riprende. */
const FERMA_DOPO_MS = 10 * 60_000;
const MAX_PER_GIRO = 2;
/** Dopo tante prese in carico senza esito la call va in errore (niente giri infiniti a pagamento). */
const MAX_TENTATIVI = 3;
/** Dopo questo tempo non si inizia una seconda call nello stesso giro (limite della funzione). */
const BUDGET_GIRO_MS = 60_000;
/** Scadenza di tutte le chiamate a Claude di una call: sotto il limite della funzione (~150 s). */
const BUDGET_CALL_MS = 115_000;
const MSG_RIASSUNTO = "Fathom non ha ancora il riassunto di questa call: riprova tra qualche minuto.";
const MSG_TENTATIVI = `Aura ha provato ${MAX_TENTATIVI} volte senza riuscire a finire il piano. Controlla gli errori e riprova con «Rigenera».`;

type Esito = { stato: "pronto" | "saltato"; tappe: number; sotto: number } | { stato: "errore"; errore: string };

/**
 * Prende in carico la call con un update condizionale: con il trigger, il cron e
 * un clic del team insieme, la lavora uno solo. null = l'ha già presa qualcun altro.
 */
async function prendiInCarico(admin: SupabaseClient, id: string, filtro: string, tentativi: number): Promise<RigaChiamata | null> {
  const { data, error } = await admin
    .from("chiamate")
    .update({ piano_stato: "in_corso", piano_avviato_il: new Date().toISOString(), piano_errore: null, piano_tentativi: tentativi })
    .eq("id", id)
    .or(filtro)
    .select(COLONNE);
  if (error) throw error;
  const righe = (data ?? []) as RigaChiamata[];
  return righe[0] ?? null;
}

/**
 * La call come la legge Aura: la trascrizione integrale (letta da Fathom una volta e
 * salvata), altrimenti il riassunto. Se il riassunto c'è solo in originale (call
 * arrivata senza cliente e assegnata a mano) lo traduce e lo salva: così la scheda
 * mostra il riassunto in italiano senza passare da «Scarica riassunto».
 */
async function leggiCall(admin: SupabaseClient, riga: RigaChiamata): Promise<CallLetta> {
  let trascrizione = riga.trascrizione;
  let riassunto = riga.riassunto;
  const [trascrizioneNuova, riassuntoNuovo] = await Promise.all([
    !trascrizione && riga.fathom_recording_id && fathomConfigurato() ? getFathomTranscript(riga.fathom_recording_id) : null,
    !riassunto && riga.riassunto_originale ? traduciRiassunto(riga.riassunto_originale) : null,
  ]);
  const patch: Record<string, string> = {};
  if (trascrizioneNuova) {
    trascrizione = trascrizioneNuova;
    patch.trascrizione = trascrizioneNuova;
  }
  if (riassuntoNuovo) {
    riassunto = riassuntoNuovo;
    patch.riassunto = riassuntoNuovo;
  }
  if (Object.keys(patch).length > 0) {
    const { error } = await admin.from("chiamate").update(patch).eq("id", riga.id);
    if (error) await logError("aura-compiti:call", error, { chiamata_id: riga.id }, { silent: true });
  }
  const { data: azioni } = await admin.from("chiamate_azioni").select("testo").eq("chiamata_id", riga.id).order("ordine");
  const testo = trascrizione ?? riassunto ?? riga.riassunto_originale ?? "";
  return {
    titolo: riga.titolo || "Call con Wesley",
    data: riga.registrata_il ? new Date(riga.registrata_il).toLocaleDateString("it-IT", { day: "numeric", month: "long", year: "numeric" }) : null,
    fonte: trascrizione ? "trascrizione" : "riassunto",
    testo,
    azioni: ((azioni ?? []) as Array<{ testo: string }>).map((a) => a.testo),
  };
}

async function chiudi(admin: SupabaseClient, id: string, patch: Record<string, unknown>): Promise<void> {
  const { error } = await admin.from("chiamate").update(patch).eq("id", id);
  if (error) await logError("aura-compiti:stato", error, { chiamata_id: id }, { silent: true });
}

/** Un'altra call dello stesso cliente sta scrivendo il piano in questo momento? */
async function altraInCorso(admin: SupabaseClient, clienteId: string, chiamataId: string): Promise<boolean> {
  const { count, error } = await admin
    .from("chiamate")
    .select("id", { count: "exact", head: true })
    .eq("cliente_id", clienteId)
    .eq("piano_stato", "in_corso")
    .neq("id", chiamataId)
    .gte("piano_avviato_il", new Date(Date.now() - FERMA_DOPO_MS).toISOString());
  if (error) throw error;
  return (count ?? 0) > 0;
}

async function salta(admin: SupabaseClient, id: string, motivo: string): Promise<Esito> {
  await chiudi(admin, id, { piano_stato: "saltato", piano_errore: motivo });
  return { stato: "saltato", tappe: 0, sotto: 0 };
}

const MSG_GIA_PIANO = "Il cliente ha già un piano scritto da Aura. Con «Rigenera» lo sostituisci con uno nuovo da questa call.";
const MSG_ALTRA_CALL = "Aura sta già scrivendo il piano del cliente da un'altra call.";

async function elabora(admin: SupabaseClient, riga: RigaChiamata, rigenera: boolean): Promise<Esito> {
  const clienteId = riga.cliente_id as string;
  if (!rigenera) {
    if (await haPianoAura(admin, clienteId)) return salta(admin, riga.id, MSG_GIA_PIANO);
    if (await altraInCorso(admin, clienteId, riga.id)) return salta(admin, riga.id, MSG_ALTRA_CALL);
  }

  const scadenza = Date.now() + BUDGET_CALL_MS;
  const [ctx, call] = await Promise.all([leggiContesto(admin, clienteId), leggiCall(admin, riga)]);
  if (!call.testo.trim()) throw new Error(MSG_RIASSUNTO);

  // Prima si genera tutto, poi si tocca il piano: se Aura fallisce il piano vecchio resta com'è.
  const tappe = await generaTappe(ctx, call, scadenza);
  if (!tappe) throw new Error("Aura non è riuscita a scrivere le tappe del piano. Riprova.");
  const sotto = await Promise.all(tappe.map((_, i) => generaSottoCompiti(ctx, call, tappe, i, scadenza)));

  // Ricontrollo prima di scrivere: nel frattempo un'altra call può aver scritto il piano.
  if (!rigenera && (await haPianoAura(admin, clienteId))) return salta(admin, riga.id, MSG_GIA_PIANO);
  if (rigenera) await cancellaPianoAura(admin, clienteId);

  let esito;
  try {
    esito = await scriviPiano(admin, clienteId, riga.id, tappe.map((t, i) => ({ titolo: t.titolo, sotto: sotto[i] })));
  } catch (err) {
    await cancellaPerChiamata(admin, riga.id);
    throw err;
  }
  await chiudi(admin, riga.id, { piano_stato: "pronto", piano_generato_il: new Date().toISOString(), piano_errore: null });

  const sito = await sitoGestionale(admin);
  await notifyTelegram(
    `🗺️ Piano d'azione pronto\nCliente: ${ctx.nome}\n${esito.tappe} tappe · ${esito.sotto} sotto-compiti, dalla call «${call.titolo}»` +
      rigaLink(sito, `/clienti/${clienteId}`),
  );
  return { stato: "pronto", ...esito };
}

/** Lavora una call presa in carico; qualsiasi errore finisce in `piano_errore` ed error_log (Telegram solo per i guasti veri). */
async function lavora(admin: SupabaseClient, riga: RigaChiamata, rigenera: boolean): Promise<Esito> {
  try {
    return await elabora(admin, riga, rigenera);
  } catch (err) {
    const messaggio = (err instanceof Error ? err.message : String(err)).slice(0, 500);
    await chiudi(admin, riga.id, { piano_stato: "errore", piano_errore: messaggio });
    await logError("aura-compiti:piano", err, { chiamata_id: riga.id, cliente_id: riga.cliente_id }, { silent: messaggio === MSG_RIASSUNTO });
    return { stato: "errore", errore: messaggio };
  }
}

/** La coda: `da_generare`, oppure `in_corso` ferma da troppo. Il filtro vale sia per la lettura sia per la presa in carico. */
const filtroCoda = (soglia: string) => `piano_stato.eq.da_generare,and(piano_stato.eq.in_corso,piano_avviato_il.lt.${soglia})`;

async function svuotaCoda(admin: SupabaseClient, soglia: string): Promise<Array<{ id: string } & Esito>> {
  const { data, error } = await admin
    .from("chiamate")
    .select("id, piano_tentativi")
    .or(filtroCoda(soglia))
    .order("registrata_il", { ascending: true, nullsFirst: false })
    .limit(MAX_PER_GIRO);
  if (error) throw error;
  const inizio = Date.now();
  const esiti: Array<{ id: string } & Esito> = [];
  for (const r of (data ?? []) as Array<{ id: string; piano_tentativi: number }>) {
    if (esiti.length > 0 && Date.now() - inizio > BUDGET_GIRO_MS) break;
    if (r.piano_tentativi >= MAX_TENTATIVI) {
      // Stesso filtro della presa in carico: se nel frattempo l'ha presa qualcun altro, non si tocca.
      await admin.from("chiamate").update({ piano_stato: "errore", piano_errore: MSG_TENTATIVI }).eq("id", r.id).or(filtroCoda(soglia));
      esiti.push({ id: r.id, stato: "errore", errore: MSG_TENTATIVI });
      continue;
    }
    const presa = await prendiInCarico(admin, r.id, filtroCoda(soglia), r.piano_tentativi + 1);
    if (!presa) continue;
    esiti.push({ id: r.id, ...(await lavora(admin, presa, false)) });
  }
  return esiti;
}

Deno.serve(async (req: Request) => {
  const pre = preflight(req);
  if (pre) return pre;
  try {
    const chi = await richiediCronOTeam(req);
    if (!HAS_ANTHROPIC) return errore("ANTHROPIC_API_KEY non configurata.", 500);
    const body = await leggiBody<Body>(req);
    const admin = adminClient();
    const soglia = new Date(Date.now() - FERMA_DOPO_MS).toISOString();

    // Team: una call precisa, adesso (con «Rigenera» sostituisce il piano di Aura).
    if (typeof body.chiamata_id === "string" && body.chiamata_id) {
      if (chi === "cron") return errore("Dati non validi.", 400);
      const { data } = await admin.from("chiamate").select(COLONNE).eq("id", body.chiamata_id).maybeSingle();
      const riga = data as RigaChiamata | null;
      if (!riga) return errore("Call non trovata.", 404);
      if (!riga.cliente_id) return errore("Questa call non è assegnata a nessun cliente.", 400);
      if (!riga.riassunto && !riga.riassunto_originale && !riga.trascrizione) {
        return errore("Fathom non ha ancora il riassunto di questa call: scaricalo prima.", 400);
      }
      const presa = await prendiInCarico(admin, riga.id, `piano_stato.is.null,piano_stato.neq.in_corso,piano_avviato_il.lt.${soglia}`, 1);
      if (!presa) return errore("Aura sta già scrivendo il piano da questa call: aspetta che finisca.", 409);
      const esito = await lavora(admin, presa, body.rigenera === true);
      if (esito.stato === "errore") return errore(esito.errore, 502);
      return json({ ok: true, ...esito });
    }

    // Trigger / cron: la coda, dalla call più vecchia.
    const esiti = await svuotaCoda(admin, soglia);
    return json({ ok: true, elaborate: esiti.length, esiti });
  } catch (err) {
    return gestisciErrore(err);
  }
});
