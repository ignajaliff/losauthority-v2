/**
 * Apify `clockworks/tiktok-scraper` in modalità asincrona: si lancia la run e si
 * risponde subito; il polling del cliente (`controlla`) chiede lo stato e, a run
 * finita, scarica dal dataset solo i campi che servono. Parametri dal documento
 * di Wesley: max 4 query, 40 risultati per query, sezione video, niente
 * follower, commenti né download.
 * Costo: attore PAY_PER_EVENT, 1,70–3,70 $ ogni 1000 risultati secondo il piano
 * Apify (FREE 3,70 $) più ~0,001 $ di avvio: per questo c'è un tetto di spesa per run.
 * Il token va nell'header Authorization, mai nell'URL (finirebbe nei messaggi d'errore).
 */
import { APIFY_TOKEN } from "../_shared/config.ts";

const ACTOR = Deno.env.get("APIFY_TIKTOK_ACTOR") || "clockworks~tiktok-scraper";
const BASE = "https://api.apify.com/v2";
/** Tetto di risultati (il documento chiede maxItems 200; vale solo per gli attori pay-per-result). */
const MAX_ITEMS = 200;
/** Tetto di spesa per run: l'attore è PAY_PER_EVENT, quindi maxItems da solo non limita il costo. Minimo dell'attore 0,5 $. */
const MAX_COSTO_USD = 1;
/** Apify chiude una run bloccata come TIMED-OUT (4 query × 40 risultati finiscono in 1-3 minuti). */
const TIMEOUT_RUN_S = 600;
const RISULTATI_PER_QUERY = 40;
/** Solo i campi che servono (regola 5 di «Preparare l'input») + error/errorCode per capire una run vuota. */
const CAMPI = ["searchQuery", "input", "textLanguage", "createTimeISO", "diggCount", "playCount", "authorMeta", "webVideoUrl", "text", "error", "errorCode"];

export type StatoRun = "in_corso" | "finita" | "fallita";

type Esito<T> = ({ ok: true } & T) | { ok: false; dettaglio: string; status: number | null };

const indirizzo = (path: string, query = "") => `${BASE}${path}${query ? `?${query}` : ""}`;

async function chiama(url: string, init?: RequestInit): Promise<Esito<{ dati: unknown }>> {
  if (!APIFY_TOKEN) return { ok: false, dettaglio: "APIFY_TOKEN mancante.", status: null };
  const headers = new Headers(init?.headers);
  headers.set("authorization", `Bearer ${APIFY_TOKEN}`);
  let res: Response;
  try {
    res = await fetch(url, { ...init, headers, signal: AbortSignal.timeout(30_000) });
  } catch (err) {
    // Difesa in più: il token non deve mai finire nei log.
    const msg = (err instanceof Error ? `${err.name}: ${err.message}` : String(err)).replaceAll(APIFY_TOKEN, "***");
    return { ok: false, dettaglio: `rete Apify: ${msg.slice(0, 150)}`, status: null };
  }
  const corpo = await res.text().catch(() => "");
  if (!res.ok) return { ok: false, dettaglio: `Apify ${res.status}: ${corpo.replaceAll(APIFY_TOKEN, "***").slice(0, 300)}`, status: res.status };
  try {
    return { ok: true, dati: JSON.parse(corpo) };
  } catch {
    return { ok: false, dettaglio: "risposta Apify non JSON", status: res.status };
  }
}

/**
 * Lancia la ricerca per keyword (sezione video). Ritorna l'id della run.
 * `incerto` = errore di rete, timeout o 5xx: la run potrebbe essere partita lo stesso.
 */
export async function avviaRicerca(keyword: string[]): Promise<Esito<{ runId: string }> & { incerto?: boolean }> {
  const input = {
    searchQueries: keyword,
    resultsPerPage: RISULTATI_PER_QUERY,
    searchSection: "/video",
    maxFollowersPerProfile: 0,
    maxFollowingPerProfile: 0,
    commentsPerPost: 0,
    shouldDownloadVideos: false,
    shouldDownloadCovers: false,
    shouldDownloadAvatars: false,
    shouldDownloadSlideshowImages: false,
    // Valore dello schema dell'attore (build 0.0.613): niente sottotitoli né trascrizioni (evento a pagamento).
    downloadSubtitlesOptions: "NEVER_DOWNLOAD_SUBTITLES",
    proxyCountryCode: "None",
  };
  const r = await chiama(indirizzo(`/acts/${ACTOR}/runs`, `maxItems=${MAX_ITEMS}&maxTotalChargeUsd=${MAX_COSTO_USD}&timeout=${TIMEOUT_RUN_S}`), {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!r.ok) return { ...r, incerto: r.status === null || r.status >= 500 };
  const id = (r.dati as { data?: { id?: unknown } }).data?.id;
  return typeof id === "string" && id ? { ok: true, runId: id } : { ok: false, dettaglio: "Apify non ha restituito l'id della run", status: null, incerto: true };
}

/** Stato della run: a run finita anche l'id del dataset e il momento in cui è finita (la soglia dei 6 mesi parte da lì). */
export async function statoRun(
  runId: string,
): Promise<Esito<{ stato: StatoRun; datasetId: string | null; finitaIl: Date | null; dettaglio: string }>> {
  const r = await chiama(indirizzo(`/actor-runs/${encodeURIComponent(runId)}`));
  // Run cancellata o scaduta su Apify: non tornerà mai, è definitivamente fallita.
  if (!r.ok && r.status === 404) return { ok: true, stato: "fallita", datasetId: null, finitaIl: null, dettaglio: "run non trovata" };
  if (!r.ok) return r;
  const d = (r.dati as { data?: { status?: unknown; defaultDatasetId?: unknown; finishedAt?: unknown } }).data ?? {};
  const status = typeof d.status === "string" ? d.status : "";
  const datasetId = typeof d.defaultDatasetId === "string" ? d.defaultDatasetId : null;
  const finitaIl = typeof d.finishedAt === "string" && !Number.isNaN(Date.parse(d.finishedAt)) ? new Date(d.finishedAt) : null;
  if (status === "SUCCEEDED") return { ok: true, stato: "finita", datasetId, finitaIl, dettaglio: status };
  if (["FAILED", "TIMED-OUT", "ABORTED"].includes(status)) return { ok: true, stato: "fallita", datasetId, finitaIl, dettaglio: status };
  return { ok: true, stato: "in_corso", datasetId, finitaIl: null, dettaglio: status };
}

/** Ferma una run che non serve più (best effort: l'esito non cambia niente per il cliente). */
export async function fermaRun(runId: string): Promise<void> {
  await chiama(indirizzo(`/actor-runs/${encodeURIComponent(runId)}/abort`), { method: "POST" });
}

/** Gli item del dataset, solo con i campi utili. `definitivo` = dataset sparito (404): riprovare non serve. */
export async function leggiDataset(datasetId: string): Promise<Esito<{ items: unknown[] }> & { definitivo?: boolean }> {
  const r = await chiama(indirizzo(`/datasets/${encodeURIComponent(datasetId)}/items`, `clean=true&format=json&limit=${MAX_ITEMS}&fields=${CAMPI.join(",")}`));
  if (!r.ok) return { ...r, definitivo: r.status === 404 };
  return Array.isArray(r.dati) ? { ok: true, items: r.dati } : { ok: false, dettaglio: "dataset Apify non è una lista", status: null };
}
