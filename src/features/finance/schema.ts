import { z } from "zod";
import { esPdf, importoFacoltativoSchema, importoSchema, pdfSchema } from "@/features/fatture";
import { FILE_MAX_BYTES } from "./types";

export { fatturaSchema, type FatturaValues } from "@/features/fatture";

/* ---------- Spese ---------- */

export const spesaSchema = z.object({
  descrizione: z.string().trim().min(1, "Scrivi una descrizione (es. «Affitto ufficio»)").max(200, "Massimo 200 caratteri"),
  importo: importoSchema,
  tipo: z.enum(["fissa", "variabile"], { message: "Scegli il tipo di spesa" }),
  data: z.string().min(1, "Inserisci la data"),
});
export type SpesaValues = z.infer<typeof spesaSchema>;

export const spesaModificaSchema = spesaSchema.omit({ tipo: true });
export type SpesaModificaValues = z.infer<typeof spesaModificaSchema>;

const TIPI_SCONTRINO = ["image/jpeg", "image/png", "image/webp", "image/heic", "application/pdf"];

export const scontrinoSchema = z.object({
  file: z
    .instanceof(File, { message: "Scegli la foto o il PDF dello scontrino" })
    .refine((f) => TIPI_SCONTRINO.includes(f.type) || esPdf(f), "Formato non supportato: usa JPEG, PNG, WEBP, HEIC o PDF")
    .refine((f) => f.size <= FILE_MAX_BYTES, "File troppo grande (max 10 MB)"),
});
export type ScontrinoValues = z.infer<typeof scontrinoSchema>;

/* ---------- F24 ---------- */

export const f24Schema = z.object({
  descrizione: z.string().trim().max(200, "Massimo 200 caratteri"),
  importo: importoFacoltativoSchema,
  scadenza: z.string(),
});
export type F24Values = z.infer<typeof f24Schema>;

export const caricaF24Schema = z.object({
  pdf: pdfSchema,
});
export type CaricaF24Values = z.infer<typeof caricaF24Schema>;
