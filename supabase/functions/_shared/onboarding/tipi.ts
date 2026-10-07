/**
 * Onboarding v3 (documenti di Wesley del 02/10/2026: «Domande e percorsi» e
 * «Istruzioni per Claude»). Tipi puri, senza React né Supabase: li usano il
 * browser (alias `@onboarding/*`) e le Edge Functions.
 *
 * Il cliente risponde prima al modulo iniziale (6 domande). Quelle risposte
 * scelgono quale VERSIONE di ogni domanda vede: tutte le versioni della stessa
 * domanda scrivono nello stesso campo del profilo (= colonna di data_onboarding).
 */

export type Tipo = "servizi" | "prodotti_fisici" | "prodotti_digitali" | "mix";
export type Ramo = Exclude<Tipo, "mix">;
export type Mercato = "privati" | "aziende" | "entrambi";
export type Clienti = "nessuno" | "pochi" | "continui";
export type Social = "non_pubblica" | "ogni_tanto" | "settimanale" | "porta_clienti";

/** Le parole del mestiere (compito 1 di Claude): sostituiscono {cliente}, {clienti}, {cosa_vende}… nei testi. */
export interface Parole {
  cliente: string;
  clienti: string;
  cosa_vende: string;
  cosa_vende_plurale: string;
  esempio_listino: string;
}

/**
 * Quando una domanda (o un'opzione) si mostra. Ogni chiave presente deve
 * contenere il valore attuale; una chiave assente non filtra. Se il valore che
 * serve non è ancora stato dato, la domanda NON si mostra.
 * «≠ nessuno» si scrive come clienti: ["pochi", "continui"]; «prodotti» come
 * ramo: ["prodotti_fisici", "prodotti_digitali"].
 */
export interface Condizione {
  ramo?: Ramo[];
  clienti?: Clienti[];
  social?: Social[];
  mercato?: Mercato[];
  tipo?: Tipo[];
}

export type TipoDomanda =
  | "text"
  | "textarea"
  | "number"
  | "select"
  | "multiselect-text"
  | "url-list"
  | "scala"
  | "conteggi"
  | "fasce"
  | "file-list";

export interface Opzione {
  value: string;
  label: string;
  /** L'opzione si mostra solo se la condizione vale (es. «Vendo…» non a chi non ha clienti). */
  mostraSe?: Condizione;
}

export interface Domanda {
  /** Id STABILE = nome della colonna in data_onboarding. Più versioni possono condividerlo. */
  id: IdCampo;
  /** Codice del documento di Wesley (0.3, A2-s, C5-p…): per parlarne con lui. */
  codice: string;
  /** Testo per il cliente; può contenere {cliente} {clienti} {cosa_vende} {cosa_vende_plurale} {esempio_listino}. */
  testo: string;
  hint?: string;
  placeholder?: string;
  tipo: TipoDomanda;
  obbligatoria: boolean;
  /** Il campo è un'OPINIONE del cliente: Claude la tratta come convinzione da verificare. */
  opinione?: boolean;
  opzioni?: Opzione[];
  /** multiselect-text: consente un valore libero "Altro". */
  consentiAltro?: boolean;
  /** number: unità mostrata accanto; scala: estremi. */
  unita?: string;
  min?: number;
  max?: number;
  mostraSe?: Condizione;
}

export interface Blocco {
  id: string;
  chiave: string;
  titolo: string;
  intro: string;
  emoji: string;
  domande: Domanda[];
}

/** Tutti i campi del profilo (una colonna ciascuno, tranne `allegati` = files_onboarding). */
export const ID_CAMPI = [
  // modulo iniziale
  "nome", "nome_attivita", "attivita_breve", "tipo", "tipo_principale", "mercato", "clienti", "social",
  // A
  "presentazione", "offerta_attuale", "spesa_media", "margine", "fatturato_fascia", "processo_vendita", "processo_vendita_canali",
  "conversione", "ordini_mese", "ritorno", "capacita", "consegna", "prove", "prove_testo", "offerta_secondaria", "decisore", "ciclo_vendita",
  // B
  "canali_acquisizione", "cliente_migliore", "acquirente_utente", "anti_cliente", "messaggi_tipici", "obiezioni",
  "avatar_ipotesi", "domande_ricevute", "esperienze_prova",
  // C
  "link_profili", "camera_agio", "vincoli_camera", "tentativi_passati", "riferimenti", "blocco_partenza", "blocco_partenza_testo", "paure",
  "collo_bottiglia", "diagnosi_cliente", "frequenza", "contenuti_migliori", "follower", "views_medie", "clienti_da_social", "priorita_crescita",
  // D
  "ore_social", "attivita_pesanti", "non_delegabile", "ore_per_attivita",
  // E
  "ia_uso", "abbonamenti", "dispositivo",
  // F
  "obiettivo_6_mesi", "competenza_obiettivo", "da_evitare", "perche_ora", "ore_percorso", "disponibilita_call",
  // G
  "allegati",
] as const;
export type IdCampo = (typeof ID_CAMPI)[number];

