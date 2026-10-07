/** Tipi, lingue e messaggi condivisi da `index.ts`, `elabora.ts`, `filtro.ts` e `prompt.ts`. */

export interface Ricerca {
  id: string;
  cliente_id: string;
  tema: string;
  lingua_target: string;
  /** Le lingue con una top ciascuna (dal 07/10/2026 sempre it, en, es). */
  lingue: string[];
  keyword: string[];
  /** Video in ogni top. */
  quanti: number;
  stato: string;
  apify_run_id: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Le lingue cercate in automatico, nell'ordine in cui si mostrano le top: il cliente non le
 * sceglie (decisione dell'utente del 07/10/2026). L'italiano per primo: è il mercato dei clienti.
 */
export const LINGUE_RICERCA: readonly string[] = ["it", "en", "es"];

/** Video in ogni top per lingua (una tabella per lingua: 3 × 10). */
export const QUANTI_PER_LINGUA = 10;

/** Nomi delle lingue (prototipo nullo: `in` non vede `constructor` e simili). */
export const NOMI_LINGUA: Record<string, string> = Object.assign(Object.create(null) as Record<string, string>, {
  it: "italiano",
  en: "inglese",
  es: "spagnolo",
  pt: "portoghese",
  fr: "francese",
  de: "tedesco",
});

export const nomeLingua = (codice: string) => NOMI_LINGUA[codice] ?? codice.toUpperCase();

/** Elaborazione non riuscita. `definitivo` = riprovare non serve (es. dataset sparito); altrimenti si riprova. */
export class ErroreElabora extends Error {
  readonly definitivo: boolean;
  constructor(messaggio: string, definitivo: boolean) {
    super(messaggio);
    this.name = "ErroreElabora";
    this.definitivo = definitivo;
  }
}

export const MSG_APIFY = "TikTok non risponde in questo momento. Riprova tra qualche minuto: questa ricerca non conta nei 15 giorni.";
export const MSG_ELABORA = "Non sono riuscita a leggere i risultati. Riprova: questa ricerca non conta nei 15 giorni.";
export const MSG_VUOTA = "TikTok non ha restituito video per queste keyword. Prova con parole più comuni: questa ricerca non conta nei 15 giorni.";
