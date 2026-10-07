import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { logDev, MESSAGGIO_ERRORE_GENERICO } from "@/shared/utils/errors";
import { ETICHETTA_STATO_LEAD, type LeadCrm, type LeadCrmDati, type StatoLead } from "../types";

export const chiaviCrm = {
  lead: (clienteId: string) => ["crm", "lead", clienteId] as const,
  arrivi: (clienteId: string) => ["crm", "arrivi", clienteId] as const,
  stato: (clienteId: string) => ["crm", "stato", clienteId] as const,
  documenti: ["crm", "documenti"] as const,
};

/**
 * I contatti del cliente, dal più recente (giorno di arrivo, poi creazione).
 * Senza un'accettazione valida dei documenti la RLS non restituisce niente.
 */
export function useLeadCrm(clienteId: string | undefined) {
  return useQuery({
    queryKey: chiaviCrm.lead(clienteId ?? ""),
    enabled: !!clienteId,
    queryFn: async (): Promise<LeadCrm[]> => {
      const { data, error } = await supabase
        .from("crm_lead")
        .select("*")
        .eq("cliente_id", clienteId ?? "")
        .order("arrivato_il", { ascending: false })
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

/** Solo i giorni di arrivo (per la linea dei lead nel grafico di Pubblicazioni): niente nomi né recapiti. */
export function useArriviLead(clienteId: string | undefined) {
  return useQuery({
    queryKey: chiaviCrm.arrivi(clienteId ?? ""),
    enabled: !!clienteId,
    queryFn: async (): Promise<string[]> => {
      const { data, error } = await supabase.from("crm_lead").select("arrivato_il").eq("cliente_id", clienteId ?? "");
      if (error) throw error;
      return (data ?? []).map((r) => r.arrivato_il);
    },
  });
}

/** Dopo ogni modifica dei contatti: tabella e grafico di Pubblicazioni. */
function useInvalidaContatti(clienteId: string) {
  const queryClient = useQueryClient();
  return () => {
    void queryClient.invalidateQueries({ queryKey: chiaviCrm.lead(clienteId) });
    void queryClient.invalidateQueries({ queryKey: chiaviCrm.arrivi(clienteId) });
  };
}

interface SalvaLeadCrmInput {
  /** Senza id → nuovo contatto. */
  id?: string;
  dati: LeadCrmDati;
}

/** Crea o aggiorna un contatto del cliente. */
export function useSalvaLeadCrm(clienteId: string) {
  const invalida = useInvalidaContatti(clienteId);
  return useMutation({
    mutationFn: async ({ id, dati }: SalvaLeadCrmInput) => {
      const { error } = id
        ? await supabase.from("crm_lead").update(dati).eq("id", id)
        : await supabase.from("crm_lead").insert({ ...dati, cliente_id: clienteId });
      if (error) throw error;
    },
    onSuccess: (_, { id }) => toast.success(id ? "Contatto aggiornato" : "Contatto aggiunto"),
    onError: (error) => {
      toast.error("Impossibile salvare il contatto", { description: MESSAGGIO_ERRORE_GENERICO });
      logDev(error);
    },
    onSettled: invalida,
  });
}

interface CambiaStatoInput {
  id: string;
  stato: StatoLead;
}

/** Cambia lo stato dalla tabella, subito a schermo (ottimistico). */
export function useCambiaStatoLeadCrm(clienteId: string) {
  const queryClient = useQueryClient();
  const chiave = chiaviCrm.lead(clienteId);
  return useMutation({
    mutationFn: async ({ id, stato }: CambiaStatoInput) => {
      const { error } = await supabase.from("crm_lead").update({ stato }).eq("id", id);
      if (error) throw error;
    },
    onMutate: async ({ id, stato }) => {
      await queryClient.cancelQueries({ queryKey: chiave });
      const precedenti = queryClient.getQueryData<LeadCrm[]>(chiave);
      // Il valore esiste solo per i chiusi (lo azzera anche il trigger).
      queryClient.setQueryData<LeadCrm[]>(chiave, (attuali) =>
        attuali?.map((l) => (l.id === id ? { ...l, stato, valore: stato === "chiuso" ? l.valore : null } : l)),
      );
      return { precedenti };
    },
    onSuccess: (_, { stato }) => toast.success(`Contatto segnato come «${ETICHETTA_STATO_LEAD[stato]}»`),
    onError: (error, _, contesto) => {
      if (contesto?.precedenti) queryClient.setQueryData(chiave, contesto.precedenti);
      toast.error("Impossibile cambiare lo stato", { description: MESSAGGIO_ERRORE_GENERICO });
      logDev(error);
    },
    onSettled: () => void queryClient.invalidateQueries({ queryKey: chiave }),
  });
}

/** Elimina davvero un contatto (anche dal grafico di Pubblicazioni). */
export function useEliminaLeadCrm(clienteId: string) {
  const invalida = useInvalidaContatti(clienteId);
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("crm_lead").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => toast.success("Contatto eliminato"),
    onError: (error) => {
      toast.error("Impossibile eliminare il contatto", { description: MESSAGGIO_ERRORE_GENERICO });
      logDev(error);
    },
    onSettled: invalida,
  });
}
