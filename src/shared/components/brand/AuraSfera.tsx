import { cn } from "@/lib/utils";

/**
 * "Aura" — la guida delle schede: una sfera di pallini che respira, ruota e
 * pulsa in modo organico (ritardi deterministici). Più veloce quando "parla".
 * L'animazione è in CSS (index.css, classi marmo-aura-*).
 */
const ANELLI = [
  { n: 1, raggio: 0, punto: 2.6 },
  { n: 6, raggio: 13, punto: 2.4 },
  { n: 12, raggio: 24, punto: 2.1 },
  { n: 18, raggio: 35, punto: 1.8 },
];

interface Punto {
  x: number;
  y: number;
  r: number;
  ritardo: number;
}

const PUNTI: Punto[] = ANELLI.flatMap((anello, ai) =>
  Array.from({ length: anello.n }, (_, i) => {
    const angolo = (i / anello.n) * Math.PI * 2 + ai * 0.4;
    const x = 50 + Math.cos(angolo) * anello.raggio;
    const y = 50 + Math.sin(angolo) * anello.raggio;
    const seme = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
    return { x, y, r: anello.punto, ritardo: (seme - Math.floor(seme)) * 2.2 };
  }),
);

interface AuraSferaProps {
  dimensione?: number;
  parla?: boolean;
  /** Mostra la scritta "Aura" sopra la sfera. */
  conNome?: boolean;
  className?: string;
}

export function AuraSfera({ dimensione = 64, parla = false, conNome = true, className }: AuraSferaProps) {
  return (
    <div className={cn("flex shrink-0 flex-col items-center gap-2", parla && "marmo-aura--speaking", className)}>
      {conNome ? (
        <span className="font-display text-base leading-none font-medium tracking-[0.01em] text-muted-foreground italic">
          Aura
        </span>
      ) : null}
      <svg viewBox="0 0 100 100" width={dimensione} height={dimensione} aria-hidden className="block">
        <g className="marmo-aura-breathe">
          <g className="marmo-aura-spin">
            {PUNTI.map((p, i) => (
              <circle
                key={i}
                className="marmo-aura-dot fill-foreground"
                cx={p.x}
                cy={p.y}
                r={p.r}
                style={{ animationDelay: `${p.ritardo}s` }}
              />
            ))}
          </g>
        </g>
      </svg>
    </div>
  );
}
