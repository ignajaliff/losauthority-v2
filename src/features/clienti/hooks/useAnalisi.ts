import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { logDev } from "@/shared/utils/errors";
import { invocaEdge, messaggioErrore } from "../invocaEdge";
import type { StatoAnalisi } from "../types";
import { chiaviClienti } from "./chiavi";

/** Analisi di Aura del cliente + numero di schede già inviate (ne servono 3). */
export function useAnalisi(clienteId: string) {
  return useQuery({
    queryKey: chiaviClienti.analisi(clienteId),
    queryFn: async (): Promise<StatoAnalisi> => {
      const [analisi, invii] = await Promise.all([
        supabase
          .from("analisi")
          .select("contenuto, generato_il")
          .eq("cliente_id", clienteId)
          .maybeSingle(),
        supabase
          .from("questionario_invii")
          .select("id", { count: "exact", head: true })
          .eq("cliente_id", clienteId)
          .eq("stato", "inviato"),
      ]);
      if (analisi.error) throw analisi.error;
      if (invii.error) throw invii.error;
      return { analisi: analisi.data, schedeInviate: invii.count ?? 0 };
    },
  });
}

interface RispostaAnalisi {
  ok: true;
  contenuto: string;
}

/** "Genera analisi con Aura": legge le 3 schede e scrive `analisi`. */
export function useGeneraAnalisi(clienteId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => invocaEdge<RispostaAnalisi>("aura-analisi", { cliente_id: clienteId }),
    onSuccess: () => {
      toast.success("Analisi pronta");
      void queryClient.invalidateQueries({ queryKey: chiaviClienti.analisi(clienteId) });
    },
    onError: (error) => {
      toast.error("Analisi non riuscita", { description: messaggioErrore(error) });
      logDev(error);
    },
  });
}
