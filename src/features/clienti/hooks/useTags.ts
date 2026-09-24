import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { logDev, MESSAGGIO_ERRORE_GENERICO } from "@/shared/utils/errors";
import type { Tag } from "../types";
import { chiaviTag } from "./chiavi";

/** Tag riutilizzabili, in ordine alfabetico. */
export function useTags() {
  return useQuery({
    queryKey: chiaviTag.lista,
    queryFn: async (): Promise<Tag[]> => {
      const { data, error } = await supabase.from("tags").select("id, label").order("label");
      if (error) throw error;
      return data;
    },
  });
}

/**
 * Crea un tag al volo (o ritorna quello esistente con la stessa etichetta).
 * Niente toast: lo usa chi lo chiama dentro un flusso più grande.
 */
export function useCreaTag() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (label: string): Promise<Tag> => {
      const pulito = label.trim();
      const esistente = await supabase.from("tags").select("id, label").ilike("label", pulito).maybeSingle();
      if (esistente.error) throw esistente.error;
      if (esistente.data) return esistente.data;
      const { data, error } = await supabase.from("tags").insert({ label: pulito }).select("id, label").single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: chiaviTag.tutti });
    },
    onError: (error) => {
      toast.error("Tag non creato", { description: MESSAGGIO_ERRORE_GENERICO });
      logDev(error);
    },
  });
}
