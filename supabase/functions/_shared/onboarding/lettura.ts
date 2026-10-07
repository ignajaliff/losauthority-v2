/**
 * La LETTURA dell'onboarding (compito 2 di Claude) come la vedono gli agenti
 * avatar e offerta: fotografia, valori fissi, note e chiarimenti. Solo Deno
 * (usa il client Supabase con service role).
 */
import type { SupabaseClient } from "npm:@supabase/supabase-js@2";
import { ETICHETTE_VALORI } from "./valori.ts";

export interface LetturaOnboarding {
  lettura: Record<string, unknown> | null;
  chiarimenti: Array<{ domanda: string; risposta: string | null }>;
  riepilogo_correzione: string | null;
}

export async function leggiLettura(admin: SupabaseClient, clienteId: string): Promise<LetturaOnboarding> {
  const [lettura, chiarimenti, riga] = await Promise.all([
    admin.from("onboarding_lettura").select("*").eq("id", clienteId).maybeSingle(),
    admin.from("onboarding_chiarimenti").select("domanda, risposta").eq("cliente_id", clienteId).order("ordine"),
    admin.from("data_onboarding").select("riepilogo_correzione").eq("id", clienteId).maybeSingle(),
  ]);
  return {
    lettura: (lettura.data as Record<string, unknown> | null) ?? null,
    chiarimenti: ((chiarimenti.data ?? []) as Array<{ domanda: string; risposta: string | null }>),
    riepilogo_correzione: ((riga.data as { riepilogo_correzione: string | null } | null)?.riepilogo_correzione) ?? null,
  };
}

const lista = (v: unknown): string[] => (Array.isArray(v) ? v.filter((x): x is string => typeof x === "string" && x.trim() !== "") : []);
const testo = (v: unknown): string => (typeof v === "string" && v.trim() ? v.trim() : "non dichiarato");

/** La fotografia e le note per un agente (`avatar` o `offerta`). "(non ancora letta)" se manca. */
export function renderLettura(l: LetturaOnboarding, agente: "avatar" | "offerta"): string {
  const f = l.lettura;
  if (!f) return "(l'onboarding non è ancora stato letto da Aura)";
  const righe: string[] = [];
  const etich = (campo: keyof typeof ETICHETTE_VALORI) => {
    const v = f[campo];
    const mappa = ETICHETTE_VALORI[campo] as Record<string, string>;
    return typeof v === "string" ? (mappa[v] ?? v) : "—";
  };
  righe.push(
    `Nodo centrale: ${typeof f.nodo_centrale === "string" ? f.nodo_centrale : "—"} · Fase: ${etich("fase_economica")} · Collo di bottiglia: ${etich("collo_bottiglia")} · Offerta: ${etich("chiarezza_offerta")} · ${etich("urgenza")} · ${etich("gruppo_ia")}`,
  );
  righe.push(`Snapshot: ${testo(f.snapshot)}`);
  const ovf = Array.isArray(f.opinioni_vs_fatti) ? (f.opinioni_vs_fatti as Array<Record<string, unknown>>) : [];
  if (ovf.length > 0) {
    righe.push("Opinioni vs fatti:");
    for (const o of ovf) righe.push(`- pensa: ${testo(o.il_cliente_pensa)} | i dati dicono: ${testo(o.i_dati_dicono)}`);
  }
  const forza = lista(f.punti_di_forza);
  if (forza.length) righe.push(`Punti di forza: ${forza.join(" · ")}`);
  const crit = lista(f.criticita);
  if (crit.length) righe.push(`Criticità: ${crit.join(" · ")}`);
  righe.push(`Perché questo nodo: ${testo(f.perche_nodo_centrale)}`);
  righe.push(`Priorità operativa: ${testo(f.priorita_operativa)}`);
  const val = lista(f.da_validare_in_call);
  if (val.length) righe.push(`Da validare in call: ${val.join(" · ")}`);
  const nota = agente === "avatar" ? f.note_avatar : f.note_offerta;
  righe.push(`\nNOTE PER TE (agente ${agente}): ${testo(nota)}`);
  const risposte = l.chiarimenti.filter((c) => c.risposta && c.risposta.trim());
  if (risposte.length) {
    righe.push("\nChiarimenti dati dal cliente dopo il form:");
    for (const c of risposte) righe.push(`- ${c.domanda}\n  → ${c.risposta}`);
  }
  if (l.riepilogo_correzione) righe.push(`\nCorrezione del cliente al riepilogo: ${l.riepilogo_correzione}`);
  return righe.join("\n");
}
