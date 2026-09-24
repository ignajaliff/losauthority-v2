import type { Tables } from "@/integrations/supabase/types";

/** Riga di vista_clienti con i soli campi che la dashboard usa. */
export type ClienteDashboard = Pick<
  Tables<"vista_clienti">,
  "id" | "nombre" | "email" | "fase" | "stato_onboarding" | "prossima_call" | "di_wesley_aperti" | "created_at"
>;

/** Cliente con la data di completamento onboarding (da clienti, con nome da user_roles). */
export interface OnboardingRecente {
  id: string;
  nombre: string;
  email: string;
  stato_onboarding: string;
  /** onboarding_completato_il se c'è, altrimenti created_at. */
  data: string;
}

export type LeadDaFare = Pick<Tables<"lead">, "id" | "nome" | "stage" | "prossima_azione" | "prossima_azione_il">;

export type ErroreRecente = Pick<Tables<"error_log">, "id" | "created_at" | "scope" | "message">;

export interface StatisticheDashboard {
  clientiAttivi: number;
  onboardingDaLavorare: number;
  prontiPerHub: number;
  callProssimi7Giorni: number;
}

export const ETICHETTE_STATO_ONBOARDING: Record<string, string> = {
  nuovo: "Nuovo",
  in_lavorazione: "In lavorazione",
  completato: "Completato",
  hub_creato: "Hub creato",
  fuori_target: "Fuori target",
};

export const ETICHETTE_FASE: Record<string, string> = {
  onboarding: "Onboarding",
  call_1: "Call 1",
  call_2: "Call 2",
  call_3: "Call 3",
  call_4: "Call 4",
  completato: "Completato",
};

export const ETICHETTE_STAGE_LEAD: Record<string, string> = {
  nuovo: "Nuovo",
  contattato: "Contattato",
  call_fissata: "Call fissata",
  proposta: "Proposta",
  cliente: "Cliente",
  perso: "Perso",
};
