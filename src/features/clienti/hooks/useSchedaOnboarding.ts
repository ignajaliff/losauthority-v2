import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { comeStatoRiga, paroleDi, risposteDaRiga, type Parole, type RigaChiarimento, type RigaLettura, type Risposte, type StatoRiga } from "@/features/scheda";
import { chiaviClienti } from "./chiavi";

/** Scheda onboarding di un cliente vista dal team (sola lettura). */
export interface SchedaOnboardingCliente {
  fase: StatoRiga;
  inviatoIl: string | null;
  aggiornatoIl: string;
  risposte: Risposte;
  parole: Parole;
  riepilogo: string | null;
  riepilogoCorrezione: string | null;
  materialiTesto: string | null;
}

/**
 * Riga di `data_onboarding` del cliente con le risposte ricostruite.
 * `null` se il cliente non ha ancora aperto la scheda (a differenza dell'area
 * cliente, il team non crea mai la riga).
 */
export function useSchedaOnboarding(clienteId: string) {
  return useQuery({
    queryKey: chiaviClienti.onboarding(clienteId),
    queryFn: async (): Promise<SchedaOnboardingCliente | null> => {
      const { data, error } = await supabase.from("data_onboarding").select("*").eq("id", clienteId).maybeSingle();
      if (error) throw error;
      if (!data) return null;
      const risposte = risposteDaRiga(data);
      return {
        fase: comeStatoRiga(data.stato),
        inviatoIl: data.inviato_il,
        aggiornatoIl: data.updated_at,
        risposte,
        parole: paroleDi(risposte, data),
        riepilogo: data.riepilogo,
        riepilogoCorrezione: data.riepilogo_correzione,
        materialiTesto: data.materiali_testo,
      };
    },
  });
}

/** La lettura di Aura (solo team, RLS) e i chiarimenti con le risposte del cliente. */
export interface LetturaOnboardingCliente {
  lettura: RigaLettura | null;
  chiarimenti: RigaChiarimento[];
}

export function useLetturaOnboarding(clienteId: string) {
  return useQuery({
    queryKey: chiaviClienti.lettura(clienteId),
    queryFn: async (): Promise<LetturaOnboardingCliente> => {
      const [lettura, chiarimenti] = await Promise.all([
        supabase.from("onboarding_lettura").select("*").eq("id", clienteId).maybeSingle(),
        supabase.from("onboarding_chiarimenti").select("*").eq("cliente_id", clienteId).order("ordine"),
      ]);
      if (lettura.error) throw lettura.error;
      if (chiarimenti.error) throw chiarimenti.error;
      return { lettura: lettura.data, chiarimenti: chiarimenti.data ?? [] };
    },
  });
}
