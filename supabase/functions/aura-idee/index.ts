/**
 * aura-idee — "Crea idee" dell'area cliente. Il cliente scrive ad Aura; Aura
 * risponde e propone 1-3 idee di video (titolo, hook, script, tipologia).
 * Body: { messaggio, sessione_id?, stile_id?, ricerca_id? } oppure { riprova_messaggio_id } per rifare
 * una risposta finita in errore. Risposta: { ok, sessione_id, messaggio_id, risposta, idee }.
 * stile_id = uno stile della pagina "Stili" (tabella stili, richiamato con "/"): entra nel
 * prompt e le proposte lo seguono; si salva sul messaggio del cliente.
 * ricerca_id = una ricerca TikTok pronta del cliente («Usa in Crea idee»): le top (una per lingua
 * dal 07/10/2026) entrano nel prompt come spunto; si salva sul messaggio del cliente (idee_messaggi.ricerca_id).
 *
 * Traccia dello stato: la riga di Aura in idee_messaggi nasce 'in_corso' e
 * finisce 'completato' o 'errore' (con il motivo). Le proposte vanno in `idee`
 * con stato 'proposta': è il cliente che le conferma.
 * Rate limit: aura_help_allowed(user, 30, 3600).
 */
import { gestisciErrore, HttpError, json, leggiBody, preflight } from "../_shared/http.ts";
import { adminClient, richiediUtente } from "../_shared/supabase.ts";
import { ANTHROPIC_MODEL, HAS_ANTHROPIC, streamAnthropicText } from "../_shared/anthropic.ts";
import { logError } from "../_shared/log.ts";
import { leggiMateriale, nomeCliente, renderScheda } from "../_shared/materiale.ts";
import { costruisciPrompt, estraiProposte, SYSTEM, type RicercaScelta, type StileScelto, type Storico, type TopPubblicazione, type VideoRicerca } from "./prompt.ts";
import type { SupabaseClient } from "npm:@supabase/supabase-js@2";

type Body = {
  messaggio?: unknown;
  sessione_id?: unknown;
  stile_id?: unknown;
  ricerca_id?: unknown;
  riprova_messaggio_id?: unknown;
};

const MAX_MESSAGGIO = 4000;
const MAX_STORICO = 12;
const MSG_ERRORE_AURA = "Aura non riesce a rispondere in questo momento. Riprova tra poco.";

interface Messaggio {
  id: string;
  sessione_id: string;
  ruolo: "cliente" | "aura";
  contenuto: string;
  stato: string;
  created_at: string;
}

/** Sessione esistente (verificata) o nuova, intitolata con l'inizio del messaggio. */
async function sessionePer(admin: SupabaseClient, clienteId: string, sessioneId: string | null, messaggio: string): Promise<string> {
  if (sessioneId) {
    const { data } = await admin.from("idee_sessioni").select("id").eq("id", sessioneId).eq("cliente_id", clienteId).maybeSingle();
    if (!data) throw new HttpError(404, "Sessione non trovata.");
    return sessioneId;
  }
  const titolo = messaggio.replace(/\s+/g, " ").slice(0, 80);
  const { data, error } = await admin.from("idee_sessioni").insert({ cliente_id: clienteId, titolo }).select("id").single();
  if (error || !data) throw error ?? new Error("sessione non creata");
  return (data as { id: string }).id;
}

/** Stile del cliente pronto all'uso (null se non richiesto). Stile altrui o non pronto → 404. */
async function stilePer(admin: SupabaseClient, clienteId: string, stileId: string | null): Promise<StileScelto | null> {
  if (!stileId) return null;
  const { data } = await admin
    .from("stili")
    .select("titolo, istruzioni")
    .eq("id", stileId)
    .eq("cliente_id", clienteId)
    .eq("stato", "pronta")
    .maybeSingle();
  if (!data) throw new HttpError(404, "Stile non trovato o non ancora pronto.");
  return data as StileScelto;
}

/** Ordine dei video nel prompt: top unica (ricerche vecchie), top per lingua (it, en, es), migliori nella lingua target. */
const ORDINE_LINGUE = ["it", "en", "es"];
const rango = (v: VideoRicerca) => {
  if (v.sezione === "top") return 0;
  if (v.sezione === "lingua_target") return 20;
  const i = ORDINE_LINGUE.indexOf(v.lingua ?? "");
  return 1 + (i === -1 ? ORDINE_LINGUE.length : i);
};

