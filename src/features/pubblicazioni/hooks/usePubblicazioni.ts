import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/features/auth";
import { logDev, MESSAGGIO_ERRORE_GENERICO } from "@/shared/utils/errors";
import type { MetricaDati, Pubblicazione, PubblicazioneDati } from "../types";

export const chiaviPubblicazioni = {
  lista: (clienteId: string) => ["pubblicazioni", clienteId] as const,
};

/**
 * Pubblicazioni del cliente con tutte le rilevazioni (ordinate dalla più vecchia).
 * `inAttesa` = la prima lettura Instagram è in corso: si ricontrolla ogni 10 s.
 */
export function usePubblicazioni(clienteId: string | undefined, inAttesa = false) {
  return useQuery({
    queryKey: chiaviPubblicazioni.lista(clienteId ?? ""),
    enabled: !!clienteId,
    refetchInterval: inAttesa ? 10_000 : false,
    queryFn: async (): Promise<Pubblicazione[]> => {
      const { data, error } = await supabase
        .from("pubblicazioni")
        .select("*, metriche:pubblicazioni_metriche(*)")
        .eq("cliente_id", clienteId ?? "")
        .order("pubblicata_il", { ascending: false, nullsFirst: true })
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []).map((p) => ({
        ...p,
        metriche: [...p.metriche].sort((a, b) => a.rilevata_il.localeCompare(b.rilevata_il)),
      }));
    },
  });
}

function useInvalida(clienteId: string) {
  const queryClient = useQueryClient();
  return () => void queryClient.invalidateQueries({ queryKey: chiaviPubblicazioni.lista(clienteId) });
}

interface AggiornaInput {
  id: string;
  dati: Partial<PubblicazioneDati>;
}

/** Aggiorna una pubblicazione (le carte nascono da `instagram-sync`, non da qui). */
export function useAggiornaPubblicazione(clienteId: string) {
  const invalida = useInvalida(clienteId);
  return useMutation({
    mutationFn: async ({ id, dati }: AggiornaInput) => {
      const { error } = await supabase.from("pubblicazioni").update(dati).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Pubblicazione aggiornata");
      invalida();
    },
    onError: (error) => {
      toast.error("Impossibile salvare la pubblicazione", { description: MESSAGGIO_ERRORE_GENERICO });
      logDev(error);
    },
  });
}

/** Elimina una pubblicazione e tutte le sue rilevazioni. */
export function useEliminaPubblicazione(clienteId: string) {
  const invalida = useInvalida(clienteId);
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("pubblicazioni").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Pubblicazione eliminata");
      invalida();
    },
    onError: (error) => {
      toast.error("Impossibile eliminare la pubblicazione", { description: MESSAGGIO_ERRORE_GENERICO });
      logDev(error);
    },
  });
}

interface RilevazioneInput {
  pubblicazioneId: string;
  dati: MetricaDati;
}

/** Aggiunge una rilevazione (visualizzazioni / mi piace / commenti) a una pubblicazione. */
export function useAggiungiRilevazione(clienteId: string) {
  const invalida = useInvalida(clienteId);
  const { utente } = useAuth();
  return useMutation({
    mutationFn: async ({ pubblicazioneId, dati }: RilevazioneInput) => {
      if (!utente) throw new Error("Utente non disponibile");
      const { error } = await supabase
        .from("pubblicazioni_metriche")
        .insert({ ...dati, pubblicazione_id: pubblicazioneId, creato_da: utente.id });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Rilevazione salvata");
      invalida();
    },
    onError: (error) => {
      toast.error("Impossibile salvare la rilevazione", { description: MESSAGGIO_ERRORE_GENERICO });
      logDev(error);
    },
  });
}

/** Elimina una rilevazione. */
export function useEliminaRilevazione(clienteId: string) {
  const invalida = useInvalida(clienteId);
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("pubblicazioni_metriche").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Rilevazione eliminata");
      invalida();
    },
    onError: (error) => {
      toast.error("Impossibile eliminare la rilevazione", { description: MESSAGGIO_ERRORE_GENERICO });
      logDev(error);
    },
  });
}
