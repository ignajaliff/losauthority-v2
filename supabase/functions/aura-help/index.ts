/**
 * aura-help — aiuto contestuale di Aura mentre il cliente compila una scheda.
 * Body: { domanda, questionario_id, domanda_id } → { ok, risposta }.
 * Rate limit: public.aura_help_allowed(user, 20, 3600) (wrapper, solo service_role). Aura NON risponde al
 * posto del cliente: spiega la domanda e lo aiuta a formulare la SUA risposta.
 */
import { gestisciErrore, HttpError, json, leggiBody, preflight } from "../_shared/http.ts";
import { adminClient, richiediUtente } from "../_shared/supabase.ts";
import { streamAnthropicText } from "../_shared/anthropic.ts";
import { logError } from "../_shared/log.ts";
import { DOMANDE, eQuestionarioId, type QuestionarioId, testoDomanda, TITOLI } from "../_shared/domande.ts";

type Body = {
  domanda?: unknown;
  questionario_id?: unknown;
  domanda_id?: unknown;
}

interface Risposta {
  domanda_id: string;
  ordine: number;
  valore: string;
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

/** Risposte già scritte dal cliente in questa scheda (bozza o inviata), per contesto. */
async function risposteCliente(clienteId: string, q: QuestionarioId): Promise<Risposta[]> {
  const admin = adminClient();
  const { data: invio } = await admin
    .from("questionario_invii")
    .select("id")
    .eq("cliente_id", clienteId)
    .eq("questionario_id", q)
    .maybeSingle();
  const invioId = (invio as { id: string } | null)?.id;
  if (!invioId) return [];
  const { data } = await admin
    .from("questionario_risposte")
    .select("domanda_id, ordine, valore")
    .eq("invio_id", invioId)
    .order("ordine");
  return (data ?? []) as Risposta[];
}

function contesto(q: QuestionarioId | null, domandaId: string, risposte: Risposta[]): string {
  const righe: string[] = ["---", "CONTESTO (non mostrato al cliente — usalo per aiutarlo meglio):"];
  righe.push(`Scheda: ${q ? TITOLI[q] : "—"}`);
  const testo = testoDomanda(q, domandaId);
  righe.push(`Domanda su cui chiede aiuto: ${testo ?? (domandaId || "—")}`);
  if (q) {
    // Le risposte già date, aggregate per domanda (multi-valore = più righe).
    const perDomanda = new Map<string, string[]>();
    for (const r of risposte) {
      const lista = perDomanda.get(r.domanda_id) ?? [];
      lista.push(r.valore);
      perDomanda.set(r.domanda_id, lista);
    }
    const attuale = perDomanda.get(domandaId);
    if (attuale && attuale.length > 0) {
      righe.push(`Cosa ha già scritto per questa domanda: ${attuale.join(" · ").slice(0, 600)}`);
    }
    const altre = [...perDomanda.entries()]
      .filter(([id, v]) => id !== domandaId && v.join("").trim().length > 0)
      .slice(0, MAX_RISPOSTE_CONTESTO)
      .map(([id, v]) => `• ${DOMANDE[q][id] ?? id}\n   → ${v.join(" · ").slice(0, 300)}`);
    if (altre.length > 0) righe.push("", "Altre risposte già date in questa scheda:", ...altre);
  }
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
    const q: QuestionarioId | null = eQuestionarioId(body.questionario_id) ? body.questionario_id : null;
    const domandaId = typeof body.domanda_id === "string" ? body.domanda_id.trim().slice(0, 80) : "";

    // Rate limit per utente: wrapper public.aura_help_allowed (EXECUTE solo service_role).
    const { data: permesso, error: errLimite } = await adminClient()
      .rpc("aura_help_allowed", { p_user: c.id, p_max: 20, p_window_secs: 3600 });
    if (errLimite) {
      await logError("aura-help:rate_limit", errLimite, { user: c.id }, { silent: true });
    } else if (permesso === false) {
      throw new HttpError(429, "Hai fatto molte domande: riprova tra un'ora.");
    }

    const risposte = q ? await risposteCliente(c.id, q) : [];
    const risposta = await streamAnthropicText({
      system: SYSTEM,
      user: `${domanda}\n\n${contesto(q, domandaId, risposte)}`,
      maxTokens: 400,
      tag: "aura-help",
    });
    if (!risposta) {
      await logError("aura-help:anthropic", "Nessuna risposta da Aura", { user: c.id, q, domandaId }, { silent: true });
      throw new HttpError(503, "Aura non riesce a rispondere in questo momento. Rispondi pure con parole tue: va benissimo.");
    }
    return json({ ok: true, risposta });
  } catch (err) {
    return gestisciErrore(err);
  }
});
