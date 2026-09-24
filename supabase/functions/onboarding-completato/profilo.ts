/**
 * Parte DETERMINISTICA del profilo cliente, portata da src/lib/profile/pipeline.ts
 * del sistema precedente: legge le risposte dell'onboarding (per id di domanda)
 * e calcola le ore operative settimanali e i punteggi di profilo.
 */

export type ProfiloPrevalente = "invisibile" | "non_converte" | "saturo" | "ia_curioso";

export interface RispostaOnboarding {
  domanda_id: string;
  ordine: number;
  valore: string;
}

export interface RisultatoProfilo {
  /** Profilo con punteggio più alto (null se nessun criterio deterministico scatta). */
  profilo: ProfiloPrevalente | null;
  oreOperative: number;
  punteggi: Record<ProfiloPrevalente, number>;
}

/** Ore che entrano nel calcolo del baseline operativo (identico al vecchio schema). */
export const ORE_OPERATIVE_IDS = [
  "ore_idee",
  "ore_scrittura",
  "ore_riprese",
  "ore_editing",
  "ore_pubblicazione",
] as const;

/** Numero dalla risposta testuale (ordine 0); 0 se assente o non numerico. */
function numero(risposte: RispostaOnboarding[], domandaId: string): number {
  const r = risposte.find((x) => x.domanda_id === domandaId && x.ordine === 0) ??
    risposte.find((x) => x.domanda_id === domandaId);
  if (!r) return 0;
  const n = Number(r.valore.replace(",", ".").trim());
  return Number.isFinite(n) && n >= 0 ? Math.floor(n) : 0;
}

export function calcolaProfilo(risposte: RispostaOnboarding[]): RisultatoProfilo {
  const punteggi: Record<ProfiloPrevalente, number> = {
    invisibile: 0,
    non_converte: 0,
    saturo: 0,
    ia_curioso: 0,
  };

  const oreOperative = ORE_OPERATIVE_IDS.reduce((somma, id) => somma + numero(risposte, id), 0);

  // SATURO — regole deterministiche del vecchio pipeline.
  if (oreOperative >= 10) punteggi.saturo += 2;
  if (numero(risposte, "ore_editing") >= 3) punteggi.saturo += 1;

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
