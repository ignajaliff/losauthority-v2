import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { logDev, MESSAGGIO_ERRORE_GENERICO } from "@/shared/utils/errors";
import type { Questionario, Risposte } from "../types";
import { domandeDi } from "../registry";
import { validaQuestionario, type EsitoValidazione } from "../schema";
import { chiaviQuestionari, scriviRisposte } from "./risposteDb";
import { invocaFunzione } from "./edge";

/** Errore di validazione: il flow lo usa per tornare alla prima sezione invalida. */
export class ErroreValidazione extends Error {
  constructor(public esito: EsitoValidazione) {
    super("Alcuni campi obbligatori non sono compilati correttamente.");
    this.name = "ErroreValidazione";
  }
}

interface ParametriInvio {
  invioId: string | undefined;
  clienteId: string;
  questionario: Questionario;
  /** Salva la bozza in coda prima di inviare. */
  primaDiInviare?: () => Promise<void>;
}

/**
 * Invio definitivo: valida tutto (Zod dalla definizione), scrive le risposte
 * finali, marca l'invio come inviato e avvisa `onboarding-completato`.
 */
export function useInviaQuestionario({ invioId, clienteId, questionario, primaDiInviare }: ParametriInvio) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (risposte: Risposte): Promise<{ completato: boolean }> => {
      if (!invioId) throw new Error("Invio non pronto");
      const esito = validaQuestionario(questionario, risposte);
      if (!esito.ok) throw new ErroreValidazione(esito);

      await primaDiInviare?.();
      await scriviRisposte(invioId, risposte, domandeDi(questionario));

      const { error } = await supabase
        .from("questionario_invii")
        .update({ stato: "inviato", inviato_il: new Date().toISOString() })
        .eq("id", invioId);
      if (error) throw error;

      const risposta = await invocaFunzione<{ completato: boolean }>("onboarding-completato", {});
      // L'invio è già salvato: un errore qui non deve far credere che sia fallito.
      if (!risposta.ok) {
        logDev(risposta.error);
        return { completato: false };
      }
      return { completato: risposta.completato };
    },
    onSuccess: ({ completato }) => {
      toast.success(`"${questionario.titolo}" inviata.`);
      if (completato) toast.success("Hai completato tutte le schede!");
      void queryClient.invalidateQueries({ queryKey: chiaviQuestionari.invio(clienteId, questionario.id) });
      void queryClient.invalidateQueries({ queryKey: chiaviQuestionari.stati(clienteId) });
    },
    onError: (error) => {
      if (error instanceof ErroreValidazione) return; // gestito inline dal flow
      toast.error("Invio non riuscito", { description: MESSAGGIO_ERRORE_GENERICO });
      logDev(error);
    },
  });
}
