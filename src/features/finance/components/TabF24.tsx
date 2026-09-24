import { useState } from "react";
import { ConfermaEliminazione } from "@/features/fatture";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { ErroreCaricamento, SkeletonRighe, StatoVuoto } from "@/shared/components/layout/StatoCaricamento";
import { formatCurrency, sumImporti } from "@/shared/utils/formatCurrency";
import { useEliminaF24, useF24 } from "../hooks/useF24";
import type { F24 } from "../types";
import { CaricaF24 } from "./CaricaF24";
import { F24ModificaDialog } from "./F24ModificaDialog";
import { F24Tabella } from "./F24Tabella";

/** Tab F24: caricamento, rate da pagare in evidenza (per scadenza) e già pagate. */
export function TabF24() {
  const { data: righe, isLoading, isError } = useF24();
  const elimina = useEliminaF24();
  const [daModificare, setDaModificare] = useState<F24 | null>(null);
  const [daEliminare, setDaEliminare] = useState<F24 | null>(null);

  const daPagare = (righe ?? []).filter((f) => !f.pagato);
  const pagati = (righe ?? []).filter((f) => f.pagato);
  const totaleDaPagare = sumImporti(daPagare.map((f) => f.importo));

  function confermaEliminazione() {
    if (!daEliminare) return;
    elimina.mutate(daEliminare, { onSuccess: () => setDaEliminare(null) });
  }

  return (
    <div className="grid gap-4">
      <CaricaF24 />

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <CardTitle>Da pagare</CardTitle>
              <CardDescription>Le rate aperte, dalla scadenza più vicina.</CardDescription>
            </div>
            {daPagare.length > 0 ? (
              <span className="text-sm text-muted-foreground">
                totale <span className="font-semibold tabular-nums text-foreground">{formatCurrency(totaleDaPagare)}</span>
              </span>
            ) : null}
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? <SkeletonRighe righe={3} /> : null}
          {isError ? <ErroreCaricamento /> : null}
          {righe && daPagare.length === 0 ? <StatoVuoto titolo="Nessun F24 da pagare" /> : null}
          {daPagare.length > 0 ? <F24Tabella righe={daPagare} onModifica={setDaModificare} onElimina={setDaEliminare} /> : null}
        </CardContent>
      </Card>

      {pagati.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Già pagati ({pagati.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <F24Tabella righe={pagati} onModifica={setDaModificare} onElimina={setDaEliminare} />
          </CardContent>
        </Card>
      ) : null}

      <F24ModificaDialog f24={daModificare} onClose={() => setDaModificare(null)} />
      <ConfermaEliminazione
        open={daEliminare !== null}
        onOpenChange={(aperto) => {
          if (!aperto) setDaEliminare(null);
        }}
        titolo="Eliminare questo F24?"
        descrizione={
          daEliminare
            ? `${daEliminare.descrizione || "F24"}${daEliminare.importo != null ? ` da ${formatCurrency(daEliminare.importo)}` : ""}. Il PDF si conserva finché resta almeno una rata.`
            : ""
        }
        inCorso={elimina.isPending}
        onConferma={confermaEliminazione}
      />
    </div>
  );
}
