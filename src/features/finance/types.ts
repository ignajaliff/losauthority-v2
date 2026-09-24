import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";

export type Spesa = Tables<"spese">;
export type SpesaInsert = TablesInsert<"spese">;
export type SpesaUpdate = TablesUpdate<"spese">;
export type TipoSpesa = "fissa" | "variabile";

export type F24 = Tables<"f24">;
export type F24Update = TablesUpdate<"f24">;

export type RigaFinanzaMensile = Tables<"vista_finanza_mensile">;

/** Un mese del grafico (ultimi 12), sempre presente anche se a zero. */
export interface PuntoMensile {
  mese: string; // "YYYY-MM"
  etichetta: string; // "set 26"
  fatturato: number;
  incassato: number;
  spese: number; // fisse + variabili
  f24: number;
}

export interface FinanceStats {
  incassato: number;
  daIncassare: number;
  speseMese: number;
  f24DaPagare: number;
  f24DaPagareCount: number;
}

export const BUCKET_F24 = "f24";
export const BUCKET_RICEVUTE = "ricevute";
export const FILE_MAX_BYTES = 10 * 1024 * 1024;

export const TAB_FINANCE = ["fatture", "f24", "spese"] as const;
export type TabFinance = (typeof TAB_FINANCE)[number];
