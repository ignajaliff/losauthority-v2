import { z } from "zod";

export const titoloChiamataSchema = z.object({
  titolo: z
    .string()
    .trim()
    .min(1, "Il titolo è obbligatorio")
    .max(200, "Massimo 200 caratteri"),
});
export type TitoloChiamataValues = z.infer<typeof titoloChiamataSchema>;

export const generaCompitiSchema = z.object({
  call_n: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)], {
    message: "Scegli la call di destinazione",
  }),
});
export type GeneraCompitiValues = z.infer<typeof generaCompitiSchema>;
