import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { logDev, MESSAGGIO_ERRORE_GENERICO } from "@/shared/utils/errors";
import type { DocumentoLegale, VersioneCrm } from "../types";
import { chiaviCrm } from "./useLeadCrm";

/** Stato della sezione Clienti per l'utente collegato (lo decide il database, `crm_stato`). */
export interface StatoCrm {
  /** Ha accettato la versione in vigore: può leggere e scrivere i contatti. */
  attivo: boolean;
  versioneCorrente: number | null;
  /** L'ultima versione che ha accettato (anche se non è più in vigore). */
  versioneAccettata: number | null;
  accettataIl: string | null;
}

/**
 * Si ricontrolla a ogni apertura della pagina: dalla data di efficacia di una
 * versione nuova la sezione si richiude da sola.
 */
export function useStatoCrm(clienteId: string | undefined) {
  return useQuery({
    queryKey: chiaviCrm.stato(clienteId ?? ""),
    enabled: !!clienteId,
    staleTime: 0,
    queryFn: async (): Promise<StatoCrm> => {
      const { data, error } = await supabase.rpc("crm_stato");
      if (error) throw error;
      const r = data?.[0];
      return {
        attivo: r?.attivo ?? false,
        versioneCorrente: r?.versione_corrente ?? null,
        versioneAccettata: r?.versione_accettata ?? null,
        accettataIl: r?.accettata_il ?? null,
      };
    },
  });
}

export interface DocumentiCrm {
  versioni: VersioneCrm[];
  /** id → documento, con il testo completo. */
  documenti: Record<string, DocumentoLegale>;
}

/** Tutte le versioni pubblicate con i loro documenti (pochi e piccoli: si leggono insieme). */
export function useDocumentiCrm(abilitato: boolean) {
  return useQuery({
    queryKey: chiaviCrm.documenti,
    enabled: abilitato,
    queryFn: async (): Promise<DocumentiCrm> => {
      const [versioni, documenti] = await Promise.all([
        supabase.from("crm_versioni").select("*").order("versione"),
        supabase.from("documenti_legali").select("*").order("versione"),
      ]);
      if (versioni.error) throw versioni.error;
      if (documenti.error) throw documenti.error;
      return { versioni: versioni.data ?? [], documenti: Object.fromEntries((documenti.data ?? []).map((d) => [d.id, d])) };
    },
  });
}

/** Le tre caselle sono spuntate: il database registra l'accettazione con il testo della versione. */
export function useAccettaCrm(clienteId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (versione: number): Promise<string> => {
      const { data, error } = await supabase.rpc("crm_accetta", { p_versione: versione, p_caselle: [true, true, true] });
      if (error) throw error;
      return data;
    },
    onError: (error) => {
      toast.error("Attivazione non riuscita", {
        description: /cambiati/.test(error.message) ? "I documenti sono cambiati: ricarica la pagina e rileggili." : MESSAGGIO_ERRORE_GENERICO,
      });
      logDev(error);
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: chiaviCrm.stato(clienteId) });
      void queryClient.invalidateQueries({ queryKey: chiaviCrm.lead(clienteId) });
      void queryClient.invalidateQueries({ queryKey: chiaviCrm.arrivi(clienteId) });
    },
  });
}
