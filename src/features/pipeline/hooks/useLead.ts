import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { logDev, MESSAGGIO_ERRORE_GENERICO } from "@/shared/utils/errors";
import { stageLabel, type Lead, type LeadInsert, type LeadStage } from "../types";

export const CHIAVE_LEAD = ["pipeline", "lead"] as const;

/** Tutti i lead (RLS: solo team), i più aggiornati per primi. */
export function useLeads() {
  return useQuery({
    queryKey: CHIAVE_LEAD,
    queryFn: async (): Promise<Lead[]> => {
      const { data, error } = await supabase
        .from("lead")
        .select("*")
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return data.map((l) => ({ ...l, valore: Number(l.valore) || 0 }));
    },
  });
}

interface SalvaLeadInput {
  id?: string;
  dati: LeadInsert;
}

/** Crea (senza id) o aggiorna (con id) un lead. */
export function useSalvaLead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, dati }: SalvaLeadInput) => {
      const { error } = id
        ? await supabase.from("lead").update(dati).eq("id", id)
        : await supabase.from("lead").insert(dati);
      if (error) throw error;
    },
    onSuccess: (_, { id }) => {
      toast.success(id ? "Lead aggiornato" : "Lead creato");
      void queryClient.invalidateQueries({ queryKey: CHIAVE_LEAD });
    },
    onError: (error) => {
      toast.error("Impossibile salvare il lead", { description: MESSAGGIO_ERRORE_GENERICO });
      logDev(error);
    },
  });
}

interface SpostaLeadInput {
  id: string;
  stage: LeadStage;
}

/** Sposta un lead in un altro stage, con aggiornamento ottimistico della colonna. */
export function useSpostaLead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, stage }: SpostaLeadInput) => {
      const { error } = await supabase.from("lead").update({ stage }).eq("id", id);
      if (error) throw error;
    },
    onMutate: async ({ id, stage }) => {
      await queryClient.cancelQueries({ queryKey: CHIAVE_LEAD });
      const precedenti = queryClient.getQueryData<Lead[]>(CHIAVE_LEAD);
      queryClient.setQueryData<Lead[]>(CHIAVE_LEAD, (attuali) =>
        attuali?.map((l) => (l.id === id ? { ...l, stage } : l)),
      );
      return { precedenti };
    },
    onSuccess: (_, { stage }) => {
      toast.success(`Lead spostato in "${stageLabel(stage)}"`);
    },
    onError: (error, _, contesto) => {
      if (contesto?.precedenti) queryClient.setQueryData(CHIAVE_LEAD, contesto.precedenti);
      toast.error("Impossibile spostare il lead", { description: MESSAGGIO_ERRORE_GENERICO });
      logDev(error);
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: CHIAVE_LEAD });
    },
  });
}

/** Elimina un lead. */
export function useEliminaLead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("lead").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Lead eliminato");
      void queryClient.invalidateQueries({ queryKey: CHIAVE_LEAD });
    },
    onError: (error) => {
      toast.error("Impossibile eliminare il lead", { description: MESSAGGIO_ERRORE_GENERICO });
      logDev(error);
    },
  });
}
