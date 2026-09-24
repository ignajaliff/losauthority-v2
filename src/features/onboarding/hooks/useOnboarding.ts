import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { logDev, MESSAGGIO_ERRORE_GENERICO } from "@/shared/utils/errors";
import { eQuestionarioId, getQuestionarioById, ricostruisciRisposte, statiDaInvii } from "@/features/questionari";
import type { ClienteOnboarding, InvioDettaglio, RigaListaOnboarding, StatoOnboarding } from "../types";
import { eStatoOnboarding } from "../types";

export const chiaviOnboarding = {
  lista: ["onboarding", "lista"] as const,
  cliente: (id: string) => ["onboarding", "cliente", id] as const,
};

const SELECT_LISTA =
  "id, stato_onboarding, notion_hub_url, updated_at, user_roles(nombre, email), questionario_invii(questionario_id, stato, inviato_il, sezione_indice, updated_at)";

/** Ordine: completati senza hub prima (aspettano Wesley), poi per aggiornamento più recente. */
function ordina(a: RigaListaOnboarding, b: RigaListaOnboarding): number {
  const urgenteA = a.stato === "completato" && !a.notionHubUrl ? 0 : 1;
  const urgenteB = b.stato === "completato" && !b.notionHubUrl ? 0 : 1;
  if (urgenteA !== urgenteB) return urgenteA - urgenteB;
  return b.aggiornatoIl.localeCompare(a.aggiornatoIl);
}

/** Tutti i clienti con lo stato delle 3 schede. */
export function useListaOnboarding() {
  return useQuery({
    queryKey: chiaviOnboarding.lista,
    queryFn: async (): Promise<RigaListaOnboarding[]> => {
      const { data, error } = await supabase.from("clienti").select(SELECT_LISTA);
      if (error) throw error;
      return (data ?? [])
        .map((c): RigaListaOnboarding => {
          const inviate = c.questionario_invii.filter((i) => i.stato === "inviato" && i.inviato_il);
          const ultimoInvio = inviate.map((i) => i.inviato_il ?? "").sort().at(-1) ?? null;
          return {
            id: c.id,
            nombre: c.user_roles?.nombre ?? "—",
            email: c.user_roles?.email ?? "",
            stato: eStatoOnboarding(c.stato_onboarding) ? c.stato_onboarding : "nuovo",
            notionHubUrl: c.notion_hub_url,
            aggiornatoIl: c.updated_at,
            schede: statiDaInvii(c.questionario_invii),
            ultimoInvio,
          };
        })
        .sort(ordina);
    },
  });
}

const SELECT_CLIENTE =
  "id, stato_onboarding, notion_hub_url, profilo, ore_operative, onboarding_completato_il, updated_at, user_roles(nombre, email), questionario_invii(id, questionario_id, stato, inviato_il, questionario_risposte(domanda_id, ordine, valore))";

/** Un cliente con le 3 schede e le risposte ricostruite. */
export function useClienteOnboarding(id: string | undefined) {
  return useQuery({
    queryKey: chiaviOnboarding.cliente(id ?? ""),
    enabled: !!id,
    queryFn: async (): Promise<ClienteOnboarding | null> => {
      const { data, error } = await supabase.from("clienti").select(SELECT_CLIENTE).eq("id", id ?? "").maybeSingle();
      if (error) throw error;
      if (!data) return null;
      const invii: ClienteOnboarding["invii"] = {};
      for (const invio of data.questionario_invii) {
        if (!eQuestionarioId(invio.questionario_id)) continue;
        const questionario = getQuestionarioById(invio.questionario_id);
        if (!questionario) continue;
        const dettaglio: InvioDettaglio = {
          id: invio.id,
          questionarioId: invio.questionario_id,
          stato: invio.stato,
          inviatoIl: invio.inviato_il,
          risposte: ricostruisciRisposte(invio.questionario_risposte, questionario),
        };
        invii[invio.questionario_id] = dettaglio;
      }
      const { user_roles, questionario_invii: _invii, ...cliente } = data;
      return { cliente, nombre: user_roles?.nombre ?? "—", email: user_roles?.email ?? "", invii };
    },
  });
}

/** Cambio manuale dello stato (unico posto in cui si imposta 'fuori_target'). */
export function useAggiornaStatoOnboarding(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (stato: StatoOnboarding) => {
      const { error } = await supabase.from("clienti").update({ stato_onboarding: stato }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Stato aggiornato.");
      void queryClient.invalidateQueries({ queryKey: chiaviOnboarding.lista });
      void queryClient.invalidateQueries({ queryKey: chiaviOnboarding.cliente(id) });
    },
    onError: (error) => {
      toast.error("Stato non aggiornato", { description: MESSAGGIO_ERRORE_GENERICO });
      logDev(error);
    },
  });
}
