import type { Tables } from "@/integrations/supabase/types";

/** Pipeline del Workflow: l'ordine delle chiavi è l'ordine delle colonne. */
export const STATO_CONTENUTO_KEYS = ["fase_script", "da_registrare", "da_editare", "pronto_upload", "pubblicato"] as const;
export type StatoContenuto = (typeof STATO_CONTENUTO_KEYS)[number];

export const ETICHETTA_STATO_CONTENUTO: Record<StatoContenuto, string> = {
  fase_script: "Fase script",
  da_registrare: "Da registrare",
  da_editare: "Da editare",
  pronto_upload: "Pronti per l'upload",
  pubblicato: "Pubblicato",
};

/**
 * Colore minimo per fase (solo token del design system): grigio per l'idea,
 * poi ocra → argilla → inchiostro → salvia quando è pubblicato.
 */
export const COLORE_STATO_CONTENUTO: Record<StatoContenuto, { punto: string; bordo: string }> = {
  fase_script: { punto: "bg-muted-foreground/60", bordo: "border-t-muted-foreground/40" },
  da_registrare: { punto: "bg-status-expiring", bordo: "border-t-status-expiring" },
  da_editare: { punto: "bg-status-churn", bordo: "border-t-status-churn" },
  pronto_upload: { punto: "bg-foreground", bordo: "border-t-foreground" },
  pubblicato: { punto: "bg-status-active", bordo: "border-t-status-active" },
};

export const TIPOLOGIA_CONTENUTO_KEYS =["virale", "consolidazione", "vendita", "content_series"] as const;
export type TipologiaContenuto = (typeof TIPOLOGIA_CONTENUTO_KEYS)[number];

type TonoBadge = "active" | "expiring" | "churn" | "neutral" | "outline";

export const TIPOLOGIE_CONTENUTO: Record<TipologiaContenuto, { label: string; tono: TonoBadge }> = {
  virale: { label: "Contenuto virale", tono: "expiring" },
  consolidazione: { label: "Contenuto di consolidazione", tono: "neutral" },
  vendita: { label: "Contenuto di vendita", tono: "active" },
  content_series: { label: "Content series", tono: "outline" },
};

export type Contenuto = Tables<"contenuti">;

/** Campi che il form scrive (il resto lo mettono la base e gli hook). */
export type ContenutoDati = Pick<
  Contenuto,
  "titolo" | "stato" | "tipologia" | "pubblicazione_prevista" | "pubblicato_il" | "drive_url" | "note" | "script" | "riferimenti"
>;

export function eStatoContenuto(valore: string): valore is StatoContenuto {
  return (STATO_CONTENUTO_KEYS as ReadonlyArray<string>).includes(valore);
}

export function eTipologiaContenuto(valore: string | null): valore is TipologiaContenuto {
  return valore !== null && (TIPOLOGIA_CONTENUTO_KEYS as ReadonlyArray<string>).includes(valore);
}
