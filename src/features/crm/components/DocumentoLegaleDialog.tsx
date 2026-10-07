import { Download } from "lucide-react";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/shared/components/ui/dialog";
import { formatDate } from "@/shared/utils/formatDate";
import type { DocumentoLegale } from "../types";

/** Scarica il testo completo così com'è nel database. */
function scarica(d: DocumentoLegale) {
  const testo = `${d.titolo}\nVersione ${d.versione} · pubblicata il ${formatDate(d.pubblicato_il)}\n\n${d.testo}\n`;
  const url = URL.createObjectURL(new Blob([testo], { type: "text/plain;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = `${d.documento}-v${d.versione}.txt`;
  link.click();
  URL.revokeObjectURL(url);
}

interface DocumentoLegaleDialogProps {
  /** null → chiuso. */
  documento: DocumentoLegale | null;
  onChiudi: () => void;
}

/** Un documento della sezione Clienti, leggibile per intero e scaricabile. */
export function DocumentoLegaleDialog({ documento, onChiudi }: DocumentoLegaleDialogProps) {
  return (
    <Dialog open={documento !== null} onOpenChange={(open) => (open ? null : onChiudi())}>
      <DialogContent className="sm:max-w-2xl">
        {documento ? (
          <>
            <DialogHeader>
              <DialogTitle>{documento.titolo}</DialogTitle>
              <DialogDescription className="flex flex-wrap items-center gap-2">
                Versione {documento.versione} · pubblicata il {formatDate(documento.pubblicato_il)}
                {documento.bozza ? <Badge variant="expiring">Bozza</Badge> : null}
              </DialogDescription>
            </DialogHeader>
            <div className="max-h-[60vh] overflow-y-auto rounded-md border bg-muted/30 p-4 text-sm leading-relaxed whitespace-pre-wrap">
              {documento.testo}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => scarica(documento)}>
                <Download aria-hidden /> Scarica
              </Button>
              <Button onClick={onChiudi}>Chiudi</Button>
            </DialogFooter>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
