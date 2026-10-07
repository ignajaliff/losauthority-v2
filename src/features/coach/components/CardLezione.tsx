import { Clock, ExternalLink, PlayCircle } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import type { CapitoloCoach, LezioneCoach } from "../types";

interface CardLezioneProps {
  lezione: LezioneCoach;
  /** Capitolo da cui guardare: il link Skool parte sempre dall'inizio, quindi il minuto lo si dice al cliente. */
  capitolo?: CapitoloCoach | null;
  indice?: number;
}

/** La lezione consigliata dal coach: corso in occhiello, titolo in serif, minuto da cui partire, bottone verso la classroom Skool. */
export function CardLezione({ lezione, capitolo = null, indice = 0 }: CardLezioneProps) {
  return (
    <article
      style={{ animationDelay: `${indice * 120}ms` }}
      className="flex flex-col gap-3 rounded-2xl border border-l-4 border-l-foreground bg-card p-5 shadow-xs transition-shadow animate-in fade-in slide-in-from-bottom-3 fill-mode-both duration-500 motion-reduce:animate-none hover:shadow-sm"
    >
      <div className="flex items-start gap-3">
        <PlayCircle className="mt-0.5 size-5 shrink-0 text-muted-foreground" strokeWidth={1.5} aria-hidden />
        <div className="min-w-0 flex-1">
          {lezione.corso ? <p className="eyebrow truncate text-[10px]">{lezione.corso}</p> : null}
          <h3 className="font-display text-[21px] leading-tight font-medium">{lezione.titolo}</h3>
        </div>
      </div>
      {capitolo ? (
        <p className="flex items-start gap-2 rounded-md bg-muted/60 px-3 py-2 text-[13px] leading-snug">
          <Clock className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" aria-hidden />
          <span>
            <span className="font-medium">
              Vai al minuto <span className="font-mono">{capitolo.tempo}</span>
            </span>
            <span className="text-muted-foreground"> · {capitolo.titolo}</span>
          </span>
        </p>
      ) : null}
      {lezione.url ? (
        <Button size="sm" className="w-fit" nativeButton={false} render={<a href={lezione.url} target="_blank" rel="noopener noreferrer" />}>
          Guarda la lezione su Skool <ExternalLink aria-hidden />
        </Button>
      ) : (
        <p className="text-xs text-muted-foreground">La trovi nella classroom Skool, corso «{lezione.corso ?? "—"}».</p>
      )}
    </article>
  );
}
