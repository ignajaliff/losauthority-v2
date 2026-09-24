import type { SupabaseClient } from "npm:@supabase/supabase-js@2";

/**
 * Accesso a `chiamate` / `chiamate_azioni` / clienti per email.
 * Usato da fathom-webhook, fathom-autoassign, fathom-riassunto. Le funzioni LANCIANO
 * l'errore Postgres: il chiamante decide se loggarlo o rispondere.
 */

export interface ClienteEmail {
  id: string;
  email: string;
  nombre: string;
}

/** Mappa email (lower) → cliente, per tutti gli utenti con rol 'cliente'. */
export async function clientiPerEmail(admin: SupabaseClient): Promise<Map<string, ClienteEmail>> {
  const { data, error } = await admin.from("user_roles").select("id, email, nombre").eq("rol", "cliente");
  if (error) throw error;
  const mappa = new Map<string, ClienteEmail>();
  for (const r of (data ?? []) as ClienteEmail[]) {
    const email = (r.email ?? "").trim().toLowerCase();
    if (email) mappa.set(email, { id: r.id, email, nombre: r.nombre || email });
  }
  return mappa;
}

/** Primo indirizzo della lista che corrisponde a un cliente. */
export function abbinaCliente(mappa: Map<string, ClienteEmail>, emails: string[]): ClienteEmail | null {
  for (const e of emails) {
    const c = mappa.get(e.trim().toLowerCase());
    if (c) return c;
  }
  return null;
}

export interface DatiChiamata {
  fathom_recording_id: string;
  cliente_id: string | null;
  titolo: string | null;
  registrata_il: string | null;
  share_url: string | null;
  riassunto_originale: string | null;
  riassunto: string | null;
}

export interface EsitoUpsert {
  id: string;
  cliente_id: string | null;
  nuova: boolean;
}

interface RigaChiamata {
  id: string;
  cliente_id: string | null;
}

/**
 * Upsert per fathom_recording_id. Se la chiamata esiste già: non azzera mai un cliente
 * assegnato (a mano o prima), non cancella un riassunto esistente con uno vuoto.
 */
export async function upsertChiamata(
  admin: SupabaseClient,
  dati: DatiChiamata,
  secondoTentativo = false,
): Promise<EsitoUpsert> {
  const { data: esistente, error: eSel } = await admin
    .from("chiamate")
    .select("id, cliente_id")
    .eq("fathom_recording_id", dati.fathom_recording_id)
    .maybeSingle();
  if (eSel) throw eSel;

  if (!esistente) {
    const { data, error } = await admin.from("chiamate").insert(dati).select("id, cliente_id").single();
    if (error) {
      // Gara webhook/cron sulla stessa recording: la riga è appena nata, aggiorniamola.
      if (error.code === "23505" && !secondoTentativo) return upsertChiamata(admin, dati, true);
      throw error;
    }
    const riga = data as RigaChiamata;
    return { id: riga.id, cliente_id: riga.cliente_id, nuova: true };
  }

  const riga = esistente as RigaChiamata;
  const patch: Partial<DatiChiamata> = {};
  if (dati.cliente_id && !riga.cliente_id) patch.cliente_id = dati.cliente_id;
  if (dati.titolo) patch.titolo = dati.titolo;
  if (dati.registrata_il) patch.registrata_il = dati.registrata_il;
  if (dati.share_url) patch.share_url = dati.share_url;
  if (dati.riassunto_originale) patch.riassunto_originale = dati.riassunto_originale;
  if (dati.riassunto) patch.riassunto = dati.riassunto;
  if (Object.keys(patch).length > 0) {
    const { error } = await admin.from("chiamate").update(patch).eq("id", riga.id);
    if (error) throw error;
  }
  return { id: riga.id, cliente_id: patch.cliente_id ?? riga.cliente_id, nuova: false };
}

/**
 * Scrive le azioni di una chiamata (ordine = posizione) SOLO se non ne ha ancora:
 * non sovrascrive mai le spunte "completata" del cliente. Ritorna quante ne ha scritte.
 */
export async function scriviAzioni(admin: SupabaseClient, chiamataId: string, azioni: string[]): Promise<number> {
  if (azioni.length === 0) return 0;
  const { count, error } = await admin
    .from("chiamate_azioni")
    .select("id", { count: "exact", head: true })
    .eq("chiamata_id", chiamataId);
  if (error) throw error;
  if ((count ?? 0) > 0) return 0;
  const righe = azioni.map((testo, i) => ({ chiamata_id: chiamataId, testo: testo.slice(0, 2000), ordine: i }));
  const { error: eIns } = await admin.from("chiamate_azioni").insert(righe);
  if (eIns) throw eIns;
  return righe.length;
}
