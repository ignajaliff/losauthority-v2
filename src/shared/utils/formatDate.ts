import { format, formatDistanceToNowStrict, isValid, parseISO } from "date-fns";
import { it } from "date-fns/locale";

function toDate(value: string | Date | null | undefined): Date | null {
  if (!value) return null;
  const d = typeof value === "string" ? parseISO(value) : value;
  return isValid(d) ? d : null;
}

/** 24/09/2026 */
export function formatDate(value: string | Date | null | undefined): string {
  const d = toDate(value);
  return d ? format(d, "dd/MM/yyyy", { locale: it }) : "—";
}

/** 24 set 2026 */
export function formatDateShort(value: string | Date | null | undefined): string {
  const d = toDate(value);
  return d ? format(d, "d MMM yyyy", { locale: it }) : "—";
}

/** gio 24 set · 10:00 */
export function formatDateTime(value: string | Date | null | undefined): string {
  const d = toDate(value);
  return d ? format(d, "EEE d MMM · HH:mm", { locale: it }) : "—";
}

/** "tra 3 giorni" / "2 ore fa" */
export function formatRelative(value: string | Date | null | undefined): string {
  const d = toDate(value);
  return d ? formatDistanceToNowStrict(d, { locale: it, addSuffix: true }) : "—";
}

/** Data ISO (YYYY-MM-DD) di oggi, per default dei form. */
export function todayIso(): string {
  return format(new Date(), "yyyy-MM-dd");
}
