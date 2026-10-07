import { cn } from "@/lib/utils";
import { COLORE_STATO_CONTENUTO, ETICHETTA_STATO_CONTENUTO, eStatoContenuto } from "../types";

/** Pallino colorato della fase (grigio = idea … salvia = pubblicato). */
export function PuntoStato({ stato, className }: { stato: string; className?: string }) {
  if (!eStatoContenuto(stato)) return null;
  return (
    <span
      aria-label={ETICHETTA_STATO_CONTENUTO[stato]}
      title={ETICHETTA_STATO_CONTENUTO[stato]}
      className={cn("inline-block size-2 shrink-0 rounded-full", COLORE_STATO_CONTENUTO[stato].punto, className)}
    />
  );
}
