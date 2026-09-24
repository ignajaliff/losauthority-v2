import { z } from "zod";
import { FASI, STATI_ONBOARDING } from "./fasi";

const FASE_VALORI = FASI.map((f) => f.value);
const STATO_VALORI = STATI_ONBOARDING.map((s) => s.value);

export const nuovoClienteSchema = z.object({
  nombre: z.string().trim().min(1, "Inserisci il nome del cliente"),
  email: z.string().trim().email("Inserisci un'email valida"),
  password: z
    .string()
    .trim()
    .refine((v) => v.length === 0 || v.length >= 8, "Almeno 8 caratteri, oppure lascia vuoto"),
  telefono: z.string().trim(),
  tag_ids: z.array(z.string()),
  nuovo_tag: z.string().trim().max(60, "Massimo 60 caratteri"),
});
export type NuovoClienteValues = z.infer<typeof nuovoClienteSchema>;

export const datiClienteSchema = z.object({
  telefono: z.string().trim(),
  instagram: z.string().trim(),
  tiktok: z.string().trim(),
  data_inizio: z.string(),
  prossima_call: z.string(),
  note: z.string().trim().max(5000, "Massimo 5000 caratteri"),
});
export type DatiClienteValues = z.infer<typeof datiClienteSchema>;

export const statoClienteSchema = z.object({
  fase: z.string().refine((v) => (FASE_VALORI as string[]).includes(v), "Fase non valida"),
  stato_onboarding: z.string().refine((v) => (STATO_VALORI as string[]).includes(v), "Stato non valido"),
  notion_hub_url: z
    .string()
    .trim()
    .refine((v) => v === "" || /^https?:\/\//i.test(v), "Inserisci un link completo (https://…)"),
});
export type StatoClienteValues = z.infer<typeof statoClienteSchema>;

export const notaSchema = z.object({
  testo: z.string().trim().min(1, "Scrivi la nota").max(5000, "Massimo 5000 caratteri"),
});
export type NotaValues = z.infer<typeof notaSchema>;

export const nuovoTagSchema = z.object({
  label: z.string().trim().min(1, "Scrivi il nome del tag").max(60, "Massimo 60 caratteri"),
});

/** "@nome" o link → link completo al profilo; vuoto → null. */
export function normalizzaSocial(raw: string, piattaforma: "instagram" | "tiktok"): string | null {
  const v = raw.trim();
  if (!v) return null;
  if (/^https?:\/\//i.test(v)) return v;
  const handle = v.replace(/^@/, "").replace(/^\/+/, "");
  if (!handle) return null;
  return piattaforma === "instagram"
    ? `https://instagram.com/${handle}`
    : `https://www.tiktok.com/@${handle}`;
}
