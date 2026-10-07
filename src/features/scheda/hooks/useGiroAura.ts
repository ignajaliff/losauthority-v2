import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { logDev, MESSAGGIO_ERRORE_GENERICO } from "@/shared/utils/errors";
import { chiaviScheda } from "../mappa";
import type { Parole, RigaChiarimento, StatoRiga, StatoSchedaInfo } from "../types";
import { invocaFunzione } from "./edge";

/** Esito del giro di lettura (`onboarding-lettura`, azione `leggi`). */
export interface EsitoLettura {
  stato: Extract<StatoRiga, "chiarimenti" | "riepilogo">;
  chiarimenti: RigaChiarimento[];
  riepilogo: string | null;
}

/** Errore con un messaggio già pensato per il cliente (arriva dalla Edge Function). */
export class ErroreAura extends Error {
  constructor(messaggio: string) {
    super(messaggio);
    this.name = "ErroreAura";
  }
}

/**
 * «Aura legge»: manda il profilo a Claude (compito 2). Alla prima lettura può
 * tornare con fino a 3 domande di chiarimento; alla seconda torna il riepilogo.
 * Dura anche 30-60 secondi: il chiamante mostra la schermata di attesa.
 */
export function useLeggiOnboarding(clienteId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (): Promise<EsitoLettura> => {
      const esito = await invocaFunzione<EsitoLettura>("onboarding-lettura", { azione: "leggi" });
      if (!esito.ok) throw new ErroreAura(esito.error);
      return esito;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: chiaviScheda.tutte(clienteId) });
    },
    onError: (error) => {
      if (!(error instanceof ErroreAura)) logDev(error);
    },
  });
}

/** Le domande di chiarimento del cliente (righe sue, RLS). */
export function useChiarimenti(clienteId: string | undefined) {
  return useQuery({
    queryKey: chiaviScheda.chiarimenti(clienteId ?? ""),
    enabled: !!clienteId,
    queryFn: async (): Promise<RigaChiarimento[]> => {
      const { data, error } = await supabase
        .from("onboarding_chiarimenti")
        .select("*")
        .eq("cliente_id", clienteId ?? "")
        .order("ordine");
      if (error) throw error;
      return data ?? [];
    },
  });
}

export interface RispostaChiarimento {
  id: string;
  risposta: string;
}

/** Salva le risposte ai chiarimenti (solo `risposta`: lo garantisce il trigger). */
export function useRispondiChiarimenti(clienteId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (risposte: RispostaChiarimento[]) => {
      for (const r of risposte) {
        const { error } = await supabase
          .from("onboarding_chiarimenti")
          .update({ risposta: r.risposta.trim() || null })
          .eq("id", r.id)
          .eq("cliente_id", clienteId);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: chiaviScheda.chiarimenti(clienteId) });
    },
    onError: (error) => {
      toast.error("Risposte non salvate", { description: MESSAGGIO_ERRORE_GENERICO });
      logDev(error);
    },
  });
}

/**
 * «Ho capito bene? Confermo»: chiude l'onboarding (stato inviato) e avvisa il
 * team (`onboarding-completato`, come prima). La correzione del cliente resta
 * agli atti per Wesley.
 */
export function useConfermaOnboarding(clienteId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (correzione: string): Promise<{ completato: boolean }> => {
      const esito = await invocaFunzione<{ stato: "inviato" }>("onboarding-lettura", { azione: "conferma", correzione: correzione.trim() || null });
      if (!esito.ok) throw new ErroreAura(esito.error);
      const completato = await invocaFunzione<{ completato: boolean }>("onboarding-completato", {});
      // L'invio è già salvato: un errore qui non deve far credere che sia fallito.
      if (!completato.ok) {
        logDev(completato.error);
        return { completato: false };
      }
      // Prima lettura del profilo Instagram (se la scheda ne aveva il link): parte in
      // sottofondo, senza far aspettare il cliente. Se fallisce ci pensa il cron.
      void invocaFunzione("instagram-sync", {}).catch((e: unknown) => logDev(e));
      return { completato: completato.completato };
    },
    onSuccess: ({ completato }) => {
      if (completato) toast.success("Onboarding completato: Wesley e il team lo leggeranno a breve.");
      // Lo stato in cache passa subito a "inviato": l'ingresso nello spazio cliente non deve rimbalzare.
      queryClient.setQueryData<StatoSchedaInfo>(chiaviScheda.stato(clienteId), (attuale) =>
        attuale ? { ...attuale, stato: "inviato", fase: "inviato", inviatoIl: new Date().toISOString() } : attuale,
      );
      void queryClient.invalidateQueries({ queryKey: chiaviScheda.tutte(clienteId) });
    },
    onError: (error) => {
      toast.error("Conferma non riuscita", { description: error instanceof ErroreAura ? error.message : MESSAGGIO_ERRORE_GENERICO });
      if (!(error instanceof ErroreAura)) logDev(error);
    },
  });
}

export interface RichiestaParole {
  attivita_breve: string;
  tipo: string;
  tipo_principale?: string;
}

/**
 * Compito 1: le parole del mestiere. Si chiama dopo il modulo iniziale, senza
 * bloccare il cliente; se fallisce il form usa i testi standard.
 */
export function useParole(clienteId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (richiesta: RichiestaParole): Promise<Parole | null> => {
      try {
        const esito = await invocaFunzione<{ parole: Parole }>("onboarding-parole", { ...richiesta });
        return esito.ok ? esito.parole : null;
      } catch (error) {
        logDev(error);
        return null;
      }
    },
    onSuccess: (parole) => {
      if (parole) void queryClient.invalidateQueries({ queryKey: chiaviScheda.riga(clienteId) });
    },
  });
}
