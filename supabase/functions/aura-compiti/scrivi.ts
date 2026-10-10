/**
 * Scrittura del piano in `compiti` (service role): le tappe in coda a quelle già
 * presenti, poi i sotto-compiti di ognuna. Se qualcosa va storto a metà si
 * cancella ciò che è stato scritto per questa call, così il piano non resta a pezzi.
 */
import type { SupabaseClient } from "npm:@supabase/supabase-js@2";
import type { LezioneRef } from "./contesto.ts";

export interface SottoCompito {
  testo: string;
  lezione: LezioneRef | null;
  nota: string | null;
  /** Chiave della pagina dell'area cliente dove si fa l'azione (_shared/area/pagine.ts), o null. */
  pagina: string | null;
}

export interface TappaScritta {
  titolo: string;
  sotto: SottoCompito[];
}

export interface EsitoScrittura {
  tappe: number;
  sotto: number;
}

interface RigaTappaAura {
  id: string;
  figli: Array<{ id: string }>;
}

/**
 * Via il piano scritto da Aura per questo cliente: i suoi sotto-compiti e le sue
 * tappe. Una tappa di Aura sotto cui il team ha aggiunto sotto-compiti propri
 * RESTA (col lavoro del team) e passa al team, così la prossima rigenerazione
 * non la tocca più.
 */
export async function cancellaPianoAura(admin: SupabaseClient, clienteId: string): Promise<void> {
  const { error: eFigli } = await admin.from("compiti").delete().eq("cliente_id", clienteId).eq("origine", "aura").not("padre_id", "is", null);
  if (eFigli) throw eFigli;
  const { data, error } = await admin
    .from("compiti")
    .select("id, figli:compiti!padre_id(id)")
    .eq("cliente_id", clienteId)
    .eq("origine", "aura")
    .is("padre_id", null);
  if (error) throw error;
  const tappe = (data ?? []) as unknown as RigaTappaAura[];
  const daCancellare = tappe.filter((t) => t.figli.length === 0).map((t) => t.id);
  const daTenere = tappe.filter((t) => t.figli.length > 0).map((t) => t.id);
  if (daCancellare.length > 0) {
    const { error: eTappe } = await admin.from("compiti").delete().in("id", daCancellare);
    if (eTappe) throw eTappe;
  }
  if (daTenere.length > 0) {
    const { error: eTeam } = await admin.from("compiti").update({ origine: "team", chiamata_id: null }).in("id", daTenere);
    if (eTeam) throw eTeam;
  }
}

/** Via ciò che è stato scritto da questa call (per il rollback di una scrittura a metà). Non lancia. */
export async function cancellaPerChiamata(admin: SupabaseClient, chiamataId: string): Promise<void> {
  await admin.from("compiti").delete().eq("chiamata_id", chiamataId);
}

/** Il cliente ha già un piano scritto da Aura? */
export async function haPianoAura(admin: SupabaseClient, clienteId: string): Promise<boolean> {
  const { count, error } = await admin
    .from("compiti")
    .select("id", { count: "exact", head: true })
    .eq("cliente_id", clienteId)
    .eq("origine", "aura");
  if (error) throw error;
  return (count ?? 0) > 0;
}

/** Il link va solo se passa lo stesso check della colonna `link_skool` (https di skool.com, ≤ 500). */
const linkValido = (url: string | null | undefined): url is string =>
  typeof url === "string" && url.length <= 500 && /^https:\/\/(www\.)?skool\.com\//.test(url);

export async function scriviPiano(
  admin: SupabaseClient,
  clienteId: string,
  chiamataId: string,
  tappe: TappaScritta[],
): Promise<EsitoScrittura> {
  if (tappe.length === 0) return { tappe: 0, sotto: 0 };

  // Le tappe nuove vanno in coda alle esistenti (ordine = ultimo + 1).
  const { data: ultima, error: eUltima } = await admin
    .from("compiti")
    .select("ordine")
    .eq("cliente_id", clienteId)
    .is("padre_id", null)
    .order("ordine", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (eUltima) throw eUltima;
  const base = ((ultima as { ordine: number } | null)?.ordine ?? -1) + 1;

  const { data: inserite, error: eTappe } = await admin
    .from("compiti")
    .insert(
      tappe.map((t, i) => ({
        cliente_id: clienteId,
        testo: t.titolo,
        ordine: base + i,
        origine: "aura",
        chiamata_id: chiamataId,
      })),
    )
    .select("id, ordine");
  if (eTappe) throw eTappe;
  const idPerOrdine = new Map(((inserite ?? []) as Array<{ id: string; ordine: number }>).map((r) => [r.ordine, r.id]));

  const figli = tappe.flatMap((t, i) => {
    const padre = idPerOrdine.get(base + i);
    if (!padre) return [];
    return t.sotto.map((s, j) => {
      const link = linkValido(s.lezione?.url) ? s.lezione!.url : null;
      return {
        cliente_id: clienteId,
        padre_id: padre,
        testo: s.testo,
        ordine: j,
        origine: "aura",
        chiamata_id: chiamataId,
        link_skool: link,
        nota_skool: link && s.nota ? s.nota : null,
        pagina: s.pagina,
      };
    });
  });
  if (figli.length > 0) {
    const { error: eFigli } = await admin.from("compiti").insert(figli);
    if (eFigli) throw eFigli;
  }
  return { tappe: idPerOrdine.size, sotto: figli.length };
}
