import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Bookmark, Check, ChevronDown, X } from "lucide-react";
import { TIPOLOGIE_CONTENUTO, type TipologiaContenuto } from "@/features/contenuti";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { cn } from "@/lib/utils";
import { ETICHETTA_STATO_IDEA, eStatoIdea, type Idea } from "../types";

const BORDO_TIPOLOGIA: Record<TipologiaContenuto, string> = {
  virale: "border-l-status-expiring",
  consolidazione: "border-l-muted-foreground/60",
  vendita: "border-l-status-active",
  content_series: "border-l-foreground",
};

function eTipologia(v: string | null): v is TipologiaContenuto {
  return v !== null && v in TIPOLOGIE_CONTENUTO;
}

interface CardIdeaProps {
  idea: Idea;
  indice?: number;
  onSalva: (idea: Idea) => void;
  onScarta: (idea: Idea) => void;
  onWorkflow: (idea: Idea) => void;
  occupato?: boolean;
}

/** Una proposta di Aura: striscia colorata per tipologia, hook in corsivo, script espandibile, azioni. */
export function CardIdea({ idea, indice = 0, onSalva, onScarta, onWorkflow, occupato = false }: CardIdeaProps) {
  const [aperta, setAperta] = useState(false);
  const tipologia = eTipologia(idea.tipologia) ? TIPOLOGIE_CONTENUTO[idea.tipologia] : null;
  const stato = eStatoIdea(idea.stato) ? idea.stato : "proposta";
  const scartata = stato === "scartata";

  return (
    <article
      style={{ animationDelay: `${indice * 120}ms` }}
      className={cn(
        "flex flex-col gap-3 rounded-2xl border border-l-4 bg-card p-5 shadow-xs transition-[opacity,box-shadow] animate-in fade-in slide-in-from-bottom-3 fill-mode-both duration-500 motion-reduce:animate-none hover:shadow-sm",
        eTipologia(idea.tipologia) ? BORDO_TIPOLOGIA[idea.tipologia] : "border-l-border",
        scartata && "opacity-50",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5">
          {tipologia ? <Badge variant={tipologia.tono}>{tipologia.label}</Badge> : null}
          {stato !== "proposta" ? (
            <Badge variant={stato === "usata" ? "active" : "outline"} dot={stato === "usata"}>
              {ETICHETTA_STATO_IDEA[stato]}
            </Badge>
          ) : null}
        </div>
        {!scartata && stato !== "usata" ? (
          <Button size="icon" variant="ghost" className="size-7 text-muted-foreground" aria-label="Scarta idea" disabled={occupato} onClick={() => onScarta(idea)}>
            <X className="size-4" aria-hidden />
          </Button>
        ) : null}
      </div>

      <h3 className="font-sans text-base leading-snug font-semibold">{idea.titolo}</h3>

      {idea.hook ? (
        <p className="font-display text-[19px] leading-snug text-foreground italic">“{idea.hook}”</p>
      ) : null}

      {idea.script ? (
        <div className="grid gap-1.5">
          <p className={cn("text-sm leading-relaxed whitespace-pre-wrap text-muted-foreground", !aperta && "line-clamp-4")}>{idea.script}</p>
          <button
            type="button"
            onClick={() => setAperta((v) => !v)}
            className="inline-flex w-fit items-center gap-1 text-xs font-medium text-foreground underline-offset-4 hover:underline"
          >
            {aperta ? "Riduci" : "Leggi lo script"}
            <ChevronDown className={cn("size-3.5 transition-transform", aperta && "rotate-180")} aria-hidden />
          </button>
        </div>
      ) : null}

      {!scartata ? (
        <div className="mt-auto flex flex-wrap gap-2 pt-1">
          {stato === "proposta" ? (
            <Button size="sm" variant="outline" disabled={occupato} onClick={() => onSalva(idea)}>
              <Bookmark aria-hidden /> Salva
            </Button>
          ) : null}
          {stato === "usata" ? (
            <Button size="sm" variant="outline" render={<Link to="/area/workflow" />}>
              <Check aria-hidden /> Apri il Workflow
            </Button>
          ) : (
            <Button size="sm" disabled={occupato} onClick={() => onWorkflow(idea)}>
              Porta nel Workflow <ArrowRight aria-hidden />
            </Button>
          )}
        </div>
      ) : null}
    </article>
  );
}
