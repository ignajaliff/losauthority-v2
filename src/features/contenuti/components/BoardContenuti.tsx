import { useMemo, useState, type DragEvent } from "react";
import { cn } from "@/lib/utils";
import {
  COLORE_STATO_CONTENUTO,
  ETICHETTA_STATO_CONTENUTO,
  STATO_CONTENUTO_KEYS,
  type Contenuto,
  type StatoContenuto,
} from "../types";
import { CardContenuto } from "./CardContenuto";
import { PuntoStato } from "./PuntoStato";

interface BoardContenutiProps {
  contenuti: Contenuto[];
  onApri: (c: Contenuto) => void;
  onSposta: (id: string, stato: StatoContenuto) => void;
}

interface Trascinamento {
  id: string;
  stato: string;
}

/**
 * Pipeline dei contenuti: una colonna per stato, card trascinabili (HTML5
 * drag & drop, nessuna libreria). Sotto md le colonne si impilano e ogni card
 * ha «Sposta in…» (col dito il trascinamento non funziona).
 */
export function BoardContenuti({ contenuti, onApri, onSposta }: BoardContenutiProps) {
  const [trascinato, setTrascinato] = useState<Trascinamento | null>(null);
  const [sopra, setSopra] = useState<StatoContenuto | null>(null);

  const perStato = useMemo(() => {
    const mappa = new Map<StatoContenuto, Contenuto[]>(STATO_CONTENUTO_KEYS.map((s) => [s, []]));
    for (const c of contenuti) mappa.get(c.stato as StatoContenuto)?.push(c);
    return mappa;
  }, [contenuti]);

  function fine() {
    setTrascinato(null);
    setSopra(null);
  }

  function handleDrop(e: DragEvent<HTMLElement>, stato: StatoContenuto) {
    e.preventDefault();
    const id = e.dataTransfer.getData("text/plain") || trascinato?.id;
    const origine = trascinato?.stato ?? contenuti.find((c) => c.id === id)?.stato;
    if (id && origine !== stato) onSposta(id, stato);
    fine();
  }

  return (
    <div className="pb-4 md:-mx-8 md:overflow-x-auto md:px-8">
      <div className="grid gap-3 md:flex md:min-w-max md:items-start md:gap-4">
        {STATO_CONTENUTO_KEYS.map((stato) => {
          const lista = perStato.get(stato) ?? [];
          const bersaglio = sopra === stato && trascinato !== null && trascinato.stato !== stato;
          return (
            <section
              key={stato}
              aria-label={`Colonna ${ETICHETTA_STATO_CONTENUTO[stato]}`}
              onDragOver={(e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = "move";
                if (sopra !== stato) setSopra(stato);
              }}
              onDragLeave={(e) => {
                if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setSopra((s) => (s === stato ? null : s));
              }}
              onDrop={(e) => handleDrop(e, stato)}
              className={cn(
                "flex min-w-0 shrink-0 flex-col rounded-lg border border-t-2 bg-muted/50 transition-colors md:w-64",
                COLORE_STATO_CONTENUTO[stato].bordo,
                bersaglio && "border-primary bg-sidebar-accent",
              )}
            >
              <header className="flex items-center justify-between gap-2 px-3 py-2.5">
                <h3 className="flex items-center gap-2 font-sans text-sm font-medium">
                  <PuntoStato stato={stato} />
                  {ETICHETTA_STATO_CONTENUTO[stato]}
                </h3>
                <span className="figure rounded-full border bg-background px-2 py-0.5 text-xs text-muted-foreground">{lista.length}</span>
              </header>
              <div className="flex flex-1 flex-col gap-2 px-2 pb-2 md:min-h-24">
                {lista.length === 0 ? (
                  <p className="rounded-lg border border-dashed p-3 text-center text-xs text-muted-foreground md:p-4">
                    {bersaglio ? "Rilascia qui" : "Nessun contenuto"}
                  </p>
                ) : (
                  lista.map((c) => (
                    <CardContenuto
                      key={c.id}
                      contenuto={c}
                      inTrascinamento={trascinato?.id === c.id}
                      onApri={onApri}
                      onSposta={(nuovo) => {
                        if (nuovo !== c.stato) onSposta(c.id, nuovo);
                      }}
                      onDragStart={(x) => setTrascinato({ id: x.id, stato: x.stato })}
                      onDragEnd={fine}
                    />
                  ))
                )}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
