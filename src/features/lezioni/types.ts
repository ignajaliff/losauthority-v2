import type { Tables } from "@/integrations/supabase/types";

export type Lezione = Tables<"lezioni">;
export type StatoSync = Tables<"sync_stati">;

/** Lezioni raggruppate per corso (capitolo Skool), nell'ordine del catalogo. */
export interface GruppoCorso {
  corso: string;
  lezioni: Lezione[];
}

export const CORSO_SENZA_CAPITOLO = "Senza capitolo";
