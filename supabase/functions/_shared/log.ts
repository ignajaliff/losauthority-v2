import { adminClient } from "./supabase.ts";
import { notifyTelegram } from "./telegram.ts";

function safeContext(context?: Record<string, unknown>): Record<string, unknown> | null {
  if (!context) return null;
  try {
    const s = JSON.stringify(context);
    if (s.length > 4000) return { _troncato: true, preview: s.slice(0, 4000) };
    return JSON.parse(s) as Record<string, unknown>;
  } catch {
    return null;
  }
}

/**
 * Registra un errore in error_log. NON lancia mai.
 * `silent: true` = registra ma non avvisa su Telegram (contrattempi passeggeri).
 * Nel context MAI token, cookie o segreti.
 */
export async function logError(
  scope: string,
  error: unknown,
  context?: Record<string, unknown>,
  opts?: { silent?: boolean },
): Promise<void> {
  try {
    const message =
      error instanceof Error ? error.message : typeof error === "string" ? error : JSON.stringify(error);
    console.error(`[${scope}]`, message);
    if (!opts?.silent) {
      await notifyTelegram(`⚠️ Los Authority\n[${scope}]\n${(message || "errore").slice(0, 500)}`);
    }
    await adminClient().from("error_log").insert({
      scope: scope.slice(0, 120),
      message: (message || "errore sconosciuto").slice(0, 2000),
      context: safeContext(context),
    });
  } catch {
    /* mai propagare */
  }
}

/** Aggiorna sync_stati per un job. Non lancia mai. */
export async function aggiornaSync(
  chiave: "skool" | "notion_compiti" | "fathom" | "genera_hub",
  campi: { esito: "ok" | "errore" | "parziale"; dettaglio?: string; totale?: number; nuove?: number },
): Promise<void> {
  try {
    await adminClient()
      .from("sync_stati")
      .upsert({ chiave, synced_at: new Date().toISOString(), ...campi }, { onConflict: "chiave" });
  } catch {
    /* best-effort */
  }
}
