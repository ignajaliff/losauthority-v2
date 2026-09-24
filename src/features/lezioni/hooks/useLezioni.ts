import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { invocaEdge, messaggioErrore } from "@/shared/utils/invocaEdge";
import { logDev } from "@/shared/utils/errors";
import type { Lezione, StatoSync } from "../types";

export const CHIAVI_LEZIONI = {
  catalogo: ["lezioni", "catalogo"] as const,
  sync: ["lezioni", "sync"] as const,
};

interface RispostaSkool {
  ok: boolean;
  lezioni?: number;
  nuove?: number;
  error?: string;
}

/** Catalogo attivo, per corso e ordine. */
export function useCatalogoLezioni() {
  return useQuery({
    queryKey: CHIAVI_LEZIONI.catalogo,
    queryFn: async (): Promise<Lezione[]> => {
      const { data, error } = await supabase
        .from("lezioni")
        .select("*")
        .eq("attiva", true)
        .order("corso", { ascending: true, nullsFirst: false })
        .order("ordine", { ascending: true, nullsFirst: false })
        .order("titolo", { ascending: true });
      if (error) throw error;
      return data;
    },
  });
}

/** Stato dell'ultima sincronizzazione Skool (null se mai lanciata). */
export function useStatoSyncSkool() {
  return useQuery({
    queryKey: CHIAVI_LEZIONI.sync,
    queryFn: async (): Promise<StatoSync | null> => {
      const { data, error } = await supabase.from("sync_stati").select("*").eq("chiave", "skool").maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

/** "Sincronizza ora": Apify → lezioni. Può durare 1–2 minuti. */
export function useSincronizzaSkool() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (): Promise<Required<Pick<RispostaSkool, "lezioni" | "nuove">>> => {
      const data = await invocaEdge<RispostaSkool>("skool-lezioni", {});
      return { lezioni: data.lezioni ?? 0, nuove: data.nuove ?? 0 };
    },
    onSuccess: ({ lezioni, nuove }) => {
      toast.success(`Lezioni: ${lezioni} (nuove: ${nuove})`);
      void queryClient.invalidateQueries({ queryKey: CHIAVI_LEZIONI.catalogo });
      void queryClient.invalidateQueries({ queryKey: CHIAVI_LEZIONI.sync });
    },
    onError: (error) => {
      logDev(error);
      toast.error("Sincronizzazione non riuscita", {
        description: messaggioErrore(error),
      });
      // Anche in errore la Edge Function aggiorna sync_stati: rileggiamo l'esito.
      void queryClient.invalidateQueries({ queryKey: CHIAVI_LEZIONI.sync });
    },
  });
}
