/**
 * POOL DI HUB PRONTI (porta di src/lib/hub/pool.ts) — Wesley tiene alcune copie
 * vuote del template dentro il toggle "Fogli vuoti" del contenitore "Hub
 * Clienti". Quando un cliente finisce l'onboarding, l'app ne prende una e la
 * intesta al cliente: così l'hub è identico al template senza doverlo
 * ricostruire (l'API Notion non sa duplicare una pagina).
 *
 * Struttura verificata (25/07/2026):
 *   contenitore (pagina) → blocco heading_2 "Fogli vuoti" (toggle)
 *      → pagine "Los Authority (default)…" = i fogli liberi
 */
import { CONTENITORE_HUB, HAS_NOTION } from "../_shared/config.ts";
import { appendBlocks, children, deleteBlock, testoPiano, updatePage } from "../_shared/notion.ts";
import { logError } from "../_shared/log.ts";

/** Il blocco toggle "Fogli vuoti" dentro il contenitore. */
async function bloccoFogliVuoti(): Promise<string | null> {
  for (const b of await children(CONTENITORE_HUB)) {
    if (!b.has_children) continue;
    const testo = testoPiano((b[b.type] as { rich_text?: unknown } | undefined)?.rich_text);
    if (/fogli\s+vuoti/i.test(testo)) return b.id;
  }
  return null;
}

export interface FoglioLibero {
  id: string;
  titolo: string;
}

/** I fogli ancora liberi (non intestati a nessun cliente). */
export async function fogliLiberi(): Promise<FoglioLibero[]> {
  if (!HAS_NOTION) return [];
  const toggle = await bloccoFogliVuoti();
  if (!toggle) return [];
  return (await children(toggle))
    .filter((b) => b.type === "child_page")
    .map((b) => ({ id: b.id, titolo: b.child_page?.title ?? "" }))
    // per sicurezza: solo le copie non ancora intestate
    .filter((f) => !/—/.test(f.titolo));
}

/**
 * Intesta un foglio al cliente: lo rinomina "Los Authority — {nome}" e gli mette
 * l'icona 🏠. Ritorna l'URL dell'hub.
 *
 * NB — l'hub resta DENTRO il toggle "Fogli vuoti": l'API Notion non sa spostare
 * una pagina (il PATCH del parent risponde 200 ma non cambia nulla, verificato
 * il 25/07/2026). Il titolo cambia, quindi `fogliLiberi()` non lo riprende più.
 */
export async function intestaFoglio(pageId: string, nomeCliente: string): Promise<string | null> {
  const titolo = `Los Authority — ${nomeCliente}`.slice(0, 200);
  const r = await updatePage(pageId, {
    properties: { title: { title: [{ text: { content: titolo } }] } },
    icon: { type: "emoji", emoji: "🏠" },
  });
  if (r.status !== 200) {
    await logError("genera-hub:intesta", `Notion ${r.status}`, { pageId, dettaglio: JSON.stringify(r.body).slice(0, 200) });
    return null;
  }
  return (r.body.url as string | undefined) ?? `https://www.notion.so/${pageId.replace(/-/g, "")}`;
}

/**
 * Sostituisce il contenuto di una pagina: svuota i blocchi esistenti e scrive
 * i nuovi (a gruppi di 90, limite dell'API). Ritorna true se ha scritto.
 */
export async function scriviPagina(pageId: string, blocchi: unknown[]): Promise<boolean> {
  if (blocchi.length === 0) return false;
  for (const b of await children(pageId)) await deleteBlock(b.id);
  for (let i = 0; i < blocchi.length; i += 90) {
    const r = await appendBlocks(pageId, blocchi.slice(i, i + 90));
    if (r.status !== 200) {
      await logError("genera-hub:scrivi", `Notion ${r.status}`, { pageId, dettaglio: JSON.stringify(r.body).slice(0, 200) });
      return i > 0; // qualcosa è stato scritto
    }
  }
  return true;
}
