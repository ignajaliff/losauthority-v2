import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { erroreMutation, ErroreEdge, invocaEdge } from "@/shared/utils/invocaEdge";
import { eInCorso, type RicercaConVideo, type RicercaTiktok, type VideoRicerca } from "../types";

export const chiaviRicerche = {
  lista: (clienteId: string) => ["ricerca-tiktok", "lista", clienteId] as const,
  una: (id: string) => ["ricerca-tiktok", "una", id] as const,
  controlla: (id: string) => ["ricerca-tiktok", "controlla", id] as const,
};

/** Ogni quanto il polling chiede alla funzione a che punto è Apify (i primi 12 minuti). */
const POLLING_MS = 10_000;
/** Dopo LENTA_MS si controlla una volta al minuto, senza mai fermarsi finché la ricerca è in corso. */
const POLLING_LENTO_MS = 60_000;
/** Oltre questo tempo (dalla creazione) una ricerca ancora in corso «ci sta mettendo più del solito». */
const LENTA_MS = 12 * 60_000;
/** Dopo tanti controlli falliti (ognuno già ritentato una volta) il polling si ferma e la pagina lo dice. */
const ERRORI_MAX = 3;
const STATI_IN_CORSO: ReadonlyArray<string> = ["in_corso", "elaborazione"];

