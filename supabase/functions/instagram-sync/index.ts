/**
 * instagram-sync — le Pubblicazioni e i follower del cliente dal suo profilo Instagram (Apify).
 *
 * Tre modi di chiamarla:
 *  - pg_cron (CRON_SECRET, ogni giorno alle 05:00 UTC): giro automatico su tutti
 *    i clienti con `clienti.instagram`: profilo riletto ogni 30 giorni (video
 *    nuovi), numeri dei post riletti ogni 15 giorni (per URL, senza il profilo).
 *  - cliente loggato: collega il profilo la prima volta (`instagram`) e/o chiede
 *    la lettura del profilo (al massimo una al giorno). La chiama anche il browser
 *    appena finito l'onboarding, senza aspettare la risposta.
 *  - team: `cliente_id` obbligatorio, rilegge profilo e numeri subito («Aggiorna adesso»).
 * Il link del profilo lo imposta il cliente una volta sola; poi lo cambia solo il team.
 */
import { gestisciErrore, HttpError, json, leggiBody, preflight } from "../_shared/http.ts";
import { adminClient, autorizzatoCron, chiamante, esTeam } from "../_shared/supabase.ts";
import { aggiornaSync } from "../_shared/log.ts";
import { handleInstagram, urlProfiloInstagram } from "../_shared/instagram.ts";
import {
  aggiornaFollower,
  aggiornaMetriche,
  clientiConInstagram,
  type ClienteInstagram,
  COLONNE_CLIENTE,
  type EsitoSync,
  profiloScaduto,
  senzaFollowerRecenti,
  sincronizzaProfilo,
} from "./sync.ts";
import type { SupabaseClient } from "npm:@supabase/supabase-js@2";

type Body = { cliente_id?: unknown; instagram?: unknown };

/** Run Apify per giro automatico: tiene la funzione entro i tempi e il costo prevedibile. */
const MAX_PROFILI_PER_GIRO = 3;
const MAX_METRICHE_PER_GIRO = 6;
/** Letture dei soli follower per giro (un risultato Apify ciascuna). */
const MAX_FOLLOWER_PER_GIRO = 6;
/** Oltre questo tempo il giro non avvia altre run: il resto lo fa la mattina dopo (limite di durata delle Edge Function). */
const BUDGET_GIRO_MS = 100_000;
/** Il cliente può far rileggere il profilo al massimo una volta al giorno. */
const ORE_TRA_LETTURE_CLIENTE = 24;

const MSG_PROFILO = "Non sono riuscita a leggere il profilo Instagram. Riprovo da sola nei prossimi giorni.";

async function clienteInstagram(admin: SupabaseClient, clienteId: string): Promise<ClienteInstagram | null> {
  const { data, error } = await admin.from("clienti").select(COLONNE_CLIENTE).eq("id", clienteId).maybeSingle();
  if (error) throw error;
  return (data as ClienteInstagram | null) ?? null;
}

/**
 * Giro del cron, cliente per cliente: profilo scaduto (≥ 30 giorni: video nuovi
 * e follower), altrimenti numeri dei post fermi da 15 giorni e, se mancano,
 * i follower degli ultimi 30 giorni. Tetti per giro e un budget di tempo.
 */
