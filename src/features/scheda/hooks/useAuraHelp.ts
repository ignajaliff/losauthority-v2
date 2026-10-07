import { useMutation } from "@tanstack/react-query";
import { logDev, MESSAGGIO_ERRORE_GENERICO } from "@/shared/utils/errors";
import type { IdDomanda } from "../types";
import { invocaFunzione } from "./edge";

export interface RichiestaAura {
  domanda: string;
  domanda_id: IdDomanda;
}

export type EsitoAura = { ok: true; risposta: string } | { ok: false; error: string };

/**
 * Aiuto contestuale di Aura mentre il cliente compila. Il rate limit arriva
 * come `{ ok:false, error }` e si mostra così com'è (niente toast: è inline).
 */
export function useAuraHelp() {
  return useMutation({
    mutationFn: async (richiesta: RichiestaAura): Promise<EsitoAura> => {
      try {
        const esito = await invocaFunzione<{ risposta: string }>("aura-help", { ...richiesta });
        return esito.ok ? { ok: true, risposta: esito.risposta } : { ok: false, error: esito.error };
      } catch (error) {
        logDev(error);
        return { ok: false, error: MESSAGGIO_ERRORE_GENERICO };
      }
    },
  });
}
