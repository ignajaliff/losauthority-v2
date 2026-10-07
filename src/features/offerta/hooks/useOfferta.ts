import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { logDev, MESSAGGIO_ERRORE_GENERICO } from "@/shared/utils/errors";
import { erroreMutation, invocaEdge } from "@/shared/utils/invocaEdge";
import type { DiagnosiOfferta, MessaggioOfferta, Offerta } from "../types";

export const chiaviOfferta = {
  lista: (clienteId: string) => ["offerta", "lista", clienteId] as const,
  una: (id: string) => ["offerta", "una", id] as const,
  messaggi: (id: string) => ["offerta", "messaggi", id] as const,
  diagnosi: (id: string) => ["offerta", "diagnosi", id] as const,
};

/** La diagnosi per Wesley di un'offerta (solo team: per il cliente la RLS non restituisce righe → null). */
export function useDiagnosiOfferta(offertaId: string | undefined) {
  return useQuery({
    queryKey: chiaviOfferta.diagnosi(offertaId ?? ""),
    enabled: !!offertaId,
    queryFn: async (): Promise<DiagnosiOfferta | null> => {
      const { data, error } = await supabase.from("offerta_diagnosi").select("*").eq("offerta_id", offertaId ?? "").maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

/** Tutte le offerte del cliente, dalla prima creata: la posizione dà il numero di serie sulla carta. */
export function useOfferte(clienteId: string | undefined) {
  return useQuery({
    queryKey: chiaviOfferta.lista(clienteId ?? ""),
    enabled: !!clienteId,
    queryFn: async (): Promise<Offerta[]> => {
      const { data, error } = await supabase.from("offerta").select("*").eq("cliente_id", clienteId ?? "").order("created_at");
      if (error) throw error;
      return data ?? [];
    },
  });
}

/** Un'offerta; con `attiva` (Aura sta scrivendo) si ricarica ogni 2,5 s così la carta si compila sotto gli occhi. */
export function useOfferta(id: string | undefined, attiva = false) {
  return useQuery({
    queryKey: chiaviOfferta.una(id ?? ""),
    enabled: !!id,
    refetchInterval: attiva ? 2500 : false,
    queryFn: async (): Promise<Offerta | null> => {
      const { data, error } = await supabase.from("offerta").select("*").eq("id", id ?? "").maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

/** La conversazione di un'offerta. Si aggiorna da sola finché Aura sta scrivendo. */
export function useMessaggiOfferta(offertaId: string | undefined) {
  return useQuery({
    queryKey: chiaviOfferta.messaggi(offertaId ?? ""),
    enabled: !!offertaId,
    refetchInterval: (query) => (query.state.data?.some((m) => m.stato === "in_corso") ? 2500 : false),
    queryFn: async (): Promise<MessaggioOfferta[]> => {
      const { data, error } = await supabase.from("offerta_messaggi").select("*").eq("offerta_id", offertaId ?? "").order("created_at");
      if (error) throw error;
      return data ?? [];
    },
  });
}

/** Nuova offerta: la Edge Function crea la riga e il primo messaggio di Aura, poi si va alla conversazione. */
export function useCreaOfferta(clienteId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => invocaEdge<{ offerta_id: string }>("aura-offerta", { azione: "crea" }),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: chiaviOfferta.lista(clienteId) }),
    onError: erroreMutation("Aura non è riuscita a creare l'offerta"),
  });
}

interface RispostaOfferta {
  messaggio_id: string;
  risposta: string;
  offerta: Offerta;
}

type InvioInput = { messaggio: string } | { riprovaId: string };

/** Un turno con Aura (Edge Function aura-offerta) o la riprova di una risposta in errore. */
export function useInviaOfferta(offertaId: string, clienteId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: InvioInput): Promise<RispostaOfferta> => {
      const body = "riprovaId" in input ? { riprova_messaggio_id: input.riprovaId } : { offerta_id: offertaId, messaggio: input.messaggio };
      return invocaEdge<RispostaOfferta>("aura-offerta", body);
    },
    onSuccess: (r) => {
      // Il brindisi solo quando l'offerta DIVENTA completa, non a ogni correzione successiva.
      const prima = queryClient.getQueryData<Offerta | null>(chiaviOfferta.una(offertaId));
      queryClient.setQueryData(chiaviOfferta.una(offertaId), r.offerta);
      if (r.offerta.stato === "completo" && prima?.stato !== "completo") {
        toast.success("Offerta completa", { description: `${r.offerta.nome ?? "La tua offerta"} è sulla carta: puoi scaricarla in PDF.` });
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: chiaviOfferta.messaggi(offertaId) });
      void queryClient.invalidateQueries({ queryKey: chiaviOfferta.una(offertaId) });
      void queryClient.invalidateQueries({ queryKey: chiaviOfferta.lista(clienteId) });
    },
    onError: erroreMutation("Aura non ha risposto"),
  });
}

/** Elimina un'offerta e la sua conversazione (on delete cascade). */
export function useEliminaOfferta(clienteId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("offerta").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Offerta eliminata");
      void queryClient.invalidateQueries({ queryKey: chiaviOfferta.lista(clienteId) });
    },
    onError: (error) => {
      toast.error("Offerta non eliminata", { description: MESSAGGIO_ERRORE_GENERICO });
      logDev(error);
    },
  });
}
