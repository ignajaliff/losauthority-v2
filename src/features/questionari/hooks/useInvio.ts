import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Invio, Questionario, Risposte } from "../types";
import { chiaviQuestionari, ricostruisciRisposte } from "./risposteDb";

export interface InvioConRisposte {
  invio: Invio;
  risposte: Risposte;
}

const COLONNE_INVIO = "id, cliente_id, questionario_id, stato, schermata, sezione_indice, inviato_il, created_at, updated_at";

/** Legge l'invio (cliente, questionario); se non esiste lo crea in bozza. */
async function leggiOCreaInvio(clienteId: string, questionarioId: string): Promise<Invio> {
  const { data, error } = await supabase
    .from("questionario_invii")
    .select(COLONNE_INVIO)
    .eq("cliente_id", clienteId)
    .eq("questionario_id", questionarioId)
    .maybeSingle();
  if (error) throw error;
  if (data) return data;

  const { data: creato, error: erroreInsert } = await supabase
    .from("questionario_invii")
    .insert({ cliente_id: clienteId, questionario_id: questionarioId })
    .select(COLONNE_INVIO)
    .single();
  if (erroreInsert) throw erroreInsert;
  return creato;
}

/** Invio + risposte ricostruite per (cliente, scheda). Crea la bozza al primo accesso. */
export function useInvio(clienteId: string | undefined, questionario: Questionario) {
  return useQuery({
    queryKey: chiaviQuestionari.invio(clienteId ?? "", questionario.id),
    enabled: !!clienteId,
    queryFn: async (): Promise<InvioConRisposte> => {
      const invio = await leggiOCreaInvio(clienteId ?? "", questionario.id);
      const { data, error } = await supabase
        .from("questionario_risposte")
        .select("domanda_id, ordine, valore")
        .eq("invio_id", invio.id)
        .order("domanda_id")
        .order("ordine");
      if (error) throw error;
      return { invio, risposte: ricostruisciRisposte(data ?? [], questionario) };
    },
  });
}
