import { useState } from "react";
import { ArrowLeft, Plus, UserRound } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/features/auth";
import { CardConcorrente, ConcorrenteDialog, useConcorrenti, type Concorrente } from "@/features/concorrenti";
import { primoNome } from "@/features/scheda";
import { Button } from "@/shared/components/ui/button";
import { PageHeader } from "@/shared/components/layout/PageHeader";
import { ErroreCaricamento, SkeletonBlocco } from "@/shared/components/layout/StatoCaricamento";

/** Il popup tiene la referenza anche mentre si chiude, così il titolo non cambia durante l'animazione. */
interface Popup {
  aperto: boolean;
  concorrente: Concorrente | null;
}

/**
 * /area/cervello/concorrenti → le referenze del cliente: chi fa quello che fa lui.
 * Una carta alta per referenza (logo, nome, fino a 3 social, cosa fa, video con descrizione).
 */
export default function ConcorrentiPage() {
  const { utente } = useAuth();
  const clienteId = utente?.id ?? "";
  const lista = useConcorrenti(utente?.id);
  const [popup, setPopup] = useState<Popup>({ aperto: false, concorrente: null });
  const nome = primoNome(utente?.nombre);
  const concorrenti = lista.data ?? [];
  const nuova = () => setPopup({ aperto: true, concorrente: null });

  return (
    <div className="grid gap-7">
      <Link to="/area/cervello" className="inline-flex w-fit items-center gap-1.5 text-[13px] text-muted-foreground transition-colors hover:text-foreground">
        <ArrowLeft className="size-3.5" aria-hidden /> Cervello del tuo branding
      </Link>
      <PageHeader
        occhiello={`Cervello del tuo branding${nome ? ` · ${nome}` : ""}`}
        titolo="Concorrenti"
        sottotitolo="Chi fa quello che fai tu: dove lo trovi, cosa fa e i video che ti servono da esempio, con quello che c'è dentro. Sono le tue referenze."
        azioni={
          concorrenti.length > 0 ? (
            <Button onClick={nuova}>
              <Plus aria-hidden /> Nuova referenza
            </Button>
          ) : null
        }
      />

      {lista.isLoading ? <SkeletonBlocco altezza="h-96" /> : null}
      {lista.isError ? <ErroreCaricamento /> : null}

      {lista.data && concorrenti.length === 0 ? (
        <div className="grid justify-items-center gap-4 rounded-2xl border border-dashed bg-card px-6 py-14 text-center">
          <span className="inline-flex size-16 items-center justify-center rounded-full border bg-secondary text-muted-foreground">
            <UserRound className="size-7" aria-hidden />
          </span>
          <div className="grid gap-1">
            <p className="font-display text-xl">Ancora nessuna referenza</p>
            <p className="max-w-md text-sm text-muted-foreground">
              Aggiungi chi fa quello che fai tu: i suoi social, cosa fa e i video da cui prendere spunto, ognuno con la tua descrizione.
            </p>
          </div>
          <Button onClick={nuova}>
            <Plus aria-hidden /> Aggiungi la prima referenza
          </Button>
        </div>
      ) : null}

      {concorrenti.length > 0 ? (
        <ul className="grid items-stretch gap-4 md:grid-cols-2 xl:grid-cols-3">
          {concorrenti.map((c) => (
            <li key={c.id} className="min-w-0">
              <CardConcorrente concorrente={c} onModifica={(x) => setPopup({ aperto: true, concorrente: x })} />
            </li>
          ))}
        </ul>
      ) : null}

      <ConcorrenteDialog
        clienteId={clienteId}
        aperto={popup.aperto}
        concorrente={popup.concorrente}
        onChiudi={() => setPopup((p) => ({ ...p, aperto: false }))}
      />
    </div>
  );
}
