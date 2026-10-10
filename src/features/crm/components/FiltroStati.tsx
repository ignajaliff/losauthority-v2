import { cn } from "@/lib/utils";
import { COLORE_STATO_LEAD, ETICHETTA_STATO_LEAD, STATI_LEAD, type StatoLead } from "../types";

export type FiltroStato = "tutti" | StatoLead;

interface FiltroStatiProps {
  totale: number;
  perStato: Record<StatoLead, number>;
  attivo: FiltroStato;
  onChange: (filtro: FiltroStato) => void;
}

function Pill({ etichetta, conteggio, stato, attivo, onClick }: { etichetta: string; conteggio: number; stato?: StatoLead; attivo: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={attivo}
      className={cn(
        "inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm transition-colors pointer-coarse:py-2",
        attivo ? "border-foreground bg-muted" : "border-border bg-card hover:border-input",
      )}
    >
      {stato ? <span className={cn("size-2 rounded-full", COLORE_STATO_LEAD[stato])} aria-hidden /> : null}
      <span className="font-medium">{etichetta}</span>
      <span className="figure text-[13px] text-muted-foreground">{conteggio}</span>
    </button>
  );
}

/** Una pillola per stato con il conteggio; cliccandola si filtra la tabella. */
export function FiltroStati({ totale, perStato, attivo, onChange }: FiltroStatiProps) {
  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label="Filtra per stato">
      <Pill etichetta="Tutti" conteggio={totale} attivo={attivo === "tutti"} onClick={() => onChange("tutti")} />
      {STATI_LEAD.map((s) => (
        <Pill key={s} etichetta={ETICHETTA_STATO_LEAD[s]} conteggio={perStato[s]} stato={s} attivo={attivo === s} onClick={() => onChange(s)} />
      ))}
    </div>
  );
}
