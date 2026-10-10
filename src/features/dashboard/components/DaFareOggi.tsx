import { Link } from "react-router-dom";
import { Badge } from "@/shared/components/ui/badge";
import { formatDate } from "@/shared/utils/formatDate";
import { ETICHETTE_STAGE_LEAD, type ClienteDashboard, type LeadDaFare } from "../types";
import { ListaCard } from "./ListaCard";

interface DaFareOggiProps {
  clienti: ClienteDashboard[] | undefined;
  lead: LeadDaFare[] | undefined;
  caricamento: boolean;
  errore: boolean;
}

/** Compiti di Wesley aperti negli hub + lead con azione scaduta o di oggi. */
export function DaFareOggi({ clienti, lead, caricamento, errore }: DaFareOggiProps) {
  const conCompiti = (clienti ?? []).filter((c) => (c.di_wesley_aperti ?? 0) > 0);
  const leadDaFare = lead ?? [];
  const vuoto = conCompiti.length === 0 && leadDaFare.length === 0;

  return (
    <ListaCard
      titolo="Da fare oggi"
      sottotitolo="Compiti tuoi negli hub e lead da ricontattare"
      link={{ href: "/pipeline", testo: "Pipeline" }}
      caricamento={caricamento}
      errore={errore}
      vuoto={vuoto}
      testoVuoto="Niente in sospeso: nessun compito aperto e nessun lead da sentire."
    >
      {conCompiti.map((c) => (
        <li key={`c-${c.id}`}>
          {/* Telefono: il conteggio va sotto il nome. */}
          <Link to={`/clienti/${c.id}`} className="flex flex-wrap items-center gap-x-3 gap-y-0.5 py-2 hover:bg-muted/50 sm:flex-nowrap sm:gap-3">
            <span className="min-w-0 flex-1 truncate font-medium">{c.nombre || c.email || "—"}</span>
            <span className="basis-full text-sm text-muted-foreground sm:basis-auto">
              {c.di_wesley_aperti} {c.di_wesley_aperti === 1 ? "compito tuo aperto" : "compiti tuoi aperti"}
            </span>
          </Link>
        </li>
      ))}
      {leadDaFare.map((l) => (
        <li key={`l-${l.id}`}>
          {/* Telefono: nome e stage sulla prima riga, la data sotto. */}
          <Link to="/pipeline" className="flex flex-wrap items-center gap-x-3 gap-y-0.5 py-2 hover:bg-muted/50 sm:flex-nowrap sm:gap-3">
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium">{l.nome}</p>
              {l.prossima_azione ? <p className="truncate text-xs text-muted-foreground">{l.prossima_azione}</p> : null}
            </div>
            <Badge variant="outline">{ETICHETTE_STAGE_LEAD[l.stage] ?? l.stage}</Badge>
            <span className="basis-full text-sm tabular-nums text-muted-foreground sm:basis-auto">{formatDate(l.prossima_azione_il)}</span>
          </Link>
        </li>
      ))}
    </ListaCard>
  );
}
