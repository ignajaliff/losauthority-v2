import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/features/auth";
import { primoNome } from "@/features/scheda";
import { PageHeader } from "@/shared/components/layout/PageHeader";
import { StatoVuoto } from "@/shared/components/layout/StatoCaricamento";

interface PaginaInArrivoProps {
  titolo: string;
  sottotitolo: string;
  /** Occhiello sopra il titolo (default "Il tuo percorso"); il nome del cliente si aggiunge da solo. */
  occhiello?: string;
  /** Link per tornare alla pagina madre (es. il Cervello del tuo branding). */
  indietro?: { to: string; label: string };
}

/** Sezione dello spazio cliente non ancora costruita: intestazione + segnaposto. */
export function PaginaInArrivo({ titolo, sottotitolo, occhiello = "Il tuo percorso", indietro }: PaginaInArrivoProps) {
  const { utente } = useAuth();
  const nome = primoNome(utente?.nombre);
  return (
    <div className="grid gap-7">
      {indietro ? (
        <Link
          to={indietro.to}
          className="inline-flex w-fit items-center gap-1.5 text-[13px] text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" aria-hidden /> {indietro.label}
        </Link>
      ) : null}
      <PageHeader occhiello={`${occhiello}${nome ? ` · ${nome}` : ""}`} titolo={titolo} sottotitolo={sottotitolo} />
      <StatoVuoto titolo="In arrivo" testo="Questa sezione sarà disponibile a breve." />
    </div>
  );
}
