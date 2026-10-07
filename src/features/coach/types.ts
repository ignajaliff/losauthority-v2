import type { Tables } from "@/integrations/supabase/types";

/** Un messaggio della conversazione con il Wesley Coach (cliente o Aura). */
export type MessaggioCoach = Tables<"coach_messaggi">;

/** La lezione Skool come la mostra il coach: corso, titolo e link alla classroom. */
export type LezioneCoach = Pick<Tables<"lezioni">, "id" | "titolo" | "corso" | "url">;

/** Il capitolo (minuto + titolo) da cui guardare una lezione consigliata. */
export interface CapitoloCoach {
  tempo: string;
  titolo: string;
}

/** Legge una voce di `coach_messaggi.lezioni_capitoli` ("27:40 educare il cliente…"); null se la lezione è consigliata per intero. */
export function leggiCapitolo(voce: string | undefined): CapitoloCoach | null {
  const m = /^(\d{1,2}:\d{2}(?::\d{2})?)\s+(.+)$/.exec(voce ?? "");
  return m ? { tempo: m[1], titolo: m[2] } : null;
}

/** Frasi di stato mentre il coach cerca la lezione. */
export const FASI_COACH = [
  "Sto leggendo cosa mi hai scritto…",
  "Cerco tra le lezioni di Wesley quella che ti serve…",
  "Controllo le parole chiave delle classi…",
  "Preparo il consiglio e il link alla lezione…",
  "Ancora un attimo…",
] as const;

/** Spunti per la schermata vuota: un clic li mette nel composer. */
export const SPUNTI_COACH = [
  "Ho bisogno di aiuto con le vendite: mi scrivono ma pochi comprano",
  "Non so come strutturare un progetto sui social che funzioni",
  "Voglio capire come usare l'IA per creare contenuti più in fretta",
  "I miei video fanno poche visualizzazioni, da dove parto?",
] as const;
