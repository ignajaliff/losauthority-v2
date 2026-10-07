import { useAuth } from "@/features/auth";
import { primoNome } from "@/features/scheda";
import { PageHeader } from "@/shared/components/layout/PageHeader";
import { MappaCervello } from "../components/cervello/MappaCervello";

/** /area/cervello → "Cervello del tuo branding": la mappa con Avatar, Offerta, Concorrenti e Kit Brand. */
export default function CervelloPage() {
  const { utente } = useAuth();
  const nome = primoNome(utente?.nombre);
  return (
    <div className="grid gap-10">
      <PageHeader
        occhiello={`Il tuo percorso${nome ? ` · ${nome}` : ""}`}
        titolo="Cervello del tuo branding"
        sottotitolo="Tutto quello che Aura e Wesley sanno del tuo brand, in un posto solo: da qui nascono idee, script e offerte."
      />
      <MappaCervello />
    </div>
  );
}
