import { z } from "zod";
import { SEZIONE_TEMPO_ID, TUTTE_LE_ORE_IDS } from "./definizioni/onboarding";
import type { Domanda, Questionario, Risposte, Sezione, ValoreRisposta } from "./types";

export const MSG_OBBLIGATORIO = "Questo campo è obbligatorio.";
const MSG_INTERO = "Inserisci un numero intero (anche 0 va bene).";
const MSG_LINK = "Uno dei link non sembra valido. Controlla l'indirizzo.";

/** Accetta anche link senza protocollo (es. instagram.com/x). */
export function sembraUnLink(grezzo: string): boolean {
  const s = grezzo.trim();
  if (!s || /\s/.test(s)) return false;
  try {
    new URL(s.includes("://") ? s : `https://${s}`);
    return s.includes(".");
  } catch {
    return false;
  }
}

const testoOpzionale = z.string().optional();
const listaOpzionale = z.array(z.string()).optional();

function nonVuoti(lista: string[] | undefined): string[] {
  return (lista ?? []).map((v) => v.trim()).filter((v) => v !== "");
}

/** Schema Zod di una singola domanda (il valore può mancare: bozza). */
export function schemaPerDomanda(domanda: Domanda): z.ZodType<ValoreRisposta | undefined> {
  switch (domanda.tipo) {
    case "text":
    case "textarea":
    case "select":
      return domanda.obbligatoria
        ? testoOpzionale.refine((v) => (v ?? "").trim() !== "", MSG_OBBLIGATORIO)
        : testoOpzionale;
    case "number":
      return testoOpzionale
        .refine((v) => !domanda.obbligatoria || (v ?? "").trim() !== "", MSG_OBBLIGATORIO)
        .refine((v) => (v ?? "").trim() === "" || /^\d+$/.test((v ?? "").trim()), MSG_INTERO);
    case "multiselect-text":
      return domanda.obbligatoria
        ? listaOpzionale.refine((v) => nonVuoti(v).length > 0, MSG_OBBLIGATORIO)
        : listaOpzionale;
    case "url-list":
      return listaOpzionale
        .refine((v) => !domanda.obbligatoria || nonVuoti(v).length > 0, MSG_OBBLIGATORIO)
        .refine((v) => nonVuoti(v).every(sembraUnLink), MSG_LINK);
    case "file-list":
      // Gli allegati vivono in questionario_allegati: qui non c'è nulla da validare.
      return listaOpzionale;
  }
}

/** Schema Zod dell'intera scheda, costruito dalla definizione. */
export function schemaPerQuestionario(questionario: Questionario) {
  const forma: Record<string, z.ZodType<ValoreRisposta | undefined>> = {};
  for (const sezione of questionario.definizione) {
    for (const domanda of sezione.domande) forma[domanda.id] = schemaPerDomanda(domanda);
  }
  return z.object(forma);
}

export type ErroriDomande = Record<string, string>;

/** Valida una sezione: mappa domandaId → primo messaggio d'errore. */
export function validaSezione(sezione: Sezione, risposte: Risposte): ErroriDomande {
  const errori: ErroriDomande = {};
  for (const domanda of sezione.domande) {
    const esito = schemaPerDomanda(domanda).safeParse(risposte[domanda.id]);
    if (!esito.success) errori[domanda.id] = esito.error.issues[0]?.message ?? MSG_OBBLIGATORIO;
  }
  return errori;
}

export interface EsitoValidazione {
  ok: boolean;
  /** sezioneId → (domandaId → errore) */
  perSezione: Record<string, ErroriDomande>;
  primaSezioneInvalida: number | null;
}

/** Valida tutta la scheda, sezione per sezione (per l'invio finale). */
export function validaQuestionario(questionario: Questionario, risposte: Risposte): EsitoValidazione {
  const perSezione: Record<string, ErroriDomande> = {};
  let primaSezioneInvalida: number | null = null;
  questionario.definizione.forEach((sezione, indice) => {
    const errori = validaSezione(sezione, risposte);
    if (Object.keys(errori).length > 0) {
      perSezione[sezione.id] = errori;
      if (primaSezioneInvalida === null) primaSezioneInvalida = indice;
    }
  });
  return { ok: primaSezioneInvalida === null, perSezione, primaSezioneInvalida };
}

/** Totale ore/settimana dichiarate nella mappa del tempo. */
export function totaleOre(risposte: Risposte): number {
  return TUTTE_LE_ORE_IDS.reduce((somma, id) => {
    const v = risposte[id];
    const n = typeof v === "string" ? Number.parseInt(v, 10) : Number.NaN;
    return somma + (Number.isFinite(n) ? n : 0);
  }, 0);
}

/**
 * Regola speciale della sezione "La mappa del tuo tempo": avviso non bloccante
 * (richiede conferma esplicita) se tutto è 0 oppure il totale supera 60 ore.
 */
export function avvisoOre(sezione: Sezione, risposte: Risposte): string | null {
  if (sezione.id !== SEZIONE_TEMPO_ID) return null;
  const totale = totaleOre(risposte);
  const tutteCompilate = TUTTE_LE_ORE_IDS.every((id) => {
    const v = risposte[id];
    return typeof v === "string" && /^\d+$/.test(v.trim());
  });
  if (tutteCompilate && totale === 0) return "Hai messo 0 ovunque. Va benissimo se è davvero così — confermi?";
  if (totale > 60) return `Totale ${totale} ore a settimana: tantissime! Confermi che è corretto?`;
  return null;
}
