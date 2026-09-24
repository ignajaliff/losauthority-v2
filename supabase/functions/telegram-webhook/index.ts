/**
 * telegram-webhook — "Aura su Telegram": risponde a domande sui numeri del
 * gestionale (SOLA LETTURA). verify_jwt: false, auth propria:
 *  1. header `x-telegram-bot-api-secret-token` = TELEGRAM_WEBHOOK_SECRET;
 *  2. la chat deve essere in TELEGRAM_ALLOWED_CHAT_IDS.
 * Risponde SEMPRE 200 a Telegram (altrimenti ritenta e risponde due volte).
 */
import { json, leggiBody, preflight } from "../_shared/http.ts";
import { sendTelegram } from "../_shared/telegram.ts";
import { streamAnthropicText } from "../_shared/anthropic.ts";
import { logError } from "../_shared/log.ts";
import { TELEGRAM_ALLOWED_CHAT_IDS, TELEGRAM_WEBHOOK_SECRET } from "../_shared/config.ts";
import { costruisciSnapshot } from "./snapshot.ts";

type TgUpdate = {
  message?: {
    chat?: { id?: number | string };
    text?: string;
    photo?: unknown;
    voice?: unknown;
    document?: unknown;
  };
}

const TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN") ?? "";

const SYSTEM = `Sei Aura, l'assistente di Wesley Caicedo per il suo gestionale "Los Authority".
Wesley ti scrive da Telegram e ti fa domande sul suo business. Rispondi SOLO usando i DATI forniti.

Regole:
- Rispondi in italiano, in modo BREVE e diretto: è una chat, non un report. Massimo ~10 righe.
- Usa i numeri esatti dei dati. NON inventare mai cifre, nomi o date.
- Se il dato che serve non c'è nei dati forniti, dillo chiaramente ("questo dato non ce l'ho").
- Niente markdown pesante (Telegram): usa testo semplice, al massimo elenchi con "-" ed emoji sobrie.
- Se la domanda è ambigua, rispondi con la lettura più utile e dì cosa hai assunto.
- Sei in SOLA LETTURA: se ti chiede di modificare/aggiungere/cancellare qualcosa, spiega gentilmente che per ora puoi solo consultare e che deve farlo dal gestionale.`;

const AIUTO = [
  "Ciao, sono Aura 👋 Posso rispondere a domande sul tuo gestionale (solo consultazione).",
  "",
  "Prova con:",
  "- Quanto ho incassato?",
  "- Chi mi deve ancora pagare?",
  "- Che F24 ho in scadenza?",
  "- Che call ho in programma?",
  "- A che punto è un cliente?",
  "- Quanto spendo di fisso al mese?",
].join("\n");

/** "sta scrivendo…" mentre Aura ragiona (best-effort). */
async function staScrivendo(chatId: string): Promise<void> {
  if (!TOKEN) return;
  try {
    await fetch(`https://api.telegram.org/bot${TOKEN}/sendChatAction`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, action: "typing" }),
      signal: AbortSignal.timeout(3000),
    });
  } catch {
    /* best-effort */
  }
}

async function rispondiConAura(domanda: string): Promise<string | null> {
  const snapshot = await costruisciSnapshot();
  return streamAnthropicText({
    system: SYSTEM,
    user: `DATI ATTUALI DEL GESTIONALE:\n\n${snapshot}\n\n---\nDOMANDA DI WESLEY: ${domanda}`,
    maxTokens: 700,
    tag: "telegram-aura",
  });
}

Deno.serve(async (req: Request) => {
  const pre = preflight(req);
  if (pre) return pre;
  try {
    const header = req.headers.get("x-telegram-bot-api-secret-token") ?? "";
    if (!TELEGRAM_WEBHOOK_SECRET || header !== TELEGRAM_WEBHOOK_SECRET) {
      return new Response("Non autorizzato", { status: 401 });
    }

    const update = await leggiBody<TgUpdate>(req);
    const msg = update.message;
    const chatId = msg?.chat?.id != null ? String(msg.chat.id) : "";
    if (!chatId) return json({ ok: true });

    if (!TELEGRAM_ALLOWED_CHAT_IDS.includes(chatId)) {
      await sendTelegram(
        chatId,
        `Non sei autorizzato a interrogare il gestionale.\n\nSe sei Wesley: aggiungi questo ID al secret TELEGRAM_ALLOWED_CHAT_IDS delle Edge Functions.\nID di questa chat: ${chatId}`,
      );
      return json({ ok: true });
    }

    const testo = (msg?.text ?? "").trim();
    if (!testo) {
      await sendTelegram(
        chatId,
        msg?.photo || msg?.document || msg?.voice
          ? "Per ora so rispondere solo a domande scritte 🙂 (foto e vocali non ancora)."
          : "Scrivimi una domanda sul gestionale.",
      );
      return json({ ok: true });
    }
    if (testo === "/start" || testo === "/help" || /^aiuto$/i.test(testo)) {
      await sendTelegram(chatId, AIUTO);
      return json({ ok: true });
    }

    await staScrivendo(chatId);
    try {
      const risposta = await rispondiConAura(testo.slice(0, 2000));
      await sendTelegram(chatId, risposta ?? "Non sono riuscita a rispondere in questo momento. Riprova tra poco.");
    } catch (e) {
      await logError("telegram-webhook:aura", e, { chatId });
      await sendTelegram(chatId, "Ho avuto un problema tecnico. Ho registrato l'errore, riprova tra poco.");
    }
    return json({ ok: true });
  } catch (err) {
    // Anche in caso di errore imprevisto Telegram deve ricevere 200.
    await logError("telegram-webhook:handler", err);
    return json({ ok: true });
  }
});
