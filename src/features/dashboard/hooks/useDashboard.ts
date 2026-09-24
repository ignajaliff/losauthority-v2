import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { todayIso } from "@/shared/utils/formatDate";
import type { ClienteDashboard, ErroreRecente, LeadDaFare, OnboardingRecente } from "../types";

export const CHIAVI_DASHBOARD = {
  clienti: ["dashboard", "clienti"] as const,
  onboarding: ["dashboard", "ultimi-onboarding"] as const,
  lead: ["dashboard", "lead-da-fare"] as const,
  errori: ["dashboard", "errori-recenti"] as const,
};

const GIORNI_ERRORI = 7;
const MAX_ERRORI = 8;
const MAX_ONBOARDING = 5;

/** Tutti i clienti (vista_clienti): da qui derivano contatori, prossime call e compiti aperti. */
export function useClientiDashboard() {
  return useQuery({
    queryKey: CHIAVI_DASHBOARD.clienti,
    queryFn: async (): Promise<ClienteDashboard[]> => {
      const { data, error } = await supabase
        .from("vista_clienti")
        .select("id, nombre, email, fase, stato_onboarding, prossima_call, di_wesley_aperti, created_at");
      if (error) throw error;
      return data;
    },
  });
}

/** Ultimi 5 clienti per data di completamento onboarding (o di creazione). */
export function useUltimiOnboarding() {
  return useQuery({
    queryKey: CHIAVI_DASHBOARD.onboarding,
    queryFn: async (): Promise<OnboardingRecente[]> => {
      const { data, error } = await supabase
        .from("clienti")
        .select("id, stato_onboarding, onboarding_completato_il, created_at, user_roles!clienti_id_fkey(nombre, email)");
      if (error) throw error;
      return data
        .map((c) => ({
          id: c.id,
          nombre: c.user_roles?.nombre ?? "",
          email: c.user_roles?.email ?? "",
          stato_onboarding: c.stato_onboarding,
          data: c.onboarding_completato_il ?? c.created_at,
        }))
        .sort((a, b) => b.data.localeCompare(a.data))
        .slice(0, MAX_ONBOARDING);
    },
  });
}

/** Lead con prossima azione scaduta o di oggi (pipeline ancora aperta). */
export function useLeadDaFare() {
  return useQuery({
    queryKey: CHIAVI_DASHBOARD.lead,
    queryFn: async (): Promise<LeadDaFare[]> => {
      const { data, error } = await supabase
        .from("lead")
        .select("id, nome, stage, prossima_azione, prossima_azione_il")
        .lte("prossima_azione_il", todayIso())
        .not("stage", "in", "(cliente,perso)")
        .order("prossima_azione_il", { ascending: true });
      if (error) throw error;
      return data;
    },
  });
}

/** Errori applicativi degli ultimi 7 giorni (max 8). */
export function useErroriRecenti() {
  return useQuery({
    queryKey: CHIAVI_DASHBOARD.errori,
    queryFn: async (): Promise<ErroreRecente[]> => {
      const da = new Date(Date.now() - GIORNI_ERRORI * 24 * 60 * 60 * 1000).toISOString();
      const { data, error } = await supabase
        .from("error_log")
        .select("id, created_at, scope, message")
        .gte("created_at", da)
        .order("created_at", { ascending: false })
        .limit(MAX_ERRORI);
      if (error) throw error;
      return data;
    },
  });
}
