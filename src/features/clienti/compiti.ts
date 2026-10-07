import type { Compito, Tappa } from "./types";

export const eFatto = (c: Pick<Compito, "stato">) => c.stato === "fatto";

/** Dalla lista piatta (già ordinata per ordine, created_at) alle tappe con i loro sotto-compiti. */
export function raggruppaTappe(compiti: Compito[]): Tappa[] {
  return compiti.filter((c) => c.padre_id === null).map((t) => ({ ...t, figli: compiti.filter((f) => f.padre_id === t.id) }));
}

/** Quanti passi sono fatti su quanti: i sotto-compiti se ci sono, altrimenti la tappa stessa. */
export function avanzamento(t: Tappa): { fatti: number; totale: number } {
  if (t.figli.length === 0) return { fatti: eFatto(t) ? 1 : 0, totale: 1 };
  return { fatti: t.figli.filter(eFatto).length, totale: t.figli.length };
}

/** La tappa "di oggi": la prima non completata (l'ultima se sono tutte fatte, 0 se non ce ne sono). */
export function indiceTappaCorrente(tappe: Tappa[]): number {
  const i = tappe.findIndex((t) => !eFatto(t));
  return i === -1 ? Math.max(tappe.length - 1, 0) : i;
}
