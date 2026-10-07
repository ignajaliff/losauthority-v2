/**
 * Il PROFILO del cliente per Claude e per gli agenti: le risposte della scheda
 * lette dalla riga di data_onboarding, solo le domande del suo percorso
 * (regola 3: le domande non mostrate non sono «mancanti»).
 *
 * - `costruisciProfilo` → JSON per il compito 2 (lettura dell'onboarding).
 * - `renderScheda` → testo "- Domanda → risposta" per i prompt degli agenti.
 */
import { conParole, DOMANDA_PER_ID, domandeAttive, formattaValore, paroleDaJson, risposteDaRecord } from "./definizione.ts";
import { CAMPI_OPINIONE, eDomandaNumero, ramoDi, type Domanda, type Parole, type Risposte, type ValoreRisposta } from "./tipi.ts";

export type RigaOnboarding = Record<string, unknown>;

/** Il contesto della riga: risposte, percorso e parole. */
export interface SchedaLetta {
  risposte: Risposte;
  domande: Domanda[];
  parole: Parole;
  riga: RigaOnboarding;
}

export function leggiRiga(riga: RigaOnboarding): SchedaLetta {
  const risposte = risposteDaRecord(riga);
  return { risposte, domande: domandeAttive(risposte), parole: paroleDaJson(riga.parole, risposte), riga };
}

function valoreProfilo(d: Domanda, v: ValoreRisposta | undefined): unknown {
  if (v === undefined) return null;
  if (typeof v === "string") {
    if (v.trim() === "") return null;
    if (eDomandaNumero(d.tipo)) {
      const n = Number(v.replace(",", "."));
      return Number.isFinite(n) ? n : v;
    }
    return v;
  }
  if (Array.isArray(v)) return v.map((x) => x.trim()).filter(Boolean);
  const out: Record<string, number | string> = {};
  for (const [k, val] of Object.entries(v)) {
    if (val.trim() === "") continue;
    const n = Number(val);
    out[k] = d.tipo === "conteggi" && Number.isFinite(n) ? n : val;
  }
  return Object.keys(out).length > 0 ? out : null;
}

/**
 * Il JSON che va a Claude: tutti i campi del percorso (null se non risposti),
 * le parole, i chiarimenti, i materiali, le opinioni e la legenda dei menu.
 */
export function costruisciProfilo(riga: RigaOnboarding, materialiTesto: string | null): Record<string, unknown> {
  const s = leggiRiga(riga);
  const profilo: Record<string, unknown> = {};
  const legenda: Record<string, Record<string, string>> = {};
  for (const d of s.domande) {
    if (d.tipo === "file-list") continue;
    profilo[d.id] = valoreProfilo(d, s.risposte[d.id]);
    if (d.opzioni && d.tipo !== "conteggi" && d.tipo !== "fasce") {
      legenda[d.id] = Object.fromEntries(d.opzioni.map((o) => [o.value, conParole(o.label, s.parole)]));
    }
  }
  const ramo = ramoDi(s.risposte);
  return {
    ...profilo,
    parole: s.parole,
    chiarimenti_fatti: riga.chiarimenti_fatti === true,
    materiali_testo: materialiTesto && materialiTesto.trim() ? materialiTesto : null,
    _percorso: { ramo, tipo: profilo.tipo ?? null, mercato: profilo.mercato ?? null, clienti: profilo.clienti ?? null, social: profilo.social ?? null },
    _opinioni: CAMPI_OPINIONE.filter((id) => id in profilo),
    _legenda: legenda,
  };
}

/** La scheda in testo leggibile (solo il percorso del cliente), per i prompt di Aura. */
export function renderScheda(riga: RigaOnboarding | null): string {
  if (!riga) return "(non compilato)";
  const s = leggiRiga(riga);
  const righe: string[] = [];
  let bloccoCorrente = "";
  for (const d of s.domande) {
    if (d.tipo === "file-list") continue;
    const blocco = bloccoDi(d);
    if (blocco !== bloccoCorrente) {
      righe.push(`\n## ${blocco}`);
      bloccoCorrente = blocco;
    }
    const nota = d.opinione ? " (opinione del cliente)" : "";
    righe.push(`- ${conParole(d.testo, s.parole)}${nota}\n  → ${formattaValore(d, s.risposte[d.id], s.parole)}`);
  }
  const materiali = typeof riga.materiali_testo === "string" && riga.materiali_testo.trim() ? riga.materiali_testo.trim() : "";
  if (materiali) righe.push(`\n## Materiali caricati (testo estratto)\n${materiali.slice(0, 6000)}`);
  return righe.join("\n");
}

/** Il titolo del blocco di una domanda (dalla prima versione con quell'id). */
function bloccoDi(d: Domanda): string {
  // Le domande portano il codice del documento: la lettera iniziale è il blocco.
  const lettera = d.codice.charAt(0);
  return TITOLI_BLOCCO[lettera] ?? "Altro";
}

const TITOLI_BLOCCO: Record<string, string> = {
  "0": "Da dove parti",
  A: "Il tuo lavoro e la tua offerta",
  B: "I tuoi clienti",
  C: "La tua comunicazione oggi",
  D: "Il tuo tempo",
  E: "Tu e l'IA",
  F: "Obiettivi e percorso",
  G: "Materiali",
};

/** Etichetta di un campo (prima versione), per i log e per aura-help. */
export function testoCampo(id: string): string | null {
  const d = DOMANDA_PER_ID.get(id as never);
  return d ? d.testo : null;
}
