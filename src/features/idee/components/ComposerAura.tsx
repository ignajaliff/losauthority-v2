import { useState, type KeyboardEvent } from "react";
import { ArrowUp, Palette, TrendingUp, X } from "lucide-react";
import { AuraSfera } from "@/shared/components/brand/AuraSfera";
import { Button } from "@/shared/components/ui/button";
import { cn } from "@/lib/utils";
import type { Stile } from "../types";
import { MenuStili } from "./MenuStili";

interface ComposerAuraProps {
  inAttesa: boolean;
  onInvia: (testo: string) => void;
  /** Testo da inserire dall'esterno (spunti). */
  suggerito?: string;
  onSuggeritoUsato?: () => void;
  /** Stili pronti del cliente: si richiamano scrivendo "/". */
  stili?: Stile[];
  stileScelto?: Stile | null;
  onStileChange?: (stile: Stile | null) => void;
  /** Ricerca TikTok agganciata al prossimo messaggio («Usa in Crea idee»): solo il tema per la chip. */
  ricercaScelta?: { tema: string } | null;
  onTogliRicerca?: () => void;
  /** Testo guida del campo quando è vuoto (default: quello di Crea idee). */
  placeholder?: string;
  className?: string;
}

const PLACEHOLDER_IDEE = "Racconta l'idea, incolla un link di riferimento…";

/**
 * Il contenitore del composer nelle pagine chat (Crea idee, Wesley Coach). Da md la pagina ha altezza
 * fissa e il composer sta in fondo da solo; sul telefono scorre la pagina e il composer resta incollato
 * al fondo dello schermo, con lo sfondo che sfuma sopra i messaggi che gli passano dietro.
 */
export const BARRA_COMPOSER =
  "sticky bottom-0 z-10 shrink-0 bg-linear-to-t from-background from-70% to-transparent pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] md:static md:z-auto md:bg-none md:pb-0";

/** La X delle chip: sul touch l'area di tocco arriva a 36px senza cambiare l'altezza della chip. */
const X_CHIP =
  "rounded-full p-0.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground pointer-coarse:-my-[11px] pointer-coarse:-mr-1 pointer-coarse:p-[11px]";

const MAX = 4000;

/** "/" all'inizio, senza a capo → il testo dopo la barra è la ricerca tra gli stili. */
function queryComando(testo: string): string | null {
  if (!testo.startsWith("/") || testo.includes("\n")) return null;
  return testo.slice(1).trim().toLowerCase();
}

