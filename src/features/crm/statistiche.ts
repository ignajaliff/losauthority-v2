import { format, subDays, subMonths } from "date-fns";
import { FONTI_LEAD, type FonteLead, type LeadCrm } from "./types";

/** Periodi del riepilogo: i contatti arrivati in quel periodo. */
export const PERIODI_CRM = ["30g", "3m", "12m", "sempre"] as const;
export type PeriodoCrm = (typeof PERIODI_CRM)[number];

export const ETICHETTA_PERIODO_CRM: Record<PeriodoCrm, string> = {
  "30g": "Ultimi 30 giorni",
  "3m": "Ultimi 3 mesi",
  "12m": "Ultimi 12 mesi",
  sempre: "Da sempre",
};

export interface NumeriCanale {
  arrivati: number;
  chiusi: number;
  /** chiusi / arrivati in % (null se non è arrivato nessuno). */
  percentuale: number | null;
  /** Somma dei valori delle vendite chiuse. */
  valore: number;
}

export interface RiepilogoCrm {
  totale: NumeriCanale;
  /** Solo i canali con almeno un contatto nel periodo, dal più frequente. */
  perCanale: Array<{ canale: FonteLead; numeri: NumeriCanale }>;
}

/** Primo giorno (YYYY-MM-DD) del periodo, o null per «da sempre». */
export function inizioPeriodo(periodo: PeriodoCrm, oggi: Date): string | null {
  if (periodo === "sempre") return null;
  const inizio = periodo === "30g" ? subDays(oggi, 29) : subMonths(oggi, periodo === "3m" ? 3 : 12);
  return format(inizio, "yyyy-MM-dd");
}

function numeri(contatti: LeadCrm[]): NumeriCanale {
  const chiusi = contatti.filter((c) => c.stato === "chiuso");
  return {
    arrivati: contatti.length,
    chiusi: chiusi.length,
    percentuale: contatti.length > 0 ? Math.round((chiusi.length / contatti.length) * 100) : null,
    valore: chiusi.reduce((somma, c) => somma + (Number(c.valore) || 0), 0),
  };
}

/** Quanti contatti sono arrivati nel periodo, quanti di questi sono chiusi e la percentuale, per canale. */
export function riepilogoCrm(contatti: LeadCrm[], periodo: PeriodoCrm, oggi: Date): RiepilogoCrm {
  const dal = inizioPeriodo(periodo, oggi);
  const nelPeriodo = dal === null ? contatti : contatti.filter((c) => c.arrivato_il >= dal);
  const perCanale = FONTI_LEAD.map((canale) => ({ canale, numeri: numeri(nelPeriodo.filter((c) => c.fonte === canale)) }))
    .filter((r) => r.numeri.arrivati > 0)
    .sort((a, b) => b.numeri.arrivati - a.numeri.arrivati);
  return { totale: numeri(nelPeriodo), perCanale };
}
