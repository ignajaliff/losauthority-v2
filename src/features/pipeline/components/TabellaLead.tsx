import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/components/ui/table";
import { formatCurrency } from "@/shared/utils/formatCurrency";
import { formatDateShort, todayIso } from "@/shared/utils/formatDate";
import { cn } from "@/lib/utils";
import { eLeadStage, eStageAperto, LEAD_STAGES, type Lead, type LeadStage } from "../types";

const STAGE_ITEMS: Record<string, string> = Object.fromEntries(LEAD_STAGES.map((s) => [s.key, s.label]));

interface TabellaLeadProps {
  righe: Lead[];
  /** Messaggio quando non ci sono righe (nessun lead o filtri troppo stretti). */
  testoVuoto: string;
  onApri: (lead: Lead) => void;
  onSposta: (id: string, stage: LeadStage) => void;
}

function SelectStage({ lead, onSposta }: { lead: Lead; onSposta: TabellaLeadProps["onSposta"] }) {
  return (
    // Il wrapper ferma la propagazione (anche dagli item nel portal): il click non apre il dettaglio.
    <div onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
      <Select
        value={lead.stage}
        items={STAGE_ITEMS}
        onValueChange={(valore) => {
          if (typeof valore === "string" && eLeadStage(valore) && valore !== lead.stage) onSposta(lead.id, valore);
        }}
      >
        <SelectTrigger size="sm" className="w-40 text-[12.5px]" aria-label={`Stage di ${lead.nome}`}>
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
  );
}

/** Tabella CRM dei lead: nome, fonte, stage (cambiabile inline), valore, prossima azione. */
export function TabellaLead({ righe, testoVuoto, onApri, onSposta }: TabellaLeadProps) {
  const oggi = todayIso();
  return (
    <div className="overflow-hidden rounded-lg border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Lead</TableHead>
            <TableHead>Fonte</TableHead>
            <TableHead className="w-44">Stage</TableHead>
            <TableHead className="text-right">Valore</TableHead>
            <TableHead>Prossima azione</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {righe.length === 0 ? (
            <TableRow className="hover:bg-transparent">
              <TableCell colSpan={5} className="py-10 text-center text-[13px] whitespace-normal text-muted-foreground">
                {testoVuoto}
              </TableCell>
            </TableRow>
          ) : null}
          {righe.map((l) => {
            const scaduta = !!l.prossima_azione_il && l.prossima_azione_il < oggi && eStageAperto(l.stage);
            return (
              <TableRow
                key={l.id}
                className="cursor-pointer"
                tabIndex={0}
                aria-label={`Apri il lead ${l.nome}`}
                onClick={() => onApri(l)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") onApri(l);
                }}
              >
                <TableCell>
                  <span className="block max-w-72 truncate font-semibold">{l.nome}</span>
                  {l.contatto ? <span className="mt-0.5 block max-w-72 truncate text-xs text-muted-foreground">{l.contatto}</span> : null}
                </TableCell>
                <TableCell className="text-[12.5px] text-muted-foreground">{l.fonte ?? "—"}</TableCell>
                <TableCell className="py-2.5">
                  <SelectStage lead={l} onSposta={onSposta} />
                </TableCell>
                <TableCell className="figure text-right text-[13px] text-muted-foreground">
                  {l.valore > 0 ? formatCurrency(l.valore) : "—"}
                </TableCell>
                <TableCell className={cn("max-w-md text-[13px] whitespace-normal", scaduta ? "text-status-churn" : "text-muted-foreground")}>
                  {l.prossima_azione || l.prossima_azione_il ? (
                    <span>
                      {l.prossima_azione_il ? (
                        <strong className="figure mr-1.5 text-xs font-semibold">{formatDateShort(l.prossima_azione_il)}</strong>
                      ) : null}
                      {l.prossima_azione}
                      {scaduta ? <span className="sr-only"> (scaduta)</span> : null}
                    </span>
                  ) : (
                    <span className="text-muted-foreground/70">—</span>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
