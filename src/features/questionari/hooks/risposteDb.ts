import { supabase } from "@/integrations/supabase/client";
import type { TablesInsert } from "@/integrations/supabase/types";
import type { Domanda, Questionario, RigaRisposta, Risposte, ValoreRisposta } from "../types";
import { eDomandaMultipla } from "../types";
import { domandeDi } from "../registry";

/** Chiavi React Query del dominio. */
export const chiaviQuestionari = {
  invio: (clienteId: string, questionarioId: string) => ["questionari", "invio", clienteId, questionarioId] as const,
  stati: (clienteId: string) => ["questionari", "stati", clienteId] as const,
  allegati: (invioId: string) => ["questionari", "allegati", invioId] as const,
};

/**
 * Ricostruisce il Record in memoria dalle righe: più righe con `ordine` = lista.
 * Le domande di tipo lista tornano sempre come array, le altre come stringa.
 */
export function ricostruisciRisposte(
  righe: Pick<RigaRisposta, "domanda_id" | "ordine" | "valore">[],
  questionario: Questionario,
): Risposte {
  const perDomanda = new Map<string, Pick<RigaRisposta, "ordine" | "valore">[]>();
  for (const riga of righe) {
    const lista = perDomanda.get(riga.domanda_id) ?? [];
    lista.push(riga);
    perDomanda.set(riga.domanda_id, lista);
  }
  const risposte: Risposte = {};
  for (const domanda of domandeDi(questionario)) {
    const lista = perDomanda.get(domanda.id);
    if (!lista || lista.length === 0) continue;
    lista.sort((a, b) => a.ordine - b.ordine);
    risposte[domanda.id] = eDomandaMultipla(domanda.tipo)
      ? lista.map((r) => r.valore)
      : (lista[0]?.valore ?? "");
  }
  return risposte;
}

/** Righe da inserire per una domanda: stringa → ordine 0; lista → una riga per elemento non vuoto. */
function righePerDomanda(
  invioId: string,
  domanda: Domanda,
  valore: ValoreRisposta | undefined,
): TablesInsert<"questionario_risposte">[] {
  if (valore === undefined) return [];
  if (typeof valore === "string") {
    const v = valore.trim();
    return v === "" ? [] : [{ invio_id: invioId, domanda_id: domanda.id, ordine: 0, valore: v }];
  }
  return valore
    .map((v) => v.trim())
    .filter((v) => v !== "")
    .map((v, ordine) => ({ invio_id: invioId, domanda_id: domanda.id, ordine, valore: v }));
}

/**
 * Scrive le risposte delle domande indicate: per ognuna cancella le righe
 * esistenti e inserisce quelle nuove (così le liste accorciate perdono le code).
 */
export async function scriviRisposte(invioId: string, risposte: Risposte, domande: Domanda[]): Promise<void> {
  const daScrivere = domande.filter((d) => d.tipo !== "file-list");
  if (daScrivere.length === 0) return;
  const ids = daScrivere.map((d) => d.id);

  const { error: erroreDelete } = await supabase
    .from("questionario_risposte")
    .delete()
    .eq("invio_id", invioId)
    .in("domanda_id", ids);
  if (erroreDelete) throw erroreDelete;

  const righe = daScrivere.flatMap((d) => righePerDomanda(invioId, d, risposte[d.id]));
  if (righe.length === 0) return;
  const { error: erroreInsert } = await supabase.from("questionario_risposte").insert(righe);
  if (erroreInsert) throw erroreInsert;
}
