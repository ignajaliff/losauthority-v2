import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { parseImporto } from "@/features/fatture";
import { supabase } from "@/integrations/supabase/client";
import { logDev } from "@/shared/utils/errors";
import { todayIso } from "@/shared/utils/formatDate";
import type { F24Values } from "../schema";
import { BUCKET_F24, type F24, type F24Update } from "../types";
import { erroreMutation, invocaFunzione } from "./invocaFunzione";
import { chiaviFinance } from "./useFinanceStats";

interface RispostaEstrazione {
  righe: F24[];
}

export interface EsitoCaricamentoF24 {
  righe: number;
  /** Il PDF è salvato ma la lettura AI è fallita: riga vuota da compilare a mano. */
  lettoDaAI: boolean;
}

/** Tutti gli F24: prima quelli con scadenza più vicina. */
export function useF24() {
  return useQuery({
    queryKey: chiaviFinance.f24,
    queryFn: async (): Promise<F24[]> => {
      const { data, error } = await supabase
        .from("f24")
        .select("*")
        .order("scadenza", { ascending: true, nullsFirst: false })
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

function useInvalidaFinance() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: chiaviFinance.radice });
}

/**
 * Carica il PDF in f24/{uuid}.pdf e fa leggere le rate all'AI (`f24-estrai`).
 * Se la lettura fallisce, registra comunque una riga vuota legata al PDF (niente file orfani).
 */
export function useCaricaF24() {
  const invalida = useInvalidaFinance();
  return useMutation({
    mutationFn: async (pdf: File): Promise<EsitoCaricamentoF24> => {
      const path = `${crypto.randomUUID()}.pdf`;
      const { error: errUpload } = await supabase.storage
        .from(BUCKET_F24)
        .upload(path, pdf, { contentType: "application/pdf", upsert: false });
      if (errUpload) throw errUpload;

      try {
        const { righe } = await invocaFunzione<RispostaEstrazione>("f24-estrai", { storage_path: path });
        return { righe: righe.length, lettoDaAI: true };
      } catch (errore) {
        logDev(errore);
        const { error: errInsert } = await supabase.from("f24").insert({ pdf_path: path });
        if (errInsert) throw errInsert;
        return { righe: 1, lettoDaAI: false };
      }
    },
    onSuccess: async (esito) => {
      if (esito.lettoDaAI) toast.success(`Letto: ${esito.righe} ${esito.righe === 1 ? "rata" : "rate"}`);
      else toast.warning("PDF caricato ma non letto", { description: "Compila la riga a mano oppure premi «Rileggi con AI»." });
      await invalida();
    },
    onError: erroreMutation("Non sono riuscito a caricare l'F24"),
  });
}

/** Rilegge il PDF di una riga già registrata (aggiorna la riga e aggiunge le rate mancanti). */
export function useRileggiF24() {
  const invalida = useInvalidaFinance();
  return useMutation({
    mutationFn: async (f24Id: string) => {
      const { righe } = await invocaFunzione<RispostaEstrazione>("f24-estrai", { f24_id: f24Id });
      return righe.length;
    },
    onSuccess: async (n) => {
      toast.success(`Riletto: ${n} ${n === 1 ? "rata" : "rate"}`);
      await invalida();
    },
    onError: erroreMutation("Non sono riuscito a rileggere l'F24"),
  });
}

export function useTogglePagatoF24() {
  const invalida = useInvalidaFinance();
  return useMutation({
    mutationFn: async (f24: Pick<F24, "id" | "pagato">) => {
      const diventaPagato = !f24.pagato;
      const { error } = await supabase
        .from("f24")
        .update({ pagato: diventaPagato, pagato_il: diventaPagato ? todayIso() : null })
        .eq("id", f24.id);
      if (error) throw error;
      return diventaPagato;
    },
    onSuccess: async (diventaPagato) => {
      toast.success(diventaPagato ? "F24 segnato come pagato" : "F24 segnato da pagare");
      await invalida();
    },
    onError: erroreMutation("Non sono riuscito ad aggiornare l'F24"),
  });
}

export function useModificaF24() {
  const invalida = useInvalidaFinance();
  return useMutation({
    mutationFn: async ({ id, values }: { id: string; values: F24Values }) => {
      const patch: F24Update = {
        descrizione: values.descrizione || null,
        importo: values.importo ? parseImporto(values.importo) : null,
        scadenza: values.scadenza || null,
      };
      const { error } = await supabase.from("f24").update(patch).eq("id", id);
      if (error) throw error;
    },
    onSuccess: async () => {
      toast.success("F24 aggiornato");
      await invalida();
    },
    onError: erroreMutation("Non sono riuscito a salvare le modifiche"),
  });
}

/** Elimina la riga; il PDF si rimuove solo se nessun'altra rata lo usa. */
export function useEliminaF24() {
  const invalida = useInvalidaFinance();
  return useMutation({
    mutationFn: async (f24: Pick<F24, "id" | "pdf_path">) => {
      const { error } = await supabase.from("f24").delete().eq("id", f24.id);
      if (error) throw error;

      const { count, error: errCount } = await supabase
        .from("f24")
        .select("id", { count: "exact", head: true })
        .eq("pdf_path", f24.pdf_path);
      if (errCount) {
        logDev(errCount);
        return;
      }
      if ((count ?? 0) === 0) {
        const { error: errFile } = await supabase.storage.from(BUCKET_F24).remove([f24.pdf_path]);
        if (errFile) logDev(errFile); // best effort
      }
    },
    onSuccess: async () => {
      toast.success("F24 eliminato");
      await invalida();
    },
    onError: erroreMutation("Non sono riuscito a eliminare l'F24"),
  });
}
