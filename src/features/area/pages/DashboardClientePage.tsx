import { useAuth } from "@/features/auth";
import { primoNome } from "@/features/scheda";
import { PageHeader } from "@/shared/components/layout/PageHeader";
import { LineaTempoPiano } from "../components/piano/LineaTempoPiano";

/** /area/dashboard → prima di tutto il piano d'azione, come linea del tempo di tappe da spuntare. */
export default function DashboardClientePage() {
  const { utente } = useAuth();
  if (!utente) return null;
  const nome = primoNome(utente.nombre);
  return (
    <div className="grid gap-7">
      <PageHeader occhiello={`Il tuo percorso${nome ? ` · ${nome}` : ""}`} titolo="Dashboard" sottotitolo="Il tuo piano d'azione, una tappa alla volta." />
      <LineaTempoPiano clienteId={utente.id} />
    </div>
  );
}
