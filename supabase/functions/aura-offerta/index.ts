/**
 * aura-offerta — "Cervello del tuo branding → Offerta" dell'area cliente. Il
 * cliente costruisce la sua offerta parlando con Aura (che fa il consulente:
 * propone, il cliente corregge); a ogni turno Aura risponde e compila la carta
 * (riga `offerta`) e, alla chiusura, la diagnosi per Wesley (`offerta_diagnosi`).
 * Body:
 *   { azione: "crea" }                → nuova offerta + primo messaggio di Aura. { ok, offerta_id }
 *   { offerta_id, messaggio }         → turno di conversazione.                { ok, messaggio_id, risposta, offerta }
 *   { riprova_messaggio_id }          → rifà una risposta finita in errore.
 * La riga di Aura in offerta_messaggi nasce 'in_corso' e finisce 'completato' o
 * 'errore' (riprovabile). Il metodo viene da aura_conoscenza (ambito 'offerta');
 * nel contesto entrano anche gli avatar del cliente. Lo stato 'completo' scatta
 * solo se Aura lo dichiara E la riga unita passa campiMancanti. Rate limit nel
 * proprio ambito: aura_help_allowed(user, 40, 3600, 'offerta'). Max 12 offerte
 * per cliente (trigger nel DB + messaggio umano qui).
 */
import { gestisciErrore, HttpError, json, leggiBody, preflight } from "../_shared/http.ts";
import { adminClient, richiediUtente } from "../_shared/supabase.ts";
import { ANTHROPIC_MODEL, HAS_ANTHROPIC, streamAnthropicText } from "../_shared/anthropic.ts";
import { logError } from "../_shared/log.ts";
import { leggiMateriale, nomeCliente, renderScheda } from "../_shared/materiale.ts";
import { leggiLettura, renderLettura } from "../_shared/onboarding/lettura.ts";
import { costruisciPrompt, messaggioApertura, renderAvatar, SYSTEM, type Storico } from "./prompt.ts";
import { campiMancanti, estraiScheda, type CampiDiagnosi, type CampiOfferta } from "./scheda.ts";
import type { SupabaseClient } from "npm:@supabase/supabase-js@2";

type Body = { azione?: unknown; offerta_id?: unknown; messaggio?: unknown; riprova_messaggio_id?: unknown };

const MAX_MESSAGGIO = 6000;
// Finestra scorrevole: gli ultimi 12 messaggi (6 scambi). La memoria lunga è la CARTA
// (con `da_confermare`), che entra intera a ogni turno: ciò che Aura annota non si perde mai.
const MAX_STORICO = 12;
const MAX_OFFERTE = 12;
const MSG_ERRORE_AURA = "Aura non riesce a rispondere in questo momento. Riprova tra poco.";

type Offerta = Record<string, unknown> & { id: string; stato: string; nome: string | null };
type AvatarRiga = Record<string, unknown> & { id: string; nome: string | null; stato: string };

/** L'offerta del cliente (404 se non esiste o è di un altro). */
async function offertaDi(admin: SupabaseClient, clienteId: string, offertaId: string): Promise<Offerta> {
  const { data } = await admin.from("offerta").select("*").eq("id", offertaId).eq("cliente_id", clienteId).maybeSingle();
  if (!data) throw new HttpError(404, "Offerta non trovata.");
  return data as Offerta;
}

/** Gli avatar del cliente, i completi per primi (il più recente in testa). */
async function avatarDi(admin: SupabaseClient, clienteId: string): Promise<AvatarRiga[]> {
  const { data } = await admin.from("avatar").select("*").eq("cliente_id", clienteId).order("created_at", { ascending: false });
  const righe = (data ?? []) as AvatarRiga[];
  return [...righe.filter((a) => a.stato === "completo"), ...righe.filter((a) => a.stato !== "completo")];
}

/** Nuova offerta in costruzione + il primo messaggio di Aura (statico). */
async function crea(admin: SupabaseClient, clienteId: string) {
  const { count } = await admin.from("offerta").select("id", { count: "exact", head: true }).eq("cliente_id", clienteId);
  if ((count ?? 0) >= MAX_OFFERTE) throw new HttpError(409, `Hai già ${MAX_OFFERTE} offerte: elimina quelle che non usi prima di crearne altre.`);
  const avatar = (await avatarDi(admin, clienteId)).find((a) => a.stato === "completo") ?? null;
  const { data: offerta, error } = await admin
    .from("offerta")
    .insert({ cliente_id: clienteId, modello: ANTHROPIC_MODEL, avatar_id: avatar?.id ?? null })
    .select("id")
    .single();
  if (error || !offerta) throw error ?? new Error("offerta non creata");
  const offertaId = (offerta as { id: string }).id;
  const nome = await nomeCliente(admin, clienteId, "");
  const primo = nome.split(/\s+/)[0] ?? "";
  const { error: e2 } = await admin
    .from("offerta_messaggi")
    .insert({ offerta_id: offertaId, ruolo: "aura", stato: "completato", contenuto: messaggioApertura(primo.includes("@") ? "" : primo, avatar?.nome ?? null) });
  if (e2) throw e2;
  return offertaId;
}

