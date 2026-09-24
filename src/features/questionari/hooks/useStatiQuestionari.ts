import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Invio, QuestionarioId, StatoQuestionario, StatoScheda } from "../types";
import { QUESTIONARI } from "../registry";
import { chiaviQuestionari } from "./risposteDb";

type RigaInvio = Pick<Invio, "questionario_id" | "stato" | "inviato_il" | "sezione_indice" | "updated_at">;

/** Stato delle 3 schede a partire dalle righe di questionario_invii di un cliente. */
export function statiDaInvii(invii: RigaInvio[]): Record<QuestionarioId, StatoQuestionario> {
  const perId = new Map(invii.map((i) => [i.questionario_id, i]));
  const esito = {} as Record<QuestionarioId, StatoQuestionario>;
  for (const q of QUESTIONARI) {
    const invio = perId.get(q.id);
    const stato: StatoScheda = invio ? (invio.stato === "inviato" ? "inviato" : "bozza") : "mancante";
    esito[q.id] = {
      questionarioId: q.id,
      stato,
      inviatoIl: invio?.inviato_il ?? null,
      sezioneIndice: invio?.sezione_indice ?? null,
      aggiornatoIl: invio?.updated_at ?? null,
    };
  }
  return esito;
}

/** Stato bozza/inviato/mancante delle 3 schede per un cliente. */
export function useStatiQuestionari(clienteId: string | undefined) {
  return useQuery({
    queryKey: chiaviQuestionari.stati(clienteId ?? ""),
    enabled: !!clienteId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("questionario_invii")
        .select("questionario_id, stato, inviato_il, sezione_indice, updated_at")
        .eq("cliente_id", clienteId ?? "");
      if (error) throw error;
      return statiDaInvii(data ?? []);
    },
  });
}

export const ETICHETTA_STATO_SCHEDA: Record<StatoScheda, string> = {
  mancante: "Da compilare",
  bozza: "In bozza",
  inviato: "Inviata",
};
