import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { logDev, MESSAGGIO_ERRORE_GENERICO } from "@/shared/utils/errors";
import type { NotaCliente } from "../types";
import { chiaviClienti } from "./chiavi";

/** Note interne del team su un cliente (più recenti prima). */
export function useNoteCliente(clienteId: string) {
  return useQuery({
    queryKey: chiaviClienti.note(clienteId),
    queryFn: async (): Promise<NotaCliente[]> => {
      const { data, error } = await supabase
        .from("note_clienti")
        .select("id, testo, created_at, autore_id, autore:user_roles(nombre)")
        .eq("cliente_id", clienteId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function useAggiungiNota(clienteId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ testo, autoreId }: { testo: string; autoreId: string }) => {
      const { error } = await supabase
        .from("note_clienti")
        .insert({ cliente_id: clienteId, testo, autore_id: autoreId });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Nota aggiunta");
      void queryClient.invalidateQueries({ queryKey: chiaviClienti.note(clienteId) });
    },
    onError: (error) => {
      toast.error("Nota non salvata", { description: MESSAGGIO_ERRORE_GENERICO });
      logDev(error);
    },
  });
}

export function useEliminaNota(clienteId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (notaId: string) => {
      const { error } = await supabase.from("note_clienti").delete().eq("id", notaId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Nota eliminata");
      void queryClient.invalidateQueries({ queryKey: chiaviClienti.note(clienteId) });
    },
    onError: (error) => {
      toast.error("Nota non eliminata", { description: MESSAGGIO_ERRORE_GENERICO });
      logDev(error);
    },
  });
}
