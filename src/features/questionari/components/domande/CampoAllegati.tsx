import { useRef, useState } from "react";
import { Upload } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { motivoFileNonValido, useCaricaAllegato } from "../../hooks/useAllegati";
import { AllegatiInvio } from "../AllegatiInvio";
import type { Domanda } from "../../types";

interface CampoAllegatiProps {
  domanda: Domanda;
  invioId: string;
  clienteId: string;
  /** Upload ed eliminazione sono consentiti solo con l'invio in bozza. */
  inBozza: boolean;
}

const ACCETTA = "application/pdf,image/jpeg,image/png,image/webp,video/mp4,text/plain";

/** Sezione Materiali: upload su bucket `materiali` + righe in questionario_allegati. */
export function CampoAllegati({ domanda, invioId, clienteId, inBozza }: CampoAllegatiProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [erroreFile, setErroreFile] = useState<string | null>(null);
  const carica = useCaricaAllegato({ invioId, clienteId, domandaId: domanda.id });

  async function handleScelta(lista: FileList | null) {
    if (!lista) return;
    setErroreFile(null);
    for (const file of Array.from(lista)) {
      const motivo = motivoFileNonValido(file);
      if (motivo) {
        setErroreFile(motivo);
        continue;
      }
      await carica.mutateAsync(file).catch(() => undefined);
    }
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div className="grid gap-3">
      {inBozza ? (
        <div className="grid gap-2">
          <input
            ref={inputRef}
            id={domanda.id}
            type="file"
            multiple
            accept={ACCETTA}
            className="sr-only"
            onChange={(e) => void handleScelta(e.target.files)}
          />
          <Button
            type="button"
            variant="outline"
            className="justify-self-start"
            disabled={carica.isPending}
            onClick={() => inputRef.current?.click()}
          >
            <Upload aria-hidden />
            {carica.isPending ? "Caricamento…" : "Scegli file dal dispositivo"}
          </Button>
          {erroreFile ? (
            <p role="alert" className="text-sm text-destructive">
              {erroreFile}
            </p>
          ) : null}
        </div>
      ) : null}
      <AllegatiInvio invioId={invioId} eliminabile={inBozza} />
    </div>
  );
}
