import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { chiaviClienti } from "@/features/clienti";
import { chiaviFatture } from "@/features/fatture";
import { logDev } from "@/shared/utils/errors";
import { erroreMutation, invocaEdge } from "@/shared/utils/invocaEdge";
import type { Firma } from "@contratti/tipi.ts";
import { chiaviContratti } from "./useContratti";
import { chiaviOfferte } from "./useOfferte";

/* Le operazioni che passano dalla Edge Function contratti-admin (service role o controllo lato server). */

export interface EsitoInvito {
  id: string;
  token: string;
  offerta: string;
  programma: string;
}

/** Nuovo invito: si sceglie l'offerta e basta. I dati del cliente li inserisce lui dal link. */
export function useCreaInvito() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { offerta_id: string; note: string }) => invocaEdge<EsitoInvito>("contratti-admin", { azione: "crea_invito", ...input }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: chiaviContratti.lista });
      void queryClient.invalidateQueries({ queryKey: chiaviOfferte.lista });
    },
    onError: erroreMutation("Non sono riuscito a creare l'invito"),
  });
}

/** La firma di Wesley: validata sul server (solo la forma del tratto), finisce su ogni nuovo invito. */
export function useSalvaFirmaFornitore() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (firma: Firma) => invocaEdge<Record<string, never>>("contratti-admin", { azione: "salva_firma", firma }),
    onSuccess: () => {
      toast.success("Firma salvata");
      void queryClient.invalidateQueries({ queryKey: chiaviContratti.impostazioni });
    },
    onError: erroreMutation("Firma non salvata"),
  });
}

export interface EsitoPagamento {
  cliente_id: string;
  fattura_id: string;
}

/**
 * «Segna come pagato»: la funzione crea account, scheda e fattura; se Wesley ha allegato il PDF
 * della fattura, lo carichiamo noi nel bucket `fatture` e lo leghiamo alla riga appena creata.
 */
export function useSegnaPagato(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { pagato_il: string; pdf: File | null }): Promise<EsitoPagamento> => {
      const esito = await invocaEdge<EsitoPagamento>("contratti-admin", { azione: "segna_pagato", id, pagato_il: input.pagato_il });
      if (input.pdf) {
        const path = `${esito.cliente_id}/${crypto.randomUUID()}.pdf`;
        const { error: upErr } = await supabase.storage.from("fatture").upload(path, input.pdf, { contentType: "application/pdf", upsert: false });
        if (upErr) {
          logDev(upErr);
          toast.warning("Pagamento registrato, ma il PDF della fattura non è stato caricato", { description: "Puoi aggiungerlo dalla scheda del cliente." });
        } else {
          const { error: dbErr } = await supabase.from("fatture").update({ pdf_path: path }).eq("id", esito.fattura_id);
          if (dbErr) logDev(dbErr);
        }
      }
      return esito;
    },
    onSuccess: (esito) => {
      toast.success("Pagamento registrato", { description: "La scheda del cliente è pronta, con la fattura incassata." });
      void queryClient.invalidateQueries({ queryKey: chiaviContratti.lista });
      void queryClient.invalidateQueries({ queryKey: chiaviContratti.uno(id) });
      void queryClient.invalidateQueries({ queryKey: chiaviClienti.tutti });
      void queryClient.invalidateQueries({ queryKey: chiaviFatture.cliente(esito.cliente_id) });
    },
    onError: erroreMutation("Pagamento non registrato"),
  });
}

export interface EsitoAttivazione {
  cliente_id: string;
  email: string | null;
  /** Presente solo se l'account è nuovo: si vede una volta sola. */
  password: string | null;
  nome: string | null;
  scade_il: string;
  recesso_fino_al: string | null;
}

export function useAttivaContratto(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (consegne: string[]) => invocaEdge<EsitoAttivazione>("contratti-admin", { azione: "attiva", id, consegne }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: chiaviContratti.lista });
      void queryClient.invalidateQueries({ queryKey: chiaviContratti.uno(id) });
      void queryClient.invalidateQueries({ queryKey: chiaviClienti.tutti });
    },
    onError: erroreMutation("Attivazione non riuscita"),
  });
}

/** Il PDF firmato: la funzione lo rigenera se manca e restituisce un URL firmato (60 s) che apriamo in una scheda nuova. */
export function useScaricaPdfContratto() {
  return useMutation({
    mutationFn: async (id: string) => {
      const finestra = window.open("", "_blank");
      try {
        const { url } = await invocaEdge<{ url: string; nome_file: string }>("contratti-admin", { azione: "pdf", id });
        if (finestra) finestra.location.href = url;
        else window.open(url, "_blank", "noopener");
      } catch (e) {
        finestra?.close();
        throw e;
      }
    },
    onError: erroreMutation("Non riesco ad aprire il PDF"),
  });
}
