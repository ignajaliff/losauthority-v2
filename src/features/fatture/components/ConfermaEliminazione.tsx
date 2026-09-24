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

interface ConfermaEliminazioneProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  titolo: string;
  descrizione: string;
  inCorso?: boolean;
  onConferma: () => void;
}

/** AlertDialog di conferma per le eliminazioni (controllato dal padre). */
export function ConfermaEliminazione({
  open,
  onOpenChange,
  titolo,
  descrizione,
  inCorso = false,
  onConferma,
}: ConfermaEliminazioneProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{titolo}</AlertDialogTitle>
          <AlertDialogDescription>{descrizione}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={inCorso}>Annulla</AlertDialogCancel>
          <AlertDialogAction variant="destructive" disabled={inCorso} onClick={onConferma}>
            {inCorso ? "Elimino…" : "Elimina"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
