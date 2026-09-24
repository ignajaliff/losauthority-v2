import { cn } from "@/lib/utils";

interface MarmoLogoProps {
  /** Altezza del monogramma in px; la scritta si scala di conseguenza. */
  altezza?: number;
  /** Solo il monogramma "W", senza la scritta. */
  soloMonogramma?: boolean;
  className?: string;
}

/** Logo "Wesley Caicedo": W inanellata + wordmark in serif spaziato. */
export function MarmoLogo({ altezza = 26, soloMonogramma = false, className }: MarmoLogoProps) {
  return (
    <span className={cn("inline-flex items-center gap-[11px] text-current", className)}>
      <svg width={altezza} height={altezza} viewBox="0 0 120 120" fill="none" className="block" aria-hidden>
        <circle cx="60" cy="60" r="46" stroke="currentColor" strokeWidth="3" opacity="0.5" />
        <text
          x="60"
          y="62"
          dominantBaseline="central"
          textAnchor="middle"
          fontFamily="var(--font-display)"
          fontSize="54"
          fontWeight="500"
          fill="currentColor"
        >
          W
        </text>
      </svg>
      {soloMonogramma ? null : (
        <span
          className="font-display font-medium tracking-[0.12em] whitespace-nowrap"
          style={{ fontSize: Math.round(altezza * 0.66) }}
        >
          WESLEY CAICEDO
        </span>
      )}
    </span>
  );
}
