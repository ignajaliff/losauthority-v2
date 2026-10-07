import { Plus } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/features/auth";
import { Button } from "@/shared/components/ui/button";
import { PageHeader } from "@/shared/components/layout/PageHeader";
import { ErroreCaricamento, SkeletonRighe } from "@/shared/components/layout/StatoCaricamento";
import { ContrattiTabella } from "../components/admin/ContrattiTabella";
import { ImpostazioniContratti } from "../components/admin/ImpostazioniContratti";
import { useContratti, useImpostazioniContratti } from "../hooks/useContratti";

/** /contratti → elenco dei contratti (chi vede i soldi) e, per l'admin, le impostazioni del modulo. */
export default function ContrattiPage() {
  const { utente } = useAuth();
  const isAdmin = utente?.rol === "admin";
  const contratti = useContratti();
  const impostazioni = useImpostazioniContratti();

  return (
    <div className="grid gap-6">
      <PageHeader
        titolo="Contratti"
        sottotitolo="Mandi un link, il cliente inserisce i suoi dati e firma. Poi segni il pagamento e attivi il programma."
        azioni={
          isAdmin ? (
            <Button size="sm" nativeButton={false} render={<Link to="/contratti/nuovo" />}>
              <Plus aria-hidden /> Nuovo invito
            </Button>
          ) : null
        }
      />
      {contratti.isLoading ? <SkeletonRighe /> : null}
      {contratti.isError ? <ErroreCaricamento /> : null}
      {contratti.data ? <ContrattiTabella contratti={contratti.data} isAdmin={isAdmin} /> : null}

      {isAdmin && !impostazioni.isLoading ? (
        <section className="grid gap-3 pt-2">
          <h3 className="font-sans text-[15px] font-semibold">Impostazioni</h3>
          {impostazioni.isError ? <ErroreCaricamento /> : <ImpostazioniContratti key={impostazioni.data?.updated_at ?? "vuoto"} impostazioni={impostazioni.data ?? null} />}
        </section>
      ) : null}
    </div>
  );
}
