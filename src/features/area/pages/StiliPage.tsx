import { useState } from "react";
import { Link } from "react-router-dom";
import { Plus } from "lucide-react";
import { useAuth } from "@/features/auth";
import { primoNome } from "@/features/scheda";
import { CardStile, CardStileInArrivo, NuovoStileDialog, StileSheet, useCreaStile, useStili, type Stile } from "@/features/idee";
import { PageHeader } from "@/shared/components/layout/PageHeader";
import { ErroreCaricamento, SkeletonBlocco, StatoVuoto } from "@/shared/components/layout/StatoCaricamento";
import { Button } from "@/shared/components/ui/button";

/**
 * /area/stili → gli stili del cliente: format che Aura ha imparato dai suoi
 * script (tabella stili). Ogni carta si richiama poi in Crea idee scrivendo "/".
 */
export default function StiliPage() {
  const { utente } = useAuth();
  const clienteId = utente?.id ?? "";
  const stili = useStili(utente?.id);
  const crea = useCreaStile(clienteId);
  const [nuovo, setNuovo] = useState(false);
  const [aperto, setAperto] = useState<Stile | null>(null);
  /** Titolo della richiesta appena partita: la carta segnaposto resta finché la riga di Aura non arriva. */
  const [inArrivo, setInArrivo] = useState<string | null>(null);

  if (!utente) return null;
  const nome = primoNome(utente.nombre);
  const lista = stili.data ?? [];
  const rigaInCorso = lista.some((s) => s.stato === "in_corso");
  const segnaposto = inArrivo !== null && crea.isPending && !rigaInCorso ? inArrivo : null;
  // Il pannello mostra sempre la versione più fresca dello stile (dopo un salvataggio).
  const stileAperto = aperto ? (lista.find((s) => s.id === aperto.id) ?? null) : null;

  function manda(dati: { titolo: string; script: string[]; note: string | null }) {
    setInArrivo(dati.titolo);
    crea.mutate(dati, { onSettled: () => setInArrivo(null) });
  }
  function riprova(s: Stile) {
    setInArrivo(null);
    crea.mutate({ riprovaId: s.id });
  }

  return (
    <div className="grid gap-2">
      <PageHeader
        occhiello={`Il tuo percorso${nome ? ` · ${nome}` : ""}`}
        titolo="Stili"
        sottotitolo="Ogni stile è un tipo di video che Aura ha imparato dai tuoi script. In «Crea idee» lo richiami scrivendo / e lei scrive nuovi script in quello stile, per il tuo nicho."
        azioni={
          <Button size="sm" onClick={() => setNuovo(true)}>
            <Plus aria-hidden />
            Nuovo stile
          </Button>
        }
      />

      {stili.isLoading ? <SkeletonBlocco altezza="h-64" /> : null}
      {stili.isError ? <ErroreCaricamento /> : null}

      {stili.data && lista.length === 0 && segnaposto === null ? (
        <StatoVuoto
          titolo="Nessuno stile ancora"
          testo="Premi «Nuovo stile», incolla due o tre script di video che ti piacciono (tuoi o di altri) e Aura impara a rifare quello stile per te."
        />
      ) : null}

      {lista.length > 0 || segnaposto !== null ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {segnaposto !== null ? <CardStileInArrivo titolo={segnaposto} /> : null}
          {lista.map((s, i) => (
            <CardStile key={s.id} stile={s} indice={i} occupato={crea.isPending} onApri={setAperto} onRiprova={riprova} />
          ))}
        </div>
      ) : null}

      {lista.length > 0 ? (
        <p className="mt-2 text-xs text-muted-foreground">
          Per usarli vai in{" "}
          <Link to="/area/crea-idee" className="underline underline-offset-4">
            Crea idee
          </Link>{" "}
          e scrivi <span className="font-mono text-foreground">/</span> nel campo del messaggio.
        </p>
      ) : null}

      <NuovoStileDialog open={nuovo} onOpenChange={setNuovo} onInvia={manda} />
      <StileSheet clienteId={clienteId} stile={stileAperto} onChiudi={() => setAperto(null)} />
    </div>
  );
}
