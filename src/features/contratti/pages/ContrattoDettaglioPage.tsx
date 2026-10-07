import { ArrowLeft } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/features/auth";
import { ErroreCaricamento, SkeletonBlocco, StatoVuoto } from "@/shared/components/layout/StatoCaricamento";
import { ContrattoDettaglio } from "../components/admin/ContrattoDettaglio";
import { useContratto } from "../hooks/useContratti";

/** /contratti/:id → la scheda di un contratto: link, dati, firma, pagamento, attivazione. */
export default function ContrattoDettaglioPage() {
  const { id } = useParams<{ id: string }>();
  const { utente } = useAuth();
  const navigate = useNavigate();
  const contratto = useContratto(id);

  return (
    <div className="grid gap-5">
      <Link to="/contratti" className="inline-flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" aria-hidden /> Contratti
      </Link>
      {contratto.isLoading ? <SkeletonBlocco altezza="h-64" /> : null}
      {contratto.isError ? <ErroreCaricamento /> : null}
      {contratto.data === null ? <StatoVuoto titolo="Contratto non trovato" testo="Forse è stato eliminato." /> : null}
      {contratto.data ? <ContrattoDettaglio c={contratto.data} isAdmin={utente?.rol === "admin"} onEliminato={() => navigate("/contratti", { replace: true })} /> : null}
    </div>
  );
}
