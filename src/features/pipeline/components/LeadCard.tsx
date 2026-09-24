import { CalendarClock } from "lucide-react";
import { Badge } from "@/shared/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";
import { formatCurrency } from "@/shared/utils/formatCurrency";
import { formatDate, todayIso } from "@/shared/utils/formatDate";
import { cn } from "@/lib/utils";
import { eLeadStage, eStageAperto, LEAD_STAGES, type Lead, type LeadStage } from "../types";

const STAGE_ITEMS: Record<string, string> = Object.fromEntries(LEAD_STAGES.map((s) => [s.key, s.label]));

interface LeadCardProps {
  lead: Lead;
  onApri: (lead: Lead) => void;
  onSposta: (id: string, stage: LeadStage) => void;
}

/** Card di un lead nella colonna del kanban. Click → dettaglio; select → cambio stage. */
export function LeadCard({ lead, onApri, onSposta }: LeadCardProps) {
  const scaduta =
    !!lead.prossima_azione_il && lead.prossima_azione_il < todayIso() && eStageAperto(lead.stage);

  return (
    <article
      onClick={() => onApri(lead)}
      className="flex cursor-pointer flex-col gap-2 rounded-lg border bg-card p-3 text-sm shadow-xs transition-colors hover:bg-muted/40"
    >
      <div className="flex items-start justify-between gap-2">
        <button
          type="button"
          className="min-w-0 text-left font-medium leading-snug hover:underline"
          aria-label={`Apri il lead ${lead.nome}`}
        >
          <span className="line-clamp-2 break-words">{lead.nome}</span>
        </button>
        {lead.valore > 0 ? (
          <span className="shrink-0 font-mono text-xs text-muted-foreground">{formatCurrency(lead.valore)}</span>
        ) : null}
      </div>

      {lead.contatto ? <p className="truncate text-xs text-muted-foreground">{lead.contatto}</p> : null}

      {lead.fonte ? (
        <Badge variant="outline" className="w-fit">
          {lead.fonte}
        </Badge>
      ) : null}

      {lead.prossima_azione || lead.prossima_azione_il ? (
        <p className={cn("flex items-start gap-1.5 text-xs", scaduta ? "text-destructive" : "text-muted-foreground")}>
          <CalendarClock className="mt-0.5 size-3.5 shrink-0" aria-hidden />
          <span className="min-w-0">
            {lead.prossima_azione_il ? (
              <strong className="mr-1 font-mono font-medium">{formatDate(lead.prossima_azione_il)}</strong>
            ) : null}
            {lead.prossima_azione}
            {scaduta ? <span className="sr-only"> (scaduta)</span> : null}
          </span>
        </p>
      ) : null}

      {lead.note ? <p className="line-clamp-2 text-xs text-muted-foreground">{lead.note}</p> : null}

      {/* Il wrapper ferma la propagazione (anche dagli item nel portal) così il click non apre il dialog. */}
      <div onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
        <Select
          value={lead.stage}
          items={STAGE_ITEMS}
          onValueChange={(valore) => {
            if (typeof valore === "string" && eLeadStage(valore) && valore !== lead.stage) onSposta(lead.id, valore);
          }}
        >
          <SelectTrigger size="sm" className="w-full" aria-label={`Stage di ${lead.nome}`}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {LEAD_STAGES.map((s) => (
              <SelectItem key={s.key} value={s.key}>
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </article>
  );
}
