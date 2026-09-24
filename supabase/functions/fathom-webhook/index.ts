import { errore, json, leggiBody } from "../_shared/http.ts";
import { adminClient } from "../_shared/supabase.ts";
import { logError } from "../_shared/log.ts";
import { FATHOM_WEBHOOK_TOKEN } from "../_shared/config.ts";
import { cleanCallTitle, emailsInPayload, parseFathomCall, traduciRiassunto } from "../_shared/fathom.ts";
import { abbinaCliente, clientiPerEmail, scriviAzioni, upsertChiamata } from "../_shared/chiamate.ts";

/**
 * Webhook Fathom "new meeting content ready" (verify_jwt: false).
 * Auth: `?token=` oppure header `x-fathom-token` = FATHOM_WEBHOOK_TOKEN.
 * Dopo l'auth risponde SEMPRE 200 { ok }: Fathom non deve ritentare all'infinito;
 * gli errori finiscono in error_log via logError. Il payload grezzo resta in
 * fathom_webhook_log per l'assegnazione manuale dei casi non abbinati.
 */

function autenticato(req: Request): boolean {
  if (!FATHOM_WEBHOOK_TOKEN) return false;
  const daQuery = new URL(req.url).searchParams.get("token");
  const token = daQuery ?? req.headers.get("x-fathom-token");
  return token === FATHOM_WEBHOOK_TOKEN;
}

async function elabora(payload: Record<string, unknown>): Promise<void> {
  const admin = adminClient();
  const parsed = parseFathomCall(payload);
  const emails = emailsInPayload(payload);

  let cliente: ReturnType<typeof abbinaCliente> = null;
  try {
    cliente = abbinaCliente(await clientiPerEmail(admin), emails);
  } catch (err) {
    await logError("fathom-webhook:clienti", err, { recordingId: parsed.recordingId });
  }

  const { error: eLog } = await admin.from("fathom_webhook_log").insert({
    payload,
    emails,
    matched_email: cliente?.email ?? null,
  });
  if (eLog) await logError("fathom-webhook:log", eLog, { recordingId: parsed.recordingId }, { silent: true });

  if (!parsed.recordingId) {
    console.warn("[fathom-webhook] payload senza recording_id: solo log");
    return;
  }

  // Prima la riga (con l'originale), poi la traduzione: se Aura è lenta la call esiste già.
  const esito = await upsertChiamata(admin, {
    fathom_recording_id: parsed.recordingId,
    cliente_id: cliente?.id ?? null,
    titolo: cleanCallTitle(parsed.title, parsed.recordedAt),
    registrata_il: parsed.recordedAt,
    share_url: parsed.shareUrl,
    riassunto_originale: parsed.summary,
    riassunto: null,
  });

  if (esito.nuova && parsed.actionItems.length > 0) {
    try {
      await scriviAzioni(admin, esito.id, parsed.actionItems);
    } catch (err) {
      await logError("fathom-webhook:azioni", err, { chiamataId: esito.id }, { silent: true });
    }
  }

  if (parsed.summary) {
    const riassunto = await traduciRiassunto(parsed.summary);
    const { error } = await admin.from("chiamate").update({ riassunto }).eq("id", esito.id);
    if (error) await logError("fathom-webhook:riassunto", error, { chiamataId: esito.id });
  }

  // Niente PII nei log del runtime: solo l'esito.
  console.info(
    "[fathom-webhook]",
    JSON.stringify({ recordingId: parsed.recordingId, abbinato: cliente !== null, nuova: esito.nuova }),
  );
}

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") return errore("Metodo non consentito", 405);
  if (!autenticato(req)) return errore("Non autorizzato", 401);

  const payload = await leggiBody<Record<string, unknown>>(req);
  if (Object.keys(payload).length === 0) {
    console.warn("[fathom-webhook] payload vuoto o non JSON");
    return json({ ok: true });
  }

  try {
    await elabora(payload);
  } catch (err) {
    const parsed = parseFathomCall(payload);
    await logError("fathom-webhook:elabora", err, { recordingId: parsed.recordingId });
  }
  return json({ ok: true });
});
