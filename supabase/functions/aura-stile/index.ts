/**
 * aura-stile — pagina "Stili" dell'area cliente. Il cliente incolla più script
 * dello stesso stile; Aura li studia e scrive le istruzioni dello STILE (come
 * si costruisce quel tipo di video nel suo nicho) in una riga di `stili`.
 * Body: { titolo, script: string[], note? } oppure { riprova_stile_id } per
 * rifare uno stile finito in errore. Risposta: { ok, stile }.
 *
 * Traccia dello stato: la riga nasce 'in_corso' e finisce 'pronta' o 'errore'
 * (con il motivo): la pagina la mostra subito e la aggiorna quando è pronta.
 * Rate limit: aura_help_allowed(user, 10, 3600).
 */
import { gestisciErrore, HttpError, json, leggiBody, preflight } from "../_shared/http.ts";
import { adminClient, richiediUtente } from "../_shared/supabase.ts";
import { ANTHROPIC_MODEL, HAS_ANTHROPIC, streamAnthropicText } from "../_shared/anthropic.ts";
import { logError } from "../_shared/log.ts";
import { leggiMateriale, nomeCliente, renderScheda } from "../_shared/materiale.ts";
import { costruisciPrompt, estraiStile, SYSTEM } from "./prompt.ts";
import type { SupabaseClient } from "npm:@supabase/supabase-js@2";

type Body = {
  titolo?: unknown;
  script?: unknown;
  note?: unknown;
  riprova_stile_id?: unknown;
};

const MAX_SCRIPT = 10;
const MAX_LUNGHEZZA_SCRIPT = 8000;
const MSG_ERRORE_AURA = "Aura non riesce a studiare gli script in questo momento. Riprova tra poco.";

interface Stile {
  id: string;
  titolo: string;
  note: string | null;
  script_fonte: string[];
}

/** Valida il body di uno stile nuovo: titolo + almeno uno script non vuoto. */
function leggiNuovo(body: Body): { titolo: string; note: string | null; script: string[] } {
  const titolo = typeof body.titolo === "string" ? body.titolo.trim().slice(0, 120) : "";
  if (titolo.length < 2) throw new HttpError(400, "Dai un nome allo stile.");
  const grezzi = Array.isArray(body.script) ? body.script : [];
  const script = grezzi
    .filter((s): s is string => typeof s === "string")
    .map((s) => s.trim().slice(0, MAX_LUNGHEZZA_SCRIPT))
    .filter((s) => s.length >= 40)
    .slice(0, MAX_SCRIPT);
  if (script.length === 0) throw new HttpError(400, "Incolla almeno uno script completo (minimo 40 caratteri).");
  const note = typeof body.note === "string" && body.note.trim() ? body.note.trim().slice(0, 2000) : null;
  return { titolo, note, script };
}

/** Riprova: rimette 'in_corso' uno stile del cliente finito in errore. */
async function perRiprova(admin: SupabaseClient, clienteId: string, stileId: string): Promise<Stile> {
  const { data } = await admin
    .from("stili")
    .select("id, titolo, note, script_fonte, stato")
    .eq("id", stileId)
    .eq("cliente_id", clienteId)
    .maybeSingle();
  if (!data) throw new HttpError(404, "Stile non trovato.");
  const s = data as Stile & { stato: string };
  if (s.stato === "in_corso") throw new HttpError(409, "Aura sta già lavorando su questo stile.");
  // Solo gli stili in errore si rifanno: uno pronto potrebbe avere istruzioni ritoccate dal cliente.
  if (s.stato !== "errore") throw new HttpError(409, "Questo stile è già pronto.");
  if (s.script_fonte.length === 0) throw new HttpError(400, "Questo stile non ha script da cui ripartire.");
  await admin.from("stili").update({ stato: "in_corso", errore: null, modello: ANTHROPIC_MODEL }).eq("id", s.id);
  return s;
}

