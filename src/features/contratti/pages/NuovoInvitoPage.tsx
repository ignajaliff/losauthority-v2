import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { PageHeader } from "@/shared/components/layout/PageHeader";
import { ErroreCaricamento, SkeletonBlocco } from "@/shared/components/layout/StatoCaricamento";
import { NuovoInvitoForm } from "../components/admin/NuovoInvitoForm";
import { useImpostazioniContratti } from "../hooks/useContratti";
import { useOfferte } from "../hooks/useOfferte";

/** /contratti/nuovo → nuovo invito: si sceglie l'offerta e si ottiene il link personale da mandare al cliente. Solo admin. */
export default function NuovoInvitoPage() {
  const offerte = useOfferte();
  const impostazioni = useImpostazioniContratti();
  return (
    <div className="mx-auto grid max-w-[560px] gap-5">
      <Link to="/contratti" className="inline-flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" aria-hidden /> Contratti
      </Link>
      <PageHeader titolo="Nuovo invito" sottotitolo="Scegli l'offerta e ottieni un link personale. Lo mandi al cliente: compila, legge e firma da lì." />
      {offerte.isLoading || impostazioni.isLoading ? <SkeletonBlocco /> : null}
      {offerte.isError ? <ErroreCaricamento /> : null}
      {offerte.data && !impostazioni.isLoading ? <NuovoInvitoForm offerte={offerte.data} haFirma={!!impostazioni.data?.firma} /> : null}
    </div>
  );
}
