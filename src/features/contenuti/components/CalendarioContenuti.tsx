import { useMemo, useState, type DragEvent } from "react";
import { addMonths, eachDayOfInterval, endOfMonth, endOfWeek, format, isSameMonth, isToday, startOfMonth, startOfWeek } from "date-fns";
import { it } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { cn } from "@/lib/utils";
import type { Contenuto } from "../types";
import { PuntoStato } from "./PuntoStato";

interface CalendarioContenutiProps {
  contenuti: Contenuto[];
  onApri: (c: Contenuto) => void;
  /** Nuova data prevista ("YYYY-MM-DD") o null se trascinato in "Senza data". */
  onRipianifica: (id: string, data: string | null) => void;
}

const LUNEDI = { weekStartsOn: 1 } as const;
const ISO = "yyyy-MM-dd";

/** Data con cui il contenuto si colloca nel calendario: prevista, altrimenti quella reale. */
function dataDi(c: Contenuto): string | null {
  return c.pubblicazione_prevista ?? c.pubblicato_il;
}

function ChipContenuto({ c, onApri }: { c: Contenuto; onApri: (c: Contenuto) => void }) {
  return (
    <button
      type="button"
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData("text/plain", c.id);
        e.dataTransfer.effectAllowed = "move";
      }}
      onClick={() => onApri(c)}
      title={c.titolo}
      className="flex w-full cursor-grab items-center gap-1.5 rounded-sm border bg-card px-1.5 py-1 text-left text-xs leading-tight hover:border-input active:cursor-grabbing"
    >
      <PuntoStato stato={c.stato} />
      <span className="truncate">{c.titolo}</span>
    </button>
  );
}

/** Vista mensile: i contenuti nel giorno previsto; trascinali per ripianificare. */
export function CalendarioContenuti({ contenuti, onApri, onRipianifica }: CalendarioContenutiProps) {
  const [mese, setMese] = useState(() => startOfMonth(new Date()));
  const [sopra, setSopra] = useState<string | null>(null);

  const giorni = useMemo(
    () => eachDayOfInterval({ start: startOfWeek(mese, LUNEDI), end: endOfWeek(endOfMonth(mese), LUNEDI) }),
    [mese],
  );

  const { perGiorno, senzaData } = useMemo(() => {
    const mappa = new Map<string, Contenuto[]>();
    const liberi: Contenuto[] = [];
    for (const c of contenuti) {
      const d = dataDi(c);
      if (!d) {
        liberi.push(c);
        continue;
      }
      mappa.set(d, [...(mappa.get(d) ?? []), c]);
    }
    return { perGiorno: mappa, senzaData: liberi };
  }, [contenuti]);

  function accetta(e: DragEvent<HTMLElement>, chiave: string) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (sopra !== chiave) setSopra(chiave);
  }

  function rilascia(e: DragEvent<HTMLElement>, data: string | null) {
    e.preventDefault();
    const id = e.dataTransfer.getData("text/plain");
    const attuale = contenuti.find((c) => c.id === id);
    if (attuale && attuale.pubblicazione_prevista !== data) onRipianifica(id, data);
    setSopra(null);
  }

  const titoloMese = format(mese, "LLLL yyyy", { locale: it });

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_220px]">
      <section aria-label="Calendario dei contenuti" className="grid gap-3">
        <header className="flex items-center justify-between gap-2">
          <h3 className="font-display text-2xl font-medium capitalize">{titoloMese}</h3>
          <div className="flex items-center gap-1">
            <Button size="sm" variant="outline" onClick={() => setMese(startOfMonth(new Date()))}>
              Oggi
            </Button>
            <Button size="icon" variant="outline" aria-label="Mese precedente" onClick={() => setMese((m) => addMonths(m, -1))}>
              <ChevronLeft aria-hidden />
            </Button>
            <Button size="icon" variant="outline" aria-label="Mese successivo" onClick={() => setMese((m) => addMonths(m, 1))}>
              <ChevronRight aria-hidden />
            </Button>
          </div>
        </header>

        <div className="-mx-6 overflow-x-auto px-6 md:mx-0 md:px-0">
          <div className="grid min-w-[720px] grid-cols-7 overflow-hidden rounded-lg border bg-border gap-px">
            {giorni.slice(0, 7).map((g) => (
              <div key={g.toISOString()} className="eyebrow bg-muted px-2 py-1.5 text-center text-[10px]">
                {format(g, "EEE", { locale: it })}
              </div>
            ))}
            {giorni.map((g) => {
              const chiave = format(g, ISO);
              const lista = perGiorno.get(chiave) ?? [];
              const nelMese = isSameMonth(g, mese);
              return (
                <div
                  key={chiave}
                  onDragOver={(e) => accetta(e, chiave)}
                  onDragLeave={() => setSopra((s) => (s === chiave ? null : s))}
                  onDrop={(e) => rilascia(e, chiave)}
                  className={cn(
                    "flex min-h-24 flex-col gap-1 p-1.5 transition-colors",
                    nelMese ? "bg-card" : "bg-muted/40 text-muted-foreground",
                    sopra === chiave && "bg-sidebar-accent",
                  )}
                >
                  <span
                    className={cn(
                      "figure self-end text-[11px] leading-none",
                      isToday(g) && "rounded-full bg-primary px-1.5 py-1 text-primary-foreground",
                    )}
                  >
                    {format(g, "d")}
                  </span>
                  {lista.map((c) => (
                    <ChipContenuto key={c.id} c={c} onApri={onApri} />
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <aside
        aria-label="Contenuti senza data"
        onDragOver={(e) => accetta(e, "senza-data")}
        onDragLeave={() => setSopra((s) => (s === "senza-data" ? null : s))}
        onDrop={(e) => rilascia(e, null)}
        className={cn(
          "flex flex-col gap-2 rounded-lg border border-dashed bg-muted/40 p-3 transition-colors",
          sopra === "senza-data" && "border-primary bg-sidebar-accent",
        )}
      >
        <h3 className="eyebrow text-[10px]">Senza data · {senzaData.length}</h3>
        {senzaData.length === 0 ? (
          <p className="text-xs text-muted-foreground">Tutti i contenuti hanno una data. Trascina qui per toglierla.</p>
        ) : (
          senzaData.map((c) => <ChipContenuto key={c.id} c={c} onApri={onApri} />)
        )}
      </aside>
    </div>
  );
}
