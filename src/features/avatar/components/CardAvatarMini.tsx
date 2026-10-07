import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { Badge } from "@/shared/components/ui/badge";
import { campiCompilati, codiceAvatar, type Avatar } from "../types";

interface CardAvatarMiniProps {
  avatar: Avatar;
  numero: number;
  indice: number;
}

/** Un avatar nella lista: l'iniziale, il nome, i dati essenziali e lo stato. Apre la carta con la conversazione. */
export function CardAvatarMini({ avatar, numero, indice }: CardAvatarMiniProps) {
  const completo = avatar.stato === "completo";
  const meta = [avatar.eta, avatar.genere, avatar.situazione].filter(Boolean).join(" · ");
  const { fatti, totale } = campiCompilati(avatar);
  return (
    <Link
      to={`/area/cervello/avatar/${avatar.id}`}
      style={{ animationDelay: `${indice * 90}ms` }}
      className="group flex h-full gap-4 rounded-2xl border bg-card p-5 shadow-xs transition-[transform,box-shadow,border-color] duration-300 animate-in fade-in slide-in-from-bottom-2 fill-mode-both hover:-translate-y-0.5 hover:border-foreground/25 hover:shadow-md"
    >
      <div className="grid size-16 shrink-0 place-items-center rounded-md border bg-muted/40 font-display text-[34px] leading-none font-medium" aria-hidden>
        {avatar.nome?.trim().charAt(0).toUpperCase() || <span className="text-muted-foreground/40">?</span>}
      </div>
      <div className="grid min-w-0 flex-1 content-start gap-1.5">
        <div className="flex items-start justify-between gap-2">
          <p className="figure text-[10px] tracking-[0.12em] text-muted-foreground">{codiceAvatar(numero)}</p>
          <Badge variant={completo ? "active" : "neutral"} dot>
            {completo ? "Completo" : `In compilazione · ${fatti}/${totale}`}
          </Badge>
        </div>
        <h3 className="truncate font-display text-[24px] leading-tight font-medium">{avatar.nome ?? "Nuovo avatar"}</h3>
        <p className="truncate text-[13px] text-muted-foreground">{meta || "Aura sta ancora raccogliendo i dati"}</p>
        {avatar.frase ? <p className="mt-1 truncate font-display text-[15px] italic text-foreground/80">«{avatar.frase}»</p> : null}
        <span className="mt-auto inline-flex items-center gap-1 pt-1 text-xs font-medium text-muted-foreground transition-colors group-hover:text-foreground">
          {completo ? "Apri la carta" : "Continua con Aura"}
          <ArrowRight className="size-3.5 transition-transform duration-300 group-hover:translate-x-0.5" aria-hidden />
        </span>
      </div>
    </Link>
  );
}