/** Riprova: la riga di Aura in errore e il messaggio del cliente che la precede. */
async function perRiprova(admin: SupabaseClient, clienteId: string, auraId: string) {
  const { data: aura } = await admin.from("offerta_messaggi").select("id, offerta_id, created_at").eq("id", auraId).eq("ruolo", "aura").maybeSingle();
  if (!aura) throw new HttpError(404, "Messaggio non trovato.");
  const a = aura as { id: string; offerta_id: string; created_at: string };
  const offerta = await offertaDi(admin, clienteId, a.offerta_id);
  const { data: prec } = await admin
    .from("offerta_messaggi")
    .select("id, contenuto")
    .eq("offerta_id", a.offerta_id)
    .eq("ruolo", "cliente")
    .lt("created_at", a.created_at)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!prec) throw new HttpError(400, "Nessun messaggio da riprovare.");
  await admin.from("offerta_messaggi").update({ stato: "in_corso", errore: null, contenuto: "" }).eq("id", a.id);
  const p = prec as { id: string; contenuto: string };
  return { offerta, auraId: a.id, clienteMsgId: p.id, messaggio: p.contenuto };
}

/** Contesto del turno: si escludono la riga Aura in corso e il messaggio del cliente (entra a parte come NUOVO MESSAGGIO). */
async function contesto(admin: SupabaseClient, clienteId: string, offertaId: string, escludi: string[]) {
  const [scheda, conoscenza, storico, nome, diagnosi, avatars, lettura] = await Promise.all([
    leggiMateriale(admin, clienteId).catch(() => null),
    admin.from("aura_conoscenza").select("titolo, contenuto").eq("ambito", "offerta").eq("attivo", true).order("ordine"),
    admin
      .from("offerta_messaggi")
      .select("ruolo, contenuto")
      .eq("offerta_id", offertaId)
      .not("id", "in", `(${escludi.join(",")})`)
      .eq("stato", "completato")
      .order("created_at", { ascending: false })
      .limit(MAX_STORICO),
    nomeCliente(admin, clienteId),
    admin.from("offerta_diagnosi").select("*").eq("offerta_id", offertaId).maybeSingle(),
    avatarDi(admin, clienteId),
    leggiLettura(admin, clienteId).catch(() => null),
  ]);
  const blocchi = ((conoscenza.data ?? []) as Array<{ titolo: string; contenuto: string }>).map((b) => `## ${b.titolo}\n${b.contenuto.trim()}`);
  return {
    nome,
    scheda: renderScheda(scheda),
    lettura: lettura ? renderLettura(lettura, "offerta") : "(non disponibile)",
    conoscenza: blocchi.join("\n\n"),
    avatar: renderAvatar(avatars.slice(0, 3)),
    storico: ((storico.data ?? []) as Storico[]).reverse(),
    diagnosi: (diagnosi.data as Record<string, unknown> | null) ?? null,
  };
}

