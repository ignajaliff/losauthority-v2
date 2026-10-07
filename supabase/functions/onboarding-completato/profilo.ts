/**
 * Parte DETERMINISTICA del profilo cliente (portata dal sistema precedente):
 * legge la riga di data_onboarding v3 e calcola le ore operative settimanali
 * (dalle fasce di `ore_per_attivita`) e i punteggi di profilo.
 */
import { ATTIVITA_OPERATIVE, ORE_FASCIA } from "../_shared/onboarding/blocco-d-g.ts";

export type ProfiloPrevalente = "invisibile" | "non_converte" | "saturo" | "ia_curioso";

export type RigaOnboarding = Record<string, unknown>;

export interface RisultatoProfilo {
  /** Profilo con punteggio più alto (null se nessun criterio deterministico scatta). */
  profilo: ProfiloPrevalente | null;
  oreOperative: number;
  punteggi: Record<ProfiloPrevalente, number>;
}

/** Ore medie dichiarate per un'attività (fascia → ore medie); 0 se assente. */
function oreAttivita(fasce: Record<string, unknown>, attivita: string): number {
  const f = fasce[attivita];
  return typeof f === "string" ? (ORE_FASCIA[f] ?? 0) : 0;
}

export function calcolaProfilo(riga: RigaOnboarding): RisultatoProfilo {
  const punteggi: Record<ProfiloPrevalente, number> = {
    invisibile: 0,
    non_converte: 0,
    saturo: 0,
    ia_curioso: 0,
  };

  const fasce = riga.ore_per_attivita && typeof riga.ore_per_attivita === "object" ? (riga.ore_per_attivita as Record<string, unknown>) : {};
  const oreOperative = Math.round(ATTIVITA_OPERATIVE.reduce((somma, id) => somma + oreAttivita(fasce, id), 0));

  // SATURO — regole deterministiche del vecchio pipeline (soglie sulle ore dei contenuti).
  if (oreOperative >= 10) punteggi.saturo += 2;
  if (oreAttivita(fasce, "montare") >= 3) punteggi.saturo += 1;

  let profilo: ProfiloPrevalente | null = null;
  let massimo = 0;
  for (const chiave of Object.keys(punteggi) as ProfiloPrevalente[]) {
    if (punteggi[chiave] > massimo) {
      massimo = punteggi[chiave];
      profilo = chiave;
    }
  }
  return { profilo, oreOperative, punteggi };
}
