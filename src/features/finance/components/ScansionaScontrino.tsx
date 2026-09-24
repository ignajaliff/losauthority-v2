import { useRef, useState } from "react";
import { Camera, Upload } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { useScansionaScontrino } from "../hooks/useSpese";
import { scontrinoSchema } from "../schema";

/**
 * Card "Aggiungi uno scontrino": due modi per scegliere il file —
 * «Scansiona» apre la fotocamera (mobile), «Carica» sceglie un file (foto o PDF).
 * L'AI legge importo, descrizione e data e crea la spesa variabile.
 */
export function ScansionaScontrino() {
  const scansiona = useScansionaScontrino();
  const [errore, setErrore] = useState<string | null>(null);
  const fotocameraRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // permette di riscegliere lo stesso file
    if (!file) return;
    const esito = scontrinoSchema.safeParse({ file });
    if (!esito.success) {
      setErrore(esito.error.issues[0]?.message ?? "File non valido");
      return;
    }
    setErrore(null);
    scansiona.mutate(esito.data.file);
  }

  const occupato = scansiona.isPending;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Aggiungi uno scontrino</CardTitle>
        <CardDescription>Fotografalo o caricalo (foto o PDF, max 10 MB): creo io la spesa variabile. Se sbaglio, correggi sulla riga.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <Button disabled={occupato} onClick={() => fotocameraRef.current?.click()}>
            <Camera /> {occupato ? "Sto leggendo…" : "Scansiona"}
          </Button>
          <Button variant="outline" disabled={occupato} onClick={() => fileRef.current?.click()}>
            <Upload /> Carica
          </Button>
          <input
            ref={fotocameraRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="sr-only"
            aria-label="Fotografa lo scontrino"
            onChange={onFile}
          />
          <input
            ref={fileRef}
            type="file"
            accept="image/*,application/pdf"
            className="sr-only"
            aria-label="Carica la foto o il PDF dello scontrino"
            onChange={onFile}
          />
        </div>
        {errore ? (
          <p role="alert" className="text-sm text-destructive">
            {errore}
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
