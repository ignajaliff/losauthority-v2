import { z } from "zod";
import { MAX_SCRIPT_STILE } from "./types";

const MIN_SCRIPT = 40;

/** Form "Nuovo stile": nome, uno o più script incollati, nota facoltativa su cosa piace dello stile. */
export const nuovoStileSchema = z.object({
  titolo: z.string().trim().min(2, "Dai un nome allo stile").max(120, "Massimo 120 caratteri"),
  script: z
    .array(z.object({ testo: z.string().trim().max(8000, "Massimo 8000 caratteri per script") }))
    .min(1)
    .max(MAX_SCRIPT_STILE, `Massimo ${MAX_SCRIPT_STILE} script`)
    .refine((lista) => lista.some((s) => s.testo.length >= MIN_SCRIPT), {
      message: `Incolla almeno uno script completo (minimo ${MIN_SCRIPT} caratteri)`,
    }),
  note: z.string().trim().max(2000, "Massimo 2000 caratteri"),
});
export type NuovoStileFormValues = z.infer<typeof nuovoStileSchema>;

export const NUOVO_STILE_INIZIALE: NuovoStileFormValues = { titolo: "", script: [{ testo: "" }, { testo: "" }], note: "" };

/** Payload per la Edge Function aura-stile: solo gli script non vuoti. */
export function formToStile(v: NuovoStileFormValues): { titolo: string; script: string[]; note: string | null } {
  return {
    titolo: v.titolo,
    script: v.script.map((s) => s.testo).filter((t) => t.length >= MIN_SCRIPT),
    note: v.note || null,
  };
}

/** Modifica di uno stile pronto: titolo e istruzioni sono del cliente, può ritoccarli. */
export const modificaStileSchema = z.object({
  titolo: z.string().trim().min(2, "Dai un nome allo stile").max(120, "Massimo 120 caratteri"),
  istruzioni: z.string().trim().min(50, "Le istruzioni sono troppo corte").max(20000, "Massimo 20000 caratteri"),
});
export type ModificaStileFormValues = z.infer<typeof modificaStileSchema>;
