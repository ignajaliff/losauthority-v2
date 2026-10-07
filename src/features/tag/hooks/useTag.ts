import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { logDev, MESSAGGIO_ERRORE_GENERICO } from "@/shared/utils/errors";
import type { Tag, TagConConteggio } from "../types";

/** Unica fonte dei tag per tutta l'app (pagina Tag, scheda cliente, nuovo cliente). */
export const CHIAVE_TAG = ["tag", "lista"] as const;
/** I clienti mostrano le label dei tag: dopo rinomina/elimina vanno ricaricati. */
const CHIAVE_CLIENTI = ["clienti"] as const;

const CODICE_DUPLICATO = "23505";

function eDuplicato(error: unknown): boolean {
  return typeof error === "object" && error !== null && "code" in error && error.code === CODICE_DUPLICATO;
}

/** Tutti i tag in ordine alfabetico, con il numero di clienti che li hanno in `clienti.tags`. */
export function useTags() {
  return useQuery({
    queryKey: CHIAVE_TAG,
    queryFn: async (): Promise<TagConConteggio[]> => {
      const [tags, clienti] = await Promise.all([
        supabase.from("tags").select("id, label, created_at, updated_at").order("label", { ascending: true }),
        supabase.from("clienti").select("tags"),
      ]);
      if (tags.error) throw tags.error;
      if (clienti.error) throw clienti.error;
      const conteggio = new Map<string, number>();
      for (const c of clienti.data) {
        for (const label of c.tags) conteggio.set(label, (conteggio.get(label) ?? 0) + 1);
      }
      return tags.data.map((tag) => ({ ...tag, clienti: conteggio.get(tag.label) ?? 0 }));
    },
  });
}

interface OpzioniCreaTag {
  /** Senza toast di conferma: quando la creazione è un passo di un flusso più grande (scheda cliente). */
  silenzioso?: boolean;
}

/**
 * Crea un tag nel catalogo e lo ritorna. Se esiste già uno con la stessa label
 * (senza distinguere maiuscole) ritorna quello, così il chiamante può usarne la label.
 */
export function useCreaTag({ silenzioso = false }: OpzioniCreaTag = {}) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (label: string): Promise<Tag> => {
      const pulito = label.trim();
      const esistente = await supabase.from("tags").select("*").ilike("label", pulito).maybeSingle();
      if (esistente.error) throw esistente.error;
      if (esistente.data) return esistente.data;
      const { data, error } = await supabase.from("tags").insert({ label: pulito }).select("*").single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      if (!silenzioso) toast.success("Tag aggiunto");
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

/** Rinomina: si aggiorna tags.label; il trigger `tags_sincronizza_clienti` aggiorna gli array dei clienti. */
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

/** Elimina il tag: il trigger `tags_sincronizza_clienti` lo toglie dagli array dei clienti. */
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
