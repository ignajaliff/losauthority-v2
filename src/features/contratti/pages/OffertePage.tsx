import { PageHeader } from "@/shared/components/layout/PageHeader";
import { ErroreCaricamento, SkeletonBlocco, StatoVuoto } from "@/shared/components/layout/StatoCaricamento";
import { NuovaOffertaForm, OffertaCard } from "../components/admin/OfferteAdmin";
import { useOfferte } from "../hooks/useOfferte";

/** /offerte → cosa si vende: nome, contratto e prezzo. Solo admin. */
export default function OffertePage() {
  const offerte = useOfferte();
  return (
    <div className="grid gap-6">
      <PageHeader
        titolo="Offerte"
        sottotitolo="Qui decidi cosa vendi: nome, contratto e prezzo. Cambiare un'offerta vale per gli inviti che crei da ora in poi; quelli già mandati tengono il prezzo che avevano."
      />
      {offerte.isLoading ? <SkeletonBlocco /> : null}
      {offerte.isError ? <ErroreCaricamento /> : null}
      {offerte.data && offerte.data.length === 0 ? <StatoVuoto titolo="Nessuna offerta ancora" testo="Crea la prima qui sotto." /> : null}
      {offerte.data && offerte.data.length > 0 ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {offerte.data.map((o) => (
            <OffertaCard key={`${o.id}-${o.updated_at}`} offerta={o} />
          ))}
        </div>
      ) : null}
      <NuovaOffertaForm />
    </div>
  );
}
