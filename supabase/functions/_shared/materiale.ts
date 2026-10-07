/**
 * Il "materiale" del cliente per i prompt di Aura: la riga di `data_onboarding`
 * (onboarding v3, una colonna per campo) resa in testo leggibile, solo per le
 * domande del percorso del cliente:
 *   ## Titolo blocco
 *   - Domanda
 *     → risposta
 * Gli allegati entrano solo come testo estratto (`materiali_testo`); una
 * scheda non inviata → "(non compilato)".
 */
import type { SupabaseClient } from "npm:@supabase/supabase-js@2";
import { conParole, formattaValore } from "./onboarding/definizione.ts";
import { leggiRiga, renderScheda as renderRiga, type RigaOnboarding } from "./onboarding/profilo.ts";

/** La riga di data_onboarding del cliente (stato inviato). null = non inviata. */
export type Scheda = RigaOnboarding | null;

/** Legge la scheda INVIATA di un cliente (null se manca o non è ancora confermata). Lancia l'errore Postgres. */
export async function leggiMateriale(admin: SupabaseClient, clienteId: string): Promise<Scheda> {
  const { data, error } = await admin
    .from("data_onboarding")
    .select("*")
    .eq("id", clienteId)
    .eq("stato", "inviato")
    .maybeSingle();
  if (error) throw error;
  return (data as RigaOnboarding | null) ?? null;
}

/**
 * Le risposte anche in bozza (aura-help: contesto mentre il cliente compila):
 * id → valori già resi leggibili (etichette dei menu, parole del mestiere).
 */
export async function leggiRisposteAncheBozza(admin: SupabaseClient, clienteId: string): Promise<Map<string, string[]>> {
  const { data } = await admin.from("data_onboarding").select("*").eq("id", clienteId).maybeSingle();
  return data ? rigaInMappa(data as RigaOnboarding) : new Map();
}

/** Riga → mappa id → [testo leggibile], solo domande del percorso con una risposta. */
export function rigaInMappa(riga: RigaOnboarding): Map<string, string[]> {
  const s = leggiRiga(riga);
  const mappa = new Map<string, string[]>();
  for (const d of s.domande) {
    if (d.tipo === "file-list") continue;
    const testo = formattaValore(d, s.risposte[d.id], s.parole);
    if (testo !== "—") mappa.set(d.id, [testo]);
  }
  return mappa;
}

/** Il testo di una domanda con le parole del mestiere del cliente (per aura-help). */
export function testoDomandaPerCliente(riga: RigaOnboarding | null, testo: string): string {
  return conParole(testo, leggiRiga(riga ?? {}).parole);
}

/** Rende la scheda nel formato "- Domanda → risposta", blocco per blocco. */
export function renderScheda(scheda: Scheda): string {
  return renderRiga(scheda);
}

/** Dossier del cliente (riusato da genera-hub e aura-compiti per ancorare l'output ai fatti reali). */
export function renderDossier(scheda: Scheda): string {
  return `=== ONBOARDING ===${renderScheda(scheda)}`;
}

/** Nome da mostrare per un cliente (nombre, poi email, poi fallback). */
export async function nomeCliente(admin: SupabaseClient, clienteId: string, fallback = "Cliente"): Promise<string> {
  const { data } = await admin.from("user_roles").select("nombre, email").eq("id", clienteId).maybeSingle();
  const u = data as { nombre: string | null; email: string | null } | null;
  return u?.nombre || u?.email || fallback;
}
