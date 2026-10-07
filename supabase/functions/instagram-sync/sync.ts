/**
 * Le due operazioni della sincronizzazione Instagram:
 *  - profilo: legge gli ultimi post del profilo, crea le carte dei video che
 *    mancano (al primo giro al massimo VIDEO_INIZIALI, poi tutti i nuovi),
 *    registra una rilevazione per ognuno e i follower del profilo;
 *  - metriche: per le carte Instagram ferme da ≥ 15 giorni rilegge i post
 *    per URL (una sola run Apify per cliente) e aggiunge una rilevazione.
 */
import type { SupabaseClient } from "npm:@supabase/supabase-js@2";
import { logError } from "../_shared/log.ts";
import { handleInstagram } from "../_shared/instagram.ts";
import { leggiDettagli, leggiPost, leggiProfilo, type PostInstagram, type ProfiloInstagram } from "./apify.ts";

/** Carte create al primo giro di un cliente. */
export const VIDEO_INIZIALI = 5;
/** Post letti dal profilo (post e reel insieme): da qui si prendono i video. */
const POST_LETTI = 12;
/** Massimo di post per una run "metriche" di un cliente. */
const POST_PER_RUN = 10;
export const GIORNI_METRICHE = 15;
export const GIORNI_PROFILO = 30;

export interface ClienteInstagram {
  id: string;
  instagram: string;
  instagram_sync_il: string | null;
  instagram_sync_errore: string | null;
}

/** Colonne di `clienti` lette dalla sincronizzazione. */
export const COLONNE_CLIENTE = "id, instagram, instagram_sync_il, instagram_sync_errore";

interface CartaInstagram {
  id: string;
  codice_esterno: string;
  url: string;
}

export type EsitoSync =
  | { ok: true; nuove: number; rilevazioni: number; follower?: number | null }
  | { ok: false; errore: string; privato?: boolean };

/** Detto al cliente (e salvato in `instagram_sync_errore`) quando il profilo non è pubblico. */
export const MSG_PRIVATO = "Il profilo Instagram è privato: rendilo pubblico (o passa a un account professionale) e poi rileggilo.";

const giorniFa = (n: number) => new Date(Date.now() - n * 86_400_000).toISOString();

function rilevazione(p: PostInstagram, pubblicazioneId: string, adesso: string) {
  return {
    pubblicazione_id: pubblicazioneId,
    piattaforma: "instagram",
    rilevata_il: adesso,
    visualizzazioni: p.visualizzazioni,
    mi_piace: p.miPiace,
    commenti: p.commenti,
    origine: "instagram",
  };
}

/** Rilevazioni per i post letti e `sincronizzata_il` sulle carte. Salta i post senza nemmeno un numero. */
async function registraNumeri(admin: SupabaseClient, carte: Map<string, string>, post: PostInstagram[], adesso: string): Promise<number> {
  const righe = post
    .filter((p) => carte.has(p.codice) && (p.visualizzazioni ?? p.miPiace ?? p.commenti) !== null)
    .map((p) => rilevazione(p, carte.get(p.codice) as string, adesso));
  if (righe.length === 0) return 0;
  const { error } = await admin.from("pubblicazioni_metriche").insert(righe);
  if (error) throw error;
  const ids = righe.map((r) => r.pubblicazione_id);
  const { error: e2 } = await admin.from("pubblicazioni").update({ sincronizzata_il: adesso }).in("id", ids);
  if (e2) throw e2;
  return righe.length;
}

async function segnaCliente(admin: SupabaseClient, clienteId: string, errore: string | null, letto: boolean): Promise<void> {
  const patch: Record<string, unknown> = { instagram_sync_errore: errore };
  if (letto) patch.instagram_sync_il = new Date().toISOString();
  await admin.from("clienti").update(patch).eq("id", clienteId);
}

/** Follower del profilo in questa lettura (una riga per lettura, come le rilevazioni dei video). */
async function registraFollower(admin: SupabaseClient, cliente: ClienteInstagram, p: ProfiloInstagram, adesso: string): Promise<void> {
  const { error } = await admin.from("follower_rilevazioni").insert({
    cliente_id: cliente.id,
    piattaforma: "instagram",
    profilo: handleInstagram(cliente.instagram)?.toLowerCase() ?? null,
    rilevata_il: adesso,
    follower: p.follower,
    seguiti: p.seguiti,
    post_totali: p.postTotali,
    origine: "instagram",
  });
  if (error) throw error;
}

