/**
 * skool-lezioni — rinfresca il catalogo lezioni Skool (cron mensile o admin a
 * mano; porta di src/lib/skool/sync.ts). Apify → upsert `lezioni` per key,
 * disattiva quelle sparite, sync_stati('skool'). Telegram (solo dal cron, come
 * nel vecchio: a mano Wesley vede l'esito a schermo) se ci sono nuove lezioni o
 * se i cookie sono scaduti. Risposta: { ok, lezioni, nuove }.
 */
import { errore, gestisciErrore, HttpError, json, preflight } from "../_shared/http.ts";
import { adminClient, richiediCronOTeam } from "../_shared/supabase.ts";
import { aggiornaSync, logError } from "../_shared/log.ts";
import { notifyTelegram } from "../_shared/telegram.ts";
import { fetchSkoolLessons } from "./catalogo.ts";

const MSG_COOKIE =
  "🔑 Accesso Skool scaduto\n\nNon riesco più a leggere la classroom di Los Creators: i cookie non sono più validi.\nRinnovali quando puoi (Cookie-Editor → Export JSON → segreto SKOOL_COOKIES) e rilancia la sincronizzazione dal gestionale.";

Deno.serve(async (req: Request) => {
  const pre = preflight(req);
  if (pre) return pre;
  try {
    const chi = await richiediCronOTeam(req);
    if (chi !== "cron" && chi.rol !== "admin") throw new HttpError(403, "Solo l'admin può sincronizzare Skool.");
    const daCron = chi === "cron";

    const r = await fetchSkoolLessons();
    if (!r.ok) {
      await logError("skool-sync", `skool sync: ${r.motivo}`, { dettaglio: r.dettaglio.slice(0, 300) });
      // Niente totale/nuove: il catalogo già salvato resta valido (Aura continua a usarlo).
      // sync_stati.esito accetta solo ok|errore|parziale: il motivo va nel dettaglio.
      await aggiornaSync("skool", { esito: "errore", dettaglio: `${r.motivo}: ${r.dettaglio}`.slice(0, 500) });
      const cookieScaduto = r.motivo === "cookie_scaduto";
      if (cookieScaduto && daCron) await notifyTelegram(MSG_COOKIE);
      const msg = r.motivo === "config"
        ? "Configurazione Skool incompleta (APIFY_TOKEN / SKOOL_COOKIES)."
        : cookieScaduto
        ? "I cookie Skool sono scaduti: rinnovali e riprova."
        : `Apify non ha risposto correttamente. ${r.dettaglio}`;
      return errore(msg, 502);
    }

    const admin = adminClient();
    const { data: esistenti, error: eSel } = await admin.from("lezioni").select("key");
    if (eSel) throw eSel;
    const note = new Set(((esistenti ?? []) as Array<{ key: string }>).map((x) => x.key));
    const nuove = r.lezioni.filter((l) => !note.has(l.key)).length;

    const inizio = new Date().toISOString();
    const righe = r.lezioni.map((l) => ({
      key: l.key,
      corso: l.corso,
      titolo: l.titolo,
      url: l.url,
      descrizione: l.descrizione,
      keywords: l.keywords,
      ordine: l.ordine,
      attiva: true,
      updated_at: inizio,
    }));
    const { error } = await admin.from("lezioni").upsert(righe, { onConflict: "key" });
    if (error) {
      await logError("skool-sync", `skool sync: errore`, { dettaglio: error.message.slice(0, 300) });
      await aggiornaSync("skool", { esito: "errore", dettaglio: error.message.slice(0, 500) });
      return errore("Non sono riuscito a salvare il catalogo. Riprova.", 500);
    }

    // Lezioni sparite dalla classroom: le disattivo (non le cancello, così i
    // link già finiti nei compiti restano tracciabili). Riconoscibili perché
    // NON sono state toccate da questo upsert (updated_at più vecchio di `inizio`).
    const { error: eOff } = await admin.from("lezioni").update({ attiva: false }).lt("updated_at", inizio);
    if (eOff) await logError("skool-sync:disattiva", eOff, {}, { silent: true });

    await aggiornaSync("skool", { esito: "ok", totale: r.lezioni.length, nuove });
    if (nuove > 0 && daCron) {
      await notifyTelegram(
        `📚 Skool: ${nuove} ${nuove === 1 ? "nuova lezione" : "nuove lezioni"}\n\nCatalogo aggiornato: ${r.lezioni.length} lezioni totali. Aura può già collegarle ai compiti.`,
      );
    }
    return json({ ok: true, lezioni: r.lezioni.length, nuove });
  } catch (err) {
    return gestisciErrore(err);
  }
});
