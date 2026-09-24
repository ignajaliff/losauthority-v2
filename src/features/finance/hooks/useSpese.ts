import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { parseImporto } from "@/features/fatture";
import { supabase } from "@/integrations/supabase/client";
import { logDev } from "@/shared/utils/errors";
import { formatCurrency } from "@/shared/utils/formatCurrency";
import { todayIso } from "@/shared/utils/formatDate";
import type { SpesaModificaValues, SpesaValues } from "../schema";
import { BUCKET_RICEVUTE, type Spesa, type SpesaInsert, type SpesaUpdate } from "../types";
import { erroreMutation, invocaFunzione } from "./invocaFunzione";
import { chiaviFinance } from "./useFinanceStats";

interface RispostaScansione {
  spesa: Spesa;
}

export interface EsitoScansione {
  spesa: Spesa | null;
  lettoDaAI: boolean;
}

/** Tutte le spese, dalla più recente. */
export function useSpese() {
  return useQuery({
    queryKey: chiaviFinance.spese,
    queryFn: async (): Promise<Spesa[]> => {
      const { data, error } = await supabase
        .from("spese")
        .select("*")
        .order("data", { ascending: false })
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

const ESTENSIONI: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/heic": "heic",
  "application/pdf": "pdf",
};

/**
 * Carica lo scontrino in ricevute/{uuid}.{ext} e fa leggere importo/descrizione/data
 * all'AI (`spese-scansiona`, che inserisce la spesa). Se la lettura fallisce, registra una
 * spesa variabile a 0 da correggere a mano (niente file orfani).
 */
export function useScansionaScontrino() {
  const invalida = useInvalidaFinance();
  return useMutation({
    mutationFn: async (file: File): Promise<EsitoScansione> => {
      const ext = ESTENSIONI[file.type] ?? "jpg";
      const path = `${crypto.randomUUID()}.${ext}`;
      const { error: errUpload } = await supabase.storage
        .from(BUCKET_RICEVUTE)
        .upload(path, file, { contentType: file.type || "image/jpeg", upsert: false });
      if (errUpload) throw errUpload;

      try {
        const { spesa } = await invocaFunzione<RispostaScansione>("spese-scansiona", { storage_path: path });
        return { spesa, lettoDaAI: true };
      } catch (errore) {
        logDev(errore);
        const riga: SpesaInsert = { descrizione: "Scontrino", importo: 0, tipo: "variabile", data: todayIso(), ricevuta_path: path };
        const { error: errInsert } = await supabase.from("spese").insert(riga);
        if (errInsert) throw errInsert;
        return { spesa: null, lettoDaAI: false };
      }
    },
    onSuccess: async (esito) => {
      if (esito.lettoDaAI && esito.spesa) {
        toast.success(`Letto: ${formatCurrency(esito.spesa.importo)}`, { description: esito.spesa.descrizione });
      } else {
        toast.warning("Foto salvata ma non letta", { description: "Correggi importo e descrizione nella riga «Scontrino»." });
      }
      await invalida();
    },
    onError: erroreMutation("Non sono riuscito a leggere lo scontrino"),
  });
}

export function useAggiungiSpesa() {
  const invalida = useInvalidaFinance();
  return useMutation({
    mutationFn: async (values: SpesaValues) => {
      const riga: SpesaInsert = {
        descrizione: values.descrizione,
        importo: parseImporto(values.importo),
        tipo: values.tipo,
        data: values.data,
      };
      const { error } = await supabase.from("spese").insert(riga);
      if (error) throw error;
    },
    onSuccess: async () => {
      toast.success("Spesa aggiunta");
      await invalida();
    },
    onError: erroreMutation("Non sono riuscito a salvare la spesa"),
  });
}

export function useModificaSpesa() {
  const invalida = useInvalidaFinance();
  return useMutation({
    mutationFn: async ({ id, values }: { id: string; values: SpesaModificaValues }) => {
      const patch: SpesaUpdate = {
        descrizione: values.descrizione,
        importo: parseImporto(values.importo),
        data: values.data,
      };
      const { error } = await supabase.from("spese").update(patch).eq("id", id);
      if (error) throw error;
    },
    onSuccess: async () => {
      toast.success("Spesa aggiornata");
      await invalida();
    },
    onError: erroreMutation("Non sono riuscito a salvare le modifiche"),
  });
}

/** Sospende / riattiva una spesa fissa. */
export function useToggleAttivaSpesa() {
  const invalida = useInvalidaFinance();
  return useMutation({
    mutationFn: async (spesa: Pick<Spesa, "id" | "attiva">) => {
      const { error } = await supabase.from("spese").update({ attiva: !spesa.attiva }).eq("id", spesa.id);
      if (error) throw error;
      return !spesa.attiva;
    },
    onSuccess: async (attiva) => {
      toast.success(attiva ? "Spesa fissa riattivata" : "Spesa fissa sospesa");
      await invalida();
    },
    onError: erroreMutation("Non sono riuscito ad aggiornare la spesa"),
  });
}

/** Elimina la spesa e, se c'è, la foto dello scontrino. */
export function useEliminaSpesa() {
  const invalida = useInvalidaFinance();
  return useMutation({
    mutationFn: async (spesa: Pick<Spesa, "id" | "ricevuta_path">) => {
      const { error } = await supabase.from("spese").delete().eq("id", spesa.id);
      if (error) throw error;
      if (spesa.ricevuta_path) {
        const { error: errFile } = await supabase.storage.from(BUCKET_RICEVUTE).remove([spesa.ricevuta_path]);
        if (errFile) logDev(errFile); // best effort
      }
    },
    onSuccess: async () => {
      toast.success("Spesa eliminata");
      await invalida();
    },
    onError: erroreMutation("Non sono riuscito a eliminare la spesa"),
  });
}
