/** Download del PDF dal bucket `f24` e lettura dei versamenti con Claude. */
import { adminClient } from "../_shared/supabase.ts";
import { estraiJson, streamAnthropicText } from "../_shared/anthropic.ts";
import { logError } from "../_shared/log.ts";

export interface Pagamento {
  importo: number | null;
  scadenza: string | null;
  descrizione: string | null;
}

/** Tetto di sicurezza: nessun piano di rateazione reale supera le 24 rate. */
const MAX_RATE = 24;

const SYSTEM =
  "Sei un assistente fiscale italiano. Leggi modelli F24, piani di rateazione e avvisi di pagamento. " +
  "Rispondi SOLO con JSON valido, senza testo attorno e senza blocchi di codice.";

const ISTRUZIONI =
  "Questo documento contiene uno o più modelli F24 (o un piano di rateazione fiscale italiano).\n" +
  "ATTENZIONE: se il pagamento è A RATE, il documento contiene più F24, uno per rata, ognuno con la propria scadenza: restituisci un elemento per OGNI rata/versamento, in ordine di scadenza.\n" +
  "Per ogni versamento estrai:\n" +
  '- "importo": il saldo di QUEL versamento in euro (numero con punto decimale, senza simboli).\n' +
  '- "scadenza": la data entro cui va pagato, formato YYYY-MM-DD. Se non indicata, null.\n' +
  '- "descrizione": breve e utile, es. "IVA 2° trim. 2026 · rata 1/6" o "Contributi INPS giugno" (max 60 caratteri, includi «rata i/N» se è un piano a rate).\n' +
  'Rispondi SOLO con: {"pagamenti": [{"importo": number|null, "scadenza": "YYYY-MM-DD"|null, "descrizione": string|null}, …]}';

/** ArrayBuffer → base64 a blocchi. */
function base64Da(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let bin = "";
  const passo = 0x8000;
  for (let i = 0; i < bytes.length; i += passo) {
    bin += String.fromCharCode(...bytes.subarray(i, i + passo));
  }
  return btoa(bin);
}

/** Path valido: relativo, senza `..`, PDF. */
export function pathValido(v: unknown): v is string {
  return typeof v === "string" && v.length > 0 && v.length <= 300 && !v.includes("..") &&
    !v.startsWith("/") && v.toLowerCase().endsWith(".pdf");
}

function normalizza(obj: Record<string, unknown>): Pagamento {
  const importo = typeof obj.importo === "number" && Number.isFinite(obj.importo) && obj.importo >= 0
    ? Math.round(obj.importo * 100) / 100
    : null;
  const scadenza = typeof obj.scadenza === "string" && /^\d{4}-\d{2}-\d{2}$/.test(obj.scadenza) ? obj.scadenza : null;
  const descrizione = typeof obj.descrizione === "string" && obj.descrizione.trim()
    ? obj.descrizione.trim().slice(0, 80)
    : null;
  return { importo, scadenza, descrizione };
}

/** Scarica il PDF dal bucket `f24`. null se non c'è. */
export async function scaricaPdf(path: string): Promise<string | null> {
  const { data, error } = await adminClient().storage.from("f24").download(path);
  if (error || !data) {
    await logError("f24-estrai:download", error ?? "PDF non trovato nel bucket", { path }, { silent: true });
    return null;
  }
  return base64Da(await data.arrayBuffer());
}

/**
 * Legge i versamenti dal PDF con Claude: un solo F24 o un piano a rate.
 * Ritorna null per QUALSIASI fallimento (mai lancia); il motivo va in error_log.
 */
export async function leggiPagamenti(pdfBase64: string, path: string): Promise<Pagamento[] | null> {
  const raw = await streamAnthropicText({
    system: SYSTEM,
    user: [
      { type: "document", source: { type: "base64", media_type: "application/pdf", data: pdfBase64 } },
      { type: "text", text: ISTRUZIONI },
    ],
    maxTokens: 2000,
    tag: "f24-estrai",
  });
  if (!raw) {
    await logError("f24-estrai:anthropic", "Nessuna risposta dall'AI", { path }, { silent: true });
    return null;
  }
  const obj = estraiJson<Record<string, unknown>>(raw);
  if (!obj || typeof obj !== "object") {
    await logError("f24-estrai:json", "Risposta AI senza JSON", { path, raw: raw.slice(0, 300) }, { silent: true });
    return null;
  }
  const grezzi: unknown[] = Array.isArray(obj.pagamenti) ? obj.pagamenti : [obj];
  const pagamenti = grezzi
    .filter((p): p is Record<string, unknown> => !!p && typeof p === "object")
    .map(normalizza)
    .filter((p) => p.importo != null || p.scadenza != null || p.descrizione != null)
    .slice(0, MAX_RATE);
  if (pagamenti.length === 0) {
    await logError("f24-estrai:vuoto", "Nessun versamento riconosciuto nel PDF", { path }, { silent: true });
    return null;
  }
  return pagamenti;
}

/** Descrizione di ripiego per la rata i (1-based) di N. */
export function descrizioneRata(p: Pagamento, i: number, totale: number): string | null {
  return p.descrizione ?? (totale > 1 ? `F24 · rata ${i}/${totale}` : null);
}
