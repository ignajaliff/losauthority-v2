import type { Tables } from "@/integrations/supabase/types";
import type { QuestionarioId, Risposte, StatoQuestionario } from "@/features/questionari";

/** Stati dell'onboarding (clienti.stato_onboarding). Etichette di Wesley, da conservare. */
export const STATI_ONBOARDING = ["nuovo", "in_lavorazione", "completato", "hub_creato", "fuori_target"] as const;
export type StatoOnboarding = (typeof STATI_ONBOARDING)[number];

export const ETICHETTA_STATO_ONBOARDING: Record<StatoOnboarding, string> = {
  nuovo: "Nuovo",
  in_lavorazione: "In lavorazione",
  completato: "Completato",
  hub_creato: "Hub creato",
  fuori_target: "Fuori target",
};

export function eStatoOnboarding(valore: string): valore is StatoOnboarding {
  return (STATI_ONBOARDING as readonly string[]).includes(valore);
}

export type VarianteBadge = "default" | "secondary" | "outline" | "destructive";

export const VARIANTE_STATO_ONBOARDING: Record<StatoOnboarding, VarianteBadge> = {
  nuovo: "outline",
  in_lavorazione: "secondary",
  completato: "secondary",
  hub_creato: "default",
  fuori_target: "destructive",
};

export interface RigaListaOnboarding {
  id: string;
  nombre: string;
  email: string;
  stato: StatoOnboarding;
  notionHubUrl: string | null;
  aggiornatoIl: string;
  schede: Record<QuestionarioId, StatoQuestionario>;
  /** Data dell'ultima scheda inviata, se ce n'è una. */
  ultimoInvio: string | null;
}

export interface InvioDettaglio {
  id: string;
  questionarioId: QuestionarioId;
  stato: string;
  inviatoIl: string | null;
  risposte: Risposte;
}

export interface ClienteOnboarding {
  cliente: Pick<
    Tables<"clienti">,
    "id" | "stato_onboarding" | "notion_hub_url" | "profilo" | "ore_operative" | "onboarding_completato_il" | "updated_at"
  >;
  nombre: string;
  email: string;
  invii: Partial<Record<QuestionarioId, InvioDettaglio>>;
}
