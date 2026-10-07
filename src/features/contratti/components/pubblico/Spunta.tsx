import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface SpuntaProps {
  checked: boolean;
  onChange: (v: boolean) => void;
  children: ReactNode;
}

/** Casella di conferma grande, da telefono: tutto il riquadro è cliccabile. */
export function Spunta({ checked, onChange, children }: SpuntaProps) {
  return (
    <label
      className={cn(
        "flex cursor-pointer items-start gap-3 rounded-md border bg-card px-4 py-3.5 text-[14.5px] leading-relaxed text-foreground transition-colors",
        checked ? "border-foreground" : "border-input",
      )}
    >
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="mt-0.5 size-5 shrink-0 accent-foreground" />
      <span>{children}</span>
    </label>
  );
}

/** Titolino di un gruppo di campi del modulo. */
export function Titolino({ children }: { children: ReactNode }) {
  return <p className="eyebrow mt-2 text-muted-foreground">{children}</p>;
}

/** Messaggio di errore del passo (rete, server, campi). */
export function Avviso({ testo }: { testo: string | null }) {
  if (!testo) return null;
  return (
    <p role="alert" className="text-sm text-status-churn">
      {testo}
    </p>
  );
}
