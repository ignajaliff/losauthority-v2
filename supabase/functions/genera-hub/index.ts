/**
 * genera-hub — creazione automatica degli hub (pg_cron 8:00, max 2 clienti per
 * giro: ognuno = 5 chiamate ad Aura) o a comando dal team ("Crea hub adesso").
 * Body: {} → clienti con stato_onboarding='completato' e senza hub; { cliente_id }
 * → quel cliente (anche se fuori target: decisione di Wesley).
 * Risposta: { ok, esiti: [{ cliente_id, ok, hub_url?, errore? }] }.
 */
import type { SupabaseClient } from "npm:@supabase/supabase-js@2";
import { errore, gestisciErrore, json, leggiBody, preflight } from "../_shared/http.ts";
import { adminClient, richiediCronOTeam } from "../_shared/supabase.ts";
import { HAS_ANTHROPIC } from "../_shared/anthropic.ts";
import { HAS_NOTION } from "../_shared/config.ts";
import { aggiornaSync, logError } from "../_shared/log.ts";
import { notifyTelegram } from "../_shared/telegram.ts";
import { docStrategici } from "../_shared/notion.ts";
import { mdToBlocks } from "../_shared/notion-blocks.ts";
import { leggiMateriale, nomeCliente, renderDossier } from "../_shared/materiale.ts";
import { fogliLiberi, intestaFoglio, scriviPagina } from "./pool.ts";
import { DOCS, paginaPerDoc, scriviDoc } from "./documenti.ts";

/** Quanti clienti servire per esecuzione automatica. */
const MAX_PER_GIRO = 2;

type Body = {
  cliente_id?: unknown;
}
interface Esito {
  cliente_id: string;
  ok: boolean;
  hub_url?: string;
  errore?: string;
}
interface RigaCliente {
  id: string;
  notion_hub_url: string | null;
}

/** Genera l'hub di UN cliente. Non lancia mai: ritorna l'esito. */
async function generaHubCliente(admin: SupabaseClient, clienteId: string): Promise<Esito> {
  const { data } = await admin.from("clienti").select("id, notion_hub_url").eq("id", clienteId).maybeSingle();
  const cliente = data as RigaCliente | null;
  if (!cliente) return { cliente_id: clienteId, ok: false, errore: "Cliente non trovato." };
  if (cliente.notion_hub_url) return { cliente_id: clienteId, ok: false, errore: "Questo cliente ha già un hub." };

  const nome = await nomeCliente(admin, clienteId);
  let materiale;
  try {
    materiale = await leggiMateriale(admin, clienteId);
  } catch (e) {
    await logError("genera-hub:materiale", e, { clienteId });
    return { cliente_id: clienteId, ok: false, errore: "Non sono riuscita a leggere la scheda del cliente." };
  }
  if (!materiale) return { cliente_id: clienteId, ok: false, errore: "Il cliente non ha ancora inviato la scheda onboarding." };

  // 1) Un foglio dal pool.
  const liberi = await fogliLiberi();
  if (liberi.length === 0) {
    await notifyTelegram(
      "⚠️ Hub non creato: fogli finiti\n\n" +
        `${nome} ha completato l'onboarding ma non ci sono più fogli vuoti nel contenitore.\n` +
        "Duplica il template «Los Authority (default)» dentro il toggle «Fogli vuoti» e riprovo da solo.",
    );
    await logError("genera-hub:fogli", "nessun foglio libero nel pool", { clienteId }, { silent: true });
    return { cliente_id: clienteId, ok: false, errore: "Nessun foglio libero nel pool." };
  }
  const foglio = liberi[0];

  // 2) Aura scrive i 5 documenti (in parallelo) dalle risposte vere, mentre
  //    cerchiamo le 5 pagine nel foglio. Si intesta il foglio SOLO dopo: se Aura
  //    non risponde affatto, il pool resta intatto (mai un hub a metà).
  const dossier = renderDossier(materiale);
  const [pagine, testi] = await Promise.all([
    docStrategici(foglio.id),
    Promise.all(DOCS.map((d) => scriviDoc(d, nome, dossier))),
  ]);
  if (testi.every((t) => !t)) {
    await logError("genera-hub:aura", "nessun documento generato", { clienteId });
    return { cliente_id: clienteId, ok: false, errore: "Aura non ha risposto: hub non creato. Riprova tra poco." };
  }

  const hubUrl = await intestaFoglio(foglio.id, nome);
  if (!hubUrl) return { cliente_id: clienteId, ok: false, errore: "Non sono riuscita a intestare il foglio su Notion." };

  // 3) Scrittura su Notion (svuota e riscrive ogni pagina).
  let scritti = 0;
  for (let i = 0; i < DOCS.length; i++) {
    const testo = testi[i];
    if (!testo) continue;
    const pageId = paginaPerDoc(pagine, DOCS[i]);
    if (!pageId) continue;
    if (await scriviPagina(pageId, mdToBlocks(testo))) scritti++;
  }
  if (scritti === 0) await logError("genera-hub:zero-doc", "Hub intestato ma nessun documento scritto", { clienteId, hubUrl });

  // 4) Gestionale: hub collegato.
  const { error } = await admin
    .from("clienti")
    .update({ notion_hub_url: hubUrl, hub_creato_il: new Date().toISOString(), stato_onboarding: "hub_creato" })
    .eq("id", clienteId);
  if (error) {
    await logError("genera-hub:save", error, { clienteId, hubUrl });
    return { cliente_id: clienteId, ok: false, hub_url: hubUrl, errore: "Hub creato su Notion ma non salvato nel gestionale." };
  }

  const rimasti = liberi.length - 1;
  await notifyTelegram(
    `🏠 Hub creato: ${nome}\n\n` +
      `Aura ha compilato ${scritti}/${DOCS.length} documenti strategici dalle sue risposte.\n${hubUrl}\n\n` +
      "Lo trovi ancora dentro il toggle «Fogli vuoti»: trascinalo fuori quando vuoi (Notion non permette di spostarlo da fuori).\n" +
      (rimasti <= 1 ? `⚠️ Restano ${rimasti} fogli vuoti: duplicane altri nel contenitore.` : `Fogli vuoti rimasti: ${rimasti}.`),
  );
  return { cliente_id: clienteId, ok: true, hub_url: hubUrl };
}

