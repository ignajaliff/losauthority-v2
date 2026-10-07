/**
 * aura-coach — "Wesley Coach" dell'area cliente. Il cliente scrive dove è
 * bloccato; Aura cerca nel catalogo Skool (`lezioni`: keywords + descrizione)
 * la lezione giusta, risponde con un'indicazione e la manda al cliente.
 * Body: { messaggio } oppure { riprova_messaggio_id } per rifare una risposta
 * finita in errore. Risposta: { ok, messaggio_id, risposta, lezioni }.
 *
 * Una sola tabella (coach_messaggi): la riga di Aura nasce 'in_corso' e finisce
 * 'completato' (con `lezioni_ids` e, allo stesso indice, `lezioni_capitoli` =
 * "minuto titolo" del capitolo da cui guardare, o '') o 'errore' (riprovabile).
 * Rate limit: aura_help_allowed(user, 30, 3600).
 */
import { gestisciErrore, HttpError, json, leggiBody, preflight } from "../_shared/http.ts";
import { adminClient, richiediUtente } from "../_shared/supabase.ts";
import { ANTHROPIC_MODEL, HAS_ANTHROPIC, streamAnthropicText } from "../_shared/anthropic.ts";
import { logError } from "../_shared/log.ts";
import { leggiMateriale, nomeCliente, renderScheda } from "../_shared/materiale.ts";
import { costruisciPrompt, estraiRisposta, lezioniPertinenti, SYSTEM, type Lezione, type Storico } from "./prompt.ts";
import type { SupabaseClient } from "npm:@supabase/supabase-js@2";

type Body = { messaggio?: unknown; riprova_messaggio_id?: unknown };

const MAX_MESSAGGIO = 4000;
const MAX_STORICO = 12;
const MSG_ERRORE_AURA = "Aura non riesce a rispondere in questo momento. Riprova tra poco.";

/** Riprova: la riga di Aura in errore e il messaggio del cliente che la precede. */
async function perRiprova(admin: SupabaseClient, clienteId: string, auraId: string) {
  const { data: aura } = await admin
    .from("coach_messaggi")
    .select("id, created_at")
    .eq("id", auraId)
    .eq("cliente_id", clienteId)
    .eq("ruolo", "aura")
    .maybeSingle();
  if (!aura) throw new HttpError(404, "Messaggio non trovato.");
  const a = aura as { id: string; created_at: string };
  const { data: prec } = await admin
    .from("coach_messaggi")
    .select("contenuto")
    .eq("cliente_id", clienteId)
    .eq("ruolo", "cliente")
    .lt("created_at", a.created_at)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!prec) throw new HttpError(400, "Nessun messaggio da riprovare.");
  await admin.from("coach_messaggi").update({ stato: "in_corso", errore: null, contenuto: "", lezioni_ids: [], lezioni_capitoli: [] }).eq("id", a.id);
  return { auraId: a.id, messaggio: (prec as { contenuto: string }).contenuto };
}

async function contesto(admin: SupabaseClient, clienteId: string, escludiAuraId: string) {
  const [scheda, conoscenza, lezioni, storico, nome] = await Promise.all([
    leggiMateriale(admin, clienteId).catch(() => null),
    admin.from("aura_conoscenza").select("titolo, contenuto").eq("ambito", "generale").eq("attivo", true).order("ordine"),
    admin.from("lezioni").select("id, corso, titolo, url, descrizione, keywords").eq("attiva", true).order("corso").order("ordine"),
    admin
      .from("coach_messaggi")
      .select("ruolo, contenuto")
      .eq("cliente_id", clienteId)
      .neq("id", escludiAuraId)
      .eq("stato", "completato")
      .order("created_at", { ascending: false })
      .limit(MAX_STORICO),
    nomeCliente(admin, clienteId),
  ]);
  if (lezioni.error) throw lezioni.error;
  const blocchi = ((conoscenza.data ?? []) as Array<{ titolo: string; contenuto: string }>).map((b) => `## ${b.titolo}\n${b.contenuto}`);
  return {
    nome,
    scheda: renderScheda(scheda),
    conoscenza: blocchi.join("\n\n"),
    lezioni: (lezioni.data ?? []) as Lezione[],
    storico: ((storico.data ?? []) as Storico[]).reverse(),
  };
}

