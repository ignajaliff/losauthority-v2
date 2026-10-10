import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/components/ui/table";
import { formatCurrency } from "@/shared/utils/formatCurrency";
import { ETICHETTA_PERIODO_CRM, PERIODI_CRM, riepilogoCrm, type NumeriCanale, type PeriodoCrm } from "../statistiche";
import { ETICHETTA_FONTE_LEAD, type LeadCrm } from "../types";

const percentuale = (n: NumeriCanale) => (n.percentuale === null ? "—" : `${n.percentuale}%`);
const valore = (n: NumeriCanale) => (n.valore > 0 ? formatCurrency(n.valore) : "—");

/** Quanti contatti sono arrivati, quanti ne hai chiusi e la percentuale, per canale e per periodo. */
export function StatisticheCrm({ contatti }: { contatti: LeadCrm[] }) {
  const [periodo, setPeriodo] = useState<PeriodoCrm>("3m");
  const [oggi] = useState(() => new Date());
  const r = useMemo(() => riepilogoCrm(contatti, periodo, oggi), [contatti, periodo, oggi]);

  const riquadri = [
    { etichetta: "Arrivati", valore: String(r.totale.arrivati) },
    { etichetta: "Chiusi", valore: String(r.totale.chiusi) },
    { etichetta: "Chiusi su arrivati", valore: percentuale(r.totale) },
    { etichetta: "Valore chiuso", valore: valore(r.totale) },
  ];

  return (
    <Card>
      <CardHeader className="flex flex-row flex-wrap items-end justify-between gap-3">
        <div>
          <p className="eyebrow">I tuoi numeri</p>
          <CardTitle className="mt-1">Quanti ne arrivano, quanti ne chiudi</CardTitle>
        </div>
        <Select value={periodo} items={ETICHETTA_PERIODO_CRM} onValueChange={(v) => v && setPeriodo(v as PeriodoCrm)}>
          <SelectTrigger size="sm" className="w-44 pointer-coarse:data-[size=sm]:h-10" aria-label="Periodo">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PERIODI_CRM.map((p) => (
              <SelectItem key={p} value={p}>
                {ETICHETTA_PERIODO_CRM[p]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent className="grid gap-4">
        <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {riquadri.map((q) => (
            <div key={q.etichetta} className="rounded-lg border bg-muted/40 px-3 py-2.5">
              <dt className="eyebrow text-[10px]">{q.etichetta}</dt>
              <dd className="figure mt-1 text-xl leading-tight">{q.valore}</dd>
            </div>
          ))}
        </dl>
        {r.perCanale.length > 0 ? (
          <div className="overflow-hidden rounded-lg border">
            <Table>
              <TableHeader>
                {/* Sul telefono celle più strette (le quattro colonne stanno nella carta) e il valore va sotto il canale. */}
                <TableRow className="[&>th]:max-sm:px-2.5">
                  <TableHead>Canale</TableHead>
                  <TableHead className="text-right">Arrivati</TableHead>
                  <TableHead className="text-right">Chiusi</TableHead>
                  <TableHead className="text-right">%</TableHead>
                  <TableHead className="hidden text-right sm:table-cell">Valore</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {r.perCanale.map(({ canale, numeri }) => (
                  <TableRow key={canale} className="[&>td]:max-sm:px-2.5">
                    <TableCell className="text-[13px]">
                      {ETICHETTA_FONTE_LEAD[canale]}
                      {numeri.valore > 0 ? <span className="figure block text-[11px] text-muted-foreground sm:hidden">{valore(numeri)}</span> : null}
                    </TableCell>
                    <TableCell className="figure text-right text-[13px]">{numeri.arrivati}</TableCell>
                    <TableCell className="figure text-right text-[13px]">{numeri.chiusi}</TableCell>
                    <TableCell className="figure text-right text-[13px]">{percentuale(numeri)}</TableCell>
                    <TableCell className="figure hidden text-right text-[13px] sm:table-cell">{valore(numeri)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Nessun contatto arrivato in questo periodo.</p>
        )}
        <p className="text-xs text-muted-foreground">Contano i contatti arrivati nel periodo; «chiusi» sono quelli di loro che oggi sono nello stato Chiuso.</p>
      </CardContent>
    </Card>
  );
}
