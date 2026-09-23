const TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN") ?? "";
const CHAT_ID = Deno.env.get("TELEGRAM_CHAT_ID") ?? "";

export const telegramConfigurato = () => TOKEN.length > 0 && CHAT_ID.length > 0;

/** Messaggio a Wesley (chat principale). Best-effort, non lancia mai. */
export async function notifyTelegram(text: string): Promise<void> {
  await sendTelegram(CHAT_ID, text);
}

/** Messaggio a una chat specifica. Best-effort, timeout 4s, non lancia mai. */
export async function sendTelegram(chatId: string | undefined, text: string): Promise<void> {
  if (!TOKEN || !chatId) return;
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 4000);
    await fetch(`https://api.telegram.org/bot${TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text: text.slice(0, 3500), disable_web_page_preview: true }),
      signal: controller.signal,
    });
    clearTimeout(timer);
  } catch {
    /* best-effort */
  }
}
