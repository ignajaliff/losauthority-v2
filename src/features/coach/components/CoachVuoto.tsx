import { AuraSfera } from "@/shared/components/brand/AuraSfera";
import { SPUNTI_COACH } from "../types";

interface CoachVuotoProps {
  nome: string;
  onSpunto: (testo: string) => void;
}

/** Prima schermata del coach: Aura al centro, una domanda in corsivo, spunti cliccabili. */
export function CoachVuoto({ nome, onSpunto }: CoachVuotoProps) {
  return (
    <div className="mx-auto flex max-w-[640px] flex-col items-center gap-8 pt-[6vh] text-center animate-in fade-in duration-700 motion-reduce:animate-none">
      <AuraSfera dimensione={120} />
      <div className="grid gap-3">
        <p className="eyebrow">Wesley Coach</p>
        <h2 className="font-display text-[clamp(26px,3.6vw,38px)] leading-[1.2] font-normal tracking-[-0.01em] italic">
          {nome ? `${nome}, dove sei bloccato oggi?` : "Dove sei bloccato oggi?"}
        </h2>
        <p className="mx-auto max-w-[460px] text-[15px] leading-relaxed text-muted-foreground">
          Raccontami il problema o cosa vuoi imparare. Cerco tra le lezioni di Wesley quella che ti serve, ti do una prima indicazione e ti mando alla
          classe su Skool.
        </p>
      </div>
      <ul className="flex flex-wrap justify-center gap-2" aria-label="Spunti">
        {SPUNTI_COACH.map((s, i) => (
          <li key={s} style={{ animationDelay: `${300 + i * 90}ms` }} className="animate-in fade-in slide-in-from-bottom-2 fill-mode-both duration-500 motion-reduce:animate-none">
            <button
              type="button"
              onClick={() => onSpunto(s)}
              className="rounded-full border bg-card px-4 py-2 text-left text-[13.5px] leading-snug text-foreground transition-colors hover:border-input hover:bg-muted/60"
            >
              {s}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
