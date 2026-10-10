import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/shared/components/ui/alert-dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { ErroreCaricamento, SkeletonRighe } from "@/shared/components/layout/StatoCaricamento";
import { eFatto, raggruppaTappe } from "../compiti";
import { useCambiaStatoCompito, useCompiti, useEliminaCompito } from "../hooks/useCompiti";
import { NuovoCompitoDialog } from "./NuovoCompitoDialog";
import { RigaTappa } from "./RigaTappa";

/**
 * Piano d'azione del cliente (tabella `compiti`), gestito dal team: tappe in
 * ordine, ognuna con i suoi sotto-compiti. È la stessa lista che il cliente
 * vede come linea del tempo nella sua Dashboard e spunta da lì.
 */
export function PianoAzione({ clienteId }: { clienteId: string }) {
  const { data, isLoading, isError } = useCompiti(clienteId);
  const cambia = useCambiaStatoCompito(clienteId);
  const elimina = useEliminaCompito(clienteId);
  const [daEliminare, setDaEliminare] = useState<string | null>(null);

  const tappe = raggruppaTappe(data ?? []);
  const tappeFatte = tappe.filter(eFatto).length;
  const eliminandoTappa = tappe.some((t) => t.id === daEliminare && t.figli.length > 0);

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="grid gap-1.5">
            <CardTitle>
              Piano d'azione
              {tappe.length > 0 ? (
                <span className="ml-2 text-xs font-normal text-muted-foreground">
                  {tappeFatte}/{tappe.length} tappe
                </span>
              ) : null}
            </CardTitle>
            <CardDescription>
              Le tappe del percorso, nell'ordine in cui vanno fatte; dentro ogni tappa i sotto-compiti che il cliente spunta. Le tappe
              «Aura» le scrive lei dalla call con Wesley (tab Call); il team può correggerle, aggiungerne o toglierne.
            </CardDescription>
          </div>
          <NuovoCompitoDialog clienteId={clienteId} />
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? <SkeletonRighe righe={3} /> : null}
        {isError ? <ErroreCaricamento /> : null}
        {data && tappe.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nessuna tappa ancora. Aggiungi la prima con «Aggiungi tappa».</p>
        ) : null}
        {tappe.length > 0 ? (
          <ul className="divide-y">
            {tappe.map((t, i) => (
              <RigaTappa
                key={t.id}
                tappa={t}
                numero={i + 1}
                clienteId={clienteId}
                disabilitato={cambia.isPending}
                onCambia={(id, stato) => cambia.mutate({ id, stato })}
                onElimina={setDaEliminare}
              />
            ))}
          </ul>
        ) : null}
      </CardContent>

      <AlertDialog open={daEliminare !== null} onOpenChange={(open) => !open && setDaEliminare(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{eliminandoTappa ? "Eliminare la tappa e i suoi sotto-compiti?" : "Eliminare il compito?"}</AlertDialogTitle>
            <AlertDialogDescription>L'operazione non si può annullare.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annulla</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={elimina.isPending}
              onClick={() => {
                if (daEliminare) elimina.mutate(daEliminare, { onSettled: () => setDaEliminare(null) });
              }}
            >
              Elimina
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
