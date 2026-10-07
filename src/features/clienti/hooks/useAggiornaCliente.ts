import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { TablesUpdate } from "@/integrations/supabase/types";
import { logDev, MESSAGGIO_ERRORE_GENERICO } from "@/shared/utils/errors";
import { ErroreEdge, invocaEdge, messaggioErrore } from "../invocaEdge";
import { chiaviClienti } from "./chiavi";

/** Aggiorna una o più colonne di `clienti` (dati, fase, stato, hub url…). */
export function useAggiornaCliente(clienteId: string, messaggio = "Modifiche salvate") {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (patch: TablesUpdate<"clienti">) => {
      const { error } = await supabase.from("clienti").update(patch).eq("id", clienteId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(messaggio);
      void queryClient.invalidateQueries({ queryKey: chiaviClienti.tutti });
    },
    onError: (error) => {
      toast.error("Modifiche non salvate", { description: MESSAGGIO_ERRORE_GENERICO });
      logDev(error);
    },
  });
}

/** Salva l'insieme di label scelte in `clienti.tags`. */
export function useAggiornaTagCliente(clienteId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (tags: string[]) => {
      const { error } = await supabase.from("clienti").update({ tags: [...new Set(tags)] }).eq("id", clienteId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Tag aggiornati");
      void queryClient.invalidateQueries({ queryKey: chiaviClienti.tutti });
    },
    onError: (error) => {
      toast.error("Tag non aggiornati", { description: MESSAGGIO_ERRORE_GENERICO });
      logDev(error);
    },
  });
}

interface RispostaHub {
  ok: true;
  esiti: Array<{ cliente_id: string; ok: boolean; hub_url?: string; errore?: string }>;
}

/** "Crea hub adesso": Aura scrive i 5 documenti nel foglio Notion del cliente. */
export function useCreaHub(clienteId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const r = await invocaEdge<RispostaHub>("genera-hub", { cliente_id: clienteId });
      const esito = r.esiti.find((e) => e.cliente_id === clienteId) ?? r.esiti[0];
      if (!esito?.ok) throw new ErroreEdge(esito?.errore ?? "Creazione hub non riuscita.");
      return esito;
    },
    onSuccess: () => {
      toast.success("Hub creato", { description: "Lo trovi nel contenitore Notion del cliente." });
      void queryClient.invalidateQueries({ queryKey: chiaviClienti.tutti });
    },
    onError: (error) => {
      toast.error("Hub non creato", { description: messaggioErrore(error) });
      logDev(error);
    },
  });
}
