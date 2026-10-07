import { ArrowLeft, Plus } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/features/auth";
import { CardOffertaMini, OffertaVuota, useCreaOfferta, useOfferte } from "@/features/offerta";
import { primoNome } from "@/features/scheda";
import { Button } from "@/shared/components/ui/button";
import { PageHeader } from "@/shared/components/layout/PageHeader";
import { ErroreCaricamento, SkeletonBlocco } from "@/shared/components/layout/StatoCaricamento";

/** /area/cervello/offerta → le offerte del cliente; la prima si costruisce parlando con Aura. */
export default function OffertaPage() {
  const { utente } = useAuth();
  const navigate = useNavigate();
  const clienteId = utente?.id ?? "";
  const lista = useOfferte(utente?.id);
  const crea = useCreaOfferta(clienteId);
  const nome = primoNome(utente?.nombre);

  function nuova() {
    crea.mutate(undefined, { onSuccess: (r) => navigate(`/area/cervello/offerta/${r.offerta_id}`) });
  }

  const offerte = lista.data ?? [];
  return (
    <div className="grid gap-7">
      <Link to="/area/cervello" className="inline-flex w-fit items-center gap-1.5 text-[13px] text-muted-foreground transition-colors hover:text-foreground">
        <ArrowLeft className="size-3.5" aria-hidden /> Cervello del tuo branding
      </Link>
      <PageHeader
        occhiello={`Cervello del tuo branding${nome ? ` · ${nome}` : ""}`}
        titolo="Offerta"
        sottotitolo="Cosa vendi, a chi, a che prezzo e perché nessuno può confrontarla. La costruisci con Aura, pezzo per pezzo, e la scarichi in PDF."
        azioni={
          offerte.length > 0 ? (
            <Button onClick={nuova} disabled={crea.isPending}>
              <Plus aria-hidden /> {crea.isPending ? "Aura si prepara…" : "Nuova offerta"}
            </Button>
          ) : null
        }
      />

      {lista.isLoading ? <SkeletonBlocco altezza="h-64" /> : null}
      {lista.isError ? <ErroreCaricamento /> : null}
      {lista.data && offerte.length === 0 ? <OffertaVuota nome={nome} occupato={crea.isPending} onCrea={nuova} /> : null}
      {offerte.length > 0 ? (
        <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {offerte.map((o, i) => (
            <li key={o.id} className="min-w-0">
              <CardOffertaMini offerta={o} numero={i + 1} indice={i} />
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
