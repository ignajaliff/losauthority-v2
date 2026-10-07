import { useCallback, useEffect, useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { logDev, MESSAGGIO_ERRORE_GENERICO } from "@/shared/utils/errors";
import type { Domanda, IdDomanda, Risposte } from "../types";
import { domandaPerId } from "../scheda";
import { chiaviScheda, patchDaRisposte } from "../mappa";

const RITARDO_MS = 800;

export type StatoSalvataggio = "inattivo" | "in_attesa" | "salvataggio" | "salvato" | "errore";

export interface MetaBozza {
  schermata: string;
  sezioneIndice: number;
}

interface Coda {
  risposte: Risposte;
  domandeIds: Set<IdDomanda>;
  meta: MetaBozza;
}

/**
 * Salvataggio automatico della bozza (debounce 800 ms): aggiorna le sole
 * colonne delle domande cambiate più schermata/sezione_indice della riga.
 */
export function useSalvaBozza(clienteId: string) {
  const queryClient = useQueryClient();
  const [stato, setStato] = useState<StatoSalvataggio>("inattivo");
  const [ultimoSalvataggio, setUltimoSalvataggio] = useState<Date | null>(null);
  const codaRef = useRef<Coda | null>(null);
  const timerRef = useRef<number | null>(null);

  const mutation = useMutation({
    mutationFn: async (coda: Coda) => {
      const domande = [...coda.domandeIds].map(domandaPerId).filter((d): d is Domanda => !!d);
      const { error } = await supabase
        .from("data_onboarding")
        .update({
          ...patchDaRisposte(coda.risposte, domande),
          schermata: coda.meta.schermata,
          sezione_indice: coda.meta.sezioneIndice,
        })
        .eq("id", clienteId);
      if (error) throw error;
    },
    onSuccess: () => {
      setStato("salvato");
      setUltimoSalvataggio(new Date());
      void queryClient.invalidateQueries({ queryKey: chiaviScheda.stato(clienteId) });
    },
    onError: (error) => {
      setStato("errore");
      toast.error("Bozza non salvata", { description: MESSAGGIO_ERRORE_GENERICO });
      logDev(error);
    },
  });

  const esegui = useCallback(() => {
    timerRef.current = null;
    const coda = codaRef.current;
    codaRef.current = null;
    if (!coda) return;
    setStato("salvataggio");
    mutation.mutate(coda);
  }, [mutation]);

  /** Accoda un salvataggio: unisce le domande cambiate e riparte il timer. */
  const programma = useCallback(
    (risposte: Risposte, domandeCambiate: IdDomanda[], meta: MetaBozza) => {
      const precedente = codaRef.current;
      const domandeIds = precedente ? precedente.domandeIds : new Set<IdDomanda>();
      for (const id of domandeCambiate) domandeIds.add(id);
      codaRef.current = { risposte, domandeIds, meta };
      setStato("in_attesa");
      if (timerRef.current !== null) window.clearTimeout(timerRef.current);
      timerRef.current = window.setTimeout(esegui, RITARDO_MS);
    },
    [esegui],
  );

  /** Salva subito ciò che è in coda (prima dell'invio finale). */
  const svuota = useCallback(async () => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    const coda = codaRef.current;
    codaRef.current = null;
    if (!coda) return;
    setStato("salvataggio");
    await mutation.mutateAsync(coda);
  }, [mutation]);

  useEffect(
    () => () => {
      if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    },
    [],
  );

  return { programma, svuota, stato, ultimoSalvataggio };
}
