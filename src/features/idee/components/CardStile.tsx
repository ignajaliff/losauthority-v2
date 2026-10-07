import { Link } from "react-router-dom";
import { ArrowRight, RotateCcw, ScrollText } from "lucide-react";
import { AuraSfera } from "@/shared/components/brand/AuraSfera";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { formatDateShort } from "@/shared/utils/formatDate";
import { cn } from "@/lib/utils";
import { eStatoStile, linkCreaIdee, type Stile } from "../types";

interface CardStileProps {
  stile: Stile;
  indice?: number;
  occupato?: boolean;
  onApri: (stile: Stile) => void;
  onRiprova: (stile: Stile) => void;
}

/** Uno stile nella griglia della pagina Stili: nome in serif, descrizione di Aura, stato, azioni. */
export function CardStile({ stile, indice = 0, occupato = false, onApri, onRiprova }: CardStileProps) {
  const stato = eStatoStile(stile.stato) ? stile.stato : "pronta";
  const nScript = stile.script_fonte.length;

  return (
    <article
      style={{ animationDelay: `${indice * 80}ms` }}
      className={cn(
        "flex flex-col gap-3 rounded-2xl border bg-card p-5 shadow-xs transition-shadow animate-in fade-in slide-in-from-bottom-3 fill-mode-both duration-500 motion-reduce:animate-none hover:shadow-sm",
        stato === "errore" && "border-status-churn/40",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5">
          {stato === "in_corso" ? <Badge variant="expiring" dot>Aura sta studiando</Badge> : null}
          {stato === "errore" ? <Badge variant="churn">Non riuscito</Badge> : null}
          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
            <ScrollText className="size-3.5" aria-hidden />
            {nScript === 1 ? "1 script" : `${nScript} script`}
          </span>
        </div>
        <span className="text-[11px] text-muted-foreground">{formatDateShort(stile.created_at)}</span>
      </div>

      <h3 className="font-display text-[24px] leading-tight font-medium">{stile.titolo}</h3>

      {stato === "in_corso" ? (
        <div className="flex items-center gap-2.5" role="status" aria-live="polite">
          <AuraSfera dimensione={24} conNome={false} parla />
          <p className="font-display text-[15px] text-muted-foreground italic">Leggo i tuoi script e scrivo come rifarli nel tuo nicho…</p>
        </div>
      ) : null}

      {stato === "errore" ? (
        <p className="text-sm text-muted-foreground">
          Aura non è riuscita a scrivere questo stile{stile.errore ? ` (${stile.errore.toLowerCase()})` : ""}.
        </p>
      ) : null}

      {stato === "pronta" ? (
        <p className="line-clamp-3 text-sm leading-relaxed text-muted-foreground">
          {stile.descrizione ?? stile.istruzioni.slice(0, 220)}
        </p>
      ) : null}

      <div className="mt-auto flex flex-wrap gap-2 pt-1">
        {stato === "errore" ? (
          <Button size="sm" variant="outline" disabled={occupato} onClick={() => onRiprova(stile)}>
            <RotateCcw aria-hidden /> Riprova
          </Button>
        ) : null}
        {stato !== "in_corso" ? (
          <Button size="sm" variant="outline" onClick={() => onApri(stile)}>
            Apri
          </Button>
        ) : null}
        {stato === "pronta" ? (
          <Button size="sm" nativeButton={false} render={<Link to={linkCreaIdee(stile.id)} />}>
            Usa in Crea idee <ArrowRight aria-hidden />
          </Button>
        ) : null}
      </div>
    </article>
  );
}

/** Segnaposto mentre la richiesta parte e la riga di Aura non è ancora arrivata dal server. */
export function CardStileInArrivo({ titolo }: { titolo: string }) {
  return (
    <article className="flex flex-col gap-3 rounded-2xl border border-dashed bg-card/60 p-5 animate-in fade-in duration-300 motion-reduce:animate-none">
      <Badge variant="expiring" dot>Aura sta studiando</Badge>
      <h3 className="font-display text-[24px] leading-tight font-medium">{titolo}</h3>
      <div className="flex items-center gap-2.5" role="status" aria-live="polite">
        <AuraSfera dimensione={24} conNome={false} parla />
        <p className="font-display text-[15px] text-muted-foreground italic">Mando i tuoi script ad Aura…</p>
      </div>
    </article>
  );
}
