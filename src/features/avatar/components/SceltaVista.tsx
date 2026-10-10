import { cn } from "@/lib/utils";

export type VistaMobile = "chat" | "carta";

interface SceltaVistaProps {
  vista: VistaMobile;
  onCambia: (vista: VistaMobile) => void;
  className?: string;
}

const VOCI: Array<{ valore: VistaMobile; etichetta: string }> = [
  { valore: "chat", etichetta: "Conversazione" },
  { valore: "carta", etichetta: "Carta" },
];

/**
 * Solo sul telefono (sotto md): chat e carta non stanno una sopra l'altra, si sceglie
 * quale vedere. Da md in su non si vede e le due colonne restano come sempre.
 * La usano l'avatar e l'offerta.
 */
export function SceltaVista({ vista, onCambia, className }: SceltaVistaProps) {
  return (
    <div role="group" aria-label="Cosa vedere" className={cn("grid grid-cols-2 gap-1 rounded-full border bg-muted/50 p-1 md:hidden", className)}>
      {VOCI.map((v) => {
        const attiva = vista === v.valore;
        return (
          <button
            key={v.valore}
            type="button"
            aria-pressed={attiva}
            onClick={() => onCambia(v.valore)}
            className={cn(
              "h-10 rounded-full text-sm font-medium transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
              attiva ? "bg-card text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {v.etichetta}
          </button>
        );
      })}
    </div>
  );
}
