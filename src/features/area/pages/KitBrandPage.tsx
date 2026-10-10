import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/features/auth";
import { FasciaColori, IndiceDocumenti, LienzoLogo, SpecimenFont, TestoInLinea, useKitBrand, useSalvaCampoKit } from "@/features/kit-brand";
import { primoNome } from "@/features/scheda";
import { ErroreCaricamento, SkeletonBlocco } from "@/shared/components/layout/StatoCaricamento";
import { formatDate } from "@/shared/utils/formatDate";

/**
 * /area/cervello/kit-brand → il «libro di marca» del cliente, una pagina sola
 * in verticale come un pliego stampato: nome del brand e payoff composti in
 * grande, il logo su un lienzo, la palette come fascia a sangue, la tipografia
 * come campionario, il tono di voce come citazione, i documenti come indice.
 * Tutto si scrive in pagina toccando il testo; niente card, niente popup
 * (solo il selettore di file). Gli agenti di Aura leggono tutto questo.
 */
export default function KitBrandPage() {
  const { utente } = useAuth();
  const clienteId = utente?.id ?? "";
  const nome = primoNome(utente?.nombre);
  const dati = useKitBrand(utente?.id);
  const salva = useSalvaCampoKit(clienteId);
  const kit = dati.data?.kit ?? null;
  const colori = dati.data?.colori ?? [];
  const primario = colori.find((c) => c.ruolo === "primario")?.hex ?? colori[0]?.hex ?? null;
  const vuoto = !!dati.data && !kit && colori.length === 0 && dati.data.font.length === 0 && dati.data.documenti.length === 0;

  return (
    <div className="grid gap-10">
      <Link to="/area/cervello" className="inline-flex w-fit items-center gap-1.5 text-[13px] text-muted-foreground transition-colors hover:text-foreground pointer-coarse:-my-2 pointer-coarse:min-h-9 pointer-coarse:py-2">
        <ArrowLeft className="size-3.5" aria-hidden /> Cervello del tuo branding
      </Link>

      {dati.isLoading ? <SkeletonBlocco altezza="h-[520px]" /> : null}
      {dati.isError ? <ErroreCaricamento /> : null}

      {dati.data ? (
        <>
          {/* Frontespizio: occhiello a sinistra, colophon a destra, poi il nome del brand composto grande. */}
          <header className="grid gap-6">
            <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 border-b pb-3 text-[11px] tracking-[0.18em] text-muted-foreground uppercase">
              <span>Kit Brand{nome ? ` · ${nome}` : ""}</span>
              <span className="figure normal-case tracking-normal">{kit?.updated_at ? `Aggiornato il ${formatDate(kit.updated_at)}` : "Prima stesura"}</span>
            </div>
            <div className="grid gap-3">
              <TestoInLinea
                valore={kit?.nome_brand}
                segnaposto="Il nome del tuo brand"
                etichetta="Nome del brand"
                maxLength={120}
                className="font-display text-[clamp(40px,7vw,96px)] leading-[0.95] tracking-[-0.01em]"
                onSalva={(v) => salva.mutate({ campo: "nome_brand", valore: v })}
              />
              <TestoInLinea
                valore={kit?.payoff}
                segnaposto="Il payoff, la frase che accompagna il nome"
                etichetta="Payoff"
                maxLength={300}
                className="max-w-[60ch] text-[19px] leading-snug text-muted-foreground"
                onSalva={(v) => salva.mutate({ campo: "payoff", valore: v })}
              />
            </div>
            {vuoto ? (
              <p className="max-w-[64ch] text-[14px] leading-relaxed text-muted-foreground">
                Qui vive tutto quello che rende la tua marca riconoscibile: logo, colori, font, tono di voce e i documenti che la raccontano.
                Aura lo legge ogni volta che lavora per te, così non inventa colori o parole che non sono tuoi.
              </p>
            ) : null}
          </header>

          <LienzoLogo clienteId={clienteId} kit={kit} colorePrimario={primario} />

          <FasciaColori clienteId={clienteId} colori={colori} />

          <SpecimenFont clienteId={clienteId} font={dati.data.font} nomeBrand={kit?.nome_brand ?? null} />

          {/* Tono di voce: una citazione lunga, in serif, come l'apertura di un capitolo. */}
          <section aria-labelledby="kit-tono" className="grid gap-4 md:grid-cols-[200px_minmax(0,1fr)] md:gap-10">
            <div className="grid content-start gap-1">
              <h3 id="kit-tono" className="eyebrow text-[10px]">
                Tono di voce
              </h3>
              <p className="text-[12px] text-muted-foreground">Come parla il brand: parole che usa, parole che evita, come si rivolge a chi legge.</p>
            </div>
            <blockquote className="border-l-2 pl-5 md:pl-8">
              <TestoInLinea
                valore={kit?.tono_voce}
                segnaposto="«Diretto ma caldo. Diamo del tu. Niente gergo tecnico, niente punti esclamativi. Parliamo di risultati, mai di promesse.»"
                etichetta="Tono di voce"
                maxLength={4000}
                multiriga
                className="font-display text-[clamp(22px,2.6vw,30px)] leading-[1.35]"
                onSalva={(v) => salva.mutate({ campo: "tono_voce", valore: v })}
              />
            </blockquote>
          </section>

          <IndiceDocumenti clienteId={clienteId} documenti={dati.data.documenti} />

          {/* Note: il colophon in fondo al libro. */}
          <section aria-labelledby="kit-note" className="grid gap-3 border-t pt-6">
            <h3 id="kit-note" className="eyebrow text-[10px]">
              Note
            </h3>
            <TestoInLinea
              valore={kit?.note}
              segnaposto="Tutto il resto che Aura deve sapere sulla marca: regole d'uso del logo, cose da non fare, riferimenti."
              etichetta="Note sul brand"
              maxLength={4000}
              multiriga
              className="max-w-[72ch] text-[15px] leading-relaxed"
              onSalva={(v) => salva.mutate({ campo: "note", valore: v })}
            />
          </section>
        </>
      ) : null}
    </div>
  );
}