/**
 * Legge il profilo e allinea le carte; nella stessa lettura registra i follower
 * (run "details" in parallelo, un risultato in più). `instagram_sync_il` si
 * aggiorna solo se Apify ha restituito i post. Se mancano solo i follower la
 * lettura vale comunque: si logga e i follower arrivano alla prossima.
 */
export async function sincronizzaProfilo(admin: SupabaseClient, cliente: ClienteInstagram): Promise<EsitoSync> {
  const [esito, dettagli] = await Promise.all([leggiProfilo(cliente.instagram, POST_LETTI), leggiDettagli(cliente.instagram)]);
  if (dettagli.ok && dettagli.profilo.privato) {
    // Conta come lettura: il cron riprova tra 30 giorni invece di ogni mattina; il cliente può rileggere subito.
    await segnaCliente(admin, cliente.id, MSG_PRIVATO, true);
    return { ok: false, errore: MSG_PRIVATO, privato: true };
  }
  if (!esito.ok) {
    await segnaCliente(admin, cliente.id, esito.dettaglio.slice(0, 500), false);
    await logError("instagram-sync:profilo", esito.dettaglio, { cliente: cliente.id }, { silent: true });
    return { ok: false, errore: esito.dettaglio };
  }
  if (!dettagli.ok) await logError("instagram-sync:follower", dettagli.dettaglio, { cliente: cliente.id }, { silent: true });
  try {
    const { data: esistentiRaw, error } = await admin
      .from("pubblicazioni")
      .select("id, codice_esterno")
      .eq("cliente_id", cliente.id)
      .eq("origine", "instagram");
    if (error) throw error;
    const carte = new Map<string, string>();
    for (const r of (esistentiRaw ?? []) as { id: string; codice_esterno: string | null }[]) {
      if (r.codice_esterno) carte.set(r.codice_esterno, r.id);
    }
    const primoGiro = carte.size === 0;
    // Solo video, senza i fissati, dal più recente per data di pubblicazione.
    const video = esito.post
      .filter((p) => p.eVideo && !p.fissato)
      .sort((a, b) => (b.pubblicataIl ?? "").localeCompare(a.pubblicataIl ?? ""));
    // Al primo giro i primi N, dopo tutti quelli che mancano.
    const nuovi = video.filter((p) => !carte.has(p.codice)).slice(0, primoGiro ? VIDEO_INIZIALI : POST_LETTI);
    const adesso = new Date().toISOString();
    if (nuovi.length > 0) {
      const { data: create, error: e2 } = await admin
        .from("pubblicazioni")
        .insert(
          nuovi.map((p) => ({
            cliente_id: cliente.id,
            titolo: p.titolo,
            piattaforme: ["instagram"],
            pubblicata_il: p.pubblicataIl,
            origine: "instagram",
            url: p.url,
            codice_esterno: p.codice,
          })),
        )
        .select("id, codice_esterno");
      if (e2) throw e2;
      for (const r of (create ?? []) as { id: string; codice_esterno: string }[]) carte.set(r.codice_esterno, r.id);
    }
    // Numeri per tutte le carte presenti nella lettura (nuove e già note).
    const rilevazioni = await registraNumeri(admin, carte, video, adesso);
    const follower = dettagli.ok ? dettagli.profilo.follower : null;
    if (dettagli.ok) await registraFollower(admin, cliente, dettagli.profilo, adesso);
    await segnaCliente(admin, cliente.id, null, true);
    return { ok: true, nuove: nuovi.length, rilevazioni, follower };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    await segnaCliente(admin, cliente.id, msg.slice(0, 500), false);
    await logError("instagram-sync:salva", err, { cliente: cliente.id }, { silent: true });
    return { ok: false, errore: msg };
  }
}

/** Le carte Instagram del cliente ferme da ≥ GIORNI_METRICHE (o mai lette). */
async function carteDaAggiornare(admin: SupabaseClient, clienteId: string, forza: boolean): Promise<CartaInstagram[]> {
  let q = admin
    .from("pubblicazioni")
    .select("id, codice_esterno, url")
    .eq("cliente_id", clienteId)
    .eq("origine", "instagram")
    .not("url", "is", null)
    .order("pubblicata_il", { ascending: false, nullsFirst: false })
    .limit(POST_PER_RUN);
  if (!forza) q = q.or(`sincronizzata_il.is.null,sincronizzata_il.lt.${giorniFa(GIORNI_METRICHE)}`);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as CartaInstagram[];
}

