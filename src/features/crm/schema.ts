import { z } from "zod";
import { todayIso } from "@/shared/utils/formatDate";
import { eFonteLead, FONTI_LEAD, STATI_LEAD, type FonteLead, type LeadCrm, type LeadCrmDati, type StatoLead } from "./types";

const DATA_ISO = /^\d{4}-\d{2}-\d{2}$/;
/** Stesso CHECK della tabella: + facoltativo, poi cifre, spazi, punti, trattini e parentesi. */
const TELEFONO = /^\+?[0-9 ().-]{5,30}$/;

/** "1.500,50" → 1500.5 (accetta virgola o punto). Vuoto → null, NaN se non è un numero. */
function importo(testo: string): number | null {
  const pulito = testo.trim().replace(/\s|€/g, "").replace(/\.(?=\d{3}(\D|$))/g, "").replace(",", ".");
  return pulito === "" ? null : Number(pulito);
}

export const leadCrmSchema = z.object({
  nome: z.string().trim().min(1, "Scrivi il nome del contatto").max(120, "Massimo 120 caratteri"),
  email: z.union([z.literal(""), z.string().trim().max(254, "Massimo 254 caratteri").email("Inserisci un'email valida")]),
  telefono: z.string().trim().refine((v) => v === "" || TELEFONO.test(v), "Inserisci un numero valido (cifre, spazi e +)"),
  // Il popup parte vuoto ("") ma il canale è obbligatorio (`length`: un `!== ""` diventerebbe un type predicate e cambierebbe il tipo).
  fonte: z.enum(["", ...FONTI_LEAD]).refine((v) => v.length > 0, "Indica da dove è arrivato"),
  /** "" = nessuna offerta. */
  offerta_id: z.string(),
  stato: z.enum(STATI_LEAD),
  valore: z.string().refine((v) => {
    const n = importo(v);
    return n === null || (Number.isFinite(n) && n >= 0 && n < 1e10);
  }, "Inserisci un importo valido, es. 1.500"),
  arrivato_il: z
    .string()
    .refine((v) => DATA_ISO.test(v), "Indica il giorno in cui è arrivato")
    .refine((v) => v <= todayIso(), "Non può essere un giorno futuro"),
});

export type LeadCrmFormValues = z.infer<typeof leadCrmSchema>;

/** Valori iniziali del popup: da un contatto esistente o vuoti (arrivato oggi, nuovo). */
export function leadCrmToForm(lead: LeadCrm | null): LeadCrmFormValues {
  return {
    nome: lead?.nome ?? "",
    email: lead?.email ?? "",
    telefono: lead?.telefono ?? "",
    fonte: lead?.fonte && eFonteLead(lead.fonte) ? lead.fonte : "",
    offerta_id: lead?.offerta_id ?? "",
    stato: (lead?.stato as StatoLead | undefined) ?? "nuovo",
    valore: lead?.valore != null ? String(lead.valore).replace(".", ",") : "",
    arrivato_il: lead?.arrivato_il ?? todayIso(),
  };
}

/** Dal popup alla riga: stringhe vuote → null; il valore vale solo per i contatti chiusi. */
export function formToLeadCrm(v: LeadCrmFormValues): LeadCrmDati {
  return {
    nome: v.nome,
    email: v.email.trim().toLowerCase() || null,
    telefono: v.telefono.trim() || null,
    fonte: v.fonte as FonteLead,
    offerta_id: v.offerta_id || null,
    stato: v.stato,
    valore: v.stato === "chiuso" ? importo(v.valore) : null,
    arrivato_il: v.arrivato_il,
  };
}
