/** 1234 → "1.234", 12.500 → "12,5k", 1.200.000 → "1,2M". Null → "—". */
export function formatConteggio(n: number | null | undefined): string {
  if (n === null || n === undefined) return "—";
  if (n >= 1_000_000) return `${(n / 1_000_000).toLocaleString("it-IT", { maximumFractionDigits: 1 })}M`;
  if (n >= 10_000) return `${(n / 1_000).toLocaleString("it-IT", { maximumFractionDigits: 1 })}k`;
  return n.toLocaleString("it-IT");
}
