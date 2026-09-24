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

function varianteStato(stato: string): "default" | "secondary" | "destructive" | "outline" {
  if (stato === "completato" || stato === "hub_creato") return "default";
  if (stato === "fuori_target") return "destructive";
  if (stato === "in_lavorazione") return "secondary";
  return "outline";
}

/** Gli ultimi clienti che hanno completato (o iniziato) l'onboarding. */
export function UltimiOnboarding({ onboarding, caricamento, errore }: UltimiOnboardingProps) {
  const righe = onboarding ?? [];
  return (
    <ListaCard
      titolo="Ultimi onboarding"
      sottotitolo="Le schede più recenti dei tuoi clienti"
      link={{ href: "/onboarding", testo: "Tutti" }}
      caricamento={caricamento}
      errore={errore}
      vuoto={righe.length === 0}
      testoVuoto="Ancora nessun onboarding ricevuto."
    >
      {righe.map((o) => (
        <li key={o.id}>
          <Link to={`/onboarding/${o.id}`} className="flex items-center gap-3 py-2 hover:bg-muted/50">
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium">{o.nombre || o.email || "—"}</p>
              <p className="truncate text-xs text-muted-foreground">{o.email}</p>
            </div>
            <span className="text-sm tabular-nums text-muted-foreground">{formatDate(o.data)}</span>
            <Badge variant={varianteStato(o.stato_onboarding)}>
              {ETICHETTE_STATO_ONBOARDING[o.stato_onboarding] ?? o.stato_onboarding}
            </Badge>
          </Link>
        </li>
      ))}
    </ListaCard>
  );
}
