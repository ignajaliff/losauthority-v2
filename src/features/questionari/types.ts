import type { Tables } from "@/integrations/supabase/types";

/** Tipi di domanda: identici al sistema precedente (Aura legge gli id, non le etichette). */
export type TipoDomanda =
  | "textarea"
  | "text"
  | "select"
  | "number"
  | "multiselect-text"
  | "url-list"
  | "file-list";

export interface OpzioneDomanda {
  value: string;
  label: string;
}

export interface Domanda {
  /** Id STABILE: è la chiave in questionario_risposte.domanda_id. */
  id: string;
  testo: string;
  hint?: string;
  placeholder?: string;
  tipo: TipoDomanda;
  obbligatoria: boolean;
  opzioni?: OpzioneDomanda[];
  unita?: string;
  /** multiselect-text: consente un valore libero "Altro". */
  consentiAltro?: boolean;
}

export interface Sezione {
  id: string;
  chiave: string;
  titolo: string;
  intro: string;
  emoji: string;
  nota?: string;
  domande: Domanda[];
}

export type QuestionarioId = "onboarding" | "avatar_dolori" | "offerta";

export interface Questionario {
  id: QuestionarioId;
  num: number;
  /** Rotta sotto /area. */
  slug: string;
  titolo: string;
  occhiello: string;
  sottotitolo: string;
  icona: string;
  definizione: Sezione[];
}

/** Valore in memoria di una risposta: testo, oppure lista (multiselect, link). */
export type ValoreRisposta = string | string[];
export type Risposte = Record<string, ValoreRisposta>;

export type StatoInvio = "bozza" | "inviato";
/** Stato di una scheda per un cliente: manca l'invio, è in bozza o è stata inviata. */
export type StatoScheda = StatoInvio | "mancante";

export type Invio = Tables<"questionario_invii">;
export type RigaRisposta = Tables<"questionario_risposte">;
export type Allegato = Tables<"questionario_allegati">;

export interface StatoQuestionario {
  questionarioId: QuestionarioId;
  stato: StatoScheda;
  inviatoIl: string | null;
  sezioneIndice: number | null;
  aggiornatoIl: string | null;
}

/** Le domande il cui valore è una lista (più righe in questionario_risposte). */
export function eDomandaMultipla(tipo: TipoDomanda): boolean {
  return tipo === "multiselect-text" || tipo === "url-list" || tipo === "file-list";
}
