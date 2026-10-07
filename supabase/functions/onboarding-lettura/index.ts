/**
 * onboarding-lettura — compito 2 del documento di Wesley: Aura legge il
 * profilo del cliente a fine form.
 *   POST { azione: "leggi" }    → { ok, stato: "chiarimenti" | "riepilogo", chiarimenti, riepilogo }
 *   POST { azione: "conferma", correzione? } → { ok, stato: "inviato" }
 * Giro 1: può tornare con fino a 3 domande di chiarimento (stato chiarimenti).
 * Giro 2 (chiarimenti_fatti = true): niente domande, fotografia definitiva e
 * riepilogo (stato riepilogo). «Conferma» chiude (stato inviato); il team
 * viene avvisato da onboarding-completato, come prima.
 * La lettura dura anche un minuto: mentre gira la riga è in stato `lettura`;
 * se fallisce torna allo stato di prima con `lettura_errore`.
 */
import { gestisciErrore, HttpError, json, leggiBody, preflight } from "../_shared/http.ts";
import { adminClient, richiediUtente } from "../_shared/supabase.ts";
import { ANTHROPIC_MODEL, HAS_ANTHROPIC, streamAnthropicText } from "../_shared/anthropic.ts";
import { estraiOggetto } from "../_shared/json.ts";
import { logError } from "../_shared/log.ts";
import { costruisciProfilo } from "../_shared/onboarding/profilo.ts";
import { estraiMateriali } from "./materiali.ts";
import { messaggioProfilo, SYSTEM_LETTURA } from "./prompt.ts";
import { normalizzaLettura, salvaLettura } from "./salva.ts";

type Body = { azione?: unknown; correzione?: unknown };
type Riga = Record<string, unknown> & { stato: string; chiarimenti_fatti: boolean; materiali_testo: string | null; parole: unknown };

const STATI_LEGGIBILI = ["bozza", "lettura", "chiarimenti", "riepilogo"];
const MSG_FALLITA = "Aura non è riuscita a leggere il profilo. Riprova tra un momento.";

async function rigaDi(admin: ReturnType<typeof adminClient>, clienteId: string): Promise<Riga> {
  const { data, error } = await admin.from("data_onboarding").select("*").eq("id", clienteId).maybeSingle();
  if (error) throw error;
  if (!data) throw new HttpError(404, "Scheda non trovata: apri prima il form.");
  return data as Riga;
}

async function leggi(admin: ReturnType<typeof adminClient>, clienteId: string) {
  if (!HAS_ANTHROPIC) throw new HttpError(500, "ANTHROPIC_API_KEY non configurata.");
  const riga = await rigaDi(admin, clienteId);
  if (!STATI_LEGGIBILI.includes(riga.stato)) throw new HttpError(409, "L'onboarding è già stato inviato.");
  if (!riga.tipo || !riga.clienti || !riga.social) throw new HttpError(422, "Completa prima il modulo iniziale.");

  // Il giro: dopo i chiarimenti (o se già fatti) non si fanno altre domande.
  const chiarimentiFatti = riga.chiarimenti_fatti === true || riga.stato === "chiarimenti";
  const statoPrecedente = riga.stato === "lettura" ? (chiarimentiFatti ? "chiarimenti" : "bozza") : riga.stato;
  await admin.from("data_onboarding").update({ stato: "lettura", lettura_errore: null }).eq("id", clienteId);

  try {
    // I materiali si leggono una volta (al secondo giro si riusa il testo già estratto).
    let materialiTesto = riga.materiali_testo;
    if (materialiTesto === null) {
      materialiTesto = await estraiMateriali(admin, clienteId);
      // Salvato subito: se la lettura poi non ci sta nel tempo, «Riprova» non rilegge i file.
      if (materialiTesto) await admin.from("data_onboarding").update({ materiali_testo: materialiTesto }).eq("id", clienteId);
    }
    const { data: chiarimentiRaw } = await admin.from("onboarding_chiarimenti").select("domanda, campo, risposta").eq("cliente_id", clienteId).order("ordine");
    const profilo = {
      ...costruisciProfilo(riga, materialiTesto),
      chiarimenti_fatti: chiarimentiFatti,
      chiarimenti: (chiarimentiRaw ?? []) as Array<{ domanda: string; campo: string; risposta: string | null }>,
    };

    const testo = await streamAnthropicText({ system: SYSTEM_LETTURA, user: messaggioProfilo(profilo), maxTokens: 6000, tag: "onboarding-lettura", utente: clienteId });
    const lettura = normalizzaLettura(testo ? estraiOggetto(testo) : null);
    if (!lettura) {
      await logError("onboarding-lettura:modello", "Risposta non interpretabile", { cliente: clienteId, estratto: (testo ?? "").slice(0, 400) });
      throw new HttpError(503, MSG_FALLITA);
    }
    const esito = await salvaLettura(admin, clienteId, lettura, { giro: chiarimentiFatti ? 2 : 1, modello: ANTHROPIC_MODEL, chiarimentiFatti, materialiTesto });
    return json({ ok: true, stato: esito.stato, chiarimenti: esito.chiarimenti, riepilogo: lettura.riepilogo });
  } catch (err) {
    // Si torna allo stato di prima: il cliente vede «Riprova», niente righe a metà.
    await admin
      .from("data_onboarding")
      .update({ stato: statoPrecedente, lettura_errore: err instanceof HttpError ? err.message : MSG_FALLITA })
      .eq("id", clienteId)
      .eq("stato", "lettura");
    if (err instanceof HttpError) throw err;
    await logError("onboarding-lettura:errore", err, { cliente: clienteId });
    throw new HttpError(503, MSG_FALLITA);
  }
}

async function conferma(admin: ReturnType<typeof adminClient>, clienteId: string, body: Body) {
  const riga = await rigaDi(admin, clienteId);
  const correzione = typeof body.correzione === "string" ? body.correzione.trim().slice(0, 4000) || null : null;
  if (riga.stato === "inviato") return json({ ok: true, stato: "inviato" });
  if (riga.stato !== "riepilogo") throw new HttpError(409, "Prima fai leggere il profilo ad Aura.");
  const { error } = await admin
    .from("data_onboarding")
    .update({ stato: "inviato", inviato_il: new Date().toISOString(), riepilogo_correzione: correzione })
    .eq("id", clienteId)
    .eq("stato", "riepilogo");
  if (error) {
    await logError("onboarding-lettura:conferma", error, { cliente: clienteId });
    throw new HttpError(500, "Non sono riuscito a salvare la conferma. Riprova.");
  }
  return json({ ok: true, stato: "inviato" });
}

Deno.serve(async (req: Request) => {
  const pre = preflight(req);
  if (pre) return pre;
  try {
    const c = await richiediUtente(req);
    if (c.rol !== "cliente") throw new HttpError(403, "Riservato ai clienti.");
    const body = await leggiBody<Body>(req);
    const admin = adminClient();
    if (body.azione === "conferma") return await conferma(admin, c.id, body);
    if (body.azione !== "leggi") throw new HttpError(400, "Azione non riconosciuta.");

    const { data: permesso, error: errLimite } = await admin.rpc("aura_help_allowed", { p_user: c.id, p_max: 8, p_window_secs: 3600, p_scope: "onboarding_lettura" });
    if (errLimite) await logError("onboarding-lettura:rate_limit", errLimite, { user: c.id }, { silent: true });
    else if (permesso === false) throw new HttpError(429, "Hai già fatto leggere il profilo molte volte: riprova tra un'ora.");
    return await leggi(admin, c.id);
  } catch (err) {
    return gestisciErrore(err);
  }
});
