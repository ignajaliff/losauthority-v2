import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { ClienteRiga } from "../types";
import { chiaviClienti } from "./chiavi";

function tsCall(iso: string | null): number {
  if (!iso) return Number.POSITIVE_INFINITY;
  const t = new Date(iso).getTime();
  return Number.isNaN(t) ? Number.POSITIVE_INFINITY : t;
}

/**
 * Lista clienti dalla vista `vista_clienti`, ordinata per urgenza:
 * prossima call più vicina prima, chi non ha una call in fondo
 * (a parità, il cliente più recente prima).
 */
export function useClienti() {
  return useQuery({
    queryKey: chiaviClienti.lista,
    queryFn: async (): Promise<ClienteRiga[]> => {
      const { data, error } = await supabase.from("vista_clienti").select("*");
      if (error) throw error;
      return [...data].sort((a, b) => {
        const d = tsCall(a.prossima_call) - tsCall(b.prossima_call);
        if (d !== 0) return d;
        return tsCall(b.created_at) - tsCall(a.created_at);
      });
    },
  });
}
