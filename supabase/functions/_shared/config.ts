/** Config delle integrazioni. Tutto opzionale: senza chiave la funzione relativa si disattiva. */
export const NOTION_TOKEN = Deno.env.get("NOTION_TOKEN") ?? "";
export const NOTION_VERSION = "2022-06-28";
export const HAS_NOTION = NOTION_TOKEN.length > 0;
/** Pagina contenitore "Hub Clienti — Los Authority" (fissa: il template vive lì). */
export const CONTENITORE_HUB = Deno.env.get("NOTION_CONTENITORE_HUB") || "3a7779689cf781cdbc9bcf3a769f3e9b";

export const FATHOM_API_KEY = Deno.env.get("FATHOM_API_KEY") ?? "";
export const FATHOM_WEBHOOK_TOKEN = Deno.env.get("FATHOM_WEBHOOK_TOKEN") ?? "";

export const APIFY_TOKEN = Deno.env.get("APIFY_TOKEN") ?? "";
export const SKOOL_COOKIES = Deno.env.get("SKOOL_COOKIES") ?? "";
export const SKOOL_COMMUNITY_URL = Deno.env.get("SKOOL_COMMUNITY_URL") || "https://www.skool.com/loscreators";
export const APIFY_SKOOL_ACTOR = Deno.env.get("APIFY_SKOOL_ACTOR") || "memo23~skool-posts-with-comments-scraper";
export const HAS_SKOOL = APIFY_TOKEN.length > 0 && SKOOL_COOKIES.length > 0;

export const TELEGRAM_WEBHOOK_SECRET = Deno.env.get("TELEGRAM_WEBHOOK_SECRET") ?? "";
export const TELEGRAM_ALLOWED_CHAT_IDS = (Deno.env.get("TELEGRAM_ALLOWED_CHAT_IDS") ?? "")
  .split(",").map((s) => s.trim()).filter(Boolean);
export const CALENDAR_SYNC_SECRET = Deno.env.get("CALENDAR_SYNC_SECRET") ?? "";

// Il dominio del gestionale per i link delle notifiche non è più un secret (SITE_URL): vedi _shared/sito.ts.
