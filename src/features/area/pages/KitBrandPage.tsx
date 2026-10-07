import { PaginaInArrivo } from "../components/PaginaInArrivo";

/** /area/cervello/kit-brand → colori, font e tono di voce del brand (contenuto in arrivo). */
export default function KitBrandPage() {
  return (
    <PaginaInArrivo
      occhiello="Cervello del tuo branding"
      indietro={{ to: "/area/cervello", label: "Cervello del tuo branding" }}
      titolo="Kit Brand"
      sottotitolo="Colori, font, tono di voce e tutto quello che rende il tuo brand riconoscibile a colpo d'occhio."
    />
  );
}
