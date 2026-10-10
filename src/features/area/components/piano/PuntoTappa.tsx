import { avanzamento, eFatto, type Tappa } from "@/features/clienti";
import { cn } from "@/lib/utils";

interface PuntoTappaProps {
  tappa: Tappa;
  numero: number;
  /** Posizione rispetto alla tappa al centro: 0 = è lei, ±1 i vicini (sfocati), oltre = degradati. */
  distanza: number;
  ultimo: boolean;
  onScegli: () => void;
}

/**
 * Un punto della linea del tempo: grigio finché la tappa non è fatta, verde
 * con l'alone sfocato quando lo è; la tappa al centro è il tema principale.
 * Larghezza fissa `--slot` (la imposta il binario) così la riga si sposta di
 * uno slot per tappa.
 */
export function PuntoTappa({ tappa, numero, distanza, ultimo, onScegli }: PuntoTappaProps) {
  const fatta = eFatto(tappa);
  const corrente = distanza === 0;
  const lontananza = Math.abs(distanza);
  const { fatti, totale } = avanzamento(tappa);

  return (
    <div
      className={cn(
        "marmo-tappe-punto relative flex w-(--slot) shrink-0 flex-col items-center pt-6 transition-[opacity,filter] duration-500",
        lontananza === 1 && "opacity-60 blur-[1.5px]",
        lontananza >= 2 && "opacity-30 blur-[2px]",
      )}
    >
      {!ultimo ? <span aria-hidden className={cn("absolute top-8 left-1/2 h-px w-full", fatta ? "bg-status-active/70" : "bg-border")} /> : null}

      <button
        type="button"
        onClick={onScegli}
        aria-label={`Tappa ${numero}: ${tappa.testo}`}
        aria-current={corrente ? "step" : undefined}
        // Sul touch la zona da toccare è 44px, ma i margini negativi la riportano a 16: il disegno non si sposta.
        className="relative grid size-4 place-items-center rounded-full outline-none focus-visible:ring-3 focus-visible:ring-ring/50 pointer-coarse:-m-3.5 pointer-coarse:size-11"
      >
        {fatta ? (
          <span aria-hidden className="absolute top-1/2 left-1/2 size-8 -translate-x-1/2 -translate-y-1/2 rounded-full bg-status-active/45 blur-md" />
        ) : null}
        <span
          aria-hidden
          className={cn(
            "relative block rounded-full transition-transform duration-300",
            fatta ? "size-3.5 bg-status-active" : corrente ? "size-4 bg-foreground shadow-sm ring-4 ring-background" : "size-3 bg-muted-foreground/35",
            corrente && "scale-110",
          )}
        />
      </button>

      <span className={cn("eyebrow mt-3 text-[10px]", corrente ? "text-foreground" : "text-muted-foreground")}>Tappa {numero}</span>
      <span className={cn("mt-1 line-clamp-2 px-2 text-center text-xs leading-snug", corrente ? "font-medium" : "text-muted-foreground")}>{tappa.testo}</span>
      {corrente && !fatta ? (
        <span className="figure mt-1 text-[11px] text-muted-foreground">
          {fatti}/{totale}
        </span>
      ) : null}
    </div>
  );
}
