import { z } from "zod";
import { STATO_CONTENUTO_KEYS, TIPOLOGIA_CONTENUTO_KEYS, type Contenuto, type ContenutoDati } from "./types";

const DATA_ISO = /^\d{4}-\d{2}-\d{2}$/;
const URL_HTTP = /^https?:\/\//i;
const dataOpzionale = z.string().refine((v) => v === "" || DATA_ISO.test(v), "Data non valida");

export const MAX_RIFERIMENTI = 30;

export const contenutoSchema = z.object({
  titolo: z.string().trim().min(1, "Scrivi l'idea del video").max(200, "Massimo 200 caratteri"),
  stato: z.enum(STATO_CONTENUTO_KEYS),
  tipologia: z.enum(["", ...TIPOLOGIA_CONTENUTO_KEYS]),
  pubblicazione_prevista: dataOpzionale,
  pubblicato_il: dataOpzionale,
  drive_url: z
    .string()
    .trim()
    .max(2000, "Link troppo lungo")
    .refine((v) => v === "" || URL_HTTP.test(v), "Inserisci un link che inizia con http:// o https://"),
  script: z.string().max(20000, "Massimo 20.000 caratteri"),
  /** Un link per riga; le righe vuote si scartano al salvataggio. */
  riferimenti: z
    .array(
      z.object({
        url: z
          .string()
          .trim()
          .max(2000, "Link troppo lungo")
          .refine((v) => v === "" || URL_HTTP.test(v), "Inserisci un link che inizia con http:// o https://"),
      }),
    )
    .max(MAX_RIFERIMENTI, `Massimo ${MAX_RIFERIMENTI} riferimenti`),
  note: z.string().trim().max(2000, "Massimo 2000 caratteri"),
});

export type ContenutoFormValues = z.infer<typeof contenutoSchema>;

/** Valori iniziali del form: da un contenuto esistente o vuoti per una nuova idea. */
export function contenutoToForm(c: Contenuto | null): ContenutoFormValues {
  return {
    titolo: c?.titolo ?? "",
    stato: (c?.stato as ContenutoFormValues["stato"] | undefined) ?? "fase_script",
    tipologia: (c?.tipologia as ContenutoFormValues["tipologia"] | null | undefined) ?? "",
    pubblicazione_prevista: c?.pubblicazione_prevista ?? "",
    pubblicato_il: c?.pubblicato_il ?? "",
    drive_url: c?.drive_url ?? "",
    script: c?.script ?? "",
    riferimenti: (c?.riferimenti ?? []).map((url) => ({ url })),
    note: c?.note ?? "",
  };
}

/**
 * Dal form alla riga: stringhe vuote → null. La data reale di pubblicazione
 * conta solo se lo stato è "pubblicato" (se manca, la mette il trigger).
 */
export function formToContenuto(v: ContenutoFormValues): ContenutoDati {
  const riferimenti = [...new Set(v.riferimenti.map((r) => r.url.trim()).filter(Boolean))];
  return {
    titolo: v.titolo,
    stato: v.stato,
    tipologia: v.tipologia || null,
    pubblicazione_prevista: v.pubblicazione_prevista || null,
    pubblicato_il: v.stato === "pubblicato" ? v.pubblicato_il || null : null,
    drive_url: v.drive_url || null,
    script: v.script.trim() || null,
    riferimenti,
    note: v.note || null,
  };
}
