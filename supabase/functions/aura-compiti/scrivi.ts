/**
 * Scrittura di un compito sulla board Notion "Compiti per call n°X" (porta di
 * src/lib/notion/compiti-write.ts). Proprietà: Task (title) · Status (status) ·
 * Assigned To (people) · Due Date (date) · Link utile (url).
 */
import { createPage } from "../_shared/notion.ts";
import { bodyBlocks, type CompitoBody } from "../_shared/notion-blocks.ts";
import { logError } from "../_shared/log.ts";

/** Id utente Notion di Wesley (per l'Assigned To dei suoi impegni). */
export const NOTION_WESLEY_USER_ID = Deno.env.get("NOTION_WESLEY_USER_ID") ?? "";

/** Crea un compito nella board indicata (titolo + corpo ricco). Ritorna true se scritto. */
export async function createCompito(
  dbId: string,
  task: string,
  opts?: { assignUserId?: string | null; body?: CompitoBody },
): Promise<boolean> {
  const properties: Record<string, unknown> = {
    Task: { title: [{ text: { content: task.slice(0, 200) } }] },
    Status: { status: { name: "Not started" } },
  };
  if (opts?.assignUserId) properties["Assigned To"] = { people: [{ id: opts.assignUserId }] };
  const lezioneUrl = opts?.body?.lezione?.url?.trim();
  if (lezioneUrl) properties["Link utile"] = { url: lezioneUrl.slice(0, 1900) };

  const r = await createPage({ parent: { database_id: dbId }, properties, children: bodyBlocks(opts?.body) });
  if (r.status !== 200) {
    await logError("aura-compiti:create", `Notion ${r.status}`, {
      dbId,
      task: task.slice(0, 80),
      dettaglio: JSON.stringify(r.body).slice(0, 200),
    });
    return false;
  }
  return true;
}
