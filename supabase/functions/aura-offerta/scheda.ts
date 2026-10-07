/**
 * La "scheda" che Aura restituisce a ogni turno dentro <scheda>{…}</scheda>:
 * solo i campi proposti, imparati o corretti in quel turno. Qui si valida
 * (nomi, tipi, lunghezze come i check del database) e si separa in due update:
 * la carta e la struttura dell'offerta (tabella `offerta`, la vede il cliente)
 * e la diagnosi per Wesley (tabella `offerta_diagnosi`, che il cliente non legge).
 */

export const CAMPI_TESTO = {
  nome: 120,
  per_chi: 200,
  trasformazione: 400,
  prezzo: 120,
  tipo: 80,
  frase_presentazione: 200,
  snapshot: 800,
  lettura: 1200,
  stato_partenza: 400,
  modello_prezzo_attuale: 300,
  erogazione: 400,
  valore_risultato: 400,
  ancora: 300,
  ragionamento_prezzo: 600,
  prezzo_precedente: 120,
  unita: 300,
  rischio: 400,
  permanenza_uscita: 400,
  clienti_attuali: 400,
  scala_gratis: 300,
  scala_entrata: 300,
  scala_cuore: 300,
  scala_vetta: 300,
  garanzia: 400,
  scarsita_urgenza: 300,
  piano_validazione: 800,
} as const;

/** Campi elenco con il massimo di voci (= check del DB). */
export const CAMPI_LISTA = {
  prove: 12,
  buchi_credibilita: 12,
  ostacoli_soluzioni: 8,
  stack: 8,
  riferimenti_mercato: 8,
  incluso: 12,
  non_incluso: 12,
  bonus: 6,
  nomi_alternativi: 6,
  obiezioni_risposte: 12,
  da_confermare: 12,
} as const;

export const DIAGNOSI_TESTO = { quadro: 800, equazione_valore: 800, credibilita_erogabilita: 800, nodo_centrale: 600, priorita_operativa: 400 } as const;
export const DIAGNOSI_LISTA = { da_validare: 12 } as const;

export const POSIZIONAMENTI = ["low_ticket", "mid_ticket", "high_ticket"] as const;

export type CampoTesto = keyof typeof CAMPI_TESTO;
export type CampoLista = keyof typeof CAMPI_LISTA;
export type DiagnosiTesto = keyof typeof DIAGNOSI_TESTO;
export type DiagnosiLista = keyof typeof DIAGNOSI_LISTA;

/** Update pronto per `offerta`. */
export type CampiOfferta = Partial<Record<CampoTesto, string> & Record<CampoLista, string[]> & { posizionamento: (typeof POSIZIONAMENTI)[number] }>;
/** Update pronto per `offerta_diagnosi`. */
export type CampiDiagnosi = Partial<Record<DiagnosiTesto, string> & Record<DiagnosiLista, string[]>>;

/** Le voci degli elenchi possono essere frasi intere ("ostacolo → soluzione"). */
const MAX_VOCE = 300;

const pulisciTesto = (v: unknown, max: number): string | null => {
  if (typeof v !== "string") return null;
  const t = v.replace(/\s+/g, " ").trim();
  return t.length > 0 ? t.slice(0, max) : null;
};

const pulisciLista = (v: unknown, maxVoci: number): string[] | null => {
  if (!Array.isArray(v)) return null;
  const voci = v.map((x) => pulisciTesto(x, MAX_VOCE)).filter((x): x is string => !!x);
  return voci.length > 0 ? [...new Set(voci)].slice(0, maxVoci) : null;
};

