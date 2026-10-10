/**
 * Quello che Aura ha a disposizione per scrivere il piano: SOLO la call di
 * Fathom (trascrizione, riassunto, action item) e il catalogo delle lezioni
 * Skool, che non parla del cliente ma serve ad agganciare la lezione giusta a
 * ogni sotto-compito. Decisione dell'utente (09/10/2026): niente scheda
 * onboarding, fotografia, analisi, avatar od offerta nel prompt — il piano è
 * ciò che è stato deciso in call, non una sintesi di tutto il profilo.
 */
import type { SupabaseClient } from "npm:@supabase/supabase-js@2";
import { nomeCliente } from "../_shared/materiale.ts";

export interface LezioneRef {
  titolo: string;
  corso: string | null;
  url: string | null;
  descrizione: string | null;
}

export interface ContestoCliente {
  clienteId: string;
  /** Solo per il messaggio Telegram e i consumi: non entra nel prompt. */
  nome: string;
  lezioni: LezioneRef[];
}

/** Catalogo numerato per il prompt: Aura cita l'indice, l'URL lo mettiamo noi (mai inventato). */
export function catalogoInTesto(lezioni: LezioneRef[]): string {
  return lezioni
    .map((l, i) => {
      const desc = (l.descrizione ?? "").replace(/\s+/g, " ").trim();
      return `${i + 1}. ${l.corso ? `[${l.corso}] ` : ""}${l.titolo}${desc ? ` — ${desc.slice(0, 140)}` : ""}`;
    })
    .join("\n");
}

async function lezioniAttive(admin: SupabaseClient): Promise<LezioneRef[]> {
  const { data, error } = await admin
    .from("lezioni")
    .select("titolo, corso, url, descrizione")
    .eq("attiva", true)
    .order("corso", { ascending: true, nullsFirst: false })
    .order("ordine", { ascending: true })
    .limit(200);
  if (error) throw error;
  return (data ?? []) as LezioneRef[];
}

/** Nome (per Telegram) e catalogo lezioni; un catalogo non leggibile non blocca il piano. */
export async function leggiContesto(admin: SupabaseClient, clienteId: string): Promise<ContestoCliente> {
  const [nome, lezioni] = await Promise.all([
    nomeCliente(admin, clienteId, "il cliente"),
    lezioniAttive(admin).catch(() => [] as LezioneRef[]),
  ]);
  return { clienteId, nome, lezioni };
}
