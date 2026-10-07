/**
 * Link e handle Instagram: la stessa normalizzazione la usano onboarding-completato
 * (ricava il profilo da `link_profili`) e instagram-sync (chiama Apify).
 */

const DOMINIO = /^(?:https?:\/\/)?(?:www\.)?instagram\.com\/([^/?#\s]+)/i;
const HANDLE = /^@?([a-z0-9._]{1,30})$/i;
/** Percorsi di instagram.com che NON sono profili. */
const NON_PROFILI = new Set(["p", "reel", "reels", "tv", "stories", "explore", "accounts", "direct"]);

/** "@nome", "nome", "instagram.com/nome/", "https://www.instagram.com/nome?igsh=…" → handle, oppure null. */
export function handleInstagram(raw: string | null | undefined): string | null {
  const v = (raw ?? "").trim();
  if (!v) return null;
  const m = DOMINIO.exec(v);
  if (m) {
    const h = m[1].replace(/^@/, "");
    return !NON_PROFILI.has(h.toLowerCase()) && HANDLE.test(h) ? h : null;
  }
  if (/^https?:\/\//i.test(v) || v.includes("/")) return null;
  const h = HANDLE.exec(v);
  return h ? h[1] : null;
}

/** Link canonico al profilo. */
export function urlProfiloInstagram(handle: string): string {
  return `https://www.instagram.com/${handle}/`;
}

/** Il primo link Instagram tra quelli del cliente (es. `link_profili` dell'onboarding). */
export function instagramDaLink(link: unknown): string | null {
  if (!Array.isArray(link)) return null;
  for (const l of link) {
    if (typeof l !== "string" || !/instagram/i.test(l)) continue;
    const h = handleInstagram(l);
    if (h) return urlProfiloInstagram(h);
  }
  return null;
}

/** shortCode di un post/reel dal suo link, oppure null. */
export function codicePost(url: string | null | undefined): string | null {
  const m = /instagram\.com\/(?:p|reel|reels|tv)\/([A-Za-z0-9_-]{3,40})/i.exec(url ?? "");
  return m ? m[1] : null;
}
