import { useMutation, useQueryClient, type QueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { logDev, MESSAGGIO_ERRORE_GENERICO } from "@/shared/utils/errors";
import { todayIso } from "@/shared/utils/formatDate";
import { parseImporto, type FatturaValues } from "../schema";
import { BUCKET_FATTURE, type Fattura, type FatturaInsert } from "../types";
import { chiaviFatture } from "./useFattureCliente";

/** Le fatture influenzano lista clienti (vista_clienti) e Finance: invalida tutto. */
async function invalidaFatture(queryClient: QueryClient) {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: chiaviFatture.radice }),
    queryClient.invalidateQueries({ queryKey: ["clienti"] }),
    queryClient.invalidateQueries({ queryKey: ["finance"] }),
  ]);
}

function erroreMutation(titolo: string) {
  return (error: unknown) => {
    toast.error(titolo, { description: MESSAGGIO_ERRORE_GENERICO });
    logDev(error);
  };
}

/** Carica il PDF (se c'è) in fatture/{clienteId}/{uuid}.pdf e inserisce la fattura. */
export function useAggiungiFattura(clienteId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (values: FatturaValues) => {
      let pdf_path: string | null = null;
      if (values.pdf) {
        const path = `${clienteId}/${crypto.randomUUID()}.pdf`;
        const { error: errUpload } = await supabase.storage
          .from(BUCKET_FATTURE)
          .upload(path, values.pdf, { contentType: "application/pdf", upsert: false });
        if (errUpload) throw errUpload;
        pdf_path = path;
      }

      const riga: FatturaInsert = {
        cliente_id: clienteId,
        descrizione: values.descrizione || null,
        importo: parseImporto(values.importo),
        emessa_il: values.emessa_il,
        prossimo_pagamento: values.prossimo_pagamento || null,
        note: values.note || null,
        pdf_path,
      };
      const { error } = await supabase.from("fatture").insert(riga);
      if (error) {
        // Niente record a metà: se l'insert fallisce togliamo il PDF appena caricato.
        if (pdf_path) await supabase.storage.from(BUCKET_FATTURE).remove([pdf_path]);
        throw error;
      }
    },
    onSuccess: async () => {
      toast.success("Fattura aggiunta");
      await invalidaFatture(queryClient);
    },
    onError: erroreMutation("Non sono riuscito a salvare la fattura"),
  });
}

/**
 * Segna pagata / da pagare (pagata_il = oggi). Alla prima fattura pagata, se il cliente
 * non ha ancora una data di inizio percorso, la imposta a oggi (come nel sistema precedente).
 */
export function useTogglePagataFattura() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (fattura: Pick<Fattura, "id" | "cliente_id" | "pagata">) => {
      const oggi = todayIso();
      const diventaPagata = !fattura.pagata;
      const { error } = await supabase
        .from("fatture")
        .update({ pagata: diventaPagata, pagata_il: diventaPagata ? oggi : null })
        .eq("id", fattura.id);
      if (error) throw error;

      if (diventaPagata) {
        const { data: cliente } = await supabase
          .from("clienti")
          .select("data_inizio")
          .eq("id", fattura.cliente_id)
          .maybeSingle();
        if (cliente && !cliente.data_inizio) {
          const { error: errInizio } = await supabase
            .from("clienti")
            .update({ data_inizio: oggi })
            .eq("id", fattura.cliente_id);
          if (errInizio) logDev(errInizio); // secondario: non blocca il pagamento
        }
      }
      return diventaPagata;
    },
    onSuccess: async (diventaPagata) => {
      toast.success(diventaPagata ? "Fattura segnata come pagata" : "Fattura segnata da pagare");
      await invalidaFatture(queryClient);
    },
    onError: erroreMutation("Non sono riuscito ad aggiornare la fattura"),
  });
}

/** Elimina la fattura e, se c'è, il PDF dallo storage. */
export function useEliminaFattura() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (fattura: Pick<Fattura, "id" | "pdf_path">) => {
      const { error } = await supabase.from("fatture").delete().eq("id", fattura.id);
      if (error) throw error;
      if (fattura.pdf_path) {
        const { error: errFile } = await supabase.storage.from(BUCKET_FATTURE).remove([fattura.pdf_path]);
        if (errFile) logDev(errFile); // best effort: la riga è già eliminata
      }
    },
    onSuccess: async () => {
      toast.success("Fattura eliminata");
      await invalidaFatture(queryClient);
    },
    onError: erroreMutation("Non sono riuscito a eliminare la fattura"),
  });
}
