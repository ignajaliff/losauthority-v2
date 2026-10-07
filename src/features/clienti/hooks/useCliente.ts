import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { ClienteDettaglio } from "../types";
import { chiaviClienti } from "./chiavi";

/** Scheda di un cliente: `clienti` (tag inclusi nella colonna `tags`) + anagrafica (`user_roles`). */
export function useCliente(id: string | undefined) {
  return useQuery({
    queryKey: chiaviClienti.cliente(id ?? ""),
    enabled: Boolean(id),
    queryFn: async (): Promise<ClienteDettaglio | null> => {
      const { data, error } = await supabase
        .from("clienti")
        .select("*, utente:user_roles(nombre, email, rol)")
        .eq("id", id ?? "")
        .maybeSingle();
      if (error) throw error;
      if (!data) return null;
      const { utente, ...cliente } = data;
      if (!utente) return null;
      return { ...cliente, utente };
    },
  });
}
