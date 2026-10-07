/**
 * Controlli sui singoli campi del modulo del contratto: codice fiscale,
 * partita IVA, pulizia dei testi, email, telefono, profili social. Lógica pura,
 * usata uguale nel browser e sul server (vedi validazione.ts).
 */

/* ---------- Codice fiscale e partita IVA ---------- */

const CF_DISPARI: Record<string, number> = {
  "0": 1, "1": 0, "2": 5, "3": 7, "4": 9, "5": 13, "6": 15, "7": 17, "8": 19, "9": 21,
  A: 1, B: 0, C: 5, D: 7, E: 9, F: 13, G: 15, H: 17, I: 19, J: 21, K: 2, L: 4, M: 18,
  N: 20, O: 11, P: 3, Q: 6, R: 8, S: 12, T: 14, U: 16, V: 10, W: 22, X: 25, Y: 24, Z: 23,
};
/** Omocodia: nelle posizioni numeriche una cifra può essere sostituita da una lettera. */
const OMOCODIA: Record<string, string> = {
  L: "0", M: "1", N: "2", P: "3", Q: "4", R: "5", S: "6", T: "7", U: "8", V: "9",
};
const CF_MESI = "ABCDEHLMPRST";
const CF_FORMA = /^[A-Z]{6}[0-9LMNPQRSTUV]{2}[ABCDEHLMPRST][0-9LMNPQRSTUV]{2}[A-Z][0-9LMNPQRSTUV]{3}[A-Z]$/;

/** Codice fiscale di persona fisica: forma e carattere di controllo. */
export function codiceFiscaleValido(raw: string): boolean {
  const cf = raw.trim().toUpperCase();
  if (!CF_FORMA.test(cf)) return false;
  let somma = 0;
  for (let i = 0; i < 15; i++) {
    const c = cf[i];
    if (i % 2 === 0) somma += CF_DISPARI[c];
    else somma += c >= "0" && c <= "9" ? Number(c) : c.charCodeAt(0) - 65;
  }
  return String.fromCharCode(65 + (somma % 26)) === cf[15];
}

function cifreCf(cf: string, da: number, a: number): number {
  const s = cf
    .slice(da, a)
    .split("")
    .map((c) => OMOCODIA[c] ?? c)
    .join("");
  return Number(s);
}

/** Sesso scritto nel codice fiscale (le donne hanno il giorno aumentato di 40). */
export function sessoDaCodiceFiscale(raw: string): "M" | "F" | null {
  const cf = raw.trim().toUpperCase();
  if (!CF_FORMA.test(cf)) return null;
  return cifreCf(cf, 9, 11) > 40 ? "F" : "M";
}

/** True se anno, mese e giorno del codice fiscale coincidono con la data (YYYY-MM-DD). */
export function codiceFiscaleCoerenteConData(raw: string, dataIso: string): boolean {
  const cf = raw.trim().toUpperCase();
  if (!CF_FORMA.test(cf) || !/^\d{4}-\d{2}-\d{2}$/.test(dataIso)) return false;
  const anno = cifreCf(cf, 6, 8);
  const mese = CF_MESI.indexOf(cf[8]) + 1;
  const giornoCf = cifreCf(cf, 9, 11);
  const giorno = giornoCf > 40 ? giornoCf - 40 : giornoCf;
  return (
    anno === Number(dataIso.slice(2, 4)) &&
    mese === Number(dataIso.slice(5, 7)) &&
    giorno === Number(dataIso.slice(8, 10))
  );
}

/** Partita IVA italiana: 11 cifre con cifra di controllo. */
export function partitaIvaValida(raw: string): boolean {
  const p = raw.replace(/\s+/g, "").replace(/^IT/i, "");
  if (!/^\d{11}$/.test(p)) return false;
  let somma = 0;
  for (let i = 0; i < 10; i++) {
    const n = Number(p[i]);
    if (i % 2 === 0) somma += n;
    else somma += n * 2 > 9 ? n * 2 - 9 : n * 2;
  }
  return (10 - (somma % 10)) % 10 === Number(p[10]);
}

/* ---------- Pulizia dei testi ---------- */

/**
 * Testo libero su una riga: via gli a capo, i doppi spazi e i simboli che nel
 * testo del contratto avrebbero un significato (il grassetto si scrive `**`).
 */
export function pulisci(v: unknown, max = 120): string {
  return String(v ?? "")
    // eslint-disable-next-line no-control-regex
    .replace(/[\x00-\x1f\x7f]/g, " ")
    .replace(/[*_`<>{}\\|]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
}

/** "mario de luca" / "MARIO DE LUCA" → "Mario De Luca". Se è già misto, non lo tocca. */
export function nomeProprio(v: string): string {
  const s = pulisci(v, 80);
  if (!s) return "";
  if (s !== s.toLowerCase() && s !== s.toUpperCase()) return s;
  return s
    .toLowerCase()
    .replace(/(^|[\s'’-])(\p{L})/gu, (_m, sep: string, ch: string) => sep + ch.toUpperCase());
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function emailValida(v: string): boolean {
  return v.length <= 160 && EMAIL.test(v);
}

/** Telefono: tiene il + iniziale e le cifre; ai cellulari italiani senza prefisso aggiunge +39. */
export function normalizzaTelefono(v: unknown): string {
  const s = String(v ?? "").trim();
  const piu = s.startsWith("+") || s.startsWith("00");
  let cifre = s.replace(/\D/g, "");
  if (s.startsWith("00")) cifre = cifre.slice(2);
  if (!cifre) return "";
  if (piu) return "+" + cifre;
  if (/^3\d{8,9}$/.test(cifre)) return "+39" + cifre;
  return cifre;
}

/** Profilo social: accetta URL completo o @nome, restituisce l'URL (o "" se vuoto). */
export function normalizzaSocial(v: unknown, piattaforma: "instagram" | "tiktok"): string {
  const s = String(v ?? "").trim().slice(0, 200);
  if (!s) return "";
  if (/^https?:\/\//i.test(s)) return s.replace(/[\s<>"']/g, "");
  const nome = s.replace(/^@/, "").replace(/^\/+/, "").replace(/[^A-Za-z0-9._]/g, "");
  if (!nome) return "";
  return piattaforma === "instagram"
    ? `https://instagram.com/${nome}`
    : `https://www.tiktok.com/@${nome}`;
}

