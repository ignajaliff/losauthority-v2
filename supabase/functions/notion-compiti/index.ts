/**
 * notion-compiti — sync periodica dei compiti dagli hub Notion (pg_cron ogni 30
 * minuti, o lancio manuale dal team). Body: {} (tutti i clienti con hub) oppure
 * { cliente_id }. Risposta: { ok, letti, errori }.
 *
 * Il singolo cliente che non risponde è quasi sempre Notion lento: si sistema
 * al giro dopo e viene solo registrato. Se NON passa NESSUNO è un problema vero
 * (token revocato, Notion giù, contenitore scollegato): quello merita Telegram.
 */
import { errore, gestisciErrore, json, leggiBody, preflight } from "../_shared/http.ts";
import { adminClient, richiediCronOTeam } from "../_shared/supabase.ts";
import { aggiornaSync } from "../_shared/log.ts";
import { notifyTelegram } from "../_shared/telegram.ts";
import { HAS_NOTION } from "../_shared/config.ts";
import { clientiConHub, syncCliente } from "../_shared/hub-sync.ts";

type Body = {
  cliente_id?: unknown;
}

Deno.serve(async (req: Request) => {
  const pre = preflight(req);
  if (pre) return pre;
  try {
    await richiediCronOTeam(req);
    if (!HAS_NOTION) return errore("NOTION_TOKEN non configurato", 500);
    const { cliente_id } = await leggiBody<Body>(req);
    const singolo = typeof cliente_id === "string" && cliente_id.length > 0 ? cliente_id : null;

    const admin = adminClient();
    let clienti = await clientiConHub(admin);
    if (singolo) {
      clienti = clienti.filter((c) => c.id === singolo);
      if (clienti.length === 0) return errore("Questo cliente non ha ancora un hub Notion collegato.", 404);
    }

    let letti = 0;
    let errori = 0;
    let ultimoErrore: string | undefined;
    for (const c of clienti) {
      const r = await syncCliente(admin, c.id, c.notion_hub_url);
      if (r.ok) letti++;
      else {
        errori++;
        ultimoErrore = r.error;
      }
    }

    if (!singolo && clienti.length > 0 && letti === 0) {
      await notifyTelegram(
        `⚠️ Compiti: non riesco a leggere NESSUN hub\n\n${clienti.length} clienti, 0 letti.\n` +
          "Di solito è l'integrazione Notion scollegata dal contenitore «Hub Clienti», oppure Notion è giù.",
      );
    }
    if (!singolo) {
      await aggiornaSync("notion_compiti", {
        esito: errori === 0 ? "ok" : letti === 0 ? "errore" : "parziale",
        totale: letti,
        dettaglio: errori > 0 ? `${errori} clienti non letti` : undefined,
      });
    }

    if (singolo && errori > 0) return errore(ultimoErrore ?? "Sincronizzazione non riuscita.", 502);
    return json({ ok: true, letti, errori });
  } catch (err) {
    return gestisciErrore(err);
  }
});
