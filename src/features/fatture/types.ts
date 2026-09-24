import type { Tables, TablesInsert } from "@/integrations/supabase/types";

export type Fattura = Tables<"fatture">;
export type FatturaInsert = TablesInsert<"fatture">;

/** Fattura con il nome del cliente (per la lista globale in Finance). */
export interface FatturaConCliente extends Fattura {
  cliente_nome: string | null;
  cliente_email: string | null;
}

export const BUCKET_FATTURE = "fatture";
export const PDF_MAX_BYTES = 10 * 1024 * 1024;
