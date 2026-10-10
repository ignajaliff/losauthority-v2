import { FATHOM_API_KEY } from "./config.ts";
import { streamAnthropicText } from "./anthropic.ts";

/**
 * Client API Fathom + parser del payload webhook + traduzione del riassunto.
 * Porta di src/lib/calls/{fathom-api,ingest,translate}.ts del vecchio sistema.
 * Nessuna funzione qui lancia per errori di rete o IA: ritorna null / [] / originale.
 */

const BASE = "https://api.fathom.ai/external/v1";
type Obj = Record<string, unknown>;

export const fathomConfigurato = () => FATHOM_API_KEY.length > 0;

function asObj(v: unknown): Obj {
  return v && typeof v === "object" && !Array.isArray(v) ? (v as Obj) : {};
}

/** Primo valore non-nullo tra una lista di chiavi possibili. */
function pick(obj: Obj, keys: string[]): unknown {
  for (const k of keys) if (obj[k] != null) return obj[k];
  return null;
}

/** Estrae una stringa: diretta, oppure annidata (Fathom: default_summary.markdown_formatted). */
function asString(v: unknown): string | null {
  if (typeof v === "string") return v;
  if (v && typeof v === "object") {
    const o = v as Obj;
    for (const k of ["markdown_formatted", "markdown", "text", "content", "value"]) {
      if (typeof o[k] === "string" && o[k]) return o[k] as string;
    }
  }
  return null;
}

/** Raccoglie ricorsivamente tutte le email presenti in un payload (lower). */
function collectEmails(obj: unknown, acc: Set<string>): void {
  if (typeof obj === "string") {
    const m = obj.match(/[\w.+-]+@[\w-]+\.[\w.-]+/g);
    if (m) for (const e of m) acc.add(e.toLowerCase());
  } else if (Array.isArray(obj)) {
    for (const x of obj) collectEmails(x, acc);
  } else if (obj && typeof obj === "object") {
    for (const v of Object.values(obj)) collectEmails(v, acc);
  }
}

/** Tutte le email presenti nel payload. */
export function emailsInPayload(payload: unknown): string[] {
  const s = new Set<string>();
  collectEmails(payload, s);
  return [...s];
}

/** Email degli invitati al calendario (Fathom: calendar_invitees[].email). */
function inviteesDi(flat: Obj): string[] {
  const raw = pick(flat, ["calendar_invitees", "invitees", "attendees"]);
  if (!Array.isArray(raw)) return [];
  const out: string[] = [];
  for (const i of raw) {
    const email = typeof i === "string" ? i : asString(asObj(i).email);
    const e = (email ?? "").trim().toLowerCase();
    if (e && !out.includes(e)) out.push(e);
  }
  return out;
}

/** Action items Fathom → array di stringhe (oggetti {description}, stringhe o testo a righe). */
export function normalizzaActionItems(v: unknown): string[] {
  if (v == null) return [];
  if (typeof v === "string") {
    return v
      .split(/\r?\n/)
      .map((r) => r.replace(/^\s*(?:[-*•]|\d+[.)])\s*/, "").trim())
      .filter(Boolean);
  }
  if (!Array.isArray(v)) {
    const inner = pick(asObj(v), ["items", "action_items", "actionItems"]);
    return inner ? normalizzaActionItems(inner) : [];
  }
  const out: string[] = [];
  for (const item of v) {
    const testo =
      typeof item === "string"
        ? item
        : asString(pick(asObj(item), ["description", "text", "title", "content", "name"]));
    const t = (testo ?? "").trim();
    if (t && !out.includes(t)) out.push(t);
  }
  return out;
}

export interface ParsedFathomCall {
  recordingId: string | null;
  title: string | null;
  recordedAt: string | null;
  shareUrl: string | null;
  summary: string | null;
  actionItems: string[];
  invitees: string[];
}

/** Estrae i campi della call dal payload Fathom (webhook o item di /meetings). Nomi difensivi. */
export function parseFathomCall(payload: unknown): ParsedFathomCall {
  const p = asObj(payload);
  const flat: Obj = { ...asObj(p.meeting), ...asObj(p.recording), ...p };
  const rid = pick(flat, ["recording_id", "id"]);
  return {
    recordingId: rid != null && String(rid) ? String(rid) : null,
    title: asString(pick(flat, ["meeting_title", "title", "topic"])),
    recordedAt: asString(
      pick(flat, ["recording_start_time", "started_at", "scheduled_start_time", "created_at"]),
    ),
    shareUrl: asString(pick(flat, ["share_url", "recording_share_url", "url", "meeting_url"])),
    summary: asString(pick(flat, ["default_summary", "summary", "ai_summary"])),
    actionItems: normalizzaActionItems(pick(flat, ["action_items", "actionItems"])),
    invitees: inviteesDi(flat),
  };
}

/** Pulisce il titolo: i titoli generici di Fathom ("Impromptu Google Meet Meeting") → "Call del <data>". */
export function cleanCallTitle(rawTitle: string | null, recordedAt: string | null): string | null {
  const t = (rawTitle ?? "").trim();
  const generic = !t || /impromptu|google meet/i.test(t);
  if (!generic) return t;
  if (recordedAt) {
    try {
      const d = new Date(recordedAt);
      if (!Number.isNaN(d.getTime())) {
        return "Call del " + d.toLocaleDateString("it-IT", { day: "numeric", month: "long" });
      }
    } catch {
      /* fallback sotto */
    }
  }
  return "Call registrata";
}

