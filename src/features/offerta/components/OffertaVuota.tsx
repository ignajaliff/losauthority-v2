import { Sparkles } from "lucide-react";
import { Button } from "@/shared/components/ui/button";

interface OffertaVuotaProps {
  nome: string;
  occupato: boolean;
  onCrea: () => void;
}

/** Nessuna offerta ancora: una carta vuota, due righe e il bottone che apre la conversazione con Aura. */
export function OffertaVuota({ nome, occupato, onCrea }: OffertaVuotaProps) {
  return (
    <div className="mx-auto grid max-w-[560px] justify-items-center gap-8 pt-[4vh] text-center animate-in fade-in duration-700">
      {/* La carta ancora bianca: tratteggiata, con il titolo e il prezzo al posto delle righe. */}
      <div aria-hidden className="w-full max-w-[420px] rounded-lg border border-dashed border-input bg-card/60 p-5 shadow-xs animate-in fade-in zoom-in-95 fill-mode-both duration-700">
        <div className="mb-4 flex items-center justify-between">
          <span className="eyebrow text-[9px]">Offerta · La tua proposta</span>
          <span className="figure text-[10px] text-muted-foreground/60">N. OF-0001</span>
        </div>
        <div className="grid gap-3">
          <div className="h-7 w-3/4 rounded-sm bg-muted" />
          <div className="grid grid-cols-3 gap-3">
            <div className="h-3 rounded-sm bg-muted" />
            <div className="h-3 rounded-sm bg-muted" />
            <div className="h-3 rounded-sm bg-muted" />
          </div>
          <div className="mt-1 h-4 w-5/6 rounded-sm bg-muted/70" />
          <div className="mt-2 grid gap-2 border-t border-dashed pt-3">
            <div className="h-2.5 w-1/3 rounded-sm bg-muted/60" />
            <div className="h-2.5 w-2/3 rounded-sm bg-muted/60" />
            <div className="h-2.5 w-1/2 rounded-sm bg-muted/60" />
          </div>
        </div>
      </div>

      <div className="grid gap-3">
        <p className="eyebrow">Offerta</p>
        <h2 className="font-display text-[clamp(26px,3.4vw,36px)] leading-[1.15] font-normal italic">
          {nome ? `${nome}, cosa vendi esattamente?` : "Cosa vendi esattamente?"}
        </h2>
        <p className="mx-auto max-w-[460px] text-[15px] leading-relaxed text-muted-foreground">
          Non "quello che fai", ma quello che il tuo cliente ottiene: una trasformazione precisa, pezzi chiari, un prezzo che rispetta il valore. Tu dai
          i dati reali, Aura costruisce la proposta e tu correggi. Alla fine la scarichi in PDF.
        </p>
      </div>

      <Button size="lg" onClick={onCrea} disabled={occupato} className="animate-in fade-in slide-in-from-bottom-2 fill-mode-both delay-200 duration-500">
        <Sparkles aria-hidden /> {occupato ? "Aura si prepara…" : "Costruisci la prima offerta"}
      </Button>
    </div>
  );
}
