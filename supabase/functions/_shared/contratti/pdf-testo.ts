/**
 * Le fondamenta del PDF scritto a mano: font standard (Times), codifica del
 * testo in WinAnsi, larghezze dei glifi e le piccole primitive con cui `pdf.ts`
 * compone il flusso. Diviso da `pdf.ts` solo per tenere i file corti.
 */

import { LARGHEZZE_TIMES_BOLD, LARGHEZZE_TIMES_ITALIC, LARGHEZZE_TIMES_ROMAN, WINANSI_ALTI } from "./pdf-metriche.ts";

export type Stile = "normale" | "grassetto" | "corsivo";

export const FONT: Record<Stile, { id: string; base: string; larghezze: readonly number[] }> = {
  normale: { id: "F1", base: "Times-Roman", larghezze: LARGHEZZE_TIMES_ROMAN },
  grassetto: { id: "F2", base: "Times-Bold", larghezze: LARGHEZZE_TIMES_BOLD },
  corsivo: { id: "F3", base: "Times-Italic", larghezze: LARGHEZZE_TIMES_ITALIC },
};

/** A4 in punti tipografici. */
export const PAGINA = { larghezza: 595.28, altezza: 841.89 };
export const MARGINE = { sx: 64, dx: 64, alto: 66, basso: 70 };
export const LARGHEZZA_TESTO = PAGINA.larghezza - MARGINE.sx - MARGINE.dx;

/* ---------- Codifica del testo ---------- */

/** Lettere fuori da WinAnsi che non si scompongono da sole. */
const TRASLITTERA: Record<string, string> = {
  ł: "l", Ł: "L", đ: "d", Đ: "D", ı: "i", ħ: "h", Ħ: "H", "−": "-", "‐": "-", "‑": "-",
  "′": "'", "″": '"', " ": " ", " ": " ", " ": " ", "​": "",
};

/**
 * Testo → codici WinAnsi (la codifica dei font standard PDF). L'italiano ci sta
 * tutto, comprese «», € e le lineette. Una lettera che non esiste (es. «ș»)
 * perde il segno diacritico; un simbolo impossibile diventa «?».
 */
export function codifica(testo: string): number[] {
  const out: number[] = [];
  for (const ch of testo) {
    const cp = ch.codePointAt(0) ?? 63;
    if (cp >= 32 && cp <= 126) out.push(cp);
    else if (cp === 0xa0) out.push(32);
    else if (cp === 0xad) continue;
    else if (cp > 0xa0 && cp <= 0xff) out.push(cp);
    else if (WINANSI_ALTI[cp] !== undefined) out.push(WINANSI_ALTI[cp]);
    else if (cp === 9 || cp === 10 || cp === 13) out.push(32);
    else if (TRASLITTERA[ch] !== undefined) out.push(...codifica(TRASLITTERA[ch]));
    else {
      const base = ch.normalize("NFD").replace(/[̀-ͯ]/g, "");
      if (base && base !== ch) out.push(...codifica(base));
      else out.push(63);
    }
  }
  return out;
}

export function larghezzaCodici(codici: number[], stile: Stile, corpo: number): number {
  const tab = FONT[stile].larghezze;
  let somma = 0;
  for (const c of codici) somma += tab[c - 32] ?? 0;
  return (somma * corpo) / 1000;
}

/** Larghezza in punti di un testo, in un dato stile e corpo. */
export function larghezza(testo: string, stile: Stile, corpo: number): number {
  return larghezzaCodici(codifica(testo), stile, corpo);
}

/** Stringa letterale PDF: parentesi e barre con la barra davanti, il resto in ottale se non è ASCII. */
export function letterale(codici: number[]): string {
  let s = "(";
  for (const c of codici) {
    if (c === 40 || c === 41 || c === 92) s += "\\" + String.fromCharCode(c);
    else if (c < 127) s += String.fromCharCode(c);
    else s += "\\" + c.toString(8).padStart(3, "0");
  }
  return s + ")";
}

/** Stringa per i metadati (titolo, autore): UTF-16BE in esadecimale, regge ogni carattere. */
export function metadato(testo: string): string {
  let hex = "FEFF";
  for (let i = 0; i < testo.length; i++) hex += testo.charCodeAt(i).toString(16).padStart(4, "0").toUpperCase();
  return `<${hex}>`;
}

/** Numero per il flusso PDF: al massimo 2 decimali, senza zeri inutili. */
export function n(v: number): string {
  const s = v.toFixed(2);
  return s.replace(/\.?0+$/, "") || "0";
}


/* ---------- Dal testo agli atomi (pezzi di parola con stile e larghezza) ---------- */

export interface Tratto {
  testo: string;
  stile?: Stile;
}

export interface Atomo {
  codici: number[];
  stile: Stile;
  larghezza: number;
  /** C'è uno spazio (quindi un possibile a capo) prima di questo pezzo. */
  spazioPrima: boolean;
}

/** Spezza un pezzo troppo largo in più pezzi che stanno ciascuno nella riga. */
export function spezza(a: Atomo, max: number, corpo: number): Atomo[] {
  const out: Atomo[] = [];
  let codici: number[] = [];
  for (const c of a.codici) {
    if (codici.length > 0 && larghezzaCodici([...codici, c], a.stile, corpo) > max) {
      out.push({
        codici,
        stile: a.stile,
        larghezza: larghezzaCodici(codici, a.stile, corpo),
        spazioPrima: out.length === 0 ? a.spazioPrima : true,
      });
      codici = [];
    }
    codici.push(c);
  }
  out.push({
    codici,
    stile: a.stile,
    larghezza: larghezzaCodici(codici, a.stile, corpo),
    spazioPrima: out.length === 0 ? a.spazioPrima : true,
  });
  return out;
}

/** Spezza i tratti in atomi: un atomo è un pezzo senza spazi, con il suo stile e la sua larghezza. */
export function atomi(tratti: Tratto[], corpo: number): Atomo[] {
  const out: Atomo[] = [];
  let spazioInSospeso = false;
  for (const t of tratti) {
    const stile = t.stile ?? "normale";
    const pezzi = t.testo.split(/(\s+)/);
    for (const pezzo of pezzi) {
      if (pezzo === "") continue;
      if (/^\s+$/.test(pezzo)) {
        spazioInSospeso = true;
        continue;
      }
      const codici = codifica(pezzo);
      out.push({
        codici,
        stile,
        larghezza: larghezzaCodici(codici, stile, corpo),
        spazioPrima: spazioInSospeso && out.length > 0,
      });
      spazioInSospeso = false;
    }
  }
  return out;
}