async function contesto(admin: SupabaseClient, clienteId: string) {
  const [scheda, analisi, conoscenza, nome] = await Promise.all([
    leggiMateriale(admin, clienteId).catch(() => null),
    admin.from("analisi").select("contenuto").eq("cliente_id", clienteId).maybeSingle(),
    admin.from("aura_conoscenza").select("titolo, contenuto").eq("ambito", "idee").eq("attivo", true).order("ordine"),
    nomeCliente(admin, clienteId),
  ]);
  const blocchi = ((conoscenza.data ?? []) as Array<{ titolo: string; contenuto: string }>).map((b) => `## ${b.titolo}\n${b.contenuto}`);
  return {
    nome,
    scheda: renderScheda(scheda),
    analisi: (analisi.data as { contenuto: string } | null)?.contenuto ?? null,
    conoscenza: blocchi.join("\n\n"),
  };
}

Deno.serve(async (req: Request) => {
  const pre = preflight(req);
  if (pre) return pre;
  try {
    const c = await richiediUtente(req);
    if (c.rol !== "cliente") throw new HttpError(403, "Gli stili sono riservati ai clienti.");
    if (!HAS_ANTHROPIC) throw new HttpError(500, "ANTHROPIC_API_KEY non configurata.");
    const body = await leggiBody<Body>(req);
    const admin = adminClient();

    const { data: permesso, error: errLimite } = await admin.rpc("aura_help_allowed", { p_user: c.id, p_max: 10, p_window_secs: 3600 });
    if (errLimite) await logError("aura-stile:rate_limit", errLimite, { user: c.id }, { silent: true });
    else if (permesso === false) throw new HttpError(429, "Hai creato molti stili in poco tempo: riprova tra un'ora.");

    let stile: Stile;
    if (typeof body.riprova_stile_id === "string" && body.riprova_stile_id) {
      stile = await perRiprova(admin, c.id, body.riprova_stile_id);
    } else {
      const nuovo = leggiNuovo(body);
      const { data, error } = await admin
        .from("stili")
        .insert({ cliente_id: c.id, titolo: nuovo.titolo, note: nuovo.note, script_fonte: nuovo.script, stato: "in_corso", modello: ANTHROPIC_MODEL })
        .select("id, titolo, note, script_fonte")
        .single();
      if (error || !data) throw error ?? new Error("stile non creato");
      stile = data as Stile;
    }

    const dati = await contesto(admin, c.id);
    const testo = await streamAnthropicText({
      system: SYSTEM,
      user: costruisciPrompt({ ...dati, titolo: stile.titolo, note: stile.note, script: stile.script_fonte }),
      maxTokens: 2500,
      tag: "aura-stile",
      utente: c.id,
    });
    if (!testo) {
      await admin.from("stili").update({ stato: "errore", errore: "Nessuna risposta dal modello" }).eq("id", stile.id);
      await logError("aura-stile:anthropic", "Nessuna risposta da Aura", { user: c.id, stileId: stile.id }, { silent: true });
      throw new HttpError(503, MSG_ERRORE_AURA);
    }

    const { descrizione, istruzioni } = estraiStile(testo);
    if (istruzioni.length < 50) {
      await admin.from("stili").update({ stato: "errore", errore: "Risposta incompleta" }).eq("id", stile.id);
      throw new HttpError(503, MSG_ERRORE_AURA);
    }
    const { data: pronto, error: errFine } = await admin
      .from("stili")
      .update({ stato: "pronta", errore: null, descrizione, istruzioni })
      .eq("id", stile.id)
      .select("*")
      .single();
    if (errFine || !pronto) {
      await logError("aura-stile:salva", errFine ?? "stile non salvato", { user: c.id, stileId: stile.id });
      throw new HttpError(500, "Aura ha scritto lo stile ma non sono riuscita a salvarlo. Riprova.");
    }
    return json({ ok: true, stile: pronto });
  } catch (err) {
    return gestisciErrore(err);
  }
});
