import { z } from "zod";

/** Stesso vincolo della tabella: length(label) between 1 and 60. */
export const tagSchema = z.object({
  label: z.string().trim().min(1, "Inserisci il nome del tag").max(60, "Massimo 60 caratteri"),
});

export type TagFormValues = z.infer<typeof tagSchema>;
