import type { Tables, TablesUpdate } from "@/integrations/supabase/types";
import type { IdCampo } from "@onboarding/tipi.ts";

/** Riga di `data_onboarding`: una per cliente (id = id del cliente), una colonna per campo. */
export type RigaOnboarding = Tables<"data_onboarding">;
export type PatchOnboarding = TablesUpdate<"data_onboarding">;
export type FileOnboarding = Tables<"files_onboarding">;
export type RigaChiarimento = Tables<"onboarding_chiarimenti">;
export type RigaLettura = Tables<"onboarding_lettura">;

/** Colonne di data_onboarding che NON sono risposte (meta + colonne che scrive Aura). */
type ColonnaMeta =
  | "id"
  | "stato"
  | "schermata"
  | "sezione_indice"
  | "inviato_il"
  | "created_at"
  | "updated_at"
  | "parole"
  | "chiarimenti_fatti"
  | "lettura_errore"
  | "riepilogo"
  | "riepilogo_correzione"
  | "materiali_testo";
export type ColonnaRisposta = Exclude<keyof RigaOnboarding, ColonnaMeta>;

/** La sezione Materiali non ha colonna: i file vivono in files_onboarding. */
export const ID_ALLEGATI = "allegati";

/**
 * Ogni id della definizione condivisa DEVE essere una colonna (o `allegati`):
 * se Wesley aggiunge una domanda senza colonna, qui non compila.
 */
type IdSenzaColonna = Exclude<IdCampo, ColonnaRisposta | typeof ID_ALLEGATI>;
const _verificaColonne: IdSenzaColonna extends never ? true : never = true;
void _verificaColonne;

export type IdDomanda = IdCampo;

export function eColonnaRisposta(id: IdDomanda): id is Exclude<IdDomanda, typeof ID_ALLEGATI> {
  return id !== ID_ALLEGATI;
}

export type { Blocco, Condizione, Domanda, Opzione, Parole, Risposte, TipoDomanda, ValoreRisposta } from "@onboarding/tipi.ts";

/** Lo stato della riga nel giro: bozza → lettura → chiarimenti → (lettura) → riepilogo → inviato. */
export type StatoRiga = "bozza" | "lettura" | "chiarimenti" | "riepilogo" | "inviato";
export type StatoInvio = "bozza" | "inviato";
/** Stato della scheda per un cliente: non ancora aperta, in corso (qualsiasi fase) o inviata. */
export type StatoScheda = StatoInvio | "mancante";

export interface StatoSchedaInfo {
  stato: StatoScheda;
  /** La fase precisa della riga (null se mancante). */
  fase: StatoRiga | null;
  inviatoIl: string | null;
  sezioneIndice: number | null;
  aggiornatoIl: string | null;
}

export function comeStatoRiga(v: string): StatoRiga {
  return v === "lettura" || v === "chiarimenti" || v === "riepilogo" || v === "inviato" ? v : "bozza";
}
