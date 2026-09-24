import { ExternalLink, FileText, Trash2 } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { ErroreCaricamento, SkeletonRighe } from "@/shared/components/layout/StatoCaricamento";
import { useAllegati, useApriAllegato, useEliminaAllegato } from "../hooks/useAllegati";
import type { Allegato } from "../types";

function formattaDimensione(byte: number): string {
  if (byte < 1024) return `${byte} B`;
  if (byte < 1024 * 1024) return `${Math.round(byte / 1024)} KB`;
  return `${(byte / (1024 * 1024)).toFixed(1)} MB`;
}

interface AllegatiInvioProps {
  invioId: string | undefined;
  /** Mostra il pulsante Elimina (solo per il cliente con invio in bozza). */
  eliminabile?: boolean;
  /** Testo quando non ci sono file. */
  testoVuoto?: string;
}

/** Lista degli allegati di un invio con apertura via link firmato (riusata dal gestionale). */
export function AllegatiInvio({ invioId, eliminabile = false, testoVuoto = "Nessun file allegato." }: AllegatiInvioProps) {
  const { data, isLoading, isError } = useAllegati(invioId);
  const apri = useApriAllegato();
  const elimina = useEliminaAllegato(invioId ?? "");

  if (isLoading) return <SkeletonRighe righe={2} />;
  if (isError) return <ErroreCaricamento />;
  if (!data || data.length === 0) return <p className="text-sm text-muted-foreground">{testoVuoto}</p>;

  return (
    <ul className="grid gap-2">
      {data.map((allegato: Allegato) => (
        <li key={allegato.id} className="flex items-center gap-3 rounded-lg border px-3 py-2 text-sm">
          <FileText className="size-4 shrink-0 text-muted-foreground" aria-hidden />
          <span className="min-w-0 flex-1 truncate">{allegato.nome}</span>
          <span className="shrink-0 text-xs text-muted-foreground tabular-nums">{formattaDimensione(allegato.dimensione)}</span>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label={`Apri ${allegato.nome}`}
            disabled={apri.isPending}
            onClick={() => apri.mutate(allegato.storage_path)}
          >
            <ExternalLink aria-hidden />
          </Button>
          {eliminabile ? (
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label={`Elimina ${allegato.nome}`}
              disabled={elimina.isPending}
              onClick={() => elimina.mutate(allegato)}
            >
              <Trash2 aria-hidden className="text-destructive" />
            </Button>
          ) : null}
        </li>
      ))}
    </ul>
  );
}
