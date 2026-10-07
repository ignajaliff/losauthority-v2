/**
 * I dati del Fornitore così come compaiono nei contratti e nell'informativa.
 * Se cambiano (sede, PEC…) si cambiano QUI e si aggiorna la versione dei testi.
 */

import type { Indirizzo } from "./tipi.ts";

export const FORNITORE = {
  nome: "Wesley Josuè Caicedo Luque",
  sede: "via Alfredo Soffredini 65, 20126 Milano (MI)",
  partitaIva: "03705400129",
  codiceFiscale: "CCDWLY93M29Z605A",
  pec: "losamigosyt@pec.it",
  email: "caicedodigital@gmail.com",
  sito: "wesleycaicedo.com",
  /** Luogo scritto accanto alla data nelle firme. */
  luogo: "Milano",
} as const;

/** "via Roma 1, 20100 Milano (MI)" */
export function indirizzoInRiga(i: Indirizzo): string {
  return `${i.via}, ${i.cap} ${i.citta} (${i.provincia})`;
}