/** Rilegge per URL le carte scadute del cliente e aggiunge una rilevazione a ciascuna. */
export async function aggiornaMetriche(admin: SupabaseClient, clienteId: string, forza = false): Promise<EsitoSync> {
  let carte: CartaInstagram[];
  try {
    carte = await carteDaAggiornare(admin, clienteId, forza);
  } catch (err) {
    return { ok: false, errore: err instanceof Error ? err.message : String(err) };
  }
  if (carte.length === 0) return { ok: true, nuove: 0, rilevazioni: 0 };
  const esito = await leggiPost(carte.map((c) => c.url));
  if (!esito.ok) {
    await logError("instagram-sync:metriche", esito.dettaglio, { cliente: clienteId }, { silent: true });
    return { ok: false, errore: esito.dettaglio };
  }
  try {
    const adesso = new Date().toISOString();
    const mappa = new Map(carte.map((c) => [c.codice_esterno, c.id]));
    const rilevazioni = await registraNumeri(admin, mappa, esito.post, adesso);
    // Anche i post che Apify non ha restituito (cancellati o nascosti) contano come tentati:
    // si riprovano tra 15 giorni, non ogni mattina.
    const { error } = await admin.from("pubblicazioni").update({ sincronizzata_il: adesso }).in("id", carte.map((c) => c.id));
    if (error) throw error;
    return { ok: true, nuove: 0, rilevazioni };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    await logError("instagram-sync:metriche-salva", err, { cliente: clienteId }, { silent: true });
    return { ok: false, errore: msg };
  }
}

/**
 * Solo i follower (run "details", un risultato): per i clienti che non hanno una
 * lettura dei follower negli ultimi 30 giorni anche se il profilo è stato letto
 * (collegati prima della migrazione 32, o run "details" fallita).
 */
export async function aggiornaFollower(admin: SupabaseClient, cliente: ClienteInstagram): Promise<EsitoSync> {
  const dettagli = await leggiDettagli(cliente.instagram);
  if (!dettagli.ok) {
    await logError("instagram-sync:follower", dettagli.dettaglio, { cliente: cliente.id }, { silent: true });
    return { ok: false, errore: dettagli.dettaglio };
  }
  if (dettagli.profilo.privato) {
    await segnaCliente(admin, cliente.id, MSG_PRIVATO, true);
    return { ok: false, errore: MSG_PRIVATO, privato: true };
  }
  try {
    await registraFollower(admin, cliente, dettagli.profilo, new Date().toISOString());
    return { ok: true, nuove: 0, rilevazioni: 0, follower: dettagli.profilo.follower };
  } catch (err) {
    await logError("instagram-sync:follower-salva", err, { cliente: cliente.id }, { silent: true });
    return { ok: false, errore: err instanceof Error ? err.message : String(err) };
  }
}

/** Gli id dei clienti senza una lettura dei follower del profilo attuale negli ultimi GIORNI_PROFILO giorni. */
export async function senzaFollowerRecenti(admin: SupabaseClient, clienti: ClienteInstagram[]): Promise<Set<string>> {
  if (clienti.length === 0) return new Set();
  const { data, error } = await admin
    .from("follower_rilevazioni")
    .select("cliente_id, profilo")
    .in("cliente_id", clienti.map((c) => c.id))
    .gte("rilevata_il", giorniFa(GIORNI_PROFILO));
  if (error) throw error;
  const handle = new Map(clienti.map((c) => [c.id, handleInstagram(c.instagram)?.toLowerCase() ?? null]));
  const coperti = new Set(
    ((data ?? []) as { cliente_id: string; profilo: string | null }[])
      .filter((r) => r.profilo === null || r.profilo === handle.get(r.cliente_id))
      .map((r) => r.cliente_id),
  );
  return new Set(clienti.filter((c) => !coperti.has(c.id)).map((c) => c.id));
}

/** Clienti con un profilo Instagram e scheda completata; quelli con l'ultima lettura fallita in fondo. */
export async function clientiConInstagram(admin: SupabaseClient): Promise<ClienteInstagram[]> {
  const { data, error } = await admin
    .from("clienti")
    .select(COLONNE_CLIENTE)
    .not("instagram", "is", null)
    .in("stato_onboarding", ["completato", "hub_creato"])
    .order("instagram_sync_il", { ascending: true, nullsFirst: true });
  if (error) throw error;
  // Un profilo che fallisce ogni giorno non deve togliere il posto agli altri (ordinamento stabile).
  return ((data ?? []) as ClienteInstagram[]).sort((x, y) => Number(!!x.instagram_sync_errore) - Number(!!y.instagram_sync_errore));
}

/** Il profilo va riletto se non è mai stato letto o se sono passati ≥ GIORNI_PROFILO. */
export function profiloScaduto(c: ClienteInstagram): boolean {
  return !c.instagram_sync_il || c.instagram_sync_il < giorniFa(GIORNI_PROFILO);
}
