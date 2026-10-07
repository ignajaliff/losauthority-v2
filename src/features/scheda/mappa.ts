import type { Json } from "@/integrations/supabase/types";
import { risposteDaRecord } from "@onboarding/definizione.ts";
import { eDomandaLista, eDomandaMappa, eDomandaNumero } from "@onboarding/tipi.ts";
import {
  comeStatoRiga,
  eColonnaRisposta,
  type ColonnaRisposta,
  type Domanda,
  type PatchOnboarding,
  type RigaOnboarding,
  type Risposte,
  type StatoSchedaInfo,
  type ValoreRisposta,
} from "./types";

/** Chiavi React Query del dominio (tutte per cliente: la scheda è una sola). */
export const chiaviScheda = {
  tutte: (clienteId: string) => ["scheda", clienteId] as const,
  riga: (clienteId: string) => ["scheda", clienteId, "riga"] as const,
  stato: (clienteId: string) => ["scheda", clienteId, "stato"] as const,
  files: (clienteId: string) => ["scheda", clienteId, "files"] as const,
  chiarimenti: (clienteId: string) => ["scheda", clienteId, "chiarimenti"] as const,
};

/** Riga di data_onboarding → Record in memoria (liste, mappe, numeri come stringa). */
export function risposteDaRiga(riga: RigaOnboarding): Risposte {
  return risposteDaRecord(riga as unknown as Record<string, unknown>);
}

type ValoreColonna = string | number | Json | null;

/** Valore da salvare nella colonna di una domanda (vuoto → null). */
function valoreColonna(domanda: Domanda, valore: ValoreRisposta | undefined): ValoreColonna {
  if (valore === undefined) return null;
  if (typeof valore === "string") {
    const testo = valore.trim();
    if (testo === "") return null;
    if (eDomandaNumero(domanda.tipo)) {
      const n = Number(testo.replace(",", "."));
      return Number.isFinite(n) && n >= 0 ? (domanda.id === "spesa_media" ? n : Math.round(n)) : null;
    }
    return testo;
  }
  if (Array.isArray(valore)) {
    const puliti = valore.map((v) => v.trim()).filter((v) => v !== "");
    return puliti.length > 0 ? puliti : null;
  }
  const mappa: Record<string, string | number> = {};
  for (const [k, v] of Object.entries(valore)) {
    const t = v.trim();
    if (t === "") continue;
    if (domanda.tipo === "conteggi") {
      const n = Number.parseInt(t, 10);
      if (Number.isFinite(n) && n > 0) mappa[k] = n;
    } else {
      mappa[k] = t;
    }
  }
  return Object.keys(mappa).length > 0 ? mappa : null;
}

/** Patch per data_onboarding con le sole colonne delle domande indicate (una per id). */
export function patchDaRisposte(risposte: Risposte, domande: Domanda[]): PatchOnboarding {
  const patch: Partial<Record<ColonnaRisposta, ValoreColonna>> = {};
  for (const domanda of domande) {
    if (!eColonnaRisposta(domanda.id)) continue;
    patch[domanda.id] = valoreColonna(domanda, risposte[domanda.id]);
  }
  // Le colonne hanno tipi diversi (text, integer, numeric, jsonb): il Record generico
  // copre l'unione, qui si riallinea al tipo generato.
  return patch as PatchOnboarding;
}

type RigaStato = Pick<RigaOnboarding, "stato" | "inviato_il" | "sezione_indice" | "updated_at">;

/** Stato della scheda a partire dalla riga (o dalla sua assenza). */
export function statoDaRiga(riga: RigaStato | null | undefined): StatoSchedaInfo {
  if (!riga) return { stato: "mancante", fase: null, inviatoIl: null, sezioneIndice: null, aggiornatoIl: null };
  const fase = comeStatoRiga(riga.stato);
  return {
    stato: fase === "inviato" ? "inviato" : "bozza",
    fase,
    inviatoIl: riga.inviato_il,
    sezioneIndice: riga.sezione_indice,
    aggiornatoIl: riga.updated_at,
  };
}

export const ETICHETTA_STATO_SCHEDA: Record<StatoSchedaInfo["stato"], string> = {
  mancante: "Da compilare",
  bozza: "In corso",
  inviato: "Inviata",
};

export { eDomandaLista, eDomandaMappa, eDomandaNumero };
