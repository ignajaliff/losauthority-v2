import { ExternalLink, RefreshCw } from "lucide-react";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { ErroreCaricamento, SkeletonBlocco, StatoVuoto } from "@/shared/components/layout/StatoCaricamento";
import { formatDate, formatDateTime } from "@/shared/utils/formatDate";
import { useAggiornaCompiti, useHubCompiti } from "../hooks/useHubCompiti";
import type { HubBoardConCompiti, HubCompito } from "../types";

function BadgeStatoCompito({ stato }: { stato: string }) {
  if (stato === "done") return <Badge variant="default">Fatto</Badge>;
  if (stato === "in_progress") return <Badge variant="secondary">In corso</Badge>;
  return <Badge variant="outline">Da fare</Badge>;
}

function RigaCompito({ c }: { c: HubCompito }) {
  return (
    <li className="flex flex-wrap items-center gap-2">
      <BadgeStatoCompito stato={c.stato} />
      <span className={c.stato === "done" ? "text-muted-foreground line-through" : ""}>{c.titolo}</span>
      {c.assegnato_a === "wesley" ? <Badge variant="destructive">Wesley</Badge> : null}
      {c.scadenza ? <span className="text-xs text-muted-foreground">{formatDate(c.scadenza)}</span> : null}
      {c.link_utile ? (
        <a href={c.link_utile} target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-foreground" aria-label="Link utile">
          <ExternalLink className="size-3.5" aria-hidden />
        </a>
      ) : null}
    </li>
  );
}

function CardBoard({ b }: { b: HubBoardConCompiti }) {
  const fatti = b.compiti.filter((c) => c.stato === "done").length;
  const titolo = b.call_n === 0 ? "To-do del cliente" : `Call ${b.call_n}`;
  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {titolo}
          <span className="text-xs font-normal text-muted-foreground">
            {fatti}/{b.compiti.length}
          </span>
          {b.compiti.length > 0 && fatti === b.compiti.length ? <Badge variant="default">Completata</Badge> : null}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {b.compiti.length === 0 ? (
          <p className="text-muted-foreground">Nessun compito.</p>
        ) : (
          <ul className="grid gap-2">
            {b.compiti.map((c) => (
              <RigaCompito key={c.id} c={c} />
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

/** Compiti letti dall'hub Notion: una card per call 1..4, la to-do in fondo. */
export function PianoAzione({ clienteId, haHub }: { clienteId: string; haHub: boolean }) {
  const { data, isLoading, isError } = useHubCompiti(clienteId);
  const aggiorna = useAggiornaCompiti(clienteId);

  if (isLoading) return <SkeletonBlocco />;
  if (isError) return <ErroreCaricamento />;

  const boards = [...(data ?? [])].sort((a, b) => (a.call_n === 0 ? 1 : b.call_n === 0 ? -1 : a.call_n - b.call_n));
  const ultimaSync = boards.reduce<string | null>((max, b) => (!max || b.synced_at > max ? b.synced_at : max), null);

  return (
    <section className="grid gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="font-semibold">Piano d'azione</h3>
          <p className="text-xs text-muted-foreground">
            Letto dall'hub Notion del cliente{ultimaSync ? ` · aggiornato ${formatDateTime(ultimaSync)}` : ""}
          </p>
        </div>
        <Button size="sm" variant="outline" onClick={() => aggiorna.mutate()} disabled={aggiorna.isPending || !haHub}>
          <RefreshCw className={aggiorna.isPending ? "animate-spin" : ""} aria-hidden />
          {aggiorna.isPending ? "Aggiorno…" : "Aggiorna compiti"}
        </Button>
      </div>
      {boards.length === 0 ? (
        <StatoVuoto
          titolo="Nessun compito ancora"
          testo={haHub ? "Premi «Aggiorna compiti» per leggere le board Notion." : "Il cliente non ha ancora un hub Notion collegato."}
        />
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {boards.map((b) => (
            <CardBoard key={b.id} b={b} />
          ))}
        </div>
      )}
    </section>
  );
}
