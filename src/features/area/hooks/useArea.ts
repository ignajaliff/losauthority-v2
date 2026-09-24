import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type MioCliente = Pick<
  Tables<"clienti">,
  "id" | "fase" | "stato_onboarding" | "notion_hub_url" | "hub_creato_il" | "prossima_call"
>;
export type MiaChiamata = Pick<Tables<"chiamate">, "id" | "titolo" | "registrata_il" | "riassunto" | "share_url">;
export type MioCompito = Pick<
  Tables<"hub_compiti">,
  "id" | "titolo" | "stato" | "scadenza" | "link_utile" | "assegnato_a" | "ordine"
>;
export interface MiaBoard {
  id: string;
  call_n: number;
  hub_compiti: MioCompito[];
}

/** Riga `clienti` del cliente loggato (hub Notion, fase, prossima call). */
export function useMioCliente(clienteId: string | undefined) {
  return useQuery({
    queryKey: ["area", "cliente", clienteId ?? ""],
    enabled: !!clienteId,
    queryFn: async (): Promise<MioCliente | null> => {
      const { data, error } = await supabase
        .from("clienti")
        .select("id, fase, stato_onboarding, notion_hub_url, hub_creato_il, prossima_call")
        .eq("id", clienteId ?? "")
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

/** Call Fathom del cliente loggato, dalla più recente. */
export function useMieChiamate(clienteId: string | undefined) {
  return useQuery({
    queryKey: ["area", "chiamate", clienteId ?? ""],
    enabled: !!clienteId,
    queryFn: async (): Promise<MiaChiamata[]> => {
      const { data, error } = await supabase
        .from("chiamate")
        .select("id, titolo, registrata_il, riassunto, share_url")
        .eq("cliente_id", clienteId ?? "")
        .order("registrata_il", { ascending: false, nullsFirst: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

/** Board dell'hub (0 = to-do, 1..4 = call) con i compiti del cliente loggato. */
export function useMieiCompiti(clienteId: string | undefined) {
  return useQuery({
    queryKey: ["area", "compiti", clienteId ?? ""],
    enabled: !!clienteId,
    queryFn: async (): Promise<MiaBoard[]> => {
      const { data, error } = await supabase
        .from("hub_board")
        .select("id, call_n, hub_compiti(id, titolo, stato, scadenza, link_utile, assegnato_a, ordine)")
        .eq("cliente_id", clienteId ?? "")
        .order("call_n");
      if (error) throw error;
      return (data ?? []).map((b) => ({
        ...b,
        hub_compiti: [...b.hub_compiti].sort((a, c) => a.ordine - c.ordine),
      }));
    },
  });
}
