import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/features/auth";
import { logDev, MESSAGGIO_ERRORE_GENERICO } from "@/shared/utils/errors";
import { ETICHETTA_STATO_CONTENUTO, type Contenuto, type ContenutoDati, type StatoContenuto } from "../types";

export const chiaviContenuti = {
  lista: (clienteId: string) => ["contenuti", clienteId] as const,
};

/** Tutti i contenuti di un cliente (RLS: il cliente vede i propri, il team tutti). */
export function useContenuti(clienteId: string | undefined) {
  return useQuery({
    queryKey: chiaviContenuti.lista(clienteId ?? ""),
    enabled: !!clienteId,
    queryFn: async (): Promise<Contenuto[]> => {
      const { data, error } = await supabase
        .from("contenuti")
        .select("*")
        .eq("cliente_id", clienteId ?? "")
        .order("ordine")
        .order("created_at");
      if (error) throw error;
      return data ?? [];
    },
  });
}

/** Prossimo `ordine` libero in una colonna (in coda). */
function prossimoOrdine(lista: Contenuto[] | undefined, stato: string): number {
  const inColonna = (lista ?? []).filter((c) => c.stato === stato);
  return inColonna.length ? Math.max(...inColonna.map((c) => c.ordine)) + 1 : 0;
}

function oggiIso(): string {
  return new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Rome" }).format(new Date());
}

interface SalvaContenutoInput {
  id?: string;
  dati: ContenutoDati;
}

/** Crea (senza id) o aggiorna (con id) un contenuto del cliente. */
export function useSalvaContenuto(clienteId: string) {
  const queryClient = useQueryClient();
  const { utente } = useAuth();
  const chiave = chiaviContenuti.lista(clienteId);

  return useMutation({
    mutationFn: async ({ id, dati }: SalvaContenutoInput) => {
      if (id) {
        const { error } = await supabase.from("contenuti").update(dati).eq("id", id);
        if (error) throw error;
        return;
      }
      if (!utente) throw new Error("Utente non disponibile");
      const ordine = prossimoOrdine(queryClient.getQueryData<Contenuto[]>(chiave), dati.stato);
      const { error } = await supabase
        .from("contenuti")
        .insert({ ...dati, cliente_id: clienteId, creato_da: utente.id, ordine });
      if (error) throw error;
    },
    onSuccess: (_, { id }) => {
      toast.success(id ? "Contenuto aggiornato" : "Idea aggiunta al workflow");
      void queryClient.invalidateQueries({ queryKey: chiave });
    },
    onError: (error) => {
      toast.error("Impossibile salvare il contenuto", { description: MESSAGGIO_ERRORE_GENERICO });
      logDev(error);
    },
  });
}

interface SpostaContenutoInput {
  id: string;
  stato: StatoContenuto;
}

/** Sposta un contenuto in un'altra colonna (in coda), con aggiornamento ottimistico. */
export function useSpostaContenuto(clienteId: string) {
  const queryClient = useQueryClient();
  const chiave = chiaviContenuti.lista(clienteId);

  return useMutation({
    mutationFn: async ({ id, stato }: SpostaContenutoInput) => {
      const ordine = prossimoOrdine(queryClient.getQueryData<Contenuto[]>(chiave), stato);
      const { error } = await supabase.from("contenuti").update({ stato, ordine }).eq("id", id);
      if (error) throw error;
    },
    onMutate: async ({ id, stato }) => {
      await queryClient.cancelQueries({ queryKey: chiave });
      const precedenti = queryClient.getQueryData<Contenuto[]>(chiave);
      queryClient.setQueryData<Contenuto[]>(chiave, (attuali) =>
        attuali?.map((c) =>
          c.id === id
            ? {
                ...c,
                stato,
                ordine: prossimoOrdine(attuali, stato),
                pubblicato_il: stato === "pubblicato" ? (c.pubblicato_il ?? oggiIso()) : null,
              }
            : c,
        ),
      );
      return { precedenti };
    },
    onSuccess: (_, { stato }) => {
      toast.success(`Spostato in "${ETICHETTA_STATO_CONTENUTO[stato]}"`);
    },
    onError: (error, _, contesto) => {
      if (contesto?.precedenti) queryClient.setQueryData(chiave, contesto.precedenti);
      toast.error("Impossibile spostare il contenuto", { description: MESSAGGIO_ERRORE_GENERICO });
      logDev(error);
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: chiave });
    },
  });
}

interface RipianificaInput {
  id: string;
  /** "YYYY-MM-DD" oppure null per togliere la data. */
  pubblicazione_prevista: string | null;
}

/** Cambia la data prevista di pubblicazione (trascinamento nel calendario), ottimistico. */
export function useRipianificaContenuto(clienteId: string) {
  const queryClient = useQueryClient();
  const chiave = chiaviContenuti.lista(clienteId);

  return useMutation({
    mutationFn: async ({ id, pubblicazione_prevista }: RipianificaInput) => {
      const { error } = await supabase.from("contenuti").update({ pubblicazione_prevista }).eq("id", id);
      if (error) throw error;
    },
    onMutate: async ({ id, pubblicazione_prevista }) => {
      await queryClient.cancelQueries({ queryKey: chiave });
      const precedenti = queryClient.getQueryData<Contenuto[]>(chiave);
      queryClient.setQueryData<Contenuto[]>(chiave, (attuali) =>
        attuali?.map((c) => (c.id === id ? { ...c, pubblicazione_prevista } : c)),
      );
      return { precedenti };
    },
    onError: (error, _, contesto) => {
      if (contesto?.precedenti) queryClient.setQueryData(chiave, contesto.precedenti);
      toast.error("Impossibile spostare la data", { description: MESSAGGIO_ERRORE_GENERICO });
      logDev(error);
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: chiave });
    },
  });
}

/** Elimina un contenuto. */
export function useEliminaContenuto(clienteId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("contenuti").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Contenuto eliminato");
      void queryClient.invalidateQueries({ queryKey: chiaviContenuti.lista(clienteId) });
    },
    onError: (error) => {
      toast.error("Impossibile eliminare il contenuto", { description: MESSAGGIO_ERRORE_GENERICO });
      logDev(error);
    },
  });
}