Deno.serve(async (req: Request) => {
  const pre = preflight(req);
  if (pre) return pre;
  try {
    const c = await richiediUtente(req);
    if (c.rol !== "cliente") throw new HttpError(403, "La fase Offerta è riservata ai clienti.");
    const body = await leggiBody<Body>(req);
    const admin = adminClient();

    // Rate limit nel proprio ambito, prima di qualsiasi scrittura (anche la creazione).
    const { data: permesso, error: errLimite } = await admin.rpc("aura_help_allowed", { p_user: c.id, p_max: 40, p_window_secs: 3600, p_scope: "offerta" });
    if (errLimite) await logError("aura-offerta:rate_limit", errLimite, { user: c.id }, { silent: true });
    else if (permesso === false) throw new HttpError(429, "Hai scritto molto in poco tempo: riprova tra un'ora.");

    if (body.azione === "crea") {
      const offertaId = await crea(admin, c.id);
      return json({ ok: true, offerta_id: offertaId });
    }

    if (!HAS_ANTHROPIC) throw new HttpError(500, "ANTHROPIC_API_KEY non configurata.");

    let offerta: Offerta;
    let auraId: string;
    let clienteMsgId: string;
    let messaggio: string;
    if (typeof body.riprova_messaggio_id === "string" && body.riprova_messaggio_id) {
      ({ offerta, auraId, clienteMsgId, messaggio } = await perRiprova(admin, c.id, body.riprova_messaggio_id));
    } else {
      if (typeof body.offerta_id !== "string" || !body.offerta_id) throw new HttpError(400, "Offerta mancante.");
      offerta = await offertaDi(admin, c.id, body.offerta_id);
      messaggio = typeof body.messaggio === "string" ? body.messaggio.trim().slice(0, MAX_MESSAGGIO) : "";
      if (messaggio.length < 2) throw new HttpError(400, "Scrivi una risposta ad Aura.");
      const { data: mio, error: e1 } = await admin
        .from("offerta_messaggi")
        .insert({ offerta_id: offerta.id, ruolo: "cliente", contenuto: messaggio })
        .select("id")
        .single();
      if (e1 || !mio) throw e1 ?? new Error("messaggio cliente non creato");
      clienteMsgId = (mio as { id: string }).id;
      const { data: aura, error: e2 } = await admin
        .from("offerta_messaggi")
        .insert({ offerta_id: offerta.id, ruolo: "aura", stato: "in_corso", modello: ANTHROPIC_MODEL })
        .select("id")
        .single();
      if (e2 || !aura) throw e2 ?? new Error("messaggio aura non creato");
      auraId = (aura as { id: string }).id;
    }

    const dati = await contesto(admin, c.id, offerta.id, [auraId, clienteMsgId]);
    const testo = await streamAnthropicText({ system: SYSTEM, user: costruisciPrompt({ ...dati, offerta, messaggio }), maxTokens: 8000, tag: "aura-offerta", utente: c.id });
    if (!testo) {
      await admin.from("offerta_messaggi").update({ stato: "errore", errore: "Nessuna risposta dal modello" }).eq("id", auraId);
      await logError("aura-offerta:anthropic", "Nessuna risposta da Aura", { user: c.id, offerta: offerta.id }, { silent: true });
      throw new HttpError(503, MSG_ERRORE_AURA);
    }

    const { risposta, offerta: campi, diagnosi: campiDiagnosi, completo, motivo, grezzo } = estraiScheda(testo);
    if (motivo !== "ok") {
      await logError(`aura-offerta:scheda_${motivo}`, `Blocco <scheda> ${motivo}`, { offerta: offerta.id, estratto: grezzo.slice(0, 500) }, { silent: true });
    }
    const contenuto = risposta || (Object.keys(campi).length + Object.keys(campiDiagnosi).length > 0 ? "Annotato sulla carta." : testo.trim());
    // La carta: solo i campi arrivati in questo turno. 'completo' solo se Aura lo dichiara E le righe unite hanno davvero tutto.
    const update: CampiOfferta & { stato?: string } = { ...campi };
    if (completo && offerta.stato !== "completo") {
      const mancanti = campiMancanti({ ...offerta, ...campi }, { ...(dati.diagnosi ?? {}), ...campiDiagnosi });
      if (mancanti.length === 0) update.stato = "completo";
      else await logError("aura-offerta:completo_incompleto", `Chiusura prematura: mancano ${mancanti.join(", ")}`, { offerta: offerta.id }, { silent: true });
    }
    if (Object.keys(update).length > 0) {
      const { error: e3 } = await admin.from("offerta").update(update).eq("id", offerta.id);
      if (e3) await logError("aura-offerta:update", e3, { offerta: offerta.id, campi: Object.keys(update) }, { silent: true });
    }
    if (Object.keys(campiDiagnosi).length > 0) {
      const riga: CampiDiagnosi & { offerta_id: string } = { offerta_id: offerta.id, ...campiDiagnosi };
      const { error: e5 } = await admin.from("offerta_diagnosi").upsert(riga, { onConflict: "offerta_id" });
      if (e5) await logError("aura-offerta:diagnosi", e5, { offerta: offerta.id, campi: Object.keys(campiDiagnosi) }, { silent: true });
    }
    const { error: e4 } = await admin.from("offerta_messaggi").update({ stato: "completato", contenuto, errore: null }).eq("id", auraId);
    if (e4) throw e4;
    const aggiornata = await offertaDi(admin, c.id, offerta.id);
    return json({ ok: true, messaggio_id: auraId, risposta: contenuto, offerta: aggiornata });
  } catch (err) {
    return gestisciErrore(err);
  }
});
