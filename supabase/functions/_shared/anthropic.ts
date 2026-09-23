const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY") ?? "";
export const ANTHROPIC_MODEL = Deno.env.get("ANTHROPIC_MODEL") || "claude-sonnet-4-6";
const ANTHROPIC_VERSION = "2023-06-01";
export const HAS_ANTHROPIC = ANTHROPIC_API_KEY.length > 0;

export interface StreamAnthropicOptions {
  system: string;
  /** Testo semplice o blocchi (es. document PDF / image + testo). */
  user: string | Array<Record<string, unknown>>;
  maxTokens: number;
  /** Etichetta per i log. */
  tag: string;
  model?: string;
}

/**
 * Chiama Anthropic in STREAMING e accumula il testo. Ritorna null per QUALSIASI
 * fallimento (chiave assente, rete, non-200, stream interrotto, output vuoto).
 * NON lancia mai: il chiamante decide il fallback.
 */
export async function streamAnthropicText(opts: StreamAnthropicOptions): Promise<string | null> {
  if (!ANTHROPIC_API_KEY) return null;
  let res: Response;
  try {
    res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": ANTHROPIC_VERSION,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: opts.model ?? ANTHROPIC_MODEL,
        max_tokens: opts.maxTokens,
        stream: true,
        system: opts.system,
        messages: [{ role: "user", content: opts.user }],
      }),
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
          }
        } catch {
          /* riga SSE non-JSON */
        }
      }
    }
  } catch (err) {
    console.error(`[${opts.tag}] lettura stream:`, err);
    return null;
  }
  const out = text.trim();
  return out.length > 0 ? out : null;
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
