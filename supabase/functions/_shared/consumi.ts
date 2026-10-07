import { adminClient } from "./supabase.ts";

/** Token di una chiamata ad Anthropic, come li riporta l'evento `usage` dello stream. */
export interface ConsumoAnthropic {
  funzione: string;
  utente: string | null;
  modello: string;
  /** Token di input NON in cache (pagati a prezzo pieno). */
  input: number;
  /** Token letti dalla cache (≈ 10 % del prezzo). */
  cacheLettura: number;
  /** Token scritti in cache in questa chiamata (125 % del prezzo). */
  cacheScrittura: number;
  output: number;
}

/**
 * Registra il consumo in `aura_consumi` e lo stampa nei log della funzione.
 * Si attende (niente lavoro dopo la risposta HTTP) ma non lancia mai: un errore
 * qui non deve far fallire una risposta.
 */
export async function registraConsumo(c: ConsumoAnthropic): Promise<void> {
  const totaleInput = c.input + c.cacheLettura + c.cacheScrittura;
  const quotaCache = totaleInput > 0 ? Math.round((c.cacheLettura / totaleInput) * 100) : 0;
  console.log(`[${c.funzione}] token: input ${c.input} · cache letta ${c.cacheLettura} (${quotaCache} %) · cache scritta ${c.cacheScrittura} · output ${c.output}`);
  if (totaleInput === 0 && c.output === 0) return;
  try {
    const { error } = await adminClient().from("aura_consumi").insert({
      funzione: c.funzione,
      user_id: c.utente,
      modello: c.modello,
      input_tokens: c.input,
      cache_lettura_tokens: c.cacheLettura,
      cache_scrittura_tokens: c.cacheScrittura,
      output_tokens: c.output,
    });
    if (error) console.error(`[${c.funzione}] aura_consumi:`, error.message);
  } catch (err) {
    console.error(`[${c.funzione}] aura_consumi:`, err);
  }
}
