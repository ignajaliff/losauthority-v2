/**
 * Apify `apify/instagram-scraper`: dati pubblici, senza login. Due usi:
 *  - profilo → gli ultimi post (resultsType "posts", include i reel);
 *  - lista di URL di post → i numeri aggiornati di quei post.
 * Run sincrona (`run-sync-get-dataset-items`): aspetta la fine e ritorna gli item.
 * Costo: pay-per-result (~2 € ogni 1000 item), per questo i limiti sono stretti.
 */
import { APIFY_TOKEN } from "../_shared/config.ts";
import { codicePost } from "../_shared/instagram.ts";

const ACTOR = Deno.env.get("APIFY_INSTAGRAM_ACTOR") || "apify~instagram-scraper";
/** Secondi massimi concessi alla run Apify; il fetch aspetta poco di più. */
const TIMEOUT_RUN_S = 150;

export interface PostInstagram {
  codice: string;
  url: string;
  eVideo: boolean;
  /** Fissato in cima al profilo: non conta tra «gli ultimi video». */
  fissato: boolean;
  /** Prima riga della didascalia, al massimo 200 caratteri. */
  titolo: string;
  /** Data di pubblicazione (YYYY-MM-DD) se nota. */
  pubblicataIl: string | null;
  visualizzazioni: number | null;
  miPiace: number | null;
  commenti: number | null;
}

export type EsitoApify = { ok: true; post: PostInstagram[] } | { ok: false; dettaglio: string };

const intero = (v: unknown): number | null => (typeof v === "number" && Number.isFinite(v) && v >= 0 ? Math.round(v) : null);

function titoloDa(caption: unknown, codice: string): string {
  const t = typeof caption === "string" ? caption.replace(/\s+/g, " ").trim() : "";
  const prima = t.split(/(?<=[.!?])\s/)[0] ?? t;
  const breve = (prima.length >= 12 ? prima : t).slice(0, 200).trim();
  return breve || `Video ${codice}`;
}

/** Un item del dataset → post normalizzato (null se non ha il codice). */
export function normalizzaItem(raw: unknown): PostInstagram | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const url = typeof o.url === "string" ? o.url : null;
  const codice = (typeof o.shortCode === "string" && o.shortCode) || codicePost(url);
  if (!codice) return null;
  const tipo = typeof o.type === "string" ? o.type : "";
  const prodotto = typeof o.productType === "string" ? o.productType : "";
  const ts = typeof o.timestamp === "string" ? new Date(o.timestamp) : null;
  return {
    codice,
    url: url ?? `https://www.instagram.com/reel/${codice}/`,
    eVideo: tipo === "Video" || prodotto === "clips" || prodotto === "igtv",
    fissato: o.isPinned === true,
    titolo: titoloDa(o.caption, codice),
    pubblicataIl: ts && !Number.isNaN(ts.getTime()) ? ts.toISOString().slice(0, 10) : null,
    visualizzazioni: intero(o.videoPlayCount) ?? intero(o.videoViewCount),
    miPiace: intero(o.likesCount),
    commenti: intero(o.commentsCount),
  };
}

/** Dati del profilo (`resultsType: "details"`): un solo item, un solo risultato fatturato. */
export interface ProfiloInstagram {
  follower: number;
  seguiti: number | null;
  postTotali: number | null;
  privato: boolean;
}

export type EsitoDettagli = { ok: true; profilo: ProfiloInstagram } | { ok: false; dettaglio: string };

/** L'item "details" → profilo (null se manca il numero di follower). */
export function normalizzaProfilo(raw: unknown): ProfiloInstagram | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const follower = intero(o.followersCount);
  if (follower === null) return null;
  return { follower, seguiti: intero(o.followsCount), postTotali: intero(o.postsCount), privato: o.private === true };
}

type EsitoRun = { ok: true; items: unknown[] } | { ok: false; dettaglio: string };

/** Lancia l'attore e ritorna gli item grezzi del dataset. */
async function eseguiAttore(input: Record<string, unknown>): Promise<EsitoRun> {
  if (!APIFY_TOKEN) return { ok: false, dettaglio: "APIFY_TOKEN mancante." };
  const endpoint = `https://api.apify.com/v2/acts/${ACTOR}/run-sync-get-dataset-items?token=${encodeURIComponent(APIFY_TOKEN)}&timeout=${TIMEOUT_RUN_S}`;
  let res: Response;
  try {
    res = await fetch(endpoint, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ...input, proxy: { useApifyProxy: true } }),
      signal: AbortSignal.timeout((TIMEOUT_RUN_S + 20) * 1000),
    });
  } catch (err) {
    return { ok: false, dettaglio: `rete Apify: ${String(err).slice(0, 150)}` };
  }
  if (!res.ok) {
    const body = (await res.text().catch(() => "")).slice(0, 300);
    return { ok: false, dettaglio: `Apify ${res.status}: ${body}` };
  }
  let items: unknown;
  try {
    items = await res.json();
  } catch {
    return { ok: false, dettaglio: "risposta Apify non JSON" };
  }
  if (!Array.isArray(items)) return { ok: false, dettaglio: "dataset Apify non è una lista" };
  return { ok: true, items };
}

/** Run "posts" → post normalizzati, senza doppioni. */
async function run(input: Record<string, unknown>): Promise<EsitoApify> {
  const esito = await eseguiAttore(input);
  if (!esito.ok) return esito;
  const post: PostInstagram[] = [];
  const visti = new Set<string>();
  for (const raw of esito.items) {
    const p = normalizzaItem(raw);
    if (p && !visti.has(p.codice)) {
      visti.add(p.codice);
      post.push(p);
    }
  }
  return { ok: true, post };
}

/** Follower, profili seguiti, post totali e se il profilo è privato. */
export async function leggiDettagli(urlProfilo: string): Promise<EsitoDettagli> {
  const esito = await eseguiAttore({ directUrls: [urlProfilo], resultsType: "details", resultsLimit: 1, addParentData: false });
  if (!esito.ok) return esito;
  for (const raw of esito.items) {
    const profilo = normalizzaProfilo(raw);
    if (profilo) return { ok: true, profilo };
  }
  return { ok: false, dettaglio: "Apify non ha restituito i dati del profilo (follower assenti)." };
}

/**
 * Gli ultimi post del profilo (post e reel insieme), SENZA i post fissati in cima:
 * Instagram li restituisce per primi anche se sono vecchi. Apify li salta
 * (`skipPinnedPosts`); per sicurezza li scarta anche `sync.ts` (`fissato`).
 */
export function leggiProfilo(urlProfilo: string, limite: number): Promise<EsitoApify> {
  return run({ directUrls: [urlProfilo], resultsType: "posts", resultsLimit: limite, skipPinnedPosts: true, addParentData: false });
}

/** I numeri aggiornati di una lista di post (uno per URL). */
export function leggiPost(urls: string[]): Promise<EsitoApify> {
  return run({ directUrls: urls, resultsType: "posts", resultsLimit: 1, addParentData: false });
}
