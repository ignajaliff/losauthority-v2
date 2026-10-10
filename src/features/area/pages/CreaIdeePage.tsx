import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { PanelLeftOpen, Plus, TrendingUp } from "lucide-react";
import { useAuth } from "@/features/auth";
import { primoNome } from "@/features/scheda";
import {
  BARRA_COMPOSER,
  ComposerAura,
  FlussoMessaggi,
  RailSessioni,
  SheetIdeeSalvate,
  StudioVuoto,
  useCambiaStatoIdea,
  useIdeeSalvate,
  useInviaAdAura,
  usePortaNelWorkflow,
  useSessione,
  useSessioni,
  useStili,
  type Idea,
  type Messaggio,
} from "@/features/idee";
import { LINK_RICERCA_TIKTOK, useRicerche } from "@/features/ricerca-tiktok";
import { ErroreCaricamento, SkeletonBlocco } from "@/shared/components/layout/StatoCaricamento";
import { Button } from "@/shared/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * /area/crea-idee → lo "studio" di Aura: a sinistra le sessioni, al centro la
 * conversazione con le proposte sotto ogni risposta, in basso il composer.
 * Con "/" nel composer (o arrivando da /area/stili con ?stile=) si aggancia
 * uno stile della pagina Stili: Aura scrive le proposte in quel format.
 * In alto a destra «Ricerca idee social» porta alla subpagina dei video top; da lì
 * «Usa in Crea idee» torna qui con ?ricerca= e la ricerca si aggancia al prossimo messaggio.
 */
