import { addDays, addMonths, endOfMonth, format, startOfMonth } from "date-fns";
import { it } from "date-fns/locale";

/** Intervallo del grafico in millisecondi, estremi inclusi. */
export interface Periodo {
  da: number;
  a: number;
}

/** Un mese selezionabile nel filtro: "2026-10" / "ottobre 2026". */
export interface Mese {
  valore: string;
  etichetta: string;
}

/** Gli ultimi `n` mesi fino a quello di `oggi`, dal più recente. */
export function ultimiMesi(oggi: Date, n = 12): Mese[] {
  return Array.from({ length: n }, (_, i) => {
    const d = addMonths(startOfMonth(oggi), -i);
    return { valore: format(d, "yyyy-MM"), etichetta: format(d, "LLLL yyyy", { locale: it }) };
  });
}

/** "2026-08" … "2026-10" → dal primo giorno del primo mese alla fine dell'ultimo (mai oltre adesso). */
export function periodoDaMesi(da: string, a: string, adesso: Date): Periodo {
  const inizio = startOfMonth(new Date(`${da}-01T00:00:00`)).getTime();
  const fine = Math.min(endOfMonth(new Date(`${a}-01T00:00:00`)).getTime(), adesso.getTime());
  return { da: inizio, a: Math.max(fine, inizio) };
}

/** Tacche dell'asse X: ogni settimana su periodi brevi, il 1° e il 15 del mese su quelli lunghi. */
export function tacche(periodo: Periodo): number[] {
  const giorni = (periodo.a - periodo.da) / 86_400_000;
  const out: number[] = [];
  if (giorni <= 45) {
    for (let d = new Date(periodo.da); d.getTime() <= periodo.a; d = addDays(d, 7)) out.push(d.getTime());
    return out;
  }
  for (let m = startOfMonth(new Date(periodo.da)); m.getTime() <= periodo.a; m = addMonths(m, 1)) {
    out.push(m.getTime());
    const meta = addDays(m, 14).getTime();
    if (giorni <= 120 && meta <= periodo.a) out.push(meta);
  }
  return out.filter((t) => t >= periodo.da);
}

/**
 * Dominio di un asse Y nascosto: attorno ai valori, ma largo almeno il 10 %
 * del valore più alto, così una variazione di pochi follower non sembra un salto.
 */
export function dominio(valori: number[]): [number, number] {
  if (valori.length === 0) return [0, 1];
  const min = Math.min(...valori);
  const max = Math.max(...valori);
  const margine = Math.max((max - min) * 0.1, Math.abs(max) * 0.05, 1);
  return [Math.max(0, Math.floor(min - margine)), Math.ceil(max + margine)];
}
