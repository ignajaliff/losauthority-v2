import { Card, CardContent } from "@/shared/components/ui/card";
import { Skeleton } from "@/shared/components/ui/skeleton";

interface StatCardProps {
  etichetta: string;
  valore: number | undefined;
  caricamento: boolean;
}

/** Contatore sintetico della dashboard. */
export function StatCard({ etichetta, valore, caricamento }: StatCardProps) {
  return (
    <Card size="sm">
      <CardContent className="grid gap-1">
        <p className="text-xs text-muted-foreground">{etichetta}</p>
        {caricamento ? (
          <Skeleton className="h-8 w-16" />
        ) : (
          <p className="text-2xl font-semibold tabular-nums tracking-tight">{valore ?? "—"}</p>
        )}
      </CardContent>
    </Card>
  );
}
