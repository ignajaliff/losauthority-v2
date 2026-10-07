import type { ReactNode } from "react";

/** Una riga etichetta → valore nelle card della scheda del contratto. */
export function Riga({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-wrap items-baseline gap-x-3.5 gap-y-1">
      <span className="w-[170px] shrink-0 text-[13px] text-muted-foreground">{label}</span>
      <span className="min-w-0 flex-1 basis-[240px] text-sm break-words">{children}</span>
    </div>
  );
}

/** Card della scheda: titolo, sottotitolo e contenuto. */
export function CardContratto({ titolo, sottotitolo, children }: { titolo: string; sottotitolo?: string; children: ReactNode }) {
  return (
    <section className="grid gap-4 rounded-lg border bg-card p-5 shadow-xs">
      <header>
        <h3 className="font-sans text-[15px] font-semibold">{titolo}</h3>
        {sottotitolo ? <p className="mt-0.5 text-[13px] text-muted-foreground">{sottotitolo}</p> : null}
      </header>
      {children}
    </section>
  );
}

