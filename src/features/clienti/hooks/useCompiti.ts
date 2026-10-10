import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { logDev, MESSAGGIO_ERRORE_GENERICO } from "@/shared/utils/errors";
import type { Compito, StatoCompito } from "../types";
import { chiaviClienti } from "./chiavi";

const COLONNE = "id, testo, stato, ordine, completato_il, created_at, padre_id, link_skool, nota_skool, origine, pagina";

/** Compiti del piano d'azione di un cliente (tappe e sotto-compiti insieme), nell'ordine in cui vanno fatti. */
export function useCompiti(clienteId: string) {
  return useQuery({
    queryKey: chiaviClienti.compiti(clienteId),
    queryFn: async (): Promise<Compito[]> => {
      const { data, error } = await supabase
        .from("compiti")
        .select(COLONNE)
        .eq("cliente_id", clienteId)
        .order("ordine")
        .order("created_at");
      if (error) throw error;
      return data;
    },
  });
}

interface NuovoCompitoInput {
  testo: string;
  autoreId: string;
  /** Tappa di cui è sotto-compito; assente = nuova tappa. */
  padreId?: string | null;
  /** Lezione Skool con cui fare il sotto-compito (solo con padreId). */
  linkSkool?: string | null;
  /** Nota accanto al link, es. "Dal minuto 20:03" (solo con linkSkool). */
  notaSkool?: string | null;
  /** Pagina dell'area cliente dove si fa il sotto-compito («Fallo qui»), chiave di `@area/pagine` (solo con padreId). */
  pagina?: string | null;
}

/** Nuova tappa o nuovo sotto-compito, in coda ai suoi fratelli (ordine = ultimo + 1). */
export function useAggiungiCompito(clienteId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ testo, autoreId, padreId = null, linkSkool = null, notaSkool = null, pagina = null }: NuovoCompitoInput) => {
      let fratelli = supabase.from("compiti").select("ordine").eq("cliente_id", clienteId);
      fratelli = padreId ? fratelli.eq("padre_id", padreId) : fratelli.is("padre_id", null);
      const { data: ultimo, error: errUltimo } = await fratelli.order("ordine", { ascending: false }).limit(1).maybeSingle();
      if (errUltimo) throw errUltimo;
      const { error } = await supabase
        .from("compiti")
        .insert({
          cliente_id: clienteId,
          testo,
          creato_da: autoreId,
          padre_id: padreId,
          link_skool: padreId ? linkSkool || null : null,
          nota_skool: padreId && linkSkool ? notaSkool || null : null,
          pagina: padreId ? pagina || null : null,
          ordine: (ultimo?.ordine ?? -1) + 1,
        });
      if (error) throw error;
      return padreId;
    },
    onSuccess: (padreId) => {
      toast.success(padreId ? "Sotto-compito aggiunto" : "Tappa aggiunta");
      void queryClient.invalidateQueries({ queryKey: chiaviClienti.compiti(clienteId) });
    },
    onError: (error) => {
      toast.error("Compito non salvato", { description: MESSAGGIO_ERRORE_GENERICO });
      logDev(error);
    },
  });
}

/**
 * Spunta / toglie la spunta (anche dal lato cliente: la policy lo permette e un
 * trigger lascia cambiare solo lo stato). Ottimista: la spunta appare subito;
 * lo stato della tappa padre lo ricalcola il database e arriva con il refetch.
 */
export function useCambiaStatoCompito(clienteId: string) {
  const queryClient = useQueryClient();
  const chiave = chiaviClienti.compiti(clienteId);
  return useMutation({
    mutationFn: async ({ id, stato }: { id: string; stato: StatoCompito }) => {
      const { error } = await supabase.from("compiti").update({ stato }).eq("id", id);
      if (error) throw error;
    },
    onMutate: async ({ id, stato }) => {
      await queryClient.cancelQueries({ queryKey: chiave });
      const prima = queryClient.getQueryData<Compito[]>(chiave);
      queryClient.setQueryData<Compito[]>(chiave, (lista) =>
        lista?.map((c) => (c.id === id ? { ...c, stato, completato_il: stato === "fatto" ? new Date().toISOString() : null } : c)),
      );
      return { prima };
    },
    onError: (error, _input, contesto) => {
      if (contesto?.prima) queryClient.setQueryData(chiave, contesto.prima);
      toast.error("Compito non aggiornato", { description: MESSAGGIO_ERRORE_GENERICO });
      logDev(error);
    },
    onSettled: () => void queryClient.invalidateQueries({ queryKey: chiave }),
  });
}

/** Elimina un compito; una tappa porta via anche i suoi sotto-compiti (on delete cascade). */
export function useEliminaCompito(clienteId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("compiti").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Compito eliminato");
      void queryClient.invalidateQueries({ queryKey: chiaviClienti.compiti(clienteId) });
    },
    onError: (error) => {
      toast.error("Compito non eliminato", { description: MESSAGGIO_ERRORE_GENERICO });
      logDev(error);
    },
  });
}
