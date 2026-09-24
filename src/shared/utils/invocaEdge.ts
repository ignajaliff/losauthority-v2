import { FunctionsHttpError } from "@supabase/supabase-js";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { logDev, MESSAGGIO_ERRORE_GENERICO } from "./errors";

/** Risposta standard delle Edge Function del progetto (docs/edge-functions.md). */
export type RispostaEdge<T> = ({ ok: true } & T) | { ok: false; error: string };

/** Errore con un messaggio già pensato per l'utente (arriva dalla Edge Function). */
export class ErroreEdge extends Error {
  constructor(messaggio: string) {
    super(messaggio);
    this.name = "ErroreEdge";
  }
  /** Alias: messaggio da mostrare all'utente. */
  get messaggioUtente(): string {
    return this.message;
  }
}

async function messaggioDalContesto(error: unknown): Promise<string | null> {
  if (!(error instanceof FunctionsHttpError)) return null;
  const ctx: unknown = error.context;
  if (!(ctx instanceof Response)) return null;
  try {
    const corpo = (await ctx.json()) as { error?: unknown } | null;
    return corpo && typeof corpo.error === "string" ? corpo.error : null;
  } catch {
    return null;
  }
}

/**
 * Chiama una Edge Function e ritorna sempre `{ ok, ... }` senza lanciare per
 * gli errori "attesi" (4xx/5xx con body `{ ok:false, error }`, es. rate limit).
 * Lancia solo per errori di rete o risposte senza corpo leggibile.
 */
export async function invocaFunzioneSicura<T>(
  nome: string,
  body: Record<string, unknown>,
): Promise<RispostaEdge<T>> {
  const { data, error } = await supabase.functions.invoke<RispostaEdge<T>>(nome, { body });
  if (error) {
    const msg = await messaggioDalContesto(error);
    if (msg) return { ok: false, error: msg };
    throw error;
  }
  if (!data) return { ok: false, error: MESSAGGIO_ERRORE_GENERICO };
  return data;
}

/**
 * Chiama una Edge Function e ritorna il corpo `{ ok: true, ... }`.
 * Se la funzione risponde `{ ok:false, error }` (anche con status 4xx/5xx)
 * lancia un `ErroreEdge` con quel messaggio, da mostrare all'utente.
 */
export async function invocaEdge<T>(nome: string, body: Record<string, unknown>): Promise<{ ok: true } & T> {
  const r = await invocaFunzioneSicura<T>(nome, body);
  if (!r.ok) throw new ErroreEdge(r.error || "Operazione non riuscita.");
  return r;
}

/** Descrizione per il toast: il messaggio della funzione se c'è, altrimenti quello generico. */
export function messaggioErrore(e: unknown): string {
  return e instanceof ErroreEdge ? e.message : MESSAGGIO_ERRORE_GENERICO;
}

/** onError standard per le mutation che chiamano una Edge Function. */
export function erroreMutation(titolo: string) {
  return (error: unknown) => {
    toast.error(titolo, { description: messaggioErrore(error) });
    logDev(error);
  };
}
