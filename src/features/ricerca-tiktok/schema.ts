import { z } from "zod";
import { MAX_KEYWORD } from "./types";

/** Passo 1: il tema (le lingue sono sempre italiano, inglese e spagnolo). */
export const temaSchema = z.object({
  tema: z.string().trim().min(3, "Scrivi il tema in almeno 3 caratteri").max(200, "Massimo 200 caratteri"),
});
export type TemaFormValues = z.infer<typeof temaSchema>;

/**
 * Passo 2: le keyword da lanciare, come si scrivono nella barra di ricerca (niente #). Una per
 * lingua; una casella lasciata vuota si salta (es. «Le scrivo io» solo in italiano).
 */
export const keywordSchema = z.object({
  keyword: z
    .array(
      z.object({
        testo: z
          .string()
          .trim()
          .max(80, "Massimo 80 caratteri")
          .refine((v) => v === "" || v.length >= 2, "Almeno 2 caratteri, o lasciala vuota")
          .refine((v) => !v.includes("#"), "Scrivila senza #, come la cercheresti su TikTok"),
        /** Lingua per cui Aura l'ha proposta (solo un'etichetta: la funzione cerca tutte le keyword). */
        lingua: z.string().optional(),
      }),
    )
    .max(MAX_KEYWORD, `Al massimo ${MAX_KEYWORD} keyword`)
    .refine((lista) => lista.some((k) => k.testo.trim().length >= 2), "Serve almeno una keyword"),
});
export type KeywordFormValues = z.infer<typeof keywordSchema>;

/** Le keyword da mandare alla funzione: le caselle piene, senza spazi in più. */
export const keywordPiene = (v: KeywordFormValues["keyword"]) => v.map((k) => k.testo.trim()).filter((t) => t.length > 0);

/**
 * Le lingue da cercare: quelle delle caselle piene (una lasciata vuota si salta). Con una keyword in
 * più senza lingua, o senza etichette, tutte e tre (la funzione fa lo stesso con una lista vuota).
 */
export function lingueDa(v: KeywordFormValues["keyword"]): string[] {
  const piene = v.filter((k) => k.testo.trim().length > 0);
  if (piene.some((k) => !k.lingua)) return [];
  return [...new Set(piene.map((k) => k.lingua as string))];
}
