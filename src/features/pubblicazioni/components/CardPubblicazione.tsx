import { useState } from "react";
import { ChevronDown, ExternalLink, Pencil, Plus } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { formatDate } from "@/shared/utils/formatDate";
import { cn } from "@/lib/utils";
import { formatConteggio, formatDelta, formatMomento } from "../format";
import {
  CAMPI_METRICA,
  eInstagram,
  ETICHETTA_CAMPO_METRICA,
  ETICHETTA_PIATTAFORMA,
  piattaformeDi,
  rilevazioniDi,
  type Piattaforma,
  type Pubblicazione,
} from "../types";
import { BadgePiattaforma, IconaPiattaforma } from "./IconaPiattaforma";
import { StoricoMetriche } from "./StoricoMetriche";

interface CardPubblicazioneProps {
  pubblicazione: Pubblicazione;
  onModifica: (p: Pubblicazione) => void;
  onRileva: (p: Pubblicazione, piattaforma: Piattaforma) => void;
  onEliminaRilevazione: (id: string) => void;
  eliminaInCorso: boolean;
}

/** Ultimi numeri di una piattaforma con la differenza rispetto alla rilevazione precedente. */
function RigaPiattaforma({ p, piattaforma, onRileva }: { p: Pubblicazione; piattaforma: Piattaforma; onRileva: () => void }) {
  const serie = rilevazioniDi(p, piattaforma);
  const ultima = serie.at(-1);
  const precedente = serie.at(-2);

  return (
    <div className="grid gap-2 rounded-lg border bg-muted/40 p-3">
      <div className="flex items-center justify-between gap-2 max-sm:flex-wrap max-sm:gap-y-0.5">
        <span className="inline-flex items-center gap-1.5 text-sm font-medium">
          <IconaPiattaforma piattaforma={piattaforma} className="size-4" />
          {ETICHETTA_PIATTAFORMA[piattaforma]}
        </span>
        <span className="text-[11px] text-muted-foreground">
          {ultima ? `Rilevato ${formatMomento(ultima.rilevata_il)}${ultima.origine === "instagram" ? " · automatico" : ""}` : "Nessun dato"}
        </span>
      </div>
      {/* Sul telefono le colonne seguono la larghezza delle etichette: «Visualizzazioni» non finisce sopra «Mi piace». */}
      <dl className="grid grid-cols-[repeat(3,auto)] justify-between gap-2 sm:grid-cols-3 sm:justify-normal">
        {CAMPI_METRICA.map((c) => {
          const delta = ultima ? formatDelta(ultima[c], precedente?.[c]) : null;
          return (
            <div key={c} className="min-w-0">
              <dt className="eyebrow text-[10px] max-sm:tracking-[0.1em]">{ETICHETTA_CAMPO_METRICA[c]}</dt>
              <dd className="figure text-lg leading-tight">{formatConteggio(ultima?.[c])}</dd>
              {delta ? (
                <dd className={cn("text-[11px]", delta.startsWith("+") ? "text-status-active" : "text-muted-foreground")}>
                  {delta} dall'ultima
                </dd>
              ) : null}
            </div>
          );
        })}
      </dl>
      <Button size="sm" variant="outline" className="w-fit" onClick={onRileva}>
        <Plus aria-hidden /> Aggiungi rilevazione
      </Button>
    </div>
  );
}

/** Sottotitolo della carta: data, provenienza e link al post. */
function Provenienza({ p }: { p: Pubblicazione }) {
  const data = p.pubblicata_il ? `Pubblicato il ${formatDate(p.pubblicata_il)}` : "Data di pubblicazione non indicata";
  // L'ultima lettura automatica davvero arrivata (sincronizzata_il segna anche i tentativi a vuoto).
  const ultimaAuto = p.metriche.filter((m) => m.origine === "instagram").at(-1)?.rilevata_il ?? null;
  return (
    <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
      <span>{data}</span>
      {eInstagram(p) && p.url ? (
        <a
          href={p.url}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 underline-offset-4 hover:underline pointer-coarse:-my-2.5 pointer-coarse:py-2.5"
        >
          Apri su Instagram <ExternalLink className="size-3" aria-hidden />
        </a>
      ) : null}
      {eInstagram(p) && ultimaAuto ? <span>· numeri aggiornati {formatMomento(ultimaAuto)}</span> : null}
    </p>
  );
}

/** Carta di una pubblicazione: piattaforme, ultimi numeri per piattaforma, storico espandibile. */
export function CardPubblicazione({ pubblicazione: p, onModifica, onRileva, onEliminaRilevazione, eliminaInCorso }: CardPubblicazioneProps) {
  const [storicoAperto, setStoricoAperto] = useState(false);
  const piattaforme = piattaformeDi(p);

  return (
    <Card>
      <CardHeader className="gap-2">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <CardTitle className="leading-snug">{p.titolo}</CardTitle>
            <Provenienza p={p} />
          </div>
          <Button size="icon" variant="ghost" className="shrink-0 text-muted-foreground" aria-label="Modifica pubblicazione" onClick={() => onModifica(p)}>
            <Pencil aria-hidden />
          </Button>
        </div>
        {piattaforme.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {piattaforme.map((x) => (
              <BadgePiattaforma key={x} piattaforma={x} />
            ))}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">Indica dove l'hai pubblicato per caricare i numeri.</p>
        )}
      </CardHeader>
      {piattaforme.length > 0 ? (
        <CardContent className="grid gap-3">
          {piattaforme.map((x) => (
            <RigaPiattaforma key={x} p={p} piattaforma={x} onRileva={() => onRileva(p, x)} />
          ))}
        </CardContent>
      ) : null}
      {p.metriche.length > 0 ? (
        <CardFooter className="flex-col items-stretch gap-2 border-t pt-4">
          <button
            type="button"
            onClick={() => setStoricoAperto((v) => !v)}
            aria-expanded={storicoAperto}
            className="flex items-center justify-between text-sm font-medium pointer-coarse:-my-2 pointer-coarse:min-h-10"
          >
            Storico rilevazioni · {p.metriche.length}
            <ChevronDown className={cn("size-4 text-muted-foreground transition-transform", storicoAperto && "rotate-180")} aria-hidden />
          </button>
          {storicoAperto ? (
            <div className="-mx-2 overflow-x-auto">
              <StoricoMetriche pubblicazione={p} onElimina={onEliminaRilevazione} eliminaInCorso={eliminaInCorso} />
            </div>
          ) : null}
        </CardFooter>
      ) : null}
    </Card>
  );
}
