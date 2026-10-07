import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { erroreMutation, invocaEdge } from "@/shared/utils/invocaEdge";
import { logDev, MESSAGGIO_ERRORE_GENERICO } from "@/shared/utils/errors";
import type { Stile } from "../types";

export const chiaviStili = {
  lista: (clienteId: string) => ["idee", clienteId, "stili"] as const,
};

/** Gli stili del cliente, dal più recente. Si aggiorna da solo finché Aura ne sta scrivendo uno. */
export function useStili(clienteId: string | undefined) {
  return useQuery({
    queryKey: chiaviStili.lista(clienteId ?? ""),
    enabled: !!clienteId,
    refetchInterval: (query) => (query.state.data?.some((s) => s.stato === "in_corso") ? 3000 : false),
    queryFn: async (): Promise<Stile[]> => {
      const { data, error } = await supabase
        .from("stili")
        .select("*")
        .eq("cliente_id", clienteId ?? "")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

function useInvalidaStili(clienteId: string) {
  const queryClient = useQueryClient();
  return () => void queryClient.invalidateQueries({ queryKey: chiaviStili.lista(clienteId) });
}

interface RispostaStile {
  stile: Stile;
}

type CreaInput = { titolo: string; script: string[]; note: string | null } | { riprovaId: string };

/** Manda gli script ad Aura (Edge Function aura-stile) e aspetta lo stile pronto; oppure riprova uno in errore. */
export function useCreaStile(clienteId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreaInput): Promise<RispostaStile> => {
      const body = "riprovaId" in input ? { riprova_stile_id: input.riprovaId } : { titolo: input.titolo, script: input.script, note: input.note };
      return invocaEdge<RispostaStile>("aura-stile", body);
    },
    onSuccess: (r) => {
      toast.success("Stile pronto", { description: `Aura ha scritto «${r.stile.titolo}».` });
    },
    // Anche in errore la riga esiste (in_corso → errore): ricarichiamo per mostrarla con «Riprova».
    onSettled: () => void queryClient.invalidateQueries({ queryKey: chiaviStili.lista(clienteId) }),
    onError: erroreMutation("Aura non è riuscita a creare lo stile"),
  });
}

/** Il cliente ritocca titolo o istruzioni di uno stile pronto. */
export function useAggiornaStile(clienteId: string) {
  const invalida = useInvalidaStili(clienteId);
  return useMutation({
    mutationFn: async ({ id, dati }: { id: string; dati: { titolo: string; istruzioni: string } }) => {
      const { error } = await supabase.from("stili").update(dati).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Stile aggiornato");
      invalida();
    },
    onError: (error) => {
      toast.error("Impossibile salvare lo stile", { description: MESSAGGIO_ERRORE_GENERICO });
      logDev(error);
    },
  });
}

export function useEliminaStile(clienteId: string) {
  const invalida = useInvalidaStili(clienteId);
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("stili").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast("Stile eliminato");
      invalida();
    },
    onError: (error) => {
      toast.error("Impossibile eliminare lo stile", { description: MESSAGGIO_ERRORE_GENERICO });
      logDev(error);
    },
  });
}
