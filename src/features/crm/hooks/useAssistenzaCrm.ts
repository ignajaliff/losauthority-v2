import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { erroreMutation } from "@/shared/utils/invocaEdge";
import type { Database, Tables } from "@/integrations/supabase/types";

export type AccessoAssistenza = Tables<"crm_accessi_assistenza">;
export type ContattoAssistenza = Database["public"]["Functions"]["crm_contatti_assistenza"]["Returns"][number];

/** Un'accettazione del cliente (le righe dello stesso clic raggruppate). */
export interface AccettazioneCliente {
  versione: number;
  accettatoIl: string;
}

export const chiaviAssistenzaCrm = {
  accettazioni: (clienteId: string) => ["crm", "assistenza", "accettazioni", clienteId] as const,
  accessi: (clienteId: string) => ["crm", "assistenza", "accessi", clienteId] as const,
  versioneInVigore: ["crm", "assistenza", "versione"] as const,
};

/** Per il team: quando il cliente ha accettato i documenti e quale versione (nessun contatto). */
export function useAccettazioniCliente(clienteId: string) {
  return useQuery({
    queryKey: chiaviAssistenzaCrm.accettazioni(clienteId),
    queryFn: async (): Promise<AccettazioneCliente[]> => {
      const { data, error } = await supabase
        .from("crm_accettazioni")
        .select("accettazione_id, versione, accettato_il")
        .eq("user_id", clienteId)
        .order("accettato_il", { ascending: false });
      if (error) throw error;
      const perClic = new Map<string, AccettazioneCliente>();
      for (const r of data ?? []) if (!perClic.has(r.accettazione_id)) perClic.set(r.accettazione_id, { versione: r.versione, accettatoIl: r.accettato_il });
      return [...perClic.values()];
    },
  });
}

/** La versione dei documenti in vigore oggi (per dire se l'accettazione del cliente è ancora valida). */
export function useVersioneInVigoreCrm() {
  return useQuery({
    queryKey: chiaviAssistenzaCrm.versioneInVigore,
    queryFn: async (): Promise<number | null> => {
      const { data, error } = await supabase
        .from("crm_versioni")
        .select("versione")
        .lte("efficace_dal", new Date().toISOString())
        .order("versione", { ascending: false })
        .limit(1);
      if (error) throw error;
      return data?.[0]?.versione ?? null;
    },
  });
}

/** Registro degli accessi del team ai contatti del cliente, dal più recente. */
export function useAccessiAssistenza(clienteId: string) {
  return useQuery({
    queryKey: chiaviAssistenzaCrm.accessi(clienteId),
    queryFn: async (): Promise<AccessoAssistenza[]> => {
      const { data, error } = await supabase
        .from("crm_accessi_assistenza")
        .select("*")
        .eq("cliente_id", clienteId)
        .order("accesso_il", { ascending: false })
        .limit(20);
      if (error) throw error;
      return data ?? [];
    },
  });
}

/**
 * Apre i contatti del cliente in sola lettura: il database registra prima l'accesso
 * (chi, quando, perché). È una mutation, non una query: i contatti non restano nella cache.
 */
export function useContattiAssistenza(clienteId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (motivo: string): Promise<ContattoAssistenza[]> => {
      const { data, error } = await supabase.rpc("crm_contatti_assistenza", { p_cliente: clienteId, p_motivo: motivo });
      if (error) throw error;
      return data ?? [];
    },
    onError: erroreMutation("Impossibile aprire i contatti"),
    onSettled: () => void queryClient.invalidateQueries({ queryKey: chiaviAssistenzaCrm.accessi(clienteId) }),
  });
}
