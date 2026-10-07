import { BLOCCHI, DOMANDE, domandaPerId as domandaPerIdCondivisa, TITOLO_SCHEDA } from "@onboarding/definizione.ts";
import type { Blocco, Domanda } from "./types";

/** Come la scheda si presenta nell'area cliente (card d'ingresso e intestazioni). */
export interface Scheda {
  /** Rotta sotto /area. */
  slug: string;
  titolo: string;
  occhiello: string;
  sottotitolo: string;
  icona: string;
  definizione: Blocco[];
}

/** L'unica scheda del cliente: l'onboarding v3 (documenti di Wesley del 02/10/2026). */
export const SCHEDA_ONBOARDING: Scheda = {
  slug: "onboarding",
  titolo: TITOLO_SCHEDA,
  occhiello: "La tua scheda",
  sottotitolo: "Raccontaci il tuo lavoro così com'è oggi: Aura lo legge con te e Wesley arriva alla prima call sapendo già da dove partire.",
  icona: "📋",
  definizione: BLOCCHI,
};

/** Tutte le versioni di tutte le domande, in ordine. */
export const DOMANDE_ONBOARDING: Domanda[] = DOMANDE;

export function domandaPerId(id: string): Domanda | undefined {
  return domandaPerIdCondivisa(id);
}