/** Ricerca TikTok pronta del cliente con le sue top (null se non richiesta). Altrui o non pronta → 404. */
async function ricercaPer(admin: SupabaseClient, clienteId: string, ricercaId: string | null): Promise<RicercaScelta | null> {
  if (!ricercaId) return null;
  const { data } = await admin
    .from("ricerche_tiktok")
    .select("id, tema, soglia_dal, osservazioni")
    .eq("id", ricercaId)
    .eq("cliente_id", clienteId)
    .eq("stato", "pronta")
    .maybeSingle();
  if (!data) throw new HttpError(404, "Ricerca TikTok non trovata o non ancora pronta.");
  const r = data as { tema: string; soglia_dal: string | null; osservazioni: string[] | null };
  const { data: video, error } = await admin
    .from("ricerche_tiktok_video")
    .select("sezione, posizione, autore, lingua, mi_piace, visualizzazioni, di_cosa_parla, didascalia, url, sponsorizzato, fuori_tema, da_non_replicare")
    .eq("ricerca_id", ricercaId)
    .in("sezione", ["top", "top_lingua", "lingua_target"]);
  if (error) throw error;
  const ordinati = ((video ?? []) as VideoRicerca[]).sort((x, y) => rango(x) - rango(y) || x.posizione - y.posizione);
  return { tema: r.tema, soglia_dal: r.soglia_dal, osservazioni: r.osservazioni ?? [], video: ordinati };
}

/** Riprova: la riga di Aura in errore e il messaggio del cliente che la precede. */
async function perRiprova(admin: SupabaseClient, clienteId: string, auraId: string) {
  const { data: aura } = await admin
    .from("idee_messaggi")
    .select("id, sessione_id, ruolo, stato, created_at, idee_sessioni!inner(cliente_id)")
    .eq("id", auraId)
    .eq("ruolo", "aura")
    .eq("idee_sessioni.cliente_id", clienteId)
    .maybeSingle();
  if (!aura) throw new HttpError(404, "Messaggio non trovato.");
  const a = aura as unknown as Messaggio;
  const { data: prec } = await admin
    .from("idee_messaggi")
    .select("id, contenuto, stile_id, ricerca_id")
    .eq("sessione_id", a.sessione_id)
    .eq("ruolo", "cliente")
    .lt("created_at", a.created_at)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!prec) throw new HttpError(400, "Nessun messaggio da riprovare.");
  await admin.from("idee_messaggi").update({ stato: "in_corso", errore: null, contenuto: "" }).eq("id", a.id);
  const p = prec as { contenuto: string; stile_id: string | null; ricerca_id: string | null };
  return { sessioneId: a.sessione_id, auraId: a.id, messaggio: p.contenuto, stileId: p.stile_id, ricercaId: p.ricerca_id };
}

async function contesto(admin: SupabaseClient, clienteId: string, sessioneId: string, escludiAuraId: string) {
  const [scheda, analisi, conoscenza, storico, idee, top, nome] = await Promise.all([
    leggiMateriale(admin, clienteId).catch(() => null),
    admin.from("analisi").select("contenuto").eq("cliente_id", clienteId).maybeSingle(),
    admin.from("aura_conoscenza").select("titolo, contenuto").eq("ambito", "idee").eq("attivo", true).order("ordine"),
    admin
      .from("idee_messaggi")
      .select("ruolo, contenuto, stato")
      .eq("sessione_id", sessioneId)
      .neq("id", escludiAuraId)
      .eq("stato", "completato")
      .order("created_at", { ascending: false })
      .limit(MAX_STORICO),
    admin.from("idee").select("titolo").eq("cliente_id", clienteId).neq("stato", "scartata").order("created_at", { ascending: false }).limit(15),
    admin
      .from("pubblicazioni_metriche")
      .select("visualizzazioni, piattaforma, pubblicazioni!inner(titolo, cliente_id)")
      .eq("pubblicazioni.cliente_id", clienteId)
      .not("visualizzazioni", "is", null)
      .order("visualizzazioni", { ascending: false })
      .limit(5),
    nomeCliente(admin, clienteId),
  ]);
  const blocchi = ((conoscenza.data ?? []) as Array<{ titolo: string; contenuto: string }>).map((b) => `## ${b.titolo}\n${b.contenuto}`);
  const storicoOrdinato = ((storico.data ?? []) as Storico[]).reverse();
  const topPubblicazioni: TopPubblicazione[] = ((top.data ?? []) as Array<Record<string, unknown>>).map((r) => ({
    titolo: (r.pubblicazioni as { titolo: string }).titolo,
    piattaforma: String(r.piattaforma),
    visualizzazioni: typeof r.visualizzazioni === "number" ? r.visualizzazioni : null,
  }));
  return {
    nome,
    scheda: renderScheda(scheda),
    analisi: (analisi.data as { contenuto: string } | null)?.contenuto ?? null,
    conoscenza: blocchi.join("\n\n"),
    storico: storicoOrdinato,
    ideeRecenti: ((idee.data ?? []) as Array<{ titolo: string }>).map((i) => i.titolo),
    topPubblicazioni,
  };
}

