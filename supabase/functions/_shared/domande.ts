/**
 * Etichette delle domande dell'onboarding per il backend (aura-help): derivate
 * dall'unica definizione in `_shared/onboarding/definizione.ts`. id stabile =
 * nome della colonna in `data_onboarding` → testo della domanda (prima versione).
 */
import { conParole, DOMANDA_PER_ID, paroleDefault, TITOLO_SCHEDA } from "./onboarding/definizione.ts";

export { TITOLO_SCHEDA };

/** id → etichetta con le parole standard (derivato dalla definizione: una sola fonte). */
export const DOMANDE: Record<string, string> = {};
const PAROLE_STANDARD = paroleDefault(null);
for (const d of DOMANDA_PER_ID.values()) DOMANDE[d.id] = conParole(d.testo, PAROLE_STANDARD);

export function testoDomanda(domandaId: string): string | null {
  if (!domandaId) return null;
  return DOMANDE[domandaId] ?? null;
}
