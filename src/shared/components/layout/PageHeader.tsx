import type { ReactNode } from "react";

interface PageHeaderProps {
  titolo: string;
  sottotitolo?: string;
  azioni?: ReactNode;
}

/** Intestazione standard di pagina: titolo, sottotitolo e azioni a destra. */
export function PageHeader({ titolo, sottotitolo, azioni }: PageHeaderProps) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">{titolo}</h2>
        {sottotitolo ? <p className="text-sm text-muted-foreground">{sottotitolo}</p> : null}
      </div>
      {azioni ? <div className="flex items-center gap-2">{azioni}</div> : null}
    </div>
  );
}
