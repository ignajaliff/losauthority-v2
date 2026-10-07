import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { domandeAttive } from "@onboarding/definizione.ts";
import { chiaviScheda, patchDaRisposte, risposteDaRiga, statoDaRiga } from "../mappa";
import type { RigaOnboarding, Risposte, StatoSchedaInfo } from "../types";

export interface SchedaConRisposte {
  riga: RigaOnboarding;
  risposte: Risposte;
}

/** Legge la riga del cliente; al primo accesso la crea vuota (bozza). */
async function leggiOCreaRiga(clienteId: string): Promise<RigaOnboarding> {
  const { data, error } = await supabase.from("data_onboarding").select("*").eq("id", clienteId).maybeSingle();
  if (error) throw error;
  if (data) return data;
  const creata = await supabase.from("data_onboarding").insert({ id: clienteId }).select("*").single();
  if (creata.error) throw creata.error;
  return creata.data;
}

/**
 * Salva TUTTE le risposte in memoria (non solo quelle in coda): si usa prima di
 * far leggere Aura, così niente va perso anche se qualche salvataggio
 * automatico è fallito. Upsert: se la riga manca (es. tabella appena
 * ricreata) la crea. Lancia l'errore Postgres.
 */
export async function salvaTutteLeRisposte(clienteId: string, risposte: Risposte, sezioneIndice: number): Promise<void> {
  const patch = patchDaRisposte(risposte, domandeAttive(risposte));
  const { error } = await supabase
    .from("data_onboarding")
    .upsert({ id: clienteId, ...patch, schermata: "sezione", sezione_indice: sezioneIndice }, { onConflict: "id" });
  if (error) throw error;
}

/** Riga + risposte ricostruite della scheda del cliente loggato. */
export function useScheda(clienteId: string | undefined) {
  return useQuery({
    queryKey: chiaviScheda.riga(clienteId ?? ""),
    enabled: !!clienteId,
    queryFn: async (): Promise<SchedaConRisposte> => {
      const riga = await leggiOCreaRiga(clienteId ?? "");
      return { riga, risposte: risposteDaRiga(riga) };
    },
  });
}

const COLONNE_STATO = "stato, inviato_il, sezione_indice, updated_at";

/** Solo lo stato (mancante / bozza / inviata) della scheda di un cliente. */
export function useStatoScheda(clienteId: string | undefined) {
  return useQuery({
    queryKey: chiaviScheda.stato(clienteId ?? ""),
    enabled: !!clienteId,
    queryFn: async (): Promise<StatoSchedaInfo> => {
      const { data, error } = await supabase
        .from("data_onboarding")
        .select(COLONNE_STATO)
        .eq("id", clienteId ?? "")
        .maybeSingle();
      if (error) throw error;
      return statoDaRiga(data);
    },
  });
}