/** GET autenticata verso l'API Fathom. null su chiave assente, rete, non-200, JSON rotto. */
async function fathomGet(path: string, timeoutMs: number): Promise<unknown> {
  if (!FATHOM_API_KEY) return null;
  try {
    const res = await fetch(`${BASE}${path}`, {
      headers: { "X-Api-Key": FATHOM_API_KEY },
      signal: AbortSignal.timeout(timeoutMs),
    });
    if (!res.ok) {
      console.error("[fathom] API", path.split("?")[0], res.status);
      return null;
    }
    return await res.json();
  } catch (err) {
    console.error("[fathom] rete:", err instanceof Error ? err.message : String(err));
    return null;
  }
}

export interface OpzioniLista {
  riassunto?: boolean;
  azioni?: boolean;
}

/**
 * Call recenti dell'account Fathom (prima pagina di /meetings, più recenti prima).
 * null = API non raggiungibile o chiave assente; [] = nessuna call.
 */
export async function listRecentFathomCalls(
  limit = 30,
  opts: OpzioniLista = {},
): Promise<ParsedFathomCall[] | null> {
  const qs = new URLSearchParams();
  if (opts.riassunto) qs.set("include_summary", "true");
  if (opts.azioni) qs.set("include_action_items", "true");
  const q = qs.toString();
  const data = await fathomGet(`/meetings${q ? `?${q}` : ""}`, 15000);
  if (!data) return null;
  const items = asObj(data).items;
  if (!Array.isArray(items)) return [];
  return items.slice(0, limit).map(parseFathomCall).filter((c) => c.recordingId !== null);
}

/** Riassunto (markdown) di una singola registrazione Fathom. */
export async function getFathomSummary(recordingId: string): Promise<string | null> {
  if (!recordingId) return null;
  const data = await fathomGet(`/recordings/${encodeURIComponent(recordingId)}/summary`, 15000);
  if (!data) return null;
  const s = asString(asObj(data).summary) ?? asString(asObj(data).default_summary);
  return s && s.trim() ? s : null;
}

/** Massimo di testo della trascrizione che teniamo (una call di un'ora in italiano sta sotto i 100k caratteri). */
const MAX_TRASCRIZIONE = 300_000;

/**
 * Trascrizione integrale di una registrazione, resa "Chi parla: testo" una riga
 * per intervento (Fathom: `transcript[]` con `speaker.display_name`, `text`,
 * `timestamp`; nomi letti in modo difensivo). null se l'API non la dà o è vuota.
 */
export async function getFathomTranscript(recordingId: string): Promise<string | null> {
  if (!recordingId) return null;
  const data = await fathomGet(`/recordings/${encodeURIComponent(recordingId)}/transcript`, 20000);
  if (!data) return null;
  const raw = pick(asObj(data), ["transcript", "items", "segments"]) ?? data;
  if (typeof raw === "string") return raw.trim().slice(0, MAX_TRASCRIZIONE) || null;
  if (!Array.isArray(raw)) return null;
  const righe: string[] = [];
  for (const item of raw) {
    if (typeof item === "string") {
      if (item.trim()) righe.push(item.trim());
      continue;
    }
    const o = asObj(item);
    const testo = asString(pick(o, ["text", "content", "sentence"]))?.trim();
    if (!testo) continue;
    const chi = asString(pick(asObj(o.speaker), ["display_name", "name"])) ?? asString(o.speaker_name) ?? asString(o.speaker);
    righe.push(chi ? `${chi.trim()}: ${testo}` : testo);
  }
  const testo = righe.join("\n");
  return testo ? testo.slice(0, MAX_TRASCRIZIONE) : null;
}

/**
 * Action items di una registrazione. L'API espone gli action items solo nella lista
 * /meetings (include_action_items): cerchiamo la recording tra le recenti. [] se assente.
 */
export async function getFathomActionItems(recordingId: string): Promise<string[]> {
  const recenti = await listRecentFathomCalls(100, { azioni: true });
  const call = (recenti ?? []).find((c) => c.recordingId === recordingId);
  return call?.actionItems ?? [];
}

const SYSTEM_TRADUZIONE = `Sei un traduttore professionale. Ricevi il riassunto di una call (in markdown, generato da Fathom) e lo restituisci in ITALIANO naturale e scorrevole.
REGOLE FERREE:
- Mantieni ESATTAMENTE la struttura markdown: titoli (##, ###), elenchi puntati e annidati, **grassetto**.
- Mantieni i link nel formato [testo](url) lasciando l'URL INVARIATO; traduci solo il testo visibile.
- Lascia invariati nomi propri, cifre, valute (es. €497) e nomi di strumenti (Notion, TikTok, Skool…).
- Se il testo è GIÀ in italiano, restituiscilo invariato (al massimo sistema la formattazione).
- NON aggiungere introduzioni, commenti o note: rispondi SOLO con il markdown tradotto.`;

/**
 * Traduce in italiano il riassunto di una call con Aura (streaming).
 * In caso di QUALSIASI errore restituisce il testo originale: la call non resta mai senza riassunto.
 */
export async function traduciRiassunto(markdown: string): Promise<string> {
  const src = (markdown ?? "").trim();
  if (!src) return markdown;
  const out = await streamAnthropicText({
    system: SYSTEM_TRADUZIONE,
    user: src,
    maxTokens: 4000,
    tag: "fathom:traduzione",
  });
  return out ?? markdown;
}
