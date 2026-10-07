import { format } from "date-fns";
import { it } from "date-fns/locale";
import { formatConteggio } from "@/shared/utils/formatConteggio";

export { formatConteggio };

/** Differenza con la rilevazione precedente: "+320", "−12" o null se non confrontabile. */
export function formatDelta(attuale: number | null, precedente: number | null | undefined): string | null {
  if (attuale === null || precedente === null || precedente === undefined) return null;
  const d = attuale - precedente;
  if (d === 0) return "=";
  return `${d > 0 ? "+" : "−"}${formatConteggio(Math.abs(d))}`;
}

/** "27 set 2026, 09:30" */
export function formatMomento(iso: string): string {
  return format(new Date(iso), "d MMM yyyy, HH:mm", { locale: it });
}

/** Valore per un <input type="datetime-local"> con l'ora locale di adesso. */
export function adessoLocale(): string {
  return format(new Date(), "yyyy-MM-dd'T'HH:mm");
}
