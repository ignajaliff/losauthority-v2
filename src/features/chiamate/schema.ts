import { z } from "zod";

export const titoloChiamataSchema = z.object({
  titolo: z
    .string()
    .trim()
    .min(1, "Il titolo è obbligatorio")
    .max(200, "Massimo 200 caratteri"),
});
export type TitoloChiamataValues = z.infer<typeof titoloChiamataSchema>;
