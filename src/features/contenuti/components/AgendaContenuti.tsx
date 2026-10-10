import { useMemo } from "react";
import { format, isSameMonth, isToday, parseISO } from "date-fns";
import { it } from "date-fns/locale";
import { Input } from "@/shared/components/ui/input";
import type { Contenuto } from "../types";
import { PuntoStato } from "./PuntoStato";

interface RigaAgendaProps {
  c: Contenuto;
  onApri: (c: Contenuto) => void;
  onRipianifica: (id: string, data: string | null) => void;
}

/** Sul telefono: il contenuto (clic per aprirlo) e la data prevista, cambiabile senza trascinare. */
export function RigaAgenda({ c, onApri, onRipianifica }: RigaAgendaProps) {
  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => onApri(c)}
        className="flex min-h-10 min-w-0 flex-1 items-center gap-2 rounded-md border bg-card px-3 py-2 text-left text-sm leading-snug hover:border-input"
      >
        <PuntoStato stato={c.stato} />
        <span className="line-clamp-2 min-w-0">{c.titolo}</span>
      </button>
      <Input
        type="date"
        value={c.pubblicazione_prevista ?? ""}
        aria-label={`Data prevista di "${c.titolo}"`}
        className="w-36 shrink-0"
        onChange={(e) => {
          const data = e.target.value || null;
          if (data !== c.pubblicazione_prevista) onRipianifica(c.id, data);
        }}
      />
    </div>
  );
}

interface AgendaContenutiProps {
  mese: Date;
  perGiorno: Map<string, Contenuto[]>;
  onApri: (c: Contenuto) => void;
  onRipianifica: (id: string, data: string | null) => void;
}

/** Il mese come elenco di giorni (solo sotto md, dove la griglia di 7 colonne non ci sta). */
export function AgendaContenuti({ mese, perGiorno, onApri, onRipianifica }: AgendaContenutiProps) {
  const giorni = useMemo(
    () =>
      [...perGiorno.entries()]
        .filter(([chiave]) => isSameMonth(parseISO(chiave), mese))
        .sort(([a], [b]) => a.localeCompare(b)),
    [perGiorno, mese],
  );

  if (giorni.length === 0) {
    return <p className="rounded-lg border border-dashed p-4 text-center text-xs text-muted-foreground md:hidden">Nessun contenuto in questo mese.</p>;
  }

  return (
    <ol className="grid gap-4 md:hidden" aria-label="Contenuti del mese">
      {giorni.map(([chiave, lista]) => {
        const giorno = parseISO(chiave);
        return (
          <li key={chiave} className="grid gap-2">
            <p className="eyebrow flex items-center gap-2 text-[10px]">
              {format(giorno, "EEEE d MMMM", { locale: it })}
              {isToday(giorno) ? (
                <span className="rounded-full bg-primary px-1.5 py-0.5 tracking-normal text-primary-foreground normal-case">Oggi</span>
              ) : null}
            </p>
            {lista.map((c) => (
              <RigaAgenda key={c.id} c={c} onApri={onApri} onRipianifica={onRipianifica} />
            ))}
          </li>
        );
      })}
    </ol>
  );
}
