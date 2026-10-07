import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { logDev, MESSAGGIO_ERRORE_GENERICO } from "@/shared/utils/errors";
import { todayIso } from "@/shared/utils/formatDate";
import { etichettaFonte, etichettaStato } from "../types";

const COLONNE = ["Nome", "Email", "Telefono", "Canale", "Arrivato il", "Stato", "Valore (€)", "Offerta"];

/**
 * Una cella CSV: tra virgolette se serve; le celle che iniziano con = + - @ si
 * neutralizzano, così Excel non le esegue come formule.
 */
function cella(valore: string | number | null): string {
  if (valore === null) return "";
  let testo = String(valore);
  if (/^[=+\-@\t\r]/.test(testo)) testo = `'${testo}`;
  return /[";\n\r]/.test(testo) ? `"${testo.replace(/"/g, '""')}"` : testo;
}

/** Scarica il file nel browser: i dati non passano da nessun altro servizio. */
function scarica(nome: string, contenuto: string) {
  const url = URL.createObjectURL(new Blob([contenuto], { type: "text/csv;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = nome;
  link.click();
  URL.revokeObjectURL(url);
}

/**
 * «Esporta i miei contatti»: CSV con il punto e virgola (si apre in Excel italiano).
 * Funziona sempre, anche con la sezione chiusa (`crm_esporta_contatti`).
 */
export function useEsportaContatti() {
  return useMutation({
    mutationFn: async (): Promise<number> => {
      const { data, error } = await supabase.rpc("crm_esporta_contatti");
      if (error) throw error;
      const righe = (data ?? []).map((c) =>
        [
          c.nome,
          c.email,
          c.telefono,
          etichettaFonte(c.canale) ?? c.canale,
          c.arrivato_il,
          etichettaStato(c.stato),
          c.valore === null ? null : String(c.valore).replace(".", ","),
          c.offerta,
        ]
          .map(cella)
          .join(";"),
      );
      // Il BOM fa leggere gli accenti a Excel.
      scarica(`contatti-${todayIso()}.csv`, `﻿${[COLONNE.join(";"), ...righe].join("\r\n")}\r\n`);
      return righe.length;
    },
    onSuccess: (n) => toast.success(n === 1 ? "1 contatto esportato" : `${n} contatti esportati`),
    onError: (error) => {
      toast.error("Esportazione non riuscita", { description: MESSAGGIO_ERRORE_GENERICO });
      logDev(error);
    },
  });
}
