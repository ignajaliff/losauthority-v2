import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { logDev, MESSAGGIO_ERRORE_GENERICO } from "@/shared/utils/errors";
import { normalizzaTelefono } from "@contratti/validazione.ts";
import { STATI_APERTI } from "@contratti/tipi.ts";
import { COLONNE_LISTA, conPrezzoNumerico, type Contratto, type ContrattoInLista, type ImpostazioniContratti } from "../types";

export const chiaviContratti = {
  lista: ["contratti", "lista"] as const,
  uno: (id: string) => ["contratti", "uno", id] as const,
  impostazioni: ["contratti", "impostazioni"] as const,
};

export function useContratti() {
  return useQuery({
    queryKey: chiaviContratti.lista,
    queryFn: async (): Promise<ContrattoInLista[]> => {
      const { data, error } = await supabase.from("contratti").select(COLONNE_LISTA).order("created_at", { ascending: false });
      if (error) throw error;
      return ((data ?? []) as unknown as ContrattoInLista[]).map(conPrezzoNumerico);
    },
  });
}

export function useContratto(id: string | undefined) {
  return useQuery({
    queryKey: chiaviContratti.uno(id ?? ""),
    enabled: !!id,
    queryFn: async (): Promise<Contratto | null> => {
      const { data, error } = await supabase.from("contratti").select("*").eq("id", id ?? "").maybeSingle();
      if (error) throw error;
      return data ? conPrezzoNumerico(data as unknown as Contratto) : null;
    },
  });
}

/** Il contratto di un cliente (per la sua scheda): il più recente non annullato. */
export function useContrattoDelCliente(clienteId: string | undefined) {
  return useQuery({
    queryKey: ["contratti", "cliente", clienteId ?? ""] as const,
    enabled: !!clienteId,
    queryFn: async (): Promise<ContrattoInLista | null> => {
      const { data, error } = await supabase
        .from("contratti")
        .select(COLONNE_LISTA)
        .eq("cliente_id", clienteId ?? "")
        .neq("stato", "annullato")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data ? conPrezzoNumerico(data as unknown as ContrattoInLista) : null;
    },
  });
}

export function useImpostazioniContratti() {
  return useQuery({
    queryKey: chiaviContratti.impostazioni,
    queryFn: async (): Promise<ImpostazioniContratti | null> => {
      const { data, error } = await supabase.from("contratti_impostazioni").select("*").maybeSingle();
      if (error) throw error;
      return (data as ImpostazioniContratti | null) ?? null;
    },
  });
}

function erroreGenerico(titolo: string) {
  return (error: unknown) => {
    toast.error(titolo, { description: MESSAGGIO_ERRORE_GENERICO });
    logDev(error);
  };
}

/** Telefono del Fornitore e messaggio dopo la firma (la firma passa dalla Edge Function). */
export function useSalvaImpostazioni() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { telefono_fornitore: string; istruzioni_pagamento: string }) => {
      const { error } = await supabase
        .from("contratti_impostazioni")
        .update({ telefono_fornitore: normalizzaTelefono(input.telefono_fornitore) || null, istruzioni_pagamento: input.istruzioni_pagamento.trim().slice(0, 1500) || null })
        .eq("id", true);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Impostazioni salvate");
      void queryClient.invalidateQueries({ queryKey: chiaviContratti.impostazioni });
    },
    onError: erroreGenerico("Impostazioni non salvate"),
  });
}

/** Ritira la proposta: il link smette di funzionare. Solo se non è ancora firmata. */
export function useAnnullaInvito() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("contratti").update({ stato: "annullato", annullato_il: new Date().toISOString() }).eq("id", id).in("stato", STATI_APERTI);
      if (error) throw error;
    },
    onSuccess: (_r, id) => {
      toast.success("Invito annullato");
      void queryClient.invalidateQueries({ queryKey: chiaviContratti.lista });
      void queryClient.invalidateQueries({ queryKey: chiaviContratti.uno(id) });
    },
    onError: erroreGenerico("Invito non annullato"),
  });
}

/** Cancella un invito mai firmato (un contratto firmato non si cancella da qui). */
export function useEliminaInvito() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("contratti").delete().eq("id", id).in("stato", [...STATI_APERTI, "annullato"]);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Invito eliminato");
      void queryClient.invalidateQueries({ queryKey: chiaviContratti.lista });
    },
    onError: erroreGenerico("Invito non eliminato"),
  });
}
