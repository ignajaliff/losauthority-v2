/**
 * aura-help — aiuto contestuale di Aura mentre il cliente compila la scheda onboarding.
 * Body: { domanda, domanda_id } → { ok, risposta }.
 * Rate limit: public.aura_help_allowed(user, 20, 3600) (wrapper, solo service_role). Aura NON risponde al
 * posto del cliente: spiega la domanda e lo aiuta a formulare la SUA risposta.
 */
import { gestisciErrore, HttpError, json, leggiBody, preflight } from "../_shared/http.ts";
import { adminClient, richiediUtente } from "../_shared/supabase.ts";
import { streamAnthropicText } from "../_shared/anthropic.ts";
import { logError } from "../_shared/log.ts";
import { DOMANDE, testoDomanda, TITOLO_SCHEDA } from "../_shared/domande.ts";
import { leggiRisposteAncheBozza } from "../_shared/materiale.ts";

type Body = {
  domanda?: unknown;
  domanda_id?: unknown;
}

const MAX_DOMANDA = 2000;
const MAX_RISPOSTE_CONTESTO = 12;

const SYSTEM = `Sei Aura, l'assistente AI di Los Authority (il metodo di Wesley Caicedo). Stai aiutando un cliente MENTRE compila un questionario sul suo business. Il tuo compito è rendergli facile rispondere.

Quando ti scrive:
- Spieghi con parole semplici cosa chiede DAVVERO la domanda.
- Fai 1 esempio concreto, possibilmente tarato sul suo settore (se lo intuisci da ciò che ha già scritto).
- Lo aiuti a formulare o a migliorare la SUA risposta partendo dalla SUA situazione: fai domande guida, suggerisci una struttura.
- Lo rassicuri: non servono risposte perfette, solo vere.

Regole:
- Italiano, dai del "tu", tono caldo, diretto e pratico. Mai burocratico.
- Risposte BREVI: 2-5 frasi, niente muri di testo. Vai al punto.
- NON rispondere al posto del cliente e NON inventare dati su di lui: se ti manca un'informazione, chiediglielo.
- Resta sul tema del questionario e della sua attività. Se chiede altro, riportalo gentilmente al punto.
- Non promettere risultati e non dare consigli legali/medici/finanziari.`;

/** Contesto per il modello: la domanda, cosa ha già scritto lì e le altre risposte date finora. */
function contesto(domandaId: string, risposte: Map<string, string[]>): string {
  const righe: string[] = ["---", "CONTESTO (non mostrato al cliente — usalo per aiutarlo meglio):"];
  righe.push(`Scheda: ${TITOLO_SCHEDA}`);
  const testo = testoDomanda(domandaId);
  righe.push(`Domanda su cui chiede aiuto: ${testo ?? (domandaId || "—")}`);
  const attuale = risposte.get(domandaId);
  if (attuale && attuale.length > 0) {
    righe.push(`Cosa ha già scritto per questa domanda: ${attuale.join(" · ").slice(0, 600)}`);
  }
  const altre = [...risposte.entries()]
    .filter(([id, v]) => id !== domandaId && v.join("").trim().length > 0)
    .slice(0, MAX_RISPOSTE_CONTESTO)
    .map(([id, v]) => `• ${DOMANDE[id] ?? id}\n   → ${v.join(" · ").slice(0, 300)}`);
  if (altre.length > 0) righe.push("", "Altre risposte già date nella scheda:", ...altre);
  return righe.join("\n");
}

Deno.serve(async (req: Request) => {
  const pre = preflight(req);
  if (pre) return pre;
  try {
    const c = await richiediUtente(req);
    if (c.rol !== "cliente") throw new HttpError(403, "L'aiuto di Aura è riservato ai clienti.");
    const body = await leggiBody<Body>(req);
    const domanda = typeof body.domanda === "string" ? body.domanda.trim().slice(0, MAX_DOMANDA) : "";
    if (!domanda) throw new HttpError(400, "Scrivi la tua domanda per Aura.");
    const domandaId = typeof body.domanda_id === "string" ? body.domanda_id.trim().slice(0, 80) : "";

    // Rate limit per utente: wrapper public.aura_help_allowed (EXECUTE solo service_role).
    const admin = adminClient();
    const { data: permesso, error: errLimite } = await admin
      .rpc("aura_help_allowed", { p_user: c.id, p_max: 20, p_window_secs: 3600 });
    if (errLimite) {
      await logError("aura-help:rate_limit", errLimite, { user: c.id }, { silent: true });
    } else if (permesso === false) {
      throw new HttpError(429, "Hai fatto molte domande: riprova tra un'ora.");
    }

    const risposte = await leggiRisposteAncheBozza(admin, c.id);
    const risposta = await streamAnthropicText({
      system: SYSTEM,
      user: `${domanda}\n\n${contesto(domandaId, risposte)}`,
      maxTokens: 400,
      tag: "aura-help",
      utente: c.id,
    });
    if (!risposta) {
      await logError("aura-help:anthropic", "Nessuna risposta da Aura", { user: c.id, domandaId }, { silent: true });
      throw new HttpError(503, "Aura non riesce a rispondere in questo momento. Rispondi pure con parole tue: va benissimo.");
    }
    return json({ ok: true, risposta });
  } catch (err) {
    return gestisciErrore(err);
  }
});