/** Le ricerche del cliente, dalla più recente. */
export function useRicerche(clienteId: string | undefined) {
  return useQuery({
    queryKey: chiaviRicerche.lista(clienteId ?? ""),
    enabled: !!clienteId,
    queryFn: async (): Promise<RicercaTiktok[]> => {
      const { data, error } = await supabase
        .from("ricerche_tiktok")
        .select("*")
        .eq("cliente_id", clienteId ?? "")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

const ORDINE_SEZIONE: Record<string, number> = { top_lingua: 0, top: 0, lingua_target: 1, fuori_soglia: 2 };

/** Una ricerca con i suoi video, in ordine di sezione e posizione. */
export function useRicerca(id: string | null) {
  return useQuery({
    queryKey: chiaviRicerche.una(id ?? ""),
    enabled: !!id,
    queryFn: async (): Promise<RicercaConVideo | null> => {
      const { data, error } = await supabase
        .from("ricerche_tiktok")
        .select("*, video:ricerche_tiktok_video(*)")
        .eq("id", id ?? "")
        .maybeSingle();
      if (error) throw error;
      if (!data) return null;
      const video = [...(data.video as VideoRicerca[])].sort(
        (a, b) => (ORDINE_SEZIONE[a.sezione] ?? 9) - (ORDINE_SEZIONE[b.sezione] ?? 9) || a.posizione - b.posizione,
      );
      return { ...data, video };
    },
  });
}

/**
 * Mentre la ricerca è in corso chiede alla funzione di controllare Apify: è l'unica cosa che fa
 * avanzare la ricerca (niente cron), quindi la chiama la pagina per la ricerca in corso, qualunque
 * ricerca sia aperta. Ogni 10 s, ogni minuto dopo 12 minuti dalla creazione; non si ferma finché la
 * ricerca è in corso (la funzione può riportarla da «elaborazione» a «in_corso» o chiuderla in errore).
 * Si ferma solo dopo ERRORI_MAX errori: `errore` lo espone, `riprova` riparte. Quando lo stato cambia
 * ricarica la ricerca e l'elenco. `lenta` = in corso da più di 12 minuti.
 */
export function useControllaRicerca(clienteId: string, ricerca: RicercaTiktok | null | undefined) {
  const queryClient = useQueryClient();
  const attiva = !!ricerca && eInCorso(ricerca);
  const id = ricerca?.id ?? "";
  const creataIl = ricerca ? new Date(ricerca.created_at).getTime() : 0;
  const controllo = useQuery({
    queryKey: chiaviRicerche.controlla(id),
    enabled: attiva,
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: "always",
    // Anche con la scheda in secondo piano: senza questi controlli la ricerca non si completa.
    refetchIntervalInBackground: true,
    refetchInterval: (q) => {
      if (q.state.data && !STATI_IN_CORSO.includes(q.state.data)) return false;
      if (q.state.status === "error" && q.state.errorUpdateCount >= ERRORI_MAX) return false;
      return Date.now() - creataIl > LENTA_MS ? POLLING_LENTO_MS : POLLING_MS;
    },
    queryFn: async (): Promise<string> => (await invocaEdge<{ stato: string }>("ricerca-tiktok", { azione: "controlla", id })).stato,
  });
  const stato = controllo.data;
  useEffect(() => {
    if (!stato || stato === ricerca?.stato) return;
    void queryClient.invalidateQueries({ queryKey: chiaviRicerche.una(id) });
    void queryClient.invalidateQueries({ queryKey: chiaviRicerche.lista(clienteId) });
  }, [stato, ricerca?.stato, id, clienteId, queryClient]);
  const fermo = attiva && controllo.isError && controllo.errorUpdateCount >= ERRORI_MAX;
  // Ora dell'ultima risposta, buona o in errore (non Date.now() durante il render): basta per dire se è lenta.
  const ultimoControllo = Math.max(controllo.dataUpdatedAt, controllo.errorUpdatedAt);
  return {
    lenta: attiva && ultimoControllo - creataIl > LENTA_MS,
    /** Il polling si è fermato per errori: l'errore da mostrare (null se tutto bene). */
    errore: fermo ? controllo.error : null,
    riprova: () => void controllo.refetch(),
  };
}

/** Una keyword proposta da Aura con la lingua per cui l'ha scritta. */
export interface KeywordProposta {
  lingua?: string;
  testo: string;
}

/** Aura trasforma il tema in una keyword per lingua, partendo da chi è il cliente (non consuma la ricerca dei 15 giorni). */
export function useProponiKeyword() {
  return useMutation({
    mutationFn: async (input: { tema: string }): Promise<KeywordProposta[]> => {
      const r = await invocaEdge<{ keyword: string[]; proposte?: KeywordProposta[] }>("ricerca-tiktok", { azione: "proponi", ...input });
      return r.proposte ?? r.keyword.map((testo) => ({ testo }));
    },
    onError: erroreMutation("Aura non ha proposto le keyword"),
  });
}

/**
 * Lancia la ricerca su TikTok (una ogni 15 giorni). Ritorna l'id della nuova ricerca e resta
 * pending finché l'elenco non è aggiornato. `onFallita` gira PRIMA di ricaricare l'elenco: se la
 * funzione ha creato la ricerca in errore, l'elenco ricaricato non deve smontare il form (le
 * callback di `mutate` arrivano dopo onSettled e solo se il componente è ancora montato).
 */
export function useAvviaRicerca(clienteId: string, onFallita?: () => void) {
  const queryClient = useQueryClient();
  const segnalaErrore = erroreMutation("Ricerca non avviata");
  return useMutation({
    mutationFn: async (input: { tema: string; keyword: string[]; lingue: string[] }) =>
      (await invocaEdge<{ id: string }>("ricerca-tiktok", { azione: "avvia", ...input })).id,
    onSuccess: () => toast.success("Ricerca avviata", { description: "TikTok ci mette qualche minuto: puoi restare qui o tornare più tardi." }),
    onError: (error) => {
      segnalaErrore(error);
      onFallita?.();
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: chiaviRicerche.lista(clienteId) }),
  });
}

/** Elimina una ricerca e i suoi video (non restituisce la ricerca dei 15 giorni). */
export function useEliminaRicerca(clienteId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase.from("ricerche_tiktok").delete().eq("id", id).select("id");
      if (error) throw error;
      // La RLS non dà errore: semplicemente non cancella niente.
      if (!data || data.length === 0) throw new ErroreEdge("Questa ricerca non si può ancora eliminare: si elimina solo se non è riuscita o dopo 15 giorni.");
    },
    onSuccess: () => toast.success("Ricerca eliminata"),
    onError: erroreMutation("Impossibile eliminare la ricerca"),
    onSettled: () => void queryClient.invalidateQueries({ queryKey: chiaviRicerche.lista(clienteId) }),
  });
}
