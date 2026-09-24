import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { ErroreEdge, invocaEdge, messaggioErrore } from "@/shared/utils/invocaEdge";
import { logDev, MESSAGGIO_ERRORE_GENERICO } from "@/shared/utils/errors";
import type { CallNumero, RispostaCompiti, RispostaRiassunto } from "../types";
import { CHIAVI_CHIAMATE } from "./chiavi";

export { ErroreEdge };

/** Descrizione per il toast: il messaggio della Edge Function se c'è, altrimenti quello generico. */
export const descrizioneErrore = messaggioErrore;

function invalidaChiamate(queryClient: ReturnType<typeof useQueryClient>, clienteId: string | null) {
  if (clienteId) void queryClient.invalidateQueries({ queryKey: CHIAVI_CHIAMATE.cliente(clienteId) });
  else void queryClient.invalidateQueries({ queryKey: CHIAVI_CHIAMATE.nonAssegnate });
}

export function useAggiornaTitoloChiamata() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { id: string; clienteId: string | null; titolo: string }) => {
      const { error } = await supabase.from("chiamate").update({ titolo: input.titolo }).eq("id", input.id);
      if (error) throw error;
      return input;
    },
    onSuccess: (input) => {
      toast.success("Titolo aggiornato");
      invalidaChiamate(queryClient, input.clienteId);
    },
    onError: (error) => {
      toast.error("Titolo non salvato", { description: MESSAGGIO_ERRORE_GENERICO });
      logDev(error);
    },
  });
}

export function useEliminaChiamata() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { id: string; clienteId: string | null }) => {
      const { error } = await supabase.from("chiamate").delete().eq("id", input.id);
      if (error) throw error;
      return input;
    },
    onSuccess: (input) => {
      toast.success("Call eliminata");
      invalidaChiamate(queryClient, input.clienteId);
    },
    onError: (error) => {
      toast.error("Call non eliminata", { description: MESSAGGIO_ERRORE_GENERICO });
      logDev(error);
    },
  });
}

/** Assegna una call senza cliente a un cliente. */
export function useAssegnaChiamata() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { id: string; clienteId: string }) => {
      const { error } = await supabase
        .from("chiamate")
        .update({ cliente_id: input.clienteId })
        .eq("id", input.id);
      if (error) throw error;
      return input;
    },
    onSuccess: (input) => {
      toast.success("Call assegnata al cliente");
      void queryClient.invalidateQueries({ queryKey: CHIAVI_CHIAMATE.nonAssegnate });
      void queryClient.invalidateQueries({ queryKey: CHIAVI_CHIAMATE.cliente(input.clienteId) });
      void queryClient.invalidateQueries({ queryKey: ["clienti"] });
    },
    onError: (error) => {
      toast.error("Call non assegnata", { description: MESSAGGIO_ERRORE_GENERICO });
      logDev(error);
    },
  });
}

/** Spunta / toglie la spunta a un action item. */
export function useToggleAzioneChiamata(chiamataId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { id: string; completata: boolean }) => {
      const { error } = await supabase
        .from("chiamate_azioni")
        .update({ completata: input.completata })
        .eq("id", input.id);
      if (error) throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: CHIAVI_CHIAMATE.azioni(chiamataId) });
    },
    onError: (error) => {
      toast.error("Azione non aggiornata", { description: MESSAGGIO_ERRORE_GENERICO });
      logDev(error);
    },
  });
}

/** Scarica da Fathom e traduce il riassunto (Edge Function `fathom-riassunto`). */
export function useScaricaRiassunto(clienteId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { chiamataId: string }) =>
      invocaEdge<RispostaRiassunto>("fathom-riassunto", { chiamata_id: input.chiamataId }),
    onSuccess: () => {
      toast.success("Riassunto scaricato e tradotto");
      invalidaChiamate(queryClient, clienteId);
    },
    onError: (error) => {
      toast.error("Riassunto non scaricato", { description: descrizioneErrore(error) });
      logDev(error);
    },
  });
}

/** Aura scrive i compiti sulla board Notion (Edge Function `aura-compiti`). */
export function useGeneraCompiti() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { chiamataId: string; callN: CallNumero }) =>
      invocaEdge<RispostaCompiti>("aura-compiti", { chiamata_id: input.chiamataId, call_n: input.callN }),
    onSuccess: (dati) => {
      toast.success(`Compiti scritti su Notion: ${dati.scritti}`);
      void queryClient.invalidateQueries({ queryKey: ["clienti"] });
    },
    onError: (error) => {
      toast.error("Compiti non generati", { description: descrizioneErrore(error) });
      logDev(error);
    },
  });
}
