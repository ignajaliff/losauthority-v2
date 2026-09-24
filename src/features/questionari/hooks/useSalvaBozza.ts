import { useCallback, useEffect, useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { logDev, MESSAGGIO_ERRORE_GENERICO } from "@/shared/utils/errors";
import type { Domanda, Questionario, Risposte } from "../types";
import { domandeDi } from "../registry";
import { chiaviQuestionari, scriviRisposte } from "./risposteDb";

const RITARDO_MS = 800;

export type StatoSalvataggio = "inattivo" | "in_attesa" | "salvataggio" | "salvato" | "errore";

export interface MetaBozza {
  schermata: string;
  sezioneIndice: number;
}

interface Coda {
  risposte: Risposte;
  domandeIds: Set<string>;
  meta: MetaBozza;
}

interface ParametriBozza {
  invioId: string | undefined;
  clienteId: string;
  questionario: Questionario;
}

/**
 * Salvataggio automatico della bozza (debounce 800 ms): scrive le righe delle
 * domande cambiate e aggiorna schermata/sezione_indice dell'invio.
 */
export function useSalvaBozza({ invioId, clienteId, questionario }: ParametriBozza) {
  const queryClient = useQueryClient();
  const [stato, setStato] = useState<StatoSalvataggio>("inattivo");
  const [ultimoSalvataggio, setUltimoSalvataggio] = useState<Date | null>(null);
  const codaRef = useRef<Coda | null>(null);
  const timerRef = useRef<number | null>(null);
  const domandePerId = useRef(new Map(domandeDi(questionario).map((d) => [d.id, d])));

  const mutation = useMutation({
    mutationFn: async (coda: Coda) => {
      if (!invioId) return;
      const domande = [...coda.domandeIds]
        .map((id) => domandePerId.current.get(id))
        .filter((d): d is Domanda => !!d);
      await scriviRisposte(invioId, coda.risposte, domande);
      const { error } = await supabase
        .from("questionario_invii")
        .update({ schermata: coda.meta.schermata, sezione_indice: coda.meta.sezioneIndice })
        .eq("id", invioId);
      if (error) throw error;
    },
    onSuccess: () => {
      setStato("salvato");
      setUltimoSalvataggio(new Date());
      void queryClient.invalidateQueries({ queryKey: chiaviQuestionari.stati(clienteId) });
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
    if (!coda || !invioId) return;
    setStato("salvataggio");
    mutation.mutate(coda);
  }, [invioId, mutation]);

  /** Accoda un salvataggio: unisce le domande cambiate e riparte il timer. */
  const programma = useCallback(
    (risposte: Risposte, domandeCambiate: string[], meta: MetaBozza) => {
      const precedente = codaRef.current;
      const domandeIds = precedente ? precedente.domandeIds : new Set<string>();
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
    if (!coda || !invioId) return;
    setStato("salvataggio");
    await mutation.mutateAsync(coda);
  }, [invioId, mutation]);

  useEffect(
    () => () => {
      if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    },
    [],
  );

  return { programma, svuota, stato, ultimoSalvataggio };
}
