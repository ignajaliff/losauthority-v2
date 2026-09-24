import type { Tables } from "@/integrations/supabase/types";

export type ErroreLog = Tables<"error_log">;

/** Valore sentinella del filtro scope: nessun filtro. */
export const TUTTI_GLI_SCOPE = "__tutti__";
