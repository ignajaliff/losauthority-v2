/**
 * Il "materiale" del cliente per i prompt di Aura: le risposte delle 3 schede
 * lette dal DB (questionario_invii stato='inviato' + questionario_risposte;
 * multi-valore = più righe con `ordine`) e rese in testo leggibile come nel
 * sistema precedente (render() di analysis/generate.ts + format.ts):
 *   ## Titolo sezione
 *   - Domanda
 *     → risposta
 * Gli allegati non entrano mai; una scheda non inviata → "(non compilato)".
 */
import type { SupabaseClient } from "npm:@supabase/supabase-js@2";
import { type Campo, type QuestionarioId, SEZIONI } from "./domande.ts";

export interface RispostaRiga {
  domanda_id: string;
  ordine: number;
  valore: string;
}

/** Risposte di UNA scheda: id domanda → valori in ordine. null = non inviata. */
export type Scheda = Map<string, string[]> | null;

export interface Materiale {
  onboarding: Scheda;
  avatar: Scheda;
  offerta: Scheda;
}

interface Invio {
  id: string;
  questionario_id: string;
}

/** Legge le 3 schede inviate di un cliente. Lancia l'errore Postgres. */
export async function leggiMateriale(admin: SupabaseClient, clienteId: string): Promise<Materiale> {
  const { data: inviiRaw, error } = await admin
    .from("questionario_invii")
    .select("id, questionario_id")
    .eq("cliente_id", clienteId)
    .eq("stato", "inviato");
  if (error) throw error;
  const invii = (inviiRaw ?? []) as Invio[];
  if (invii.length === 0) return { onboarding: null, avatar: null, offerta: null };

  const { data: risposteRaw, error: errR } = await admin
    .from("questionario_risposte")
    .select("invio_id, domanda_id, ordine, valore")
    .in("invio_id", invii.map((i) => i.id))
    .order("ordine");
  if (errR) throw errR;
  const righe = (risposteRaw ?? []) as Array<RispostaRiga & { invio_id: string }>;

  const perScheda = (q: QuestionarioId): Scheda => {
    const invio = invii.find((i) => i.questionario_id === q);
    if (!invio) return null;
    const mappa = new Map<string, string[]>();
    for (const r of righe) {
      if (r.invio_id !== invio.id) continue;
      const lista = mappa.get(r.domanda_id) ?? [];
      lista.push(r.valore);
      mappa.set(r.domanda_id, lista);
    }
    return mappa;
  };
  return { onboarding: perScheda("onboarding"), avatar: perScheda("avatar_dolori"), offerta: perScheda("offerta") };
}

export const schedeComplete = (m: Materiale): boolean => !!m.onboarding && !!m.avatar && !!m.offerta;

/** Valore leggibile: etichette dei menu, unità dei numeri, liste unite da ", ". */
export function formattaValore(campo: Campo, valori: string[] | undefined): string {
  const puliti = (valori ?? []).map((v) => v.trim()).filter(Boolean);
  if (puliti.length === 0) return "—";
  const etichette = puliti.map((v) => campo.opzioni?.[v] ?? v);
  if (campo.tipo === "numero" && etichette.length === 1) {
    const n = Number(etichette[0].replace(",", "."));
    return Number.isFinite(n) && campo.unita ? `${n} ${campo.unita}` : etichette[0];
  }
  return etichette.join(", ") || "—";
}

/** Rende una scheda nel formato del vecchio render(): sezioni + domanda → risposta. */
export function renderScheda(q: QuestionarioId, scheda: Scheda): string {
  if (!scheda) return "(non compilato)";
  const lines: string[] = [];
  for (const s of SEZIONI[q]) {
    lines.push(`\n## ${s.titolo}`);
    for (const c of s.campi) {
      if (c.tipo === "file") continue;
      lines.push(`- ${c.label}\n  → ${formattaValore(c, scheda.get(c.id))}`);
    }
  }
  return lines.join("\n");
}

/**
 * Dossier delle 3 schede (identico a renderClientDossier del vecchio sistema),
 * riusato da genera-hub e aura-compiti per ancorare l'output ai fatti reali.
 */
export function renderDossier(m: Materiale): string {
  return (
    `=== ONBOARDING ===${renderScheda("onboarding", m.onboarding)}\n\n` +
    `=== AVATAR & DOLORI ===${renderScheda("avatar_dolori", m.avatar)}\n\n` +
    `=== OFFERTA ===${renderScheda("offerta", m.offerta)}`
  );
}

/** Nome da mostrare per un cliente (nombre, poi email, poi fallback). */
export async function nomeCliente(admin: SupabaseClient, clienteId: string, fallback = "Cliente"): Promise<string> {
  const { data } = await admin.from("user_roles").select("nombre, email").eq("id", clienteId).maybeSingle();
  const u = data as { nombre: string | null; email: string | null } | null;
  return u?.nombre || u?.email || fallback;
}
