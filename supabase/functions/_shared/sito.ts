/**
 * Dominio del gestionale per i link nelle notifiche Telegram del team. Non è più un secret
 * (SITE_URL): lo registra il browser del team quando apre il gestionale
 * (`impostazioni_app.sito_url`, migrazione 43), così cambiando dominio i link seguono da soli.
 * Non si usa l'Origin della richiesta: `contratto-pubblico` è pubblica e chiunque potrebbe inventarlo.
 */
import type { SupabaseClient } from "npm:@supabase/supabase-js@2";
import { logError } from "./log.ts";

/** Solo un origin (schema + host [+ porta]), come lo accetta il check della tabella. */
const ORIGIN = /^https?:\/\/[a-z0-9.-]+(:[0-9]{1,5})?$/;

/** Il dominio registrato, o null se non è ancora noto (allora i messaggi escono senza link). Non lancia mai. */
export async function sitoGestionale(admin: SupabaseClient): Promise<string | null> {
  try {
    const { data, error } = await admin.from("impostazioni_app").select("sito_url").eq("id", true).maybeSingle();
    if (error) throw error;
    const url = (data as { sito_url: string | null } | null)?.sito_url ?? null;
    return url && ORIGIN.test(url) ? url : null;
  } catch (err) {
    await logError("sito:lettura", err, {}, { silent: true });
    return null;
  }
}

/** Riga «👉 link» da aggiungere a un messaggio, o "" se il dominio non è noto. */
export function rigaLink(sito: string | null, percorso: string, prefisso = "\n👉 "): string {
  return sito ? `${prefisso}${sito}${percorso}` : "";
}
