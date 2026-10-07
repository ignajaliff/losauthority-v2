import { ArrowRight, Tag } from "lucide-react";
import { Link } from "react-router-dom";
import { Badge } from "@/shared/components/ui/badge";
import { campiCompilati, codiceOfferta, ETICHETTA_POSIZIONAMENTO, type Offerta } from "../types";

interface CardOffertaMiniProps {
  offerta: Offerta;
  numero: number;
  indice: number;
}

/** Un'offerta nella lista: nome, per chi, prezzo e stato. Apre la carta con la conversazione. */
export function CardOffertaMini({ offerta, numero, indice }: CardOffertaMiniProps) {
  const completa = offerta.stato === "completo";
  const { fatti, totale } = campiCompilati(offerta);
  const meta = [offerta.prezzo, offerta.posizionamento ? ETICHETTA_POSIZIONAMENTO[offerta.posizionamento] : null, offerta.tipo].filter(Boolean).join(" · ");
  return (
    <Link
      to={`/area/cervello/offerta/${offerta.id}`}
      style={{ animationDelay: `${indice * 90}ms` }}
      className="group flex h-full gap-4 rounded-2xl border bg-card p-5 shadow-xs transition-[transform,box-shadow,border-color] duration-300 animate-in fade-in slide-in-from-bottom-2 fill-mode-both hover:-translate-y-0.5 hover:border-foreground/25 hover:shadow-md"
    >
      <div className="grid size-16 shrink-0 place-items-center rounded-md border bg-muted/40 text-foreground" aria-hidden>
        <Tag className="size-7" strokeWidth={1.25} />
      </div>
      <div className="grid min-w-0 flex-1 content-start gap-1.5">
        <div className="flex items-start justify-between gap-2">
          <p className="figure text-[10px] tracking-[0.12em] text-muted-foreground">{codiceOfferta(numero)}</p>
          <Badge variant={completa ? "active" : "neutral"} dot>
            {completa ? "Completa" : `In costruzione · ${fatti}/${totale}`}
          </Badge>
        </div>
        <h3 className="line-clamp-2 font-display text-[22px] leading-tight font-medium">{offerta.nome ?? "Nuova offerta"}</h3>
        <p className="truncate text-[13px] text-muted-foreground">{meta || offerta.per_chi || "Aura sta ancora raccogliendo i dati"}</p>
        {offerta.trasformazione ? <p className="mt-1 line-clamp-2 font-display text-[15px] italic text-foreground/80">«{offerta.trasformazione}»</p> : null}
        <span className="mt-auto inline-flex items-center gap-1 pt-1 text-xs font-medium text-muted-foreground transition-colors group-hover:text-foreground">
          {completa ? "Apri la carta" : "Continua con Aura"}
          <ArrowRight className="size-3.5 transition-transform duration-300 group-hover:translate-x-0.5" aria-hidden />
        </span>
      </div>
    </Link>
  );
}
