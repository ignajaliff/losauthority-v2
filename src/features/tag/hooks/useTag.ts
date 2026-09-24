import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { logDev, MESSAGGIO_ERRORE_GENERICO } from "@/shared/utils/errors";
import type { TagConConteggio } from "../types";

/** Chiave condivisa: il dominio clienti la invalida quando crea un tag al volo. */
export const CHIAVE_TAG = ["tag", "lista"] as const;
/** I clienti mostrano le label dei tag: dopo rinomina/elimina vanno ricaricati. */
const CHIAVE_CLIENTI = ["clienti"] as const;

const CODICE_DUPLICATO = "23505";

function eDuplicato(error: unknown): boolean {
  return typeof error === "object" && error !== null && "code" in error && error.code === CODICE_DUPLICATO;
}

/** Tutti i tag in ordine alfabetico, con il numero di clienti che li usano. */
export function useTags() {
  return useQuery({
    queryKey: CHIAVE_TAG,
    queryFn: async (): Promise<TagConConteggio[]> => {
      const { data, error } = await supabase
        .from("tags")
        .select("id, label, created_at, updated_at, clienti_tags(count)")
        .order("label", { ascending: true });
      if (error) throw error;
      return data.map(({ clienti_tags, ...tag }) => ({ ...tag, clienti: clienti_tags[0]?.count ?? 0 }));
    },
  });
}

export function useCreaTag() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (label: string) => {
      const { error } = await supabase.from("tags").insert({ label });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Tag aggiunto");
      void queryClient.invalidateQueries({ queryKey: CHIAVE_TAG });
    },
    onError: (error) => {
      toast.error("Impossibile aggiungere il tag", {
        description: eDuplicato(error) ? "Esiste già un tag con questo nome." : MESSAGGIO_ERRORE_GENERICO,
      });
      logDev(error);
    },
  });
}

/** Rinomina: si aggiorna solo tags.label, la tabella ponte segue per FK. */
export function useRinominaTag() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, label }: { id: string; label: string }) => {
      const { error } = await supabase.from("tags").update({ label }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Tag rinominato");
      void queryClient.invalidateQueries({ queryKey: CHIAVE_TAG });
      void queryClient.invalidateQueries({ queryKey: CHIAVE_CLIENTI });
    },
    onError: (error) => {
      toast.error("Impossibile rinominare il tag", {
        description: eDuplicato(error) ? "Esiste già un tag con questo nome." : MESSAGGIO_ERRORE_GENERICO,
      });
      logDev(error);
    },
  });
}

/** Elimina il tag: clienti_tags ha ON DELETE CASCADE, i clienti lo perdono da soli. */
export function useEliminaTag() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("tags").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Tag eliminato");
      void queryClient.invalidateQueries({ queryKey: CHIAVE_TAG });
      void queryClient.invalidateQueries({ queryKey: CHIAVE_CLIENTI });
    },
    onError: (error) => {
      toast.error("Impossibile eliminare il tag", { description: MESSAGGIO_ERRORE_GENERICO });
      logDev(error);
    },
  });
}