/** Campi che Claude deve leggere come opinioni (regola 1 del compito 2). */
export const CAMPI_OPINIONE: readonly IdCampo[] = ["presentazione", "avatar_ipotesi", "diagnosi_cliente", "paure"];

/** Valore in memoria di una risposta: testo, lista, oppure mappa opzione → valore (conteggi, fasce). */
export type ValoreRisposta = string | string[] | Record<string, string>;
export type Risposte = Partial<Record<IdCampo, ValoreRisposta>>;

export const RAMI_PRODOTTI: Ramo[] = ["prodotti_fisici", "prodotti_digitali"];
export const CON_CLIENTI: Clienti[] = ["pochi", "continui"];
export const PUBBLICA: Social[] = ["ogni_tanto", "settimanale", "porta_clienti"];
export const NON_PRIVATI: Mercato[] = ["aziende", "entrambi"];

function testo(r: Risposte, id: IdCampo): string | null {
  const v = r[id];
  return typeof v === "string" && v.trim() !== "" ? v.trim() : null;
}

/** Il ramo del cliente: tipo_principale se tipo = mix, altrimenti tipo. null finché non risponde. */
export function ramoDi(r: Risposte): Ramo | null {
  const tipo = testo(r, "tipo");
  if (!tipo) return null;
  if (tipo === "mix") {
    const p = testo(r, "tipo_principale");
    return p && p !== "mix" ? (p as Ramo) : null;
  }
  return tipo as Ramo;
}

/** La condizione vale con le risposte attuali? (nessuna condizione = sempre) */
export function soddisfa(cond: Condizione | undefined, r: Risposte): boolean {
  if (!cond) return true;
  if (cond.ramo) {
    const ramo = ramoDi(r);
    if (!ramo || !cond.ramo.includes(ramo)) return false;
  }
  if (cond.tipo) {
    const t = testo(r, "tipo");
    if (!t || !cond.tipo.includes(t as Tipo)) return false;
  }
  if (cond.clienti) {
    const c = testo(r, "clienti");
    if (!c || !cond.clienti.includes(c as Clienti)) return false;
  }
  if (cond.social) {
    const s = testo(r, "social");
    if (!s || !cond.social.includes(s as Social)) return false;
  }
  if (cond.mercato) {
    const m = testo(r, "mercato");
    if (!m || !cond.mercato.includes(m as Mercato)) return false;
  }
  return true;
}

/** Le domande di un blocco visibili con queste risposte (le versioni non attive spariscono). */
export function domandeVisibili(blocco: Blocco, r: Risposte): Domanda[] {
  return blocco.domande.filter((d) => soddisfa(d.mostraSe, r));
}

/** Le opzioni di una domanda visibili con queste risposte. */
export function opzioniVisibili(d: Domanda, r: Risposte): Opzione[] {
  return (d.opzioni ?? []).filter((o) => soddisfa(o.mostraSe, r));
}

/** Le domande il cui valore è una lista (colonna jsonb array). */
export function eDomandaLista(tipo: TipoDomanda): boolean {
  return tipo === "multiselect-text" || tipo === "url-list" || tipo === "file-list";
}

/** Le domande il cui valore è una mappa opzione → valore (colonna jsonb object). */
export function eDomandaMappa(tipo: TipoDomanda): boolean {
  return tipo === "conteggi" || tipo === "fasce";
}

/** Le domande numeriche (colonna integer o numeric). */
export function eDomandaNumero(tipo: TipoDomanda): boolean {
  return tipo === "number" || tipo === "scala";
}
