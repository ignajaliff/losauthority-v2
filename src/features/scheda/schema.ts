import { z } from "zod";
import { domandeVisibili } from "@onboarding/definizione.ts";
import type { Blocco, Domanda, Risposte, ValoreRisposta } from "./types";

export const MSG_OBBLIGATORIO = "Questo campo è obbligatorio.";
const MSG_INTERO = "Inserisci un numero intero (anche 0 va bene).";
const MSG_NUMERO = "Inserisci un numero.";
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
const mappaOpzionale = z.record(z.string(), z.string()).optional();

function nonVuoti(lista: string[] | undefined): string[] {
  return (lista ?? []).map((v) => v.trim()).filter((v) => v !== "");
}

function mappaPiena(m: Record<string, string> | undefined): boolean {
  return Object.values(m ?? {}).some((v) => v.trim() !== "" && v !== "0");
}

function intervallo(d: Domanda, v: string): boolean {
  const n = Number(v.replace(",", "."));
  if (!Number.isFinite(n) || n < (d.min ?? 0)) return false;
  return d.max === undefined || n <= d.max;
}

const pulito = (v: string | undefined) => (v ?? "").trim();

/** Schema Zod di una singola domanda (il valore può mancare: bozza). */
export function schemaPerDomanda(d: Domanda): z.ZodType<ValoreRisposta | undefined> {
  const obbl = (v: string | undefined) => !d.obbligatoria || pulito(v) !== "";
  switch (d.tipo) {
    case "text":
    case "textarea":
    case "select":
      return testoOpzionale.refine(obbl, MSG_OBBLIGATORIO);
    case "number": {
      const decimali = d.id === "spesa_media";
      const forma = decimali ? /^\d+([.,]\d{1,2})?$/ : /^\d+$/;
      return testoOpzionale
        .refine(obbl, MSG_OBBLIGATORIO)
        .refine((v) => pulito(v) === "" || forma.test(pulito(v)), decimali ? MSG_NUMERO : MSG_INTERO)
        .refine((v) => pulito(v) === "" || intervallo(d, pulito(v)), d.max !== undefined ? `Un numero da ${d.min ?? 0} a ${d.max}.` : MSG_INTERO);
    }
    case "scala":
      return testoOpzionale
        .refine(obbl, MSG_OBBLIGATORIO)
        .refine((v) => pulito(v) === "" || intervallo(d, pulito(v)), `Scegli un valore da ${d.min ?? 1} a ${d.max ?? 5}.`);
    case "multiselect-text":
      return d.obbligatoria ? listaOpzionale.refine((v) => nonVuoti(v).length > 0, MSG_OBBLIGATORIO) : listaOpzionale;
    case "url-list":
      return listaOpzionale
        .refine((v) => !d.obbligatoria || nonVuoti(v).length > 0, MSG_OBBLIGATORIO)
        .refine((v) => nonVuoti(v).every(sembraUnLink), MSG_LINK);
    case "conteggi":
    case "fasce":
      return d.obbligatoria ? mappaOpzionale.refine(mappaPiena, "Metti almeno un numero.") : mappaOpzionale;
    case "file-list":
      // Gli allegati vivono in files_onboarding: qui non c'è nulla da validare.
      return listaOpzionale;
  }
}

export type ErroriDomande = Record<string, string>;

/** Valida le domande VISIBILI di un blocco: mappa domandaId → primo messaggio d'errore. */
export function validaBlocco(blocco: Blocco, risposte: Risposte): ErroriDomande {
  const errori: ErroriDomande = {};
  for (const domanda of domandeVisibili(blocco, risposte)) {
    const esito = schemaPerDomanda(domanda).safeParse(risposte[domanda.id]);
    if (!esito.success) errori[domanda.id] = esito.error.issues[0]?.message ?? MSG_OBBLIGATORIO;
  }
  return errori;
}

export interface EsitoValidazione {
  ok: boolean;
  /** bloccoId → (domandaId → errore) */
  perBlocco: Record<string, ErroriDomande>;
  primoBloccoInvalido: number | null;
}

/** Valida tutta la scheda, blocco per blocco (prima di mandarla ad Aura). */
export function validaScheda(blocchi: Blocco[], risposte: Risposte): EsitoValidazione {
  const perBlocco: Record<string, ErroriDomande> = {};
  let primoBloccoInvalido: number | null = null;
  blocchi.forEach((blocco, indice) => {
    const errori = validaBlocco(blocco, risposte);
    if (Object.keys(errori).length > 0) {
      perBlocco[blocco.id] = errori;
      if (primoBloccoInvalido === null) primoBloccoInvalido = indice;
    }
  });
  return { ok: primoBloccoInvalido === null, perBlocco, primoBloccoInvalido };
}
