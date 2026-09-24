import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { PageHeader } from "@/shared/components/layout/PageHeader";
import { ErroreCaricamento, SkeletonBlocco, StatoVuoto } from "@/shared/components/layout/StatoCaricamento";
import { Input } from "@/shared/components/ui/input";
import { CardCorso } from "../components/CardCorso";
import { CardSincronizzazione } from "../components/CardSincronizzazione";
import { useCatalogoLezioni, useSincronizzaSkool, useStatoSyncSkool } from "../hooks/useLezioni";
import { CORSO_SENZA_CAPITOLO, type GruppoCorso, type Lezione } from "../types";

function corrisponde(l: Lezione, q: string): boolean {
  if (!q) return true;
  return (
    l.titolo.toLowerCase().includes(q) ||
    (l.descrizione ?? "").toLowerCase().includes(q) ||
    l.keywords.some((k) => k.toLowerCase().includes(q))
  );
}

function raggruppaPerCorso(lezioni: Lezione[]): GruppoCorso[] {
  const mappa = new Map<string, Lezione[]>();
  for (const l of lezioni) {
    const corso = l.corso ?? CORSO_SENZA_CAPITOLO;
    const lista = mappa.get(corso);
    if (lista) lista.push(l);
    else mappa.set(corso, [l]);
  }
  return [...mappa.entries()].map(([corso, lista]) => ({ corso, lezioni: lista }));
}

export default function LezioniPage() {
  const catalogo = useCatalogoLezioni();
  const sync = useStatoSyncSkool();
  const sincronizza = useSincronizzaSkool();
  const [ricerca, setRicerca] = useState("");

  const lezioni = useMemo(() => catalogo.data ?? [], [catalogo.data]);
  const gruppi = useMemo(() => {
    const q = ricerca.trim().toLowerCase();
    return raggruppaPerCorso(lezioni.filter((l) => corrisponde(l, q)));
  }, [lezioni, ricerca]);

  return (
    <div className="mx-auto grid max-w-4xl gap-4">
      <PageHeader titolo="Lezioni" sottotitolo="Catalogo Skool usato da Aura per collegare compiti e lezioni." />

      <CardSincronizzazione
        stato={sync.data}
        caricamento={sync.isLoading}
        totaleCatalogo={lezioni.length}
        inCorso={sincronizza.isPending}
        onSincronizza={() => sincronizza.mutate()}
      />
      {sync.isError ? <ErroreCaricamento messaggio="Stato della sincronizzazione non disponibile." /> : null}

      {catalogo.isLoading ? <SkeletonBlocco /> : null}
      {catalogo.isError ? <ErroreCaricamento /> : null}

      {catalogo.data && lezioni.length === 0 ? (
        <StatoVuoto titolo="Catalogo vuoto: lancia la prima sincronizzazione" />
      ) : null}

      {lezioni.length > 0 ? (
        <>
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
            <Input
              type="search"
              aria-label="Cerca nelle lezioni"
              placeholder="Cerca per titolo, descrizione o parola chiave…"
              className="pl-8"
              value={ricerca}
              onChange={(e) => setRicerca(e.target.value)}
            />
          </div>
          {gruppi.length === 0 ? (
            <StatoVuoto titolo="Nessuna lezione corrisponde alla ricerca" />
          ) : (
            gruppi.map((g) => <CardCorso key={g.corso} gruppo={g} />)
          )}
          <p className="text-xs text-muted-foreground">
            {lezioni.length} lezioni disponibili ad Aura quando genera i compiti.
          </p>
        </>
      ) : null}
    </div>
  );
}
