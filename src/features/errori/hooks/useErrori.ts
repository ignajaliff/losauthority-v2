import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { ErroreLog } from "../types";

export const CHIAVE_ERRORI = ["errori", "lista"] as const;
const LIMITE = 100;

/** Ultimi 100 errori applicativi (scritti dalle Edge Functions), i più recenti per primi. Sola lettura. */
export function useErrori() {
  return useQuery({
    queryKey: CHIAVE_ERRORI,
    queryFn: async (): Promise<ErroreLog[]> => {
      const { data, error } = await supabase
        .from("error_log")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(LIMITE);
      if (error) throw error;
      return data;
    },
  });
}
