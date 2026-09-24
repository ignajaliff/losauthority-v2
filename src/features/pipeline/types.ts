import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";

export type Lead = Tables<"lead">;
export type LeadInsert = TablesInsert<"lead">;
export type LeadUpdate = TablesUpdate<"lead">;

/** Stage della pipeline, nell'ordine delle colonne del kanban (stesso CHECK della tabella). */
export const LEAD_STAGE_KEYS = ["nuovo", "contattato", "call_fissata", "proposta", "cliente", "perso"] as const;
export type LeadStage = (typeof LEAD_STAGE_KEYS)[number];

export const LEAD_STAGES: ReadonlyArray<{ key: LeadStage; label: string }> = [
  { key: "nuovo", label: "Nuovo" },
  { key: "contattato", label: "Contattato" },
  { key: "call_fissata", label: "Call fissata" },
  { key: "proposta", label: "Proposta" },
  { key: "cliente", label: "Cliente" },
  { key: "perso", label: "Perso" },
];

/** Fonti ammesse (stesso CHECK della tabella). */
export const LEAD_FONTI = ["Instagram", "TikTok", "Referral", "Landing", "WhatsApp", "Email", "Evento", "Altro"] as const;
export type LeadFonte = (typeof LEAD_FONTI)[number];

/** Stage "chiusi": non contano nel valore pipeline né nei lead aperti. */
const STAGE_CHIUSI: ReadonlyArray<string> = ["cliente", "perso"];

export function stageLabel(stage: string): string {
  return LEAD_STAGES.find((s) => s.key === stage)?.label ?? stage;
}

export function eStageAperto(stage: string): boolean {
  return !STAGE_CHIUSI.includes(stage);
}

export function eLeadStage(valore: string): valore is LeadStage {
  return (LEAD_STAGE_KEYS as ReadonlyArray<string>).includes(valore);
}
