import { Sparkles } from "lucide-react";
import { Button } from "@/shared/components/ui/button";

interface AvatarVuotoProps {
  nome: string;
  occupato: boolean;
  onCrea: () => void;
}

/** Nessun avatar ancora: una carta d'identità vuota, due righe e il bottone che apre la conversazione con Aura. */
export function AvatarVuoto({ nome, occupato, onCrea }: AvatarVuotoProps) {
  return (
    <div className="mx-auto grid max-w-[560px] justify-items-center gap-8 pt-[4vh] text-center animate-in fade-in duration-700">
      {/* La carta ancora bianca: tratteggiata, con il punto di domanda al posto della foto. */}
      <div aria-hidden className="w-full max-w-[420px] rounded-lg border border-dashed border-input bg-card/60 p-5 shadow-xs animate-in fade-in zoom-in-95 fill-mode-both duration-700">
        <div className="mb-4 flex items-center justify-between">
          <span className="eyebrow text-[9px]">Carta d'identità · Cliente ideale</span>
          <span className="figure text-[10px] text-muted-foreground/60">N. AV-0001</span>
        </div>
        <div className="grid grid-cols-[72px_1fr] gap-4">
          <div className="grid aspect-[3/4] place-items-center rounded-md border border-dashed border-input bg-muted/30 font-display text-[40px] text-muted-foreground/40">?</div>
          <div className="grid content-start gap-3">
            <div className="h-6 w-2/3 rounded-sm bg-muted" />
            <div className="grid grid-cols-2 gap-3">
              <div className="h-3 rounded-sm bg-muted" />
              <div className="h-3 rounded-sm bg-muted" />
              <div className="h-3 rounded-sm bg-muted" />
              <div className="h-3 rounded-sm bg-muted" />
            </div>
            <div className="mt-2 h-3 w-4/5 rounded-sm bg-muted/70" />
          </div>
        </div>
      </div>

      <div className="grid gap-3">
        <p className="eyebrow">Avatar</p>
        <h2 className="font-display text-[clamp(26px,3.4vw,36px)] leading-[1.15] font-normal italic">
          {nome ? `${nome}, a chi parli quando registri?` : "A chi parli quando registri?"}
        </h2>
        <p className="mx-auto max-w-[460px] text-[15px] leading-relaxed text-muted-foreground">
          Il tuo cliente ideale non è "tutti": è una persona precisa, con un nome, un'età e una frase che dice sempre. La definisci parlando con Aura, e la carta
          si compila mentre rispondi.
        </p>
      </div>

      <Button size="lg" onClick={onCrea} disabled={occupato} className="animate-in fade-in slide-in-from-bottom-2 fill-mode-both delay-200 duration-500">
        <Sparkles aria-hidden /> {occupato ? "Aura si prepara…" : "Crea il primo avatar"}
      </Button>
    </div>
  );
}
