/**
 * fathom-webhook-setup — registra UNA volta il webhook di Fathom che punta a
 * `fathom-webhook` (porta di /api/fathom/register della v1). Fathom non ha una
 * pagina per i webhook e la sua API non li elenca (GET /webhooks → 404): si
 * crea con POST e l'id si ricorda in `impostazioni_app.fathom_webhook_id`, così
 * un secondo lancio non ne crea un doppione. Body `{}` → registra se manca ·
 * `{ azione: "forza" }` → ne crea uno nuovo comunque (es. token cambiato; il
 * vecchio va rimosso con DELETE /external/v1/webhooks/{id} — azione `elimina`).
 * `{ azione: "elimina", webhook_id }` → cancella quel webhook su Fathom.
 * Auth: cron secret (lancio da SQL con private.chiama_edge_function) o team.
 * Il token non compare mai nelle risposte.
 */
import { errore, gestisciErrore, json, leggiBody, preflight } from "../_shared/http.ts";
import { adminClient, richiediCronOTeam } from "../_shared/supabase.ts";
import { FATHOM_API_KEY, FATHOM_WEBHOOK_TOKEN } from "../_shared/config.ts";

const BASE = "https://api.fathom.ai/external/v1";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";

type Body = { azione?: unknown; webhook_id?: unknown };

interface Memoria {
  fathom_webhook_id: string | null;
  fathom_webhook_registrato_il: string | null;
}

/** Mai il token nelle risposte o nei log: né in chiaro né come sta nell'URL (percent-encoded). */
function maschera(url: string): string {
  if (!FATHOM_WEBHOOK_TOKEN) return url;
  return url.split(encodeURIComponent(FATHOM_WEBHOOK_TOKEN)).join("***").split(FATHOM_WEBHOOK_TOKEN).join("***");
}

async function fathom(path: string, init: RequestInit = {}): Promise<{ status: number; data: unknown }> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: { "X-Api-Key": FATHOM_API_KEY, "content-type": "application/json", ...(init.headers ?? {}) },
    signal: AbortSignal.timeout(15000),
  });
  const data = await res.json().catch(() => null);
  return { status: res.status, data };
}

Deno.serve(async (req: Request) => {
  const pre = preflight(req);
  if (pre) return pre;
  try {
    await richiediCronOTeam(req);
    if (!FATHOM_API_KEY) return errore("FATHOM_API_KEY non configurata.", 500);
    if (!FATHOM_WEBHOOK_TOKEN) return errore("FATHOM_WEBHOOK_TOKEN non configurato.", 500);
    if (!SUPABASE_URL) return errore("SUPABASE_URL assente.", 500);
    const body = await leggiBody<Body>(req);
    const admin = adminClient();

    if (body.azione === "elimina") {
      if (typeof body.webhook_id !== "string" || !body.webhook_id) return errore("webhook_id mancante.", 400);
      const { status, data } = await fathom(`/webhooks/${encodeURIComponent(body.webhook_id)}`, { method: "DELETE" });
      if (status < 200 || status >= 300) return errore(`Fathom ${status}: ${JSON.stringify(data ?? {}).slice(0, 300)}`, 502);
      return json({ ok: true, eliminato: body.webhook_id });
    }

    const { data: memRaw, error: eMem } = await admin
      .from("impostazioni_app")
      .select("fathom_webhook_id, fathom_webhook_registrato_il")
      .eq("id", true)
      .maybeSingle();
    if (eMem) throw eMem;
    const memoria = (memRaw as Memoria | null) ?? { fathom_webhook_id: null, fathom_webhook_registrato_il: null };

    const destinazione = `${SUPABASE_URL}/functions/v1/fathom-webhook?token=${encodeURIComponent(FATHOM_WEBHOOK_TOKEN)}`;
    if (memoria.fathom_webhook_id && body.azione !== "forza") {
      return json({
        ok: true,
        creato: false,
        webhook_id: memoria.fathom_webhook_id,
        registrato_il: memoria.fathom_webhook_registrato_il,
        destinazione: maschera(destinazione),
      });
    }

    const { status, data } = await fathom("/webhooks", {
      method: "POST",
      body: JSON.stringify({
        destination_url: destinazione,
        triggered_for: ["my_recordings"],
        include_summary: true,
        include_action_items: true,
        include_transcript: false,
        include_crm_matches: false,
      }),
    });
    if (status < 200 || status >= 300) {
      return errore(`Fathom ${status}: ${JSON.stringify(data ?? {}).slice(0, 300)}`, 502);
    }
    const creato = (data ?? {}) as { id?: unknown };
    const webhookId = creato.id != null ? String(creato.id).slice(0, 100) : null;
    const { error: eSalva } = await admin
      .from("impostazioni_app")
      .update({ fathom_webhook_id: webhookId, fathom_webhook_registrato_il: new Date().toISOString() })
      .eq("id", true);
    if (eSalva) console.error("[fathom-webhook-setup] memoria non salvata:", eSalva.message);
    return json({ ok: true, creato: true, webhook_id: webhookId, destinazione: maschera(destinazione), sostituisce: memoria.fathom_webhook_id });
  } catch (err) {
    return gestisciErrore(err);
  }
});
