import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { ClienteDettaglio, Tag } from "../types";
import { chiaviClienti } from "./chiavi";

/** Scheda di un cliente: `clienti` + anagrafica (`user_roles`) + tag. */
export function useCliente(id: string | undefined) {
  return useQuery({
    queryKey: chiaviClienti.cliente(id ?? ""),
    enabled: Boolean(id),
    queryFn: async (): Promise<ClienteDettaglio | null> => {
      const { data, error } = await supabase
        .from("clienti")
        .select("*, utente:user_roles(nombre, email, rol), clienti_tags(tags(id, label))")
        .eq("id", id ?? "")
        .maybeSingle();
      if (error) throw error;
      if (!data) return null;
      const { utente, clienti_tags, ...cliente } = data;
      if (!utente) return null;
      const tags = clienti_tags
        .map((ct) => ct.tags)
        .filter((t): t is Tag => t !== null)
        .sort((a, b) => a.label.localeCompare(b.label, "it"));
      return { ...cliente, utente, tags };
    },
  });
}
