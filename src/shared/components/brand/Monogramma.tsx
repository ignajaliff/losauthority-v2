import { cn } from "@/lib/utils";

const DIMENSIONI = { xs: 24, sm: 32, md: 40, lg: 56 } as const;

interface MonogrammaProps {
  nome?: string | null;
  dimensione?: keyof typeof DIMENSIONI;
  /** Fondo scuro con iniziali chiare (sidebar). */
  inverso?: boolean;
  className?: string;
}

export function iniziali(nome: string | null | undefined): string {
  return (nome ?? "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((parola) => parola[0])
    .join("")
    .toUpperCase();
}

/** Avatar "Marmo": iniziali in serif su quadrato arrotondato. */
export function Monogramma({ nome, dimensione = "sm", inverso = false, className }: MonogrammaProps) {
  const px = DIMENSIONI[dimensione];
  return (
    <span
      aria-hidden
      className={cn(
        "inline-flex shrink-0 items-center justify-center overflow-hidden rounded-md border font-display font-medium tracking-[0.02em]",
        inverso ? "border-transparent bg-primary text-primary-foreground" : "border-border-faint bg-secondary text-secondary-foreground",
        className,
      )}
      style={{ width: px, height: px, fontSize: Math.round(px * 0.42) }}
    >
      {iniziali(nome) || "—"}
    </span>
  );
}
