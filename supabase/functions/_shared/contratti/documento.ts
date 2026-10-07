/**
 * Il testo del contratto come lista di blocchi: una sola forma per la pagina,
 * per il PDF e per l'impronta (hash) di ciò che il cliente ha firmato.
 */

import type { Blocco, DocumentoContratto } from "./tipi.ts";

/**
 * Trasforma un testo scritto riga per riga in blocchi:
 *   `# `  titolo            `## `  sezione          `### ` articolo
 *   `= `  riga centrata     `- `   voce di elenco   `> `   nota in piccolo
 *   `---` salto pagina      ogni altra riga non vuota è un paragrafo.
 */
export function blocchi(testo: string): Blocco[] {
  const out: Blocco[] = [];
  for (const grezza of testo.split("\n")) {
    const riga = grezza.trim();
    if (!riga) continue;
    if (riga === "---") out.push({ t: "pagina" });
    else if (riga.startsWith("### ")) out.push({ t: "articolo", testo: riga.slice(4) });
    else if (riga.startsWith("## ")) out.push({ t: "sezione", testo: riga.slice(3) });
    else if (riga.startsWith("# ")) out.push({ t: "titolo", testo: riga.slice(2) });
    else if (riga.startsWith("= ")) out.push({ t: "centro", testo: riga.slice(2) });
    else if (riga.startsWith("- ")) out.push({ t: "voce", testo: riga.slice(2) });
    else if (riga.startsWith("> ")) out.push({ t: "nota", testo: riga.slice(2) });
    else out.push({ t: "p", testo: riga });
  }
  return out;
}

/** Spezza un testo nei suoi tratti normali e in grassetto (`**così**`). */
export function tratti(testo: string): { testo: string; grassetto: boolean }[] {
  return testo
    .split("**")
    .map((parte, i) => ({ testo: parte, grassetto: i % 2 === 1 }))
    .filter((p) => p.testo.length > 0);
}

/** Toglie i segni del grassetto. */
export function senzaSegni(testo: string): string {
  return testo.split("**").join("");
}

function inChiaro(lista: Blocco[]): string {
  return lista
    .map((b) => (b.t === "pagina" ? "" : senzaSegni(b.testo)))
    .filter(Boolean)
    .join("\n");
}

/**
 * Il testo integrale in chiaro: è su QUESTO che si calcola l'impronta SHA-256
 * salvata alla firma. Chiunque può rifare il conto partendo dal contratto.
 */
export function testoInChiaro(doc: DocumentoContratto): string {
  return [
    inChiaro(doc.corpo),
    "Firme",
    doc.firmatario_fornitore,
    doc.firmatario_cliente,
    senzaSegni(doc.approvazione),
    inChiaro(doc.allegati),
  ].join("\n");
}

/** Impronta SHA-256 in esadecimale (Web Crypto: va sia nel Worker sia in Node). */
export async function sha256Hex(dati: string | Uint8Array): Promise<string> {
  const bytes = typeof dati === "string" ? new TextEncoder().encode(dati) : dati;
  const digest = await crypto.subtle.digest("SHA-256", bytes as BufferSource);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/* ---------- Formati italiani usati nel testo ---------- */

/**
 * 1997 → "1.997,00". Fatto a mano e non con Intl: in italiano Intl non mette il
 * punto delle migliaia sotto 10.000 ("1997,00"), e in un contratto si scrive.
 */
export function euroContratto(n: number): string {
  const [intero, decimali] = Math.abs(n).toFixed(2).split(".");
  const conPunti = intero.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `${n < 0 ? "-" : ""}${conPunti},${decimali}`;
}

/** 1997 → "1.997" (se ha centesimi li mostra: 1997.5 → "1.997,50"). */
export function euroBreve(n: number): string {
  const completo = euroContratto(n);
  return completo.endsWith(",00") ? completo.slice(0, -3) : completo;
}

/** "2004-11-15" → "15/11/2004" */
export function dataBreve(iso: string): string {
  const [a, m, g] = iso.slice(0, 10).split("-");
  return `${g}/${m}/${a}`;
}

const MESI = [
  "gennaio", "febbraio", "marzo", "aprile", "maggio", "giugno",
  "luglio", "agosto", "settembre", "ottobre", "novembre", "dicembre",
];

/** "2026-10-01" → "1 ottobre 2026" */
export function dataEstesa(iso: string): string {
  const [a, m, g] = iso.slice(0, 10).split("-").map(Number);
  return `${g} ${MESI[m - 1]} ${a}`;
}

/** Giorno di oggi in Italia (YYYY-MM-DD), qualunque sia il fuso del server. */
export function oggiInItalia(adesso = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Rome",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(adesso);
}

/** Data e ora italiane di un istante, es. "1 ottobre 2026, 14:32:05". */
export function istanteInItalia(iso: string): string {
  const d = new Date(iso);
  const giorno = dataEstesa(oggiInItalia(d));
  const ora = new Intl.DateTimeFormat("it-IT", {
    timeZone: "Europe/Rome",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(d);
  return `${giorno}, ${ora}`;
}
