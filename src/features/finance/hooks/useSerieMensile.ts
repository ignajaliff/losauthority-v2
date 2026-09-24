import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { sumImporti } from "@/shared/utils/formatCurrency";
import type { PuntoMensile, RigaFinanzaMensile } from "../types";
import { chiaviFinance } from "./useFinanceStats";

const MESI = 12;

/** Ultimi 12 mesi, sempre tutti presenti (a zero se la vista non ha la riga). */
export function costruisciSerie(righe: RigaFinanzaMensile[], oggi = new Date()): PuntoMensile[] {
  const perMese = new Map(righe.map((r) => [String(r.mese ?? "").slice(0, 7), r]));
  const punti: PuntoMensile[] = [];
  for (let i = MESI - 1; i >= 0; i--) {
    const d = new Date(oggi.getFullYear(), oggi.getMonth() - i, 1);
    const chiave = format(d, "yyyy-MM");
    const r = perMese.get(chiave);
    punti.push({
      mese: chiave,
      etichetta: format(d, "MMM yy", { locale: it }),
      fatturato: sumImporti([r?.fatturato]),
      incassato: sumImporti([r?.incassato]),
      spese: sumImporti([r?.spese_fisse, r?.spese_variabili]),
      f24: sumImporti([r?.f24]),
    });
  }
  return punti;
}

export function useSerieMensile() {
  return useQuery({
    queryKey: chiaviFinance.serie,
    queryFn: async (): Promise<PuntoMensile[]> => {
      const { data, error } = await supabase
        .from("vista_finanza_mensile")
        .select("*")
        .order("mese", { ascending: false })
        .limit(MESI + 1);
      if (error) throw error;
      return costruisciSerie(data);
    },
  });
}
