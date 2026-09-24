/**
 * Client Notion minimale (fetch): timeout 20 s + UN secondo tentativo, come nel
 * sistema precedente (ogni tanto l'API supera i 20 s e il primo tentativo
 * viene abortito). Primitive + lettura righe + scoperta della struttura hub.
 *
 * Struttura degli hub (verificata 10/07/2026 e 25/07/2026): la pagina hub
 * contiene database di sezioni ("Sezioni del workspace"); una riga è la pagina
 * "Piano d'azione" con i database "Compiti per call n°1..4" (proprietà: Task ·
 * Status (Not started|In progress|Done) · Assigned To · Due Date · Link utile).
 * C'è anche una "To-do List" a livello hub. La riga "Documenti Strategici"
 * contiene le 5 pagine (Diagnosi, Avatar, Dolori, Offerta, Posizionamento).
 */
import { NOTION_TOKEN, NOTION_VERSION } from "./config.ts";

export interface NotionRisposta {
  status: number;
  body: Record<string, unknown>;
}

const TIMEOUT_MS = 20000;

const intestazioni = () => ({
  Authorization: `Bearer ${NOTION_TOKEN}`,
  "Notion-Version": NOTION_VERSION,
  "content-type": "application/json",
});

/** Chiamata grezza a Notion. Lancia solo se ENTRAMBI i tentativi falliscono per rete/timeout. */
export async function notionApi(path: string, init?: RequestInit): Promise<NotionRisposta> {
  let ultimo: unknown;
  for (let tentativo = 0; tentativo < 2; tentativo++) {
    try {
      const res = await fetch(`https://api.notion.com/v1${path}`, {
        ...init,
        headers: intestazioni(),
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
      const body = (await res.json().catch(() => ({}))) as Record<string, unknown>;
      return { status: res.status, body };
    } catch (err) {
      ultimo = err;
    }
  }
  throw ultimo;
}

export interface Blocco {
  id: string;
  type: string;
  has_children?: boolean;
  child_database?: { title?: string };
  child_page?: { title?: string };
  [k: string]: unknown;
}

export type Proprieta = { type: string; [k: string]: unknown };
export interface Riga {
  id: string;
  url?: string;
  properties?: Record<string, Proprieta>;
}

/** Testo piano da un array rich_text. */
export const testoPiano = (rt: unknown): string =>
  Array.isArray(rt) ? rt.map((t) => (t as { plain_text?: string }).plain_text ?? "").join("") : "";

/** Tutti i blocchi figli (paginati). [] se la pagina non risponde. */
export async function children(blockId: string): Promise<Blocco[]> {
  const out: Blocco[] = [];
  let cursor: string | undefined;
  do {
    const q = cursor ? `?start_cursor=${cursor}&page_size=100` : "?page_size=100";
    const r = await notionApi(`/blocks/${blockId}/children${q}`);
    if (r.status !== 200) return out;
    out.push(...((r.body.results as Blocco[]) ?? []));
    cursor = r.body.has_more ? (r.body.next_cursor as string) : undefined;
  } while (cursor);
  return out;
}

/** Tutte le righe di un database (paginate). ok=false se la query non risponde 200. */
export async function queryDatabase(dbId: string): Promise<{ ok: boolean; rows: Riga[] }> {
  const rows: Riga[] = [];
  let cursor: string | undefined;
  do {
    const r = await notionApi(`/databases/${dbId}/query`, {
      method: "POST",
      body: JSON.stringify(cursor ? { start_cursor: cursor, page_size: 100 } : { page_size: 100 }),
    });
    if (r.status !== 200) return { ok: false, rows };
    rows.push(...((r.body.results as Riga[]) ?? []));
    cursor = r.body.has_more ? (r.body.next_cursor as string) : undefined;
  } while (cursor);
  return { ok: true, rows };
}

export const getPage = (pageId: string) => notionApi(`/pages/${pageId}`);
export const updatePage = (pageId: string, patch: Record<string, unknown>) =>
  notionApi(`/pages/${pageId}`, { method: "PATCH", body: JSON.stringify(patch) });
export const createPage = (payload: Record<string, unknown>) =>
  notionApi("/pages", { method: "POST", body: JSON.stringify(payload) });
export const appendBlocks = (blockId: string, blocchi: unknown[]) =>
  notionApi(`/blocks/${blockId}/children`, { method: "PATCH", body: JSON.stringify({ children: blocchi }) });
/** DELETE = archivia il blocco (Notion non cancella mai davvero). */
export const deleteBlock = (blockId: string) => notionApi(`/blocks/${blockId}`, { method: "DELETE" });
export const archiviaPagina = (pageId: string) => updatePage(pageId, { archived: true });

/* ---------------- Lettura proprietà di una riga ---------------- */

const prop = (row: Riga, type: string): Proprieta | undefined =>
  Object.values(row.properties ?? {}).find((x) => x.type === type);

export function rowTitle(row: Riga): string {
  const p = prop(row, "title") as { title?: unknown } | undefined;
  return testoPiano(p?.title);
}
export function rowStatus(row: Riga): string {
  const p = prop(row, "status") as { status?: { name?: string } } | undefined;
  return p?.status?.name ?? "Not started";
}
export function rowDue(row: Riga): string | null {
  const p = prop(row, "date") as { date?: { start?: string } } | undefined;
  return p?.date?.start ?? null;
}
export function rowUrl(row: Riga): string | null {
  const p = prop(row, "url") as { url?: string | null } | undefined;
  return p?.url ?? null;
}
export interface Assegnatario {
  id: string;
  name: string;
  email: string | null;
}
export function rowAssignees(row: Riga): Assegnatario[] {
  const p = prop(row, "people") as
    | { people?: Array<{ id?: string; name?: string; person?: { email?: string } }> }
    | undefined;
  return (p?.people ?? []).map((u) => ({ id: u.id ?? "", name: u.name ?? "", email: u.person?.email ?? null }));
}

/* ---------------- Scoperta della struttura hub ---------------- */

/** L'id pagina (32 hex) dall'URL dell'hub. */
export function hubPageId(hubUrl: string): string | null {
  const m = hubUrl.replace(/-/g, "").match(/[0-9a-f]{32}/i);
  return m ? m[0] : null;
}

/** Cerca dentro una pagina (fino a `depth` livelli di blocchi) i child_database. */
export async function findDatabasesIn(pageId: string, depth = 3): Promise<Array<{ id: string; title: string }>> {
  const found: Array<{ id: string; title: string }> = [];
  const frontier: Array<{ id: string; d: number }> = [{ id: pageId, d: 0 }];
  let visits = 0;
  while (frontier.length && visits < 40) {
    const { id, d } = frontier.shift() as { id: string; d: number };
    visits++;
    for (const b of await children(id)) {
      if (b.type === "child_database") {
        found.push({ id: b.id, title: b.child_database?.title ?? "" });
      } else if (b.has_children && d < depth && b.type !== "child_page") {
        frontier.push({ id: b.id, d: d + 1 });
      }
    }
  }
  return found;
}

export interface StrutturaHub {
  boards: Array<{ id: string; call: number }>;
  todoId: string | null;
}

/**
 * Scoperta completa (~10 richieste): le board "Compiti per call n°X" dentro
 * "Piano d'azione" + la To-do List a livello hub. Le sezioni vengono lette
 * al massimo da 3 database (dedup per id: lo stesso db può comparire in più viste).
 */
export async function discoverHub(hubId: string): Promise<StrutturaHub> {
  const topDbs = await findDatabasesIn(hubId, 2);
  const todoId = topDbs.find((d) => /to-?do/i.test(d.title))?.id ?? null;

  let pianoId: string | null = null;
  const visti = new Set<string>();
  for (const db of topDbs) {
    if (/to-?do|contenuti|stories/i.test(db.title)) continue;
    if (visti.has(db.id)) continue;
    if (visti.size >= 3) break;
    visti.add(db.id);
    const { rows } = await queryDatabase(db.id);
    const piano = rows.find((r) => /piano/i.test(rowTitle(r)));
    if (piano) {
      pianoId = piano.id;
      break;
    }
  }
  if (!pianoId) return { boards: [], todoId };

  const pianoDbs = await findDatabasesIn(pianoId, 3);
  const boards: Array<{ id: string; call: number }> = [];
  const seen = new Set<string>();
  for (const d of pianoDbs) {
    const m = d.title.match(/compiti.*?(\d+)/i);
    if (!m || seen.has(d.id)) continue;
    seen.add(d.id);
    boards.push({ id: d.id, call: Number(m[1]) });
  }
  boards.sort((a, b) => a.call - b.call);
  return { boards, todoId };
}

/** Le 5 pagine dei Documenti Strategici dentro un hub: { titolo → pageId }. */
export async function docStrategici(hubId: string): Promise<Map<string, string>> {
  const out = new Map<string, string>();
  const dbIds = new Set<string>();
  for (const b of await children(hubId)) {
    if (b.type === "child_database") dbIds.add(b.id);
    else if (b.has_children && b.type !== "child_page") {
      for (const c of await children(b.id)) if (c.type === "child_database") dbIds.add(c.id);
    }
  }

  let docsPageId: string | null = null;
  for (const dbId of dbIds) {
    const r = await notionApi(`/databases/${dbId}/query`, { method: "POST", body: JSON.stringify({ page_size: 50 }) });
    if (r.status !== 200) continue;
    for (const row of (r.body.results as Riga[]) ?? []) {
      const titolo = rowTitle(row);
      if (/document/i.test(titolo) && /strateg/i.test(titolo)) {
        docsPageId = row.id;
        break;
      }
    }
    if (docsPageId) break;
  }
  if (!docsPageId) return out;

  for (const b of await children(docsPageId)) {
    if (b.type === "child_page") {
      const titolo = (b.child_page?.title ?? "").trim();
      if (titolo) out.set(titolo, b.id);
    }
  }
  return out;
}
