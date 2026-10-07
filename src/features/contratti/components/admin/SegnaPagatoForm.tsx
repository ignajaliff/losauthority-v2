import { useState } from "react";
import { esPdf, PDF_MAX_BYTES } from "@/features/fatture";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
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
import { euroContratto, oggiInItalia } from "@contratti/documento.ts";
import { useSegnaPagato } from "../../hooks/useContrattoAzioni";

/** «Segna come pagato»: registra l'incasso e crea la scheda del cliente. Al cliente non parte nulla: gli accessi si aprono con «Attiva». */
export function SegnaPagatoForm({ id, importo }: { id: string; importo: number }) {
  const oggi = oggiInItalia();
  const [pagatoIl, setPagatoIl] = useState(oggi);
  const [pdf, setPdf] = useState<File | null>(null);
  const [errore, setErrore] = useState<string | null>(null);
  const [conferma, setConferma] = useState(false);
  const segna = useSegnaPagato(id);

  function scegliFile(file: File | null) {
    if (file && !esPdf(file)) return setErrore("Il file deve essere un PDF.");
    if (file && file.size > PDF_MAX_BYTES) return setErrore("Il PDF supera la dimensione massima.");
    setErrore(null);
    setPdf(file);
  }

  return (
    <div className="grid gap-3.5">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="grid gap-1.5">
          <Label htmlFor="pagato-il">Pagato il</Label>
          <Input id="pagato-il" type="date" value={pagatoIl} max={oggi} onChange={(e) => setPagatoIl(e.target.value)} required />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="pagato-pdf">PDF della fattura (facoltativo)</Label>
          <Input id="pagato-pdf" type="file" accept="application/pdf,.pdf" onChange={(e) => scegliFile(e.target.files?.[0] ?? null)} />
        </div>
      </div>
      {errore ? (
        <p role="alert" className="text-sm text-status-churn">
          {errore}
        </p>
      ) : null}
      <div>
        <Button disabled={segna.isPending || !pagatoIl} onClick={() => setConferma(true)}>
          {segna.isPending ? "Registro…" : "Segna come pagato"}
        </Button>
      </div>
      <AlertDialog open={conferma} onOpenChange={setConferma}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confermi di aver incassato {euroContratto(importo)} €?</AlertDialogTitle>
            <AlertDialogDescription>Verranno creati la scheda del cliente e la fattura incassata. Al cliente non parte nessuna comunicazione.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annulla</AlertDialogCancel>
            <AlertDialogAction onClick={() => segna.mutate({ pagato_il: pagatoIl, pdf })}>Sì, è pagato</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
