import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { logDev, MESSAGGIO_ERRORE_GENERICO } from "@/shared/utils/errors";
import { conPrezzoNumerico, type Offerta } from "../types";

export const chiaviOfferte = { lista: ["offerte"] as const };

/** Tutte le offerte, le attive per prime. */
export function useOfferte() {
  return useQuery({
    queryKey: chiaviOfferte.lista,
    queryFn: async (): Promise<Offerta[]> => {
      const { data, error } = await supabase.from("offerte").select("*").order("attiva", { ascending: false }).order("created_at");
      if (error) throw error;
      return (data ?? []).map(conPrezzoNumerico);
    },
  });
}

function erroreOfferta(titolo: string) {
  return (error: unknown) => {
    toast.error(titolo, { description: MESSAGGIO_ERRORE_GENERICO });
    logDev(error);
  };
}

export interface NuovaOfferta {
  nome: string;
  modello: string;
  prezzo: number;
}

export function useCreaOfferta() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: NuovaOfferta) => {
      const { error } = await supabase.from("offerte").insert(input);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Offerta creata");
      void queryClient.invalidateQueries({ queryKey: chiaviOfferte.lista });
    },
    onError: erroreOfferta("Offerta non salvata"),
  });
}

export interface ModificaOfferta {
  id: string;
  nome: string;
  prezzo: number;
  attiva: boolean;
}

/** Cambia nome, prezzo o stato di un'offerta. Gli inviti già creati non cambiano. */
export function useAggiornaOfferta() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...campi }: ModificaOfferta) => {
      const { error } = await supabase.from("offerte").update(campi).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Offerta salvata");
      void queryClient.invalidateQueries({ queryKey: chiaviOfferte.lista });
    },
    onError: erroreOfferta("Offerta non salvata"),
  });
}

export function useEliminaOfferta() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("offerte").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Offerta eliminata");
      void queryClient.invalidateQueries({ queryKey: chiaviOfferte.lista });
    },
    onError: erroreOfferta("Offerta non eliminata"),
  });
}
