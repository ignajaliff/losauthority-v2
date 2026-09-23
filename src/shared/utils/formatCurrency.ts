const formatter = new Intl.NumberFormat("it-IT", {
  style: "currency",
  currency: "EUR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** Formatta un importo in euro (it-IT). Accetta numeric arrivato come stringa. */
export function formatCurrency(valore: number | string | null | undefined): string {
  const n = typeof valore === "string" ? Number(valore) : (valore ?? 0);
  return formatter.format(Number.isFinite(n) ? n : 0);
}

/** Arrotonda a 2 decimali evitando gli errori dei float in JS. */
export function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

/** Somma sicura di importi numeric (stringhe o numeri). */
export function sumImporti(valori: Array<number | string | null | undefined>): number {
  return round2(valori.reduce<number>((acc, v) => acc + (Number(v) || 0), 0));
}
