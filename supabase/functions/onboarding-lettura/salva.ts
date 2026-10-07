/**
 * Dalla risposta del modello alle righe: `onboarding_lettura` (per Wesley),
 * `onboarding_chiarimenti` (per il cliente) e lo stato di `data_onboarding`.
 * Tutto normalizzato: fuori lista → null, liste tagliate, mai un valore
 * inventato in DB.
 */
import type { SupabaseClient } from "npm:@supabase/supabase-js@2";
import { ID_CAMPI } from "../_shared/onboarding/tipi.ts";
import { normalizzaValoriFissi, type ValoriFissi } from "../_shared/onboarding/valori.ts";

export interface DomandaChiarimento {
  domanda: string;
  campo: string;
  perche_serve: string;
}

export interface OpinioneVsFatto {
  il_cliente_pensa: string;
  i_dati_dicono: string;
  campi: string[];
}

export interface Lettura {
  valori: ValoriFissi;
  snapshot: string | null;
  opinioni_vs_fatti: OpinioneVsFatto[];
  punti_di_forza: string[];
  criticita: string[];
  perche_nodo_centrale: string | null;
  priorita_operativa: string | null;
  da_validare_in_call: string[];
  domande: DomandaChiarimento[];
  riepilogo: string | null;
  note_avatar: string | null;
  note_offerta: string | null;
}

const testo = (v: unknown, max = 4000): string | null => (typeof v === "string" && v.trim() ? v.trim().slice(0, max) : null);
const lista = (v: unknown, max = 12): string[] => (Array.isArray(v) ? v.filter((x): x is string => typeof x === "string" && x.trim() !== "").map((x) => x.trim().slice(0, 600)).slice(0, max) : []);
const oggetto = (v: unknown): Record<string, unknown> => (v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : {});

/** Risposta grezza del modello → lettura normalizzata. null se manca il minimo (snapshot o riepilogo). */
export function normalizzaLettura(grezzo: unknown): Lettura | null {
  const o = oggetto(grezzo);
  const f = oggetto(o.fotografia);
  const note = oggetto(o.note_per_agenti);
  const ovf = Array.isArray(f.opinioni_vs_fatti)
    ? f.opinioni_vs_fatti
        .map((x) => oggetto(x))
        .map((x) => ({ il_cliente_pensa: testo(x.il_cliente_pensa, 600) ?? "", i_dati_dicono: testo(x.i_dati_dicono, 600) ?? "", campi: lista(x.campi, 6) }))
        .filter((x) => x.il_cliente_pensa || x.i_dati_dicono)
        .slice(0, 8)
    : [];
  const campiValidi = new Set<string>(ID_CAMPI);
  const domande = Array.isArray(o.domande_chiarimento)
    ? o.domande_chiarimento
        .map((x) => oggetto(x))
        .map((x) => ({ domanda: testo(x.domanda, 600) ?? "", campo: testo(x.campo, 60) ?? "", perche_serve: testo(x.perche_serve, 600) ?? "" }))
        .filter((x) => x.domanda)
        .map((x) => ({ ...x, campo: campiValidi.has(x.campo) ? x.campo : "altro" }))
        .slice(0, 3)
    : [];
  const lettura: Lettura = {
    valori: normalizzaValoriFissi(o.valori_fissi),
    snapshot: testo(f.snapshot),
    opinioni_vs_fatti: ovf,
    punti_di_forza: lista(f.punti_di_forza),
    criticita: lista(f.criticita),
    perche_nodo_centrale: testo(f.perche_nodo_centrale),
    priorita_operativa: testo(f.priorita_operativa),
    da_validare_in_call: lista(f.da_validare_in_call),
    domande,
    riepilogo: testo(o.riepilogo_cliente),
    note_avatar: testo(note.avatar),
    note_offerta: testo(note.offerta),
  };
  if (!lettura.snapshot && !lettura.riepilogo) return null;
  return lettura;
}

export interface RigaChiarimento {
  id: string;
  ordine: number;
  domanda: string;
  campo: string;
  risposta: string | null;
}

/**
 * Scrive lettura e chiarimenti e porta la riga allo stato giusto:
 * - prima lettura con domande → `chiarimenti` (righe nuove, le vecchie spariscono);
 * - altrimenti → `riepilogo` (chiarimenti_fatti = true).
 */
export async function salvaLettura(
  admin: SupabaseClient,
  clienteId: string,
  l: Lettura,
  opz: { giro: 1 | 2; modello: string; chiarimentiFatti: boolean; materialiTesto: string | null },
): Promise<{ stato: "chiarimenti" | "riepilogo"; chiarimenti: RigaChiarimento[] }> {
  const faDomande = !opz.chiarimentiFatti && l.domande.length > 0;
  const { error: errLettura } = await admin.from("onboarding_lettura").upsert(
    {
      id: clienteId,
      giro: opz.giro,
      modello: opz.modello,
      ...l.valori,
      snapshot: l.snapshot,
      opinioni_vs_fatti: l.opinioni_vs_fatti,
      punti_di_forza: l.punti_di_forza,
      criticita: l.criticita,
      perche_nodo_centrale: l.perche_nodo_centrale,
      priorita_operativa: l.priorita_operativa,
      da_validare_in_call: l.da_validare_in_call,
      domande_chiarimento: l.domande,
      note_avatar: l.note_avatar,
      note_offerta: l.note_offerta,
    },
    { onConflict: "id" },
  );
  if (errLettura) throw errLettura;

  let chiarimenti: RigaChiarimento[] = [];
  if (faDomande) {
    await admin.from("onboarding_chiarimenti").delete().eq("cliente_id", clienteId);
    const { data, error } = await admin
      .from("onboarding_chiarimenti")
      .insert(l.domande.map((d, i) => ({ cliente_id: clienteId, ordine: i + 1, domanda: d.domanda, campo: d.campo })))
      .select("id, ordine, domanda, campo, risposta");
    if (error) throw error;
    chiarimenti = (data ?? []) as RigaChiarimento[];
  } else {
    const { data } = await admin.from("onboarding_chiarimenti").select("id, ordine, domanda, campo, risposta").eq("cliente_id", clienteId).order("ordine");
    chiarimenti = (data ?? []) as RigaChiarimento[];
  }

  const stato = faDomande ? "chiarimenti" : "riepilogo";
  const { error: errRiga } = await admin
    .from("data_onboarding")
    .update({
      stato,
      chiarimenti_fatti: !faDomande,
      riepilogo: l.riepilogo,
      lettura_errore: null,
      materiali_testo: opz.materialiTesto,
    })
    .eq("id", clienteId);
  if (errRiga) throw errRiga;
  return { stato, chiarimenti };
}
