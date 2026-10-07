/**
 * Regole del documento di Wesley «Ricerca TikTok top video» che non servono
 * all'IA: normalizzare gli item di Apify, soglia mobile dei 6 mesi, ordine per
 * like, doppioni, una top per lingua (decisione dell'utente del 07/10/2026),
 * video grossi rimasti fuori per pochi giorni, segnali certi (senza
 * didascalia, solo hashtag, sponsorizzato), avviso e frase sulla lingua.
 * Funzioni pure.
 */

import { nomeLingua } from "./tipi.ts";

export interface VideoTiktok {
  url: string;
  /** Keyword (o hashtag) che l'ha trovato. */
  query: string | null;
  /** Codice lingua di TikTok (`textLanguage`), «un» se sconosciuta, null se manca. */
  lingua: string | null;
  creato: Date | null;
  like: number | null;
  views: number | null;
  autore: string | null;
  testo: string;
}

export interface Segnali {
  senzaDidascalia: boolean;
  soloHashtag: boolean;
  sponsorizzato: boolean;
}

export interface EsitoFiltro {
  soglia: Date;
  /** Video diversi raccolti da Apify (dopo i doppioni). */
  raccolti: number;
  /** Di questi, quanti sono degli ultimi 6 mesi (in tutte le lingue). */
  recenti: number;
  /** Per ogni lingua cercata, i primi `quanti` recenti che TikTok dà già in quella lingua. */
  certi: Map<string, VideoTiktok[]>;
  /** Recenti di lingua incerta, con una didascalia vera, che per like potrebbero entrare in una top: la lingua la deduce Claude. */
  incerti: VideoTiktok[];
  /** Candidati «rimasti fuori per pochi giorni» (il taglio finale lo fa `fuoriSogliaFinali`, a lingue note). */
  fuoriSoglia: VideoTiktok[];
}

/** Un video con la lingua decisa: quella di TikTok o, se TikTok non la sa, quella dedotta da Claude («–» se nessuno la sa). */
export interface VideoConLingua {
  v: VideoTiktok;
  lingua: string;
}

const GIORNO = 86_400_000;
const GIORNI_FUORI_SOGLIA = 15;
const MAX_FUORI_SOGLIA = 5;
/** Candidati fuori soglia per lingua (e per i video di lingua incerta) da far leggere a Claude. */
const MAX_CANDIDATI_FUORI_PER_LINGUA = 4;
/** Fuori soglia finali per lingua: la lingua più grande non si prende tutti i posti. */
const MAX_FUORI_PER_LINGUA = 2;
/** Video di lingua incerta da far classificare a Claude. */
const MAX_INCERTI = 15;

/**
 * Testo pulito e tagliato a `n` caratteri senza spezzare un'emoji: niente NUL,
 * niente surrogati spaiati (Postgres e l'API di Anthropic rifiutano il JSON).
 */
export function taglia(s: string, n: number): string {
  // Codici numerici e non escape \u: il bundle passa da strumenti che li decodificherebbero.
  const pulito = s.replaceAll(String.fromCharCode(0), "").toWellFormed();
  if (pulito.length <= n) return pulito;
  const t = pulito.slice(0, n);
  const ultimo = t.charCodeAt(t.length - 1);
  return ultimo >= 0xd800 && ultimo <= 0xdbff ? t.slice(0, -1) : t;
}

const intero = (v: unknown): number | null => (typeof v === "number" && Number.isFinite(v) && v >= 0 ? Math.round(v) : null);
const testoDi = (v: unknown): string => (typeof v === "string" ? taglia(v.trim(), 10_000) : "");

