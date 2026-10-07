import { ExternalLink, FileText, Trash2 } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { ErroreCaricamento, SkeletonRighe } from "@/shared/components/layout/StatoCaricamento";
import { useApriFile, useEliminaFile, useFilesOnboarding } from "../hooks/useAllegati";
import type { FileOnboarding } from "../types";

function formattaDimensione(byte: number): string {
  if (byte < 1024) return `${byte} B`;
  if (byte < 1024 * 1024) return `${Math.round(byte / 1024)} KB`;
  return `${(byte / (1024 * 1024)).toFixed(1)} MB`;
}

interface ListaFilesProps {
  clienteId: string | undefined;
  /** Mostra il pulsante Elimina (solo per il cliente con scheda in bozza). */
  eliminabile?: boolean;
  /** Testo quando non ci sono file. */
  testoVuoto?: string;
}

/** File della sezione Materiali con apertura via link firmato (riusata dal gestionale). */
export function ListaFiles({ clienteId, eliminabile = false, testoVuoto = "Nessun file allegato." }: ListaFilesProps) {
  const { data, isLoading, isError } = useFilesOnboarding(clienteId);
  const apri = useApriFile();
  const elimina = useEliminaFile(clienteId ?? "");

  if (isLoading) return <SkeletonRighe righe={2} />;
  if (isError) return <ErroreCaricamento />;
  if (!data || data.length === 0) return <p className="text-sm text-muted-foreground">{testoVuoto}</p>;

  return (
    <ul className="grid gap-2">
      {data.map((file: FileOnboarding) => (
        <li key={file.id} className="flex items-center gap-3 rounded-lg border px-3 py-2 text-sm">
          <FileText className="size-4 shrink-0 text-muted-foreground" aria-hidden />
          <span className="min-w-0 flex-1 truncate">{file.nome}</span>
          <span className="shrink-0 text-xs text-muted-foreground tabular-nums">{formattaDimensione(file.dimensione)}</span>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label={`Apri ${file.nome}`}
            disabled={apri.isPending}
            onClick={() => apri.mutate(file.storage_path)}
          >
            <ExternalLink aria-hidden />
          </Button>
          {eliminabile ? (
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label={`Elimina ${file.nome}`}
              disabled={elimina.isPending}
              onClick={() => elimina.mutate(file)}
            >
              <Trash2 aria-hidden className="text-destructive" />
            </Button>
          ) : null}
        </li>
      ))}
    </ul>
  );
}
