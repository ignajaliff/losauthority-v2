/**
 * Capitoli con il minutaggio dentro la descrizione di una lezione Skool, es.
 * "00:00 primo contenuto0:09:30 rivoluzionare i format0:27:40 educare…".
 * Lo scraper Apify incolla le righe senza a capo: si tagliano sui tempi.
 * Servono al coach per dire "guarda dal minuto 27:40" (il link Skool non può
 * partire da un minuto preciso) e per salvare il capitolo in coach_messaggi.
 */

export interface Capitolo {
  secondi: number;
  /** Tempo normalizzato: "27:40" oppure "1:12:00". */
  tempo: string;
  titolo: string;
}

const RE_TEMPO = /(?:(\d{1,2}):)?(\d{1,2}):(\d{2})(?!\d)/g;
const RE_SOLO_TEMPO = /^(?:(\d{1,2}):)?(\d{1,2}):(\d{2})$/;

/** "27:40" / "0:27:40" / "1:12:00" → secondi; null se non è un tempo valido. */
export function secondiDa(testo: string): number | null {
  const m = RE_SOLO_TEMPO.exec(testo.trim());
  if (!m) return null;
  const ore = m[1] ? Number(m[1]) : 0;
  const minuti = Number(m[2]);
  const secondi = Number(m[3]);
  if (minuti > 59 || secondi > 59) return null;
  return ore * 3600 + minuti * 60 + secondi;
}

export function formattaTempo(secondi: number): string {
  const h = Math.floor(secondi / 3600);
  const m = Math.floor((secondi % 3600) / 60);
  const s = secondi % 60;
  const ss = String(s).padStart(2, "0");
  return h > 0 ? `${h}:${String(m).padStart(2, "0")}:${ss}` : `${m}:${ss}`;
}

/** I capitoli della descrizione, nell'ordine in cui compaiono (vuoto se non ha minutaggio). */
export function estraiCapitoli(descrizione: string | null): Capitolo[] {
  if (!descrizione) return [];
  const trovati = [...descrizione.matchAll(RE_TEMPO)];
  const capitoli: Capitolo[] = [];
  for (let i = 0; i < trovati.length; i++) {
    const m = trovati[i];
    const secondi = secondiDa(m[0]);
    if (secondi === null) continue;
    const inizio = (m.index ?? 0) + m[0].length;
    const fine = i + 1 < trovati.length ? (trovati[i + 1].index ?? descrizione.length) : descrizione.length;
    const titolo = descrizione
      .slice(inizio, fine)
      .replace(/\s+/g, " ")
      .replace(/^[\s\-–·/:]+|[\s\-–·/:]+$/g, "")
      .trim();
    if (!titolo) continue;
    capitoli.push({ secondi, tempo: formattaTempo(secondi), titolo: titolo.slice(0, 160) });
  }
  return capitoli;
}

/** Il capitolo che corrisponde al minuto scritto dal modello (deve combaciare al secondo con uno del catalogo). */
export function capitoloPer(capitoli: Capitolo[], minuto: unknown): Capitolo | null {
  if (typeof minuto !== "string") return null;
  const s = secondiDa(minuto);
  if (s === null) return null;
  return capitoli.find((c) => c.secondi === s) ?? null;
}
