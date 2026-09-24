import { Link2 } from "lucide-react";
import { useAuth, esTeam } from "@/features/auth";
import { Button } from "@/shared/components/ui/button";
import { ErroreCaricamento, SkeletonBlocco, StatoVuoto } from "@/shared/components/layout/StatoCaricamento";
import { formatDateTime } from "@/shared/utils/formatDate";
import {
  useAssegnaChiamata,
  useChiamateCliente,
  useChiamateNonAssegnate,
  useFaseCliente,
} from "../hooks/useChiamate";
import { callSuggeritaDaFase } from "../types";
import { ChiamataCard } from "./ChiamataCard";

/** Call arrivate da Fathom senza cliente: il team le può agganciare a questo cliente. */
function CallNonAssegnate({ clienteId }: { clienteId: string }) {
  const { data: chiamate } = useChiamateNonAssegnate();
  const assegna = useAssegnaChiamata();
  if (!chiamate || chiamate.length === 0) return null;

  return (
    <section aria-label="Call non assegnate" className="rounded-xl border border-dashed p-4">
      <h3 className="font-heading text-sm font-medium">Call non assegnate</h3>
      <p className="mt-0.5 text-xs text-muted-foreground">
        Registrate su Fathom ma senza un cliente abbinato. Se sono di questo cliente, assegnale qui.
      </p>
      <ul className="mt-3 grid gap-2">
        {chiamate.map((c) => (
          <li key={c.id} className="flex flex-wrap items-center justify-between gap-2 text-sm">
            <span className="min-w-0">
              <span className="block truncate font-medium">{c.titolo || "Call registrata"}</span>
              <span className="block text-xs text-muted-foreground">{formatDateTime(c.registrata_il)}</span>
            </span>
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={assegna.isPending}
              onClick={() => assegna.mutate({ id: c.id, clienteId })}
            >
              <Link2 /> Assegna a questo cliente
            </Button>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** Tab "Call" della scheda cliente: call registrate su Fathom, dalla più recente. */
export function ChiamateCliente({ clienteId }: { clienteId: string }) {
  const { utente } = useAuth();
  const team = esTeam(utente?.rol ?? null);
  const { data: chiamate, isLoading, isError } = useChiamateCliente(clienteId);
  const { data: fase } = useFaseCliente(clienteId);
  const callSuggerita = callSuggeritaDaFase(fase);

  if (isLoading) return <SkeletonBlocco altezza="h-64" />;
  if (isError) return <ErroreCaricamento messaggio="Non è stato possibile caricare le call." />;

  return (
    <div className="grid gap-4">
      {team && <CallNonAssegnate clienteId={clienteId} />}
      {!chiamate || chiamate.length === 0 ? (
        <StatoVuoto
          titolo="Nessuna call registrata"
          testo="Le call registrate su Fathom con l'email del cliente compaiono qui da sole."
        />
      ) : (
        chiamate.map((c) => (
          <ChiamataCard key={c.id} chiamata={c} team={team} callSuggerita={callSuggerita} />
        ))
      )}
    </div>
  );
}
