import { useEffect, useState } from "react";
import { AuraSfera } from "@/shared/components/brand/AuraSfera";

/**
 * Frasi di stato mentre Aura lavora. Anthropic non manda un "sto pensando"
 * leggibile durante la generazione, quindi le scandiamo noi seguendo i passi
 * reali della funzione: contesto → lettura → idee → script.
 */
const FASI = [
  "Sto rileggendo la tua scheda e la tua analisi…",
  "Cerco il problema giusto del tuo cliente ideale…",
  "Scelgo l'angolo e la tipologia del video…",
  "Scrivo gli hook…",
  "Rifinisco gli script parlati…",
  "Ancora un attimo, controllo che filino…",
] as const;

const INTERVALLO_MS = 2600;

interface PensieroAuraProps {
  /** Frasi di stato alternative (es. il coach che cerca la lezione). Default: quelle di Crea idee. */
  fasi?: readonly string[];
}

/** Aura che "parla" con la frase di stato che cambia ogni paio di secondi. */
export function PensieroAura({ fasi = FASI }: PensieroAuraProps) {
  const [indice, setIndice] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => setIndice((i) => Math.min(i + 1, fasi.length - 1)), INTERVALLO_MS);
    return () => window.clearInterval(timer);
  }, [fasi.length]);

  return (
    <div className="flex items-start gap-3" role="status" aria-live="polite">
      <AuraSfera dimensione={32} conNome={false} parla className="mt-0.5" />
      <p
        key={indice}
        className="pt-1.5 font-display text-[17px] leading-snug text-muted-foreground italic animate-in fade-in slide-in-from-bottom-1 duration-500 motion-reduce:animate-none"
      >
        {fasi[indice]}
      </p>
    </div>
  );
}