Deno.serve(async (req: Request) => {
  const pre = preflight(req);
  if (pre) return pre;
  try {
    const c = await richiediUtente(req);
    if (c.rol !== "cliente") throw new HttpError(403, "Crea idee è riservato ai clienti.");
    if (!HAS_ANTHROPIC) throw new HttpError(500, "ANTHROPIC_API_KEY non configurata.");
    const body = await leggiBody<Body>(req);
    const admin = adminClient();

    const { data: permesso, error: errLimite } = await admin.rpc("aura_help_allowed", { p_user: c.id, p_max: 30, p_window_secs: 3600 });
    if (errLimite) await logError("aura-idee:rate_limit", errLimite, { user: c.id }, { silent: true });
    else if (permesso === false) throw new HttpError(429, "Hai chiesto molte idee in poco tempo: riprova tra un'ora.");

    let sessioneId: string;
    let auraId: string;
    let messaggio: string;
    let stileId: string | null;
    let ricercaId: string | null;
    if (typeof body.riprova_messaggio_id === "string" && body.riprova_messaggio_id) {
      ({ sessioneId, auraId, messaggio, stileId, ricercaId } = await perRiprova(admin, c.id, body.riprova_messaggio_id));
    } else {
      messaggio = typeof body.messaggio === "string" ? body.messaggio.trim().slice(0, MAX_MESSAGGIO) : "";
      if (messaggio.length < 3) throw new HttpError(400, "Scrivi ad Aura cosa vuoi raccontare.");
      stileId = typeof body.stile_id === "string" && body.stile_id ? body.stile_id : null;
      ricercaId = typeof body.ricerca_id === "string" && body.ricerca_id ? body.ricerca_id : null;
      // Verifica PRIMA di scrivere: uno stile o una ricerca altrui non devono lasciare tracce.
      await Promise.all([stilePer(admin, c.id, stileId), ricercaPer(admin, c.id, ricercaId)]);
      sessioneId = await sessionePer(admin, c.id, typeof body.sessione_id === "string" ? body.sessione_id : null, messaggio);
      const { error: e1 } = await admin
        .from("idee_messaggi")
        .insert({ sessione_id: sessioneId, ruolo: "cliente", contenuto: messaggio, stile_id: stileId, ricerca_id: ricercaId });
      if (e1) throw e1;
      const { data: aura, error: e2 } = await admin
        .from("idee_messaggi")
        .insert({ sessione_id: sessioneId, ruolo: "aura", stato: "in_corso", modello: ANTHROPIC_MODEL })
        .select("id")
        .single();
      if (e2 || !aura) throw e2 ?? new Error("messaggio aura non creato");
      auraId = (aura as { id: string }).id;
    }

    // In riprova lo stile o la ricerca potrebbero essere stati eliminati nel frattempo: si prosegue senza.
    const [dati, stile, ricerca] = await Promise.all([
      contesto(admin, c.id, sessioneId, auraId),
      stilePer(admin, c.id, stileId).catch(() => null),
      ricercaPer(admin, c.id, ricercaId).catch(() => null),
    ]);
    const testo = await streamAnthropicText({ system: SYSTEM, user: costruisciPrompt({ ...dati, stile, ricerca, messaggio }), maxTokens: 3000, tag: "aura-idee", utente: c.id });
    if (!testo) {
      await admin.from("idee_messaggi").update({ stato: "errore", errore: "Nessuna risposta dal modello" }).eq("id", auraId);
      await logError("aura-idee:anthropic", "Nessuna risposta da Aura", { user: c.id, sessioneId }, { silent: true });
      throw new HttpError(503, MSG_ERRORE_AURA);
    }

    const { risposta, proposte } = estraiProposte(testo);
    let idee: unknown[] = [];
    if (proposte.length > 0) {
      const { data, error } = await admin
        .from("idee")
        .insert(proposte.map((p) => ({ ...p, cliente_id: c.id, sessione_id: sessioneId, messaggio_id: auraId, origine: "aura", stato: "proposta" })))
        .select("*");
      if (error) {
        await admin.from("idee_messaggi").update({ stato: "errore", errore: "Proposte non salvate" }).eq("id", auraId);
        await logError("aura-idee:idee", error, { user: c.id, sessioneId });
        throw new HttpError(500, "Aura ha risposto ma non sono riuscita a salvare le idee. Riprova.");
      }
      idee = data ?? [];
    }
    const contenuto = risposta || (proposte.length > 0 ? "Ecco le mie proposte." : testo.trim());
    await admin.from("idee_messaggi").update({ stato: "completato", contenuto, errore: null }).eq("id", auraId);
    await admin.from("idee_sessioni").update({ stato: "aperta" }).eq("id", sessioneId); // tocca updated_at

    return json({ ok: true, sessione_id: sessioneId, messaggio_id: auraId, risposta: contenuto, idee });
  } catch (err) {
    return gestisciErrore(err);
  }
});
