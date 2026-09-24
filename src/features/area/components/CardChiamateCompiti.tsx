import { ChevronDown, ExternalLink } from "lucide-react";
import { Badge } from "@/shared/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { ErroreCaricamento, SkeletonRighe, StatoVuoto } from "@/shared/components/layout/StatoCaricamento";
import { formatDate, formatDateShort } from "@/shared/utils/formatDate";
import { useMieChiamate, useMieiCompiti, type MioCompito } from "../hooks/useArea";

/** Call registrate: titolo, data, riassunto espandibile, link Fathom. Sola lettura. */
export function CardChiamate({ clienteId }: { clienteId: string }) {
  const { data, isLoading, isError } = useMieChiamate(clienteId);
  return (
    <Card>
      <CardHeader>
        <CardTitle>Le tue call</CardTitle>
        <CardDescription>Riassunti e registrazioni delle call del percorso.</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? <SkeletonRighe righe={2} /> : null}
        {isError ? <ErroreCaricamento /> : null}
        {data && data.length === 0 ? <StatoVuoto titolo="Ancora nessuna call" testo="Compariranno qui dopo la prima call con Wesley." /> : null}
        {data && data.length > 0 ? (
          <ul className="grid gap-2">
            {data.map((c) => (
              <li key={c.id}>
                <details className="group rounded-lg border">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-3">
                    <span className="min-w-0">
                      <span className="block font-medium">{c.titolo || "Call registrata"}</span>
                      <span className="block text-xs text-muted-foreground">{formatDateShort(c.registrata_il)}</span>
                    </span>
                    <ChevronDown className="size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" aria-hidden />
                  </summary>
                  <div className="grid gap-3 border-t p-3">
                    {c.share_url ? (
                      <a href={c.share_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm underline underline-offset-4">
                        Guarda la registrazione <ExternalLink className="size-3.5" aria-hidden />
                      </a>
                    ) : null}
                    {c.riassunto ? (
                      <p className="whitespace-pre-wrap text-sm">{c.riassunto}</p>
                    ) : (
                      <p className="text-sm text-muted-foreground">Riassunto non ancora disponibile.</p>
                    )}
                  </div>
                </details>
              </li>
            ))}
          </ul>
        ) : null}
      </CardContent>
    </Card>
  );
}

const ETICHETTA_STATO_COMPITO: Record<string, string> = {
  not_started: "Da fare",
  in_progress: "In corso",
  done: "Fatto",
};

function RigaCompito({ compito }: { compito: MioCompito }) {
  return (
    <li className="flex flex-wrap items-center gap-2 py-2">
      <Badge variant={compito.stato === "done" ? "active" : compito.stato === "in_progress" ? "expiring" : "outline"}>
        {ETICHETTA_STATO_COMPITO[compito.stato] ?? compito.stato}
      </Badge>
      <span className={compito.stato === "done" ? "flex-1 text-sm text-muted-foreground line-through" : "flex-1 text-sm"}>
        {compito.titolo}
      </span>
      {compito.scadenza ? <span className="text-xs text-muted-foreground tabular-nums">entro {formatDate(compito.scadenza)}</span> : null}
      {compito.link_utile ? (
        <a href={compito.link_utile} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs underline underline-offset-4">
          Link utile <ExternalLink className="size-3" aria-hidden />
        </a>
      ) : null}
    </li>
  );
}

/** Compiti dell'hub Notion raggruppati per call (0 = to-do). Mostrata solo se esistono board. */
export function CardCompiti({ clienteId }: { clienteId: string }) {
  const { data, isLoading, isError } = useMieiCompiti(clienteId);
  if (isLoading) return <SkeletonRighe righe={2} />;
  if (isError) return <ErroreCaricamento />;
  if (!data || data.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>I tuoi compiti</CardTitle>
        <CardDescription>Le attività dell'hub, call per call.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        {data.map((board) => (
          <section key={board.id}>
            <h3 className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
              {board.call_n === 0 ? "To-do" : `Call ${board.call_n}`}
            </h3>
            {board.hub_compiti.length === 0 ? (
              <p className="py-2 text-sm text-muted-foreground">Nessun compito.</p>
            ) : (
              <ul className="divide-y">
                {board.hub_compiti.map((k) => (
                  <RigaCompito key={k.id} compito={k} />
                ))}
              </ul>
            )}
          </section>
        ))}
      </CardContent>
    </Card>
  );
}
