import { registraConsumo, type ConsumoAnthropic } from "./consumi.ts";

const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY") ?? "";
export const ANTHROPIC_MODEL = Deno.env.get("ANTHROPIC_MODEL") || "claude-sonnet-4-6";
const ANTHROPIC_VERSION = "2023-06-01";
export const HAS_ANTHROPIC = ANTHROPIC_API_KEY.length > 0;

/** Un blocco di contenuto (testo, documento, immagine) come lo vuole l'API Messages. */
export type Blocco = Record<string, unknown>;

/** Blocco di testo semplice. */
export function bloccoTesto(text: string): Blocco {
  return { type: "text", text };
}

/**
 * Blocco di testo che chiude un tratto di prompt da mettere in CACHE: tutto ciò
 * che precede (system compreso) viene riusato nelle chiamate successive se è
 * identico byte per byte. Sotto il minimo del modello (~1024 token) l'API lo
 * ignora senza errori. Massimo 4 blocchi così per richiesta.
 */
export function bloccoCache(text: string): Blocco {
  return { type: "text", text, cache_control: { type: "ephemeral" } };
}

/**
 * Compone il messaggio utente dei chat in tre tratti, dal più stabile al più
 * variabile: `fisso` (metodo, regole: uguale per tutti i clienti), `cliente`
 * (scheda, fotografia: uguale per tutta la conversazione) e `variabile` (carta,
 * storico, messaggio). I primi due chiudono un tratto di cache. Il testo che il
 * modello legge è identico a `[...fisso, ...cliente, ...variabile].join("\n\n")`.
 */
export function blocchiPrompt(fisso: string[], cliente: string[], variabile: string[]): Blocco[] {
  const blocchi: Blocco[] = [];
  const parti = [fisso, cliente, variabile];
  parti.forEach((p, i) => {
    if (p.length === 0) return;
    const testo = (blocchi.length > 0 ? "\n\n" : "") + p.join("\n\n");
    blocchi.push(i < 2 ? bloccoCache(testo) : bloccoTesto(testo));
  });
  return blocchi;
}

export interface StreamAnthropicOptions {
  /** Stringa (messa in cache automaticamente) o blocchi già composti. */
  system: string | Blocco[];
  /** Testo semplice o blocchi (es. document PDF / image + testo, o tratti con cache). */
  user: string | Blocco[];
  maxTokens: number;
  /** Etichetta per i log e per `aura_consumi.funzione`. */
  tag: string;
  model?: string;
  /** Utente per cui si lavora: finisce in `aura_consumi.user_id` (null per i job di sistema). */
  utente?: string | null;
  /** Tempo massimo per tutta la risposta (stream compreso): oltre si interrompe e torna null. Facoltativo. */
  timeoutMs?: number;
}

/**
 * Chiama Anthropic in STREAMING e accumula il testo. Ritorna null per QUALSIASI
 * fallimento (chiave assente, rete, non-200, stream interrotto, output vuoto).
 * NON lancia mai: il chiamante decide il fallback.
 * Prompt caching: il system (se stringa) viene marcato per la cache; i tratti
 * fissi del messaggio utente li marca il chiamante con `bloccoCache`.
 * Il consumo (token normali, letti e scritti in cache, output) si registra in
 * `aura_consumi` senza bloccare la risposta.
 */
export async function streamAnthropicText(opts: StreamAnthropicOptions): Promise<string | null> {
  if (!ANTHROPIC_API_KEY) return null;
  const model = opts.model ?? ANTHROPIC_MODEL;
  const system = typeof opts.system === "string" ? [bloccoCache(opts.system)] : opts.system;
  let res: Response;
  try {
    res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": ANTHROPIC_VERSION,
        "content-type": "application/json",
      },
      signal: opts.timeoutMs ? AbortSignal.timeout(opts.timeoutMs) : undefined,
      // toWellFormed: un'emoji spezzata da un taglio (surrogato spaiato) farebbe rifiutare il JSON all'API.
      body: JSON.stringify(
        {
          model,
          max_tokens: opts.maxTokens,
          stream: true,
          system,
          messages: [{ role: "user", content: opts.user }],
        },
        (_chiave, valore) => (typeof valore === "string" ? valore.toWellFormed() : valore),
      ),
    });
  } catch (err) {
    console.error(`[${opts.tag}] errore rete Anthropic:`, err);
    return null;
  }
  if (!res.ok || !res.body) {
    const errText = await res.text().catch(() => "");
    console.error(`[${opts.tag}] Anthropic`, res.status, errText.slice(0, 300));
    return null;
  }
  const consumo: ConsumoAnthropic = { funzione: opts.tag, utente: opts.utente ?? null, modello: model, input: 0, cacheLettura: 0, cacheScrittura: 0, output: 0 };
  let text = "";
  try {
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";
      for (const line of lines) {
        const t = line.trim();
        if (!t.startsWith("data:")) continue;
        const payload = t.slice(5).trim();
        if (!payload || payload === "[DONE]") continue;
        try {
          const evt = JSON.parse(payload);
          if (evt.type === "content_block_delta" && evt.delta?.type === "text_delta") {
            text += evt.delta.text as string;
          } else if (evt.type === "message_start") {
            leggiUsage(consumo, evt.message?.usage);
          } else if (evt.type === "message_delta") {
            leggiUsage(consumo, evt.usage);
          }
        } catch {
          /* riga SSE non-JSON */
        }
      }
    }
  } catch (err) {
    console.error(`[${opts.tag}] lettura stream:`, err);
    return null;
  } finally {
    await registraConsumo(consumo);
  }
  const out = text.trim();
  return out.length > 0 ? out : null;
}

/** `message_start` porta input e cache; `message_delta` l'output cumulativo. */
function leggiUsage(c: ConsumoAnthropic, u: Record<string, unknown> | undefined): void {
  if (!u) return;
  if (typeof u.input_tokens === "number") c.input = u.input_tokens;
  if (typeof u.cache_read_input_tokens === "number") c.cacheLettura = u.cache_read_input_tokens;
  if (typeof u.cache_creation_input_tokens === "number") c.cacheScrittura = u.cache_creation_input_tokens;
  if (typeof u.output_tokens === "number") c.output = u.output_tokens;
}

/** Estrae il primo oggetto JSON da un testo (tra la prima { e l'ultima }). */
export function estraiJson<T>(testo: string | null): T | null {
  if (!testo) return null;
  const a = testo.indexOf("{");
  const b = testo.lastIndexOf("}");
  if (a === -1 || b === -1 || b <= a) return null;
  try {
    return JSON.parse(testo.slice(a, b + 1)) as T;
  } catch {
    return null;
  }
}
