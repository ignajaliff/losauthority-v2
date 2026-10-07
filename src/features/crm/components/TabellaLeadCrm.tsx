import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/components/ui/table";
import { formatCurrency } from "@/shared/utils/formatCurrency";
import { cn } from "@/lib/utils";
import { COLORE_STATO_LEAD, eStatoLead, ETICHETTA_STATO_LEAD, etichettaFonte, STATI_LEAD, type LeadCrm, type StatoLead } from "../types";

interface TabellaLeadCrmProps {
  righe: LeadCrm[];
  /** id offerta → nome da mostrare. */
  nomiOfferte: Record<string, string>;
  /** Messaggio quando non ci sono righe (filtro troppo stretto). */
  testoVuoto: string;
  onApri: (lead: LeadCrm) => void;
  onCambiaStato: (id: string, stato: StatoLead) => void;
}

function PallinoStato({ stato }: { stato: StatoLead }) {
  return <span className={cn("size-2 shrink-0 rounded-full", COLORE_STATO_LEAD[stato])} aria-hidden />;
}

function SelectStato({ lead, onCambiaStato }: { lead: LeadCrm; onCambiaStato: TabellaLeadCrmProps["onCambiaStato"] }) {
  const stato = eStatoLead(lead.stato) ? lead.stato : "nuovo";
  return (
    // Il wrapper ferma la propagazione (anche dagli item nel portal): il click non apre il popup del contatto.
    <div onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
      <Select
        value={stato}
        items={ETICHETTA_STATO_LEAD}
        onValueChange={(valore) => {
          if (typeof valore === "string" && eStatoLead(valore) && valore !== lead.stato) onCambiaStato(lead.id, valore);
        }}
      >
        <SelectTrigger size="sm" className="w-40 text-[12.5px]" aria-label={`Stato di ${lead.nome}`}>
          <PallinoStato stato={stato} />
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {STATI_LEAD.map((s) => (
            <SelectItem key={s} value={s}>
              <PallinoStato stato={s} />
              {ETICHETTA_STATO_LEAD[s]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

/** Il CRM del cliente: contatto (nome + email e telefono), da dove è arrivato, offerta, stato cambiabile dalla riga (+ valore se chiuso). */
export function TabellaLeadCrm({ righe, nomiOfferte, testoVuoto, onApri, onCambiaStato }: TabellaLeadCrmProps) {
  return (
    <div className="overflow-hidden rounded-lg border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Contatto</TableHead>
            <TableHead className="hidden sm:table-cell">Da dove arriva</TableHead>
            <TableHead className="hidden sm:table-cell">Offerta</TableHead>
            <TableHead className="w-44">Stato</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {righe.length === 0 ? (
            <TableRow className="hover:bg-transparent">
              <TableCell colSpan={4} className="py-10 text-center text-[13px] whitespace-normal text-muted-foreground">
                {testoVuoto}
              </TableCell>
            </TableRow>
          ) : null}
          {righe.map((l) => {
            const fonte = etichettaFonte(l.fonte);
            const offerta = l.offerta_id ? (nomiOfferte[l.offerta_id] ?? null) : null;
            return (
              <TableRow
                key={l.id}
                className="cursor-pointer"
                tabIndex={0}
                aria-label={`Apri il contatto ${l.nome}`}
                onClick={() => onApri(l)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") onApri(l);
                }}
              >
                <TableCell className="max-w-0 sm:max-w-none">
                  <span className="block truncate font-semibold sm:max-w-72">{l.nome}</span>
                  {l.email || l.telefono ? (
                    <span className="mt-0.5 block truncate text-xs text-muted-foreground sm:max-w-72">
                      {[l.email, l.telefono].filter(Boolean).join(" · ")}
                    </span>
                  ) : null}
                  {/* Su telefono fonte e offerta vanno sotto il nome: le loro colonne sono nascoste. */}
                  {fonte || offerta ? (
                    <span className="mt-0.5 block truncate text-xs text-muted-foreground sm:hidden">
                      {[fonte, offerta].filter(Boolean).join(" · ")}
                    </span>
                  ) : null}
                </TableCell>
                <TableCell className="hidden text-[12.5px] text-muted-foreground sm:table-cell">{fonte ?? "—"}</TableCell>
                <TableCell className="hidden max-w-60 truncate text-[12.5px] text-muted-foreground sm:table-cell">{offerta ?? "—"}</TableCell>
                <TableCell className="py-2.5">
                  <SelectStato lead={l} onCambiaStato={onCambiaStato} />
                  {l.stato === "chiuso" && l.valore != null ? (
                    <span className="figure mt-1 block text-[11px] text-muted-foreground">{formatCurrency(l.valore)}</span>
                  ) : null}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
