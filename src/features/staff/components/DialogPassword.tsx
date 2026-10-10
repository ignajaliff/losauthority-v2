import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import { BottoneCopia } from "./BottoneCopia";

interface DialogPasswordProps {
  /** null = chiuso. */
  password: string | null;
  nombre: string;
  onChiudi: () => void;
}

/** Mostra la nuova password UNA volta: chiusa la finestra non è più recuperabile. */
export function DialogPassword({ password, nombre, onChiudi }: DialogPasswordProps) {
  return (
    <Dialog open={password !== null} onOpenChange={(aperto) => !aperto && onChiudi()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nuova password di {nombre}</DialogTitle>
          <DialogDescription>
            Si vede solo adesso: copiala e inviala al collaboratore. Chiusa questa finestra non sarà più
            recuperabile.
          </DialogDescription>
        </DialogHeader>
        <code className="block select-all break-all rounded-md border bg-muted px-3 py-2 font-mono text-base">
          {password}
        </code>
        <DialogFooter showCloseButton>
          {password ? <BottoneCopia testo={password} etichetta="Copia password" variant="default" /> : null}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
