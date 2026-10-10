import type { Tables } from "@/integrations/supabase/types";

/** Call registrata (Fathom) del cliente. */
export type Chiamata = Tables<"chiamate">;

/** Action item di una call. */
export type ChiamataAzione = Tables<"chiamate_azioni">;

/** Opzione minima per scegliere il cliente a cui assegnare una call. */
export interface ClienteOpzione {
  id: string;
  nombre: string;
}

/** Stato del piano d'azione che Aura scrive da una call (`chiamate.piano_stato`). */
export type StatoPiano = "da_generare" | "in_corso" | "pronto" | "errore" | "saltato";

/** Aura sta ancora lavorando: il browser rilegge la call finché non finisce. */
export const pianoInLavorazione = (stato: string | null | undefined): boolean => stato === "da_generare" || stato === "in_corso";

/** Risposta delle Edge Functions usate dal dominio. */
export interface RispostaRiassunto {
  riassunto: string;
}
export interface RispostaPiano {
  stato: "pronto" | "saltato";
  tappe: number;
  sotto: number;
}