/** Un item del dataset Apify → video (null se manca il link). */
export function normalizzaVideo(raw: unknown): VideoTiktok | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const url = testoDi(o.webVideoUrl);
  if (!/^https?:\/\//i.test(url)) return null;
  const autoreMeta = o.authorMeta && typeof o.authorMeta === "object" ? (o.authorMeta as Record<string, unknown>) : null;
  const creato = typeof o.createTimeISO === "string" ? new Date(o.createTimeISO) : null;
  const query = testoDi(o.searchQuery) || testoDi(o.input) || null;
  const lingua = testoDi(o.textLanguage).toLowerCase() || null;
  return {
    url: url.split("?")[0],
    query,
    lingua,
    creato: creato && !Number.isNaN(creato.getTime()) ? creato : null,
    like: intero(o.diggCount),
    views: intero(o.playCount),
    autore: testoDi(autoreMeta?.name) || null,
    testo: testoDi(o.text),
  };
}

/**
 * Oggi meno 6 mesi di calendario, a mezzanotte UTC (mai una data fissa): così
 * «Video dal 7 apr» e il filtro coincidono. Il giorno si ferma all'ultimo del
 * mese (31 ago → 28/29 feb, non 3 mar).
 */
export function sogliaSeiMesi(oggi: Date): Date {
  const anno = oggi.getUTCFullYear();
  const mese = oggi.getUTCMonth() - 6; // Date.UTC normalizza i mesi negativi all'anno prima
  const ultimoGiorno = new Date(Date.UTC(anno, mese + 1, 0)).getUTCDate();
  return new Date(Date.UTC(anno, mese, Math.min(oggi.getUTCDate(), ultimoGiorno)));
}

const TAG_SPONSOR =
  /(^|\s)#(ad|adv|advertising|sponsor|sponsored|sponsorizzato|sponsorizzata|publi|publicidad|pubblicità|pubblicita|paidpartnership|affiliato|affiliata|affiliatelink)(?![\p{L}\p{N}_])/iu;
const FRASI_SPONSOR = /\b(codice sconto|codice promo|discount code|promo code|c[oó]digo de descuento|link affiliat[oi]|affiliate link)\b/i;
const LINK_AFFILIATI = /\b(amzn\.to|amzlink\.to)\//i;

