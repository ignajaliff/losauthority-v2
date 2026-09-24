import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Fattura, FatturaConCliente } from "../types";

export const chiaviFatture = {
  radice: ["fatture"] as const,
  cliente: (clienteId: string) => ["fatture", "cliente", clienteId] as const,
  tutte: ["fatture", "tutte"] as const,
};

/** Fatture di un cliente, dalla più recente. */
export function useFattureCliente(clienteId: string) {
  return useQuery({
    queryKey: chiaviFatture.cliente(clienteId),
    enabled: Boolean(clienteId),
    queryFn: async (): Promise<Fattura[]> => {
      const { data, error } = await supabase
        .from("fatture")
        .select("*")
        .eq("cliente_id", clienteId)
        .order("emessa_il", { ascending: false })
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

/**
 * Tutte le fatture con nome/email del cliente (Finance).
 * Due query (fatture + vista_clienti) unite lato client: più robusto del join annidato.
 */
export function useTutteLeFatture() {
  return useQuery({
    queryKey: chiaviFatture.tutte,
    queryFn: async (): Promise<FatturaConCliente[]> => {
      const { data: fatture, error } = await supabase
        .from("fatture")
        .select("*")
        .order("emessa_il", { ascending: false })
        .order("created_at", { ascending: false });
      if (error) throw error;

      const ids = Array.from(new Set(fatture.map((f) => f.cliente_id)));
      if (ids.length === 0) return [];

      const { data: clienti, error: errClienti } = await supabase
        .from("vista_clienti")
        .select("id, nombre, email")
        .in("id", ids);
      if (errClienti) throw errClienti;

      const perId = new Map(clienti.map((c) => [c.id, c]));
      return fatture.map((f) => {
        const c = perId.get(f.cliente_id);
        return { ...f, cliente_nome: c?.nombre ?? null, cliente_email: c?.email ?? null };
      });
    },
  });
}
