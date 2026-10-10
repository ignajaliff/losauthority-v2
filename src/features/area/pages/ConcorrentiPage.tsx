import { useState } from "react";
import { ArrowLeft, Plus, UserRound } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/features/auth";
import { CardConcorrente, ConcorrenteDialog, TIPI_CONCORRENTE, useConcorrenti, type Concorrente, type TipoConcorrente } from "@/features/concorrenti";
import { primoNome } from "@/features/scheda";
import { Button } from "@/shared/components/ui/button";
import { PageHeader } from "@/shared/components/layout/PageHeader";
import { ErroreCaricamento, SkeletonBlocco } from "@/shared/components/layout/StatoCaricamento";

/** Il popup tiene la referenza anche mentre si chiude, così il titolo non cambia durante l'animazione. */
interface Popup {
  aperto: boolean;
  concorrente: Concorrente | null;
  tipo?: TipoConcorrente;
}

/**
 * /area/cervello/concorrenti → «Competitors»: le referenze del cliente divise in due
 * sezioni, Competitor (chi fa quello che fa lui) e Ispirazioni (profili da cui prendere spunto).
 * Una carta alta per referenza (logo, nome, fino a 3 social, cosa fa, video con descrizione).
 */
export default function ConcorrentiPage() {
  const { utente } = useAuth();
  const clienteId = utente?.id ?? "";
  const lista = useConcorrenti(utente?.id);
  const [popup, setPopup] = useState<Popup>({ aperto: false, concorrente: null });
  const nome = primoNome(utente?.nombre);
  const concorrenti = lista.data ?? [];
  const nuova = (tipo?: TipoConcorrente) => setPopup({ aperto: true, concorrente: null, tipo });

  return (
    <div className="grid gap-7">
      <Link to="/area/cervello" className="inline-flex w-fit items-center gap-1.5 text-[13px] text-muted-foreground transition-colors hover:text-foreground pointer-coarse:-my-2 pointer-coarse:min-h-9 pointer-coarse:py-2">
        <ArrowLeft className="size-3.5" aria-hidden /> Cervello del tuo branding
      </Link>
      <PageHeader
        occhiello={`Cervello del tuo branding${nome ? ` · ${nome}` : ""}`}
        titolo="Competitors"
        sottotitolo="Chi fa quello che fai tu e i profili che ti ispirano: dove li trovi, cosa fanno e i video che ti servono da esempio, con quello che c'è dentro."
        azioni={
          concorrenti.length > 0 ? (
            <Button onClick={() => nuova()}>
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
              Aggiungi un competitor o un profilo che ti ispira: i suoi social, cosa fa e i video da cui prendere spunto, ognuno con la tua descrizione.
            </p>
          </div>
          <Button onClick={() => nuova()}>
            <Plus aria-hidden /> Aggiungi la prima referenza
          </Button>
        </div>
      ) : null}

      {concorrenti.length > 0
        ? TIPI_CONCORRENTE.map((t) => {
            const carte = concorrenti.filter((c) => (c.tipo === "ispirazione" ? "ispirazione" : "competitor") === t.valore);
            return (
              <section key={t.valore} className="grid gap-4" aria-labelledby={`sezione-${t.valore}`}>
                <div className="flex flex-wrap items-end justify-between gap-2 border-b pb-2">
                  <div>
                    <h3 id={`sezione-${t.valore}`} className="text-[22px] leading-tight">
                      {t.plurale} <span className="figure text-sm text-muted-foreground">· {carte.length}</span>
                    </h3>
                    <p className="text-sm text-muted-foreground">{t.testo}</p>
                  </div>
                  <Button size="sm" variant="ghost" className="text-muted-foreground" onClick={() => nuova(t.valore)}>
                    <Plus aria-hidden /> Aggiungi
                  </Button>
                </div>
                {carte.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nessuna referenza in questa sezione.</p>
                ) : (
                  <ul className="grid items-stretch gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {carte.map((c) => (
                      <li key={c.id} className="min-w-0">
                        <CardConcorrente concorrente={c} onModifica={(x) => setPopup({ aperto: true, concorrente: x })} />
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            );
          })
        : null}

      <ConcorrenteDialog
        clienteId={clienteId}
        aperto={popup.aperto}
        concorrente={popup.concorrente}
        tipoIniziale={popup.tipo}
        onChiudi={() => setPopup((p) => ({ ...p, aperto: false }))}
      />
    </div>
  );
}
