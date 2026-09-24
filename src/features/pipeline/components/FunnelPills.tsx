import { formatCurrency } from "@/shared/utils/formatCurrency";
import { cn } from "@/lib/utils";
import { LEAD_STAGES, type LeadStage } from "../types";

export type FiltroStage = "tutti" | LeadStage;

export interface RiepilogoStage {
  count: number;
  valore: number;
}

interface FunnelPillsProps {
  totale: RiepilogoStage;
  perStage: Record<string, RiepilogoStage>;
  attivo: FiltroStage;
  onChange: (filtro: FiltroStage) => void;
}

function Pill({ label, dati, attivo, onClick }: { label: string; dati: RiepilogoStage; attivo: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={attivo}
      className={cn(
        "flex min-w-24 shrink-0 flex-col items-start gap-0.5 rounded-md border px-3.5 py-2 text-left transition-colors",
        attivo ? "border-foreground bg-muted" : "border-border bg-card hover:border-input",
      )}
    >
      <span className="flex items-baseline gap-1.5">
        <span className="text-xs font-semibold text-foreground">{label}</span>
        <span className="figure text-[13px] text-muted-foreground">{dati.count}</span>
      </span>
      <span className="figure text-[10.5px] text-muted-foreground/80">{dati.valore > 0 ? formatCurrency(dati.valore) : "—"}</span>
    </button>
  );
}

/** Imbuto: una pillola per stage con conteggio e valore; cliccandola si filtra la tabella. */
export function FunnelPills({ totale, perStage, attivo, onChange }: FunnelPillsProps) {
  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label="Filtra per stage">
      <Pill label="Tutti" dati={totale} attivo={attivo === "tutti"} onClick={() => onChange("tutti")} />
      {LEAD_STAGES.map((s) => (
        <Pill
          key={s.key}
          label={s.label}
          dati={perStage[s.key] ?? { count: 0, valore: 0 }}
          attivo={attivo === s.key}
          onClick={() => onChange(s.key)}
        />
      ))}
    </div>
  );
}
