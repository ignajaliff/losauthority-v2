import { z } from "zod";
import { PIATTAFORME, type MetricaDati, type Pubblicazione, type PubblicazioneDati } from "./types";
import { adessoLocale } from "./format";

const DATA_ISO = /^\d{4}-\d{2}-\d{2}$/;
const DATA_ORA = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/;

export const pubblicazioneSchema = z.object({
  titolo: z.string().trim().min(1, "Scrivi il nome della pubblicazione").max(200, "Massimo 200 caratteri"),
  piattaforme: z.array(z.enum(PIATTAFORME)).min(1, "Indica almeno una piattaforma"),
  pubblicata_il: z.string().refine((v) => v === "" || DATA_ISO.test(v), "Data non valida"),
  note: z.string().trim().max(2000, "Massimo 2000 caratteri"),
});
export type PubblicazioneFormValues = z.infer<typeof pubblicazioneSchema>;

export function pubblicazioneToForm(p: Pubblicazione | null): PubblicazioneFormValues {
  return {
    titolo: p?.titolo ?? "",
    piattaforme: (p?.piattaforme ?? []).filter((x): x is PubblicazioneFormValues["piattaforme"][number] =>
      (PIATTAFORME as ReadonlyArray<string>).includes(x),
    ),
    pubblicata_il: p?.pubblicata_il ?? "",
    note: p?.note ?? "",
  };
}

export function formToPubblicazione(v: PubblicazioneFormValues): PubblicazioneDati {
  return {
    titolo: v.titolo,
    piattaforme: [...v.piattaforme],
    pubblicata_il: v.pubblicata_il || null,
    note: v.note || null,
  };
}

/** "12.500" / "12 500" / "12500" → 12500. Vuoto → null. */
function interoOpzionale(testo: string): number | null {
  const pulito = testo.replace(/[.\s]/g, "");
  return pulito === "" ? null : Number(pulito);
}

const conteggio = z
  .string()
  .trim()
  .refine((v) => {
    const n = interoOpzionale(v);
    return n === null || (Number.isInteger(n) && n >= 0);
  }, "Inserisci un numero intero");

export const rilevazioneSchema = z
  .object({
    piattaforma: z.enum(PIATTAFORME),
    rilevata_il: z.string().refine((v) => DATA_ORA.test(v), "Indica data e ora"),
    visualizzazioni: conteggio,
    mi_piace: conteggio,
    commenti: conteggio,
  })
  .refine((v) => [v.visualizzazioni, v.mi_piace, v.commenti].some((x) => interoOpzionale(x) !== null), {
    message: "Compila almeno un dato",
    path: ["visualizzazioni"],
  });
export type RilevazioneFormValues = z.infer<typeof rilevazioneSchema>;

export function rilevazioneIniziale(piattaforma: RilevazioneFormValues["piattaforma"]): RilevazioneFormValues {
  return { piattaforma, rilevata_il: adessoLocale(), visualizzazioni: "", mi_piace: "", commenti: "" };
}

export function formToRilevazione(v: RilevazioneFormValues): MetricaDati {
  return {
    piattaforma: v.piattaforma,
    rilevata_il: new Date(v.rilevata_il).toISOString(),
    visualizzazioni: interoOpzionale(v.visualizzazioni),
    mi_piace: interoOpzionale(v.mi_piace),
    commenti: interoOpzionale(v.commenti),
  };
}
