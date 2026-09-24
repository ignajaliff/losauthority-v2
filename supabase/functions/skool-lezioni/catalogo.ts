/**
 * CATALOGO LEZIONI SKOOL — la "memoria" di Aura (porta di src/lib/skool/catalog.ts).
 * Apify entra nella classroom di Los Creators AI (community privata: servono i
 * cookie di Wesley) e ne estrae corsi + lezioni. Teniamo solo ciò che serve per
 * agganciare la lezione giusta a un compito: corso, titolo, url, estratto, keyword.
 */
import { APIFY_SKOOL_ACTOR, APIFY_TOKEN, SKOOL_COMMUNITY_URL, SKOOL_COOKIES } from "../_shared/config.ts";

export interface Lezione {
  key: string;
  corso: string | null;
  titolo: string;
  url: string | null;
  descrizione: string | null;
  keywords: string[];
  ordine: number | null;
}

export type EsitoFetch =
  | { ok: true; lezioni: Lezione[] }
  | { ok: false; motivo: "config" | "cookie_scaduto" | "errore"; dettaglio: string };

/** I cookie arrivano come export JSON (array) dall'estensione Cookie-Editor. */
function parseCookies(): unknown[] | null {
  try {
    const parsed: unknown = JSON.parse(SKOOL_COOKIES);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : null;
  } catch {
    return null;
  }
}

const slug = (s: string) =>
  s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

/** Parole chiave per il match: dal titolo + corso, senza le parole vuote. */
const STOP = new Set([
  "il","lo","la","i","gli","le","un","uno","una","di","a","da","in","con","su","per","tra","fra",
  "e","o","ma","che","come","del","della","dei","delle","dal","dalla","al","alla","ai","alle",
  "nel","nella","sul","sulla","tuo","tua","tuoi","tue","mio","mia","questo","questa","piu","più",
  "fare","fai","parte","lezione","modulo","video","intro","introduzione",
]);
function keywordsFrom(...parts: Array<string | null | undefined>): string[] {
  const words = parts
    .filter(Boolean)
    .join(" ")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .split(/[^a-z0-9]+/)
    .filter((w) => w.length > 2 && !STOP.has(w));
  return [...new Set(words)].slice(0, 12);
}

const str = (v: unknown): string => (typeof v === "string" ? v.trim() : "");
const firstStr = (o: Record<string, unknown>, keys: string[]): string => {
  for (const k of keys) {
    const v = str(o[k]);
    if (v) return v;
  }
  return "";
};

/**
 * Normalizza un item del dataset Apify in una lezione. Struttura reale
 * (verificata 25/07/2026 su loscreators): le lezioni hanno `type: "module"` e il
 * capitolo sta ANNIDATO in `courseMetaDetails.title`. I post (`type: "post"`)
 * vanno esclusi: non sono lezioni.
 */
function toLesson(raw: unknown, index: number): Lezione | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;

  const tipo = str(o.type).toLowerCase();
  if (tipo && !["module", "lesson", "course", "video"].includes(tipo)) return null;

  const titolo = firstStr(o, ["title", "name", "lessonTitle", "moduleTitle", "postTitle", "label"]);
  if (!titolo || titolo.length < 2) return null;

  const meta = o.courseMetaDetails ?? o.course;
  const corsoRaw =
    (meta && typeof meta === "object" ? firstStr(meta as Record<string, unknown>, ["title", "name"]) : str(meta)) ||
    firstStr(o, ["courseTitle", "courseName", "module", "moduleTitle", "parentTitle", "category"]);
  // `name` a volte è lo slug interno (es. "a43d66cc"): non è un nome capitolo.
  const corso = corsoRaw && !/^[0-9a-f]{6,40}$/i.test(corsoRaw) ? corsoRaw : null;

  let url = firstStr(o, ["url", "link", "postUrl", "lessonUrl", "permalink"]);
  if (!url) {
    const slugPart = firstStr(o, ["slug", "id"]);
    if (slugPart) url = `${SKOOL_COMMUNITY_URL.replace(/\/$/, "")}/classroom/${slugPart}`;
  }

  const bodyRaw = firstStr(o, ["description", "body", "content", "text", "summary", "metaDescription"]);
  const descrizione = bodyRaw ? bodyRaw.replace(/\s+/g, " ").slice(0, 400) : null;

  const ordineRaw = o.order ?? o.position ?? o.index;
  const ordine = typeof ordineRaw === "number" && Number.isFinite(ordineRaw) ? ordineRaw : index;

  return {
    key: url || slug(`${corso ?? ""}-${titolo}`),
    corso,
    titolo: titolo.slice(0, 300),
    url: url || null,
    descrizione,
    keywords: keywordsFrom(titolo, corso, descrizione?.slice(0, 200)),
    ordine,
  };
}

/**
 * Lancia l'attore Apify (run sincrona) e ritorna le lezioni della classroom.
 * `run-sync-get-dataset-items` aspetta la fine e restituisce direttamente gli item.
 */
export async function fetchSkoolLessons(): Promise<EsitoFetch> {
  if (!APIFY_TOKEN) return { ok: false, motivo: "config", dettaglio: "APIFY_TOKEN mancante." };
  const cookies = parseCookies();
  if (!cookies) return { ok: false, motivo: "config", dettaglio: "SKOOL_COOKIES mancante o non è un JSON array valido." };

  const endpoint = `https://api.apify.com/v2/acts/${APIFY_SKOOL_ACTOR}/run-sync-get-dataset-items?token=${encodeURIComponent(APIFY_TOKEN)}`;
  let res: Response;
  try {
    res = await fetch(endpoint, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        startUrls: [{ url: SKOOL_COMMUNITY_URL }],
        tab: "classroom",
        includeComments: false,
        includeMedia: false,
        maxItems: 300,
        cookies,
        proxy: { useApifyProxy: true },
      }),
      signal: AbortSignal.timeout(240000),
    });
  } catch (err) {
    return { ok: false, motivo: "errore", dettaglio: `rete Apify: ${String(err).slice(0, 150)}` };
  }
  if (!res.ok) {
    const body = (await res.text().catch(() => "")).slice(0, 300);
    return { ok: false, motivo: "errore", dettaglio: `Apify ${res.status}: ${body}` };
  }

  let items: unknown;
  try {
    items = await res.json();
  } catch {
    return { ok: false, motivo: "errore", dettaglio: "risposta Apify non JSON" };
  }
  if (!Array.isArray(items)) return { ok: false, motivo: "errore", dettaglio: "dataset Apify non è una lista" };

  const lezioni: Lezione[] = [];
  const visti = new Set<string>();
  items.forEach((raw, i) => {
    const l = toLesson(raw, i);
    if (l && !visti.has(l.key)) {
      visti.add(l.key);
      lezioni.push(l);
    }
  });

  // Zero lezioni con dataset non vuoto = quasi sempre sessione non valida:
  // lo scraper vede la pagina pubblica (paywall) invece della classroom.
  if (lezioni.length === 0) {
    return {
      ok: false,
      motivo: "cookie_scaduto",
      dettaglio: items.length === 0
        ? "Apify non ha restituito nulla: cookie Skool probabilmente scaduti."
        : `Nessuna lezione riconosciuta in ${items.length} elementi: cookie Skool probabilmente scaduti.`,
    };
  }
  return { ok: true, lezioni };
}