async function giroAutomatico(admin: SupabaseClient) {
  const inizio = Date.now();
  const clienti = await clientiConInstagram(admin);
  const senzaFollower = await senzaFollowerRecenti(admin, clienti);
  let profili = 0;
  let metriche = 0;
  let follower = 0;
  let nuove = 0;
  let rimandati = 0;
  const errori: string[] = [];
  const annota = (c: ClienteInstagram, e: EsitoSync) => {
    if (!e.ok) errori.push(`${c.id.slice(0, 8)}: ${e.errore}`);
  };
  for (const c of clienti) {
    if (Date.now() - inizio > BUDGET_GIRO_MS) {
      rimandati++;
      continue;
    }
    if (profiloScaduto(c)) {
      if (profili >= MAX_PROFILI_PER_GIRO) continue;
      profili++;
      const e = await sincronizzaProfilo(admin, c);
      if (e.ok) nuove += e.nuove;
      annota(c, e);
      continue; // la lettura del profilo ha già registrato i numeri dei video e i follower
    }
    if (metriche < MAX_METRICHE_PER_GIRO) {
      const e = await aggiornaMetriche(admin, c.id);
      annota(c, e);
      if (e.ok && e.rilevazioni > 0) metriche++;
    }
    // Follower mancanti (cliente collegato prima dei follower, o run "details" fallita); non per i profili in errore.
    if (senzaFollower.has(c.id) && !c.instagram_sync_errore && follower < MAX_FOLLOWER_PER_GIRO && Date.now() - inizio <= BUDGET_GIRO_MS) {
      follower++;
      annota(c, await aggiornaFollower(admin, c));
    }
  }
  if (rimandati > 0) console.log(`[instagram-sync] budget di tempo esaurito: ${rimandati} clienti rimandati a domani`);
  const totale = profili + metriche + follower;
  await aggiornaSync("instagram", {
    esito: errori.length === 0 ? "ok" : totale > errori.length ? "parziale" : "errore",
    totale,
    nuove,
    dettaglio: errori.join(" · ").slice(0, 500) || undefined,
  });
  return { clienti: clienti.length, profili, metriche, follower, nuove, rimandati, errori: errori.length };
}

/** Il cliente collega il profilo (solo se manca) e chiede la lettura. */
async function richiestaCliente(admin: SupabaseClient, clienteId: string, body: Body) {
  let cliente = await clienteInstagram(admin, clienteId);
  if (!cliente) throw new HttpError(404, "Cliente non trovato.");
  if (!cliente.instagram) {
    const handle = typeof body.instagram === "string" ? handleInstagram(body.instagram) : null;
    if (!handle) throw new HttpError(400, "Scrivi il link o il nome del tuo profilo Instagram, per esempio instagram.com/tuonome.");
    const instagram = urlProfiloInstagram(handle);
    const { error } = await admin.from("clienti").update({ instagram, instagram_sync_errore: null }).eq("id", clienteId);
    if (error) throw error;
    cliente = { ...cliente, instagram };
  }
  // Dopo un errore (es. profilo privato reso pubblico) il cliente può rileggere subito.
  const recente =
    !cliente.instagram_sync_errore &&
    cliente.instagram_sync_il &&
    Date.now() - new Date(cliente.instagram_sync_il).getTime() < ORE_TRA_LETTURE_CLIENTE * 3_600_000;
  if (recente) return json({ ok: true, instagram: cliente.instagram, saltato: true });
  const esito = await sincronizzaProfilo(admin, cliente);
  if (!esito.ok) throw new HttpError(esito.privato ? 422 : 502, esito.privato ? esito.errore : MSG_PROFILO);
  return json({ ok: true, instagram: cliente.instagram, profilo: esito });
}

/** Il team forza profilo e numeri di un cliente. */
async function richiestaTeam(admin: SupabaseClient, body: Body) {
  const clienteId = typeof body.cliente_id === "string" ? body.cliente_id : "";
  if (!clienteId) throw new HttpError(400, "Indica il cliente.");
  const cliente = await clienteInstagram(admin, clienteId);
  if (!cliente) throw new HttpError(404, "Cliente non trovato.");
  if (!cliente.instagram) throw new HttpError(400, "Il cliente non ha un profilo Instagram: aggiungilo nei suoi dati.");
  const profilo: EsitoSync = await sincronizzaProfilo(admin, cliente);
  if (!profilo.ok) throw new HttpError(profilo.privato ? 422 : 502, profilo.privato ? profilo.errore : `Apify non ha letto il profilo: ${profilo.errore}`);
  const metriche = await aggiornaMetriche(admin, clienteId, true);
  return json({ ok: true, instagram: cliente.instagram, profilo, metriche });
}

Deno.serve(async (req: Request) => {
  const pre = preflight(req);
  if (pre) return pre;
  try {
    const admin = adminClient();
    if (autorizzatoCron(req)) return json({ ok: true, ...(await giroAutomatico(admin)) });
    const c = await chiamante(req);
    if (!c) throw new HttpError(401, "Non autorizzato");
    const body = await leggiBody<Body>(req);
    return esTeam(c.rol) ? await richiestaTeam(admin, body) : await richiestaCliente(admin, c.id, body);
  } catch (err) {
    return gestisciErrore(err);
  }
});
