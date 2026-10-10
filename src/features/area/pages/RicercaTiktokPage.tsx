import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowLeft, Plus } from "lucide-react";
import { useAuth } from "@/features/auth";
import {
  eInCorso,
  NuovaRicerca,
  prossimaRicerca,
  RisultatoRicerca,
  StoricoRicerche,
  useControllaRicerca,
  useRicerca,
  useRicerche,
} from "@/features/ricerca-tiktok";
import { primoNome } from "@/features/scheda";
import { Button } from "@/shared/components/ui/button";
import { PageHeader } from "@/shared/components/layout/PageHeader";
import { ErroreCaricamento, SkeletonBlocco } from "@/shared/components/layout/StatoCaricamento";

/** setTimeout accetta al massimo 2^31-1 ms (~24,8 giorni): oltre scatterebbe subito. */
const MAX_TIMEOUT_MS = 2 ** 31 - 1;
/** Un secondo dopo lo sblocco, così `prossimaRicerca` lo vede già passato. */
const MARGINE_SBLOCCO_MS = 1000;

/**
 * /area/crea-idee/ricerca-tiktok → i video TikTok con più like degli ultimi 6 mesi su un tema
 * (documento di Wesley «Ricerca TikTok top video»). Una ricerca ogni 15 giorni; i risultati
 * si usano in Crea idee o un video alla volta nel Workflow.
 */
export default function RicercaTiktokPage() {
  const { utente } = useAuth();
  const clienteId = utente?.id ?? "";
  const [searchParams, setSearchParams] = useSearchParams();
  const ricerche = useRicerche(utente?.id);
  const [nuova, setNuova] = useState(false);
  const [adesso, setAdesso] = useState(() => new Date());

  const lista = ricerche.data ?? [];
  // La ricerca aperta: quella dell'URL, altrimenti la più recente.
  const selezionataId = searchParams.get("id") ?? lista[0]?.id ?? null;
  const ricerca = useRicerca(nuova ? null : selezionataId);
  // Il polling segue la ricerca in corso qualunque ricerca sia aperta (anche con «Nuova ricerca»):
  // sono questi controlli a farla avanzare.
  const inCorso = lista.find(eInCorso);
  const controllo = useControllaRicerca(clienteId, inCorso);
  const prossima = prossimaRicerca(lista, adesso);
  const prossimaMs = prossima?.getTime() ?? null;

  // Allo scadere dei 15 giorni `adesso` avanza e il form di una nuova ricerca torna da solo.
  useEffect(() => {
    if (prossimaMs === null) return;
    const attesa = Math.min(Math.max(prossimaMs - Date.now() + MARGINE_SBLOCCO_MS, 0), MAX_TIMEOUT_MS);
    const timer = window.setTimeout(() => setAdesso(new Date()), attesa);
    return () => window.clearTimeout(timer);
  }, [prossimaMs, adesso]);

  if (!utente) return null;
  const nome = primoNome(utente.nombre);
  const mostraNuova = nuova || (ricerche.data !== undefined && lista.length === 0);
  const apertaInCorso = !!ricerca.data && ricerca.data.id === inCorso?.id;

  function apri(id: string) {
    setNuova(false);
    setSearchParams({ id }, { replace: true });
  }

  return (
    <div className="grid gap-7">
      <Link
        to="/area/crea-idee"
        className="inline-flex w-fit items-center gap-1.5 text-[13px] text-muted-foreground transition-colors hover:text-foreground pointer-coarse:-my-2.5 pointer-coarse:py-2.5"
      >
        <ArrowLeft className="size-3.5" aria-hidden /> Crea idee
      </Link>
      <PageHeader
        occhiello={`Crea idee${nome ? ` · ${nome}` : ""}`}
        titolo="Ricerca TikTok"
        sottotitolo="I video con più like degli ultimi 6 mesi sul tuo tema, con i numeri veri e di cosa parlano. Una ricerca ogni 15 giorni: poi usali in Crea idee o portane uno nel Workflow."
        azioni={
          lista.length > 0 && !nuova ? (
            <Button onClick={() => setNuova(true)}>
              <Plus aria-hidden /> Nuova ricerca
            </Button>
          ) : null
        }
      />

      {ricerche.isLoading ? <SkeletonBlocco altezza="h-64" /> : null}
      {ricerche.isError ? <ErroreCaricamento /> : null}

      {ricerche.data ? (
        <div className="grid gap-6">
          {lista.length > 0 ? (
            <StoricoRicerche
              clienteId={clienteId}
              ricerche={lista}
              selezionataId={nuova ? null : selezionataId}
              onApri={apri}
              onEliminata={(id) => {
                if (id === selezionataId) setSearchParams({}, { replace: true });
              }}
            />
          ) : null}
          <div className="min-w-0">
            {mostraNuova ? (
              // onFallita: se l'avvio lascia una ricerca in errore l'elenco non è più vuoto, ma il form (con le keyword) resta.
              <NuovaRicerca clienteId={clienteId} prossima={prossima} onAvviata={apri} onFallita={() => setNuova(true)} />
            ) : (
              <>
                {ricerca.isLoading ? <SkeletonBlocco altezza="h-64" /> : null}
                {ricerca.isError ? <ErroreCaricamento /> : null}
                {ricerca.data ? (
                  <RisultatoRicerca
                    key={ricerca.data.id}
                    clienteId={clienteId}
                    ricerca={ricerca.data}
                    lenta={apertaInCorso && controllo.lenta}
                    erroreControllo={apertaInCorso ? controllo.errore : null}
                    onRiprovaControllo={controllo.riprova}
                  />
                ) : null}
              </>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