/** Senza didascalia, solo hashtag, sponsorizzato: i segnali che si vedono dal testo senza interpretarlo. */
export function segnaliCerti(testo: string): Segnali {
  const pulito = testo.trim();
  const senzaTag = pulito.replace(/#[\p{L}\p{N}_]+/gu, "").replace(/@[\p{L}\p{N}_.]+/gu, "").trim();
  return {
    senzaDidascalia: pulito === "",
    soloHashtag: pulito !== "" && /#/.test(pulito) && !/[\p{L}\p{N}]/u.test(senzaTag),
    // Solo forme inequivocabili: tag esatti (#publicspeaking o #affiliatemarketing non sono pubblicità),
    // frasi di sconto e link affiliati veri (linktr.ee e bit.ly sono link qualsiasi).
    sponsorizzato: TAG_SPONSOR.test(pulito) || FRASI_SPONSOR.test(pulito) || LINK_AFFILIATI.test(pulito),
  };
}

const perLike = (a: VideoTiktok, b: VideoTiktok) => (b.like ?? -1) - (a.like ?? -1) || (b.views ?? -1) - (a.views ?? -1);
/** TikTok non sa la lingua («un») o non la dà. */
const linguaIncerta = (l: string | null) => l === null || l === "un";
/** Una didascalia da cui Claude può dedurre la lingua (non vuota, non solo hashtag). */
const conTesto = (v: VideoTiktok) => {
  const s = segnaliCerti(v.testo);
  return !s.senzaDidascalia && !s.soloHashtag;
};

/**
 * Applica le regole di «Filtrare e ordinare» del documento, con una top per lingua: soglia dei 6
 * mesi, doppioni, ordine per like. Qui le top sono ancora provvisorie: i video di lingua incerta
 * entrano dopo che Claude ne ha dedotto la lingua (`componiTop`).
 */
export function filtra(video: VideoTiktok[], opzioni: { oggi: Date; quanti: number; lingue: readonly string[] }): EsitoFiltro {
  const soglia = sogliaSeiMesi(opzioni.oggi);
  // Doppioni per link: lo stesso video esce spesso da più query. Si tiene il primo visto.
  const unici = new Map<string, VideoTiktok>();
  for (const v of video) if (!unici.has(v.url)) unici.set(v.url, v);
  const tutti = [...unici.values()];

  const recenti = tutti.filter((v) => v.creato !== null && v.creato >= soglia).sort(perLike);
  const certi = new Map(opzioni.lingue.map((l) => [l, recenti.filter((v) => v.lingua === l).slice(0, opzioni.quanti)]));
  // L'ultimo di ogni top piena: un incerto serve solo se ne batte almeno uno (o se una top non è piena).
  const ultimi = [...certi.values()].map((top) => (top.length >= opzioni.quanti ? top[top.length - 1] : null));
  const incerti = recenti
    .filter((v) => linguaIncerta(v.lingua) && conTesto(v))
    .filter((v) => ultimi.some((u) => u === null || perLike(v, u) < 0))
    .slice(0, MAX_INCERTI);

  // «Grossi»: con almeno i like dell'ultimo della top della loro lingua (sarebbero entrati se fossero stati recenti).
  const minimo = (l: string) => {
    const top = certi.get(l) ?? [];
    return top.length >= opzioni.quanti ? (top.at(-1)?.like ?? 0) : 0;
  };
  const minimoIncerti = Math.min(...opzioni.lingue.map(minimo));
  const limiteFuori = soglia.getTime() - GIORNI_FUORI_SOGLIA * GIORNO;
  const vicini = tutti.filter((v) => v.creato !== null && v.creato < soglia && v.creato.getTime() >= limiteFuori).sort(perLike);
  // Per lingua (e gli incerti a parte): ognuna ha i suoi «grossi».
  const fuoriSoglia = [
    ...opzioni.lingue.flatMap((l) => vicini.filter((v) => v.lingua === l && (v.like ?? 0) >= minimo(l)).slice(0, MAX_CANDIDATI_FUORI_PER_LINGUA)),
    ...vicini.filter((v) => linguaIncerta(v.lingua) && conTesto(v) && (v.like ?? 0) >= minimoIncerti).slice(0, MAX_CANDIDATI_FUORI_PER_LINGUA),
  ];

  return { soglia, raccolti: tutti.length, recenti: recenti.length, certi, incerti, fuoriSoglia };
}

/** Le top finali: per ogni lingua cercata, i primi `quanti` per like tra i video con quella lingua (anche dedotta). */
export function componiTop<T extends VideoConLingua>(video: T[], lingue: readonly string[], quanti: number): Map<string, T[]> {
  return new Map(
    lingue.map((l) => [
      l,
      video
        .filter((x) => x.lingua === l)
        .sort((a, b) => perLike(a.v, b.v))
        .slice(0, quanti),
    ]),
  );
}

/** «Rimasti fuori per pochi giorni»: solo nelle lingue delle top e con almeno i like dell'ultimo della top della loro lingua. */
export function fuoriSogliaFinali<T extends VideoConLingua>(candidati: T[], top: Map<string, T[]>, quanti: number): T[] {
  return [...top]
    .flatMap(([l, t]) => {
      const minimo = t.length >= quanti ? (t.at(-1)?.v.like ?? 0) : 0;
      return candidati
        .filter((x) => x.lingua === l && (x.v.like ?? 0) >= minimo)
        .sort((a, b) => perLike(a.v, b.v))
        .slice(0, MAX_FUORI_PER_LINGUA);
    })
    .sort((a, b) => perLike(a.v, b.v))
    .slice(0, MAX_FUORI_SOGLIA);
}

const elenco = (parti: string[]) => (parti.length <= 1 ? (parti[0] ?? "") : `${parti.slice(0, -1).join(", ")} e ${parti.at(-1)}`);

/** Avviso se una top non arriva a `quanti` (niente riempimento con video vecchi o di altre lingue). */
export function avvisoLingue(top: Map<string, unknown[]>, quanti: number): string | null {
  const pochi = [...top].filter(([, t]) => t.length < quanti);
  if (pochi.length === 0) return null;
  if (pochi.length === 1) {
    const [l, t] = pochi[0];
    const nome = nomeLingua(l);
    const quanti_ = t.length === 0 ? `nessun video degli ultimi 6 mesi` : `solo ${t.length} video degli ultimi 6 mesi (ne servivano ${quanti})`;
    return `In ${nome} ${quanti_}: nella prossima ricerca prova una keyword più comune in ${nome}, o aggiungine una seconda.`;
  }
  const parti = pochi.map(([l, t]) => (t.length === 0 ? `nessuno in ${nomeLingua(l)}` : `${t.length} in ${nomeLingua(l)}`));
  return `Pochi video degli ultimi 6 mesi: ${elenco(parti)} (ne servivano ${quanti} per lingua). Nella prossima ricerca prova keyword più comuni in quelle lingue.`;
}

/** 1234 → "1.234", 12.500 → "12,5k", 1.200.000 → "1,2M": come `formatConteggio` del frontend. */
export function conteggio(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toLocaleString("it-IT", { maximumFractionDigits: 1 })}M`;
  if (n >= 10_000) return `${(n / 1_000).toLocaleString("it-IT", { maximumFractionDigits: 1 })}k`;
  return n.toLocaleString("it-IT");
}

/**
 * L'osservazione sulla lingua la scrive il codice, non l'IA (i numeri vengono da Apify): quale
 * lingua ha i numeri più alti, dal primo video di ogni top.
 */
export function fraseLingue(top: Map<string, VideoConLingua[]>): string | null {
  const primi = [...top]
    .filter(([, t]) => t.length > 0)
    .map(([l, t]) => ({ l, like: Math.max(...t.map((x) => x.v.like ?? 0)) }))
    .sort((a, b) => b.like - a.like);
  const [primo, ...altri] = primi;
  if (!primo) return null;
  if (altri.length === 0) return `Solo in ${nomeLingua(primo.l)} ci sono video degli ultimi 6 mesi su questo tema.`;
  return `In ${nomeLingua(primo.l)} i numeri sono più alti: il primo video ha ${conteggio(primo.like)} like, contro ${elenco(altri.map((a) => `${conteggio(a.like)} in ${nomeLingua(a.l)}`))}.`;
}

/**
 * Tiene le frasi intere che stanno in `max` parole (un'osservazione non si tronca a metà).
 * Null se già la prima frase è più lunga: meglio niente che una frase tagliata.
 */
export function entroParole(testo: string, max: number): string | null {
  const pulito = testo.replace(/\s+/g, " ").trim();
  // Frasi: si spezza dopo . ! ? ; … solo se la frase dopo comincia con una maiuscola: «es. live» o
  // «ecc. e» non sono fine frase, e i decimali come «1,2k» o «2.5» restano interi.
  const frasi = pulito.split(/(?<=[.!?;…])\s+(?=[\p{Lu}«"“])/u);
  let fuori = "";
  let parole = 0;
  for (const frase of frasi) {
    if (!frase) continue;
    const n = frase.split(" ").length;
    if (parole + n > max) break;
    fuori = fuori ? `${fuori} ${frase}` : frase;
    parole += n;
  }
  if (!fuori) return null;
  // Chiusa con un punto: «;» finale o nessuna punteggiatura diventano «.».
  return /[.!?…]$/.test(fuori) ? fuori : `${fuori.replace(/[;,:]+$/, "")}.`;
}

/** Item di errore del dataset (TikTok ha bloccato una query: la run finisce lo stesso SUCCEEDED). */
export function erroriDataset(items: unknown[]): string[] {
  return items
    .filter((x): x is Record<string, unknown> => !!x && typeof x === "object" && ("error" in x || "errorCode" in x))
    .slice(0, 4)
    .map((x) => taglia(`${String(x.searchQuery ?? x.input ?? "?")}: ${String(x.errorCode ?? "")} ${String(x.error ?? "")}`.trim(), 200));
}
