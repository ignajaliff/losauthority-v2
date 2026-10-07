/**
 * Modulo contratti — tipi condivisi tra pagina pubblica, gestionale e server.
 * Niente "server-only": questo file è importato anche dai componenti client.
 */

/** Come compra il cliente: decide QUALE testo firma (consumatore o professionista). */
export type TipoCliente = "privato" | "professionista" | "societa";

export const TIPI_CLIENTE: TipoCliente[] = ["privato", "professionista", "societa"];

export function tipoLabel(tipo: string | null | undefined): string {
  if (tipo === "privato") return "Privato";
  if (tipo === "professionista") return "Partita IVA";
  if (tipo === "societa") return "Società";
  return "—";
}

export type StatoContratto =
  | "inviato"
  | "compilato"
  | "firmato"
  | "pagato"
  | "attivo"
  | "annullato";

/** Stati in cui il cliente può ancora compilare e firmare. */
export const STATI_APERTI: StatoContratto[] = ["inviato", "compilato"];
/** Stati in cui il contratto è firmato (il PDF esiste e non cambia più). */
export const STATI_FIRMATI: StatoContratto[] = ["firmato", "pagato", "attivo"];

export interface Indirizzo {
  via: string;
  cap: string;
  citta: string;
  provincia: string;
}

/** Come arriva la fattura elettronica a chi ha partita IVA. */
export interface RecapitoFattura {
  codice_destinatario: string;
  pec: string;
}

interface DatiContatto {
  email: string;
  telefono: string;
  instagram: string;
  tiktok: string;
}

export interface DatiPrivato extends DatiContatto {
  nome: string;
  cognome: string;
  luogo_nascita: string;
  /** YYYY-MM-DD */
  data_nascita: string;
  indirizzo: Indirizzo;
  codice_fiscale: string;
}

export interface DatiProfessionista extends DatiPrivato, RecapitoFattura {
  partita_iva: string;
}

export interface DatiSocieta extends DatiContatto, RecapitoFattura {
  ragione_sociale: string;
  /** Sede legale. */
  indirizzo: Indirizzo;
  codice_fiscale: string;
  partita_iva: string;
  rappresentante_nome: string;
  rappresentante_cognome: string;
  /** Persona fisica che segue il programma (art. 6.2): riceve gli accessi. */
  partecipante_nome: string;
  partecipante_cognome: string;
}

export type DatiCliente = DatiPrivato | DatiProfessionista | DatiSocieta;

/**
 * Firma tracciata col dito o col mouse: solo la forma del tratto, in un
 * riquadro largo `w` e alto `h`. Ogni tratto è una sequenza x0,y0,x1,y1…
 * Niente tempi né pressione: non sono dati biometrici.
 */
export interface Firma {
  w: number;
  h: number;
  tratti: number[][];
  /**
   * true = i tratti sono CONTORNI chiusi da riempire (firma ricavata da
   * un'immagine, spessore compreso) invece di linee da ripassare. Lo usa solo
   * la firma del Fornitore; quella tracciata dal cliente è sempre a linee.
   */
  pieno?: boolean;
}

/* ---------- Documento: il testo del contratto a blocchi ---------- */

/**
 * Un blocco del testo. Nei testi `**così**` segna il grassetto.
 * È la forma in cui il contratto viene salvato alla firma, mostrato a video
 * e impaginato nel PDF: una sola fonte per tutte e tre le cose.
 */
export type Blocco =
  | { t: "titolo"; testo: string }
  | { t: "sezione"; testo: string }
  | { t: "articolo"; testo: string }
  | { t: "centro"; testo: string }
  | { t: "p"; testo: string }
  | { t: "voce"; testo: string }
  | { t: "nota"; testo: string }
  | { t: "pagina" };

/** Il contratto composto per un cliente: corpo, clausole da approvare, allegati. */
export interface DocumentoContratto {
  /** Versione del testo, es. "upscale-privato-2026.10". */
  modello: string;
  /** Dalle parti all'ultimo articolo. */
  corpo: Blocco[];
  /** Testo dell'approvazione specifica (artt. 1341-1342 c.c.): la seconda firma. */
  approvazione: string;
  /** Allegati al testo. Oggi nessuno: l'informativa privacy è richiamata col suo indirizzo. */
  allegati: Blocco[];
  /** Versione dell'informativa privacy di cui il cliente ha preso visione. */
  informativa_versione?: string;
  /** Come compaiono i due firmatari sotto le firme. */
  firmatario_fornitore: string;
  firmatario_cliente: string;
}

/** Riga della tabella `contracts`. */
export interface ContrattoRow {
  id: string;
  created_at: string;
  created_by: string | null;
  token: string;
  status: StatoContratto;
  programma: string;
  /** Offerta scelta alla creazione dell'invito (il nome è una copia: resta anche se l'offerta cambia). */
  offer_id: string | null;
  offerta: string | null;
  modello_contratto: string;
  prezzo: number;
  durata_mesi: number;
  riferimento: string | null;
  note: string | null;
  tipo: TipoCliente | null;
  dati: Partial<DatiCliente>;
  cliente_nome: string | null;
  cliente_email: string | null;
  aperto_il: string | null;
  informativa_letta_il: string | null;
  compilato_il: string | null;
  firmato_il: string | null;
  firma_ip: string | null;
  firma_user_agent: string | null;
  modello: string | null;
  documento: DocumentoContratto | null;
  testo_sha256: string | null;
  firma_contratto: Firma | null;
  firma_clausole: Firma | null;
  firma_fornitore: Firma | null;
  pdf_path: string | null;
  pdf_sha256: string | null;
  pagato_il: string | null;
  invoice_id: string | null;
  client_id: string | null;
  attivato_il: string | null;
  attivazione_consegne: string[] | null;
  scade_il: string | null;
  recesso_fino_al: string | null;
  annullato_il: string | null;
}

export interface ImpostazioniContratti {
  firma: Firma | null;
  firma_salvata_il: string | null;
  istruzioni_pagamento: string | null;
  /** Telefono del Fornitore, scritto tra le parti del contratto (se impostato). */
  telefono_fornitore: string | null;
}

/** Un'offerta in vendita: nome, modello di contratto e prezzo. */
export interface Offerta {
  id: string;
  created_at: string;
  nome: string;
  modello: string;
  prezzo: number;
  attiva: boolean;
}

/** Le consegne da spuntare prima di attivare un cliente. */
export const CONSEGNE_ATTIVAZIONE: { id: string; label: string }[] = [
  { id: "moduli_skool", label: "Moduli UPSCALE sbloccati su Skool" },
  { id: "gruppo_whatsapp", label: "Aggiunto al gruppo WhatsApp" },
  { id: "chiamate_gruppo", label: "Accesso alle chiamate di gruppo aperto" },
];

/** Etichetta e tono del badge per ogni stato (stesso linguaggio del gestionale). */
export function statoMeta(
  status: string,
  aperto: boolean,
): { label: string; tone: "active" | "expiring" | "churn" | "neutral" | "outline" } {
  switch (status) {
    case "inviato":
      return aperto ? { label: "Aperto", tone: "neutral" } : { label: "Inviato", tone: "outline" };
    case "compilato":
      return { label: "Dati inseriti", tone: "neutral" };
    case "firmato":
      return { label: "Firmato · da incassare", tone: "expiring" };
    case "pagato":
      return { label: "Pagato · da attivare", tone: "expiring" };
    case "attivo":
      return { label: "Attivo", tone: "active" };
    case "annullato":
      return { label: "Annullato", tone: "churn" };
    default:
      return { label: status, tone: "neutral" };
  }
}
