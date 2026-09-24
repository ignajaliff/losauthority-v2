import { z } from "zod";
import { LEAD_FONTI, LEAD_STAGE_KEYS, type Lead, type LeadInsert } from "./types";

/** "1.500,50" → 1500.5 (accetta virgola o punto). NaN se non è un numero. */
function parseImporto(testo: string): number {
  const pulito = testo.trim().replace(/\s/g, "").replace(/\.(?=\d{3}(\D|$))/g, "").replace(",", ".");
  return pulito === "" ? 0 : Number(pulito);
}

const DATA_ISO = /^\d{4}-\d{2}-\d{2}$/;

export const leadSchema = z.object({
  nome: z.string().trim().min(1, "Inserisci il nome del lead").max(120, "Massimo 120 caratteri"),
  contatto: z.string().trim().max(200, "Massimo 200 caratteri"),
  fonte: z.enum(["", ...LEAD_FONTI]),
  stage: z.enum(LEAD_STAGE_KEYS),
  valore: z
    .string()
    .trim()
    .refine((v) => {
      const n = parseImporto(v);
      return Number.isFinite(n) && n >= 0;
    }, "Inserisci un importo maggiore o uguale a 0"),
  note: z.string().trim().max(4000, "Massimo 4000 caratteri"),
  prossima_azione: z.string().trim().max(200, "Massimo 200 caratteri"),
  prossima_azione_il: z.string().refine((v) => v === "" || DATA_ISO.test(v), "Data non valida"),
});

export type LeadFormValues = z.infer<typeof leadSchema>;

/** Valori iniziali del form: da un lead esistente o vuoti per un nuovo lead. */
export function leadToForm(lead: Lead | null): LeadFormValues {
  return {
    nome: lead?.nome ?? "",
    contatto: lead?.contatto ?? "",
    fonte: (lead?.fonte as LeadFormValues["fonte"] | undefined) ?? "",
    stage: (lead?.stage as LeadFormValues["stage"] | undefined) ?? "nuovo",
    valore: lead && lead.valore > 0 ? String(lead.valore) : "",
    note: lead?.note ?? "",
    prossima_azione: lead?.prossima_azione ?? "",
    prossima_azione_il: lead?.prossima_azione_il ?? "",
  };
}

/** Dal form alla riga da salvare: stringhe vuote → null, valore numerico. */
export function formToLead(values: LeadFormValues): LeadInsert {
  return {
    nome: values.nome,
    contatto: values.contatto || null,
    fonte: values.fonte || null,
    stage: values.stage,
    valore: parseImporto(values.valore),
    note: values.note || null,
    prossima_azione: values.prossima_azione || null,
    prossima_azione_il: values.prossima_azione_il || null,
  };
}
