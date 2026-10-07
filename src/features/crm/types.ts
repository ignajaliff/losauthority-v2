import type { Tables, TablesInsert } from "@/integrations/supabase/types";

/**
 * Un contatto del cliente (sezione Clienti). Il titolare dei dati è il cliente, Wesley è
 * responsabile del trattamento: per questo si tengono solo i dati che servono a seguirlo.
 * Non è un lead di Wesley: quelli sono in `lead`.
 */
export type LeadCrm = Tables<"crm_lead">;
export type LeadCrmInsert = TablesInsert<"crm_lead">;
/** I campi che il cliente compila nel popup (il cliente_id lo mette l'hook). */
export type LeadCrmDati = Omit<LeadCrmInsert, "id" | "cliente_id" | "created_at" | "updated_at">;

export type DocumentoLegale = Tables<"documenti_legali">;
export type VersioneCrm = Tables<"crm_versioni">;

/** Stati del contatto, nell'ordine in cui si avanza (stesso CHECK della tabella). */
export const STATI_LEAD = ["nuovo", "in_trattativa", "chiuso", "perso"] as const;
export type StatoLead = (typeof STATI_LEAD)[number];

export const ETICHETTA_STATO_LEAD: Record<StatoLead, string> = {
  nuovo: "Nuovo",
  in_trattativa: "In trattativa",
  chiuso: "Chiuso",
  perso: "Perso",
};

/** Colore del pallino di ogni stato (token del tema). */
export const COLORE_STATO_LEAD: Record<StatoLead, string> = {
  nuovo: "bg-muted-foreground",
  in_trattativa: "bg-status-expiring",
  chiuso: "bg-status-active",
  perso: "bg-status-churn",
};

/** Canale da cui arriva il contatto (stesso CHECK della tabella). */
export const FONTI_LEAD = ["instagram", "tiktok", "whatsapp", "passaparola", "pubblicita", "sito", "evento", "altro"] as const;
export type FonteLead = (typeof FONTI_LEAD)[number];

export const ETICHETTA_FONTE_LEAD: Record<FonteLead, string> = {
  instagram: "Instagram",
  tiktok: "TikTok",
  whatsapp: "WhatsApp",
  passaparola: "Passaparola",
  pubblicita: "Pubblicità",
  sito: "Sito web",
  evento: "Evento",
  altro: "Altro",
};

/** I tre documenti da accettare (stesso CHECK di `documenti_legali`). */
export const DOCUMENTI_CRM = ["termini_clienti", "accordo_trattamento", "informativa_privacy"] as const;
export type TipoDocumentoCrm = (typeof DOCUMENTI_CRM)[number];

export function eStatoLead(valore: string): valore is StatoLead {
  return (STATI_LEAD as ReadonlyArray<string>).includes(valore);
}

export function eFonteLead(valore: string): valore is FonteLead {
  return (FONTI_LEAD as ReadonlyArray<string>).includes(valore);
}

export const etichettaFonte = (fonte: string | null): string | null => (fonte && eFonteLead(fonte) ? ETICHETTA_FONTE_LEAD[fonte] : null);
export const etichettaStato = (stato: string): string => (eStatoLead(stato) ? ETICHETTA_STATO_LEAD[stato] : stato);
