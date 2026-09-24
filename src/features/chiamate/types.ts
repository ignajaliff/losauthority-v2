import type { Tables } from "@/integrations/supabase/types";

/** Call registrata (Fathom) del cliente. */
export type Chiamata = Tables<"chiamate">;

/** Action item di una call. */
export type ChiamataAzione = Tables<"chiamate_azioni">;

/** Opzione minima per scegliere il cliente a cui assegnare una call. */
export interface ClienteOpzione {
  id: string;
  nombre: string;
}

/** Numeri delle call del percorso (board Notion "Compiti per call n°X"). */
export const CALL_NUMERI = [1, 2, 3, 4] as const;
export type CallNumero = (typeof CALL_NUMERI)[number];

/** Fasi del cliente (colonna `clienti.fase`). */
const FASE_A_CALL: Record<string, CallNumero> = {
  onboarding: 1,
  call_1: 2,
  call_2: 3,
  call_3: 4,
  call_4: 4,
  completato: 4,
};

/**
 * Call di destinazione suggerita per "Genera compiti con Aura":
 * la fase attuale del cliente + 1 quando possibile (in `call_1` → compiti per la call 2).
 */
export function callSuggeritaDaFase(fase: string | null | undefined): CallNumero {
  return (fase && FASE_A_CALL[fase]) || 1;
}

/** Risposta delle Edge Functions usate dal dominio. */
export interface RispostaRiassunto {
  riassunto: string;
}
export interface RispostaCompiti {
  scritti: number;
  totale: number;
}
