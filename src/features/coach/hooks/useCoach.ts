import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { erroreMutation, invocaEdge } from "@/shared/utils/invocaEdge";
import type { CapitoloCoach, LezioneCoach, MessaggioCoach } from "../types";

export const chiaviCoach = {
  messaggi: (clienteId: string) => ["coach", clienteId, "messaggi"] as const,
  lezioni: (ids: string[]) => ["coach", "lezioni", ...ids] as const,
};

/** Tutta la conversazione del cliente con il coach. Si aggiorna da sola finché Aura sta scrivendo. */
export function useMessaggiCoach(clienteId: string | undefined) {
  return useQuery({
    queryKey: chiaviCoach.messaggi(clienteId ?? ""),
    enabled: !!clienteId,
    refetchInterval: (query) => (query.state.data?.some((m) => m.stato === "in_corso") ? 2500 : false),
    queryFn: async (): Promise<MessaggioCoach[]> => {
      const { data, error } = await supabase
        .from("coach_messaggi")
        .select("*")
        .eq("cliente_id", clienteId ?? "")
        .order("created_at");
      if (error) throw error;
      return data ?? [];
    },
  });
}

/** Le lezioni consigliate nella conversazione (una query sola per tutti gli id citati). */
export function useLezioniCoach(ids: string[]) {
  const ordinati = [...new Set(ids)].sort();
  return useQuery({
    queryKey: chiaviCoach.lezioni(ordinati),
    enabled: ordinati.length > 0,
    staleTime: 5 * 60 * 1000,
    queryFn: async (): Promise<LezioneCoach[]> => {
      const { data, error } = await supabase.from("lezioni").select("id, titolo, corso, url").in("id", ordinati);
      if (error) throw error;
      return data ?? [];
    },
  });
}

interface RispostaCoach {
  messaggio_id: string;
  risposta: string;
  lezioni: (LezioneCoach & { capitolo: CapitoloCoach | null })[];
}

type InvioInput = { messaggio: string } | { riprovaId: string };

/** Manda un messaggio al coach (Edge Function aura-coach) o riprova una risposta in errore. */
export function useInviaAlCoach(clienteId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: InvioInput): Promise<RispostaCoach> => {
      const body = "riprovaId" in input ? { riprova_messaggio_id: input.riprovaId } : { messaggio: input.messaggio };
      return invocaEdge<RispostaCoach>("aura-coach", body);
    },
    onSettled: () => void queryClient.invalidateQueries({ queryKey: chiaviCoach.messaggi(clienteId) }),
    onError: erroreMutation("Il coach non ha risposto"),
  });
}