Deno.serve(async (req: Request) => {
  const pre = preflight(req);
  if (pre) return pre;
  try {
    const c = await richiediUtente(req);
    if (c.rol !== "cliente") throw new HttpError(403, "Wesley Coach è riservato ai clienti.");
    if (!HAS_ANTHROPIC) throw new HttpError(500, "ANTHROPIC_API_KEY non configurata.");
    const body = await leggiBody<Body>(req);
    const admin = adminClient();

    const { data: permesso, error: errLimite } = await admin.rpc("aura_help_allowed", { p_user: c.id, p_max: 30, p_window_secs: 3600 });
    if (errLimite) await logError("aura-coach:rate_limit", errLimite, { user: c.id }, { silent: true });
    else if (permesso === false) throw new HttpError(429, "Hai fatto molte domande in poco tempo: riprova tra un'ora.");

    let auraId: string;
    let messaggio: string;
    if (typeof body.riprova_messaggio_id === "string" && body.riprova_messaggio_id) {
      ({ auraId, messaggio } = await perRiprova(admin, c.id, body.riprova_messaggio_id));
    } else {
      messaggio = typeof body.messaggio === "string" ? body.messaggio.trim().slice(0, MAX_MESSAGGIO) : "";
      if (messaggio.length < 3) throw new HttpError(400, "Scrivi al coach dove sei bloccato.");
      const { error: e1 } = await admin.from("coach_messaggi").insert({ cliente_id: c.id, ruolo: "cliente", contenuto: messaggio });
      if (e1) throw e1;
      const { data: aura, error: e2 } = await admin
        .from("coach_messaggi")
        .insert({ cliente_id: c.id, ruolo: "aura", stato: "in_corso", modello: ANTHROPIC_MODEL })
        .select("id")
        .single();
      if (e2 || !aura) throw e2 ?? new Error("messaggio aura non creato");
      auraId = (aura as { id: string }).id;
    }

    const dati = await contesto(admin, c.id, auraId);
    const pertinenti = lezioniPertinenti(dati.lezioni, messaggio);
    const testo = await streamAnthropicText({ system: SYSTEM, user: costruisciPrompt({ ...dati, pertinenti, messaggio }), maxTokens: 1200, tag: "aura-coach", utente: c.id });
    if (!testo) {
      await admin.from("coach_messaggi").update({ stato: "errore", errore: "Nessuna risposta dal modello" }).eq("id", auraId);
      await logError("aura-coach:anthropic", "Nessuna risposta da Aura", { user: c.id }, { silent: true });
      throw new HttpError(503, MSG_ERRORE_AURA);
    }

    const catalogo = new Map(dati.lezioni.map((l) => [l.id, l]));
    const { risposta, scelte } = estraiRisposta(testo, catalogo);
    const contenuto = risposta || testo.trim();
    const { error: e3 } = await admin
      .from("coach_messaggi")
      .update({
        stato: "completato",
        contenuto,
        errore: null,
        lezioni_ids: scelte.map((s) => s.id),
        lezioni_capitoli: scelte.map((s) => (s.capitolo ? `${s.capitolo.tempo} ${s.capitolo.titolo}` : "")),
      })
      .eq("id", auraId);
    if (e3) throw e3;
    const lezioni = scelte.flatMap((s) => {
      const l = catalogo.get(s.id);
      return l ? [{ id: l.id, titolo: l.titolo, corso: l.corso, url: l.url, capitolo: s.capitolo }] : [];
    });
    return json({ ok: true, messaggio_id: auraId, risposta: contenuto, lezioni });
  } catch (err) {
    return gestisciErrore(err);
  }
});
