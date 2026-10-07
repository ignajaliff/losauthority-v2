import type { DocumentiCrm } from "./hooks/useAccessoCrm";
import type { DocumentoLegale, VersioneCrm } from "./types";

/**
 * La prossima versione già pubblicata ma non ancora efficace (per l'avviso).
 * `corrente` è quella in vigore secondo il database (`crm_stato`), non secondo l'orologio del browser.
 */
export function versioneInArrivo(d: DocumentiCrm, corrente: number | null): VersioneCrm | null {
  return d.versioni.filter((v) => v.versione > (corrente ?? 0)).at(-1) ?? null;
}

export function versione(d: DocumentiCrm, numero: number | null): VersioneCrm | null {
  return numero === null ? null : (d.versioni.find((v) => v.versione === numero) ?? null);
}

/** I tre documenti di una versione, nell'ordine in cui si presentano. */
export function documentiDi(d: DocumentiCrm, v: VersioneCrm): DocumentoLegale[] {
  return [v.termini_id, v.accordo_id, v.informativa_id].map((id) => d.documenti[id]).filter((x): x is DocumentoLegale => !!x);
}
