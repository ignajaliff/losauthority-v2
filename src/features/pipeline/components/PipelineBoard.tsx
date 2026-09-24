import { useMemo } from "react";
import { formatCurrency } from "@/shared/utils/formatCurrency";
import { sumImporti } from "@/shared/utils/formatCurrency";
import { LEAD_STAGES, type Lead, type LeadStage } from "../types";
import { LeadCard } from "./LeadCard";

interface PipelineBoardProps {
  leads: Lead[];
  onApri: (lead: Lead) => void;
  onSposta: (id: string, stage: LeadStage) => void;
}

const FAR = "9999-12-31";

/** Ordine dentro la colonna: prima le azioni in scadenza, poi chi non ha data (più recente prima). */
function ordinaColonna(a: Lead, b: Lead): number {
  const perData = (a.prossima_azione_il ?? FAR).localeCompare(b.prossima_azione_il ?? FAR);
  return perData !== 0 ? perData : b.updated_at.localeCompare(a.updated_at);
}

/** Kanban a 6 colonne, scorrevole in orizzontale su schermi stretti. */
export function PipelineBoard({ leads, onApri, onSposta }: PipelineBoardProps) {
  const perStage = useMemo(() => {
    const mappa = new Map<LeadStage, Lead[]>(LEAD_STAGES.map((s) => [s.key, []]));
    for (const lead of leads) mappa.get(lead.stage as LeadStage)?.push(lead);
    for (const lista of mappa.values()) lista.sort(ordinaColonna);
    return mappa;
  }, [leads]);

  return (
    <div className="-mx-4 overflow-x-auto px-4 pb-4 md:-mx-6 md:px-6">
      <div className="flex min-w-max gap-4">
        {LEAD_STAGES.map((stage) => {
          const lista = perStage.get(stage.key) ?? [];
          const valore = sumImporti(lista.map((l) => l.valore));
          return (
            <section
              key={stage.key}
              aria-label={`Colonna ${stage.label}`}
              className="flex w-72 shrink-0 flex-col rounded-xl bg-muted/50 ring-1 ring-foreground/10"
            >
              <header className="flex items-center justify-between gap-2 px-3 py-2.5">
                <h3 className="flex items-center gap-2 text-sm font-medium">
                  {stage.label}
                  <span className="rounded-full bg-background px-2 py-0.5 font-mono text-xs text-muted-foreground ring-1 ring-foreground/10">
                    {lista.length}
                  </span>
                </h3>
                <span className="font-mono text-xs text-muted-foreground">{valore > 0 ? formatCurrency(valore) : "—"}</span>
              </header>
              <div className="flex flex-1 flex-col gap-2 px-2 pb-2">
                {lista.length === 0 ? (
                  <p className="rounded-lg border border-dashed p-4 text-center text-xs text-muted-foreground">Nessun lead</p>
                ) : (
                  lista.map((lead) => <LeadCard key={lead.id} lead={lead} onApri={onApri} onSposta={onSposta} />)
                )}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
