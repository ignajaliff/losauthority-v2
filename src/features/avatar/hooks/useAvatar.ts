import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { logDev, MESSAGGIO_ERRORE_GENERICO } from "@/shared/utils/errors";
import { erroreMutation, invocaEdge } from "@/shared/utils/invocaEdge";
import type { Avatar, DiagnosiAvatar, MessaggioAvatar } from "../types";

export const chiaviAvatar = {
  lista: (clienteId: string) => ["avatar", "lista", clienteId] as const,
  uno: (id: string) => ["avatar", "uno", id] as const,
  messaggi: (id: string) => ["avatar", "messaggi", id] as const,
  diagnosi: (id: string) => ["avatar", "diagnosi", id] as const,
};

/** La diagnosi per Wesley di un avatar (solo team: per il cliente la RLS non restituisce righe → null). */
export function useDiagnosiAvatar(avatarId: string | undefined) {
  return useQuery({
    queryKey: chiaviAvatar.diagnosi(avatarId ?? ""),
    enabled: !!avatarId,
    queryFn: async (): Promise<DiagnosiAvatar | null> => {
      const { data, error } = await supabase.from("avatar_diagnosi").select("*").eq("avatar_id", avatarId ?? "").maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

/** Tutti gli avatar del cliente, dal primo creato: la posizione dà il numero di serie sulla carta. */
export function useAvatars(clienteId: string | undefined) {
  return useQuery({
    queryKey: chiaviAvatar.lista(clienteId ?? ""),
    enabled: !!clienteId,
    queryFn: async (): Promise<Avatar[]> => {
      const { data, error } = await supabase.from("avatar").select("*").eq("cliente_id", clienteId ?? "").order("created_at");
      if (error) throw error;
      return data ?? [];
    },
  });
}

/** Un avatar; con `attivo` (Aura sta scrivendo) si ricarica ogni 2,5 s così la carta si compila sotto gli occhi. */
export function useAvatar(id: string | undefined, attivo = false) {
  return useQuery({
    queryKey: chiaviAvatar.uno(id ?? ""),
    enabled: !!id,
    refetchInterval: attivo ? 2500 : false,
    queryFn: async (): Promise<Avatar | null> => {
      const { data, error } = await supabase.from("avatar").select("*").eq("id", id ?? "").maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

/** La conversazione di un avatar. Si aggiorna da sola finché Aura sta scrivendo. */
export function useMessaggiAvatar(avatarId: string | undefined) {
  return useQuery({
    queryKey: chiaviAvatar.messaggi(avatarId ?? ""),
    enabled: !!avatarId,
    refetchInterval: (query) => (query.state.data?.some((m) => m.stato === "in_corso") ? 2500 : false),
    queryFn: async (): Promise<MessaggioAvatar[]> => {
      const { data, error } = await supabase.from("avatar_messaggi").select("*").eq("avatar_id", avatarId ?? "").order("created_at");
      if (error) throw error;
      return data ?? [];
    },
  });
}

/** Nuovo avatar: la Edge Function crea la riga e il primo messaggio di Aura, poi si va alla conversazione. */
export function useCreaAvatar(clienteId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => invocaEdge<{ avatar_id: string }>("aura-avatar", { azione: "crea" }),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: chiaviAvatar.lista(clienteId) }),
    onError: erroreMutation("Aura non è riuscita a creare l'avatar"),
  });
}

interface RispostaAvatar {
  messaggio_id: string;
  risposta: string;
  avatar: Avatar;
}

type InvioInput = { messaggio: string } | { riprovaId: string };

/** Un turno con Aura (Edge Function aura-avatar) o la riprova di una risposta in errore. */
export function useInviaAvatar(avatarId: string, clienteId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: InvioInput): Promise<RispostaAvatar> => {
      const body = "riprovaId" in input ? { riprova_messaggio_id: input.riprovaId } : { avatar_id: avatarId, messaggio: input.messaggio };
      return invocaEdge<RispostaAvatar>("aura-avatar", body);
    },
    onSuccess: (r) => {
      // Il brindisi solo quando l'avatar DIVENTA completo, non a ogni correzione successiva.
      const prima = queryClient.getQueryData<Avatar | null>(chiaviAvatar.uno(avatarId));
      queryClient.setQueryData(chiaviAvatar.uno(avatarId), r.avatar);
      if (r.avatar.stato === "completo" && prima?.stato !== "completo") {
        toast.success("Avatar completo", { description: `${r.avatar.nome ?? "Il tuo cliente ideale"} è sulla carta.` });
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: chiaviAvatar.messaggi(avatarId) });
      void queryClient.invalidateQueries({ queryKey: chiaviAvatar.uno(avatarId) });
      void queryClient.invalidateQueries({ queryKey: chiaviAvatar.lista(clienteId) });
    },
    onError: erroreMutation("Aura non ha risposto"),
  });
}

/** Elimina un avatar e la sua conversazione (on delete cascade). */
export function useEliminaAvatar(clienteId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("avatar").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Avatar eliminato");
      void queryClient.invalidateQueries({ queryKey: chiaviAvatar.lista(clienteId) });
    },
    onError: (error) => {
      toast.error("Avatar non eliminato", { description: MESSAGGIO_ERRORE_GENERICO });
      logDev(error);
    },
  });
}