/** Barra di scrittura: Aura respira accanto al campo e "parla" mentre lavora. Invio manda, Shift+Invio a capo, "/" richiama uno stile. */
export function ComposerAura({
  inAttesa,
  onInvia,
  suggerito,
  onSuggeritoUsato,
  stili = [],
  stileScelto = null,
  onStileChange,
  ricercaScelta = null,
  onTogliRicerca,
  placeholder = PLACEHOLDER_IDEE,
  className,
}: ComposerAuraProps) {
  const [testo, setTesto] = useState("");
  const [attiva, setAttiva] = useState(0);

  if (suggerito && testo !== suggerito) {
    setTesto(suggerito);
    onSuggeritoUsato?.();
  }

  const query = onStileChange ? queryComando(testo) : null;
  const pronti = stili.filter((s) => s.stato === "pronta");
  const voci = query === null ? [] : pronti.filter((s) => `${s.titolo} ${s.descrizione ?? ""}`.toLowerCase().includes(query));
  const menuAperto = query !== null;
  const indiceAttivo = Math.min(attiva, Math.max(voci.length - 1, 0));
  const testoGuida = inAttesa
    ? "Aura sta pensando…"
    : stileScelto
      ? `Di cosa parla il video in stile «${stileScelto.titolo}»?`
      : ricercaScelta
        ? `Cosa vuoi creare partendo dalla ricerca «${ricercaScelta.tema}»?`
        : onStileChange
          ? `${placeholder.replace(/…$/, "")}, scrivi / per usare un tuo stile…`
          : placeholder;

  function scegli(s: Stile) {
    onStileChange?.(s);
    setTesto("");
    setAttiva(0);
  }

  function invia() {
    const t = testo.trim();
    if (t.length < 3 || inAttesa || menuAperto) return;
    onInvia(t);
    setTesto("");
  }

  function onKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (menuAperto) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setAttiva((i) => Math.min(i + 1, Math.max(voci.length - 1, 0)));
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setAttiva((i) => Math.max(i - 1, 0));
        return;
      }
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        if (voci[indiceAttivo]) scegli(voci[indiceAttivo]);
        return;
      }
      if (e.key === "Escape") {
        e.preventDefault();
        setTesto("");
        return;
      }
    }
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      invia();
    }
  }

  return (
    <div className={cn("relative rounded-2xl border bg-card/90 p-2 pl-3 shadow-sm backdrop-blur-md", className)}>
      {menuAperto ? (
        <MenuStili voci={voci} query={query ?? ""} attiva={indiceAttivo} onScegli={scegli} onPassaSopra={setAttiva} nessunoStile={pronti.length === 0} />
      ) : null}

      {stileScelto || ricercaScelta ? (
        <div className="flex flex-wrap items-center gap-2 px-1 pt-1 pb-2">
          {ricercaScelta ? (
            <span className="inline-flex max-w-full items-center gap-1.5 rounded-full border bg-muted/60 py-1 pr-1 pl-2.5 text-xs">
              <TrendingUp className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />
              <span className="truncate">
                <span className="text-muted-foreground">Ricerca TikTok · </span>
                <span className="font-medium">{ricercaScelta.tema}</span>
              </span>
              <button
                type="button"
                aria-label="Togli la ricerca TikTok"
                disabled={inAttesa}
                onClick={() => onTogliRicerca?.()}
                className={X_CHIP}
              >
                <X className="size-3.5" aria-hidden />
              </button>
            </span>
          ) : null}
          {stileScelto ? (
            <span className="inline-flex max-w-full items-center gap-1.5 rounded-full border bg-muted/60 py-1 pr-1 pl-2.5 text-xs">
              <Palette className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />
              <span className="truncate">
                <span className="text-muted-foreground">Stile · </span>
                <span className="font-medium">{stileScelto.titolo}</span>
              </span>
              <button
                type="button"
                aria-label="Togli lo stile"
                disabled={inAttesa}
                onClick={() => onStileChange?.(null)}
                className={X_CHIP}
              >
                <X className="size-3.5" aria-hidden />
              </button>
            </span>
          ) : null}
        </div>
      ) : null}

      <div className="flex items-end gap-3">
        <AuraSfera dimensione={40} conNome={false} parla={inAttesa} className="mb-1.5" />
        <label className="sr-only" htmlFor="composer-aura">
          Scrivi ad Aura
        </label>
        <textarea
          id="composer-aura"
          value={testo}
          maxLength={MAX}
          disabled={inAttesa}
          onChange={(e) => {
            setTesto(e.target.value);
            setAttiva(0);
          }}
          onKeyDown={onKeyDown}
          rows={1}
          role={menuAperto ? "combobox" : undefined}
          aria-expanded={menuAperto || undefined}
          aria-controls={menuAperto ? "menu-stili" : undefined}
          placeholder={testoGuida}
          className="field-sizing-content max-h-40 min-h-10 min-w-0 flex-1 resize-none bg-transparent py-2 text-base leading-relaxed outline-none placeholder:text-muted-foreground/70 disabled:opacity-60 md:text-[15px]"
        />
        <Button size="icon" aria-label="Invia ad Aura" disabled={inAttesa || menuAperto || testo.trim().length < 3} onClick={invia} className="rounded-full">
          <ArrowUp aria-hidden />
        </Button>
      </div>
      {/* Scorciatoie da tastiera: sul telefono touch non servono e rubano una riga al composer. */}
      <p className="px-1 pt-1 text-[11px] text-muted-foreground max-md:pointer-coarse:hidden">
        Invio per mandare · Shift+Invio per andare a capo{onStileChange ? " · / per usare un tuo stile" : ""}
      </p>
    </div>
  );
}
