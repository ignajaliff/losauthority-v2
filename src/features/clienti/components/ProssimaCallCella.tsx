import { useState } from "react";
import { Badge } from "@/shared/components/ui/badge";
import { formatDateTime } from "@/shared/utils/formatDate";
import { cn } from "@/lib/utils";

const DUE_GIORNI_MS = 48 * 60 * 60 * 1000;

/** Prossima call con evidenza se è entro 48 ore (o già passata). */
export function ProssimaCallCella({ iso }: { iso: string | null | undefined }) {
  // Istante di riferimento fissato al montaggio: basta per una finestra di 48 ore.
  const [adesso] = useState(() => Date.now());
  if (!iso) return <span className="text-muted-foreground">—</span>;
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return <span className="text-muted-foreground">—</span>;
  const diff = t - adesso;
  const passata = diff < 0;
  const imminente = !passata && diff <= DUE_GIORNI_MS;
  return (
    <span className="inline-flex flex-wrap items-center gap-2">
      <span className={cn(imminente && "font-semibold", passata && "text-muted-foreground")}>{formatDateTime(iso)}</span>
      {imminente ? <Badge variant="destructive">Entro 48h</Badge> : null}
      {passata ? <Badge variant="outline">Passata</Badge> : null}
    </span>
  );
}
