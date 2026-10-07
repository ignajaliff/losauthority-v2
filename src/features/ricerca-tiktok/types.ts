import type { Tables } from "@/integrations/supabase/types";

/** Una ricerca TikTok top video del cliente (Crea idee → Ricerca TikTok). */
export type RicercaTiktok = Tables<"ricerche_tiktok">;
/** Un video consegnato: numeri da Apify, riga «di cosa parla» dalla didascalia, segnali. */
export type VideoRicerca = Tables<"ricerche_tiktok_video">;
export type RicercaConVideo = RicercaTiktok & { video: VideoRicerca[] };

/** Una ricerca ogni 15 giorni (lo stesso limite della Edge Function `ricerca-tiktok`). */
export const GIORNI_TRA_RICERCHE = 15;
export const MAX_KEYWORD = 4;

/**
 * Le lingue cercate in automatico, una top per lingua, in quest'ordine (le stesse di
 * `LINGUE_RICERCA` nella funzione): il cliente non le sceglie più (07/10/2026).
 */
export const LINGUE_AUTOMATICHE = ["it", "en", "es"] as const;

const NOMI_LINGUA: Record<string, string> = {
  it: "italiano",
  en: "inglese",
  es: "spagnolo",
  pt: "portoghese",
  fr: "francese",
  de: "tedesco",
};

/** Nome della lingua in minuscolo per titoli e frasi («Top in italiano»); un codice sconosciuto resta in maiuscolo. */
export const nomeLingua = (codice: string) => (Object.hasOwn(NOMI_LINGUA, codice) ? NOMI_LINGUA[codice] : codice.toUpperCase());

/** «italiano, inglese e spagnolo». */
export const elencoLingue = (codici: readonly string[]) => {
  const nomi = codici.map(nomeLingua);
  return nomi.length <= 1 ? (nomi[0] ?? "") : `${nomi.slice(0, -1).join(", ")} e ${nomi.at(-1)}`;
};

/** Preposizione articolata davanti a una data già scritta: «dal 7 ott», ma «dall'8 ott», «dall'1», «dall'11». */
export const conArticolo = (prep: "dal" | "del", testo: string) => (/^(1|8|11)(?!\d)/.test(testo) ? `${prep}l'${testo}` : `${prep} ${testo}`);

/** Righe «di cosa parla» che non dicono di cosa parla il video: in grigio e mai come titolo di un contenuto. */
export const RIGHE_SENZA_TEMA: ReadonlyArray<string> = ["senza didascalia", "solo hashtag", "didascalia non chiara"];

/** In corso finché Apify lavora o la funzione elabora i risultati. */
export const eInCorso = (r: Pick<RicercaTiktok, "stato">) => r.stato === "in_corso" || r.stato === "elaborazione";

/**
 * Da quando si può fare la prossima ricerca (null = adesso). Contano le ricerche
 * non finite in errore degli ultimi 15 giorni, come nella funzione.
 */
export function prossimaRicerca(ricerche: Array<Pick<RicercaTiktok, "stato" | "created_at">>, adesso: Date): Date | null {
  const finestra = adesso.getTime() - GIORNI_TRA_RICERCHE * 86_400_000;
  const ultima = ricerche
    .filter((r) => r.stato !== "errore" && new Date(r.created_at).getTime() >= finestra)
    .sort((a, b) => b.created_at.localeCompare(a.created_at))[0];
  return ultima ? new Date(new Date(ultima.created_at).getTime() + GIORNI_TRA_RICERCHE * 86_400_000) : null;
}

export const LINK_RICERCA_TIKTOK = "/area/crea-idee/ricerca-tiktok";
export const linkRicerca = (id: string) => `${LINK_RICERCA_TIKTOK}?id=${id}`;
/** «Usa in Crea idee»: Crea idee aggancia la ricerca al prossimo messaggio (come `?stile=`). */
export const linkCreaIdeeConRicerca = (id: string) => `/area/crea-idee?ricerca=${id}`;

/** Margine sull'orologio del dispositivo (può essere avanti rispetto al server). */
const MARGINE_ELIMINA_MS = 60 * 60_000;

/**
 * Si elimina solo una ricerca in errore o più vecchia di 15 giorni (stessa regola della RLS: non
 * restituisce la quota). Un'ora di margine perché il cestino non compaia prima che la RLS lo permetta.
 */
export const eliminabile = (r: Pick<RicercaTiktok, "stato" | "created_at">, adesso: Date) =>
  r.stato === "errore" || adesso.getTime() - new Date(r.created_at).getTime() > GIORNI_TRA_RICERCHE * 86_400_000 + MARGINE_ELIMINA_MS;