export default function CreaIdeePage() {
  const { utente } = useAuth();
  const clienteId = utente?.id ?? "";
  const [searchParams, setSearchParams] = useSearchParams();
  const [sessioneId, setSessioneId] = useState<string | null>(null);
  const [spunto, setSpunto] = useState<string | undefined>(undefined);
  /** Pannello conversazioni: chiuso all'ingresso, la chat prende tutta la larghezza. */
  const [railAperto, setRailAperto] = useState(false);
  /** Stile agganciato al prossimo messaggio (da "/" o dal link "Usa in Crea idee"). */
  const [stileId, setStileId] = useState<string | null>(() => searchParams.get("stile"));
  /** Ricerca TikTok agganciata al prossimo messaggio (dal bottone «Usa in Crea idee»). */
  const [ricercaId, setRicercaId] = useState<string | null>(() => searchParams.get("ricerca"));
  /** Invio in corso: testo del cliente ("" per una riprova), stile e ricerca agganciati e id della risposta Aura attesa. */
  const [pendente, setPendente] = useState<{ testo: string; stileId: string | null; ricercaId: string | null; auraId: string | null } | null>(null);

  const sessioni = useSessioni(utente?.id);
  const sessione = useSessione(sessioneId);
  const salvate = useIdeeSalvate(utente?.id);
  const stili = useStili(utente?.id);
  const ricerche = useRicerche(utente?.id);
  const invia = useInviaAdAura(clienteId);
  const cambia = useCambiaStatoIdea(clienteId);
  const porta = usePortaNelWorkflow(clienteId);

  // ?stile= e ?ricerca= servono solo all'arrivo: li togliamo dall'URL per non riagganciarli a ogni ricarica.
  useEffect(() => {
    if (searchParams.has("stile") || searchParams.has("ricerca")) setSearchParams({}, { replace: true });
  }, [searchParams, setSearchParams]);

  // Il segnaposto "Aura pensa" resta finché la risposta vera non compare tra i messaggi caricati (derivato, niente effetti).
  const rispostaArrivata = pendente?.auraId != null && (sessione.data?.messaggi.some((m) => m.id === pendente.auraId) ?? false);
  const pendenteVisibile = pendente !== null && !rispostaArrivata ? pendente : null;

  if (!utente) return null;
  const nome = primoNome(utente.nombre);
  const occupato = cambia.isPending || porta.isPending;
  const auraScrive = pendenteVisibile !== null || invia.isPending || (sessione.data?.messaggi.some((m) => m.stato === "in_corso") ?? false);
  const listaStili = stili.data ?? [];
  const stileScelto = stileId ? (listaStili.find((s) => s.id === stileId && s.stato === "pronta") ?? null) : null;
  const listaRicerche = ricerche.data ?? [];
  const ricercaScelta = ricercaId ? (listaRicerche.find((r) => r.id === ricercaId && r.stato === "pronta") ?? null) : null;

  function manda(testo: string) {
    const conStile = stileScelto?.id ?? null;
    const conRicerca = ricercaScelta?.id ?? null;
    setPendente({ testo, stileId: conStile, ricercaId: conRicerca, auraId: null });
    setStileId(null);
    setRicercaId(null);
    invia.mutate(
      { sessioneId, messaggio: testo, stileId: conStile, ricercaId: conRicerca },
      {
        onSuccess: (r) => {
          setSessioneId(r.sessione_id);
          setPendente({ testo, stileId: conStile, ricercaId: conRicerca, auraId: r.messaggio_id });
        },
        onError: () => {
          setPendente(null);
          setStileId(conStile);
          setRicercaId(conRicerca);
          // Il testo torna nel composer: non si perde quello che il cliente ha scritto.
          setSpunto(testo);
        },
      },
    );
  }
  function riprova(m: Messaggio) {
    setPendente({ testo: "", stileId: null, ricercaId: null, auraId: null });
    invia.mutate(
      { riprovaId: m.id, sessioneId: m.sessione_id },
      { onSuccess: (r) => setPendente({ testo: "", stileId: null, ricercaId: null, auraId: r.messaggio_id }), onError: () => setPendente(null) },
    );
  }
  const salva = (idea: Idea) => cambia.mutate({ idea, stato: "salvata" });
  const scarta = (idea: Idea) => cambia.mutate({ idea, stato: "scartata" });
  const workflow = (idea: Idea) => porta.mutate(idea);

  // Con un invio in corso su una sessione nuova mostriamo già il flusso, non la schermata vuota.
  const vuota = sessioneId === null && pendenteVisibile === null;
  const messaggi = sessione.data?.messaggi ?? [];
  const idee = sessione.data?.idee ?? [];
  // Una riprova mostra solo Aura che pensa (il messaggio del cliente è già nel flusso).
  const testoPendente = pendenteVisibile === null ? null : pendenteVisibile.testo;
  const stilePendente = pendenteVisibile?.stileId ? (listaStili.find((s) => s.id === pendenteVisibile.stileId)?.titolo ?? null) : null;
  const ricercaPendente = pendenteVisibile?.ricercaId ? (listaRicerche.find((r) => r.id === pendenteVisibile.ricercaId)?.tema ?? null) : null;

  return (
    // Pagina fissa: scorre solo la conversazione. Il main dello shell ha pt-10 + pb-20: con -mt-4 e -mb-16
    // il composer arriva a 1rem dal fondo della finestra e la pagina non scorre.
    // Sul telefono scorre la pagina e il composer resta incollato in basso (sticky); -mb-16 annulla il pb-16 del main.
    <div
      className={cn(
        // grid-rows minmax(0,1fr): la riga è alta quanto il contenitore anche se la chat è lunga (Safari incluso).
        "-mb-16 grid gap-6 md:-mt-4 md:h-[calc(100dvh-var(--header-h)-2.5rem)] md:grid-rows-[minmax(0,1fr)] md:overflow-hidden",
        railAperto && "lg:grid-cols-[220px_minmax(0,1fr)]",
      )}
    >
      {railAperto ? (
        <div className="hidden min-h-0 lg:block">
          <RailSessioni
            sessioni={sessioni.data ?? []}
            correnteId={sessioneId}
            onApri={setSessioneId}
            onNuova={() => setSessioneId(null)}
            onChiudi={() => setRailAperto(false)}
          />
        </div>
      ) : null}

      <section className="flex min-h-0 min-w-0 flex-col" aria-label="Studio di Aura">
        <header className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            {!railAperto ? (
              <Button
                size="icon"
                variant="outline"
                className="hidden text-muted-foreground lg:inline-flex"
                aria-label="Mostra conversazioni"
                title="Mostra conversazioni"
                onClick={() => setRailAperto(true)}
              >
                <PanelLeftOpen aria-hidden />
              </Button>
            ) : null}
            <div>
              <p className="eyebrow">Il tuo percorso{nome ? ` · ${nome}` : ""}</p>
              <h2 className="text-[28px] leading-tight">Crea idee</h2>
            </div>
          </div>
          {/* Su telefono il gruppo va a capo e si stringe (la select per prima): «Salvate» resta visibile. */}
          <div className="flex min-w-0 flex-wrap items-center justify-end gap-2">
            {!railAperto ? (
              <Button size="sm" variant="outline" className="hidden lg:inline-flex" disabled={sessioneId === null} onClick={() => setSessioneId(null)}>
                <Plus aria-hidden /> Nuova sessione
              </Button>
            ) : null}
            <select
              aria-label="Sessione"
              className="h-8 max-w-[180px] min-w-0 flex-1 rounded-sm border bg-card px-2 text-base pointer-coarse:h-9 sm:flex-none md:text-sm lg:hidden"
              value={sessioneId ?? ""}
              onChange={(e) => setSessioneId(e.target.value || null)}
            >
              <option value="">Nuova sessione</option>
              {(sessioni.data ?? []).map((s) => (
                <option key={s.id} value={s.id}>
                  {s.titolo}
                </option>
              ))}
            </select>
            <Button size="sm" variant="outline" nativeButton={false} render={<Link to={LINK_RICERCA_TIKTOK} />} aria-label="Ricerca idee social" title="Ricerca idee social">
              <TrendingUp aria-hidden /> <span className="hidden sm:inline">Ricerca idee social</span>
            </Button>
            <SheetIdeeSalvate idee={salvate.data ?? []} occupato={occupato} onScarta={scarta} onWorkflow={workflow} />
          </div>
        </header>

        <div data-chat-scroll className="min-h-0 flex-1 overflow-y-auto px-1 pb-4 [scrollbar-width:thin]" aria-live="polite">
          {vuota ? <StudioVuoto nome={nome} onSpunto={setSpunto} /> : null}
          {!vuota && sessioneId !== null && sessione.isLoading ? <SkeletonBlocco altezza="h-48" /> : null}
          {!vuota && sessione.isError ? <ErroreCaricamento /> : null}
          {!vuota && (sessione.data || sessioneId === null) ? (
            <FlussoMessaggi
              messaggi={messaggi}
              idee={idee}
              stili={listaStili}
              pendente={testoPendente}
              pendenteStile={stilePendente}
              ricerche={listaRicerche}
              pendenteRicerca={ricercaPendente}
              occupato={occupato}
              onRiprova={riprova}
              onSalva={salva}
              onScarta={scarta}
              onWorkflow={workflow}
            />
          ) : null}
        </div>

        <div className={BARRA_COMPOSER}>
          <ComposerAura
            inAttesa={auraScrive}
            onInvia={manda}
            suggerito={spunto}
            onSuggeritoUsato={() => setSpunto(undefined)}
            stili={listaStili}
            stileScelto={stileScelto}
            onStileChange={(s) => setStileId(s?.id ?? null)}
            ricercaScelta={ricercaScelta}
            onTogliRicerca={() => setRicercaId(null)}
          />
        </div>
      </section>
    </div>
  );
}
