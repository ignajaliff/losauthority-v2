import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAuth } from "@/features/auth";
import { chiaviContenuti } from "@/features/contenuti";
import { supabase } from "@/integrations/supabase/client";
import { formatConteggio } from "@/shared/utils/formatConteggio";
import { erroreMutation } from "@/shared/utils/invocaEdge";
import { RIGHE_SENZA_TEMA, type VideoRicerca } from "../types";

const chiaveNelWorkflow = (clienteId: string, ricercaId: string) => ["ricerca-tiktok", "workflow", clienteId, ricercaId] as const;

/** I link dei video di questa ricerca che sono già nei riferimenti di un contenuto del Workflow. */
export function useUrlNelWorkflow(clienteId: string, ricercaId: string, url: string[]) {
  return useQuery({
    queryKey: chiaveNelWorkflow(clienteId, ricercaId),
    enabled: !!clienteId && url.length > 0,
    // Si rilegge a ogni apertura: un contenuto può essere stato tolto o aggiunto dal Workflow.
    staleTime: 0,
    queryFn: async (): Promise<Set<string>> => {
      const { data, error } = await supabase.from("contenuti").select("riferimenti").eq("cliente_id", clienteId).overlaps("riferimenti", url);
      if (error) throw error;
      const nel = new Set<string>();
      for (const c of data ?? []) for (const r of c.riferimenti ?? []) if (url.includes(r)) nel.add(r);
      return nel;
    },
  });
}

/** Un video della ricerca diventa un contenuto del Workflow in fase script, con il link come riferimento. */
export function usePortaVideoNelWorkflow(clienteId: string, ricerca: { id: string; tema: string }) {
  const queryClient = useQueryClient();
  const { utente } = useAuth();
  return useMutation({
    mutationFn: async (v: VideoRicerca) => {
      if (!utente) throw new Error("Utente non disponibile");
      const autore = v.autore ? `@${v.autore}` : "un creator";
      const titolo = (v.di_cosa_parla && !RIGHE_SENZA_TEMA.includes(v.di_cosa_parla) ? v.di_cosa_parla : `Video di ${autore}`).slice(0, 200);
      const { error } = await supabase.from("contenuti").insert({
        cliente_id: clienteId,
        creato_da: utente.id,
        titolo,
        stato: "fase_script",
        riferimenti: [v.url],
        note: `Da ricerca TikTok «${ricerca.tema}»: ${autore} · ${formatConteggio(v.mi_piace)} like · ${formatConteggio(v.visualizzazioni)} views`.slice(0, 2000),
      });
      if (error) throw error;
    },
    onSuccess: (_, v) => {
      // Subito «Nel Workflow», senza aspettare la rilettura: niente secondo clic che lo duplica.
      queryClient.setQueryData<Set<string>>(chiaveNelWorkflow(clienteId, ricerca.id), (prima) => new Set(prima).add(v.url));
      toast.success("Aggiunto al Workflow", { description: "Lo trovi in «Fase script» con il link del video." });
    },
    onError: erroreMutation("Impossibile aggiungerlo al Workflow"),
    // Restituite: la mutation resta pending (bottoni disattivati) finché i dati non sono riletti.
    onSettled: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: chiaveNelWorkflow(clienteId, ricerca.id) }),
        queryClient.invalidateQueries({ queryKey: chiaviContenuti.lista(clienteId) }),
      ]),
  });
}