/** Da un JSON qualsiasi ai campi validi, divisi tra offerta e diagnosi (ignora tutto il resto). */
export function validaCampi(grezzo: unknown): { offerta: CampiOfferta; diagnosi: CampiDiagnosi } {
  const offerta: CampiOfferta = {};
  const diagnosi: CampiDiagnosi = {};
  if (!grezzo || typeof grezzo !== "object") return { offerta, diagnosi };
  const o = grezzo as Record<string, unknown>;
  for (const [k, max] of Object.entries(CAMPI_TESTO) as Array<[CampoTesto, number]>) {
    const t = pulisciTesto(o[k], max);
    if (!t) continue;
    // Le frasi "da dire" vanno senza virgolette: le mette la carta.
    offerta[k] = k === "frase_presentazione" || k === "trasformazione" ? t.replace(/^["'«»“”„]+|["'«»“”„]+$/g, "").trim() || t : t;
  }
  for (const [k, maxVoci] of Object.entries(CAMPI_LISTA) as Array<[CampoLista, number]>) {
    const l = pulisciLista(o[k], maxVoci);
    if (l) offerta[k] = l;
  }
  if (typeof o.posizionamento === "string" && (POSIZIONAMENTI as readonly string[]).includes(o.posizionamento)) {
    offerta.posizionamento = o.posizionamento as (typeof POSIZIONAMENTI)[number];
  }
  for (const [k, max] of Object.entries(DIAGNOSI_TESTO) as Array<[DiagnosiTesto, number]>) {
    const t = pulisciTesto(o[k], max);
    if (t) diagnosi[k] = t;
  }
  for (const [k, maxVoci] of Object.entries(DIAGNOSI_LISTA) as Array<[DiagnosiLista, number]>) {
    const l = pulisciLista(o[k], maxVoci);
    if (l) diagnosi[k] = l;
  }
  return { offerta, diagnosi };
}

export type MotivoScheda = "ok" | "nessun_blocco" | "json_invalido";

export interface SchedaEstratta {
  risposta: string;
  offerta: CampiOfferta;
  diagnosi: CampiDiagnosi;
  /** Aura dichiara l'offerta chiusa (va comunque verificato con campiMancanti). */
  completo: boolean;
  motivo: MotivoScheda;
  /** Il blocco grezzo, per il log quando il JSON non si legge. */
  grezzo: string;
}

/** Separa il testo per il cliente dal blocco <scheda>; segnala se il blocco manca o non è JSON. */
export function estraiScheda(testo: string): SchedaEstratta {
  const apre = testo.indexOf("<scheda>");
  const pulisci = (t: string) => t.replace(/\*\*(.+?)\*\*/g, "$1").replace(/^#{1,6}\s+/gm, "").trim();
  const vuota = (risposta: string, motivo: MotivoScheda, grezzo: string): SchedaEstratta => ({ risposta, offerta: {}, diagnosi: {}, completo: false, motivo, grezzo });
  if (apre === -1) return vuota(pulisci(testo), "nessun_blocco", "");
  const chiude = testo.indexOf("</scheda>", apre);
  const grezzo = chiude > apre ? testo.slice(apre + 8, chiude) : testo.slice(apre + 8);
  const coda = chiude > apre ? testo.slice(chiude + 9) : "";
  const risposta = pulisci(`${testo.slice(0, apre)}\n${coda}`);
  const a = grezzo.indexOf("{");
  if (a === -1) return vuota(risposta, "json_invalido", grezzo);
  const b = grezzo.lastIndexOf("}");
  const json = leggiJson(b > a ? grezzo.slice(a, b + 1) : grezzo.slice(a)) ?? riparaJson(grezzo.slice(a));
  if (json === null) return vuota(risposta, "json_invalido", grezzo);
  const completo = !!json && typeof json === "object" && (json as { completo?: unknown }).completo === true;
  // Un blocco riparato è parziale: lo stato "completo" non è affidabile (si segnala comunque come json_invalido per il log).
  const riparato = b <= a || leggiJson(grezzo.slice(a, b + 1)) === null;
  return { risposta, ...validaCampi(json), completo: completo && !riparato, motivo: riparato ? "json_invalido" : "ok", grezzo };
}

function leggiJson(testo: string): unknown | null {
  try {
    return JSON.parse(testo);
  } catch {
    return null;
  }
}

/**
 * Il modello a volte supera il limite di output e il JSON resta a metà: si
 * taglia all'ultima coppia chiave/valore completa (l'ultima virgola di primo
 * livello) e si chiude la graffa, così i campi arrivati fino a lì si salvano.
 */
export function riparaJson(testo: string): unknown | null {
  let t = testo;
  for (let i = 0; i < 200; i++) {
    const virgola = t.lastIndexOf(",");
    if (virgola <= 0) return null;
    t = t.slice(0, virgola);
    const json = leggiJson(`${t}}`);
    if (json && typeof json === "object") return json;
  }
  return null;
}

/**
 * Cosa manca perché l'offerta sia davvero completa (stesse soglie del prompt):
 * si calcola sulle righe unite (offerta + diagnosi + campi del turno), non sulla parola di Aura.
 */
export function campiMancanti(offerta: Record<string, unknown>, diagnosi: Record<string, unknown>): string[] {
  const testo = (o: Record<string, unknown>, k: string) => typeof o[k] === "string" && (o[k] as string).trim().length > 0;
  const lista = (k: string, min: number) => Array.isArray(offerta[k]) && (offerta[k] as unknown[]).length >= min;
  const mancanti: string[] = [];
  for (const k of ["nome", "per_chi", "trasformazione", "prezzo", "posizionamento", "snapshot", "lettura", "unita", "garanzia", "scala_entrata", "scala_cuore", "piano_validazione"]) {
    if (!testo(offerta, k)) mancanti.push(k);
  }
  if (!testo(diagnosi, "quadro")) mancanti.push("quadro");
  if (!lista("ostacoli_soluzioni", 3)) mancanti.push("ostacoli_soluzioni (almeno 3)");
  if (!lista("stack", 3)) mancanti.push("stack (almeno 3)");
  if (!lista("obiezioni_risposte", 1)) mancanti.push("obiezioni_risposte");
  return mancanti;
}
