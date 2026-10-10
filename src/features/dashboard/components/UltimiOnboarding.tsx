import { Link } from "react-router-dom";
import { Badge } from "@/shared/components/ui/badge";
import { formatDate } from "@/shared/utils/formatDate";
import { ETICHETTE_STATO_ONBOARDING, type OnboardingRecente } from "../types";
import { ListaCard } from "./ListaCard";

interface UltimiOnboardingProps {
  onboarding: OnboardingRecente[] | undefined;
  caricamento: boolean;
  errore: boolean;
}

function varianteStato(stato: string): "active" | "expiring" | "churn" | "outline" {
  if (stato === "hub_creato") return "active";
  if (stato === "fuori_target") return "churn";
  if (stato === "in_lavorazione" || stato === "completato") return "expiring";
  return "outline";
}

/** Gli ultimi clienti che hanno completato (o iniziato) l'onboarding. */
export function UltimiOnboarding({ onboarding, caricamento, errore }: UltimiOnboardingProps) {
  const righe = onboarding ?? [];
  return (
    <ListaCard
      titolo="Ultimi onboarding"
      sottotitolo="Le schede più recenti dei tuoi clienti"
      link={{ href: "/clienti", testo: "Tutti" }}
      caricamento={caricamento}
      errore={errore}
      vuoto={righe.length === 0}
      testoVuoto="Ancora nessun onboarding ricevuto."
    >
      {righe.map((o) => (
        <li key={o.id}>
          {/* Telefono: nome e stato sulla prima riga, la data sotto. */}
          <Link to={`/clienti/${o.id}?tab=onboarding`} className="flex flex-wrap items-center gap-x-3 gap-y-0.5 py-2 hover:bg-muted/50 sm:flex-nowrap sm:gap-3">
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium">{o.nombre || o.email || "—"}</p>
              <p className="truncate text-xs text-muted-foreground">{o.email}</p>
            </div>
            <span className="order-last basis-full text-sm tabular-nums text-muted-foreground sm:order-none sm:basis-auto">{formatDate(o.data)}</span>
            <Badge variant={varianteStato(o.stato_onboarding)}>
              {ETICHETTE_STATO_ONBOARDING[o.stato_onboarding] ?? o.stato_onboarding}
            </Badge>
          </Link>
        </li>
      ))}
    </ListaCard>
  );
}
