import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Chiamata, ChiamataAzione, ClienteOpzione } from "../types";
import { CHIAVI_CHIAMATE } from "./chiavi";

export { CHIAVI_CHIAMATE };

/** Call del cliente, dalla più recente. */
export function useChiamateCliente(clienteId: string) {
  return useQuery({
    queryKey: CHIAVI_CHIAMATE.cliente(clienteId),
    enabled: !!clienteId,
    queryFn: async (): Promise<Chiamata[]> => {
      const { data, error } = await supabase
        .from("chiamate")
        .select("*")
        .eq("cliente_id", clienteId)
        .order("registrata_il", { ascending: false, nullsFirst: false });
      if (error) throw error;
      return data;
    },
  });
}

/** Call arrivate da Fathom senza cliente abbinato (le vede tutto il team). */
export function useChiamateNonAssegnate() {
  return useQuery({
    queryKey: CHIAVI_CHIAMATE.nonAssegnate,
    queryFn: async (): Promise<Chiamata[]> => {
      const { data, error } = await supabase
        .from("chiamate")
        .select("*")
        .is("cliente_id", null)
        .order("registrata_il", { ascending: false, nullsFirst: false });
      if (error) throw error;
      return data;
    },
  });
}

/** Action items di una call, in ordine. */
export function useAzioniChiamata(chiamataId: string) {
  return useQuery({
    queryKey: CHIAVI_CHIAMATE.azioni(chiamataId),
    queryFn: async (): Promise<ChiamataAzione[]> => {
      const { data, error } = await supabase
        .from("chiamate_azioni")
        .select("*")
        .eq("chiamata_id", chiamataId)
        .order("ordine", { ascending: true });
      if (error) throw error;
      return data;
    },
  });
}

/** Fase attuale del cliente (per proporre la call di destinazione dei compiti). */
export function useFaseCliente(clienteId: string) {
  return useQuery({
    queryKey: CHIAVI_CHIAMATE.faseCliente(clienteId),
    enabled: !!clienteId,
    queryFn: async (): Promise<string | null> => {
      const { data, error } = await supabase
        .from("clienti")
        .select("fase")
        .eq("id", clienteId)
        .maybeSingle();
      if (error) throw error;
      return data?.fase ?? null;
    },
  });
}

/** Clienti (id + nome) per il select di assegnazione. */
export function useClientiOpzioni() {
  return useQuery({
    queryKey: CHIAVI_CHIAMATE.clientiOpzioni,
    queryFn: async (): Promise<ClienteOpzione[]> => {
      const { data, error } = await supabase
        .from("vista_clienti")
        .select("id, nombre")
        .order("nombre", { ascending: true });
      if (error) throw error;
      return data.flatMap((r) =>
        r.id && r.nombre ? [{ id: r.id, nombre: r.nombre }] : [],
      );
    },
  });
}

export {
  useAggiornaTitoloChiamata,
  useEliminaChiamata,
  useAssegnaChiamata,
  useToggleAzioneChiamata,
  useScaricaRiassunto,
  useGeneraCompiti,
  descrizioneErrore,
} from "./useChiamateMutazioni";