/** Clienti che hanno finito le schede e aspettano l'hub (i più vecchi prima). */
async function clientiSenzaHub(admin: SupabaseClient): Promise<string[]> {
  const { data, error } = await admin
    .from("clienti")
    .select("id")
    .eq("stato_onboarding", "completato")
    .is("notion_hub_url", null)
    .order("onboarding_completato_il", { ascending: true, nullsFirst: false });
  if (error) throw error;
  return ((data ?? []) as Array<{ id: string }>).map((r) => r.id);
}

Deno.serve(async (req: Request) => {
  const pre = preflight(req);
  if (pre) return pre;
  try {
    await richiediCronOTeam(req);
    if (!HAS_NOTION || !HAS_ANTHROPIC) return errore("NOTION_TOKEN o ANTHROPIC_API_KEY non configurati.", 500);
    const { cliente_id } = await leggiBody<Body>(req);
    const admin = adminClient();

    const manuale = typeof cliente_id === "string" && cliente_id.length > 0;
    const daFare = manuale ? [cliente_id as string] : (await clientiSenzaHub(admin)).slice(0, MAX_PER_GIRO);

    const esiti: Esito[] = [];
    for (const id of daFare) esiti.push(await generaHubCliente(admin, id));

    const creati = esiti.filter((e) => e.ok).length;
    if (!manuale) {
      await aggiornaSync("genera_hub", {
        esito: esiti.length === 0 || creati === esiti.length ? "ok" : creati === 0 ? "errore" : "parziale",
        totale: creati,
        dettaglio: esiti.filter((e) => !e.ok).map((e) => e.errore).join(" · ").slice(0, 500) || undefined,
      });
    }
    if (manuale && !esiti[0]?.ok) return errore(esiti[0]?.errore ?? "Creazione hub non riuscita.", 502);
    return json({ ok: true, esiti });
  } catch (err) {
    return gestisciErrore(err);
  }
});
