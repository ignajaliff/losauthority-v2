import { useState } from "react";
import { ExternalLink, Trash2 } from "lucide-react";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/components/ui/table";
import { formatCurrency } from "@/shared/utils/formatCurrency";
import { formatDate, todayIso } from "@/shared/utils/formatDate";
import { useApriFile } from "../hooks/useApriFile";
import { useEliminaFattura, useTogglePagataFattura } from "../hooks/useFattureMutations";
import { BUCKET_FATTURE, type Fattura } from "../types";
import { ConfermaEliminazione } from "./ConfermaEliminazione";

interface FattureTabellaProps {
  fatture: Fattura[];
  /** Senza azioni né toggle (area cliente / ruoli senza permesso fatture). */
  soloLettura: boolean;
}

/** Badge di stato: Pagata (con data) oppure Da pagare / Scaduta (con scadenza). */
export function StatoFattura({ fattura }: { fattura: Pick<Fattura, "pagata" | "pagata_il" | "prossimo_pagamento"> }) {
  if (fattura.pagata) {
    return (
      <span className="flex flex-wrap items-center gap-1.5">
        <Badge variant="secondary">Pagata</Badge>
        {fattura.pagata_il ? <span className="text-xs text-muted-foreground">il {formatDate(fattura.pagata_il)}</span> : null}
      </span>
    );
  }
  const scaduta = Boolean(fattura.prossimo_pagamento && fattura.prossimo_pagamento < todayIso());
  return (
    <span className="flex flex-wrap items-center gap-1.5">
      <Badge variant={scaduta ? "destructive" : "outline"}>{scaduta ? "Scaduta" : "Da pagare"}</Badge>
      {fattura.prossimo_pagamento ? (
        <span className="text-xs text-muted-foreground">
          {scaduta ? "scaduta il" : "scade il"} {formatDate(fattura.prossimo_pagamento)}
        </span>
      ) : null}
    </span>
  );
}

export function FattureTabella({ fatture, soloLettura }: FattureTabellaProps) {
  const apri = useApriFile();
  const toggle = useTogglePagataFattura();
  const elimina = useEliminaFattura();
  const [daEliminare, setDaEliminare] = useState<Fattura | null>(null);

  function confermaEliminazione() {
    if (!daEliminare) return;
    elimina.mutate(daEliminare, { onSuccess: () => setDaEliminare(null) });
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Descrizione</TableHead>
            <TableHead className="text-right">Importo</TableHead>
            <TableHead>Emessa il</TableHead>
            <TableHead>Stato</TableHead>
            <TableHead>PDF</TableHead>
            {soloLettura ? null : <TableHead className="text-right">Azioni</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {fatture.map((f) => (
            <TableRow key={f.id}>
              <TableCell className="whitespace-normal">
                <div className="font-medium">{f.descrizione || "Fattura"}</div>
                {f.note ? <div className="text-xs text-muted-foreground">{f.note}</div> : null}
              </TableCell>
              <TableCell className="text-right font-medium tabular-nums">{formatCurrency(f.importo)}</TableCell>
              <TableCell className="text-muted-foreground">{formatDate(f.emessa_il)}</TableCell>
              <TableCell className="whitespace-normal">
                <StatoFattura fattura={f} />
              </TableCell>
              <TableCell>
                {f.pdf_path ? (
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={apri.isPending}
                    onClick={() => apri.mutate({ bucket: BUCKET_FATTURE, path: f.pdf_path as string })}
                  >
                    <ExternalLink /> Apri
                  </Button>
                ) : (
                  <span className="text-xs text-muted-foreground">—</span>
                )}
              </TableCell>
              {soloLettura ? null : (
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1.5">
                    <Button variant={f.pagata ? "ghost" : "secondary"} size="sm" disabled={toggle.isPending} onClick={() => toggle.mutate(f)}>
                      {f.pagata ? "Segna da pagare" : "Segna pagata"}
                    </Button>
                    <Button variant="ghost" size="icon-sm" aria-label="Elimina fattura" onClick={() => setDaEliminare(f)}>
                      <Trash2 />
                    </Button>
                  </div>
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <ConfermaEliminazione
        open={daEliminare !== null}
        onOpenChange={(aperto) => {
          if (!aperto) setDaEliminare(null);
        }}
        titolo="Eliminare questa fattura?"
        descrizione={
          daEliminare
            ? `${daEliminare.descrizione || "Fattura"} da ${formatCurrency(daEliminare.importo)}${daEliminare.pdf_path ? ". Verrà eliminato anche il PDF." : "."}`
            : ""
        }
        inCorso={elimina.isPending}
        onConferma={confermaEliminazione}
      />
    </>
  );
}
