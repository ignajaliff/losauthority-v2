import { Skeleton } from "@/shared/components/ui/skeleton";

interface StatCardProps {
  etichetta: string;
  valore: number | string | undefined;
  caricamento: boolean;
  /** Riga sotto la cifra (es. "ultimi 7 giorni"). */
  nota?: string;
  /** Colore della cifra: su = salvia, giù = argilla. */
  direzione?: "su" | "giu" | "piatta";
}

const COLORE_DIREZIONE = {
  su: "text-status-active",
  giu: "text-status-churn",
  piatta: "text-foreground",
} as const;

/** Contatore della dashboard (Marmo): occhiello + cifra in mono. */
export function StatCard({ etichetta, valore, caricamento, nota, direzione = "piatta" }: StatCardProps) {
  return (
    <div className="flex min-w-0 flex-col gap-3 rounded-lg border bg-card px-6 py-5">
      <span className="eyebrow text-[11px] tracking-[0.12em]">{etichetta}</span>
      {caricamento ? (
        <Skeleton className="h-8 w-16" />
      ) : (
        <span className={`figure text-[30px] leading-none font-medium tracking-[-0.02em] whitespace-nowrap ${COLORE_DIREZIONE[direzione]}`}>
          {valore ?? "—"}
        </span>
      )}
      {nota ? <span className="text-xs text-muted-foreground">{nota}</span> : null}
    </div>
  );
}
