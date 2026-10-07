/**
 * onboarding-parole — compito 1 del documento di Wesley: le «parole del
 * mestiere». Subito dopo il modulo iniziale, Claude dice quali parole il form
 * deve usare al posto di «cliente» e «servizio» (una psicologa legge
 * «pazienti» e «sedute»). Body: { attivita_breve, tipo, tipo_principale? } →
 * { ok, parole }. Si salvano in data_onboarding.parole; se la chiamata
 * fallisce il form usa i testi standard (il chiamante non blocca).
 */
import { gestisciErrore, HttpError, json, leggiBody, preflight } from "../_shared/http.ts";
import { adminClient, richiediUtente } from "../_shared/supabase.ts";
import { streamAnthropicText } from "../_shared/anthropic.ts";
import { estraiOggetto } from "../_shared/json.ts";
import { logError } from "../_shared/log.ts";
import { paroleDaJson } from "../_shared/onboarding/definizione.ts";
import type { Parole } from "../_shared/onboarding/tipi.ts";

type Body = {
  attivita_breve?: unknown;
  tipo?: unknown;
  tipo_principale?: unknown;
};

/** Modello veloce: la risposta sono cinque parole, deve arrivare mentre il cliente legge il blocco A. */
export const MODELLO_VELOCE = Deno.env.get("ANTHROPIC_MODEL_VELOCE") || "claude-haiku-4-5-20251001";

const TIPI = ["servizi", "prodotti_fisici", "prodotti_digitali", "mix"];

const SYSTEM = `Ricevi la descrizione che un professionista ha dato del suo lavoro. Restituisci solo un JSON, senza altro testo, con le parole che il form deve usare al posto di quelle generiche.

Output:
{
  "cliente": "come chiama chi compra, al singolare (es. cliente, paziente, allievo)",
  "clienti": "lo stesso, al plurale",
  "cosa_vende": "come chiama quello che vende, al singolare (es. seduta, trattamento, consulenza, pezzo, corso)",
  "cosa_vende_plurale": "lo stesso, al plurale",
  "esempio_listino": "un esempio di listino nello stile: seduta singola 70 €, pacchetto da 5 sedute 300 €"
}

Regole:
- Usa le parole che lui usa con i suoi clienti, non parole di marketing.
- Per chi compra preferisci parole che restano uguali al maschile e al femminile, come cliente o paziente. Se servono altre parole, usa il maschile, così le frasi del form restano corrette.
- Se il mestiere non è chiaro, restituisci "cliente", "clienti" e "servizio" o "prodotto".
- Nell'esempio di listino usa cifre normali per quel mestiere in Italia. Serve solo a mostrare il formato della risposta, non a suggerire un prezzo.
- Niente parole inglesi quando esiste quella italiana.
- Tutto minuscolo, senza punto finale.`;

Deno.serve(async (req: Request) => {
  const pre = preflight(req);
  if (pre) return pre;
  try {
    const c = await richiediUtente(req);
    if (c.rol !== "cliente") throw new HttpError(403, "Riservato ai clienti.");
    const body = await leggiBody<Body>(req);
    const attivita = typeof body.attivita_breve === "string" ? body.attivita_breve.trim().slice(0, 600) : "";
    const tipo = typeof body.tipo === "string" && TIPI.includes(body.tipo) ? body.tipo : "";
    const tipoPrincipale = typeof body.tipo_principale === "string" && TIPI.includes(body.tipo_principale) ? body.tipo_principale : "";
    if (!attivita || !tipo) throw new HttpError(400, "Serve la descrizione dell'attività e cosa vende.");

    const admin = adminClient();
    const { data: permesso, error: errLimite } = await admin.rpc("aura_help_allowed", { p_user: c.id, p_max: 20, p_window_secs: 3600, p_scope: "onboarding" });
    if (errLimite) await logError("onboarding-parole:rate_limit", errLimite, { user: c.id }, { silent: true });
    else if (permesso === false) throw new HttpError(429, "Troppe richieste: riprova tra un'ora.");

    const input = `Input:\n- attivita_breve: ${attivita}\n- tipo: ${tipo}  (servizi, prodotti_fisici, prodotti_digitali, mix)\n- tipo_principale: ${tipo === "mix" ? tipoPrincipale || "non indicato" : "(non serve: tipo diverso da mix)"}`;
    const testo = await streamAnthropicText({ system: SYSTEM, user: input, maxTokens: 400, tag: "onboarding-parole", model: MODELLO_VELOCE, utente: c.id });
    const grezzo = testo ? estraiOggetto(testo) : null;
    if (!grezzo) {
      await logError("onboarding-parole:anthropic", "Nessun JSON dal modello", { user: c.id, estratto: (testo ?? "").slice(0, 200) }, { silent: true });
      throw new HttpError(503, "Aura non ha risposto: il form usa le parole standard.");
    }
    // Normalizzazione: le parole standard riempiono i buchi; il ramo lo deduce dalle risposte salvate.
    const ramo = tipo === "mix" ? tipoPrincipale : tipo;
    const parole: Parole = paroleDaJson(grezzo, { tipo: tipo, tipo_principale: ramo });

    const { error } = await admin
      .from("data_onboarding")
      .update({ parole })
      .eq("id", c.id)
      .in("stato", ["bozza", "chiarimenti", "riepilogo"]);
    if (error) await logError("onboarding-parole:salva", error, { user: c.id }, { silent: true });
    return json({ ok: true, parole });
  } catch (err) {
    return gestisciErrore(err);
  }
});
