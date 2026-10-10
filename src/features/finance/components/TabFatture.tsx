import { useState } from "react";
import { Link } from "react-router-dom";
import { StatoFattura, useTutteLeFatture } from "@/features/fatture";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/components/ui/table";
import { ErroreCaricamento, SkeletonRighe, StatoVuoto } from "@/shared/components/layout/StatoCaricamento";
import { formatCurrency, sumImporti } from "@/shared/utils/formatCurrency";
import { formatDate } from "@/shared/utils/formatDate";

type Filtro = "tutte" | "pagate" | "da_pagare";

const FILTRI: { valore: Filtro; etichetta: string }[] = [
  { valore: "tutte", etichetta: "Tutte" },
  { valore: "da_pagare", etichetta: "Da pagare" },
  { valore: "pagate", etichetta: "Pagate" },
];

/** Tab Fatture: tutte le fatture con il nome del cliente e link alla sua scheda. Sul telefono una colonna sola. */
export function TabFatture() {
  const { data: fatture, isLoading, isError } = useTutteLeFatture();
  const [filtro, setFiltro] = useState<Filtro>("tutte");

  const visibili = (fatture ?? []).filter((f) => (filtro === "tutte" ? true : filtro === "pagate" ? f.pagata : !f.pagata));
  const totale = sumImporti(visibili.map((f) => f.importo));

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle>Fatture</CardTitle>
            <CardDescription>Le aggiungi dalla scheda di ogni cliente.</CardDescription>
          </div>
          <div className="flex flex-wrap gap-1" role="group" aria-label="Filtra fatture">
            {FILTRI.map((f) => (
              <Button key={f.valore} size="sm" variant={filtro === f.valore ? "secondary" : "ghost"} onClick={() => setFiltro(f.valore)}>
                {f.etichetta}
              </Button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? <SkeletonRighe righe={6} /> : null}
        {isError ? <ErroreCaricamento /> : null}
        {fatture && fatture.length === 0 ? (
          <StatoVuoto titolo="Ancora nessuna fattura" testo="Aprila da un cliente → scheda → Fatture." />
        ) : null}
        {fatture && fatture.length > 0 && visibili.length === 0 ? (
          <StatoVuoto titolo="Nessuna fattura con questo filtro" />
        ) : null}
        {visibili.length > 0 ? (
          <Table>
            <TableHeader className="hidden md:table-header-group">
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead>Descrizione</TableHead>
                <TableHead>Emessa il</TableHead>
                <TableHead className="text-right">Importo</TableHead>
                <TableHead>Stato</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visibili.map((f) => (
                <TableRow key={f.id}>
                  <TableCell className="px-0 whitespace-normal md:px-[18px] md:whitespace-nowrap">
                    <div className="flex items-start justify-between gap-3">
                      <Link
                        to={`/clienti/${f.cliente_id}?tab=fatture`}
                        className="min-w-0 font-medium wrap-anywhere underline-offset-4 hover:underline pointer-coarse:-my-2.5 pointer-coarse:py-2.5 md:wrap-normal"
                      >
                        {f.cliente_nome || f.cliente_email || "Cliente"}
                      </Link>
                      <span className="shrink-0 font-medium tabular-nums md:hidden">{formatCurrency(f.importo)}</span>
                    </div>
                    {/* Telefono: descrizione, data e stato sotto il cliente. */}
                    <div className="mt-1 grid gap-1.5 md:hidden">
                      {f.descrizione ? <p className="text-muted-foreground">{f.descrizione}</p> : null}
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
                        <span className="text-xs text-muted-foreground">emessa il {formatDate(f.emessa_il)}</span>
                        <StatoFattura fattura={f} />
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="hidden whitespace-normal text-muted-foreground md:table-cell">{f.descrizione || "—"}</TableCell>
                  <TableCell className="hidden text-muted-foreground md:table-cell">{formatDate(f.emessa_il)}</TableCell>
                  <TableCell className="hidden text-right font-medium tabular-nums md:table-cell">{formatCurrency(f.importo)}</TableCell>
                  <TableCell className="hidden whitespace-normal md:table-cell">
                    <StatoFattura fattura={f} />
                  </TableCell>
                </TableRow>
              ))}
              <TableRow className="bg-muted/40 hover:bg-muted/40 md:hidden">
                <TableCell className="px-3 font-medium">
                  <div className="flex items-center justify-between gap-3">
                    <span>Totale ({visibili.length})</span>
                    <span className="font-semibold tabular-nums">{formatCurrency(totale)}</span>
                  </div>
                </TableCell>
              </TableRow>
              <TableRow className="hidden bg-muted/40 hover:bg-muted/40 md:table-row">
                <TableCell colSpan={3} className="font-medium">
                  Totale ({visibili.length})
                </TableCell>
                <TableCell className="text-right font-semibold tabular-nums">{formatCurrency(totale)}</TableCell>
                <TableCell />
              </TableRow>
            </TableBody>
          </Table>
        ) : null}
      </CardContent>
    </Card>
  );
}
