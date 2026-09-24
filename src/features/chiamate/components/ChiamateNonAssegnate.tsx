import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";
import { ErroreCaricamento, SkeletonRighe } from "@/shared/components/layout/StatoCaricamento";
import { formatDateTime } from "@/shared/utils/formatDate";
import { useAssegnaChiamata, useChiamateNonAssegnate, useClientiOpzioni } from "../hooks/useChiamate";
import type { Chiamata, ClienteOpzione } from "../types";

function RigaChiamata({ chiamata, clienti }: { chiamata: Chiamata; clienti: ClienteOpzione[] }) {
  const assegna = useAssegnaChiamata();
  const etichetta = `Assegna "${chiamata.titolo || "Call registrata"}" a un cliente`;

  return (
    <li className="flex flex-wrap items-center justify-between gap-2">
      <span className="min-w-0">
        <span className="block truncate text-sm font-medium">{chiamata.titolo || "Call registrata"}</span>
        <span className="block text-xs text-muted-foreground">{formatDateTime(chiamata.registrata_il)}</span>
      </span>
      <Select
        value={null}
        disabled={assegna.isPending || clienti.length === 0}
        onValueChange={(v) => {
          if (v) assegna.mutate({ id: chiamata.id, clienteId: v });
        }}
      >
        <SelectTrigger size="sm" className="min-w-44" aria-label={etichetta}>
          <SelectValue placeholder={assegna.isPending ? "Assegno…" : "Assegna a…"} />
        </SelectTrigger>
        <SelectContent>
          {clienti.map((c) => (
            <SelectItem key={c.id} value={c.id}>
              {c.nombre}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </li>
  );
}

/** Widget compatto per la dashboard: call Fathom senza cliente, da assegnare. Se non ce ne sono: nulla. */
export function ChiamateNonAssegnate() {
  const { data: chiamate, isLoading, isError } = useChiamateNonAssegnate();
  const { data: clienti } = useClientiOpzioni();

  if (isLoading) return <SkeletonRighe righe={2} />;
  if (isError) return <ErroreCaricamento messaggio="Non è stato possibile caricare le call da assegnare." />;
  if (!chiamate || chiamate.length === 0) return null;

  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle>Call da assegnare</CardTitle>
        <CardDescription>
          {chiamate.length === 1 ? "Una call Fathom" : `${chiamate.length} call Fathom`} senza cliente abbinato.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="grid gap-3">
          {chiamate.map((c) => (
            <RigaChiamata key={c.id} chiamata={c} clienti={clienti ?? []} />
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
