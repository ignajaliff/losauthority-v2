import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/features/auth";
import { chiaviContenuti } from "@/features/contenuti";
import { erroreMutation, invocaEdge } from "@/shared/utils/invocaEdge";
import { logDev, MESSAGGIO_ERRORE_GENERICO } from "@/shared/utils/errors";
import type { Idea, Messaggio, Sessione } from "../types";

export const chiaviIdee = {
  sessioni: (clienteId: string) => ["idee", clienteId, "sessioni"] as const,
  sessione: (sessioneId: string) => ["idee", "sessione", sessioneId] as const,
  salvate: (clienteId: string) => ["idee", clienteId, "salvate"] as const,
};

/** Sessioni del cliente, dalla più recente. */
export function useSessioni(clienteId: string | undefined) {
  return useQuery({
    queryKey: chiaviIdee.sessioni(clienteId ?? ""),
    enabled: !!clienteId,
    queryFn: async (): Promise<Sessione[]> => {
      const { data, error } = await supabase
        .from("idee_sessioni")
        .select("*")
        .eq("cliente_id", clienteId ?? "")
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export interface SessioneAperta {
  messaggi: Messaggio[];
  idee: Idea[];
}

/** Messaggi e idee di una sessione. Si aggiorna da solo finché Aura sta scrivendo. */
export function useSessione(sessioneId: string | null) {
  return useQuery({
    queryKey: chiaviIdee.sessione(sessioneId ?? ""),
    enabled: !!sessioneId,
    refetchInterval: (query) => (query.state.data?.messaggi.some((m) => m.stato === "in_corso") ? 2500 : false),
    queryFn: async (): Promise<SessioneAperta> => {
      const [m, i] = await Promise.all([
        supabase.from("idee_messaggi").select("*").eq("sessione_id", sessioneId ?? "").order("created_at"),
        supabase.from("idee").select("*").eq("sessione_id", sessioneId ?? "").order("created_at"),
      ]);
      if (m.error) throw m.error;
      if (i.error) throw i.error;
      return { messaggi: m.data ?? [], idee: i.data ?? [] };
    },
  });
}

/** Idee salvate (confermate dal cliente) non ancora portate nel Workflow. */
export function useIdeeSalvate(clienteId: string | undefined) {
  return useQuery({
    queryKey: chiaviIdee.salvate(clienteId ?? ""),
    enabled: !!clienteId,
    queryFn: async (): Promise<Idea[]> => {
      const { data, error } = await supabase
        .from("idee")
        .select("*")
        .eq("cliente_id", clienteId ?? "")
        .eq("stato", "salvata")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

interface RispostaAura {
  sessione_id: string;
  messaggio_id: string;
  risposta: string;
  idee: Idea[];
}

type InvioInput =
  /** stileId = stile della pagina "Stili" richiamato con "/"; ricercaId = ricerca TikTok («Usa in Crea idee»). */
  | { sessioneId: string | null; messaggio: string; stileId?: string | null; ricercaId?: string | null }
  | { riprovaId: string; sessioneId: string };

/** Manda un messaggio ad Aura (o riprova una risposta in errore). Ritorna l'id della sessione. */
export function useInviaAdAura(clienteId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: InvioInput): Promise<RispostaAura> => {
      const body =
        "riprovaId" in input
          ? { riprova_messaggio_id: input.riprovaId }
          : { sessione_id: input.sessioneId, messaggio: input.messaggio, stile_id: input.stileId ?? null, ricerca_id: input.ricercaId ?? null };
      return invocaEdge<RispostaAura>("aura-idee", body);
    },
    onSettled: (data, _err, input) => {
      const sid = data?.sessione_id ?? input.sessioneId;
      void queryClient.invalidateQueries({ queryKey: chiaviIdee.sessioni(clienteId) });
      if (sid) void queryClient.invalidateQueries({ queryKey: chiaviIdee.sessione(sid) });
    },
    onError: erroreMutation("Aura non ha risposto"),
  });
}

function useInvalidaIdee(clienteId: string) {
  const queryClient = useQueryClient();
  return (sessioneId: string | null) => {
    void queryClient.invalidateQueries({ queryKey: chiaviIdee.salvate(clienteId) });
    if (sessioneId) void queryClient.invalidateQueries({ queryKey: chiaviIdee.sessione(sessioneId) });
  };
}

/** Il cliente conferma (salvata) o scarta una proposta. */
export function useCambiaStatoIdea(clienteId: string) {
  const invalida = useInvalidaIdee(clienteId);
  return useMutation({
    mutationFn: async ({ idea, stato }: { idea: Idea; stato: "salvata" | "scartata" | "proposta" }) => {
      const { error } = await supabase.from("idee").update({ stato }).eq("id", idea.id);
      if (error) throw error;
    },
    onSuccess: (_, { idea, stato }) => {
      if (stato === "salvata") toast.success("Idea salvata");
      if (stato === "scartata") toast("Idea scartata");
      invalida(idea.sessione_id);
    },
    onError: (error) => {
      toast.error("Impossibile aggiornare l'idea", { description: MESSAGGIO_ERRORE_GENERICO });
      logDev(error);
    },
  });
}

/** Crea il contenuto nel Workflow (Fase script) a partire dall'idea e la marca come usata. */
export function usePortaNelWorkflow(clienteId: string) {
  const queryClient = useQueryClient();
  const invalida = useInvalidaIdee(clienteId);
  const { utente } = useAuth();
  return useMutation({
    mutationFn: async (idea: Idea) => {
      if (!utente) throw new Error("Utente non disponibile");
      const script = [idea.hook ? `HOOK: ${idea.hook}` : null, idea.script].filter(Boolean).join("\n\n") || null;
      const { data, error } = await supabase
        .from("contenuti")
        .insert({
          cliente_id: clienteId,
          creato_da: utente.id,
          titolo: idea.titolo,
          stato: "fase_script",
          tipologia: idea.tipologia,
          script,
          riferimenti: idea.riferimenti,
        })
        .select("id")
        .single();
      if (error || !data) throw error ?? new Error("contenuto non creato");
      const { error: e2 } = await supabase.from("idee").update({ stato: "usata", contenuto_id: data.id }).eq("id", idea.id);
      if (e2) throw e2;
    },
    onSuccess: (_, idea) => {
      toast.success("Idea portata nel Workflow", { description: "La trovi in «Fase script»." });
      invalida(idea.sessione_id);
      void queryClient.invalidateQueries({ queryKey: chiaviContenuti.lista(clienteId) });
    },
    onError: (error) => {
      toast.error("Impossibile creare il contenuto", { description: MESSAGGIO_ERRORE_GENERICO });
      logDev(error);
    },
  });
}
