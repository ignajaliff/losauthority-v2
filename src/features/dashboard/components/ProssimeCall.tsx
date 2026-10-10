import { Link } from "react-router-dom";
import { Badge } from "@/shared/components/ui/badge";
import { formatDateTime } from "@/shared/utils/formatDate";
import { ETICHETTE_FASE, type ClienteDashboard } from "../types";
import { ListaCard } from "./ListaCard";

interface ProssimeCallProps {
  clienti: ClienteDashboard[] | undefined;
  caricamento: boolean;
  errore: boolean;
}

const MAX_CALL = 6;

type ClienteConCall = ClienteDashboard & { prossima_call: string };

/** Call 1:1 in arrivo, dalla più vicina. */
export function ProssimeCall({ clienti, caricamento, errore }: ProssimeCallProps) {
  const adesso = new Date().toISOString();
  const prossime = (clienti ?? [])
    .filter((c): c is ClienteConCall => !!c.prossima_call && c.prossima_call >= adesso)
    .sort((a, b) => a.prossima_call.localeCompare(b.prossima_call))
    .slice(0, MAX_CALL);

  return (
    <ListaCard
      titolo="Prossime call"
      sottotitolo="Le call 1:1 in arrivo"
      link={{ href: "/clienti", testo: "Clienti" }}
      caricamento={caricamento}
      errore={errore}
      vuoto={prossime.length === 0}
      testoVuoto="Nessuna call in programma. Impostala dalla scheda cliente."
    >
      {prossime.map((c) => (
        <li key={c.id}>
          {/* Telefono: nome e fase sulla prima riga, la data sotto. */}
          <Link to={`/clienti/${c.id}`} className="flex flex-wrap items-center gap-x-3 gap-y-0.5 py-2 hover:bg-muted/50 sm:flex-nowrap sm:gap-3">
            <span className="min-w-0 flex-1 truncate font-medium">{c.nombre || c.email || "—"}</span>
            <Badge variant="outline">{ETICHETTE_FASE[c.fase ?? ""] ?? c.fase ?? "—"}</Badge>
            <span className="basis-full text-sm tabular-nums text-muted-foreground sm:basis-auto">{formatDateTime(c.prossima_call)}</span>
          </Link>
        </li>
      ))}
    </ListaCard>
  );
}
