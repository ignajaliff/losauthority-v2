import { z } from "zod";
import { round2 } from "@/shared/utils/formatCurrency";
import { PDF_MAX_BYTES } from "./types";

const IMPORTO_RE = /^\d+([.,]\d{1,2})?$/;

/** Importo come stringa (input number/text): numero ≥ 0 con al massimo 2 decimali. */
export const importoSchema = z
  .string()
  .trim()
  .min(1, "Inserisci l'importo")
  .regex(IMPORTO_RE, "Importo non valido: numero positivo con massimo 2 decimali");

/** Importo facoltativo: vuoto oppure valido. */
export const importoFacoltativoSchema = z
  .string()
  .trim()
  .regex(IMPORTO_RE, "Importo non valido: numero positivo con massimo 2 decimali")
  .or(z.literal(""));

/** Converte la stringa validata in numero (accetta la virgola italiana). */
export function parseImporto(valore: string): number {
  return round2(Number(valore.replace(",", ".")));
}

export function esPdf(file: File): boolean {
  return file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
}

export const pdfSchema = z
  .instanceof(File)
  .refine(esPdf, "Il file deve essere un PDF")
  .refine((f) => f.size <= PDF_MAX_BYTES, "PDF troppo grande (max 10 MB)");

export const fatturaSchema = z.object({
  descrizione: z.string().trim().max(200, "Massimo 200 caratteri"),
  importo: importoSchema,
  emessa_il: z.string().min(1, "Inserisci la data di emissione"),
  prossimo_pagamento: z.string(),
  note: z.string().trim().max(1000, "Massimo 1000 caratteri"),
  pdf: pdfSchema.optional(),
});

export type FatturaValues = z.infer<typeof fatturaSchema>;
