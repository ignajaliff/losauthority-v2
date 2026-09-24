import { Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/shared/components/ui/alert-dialog";
import { Button } from "@/shared/components/ui/button";
import { useEliminaChiamata } from "../hooks/useChiamate";
import type { Chiamata } from "../types";

/** Pulsante "Elimina" con conferma: toglie la call (e le sue azioni) dall'area del cliente. */
export function EliminaChiamataDialog({ chiamata }: { chiamata: Chiamata }) {
  const elimina = useEliminaChiamata();

  return (
    <AlertDialog>
      <AlertDialogTrigger render={<Button variant="destructive" size="sm" />}>
        <Trash2 /> Elimina
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Eliminare questa call?</AlertDialogTitle>
          <AlertDialogDescription>
            {chiamata.titolo ? `"${chiamata.titolo}" ` : "La call "}
            sparirà dal gestionale e dall&apos;area del cliente, insieme alle sue azioni. La registrazione su
            Fathom non viene toccata.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Annulla</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            disabled={elimina.isPending}
            onClick={() => elimina.mutate({ id: chiamata.id, clienteId: chiamata.cliente_id })}
          >
            Elimina
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
