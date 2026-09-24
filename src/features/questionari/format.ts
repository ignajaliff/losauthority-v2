import type { Domanda, Risposte, ValoreRisposta } from "./types";

function etichetta(domanda: Domanda, valore: string): string {
  return domanda.opzioni?.find((o) => o.value === valore)?.label ?? valore;
}

/** Il valore di una domanda è vuoto? */
export function valoreVuoto(valore: ValoreRisposta | undefined): boolean {
  if (valore === undefined) return true;
  if (typeof valore === "string") return valore.trim() === "";
  return valore.every((v) => v.trim() === "");
}

/** Testo leggibile di una risposta: risolve le etichette di select/multiselect e l'unità dei numeri. */
export function formattaValore(domanda: Domanda, valore: ValoreRisposta | undefined): string {
  if (valoreVuoto(valore)) return "—";
  if (typeof valore === "string") {
    if (domanda.tipo === "select") return etichetta(domanda, valore);
    if (domanda.tipo === "number" && domanda.unita) return `${valore.trim()} ${domanda.unita}`;
    return valore;
  }
  return (valore ?? [])
    .map((v) => v.trim())
    .filter((v) => v !== "")
    .map((v) => (domanda.tipo === "multiselect-text" ? etichetta(domanda, v) : v))
    .join(", ");
}

/** La scheda ha almeno una risposta non vuota? */
export function haRisposte(risposte: Risposte): boolean {
  return Object.values(risposte).some((v) => !valoreVuoto(v));
}

/** Nome proprio del cliente (prima parola del nome completo). */
export function primoNome(nomeCompleto: string | null | undefined): string {
  return (nomeCompleto ?? "").trim().split(/\s+/)[0] ?? "";
}
