import { Trash2 } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/components/ui/table";
import { formatConteggio, formatDelta, formatMomento } from "../format";
import {
  CAMPI_METRICA,
  ETICHETTA_CAMPO_METRICA,
  ETICHETTA_PIATTAFORMA,
  ePiattaforma,
  eRilevazioneAutomatica,
  type Metrica,
  type Pubblicazione,
} from "../types";

interface StoricoMetricheProps {
  pubblicazione: Pubblicazione;
  onElimina: (id: string) => void;
  eliminaInCorso: boolean;
}

/** Tutte le rilevazioni, dalla più recente, con la differenza rispetto alla precedente della stessa piattaforma. */
export function StoricoMetriche({ pubblicazione, onElimina, eliminaInCorso }: StoricoMetricheProps) {
  const cronologico = pubblicazione.metriche; // già dalla più vecchia
  const precedenteDi = new Map<string, Metrica | undefined>();
  const ultimaPer = new Map<string, Metrica>();
  for (const m of cronologico) {
    precedenteDi.set(m.id, ultimaPer.get(m.piattaforma));
    ultimaPer.set(m.piattaforma, m);
  }
  const righe = [...cronologico].reverse();

  if (righe.length === 0) {
    return <p className="px-1 py-3 text-sm text-muted-foreground">Nessuna rilevazione ancora.</p>;
  }

  const dove = (m: Metrica) => (ePiattaforma(m.piattaforma) ? ETICHETTA_PIATTAFORMA[m.piattaforma] : m.piattaforma);
  const elimina = (m: Metrica, className: string) =>
    eRilevazioneAutomatica(m) ? null : (
      <Button
        size="icon"
        variant="ghost"
        className={className}
        aria-label="Elimina rilevazione"
        disabled={eliminaInCorso}
        onClick={() => onElimina(m.id)}
      >
        <Trash2 className="size-3.5" aria-hidden />
      </Button>
    );

  return (
    <>
      {/* Telefono: una scheda per rilevazione al posto della tabella a sei colonne. */}
      <ul className="grid divide-y px-2 sm:hidden">
        {righe.map((m) => {
          const prec = precedenteDi.get(m.id);
          return (
            <li key={m.id} className="grid gap-1.5 py-2.5">
              <div className="flex min-h-9 items-center justify-between gap-2">
                <p className="text-xs text-muted-foreground">
                  {formatMomento(m.rilevata_il)} · <span className="text-foreground">{dove(m)}</span>
                  {eRilevazioneAutomatica(m) ? <span className="text-[10px]"> · auto</span> : null}
                </p>
                {elimina(m, "-mr-2 text-muted-foreground hover:text-destructive")}
              </div>
              <dl className="grid grid-cols-[repeat(3,auto)] justify-between gap-2">
                {CAMPI_METRICA.map((c) => {
                  const delta = formatDelta(m[c], prec?.[c]);
                  return (
                    <div key={c} className="min-w-0">
                      <dt className="eyebrow text-[10px] tracking-[0.1em]">{ETICHETTA_CAMPO_METRICA[c]}</dt>
                      <dd>
                        <span className="figure text-sm">{formatConteggio(m[c])}</span>
                        {delta ? <span className="ml-1.5 text-[11px] text-muted-foreground">{delta}</span> : null}
                      </dd>
                    </div>
                  );
                })}
              </dl>
            </li>
          );
        })}
      </ul>
      <div className="hidden sm:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Quando</TableHead>
              <TableHead>Dove</TableHead>
              {CAMPI_METRICA.map((c) => (
                <TableHead key={c} className="text-right">
                  {ETICHETTA_CAMPO_METRICA[c]}
                </TableHead>
              ))}
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {righe.map((m) => {
              const prec = precedenteDi.get(m.id);
              return (
                <TableRow key={m.id}>
                  <TableCell className="whitespace-nowrap text-xs text-muted-foreground">{formatMomento(m.rilevata_il)}</TableCell>
                  <TableCell className="text-xs">
                    {dove(m)}
                    {eRilevazioneAutomatica(m) ? <span className="ml-1 text-[10px] text-muted-foreground">· auto</span> : null}
                  </TableCell>
                  {CAMPI_METRICA.map((c) => {
                    const delta = formatDelta(m[c], prec?.[c]);
                    return (
                      <TableCell key={c} className="text-right">
                        <span className="figure text-sm">{formatConteggio(m[c])}</span>
                        {delta ? <span className="ml-1.5 text-[11px] text-muted-foreground">{delta}</span> : null}
                      </TableCell>
                    );
                  })}
                  <TableCell>{elimina(m, "size-7 text-muted-foreground hover:text-destructive pointer-coarse:size-9")}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
