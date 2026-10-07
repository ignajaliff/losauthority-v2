import { useState } from "react";
import { useAuth } from "@/features/auth";
import { CoachVuoto, FlussoCoach, useInviaAlCoach, useLezioniCoach, useMessaggiCoach, type MessaggioCoach } from "@/features/coach";
import { ComposerAura } from "@/features/idee";
import { primoNome } from "@/features/scheda";
import { ErroreCaricamento, SkeletonBlocco } from "@/shared/components/layout/StatoCaricamento";

/**
 * /area/coach → "Wesley Coach": una conversazione continua con Aura che, dal
 * problema raccontato dal cliente, trova la lezione Skool giusta (keywords +
 * descrizione della tabella lezioni) e lo manda a vederla.
 */
export default function WesleyCoachPage() {
  const { utente } = useAuth();
  const clienteId = utente?.id ?? "";
  const [spunto, setSpunto] = useState<string | undefined>(undefined);
  /** Invio in corso: testo del cliente ("" per una riprova) e id della risposta Aura attesa. */
  const [pendente, setPendente] = useState<{ testo: string; auraId: string | null } | null>(null);

  const messaggi = useMessaggiCoach(utente?.id);
  const lista = messaggi.data ?? [];
  const lezioni = useLezioniCoach(lista.flatMap((m) => m.lezioni_ids));
  const invia = useInviaAlCoach(clienteId);

  // Il segnaposto "Aura pensa" resta finché la risposta vera non compare tra i messaggi caricati (derivato, niente effetti).
  const rispostaArrivata = pendente?.auraId != null && lista.some((m) => m.id === pendente.auraId);
  const pendenteVisibile = pendente !== null && !rispostaArrivata ? pendente : null;

  if (!utente) return null;
  const nome = primoNome(utente.nombre);
  const auraScrive = pendenteVisibile !== null || invia.isPending || lista.some((m) => m.stato === "in_corso");
  const vuota = messaggi.data !== undefined && lista.length === 0 && pendenteVisibile === null;

  function manda(testo: string) {
    setPendente({ testo, auraId: null });
    invia.mutate(
      { messaggio: testo },
      {
        onSuccess: (r) => setPendente({ testo, auraId: r.messaggio_id }),
        // Se l'invio fallisce il testo torna nel composer: basta un Invio per rimandarlo.
        onError: () => {
          setPendente(null);
          setSpunto(testo);
        },
      },
    );
  }
  function riprova(m: MessaggioCoach) {
    setPendente({ testo: "", auraId: null });
    invia.mutate({ riprovaId: m.id }, { onSuccess: (r) => setPendente({ testo: "", auraId: r.messaggio_id }), onError: () => setPendente(null) });
  }

  return (
    // Pagina fissa come Crea idee: scorre solo la conversazione, il composer resta a 1rem dal fondo.
    <div className="-mt-4 grid gap-6 md:-mb-16 md:h-[calc(100dvh-var(--header-h)-2.5rem)] md:grid-rows-[minmax(0,1fr)] md:overflow-hidden">
      <section className="flex min-h-0 min-w-0 flex-col" aria-label="Wesley Coach">
        <header className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="eyebrow">Il tuo percorso{nome ? ` · ${nome}` : ""}</p>
            <h2 className="text-[28px] leading-tight">Wesley Coach</h2>
          </div>
          <p className="max-w-[420px] text-[13px] leading-snug text-muted-foreground">
            Dimmi dove sei bloccato: ti indico la lezione giusta della classroom Skool.
          </p>
        </header>

        <div data-chat-scroll className="min-h-0 flex-1 overflow-y-auto px-1 pb-4 [scrollbar-width:thin]" aria-live="polite">
          {messaggi.isLoading ? <SkeletonBlocco altezza="h-48" /> : null}
          {messaggi.isError ? <ErroreCaricamento /> : null}
          {vuota ? <CoachVuoto nome={nome} onSpunto={setSpunto} /> : null}
          {!vuota && messaggi.data ? (
            <FlussoCoach
              messaggi={lista}
              lezioni={lezioni.data ?? []}
              pendente={pendenteVisibile === null ? null : pendenteVisibile.testo}
              occupato={invia.isPending}
              onRiprova={riprova}
            />
          ) : null}
        </div>

        <div className="shrink-0 pt-3">
          <ComposerAura
            inAttesa={auraScrive}
            onInvia={manda}
            suggerito={spunto}
            onSuggeritoUsato={() => setSpunto(undefined)}
            placeholder="Racconta dove sei bloccato o cosa vuoi imparare…"
          />
        </div>
      </section>
    </div>
  );
}
