import { conParole, formattaValore as formattaCondiviso, paroleDaJson, paroleDefault } from "@onboarding/definizione.ts";
import { ramoDi } from "@onboarding/tipi.ts";
import type { Domanda, Parole, RigaOnboarding, Risposte, ValoreRisposta } from "./types";

/** Il valore di una domanda è vuoto? */
export function valoreVuoto(valore: ValoreRisposta | undefined): boolean {
  if (valore === undefined) return true;
  if (typeof valore === "string") return valore.trim() === "";
  if (Array.isArray(valore)) return valore.every((v) => v.trim() === "");
  return Object.values(valore).every((v) => v.trim() === "" || v === "0");
}

/** Le parole del mestiere per queste risposte: quelle salvate nella riga, o quelle standard. */
export function paroleDi(risposte: Risposte, riga?: Pick<RigaOnboarding, "parole"> | null): Parole {
  return riga ? paroleDaJson(riga.parole, risposte) : paroleDefault(ramoDi(risposte));
}

/** Testo leggibile di una risposta: etichette dei menu, unità, liste, conteggi. */
export function formattaValore(domanda: Domanda, valore: ValoreRisposta | undefined, parole: Parole): string {
  return formattaCondiviso(domanda, valore, parole);
}

/** La scheda ha almeno una risposta non vuota? */
export function haRisposte(risposte: Risposte): boolean {
  return Object.values(risposte).some((v) => !valoreVuoto(v));
}

/** Nome proprio del cliente (prima parola del nome completo). */
export function primoNome(nomeCompleto: string | null | undefined): string {
  return (nomeCompleto ?? "").trim().split(/\s+/)[0] ?? "";
}

export { conParole };
