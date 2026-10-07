import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { erroreMutation } from "@/shared/utils/invocaEdge";
import type { ArgomentiSalvaConcorrente } from "../schema";
import type { Concorrente } from "../types";

type ArgsSalva = Database["public"]["Functions"]["salva_concorrente"]["Args"];

export const chiaviConcorrenti = {
  lista: (clienteId: string) => ["concorrenti", "lista", clienteId] as const,
};

/** Le referenze del cliente con i loro video, dalla prima creata. */
export function useConcorrenti(clienteId: string | undefined) {
  return useQuery({
    queryKey: chiaviConcorrenti.lista(clienteId ?? ""),
    enabled: !!clienteId,
    queryFn: async (): Promise<Concorrente[]> => {
      const { data, error } = await supabase
        .from("concorrenti")
        .select("*, video:concorrenti_video(*)")
        .eq("cliente_id", clienteId ?? "")
        .order("created_at");
      if (error) throw error;
      return (data ?? []).map((c) => ({ ...c, video: [...c.video].sort((a, b) => a.ordine - b.ordine) }));
    },
  });
}

/** Crea o aggiorna una referenza con tutti i suoi video, in una sola transazione (`salva_concorrente`). */
export function useSalvaConcorrente(clienteId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    // Il generatore dei tipi non segna come nullable p_id e p_cosa_fa: la funzione SQL li accetta null.
    mutationFn: async (argomenti: ArgomentiSalvaConcorrente): Promise<string> => {
      const { data, error } = await supabase.rpc("salva_concorrente", argomenti as ArgsSalva);
      if (error) throw error;
      return data;
    },
    onSuccess: (_, { p_id }) => toast.success(p_id ? "Referenza aggiornata" : "Referenza aggiunta"),
    onError: erroreMutation("Impossibile salvare la referenza"),
    onSettled: () => void queryClient.invalidateQueries({ queryKey: chiaviConcorrenti.lista(clienteId) }),
  });
}

/** Elimina una referenza e i suoi video. */
export function useEliminaConcorrente(clienteId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("concorrenti").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => toast.success("Referenza eliminata"),
    onError: erroreMutation("Impossibile eliminare la referenza"),
    onSettled: () => void queryClient.invalidateQueries({ queryKey: chiaviConcorrenti.lista(clienteId) }),
  });
}
