import type { Tables } from "@/integrations/supabase/types";

export type Tag = Tables<"tags">;

/** Tag con il numero di clienti che lo hanno in `clienti.tags`. */
export interface TagConConteggio extends Tag {
  clienti: number;
}
