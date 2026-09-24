import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { logDev } from "@/shared/utils/errors";
import { invocaEdge, messaggioErrore } from "../invocaEdge";
import type { HubBoardConCompiti } from "../types";
import { chiaviClienti } from "./chiavi";

/** Board dell'hub Notion del cliente (call 1..4 + to-do = 0) con i compiti. */
export function useHubCompiti(clienteId: string) {
  return useQuery({
    queryKey: chiaviClienti.hub(clienteId),
    queryFn: async (): Promise<HubBoardConCompiti[]> => {
      const { data, error } = await supabase
        .from("hub_board")
        .select("id, call_n, synced_at, compiti:hub_compiti(id, titolo, stato, assegnato_a, scadenza, link_utile, ordine)")
        .eq("cliente_id", clienteId)
        .order("call_n");
      if (error) throw error;
      return data.map((b) => ({
        ...b,
        compiti: [...b.compiti].sort((a, c) => a.ordine - c.ordine),
      }));
    },
  });
}

interface RispostaCompiti {
  ok: true;
  letti: number;
  errori: number;
}

/** "Aggiorna compiti": rilegge le board Notion di questo cliente. */
export function useAggiornaCompiti(clienteId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => invocaEdge<RispostaCompiti>("notion-compiti", { cliente_id: clienteId }),
    onSuccess: (r) => {
      if (r.errori > 0) toast.warning("Compiti aggiornati solo in parte", { description: "Alcune board non si sono lette." });
      else toast.success("Compiti aggiornati");
      // La sync può far avanzare la fase: invalida tutto il dominio.
      void queryClient.invalidateQueries({ queryKey: chiaviClienti.tutti });
    },
    onError: (error) => {
      toast.error("Compiti non aggiornati", { description: messaggioErrore(error) });
      logDev(error);
    },
  });
}
