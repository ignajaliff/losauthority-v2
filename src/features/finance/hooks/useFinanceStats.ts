import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { sumImporti } from "@/shared/utils/formatCurrency";
import { todayIso } from "@/shared/utils/formatDate";
import type { FinanceStats } from "../types";

export const chiaviFinance = {
  radice: ["finance"] as const,
  stats: ["finance", "stats"] as const,
  serie: ["finance", "serie"] as const,
  f24: ["finance", "f24"] as const,
  spese: ["finance", "spese"] as const,
};

/**
 * Numeri di testa: incassato (fatture pagate), da incassare (non pagate),
 * spese del mese (variabili del mese + fisse attive), F24 da pagare.
 */
export function useFinanceStats() {
  return useQuery({
    queryKey: chiaviFinance.stats,
    queryFn: async (): Promise<FinanceStats> => {
      const [fatture, spese, f24] = await Promise.all([
        supabase.from("fatture").select("importo, pagata"),
        supabase.from("spese").select("importo, tipo, data, attiva"),
        supabase.from("f24").select("importo").eq("pagato", false),
      ]);
      if (fatture.error) throw fatture.error;
      if (spese.error) throw spese.error;
      if (f24.error) throw f24.error;

      const meseCorrente = todayIso().slice(0, 7);
      const variabiliMese = spese.data.filter((s) => s.tipo === "variabile" && s.data.startsWith(meseCorrente));
      const fisseAttive = spese.data.filter((s) => s.tipo === "fissa" && s.attiva);

      return {
        incassato: sumImporti(fatture.data.filter((f) => f.pagata).map((f) => f.importo)),
        daIncassare: sumImporti(fatture.data.filter((f) => !f.pagata).map((f) => f.importo)),
        speseMese: sumImporti([...variabiliMese, ...fisseAttive].map((s) => s.importo)),
        f24DaPagare: sumImporti(f24.data.map((f) => f.importo)),
        f24DaPagareCount: f24.data.length,
      };
    },
  });
}
