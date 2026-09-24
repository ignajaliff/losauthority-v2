import { Card, CardContent } from "@/shared/components/ui/card";
import { ErroreCaricamento, SkeletonBlocco } from "@/shared/components/layout/StatoCaricamento";
import { formatCurrency } from "@/shared/utils/formatCurrency";
import { useFinanceStats } from "../hooks/useFinanceStats";

interface StatCardProps {
  etichetta: string;
  valore: string;
  nota?: string;
}

/** Numero in evidenza con etichetta (tile). */
export function StatCard({ etichetta, valore, nota }: StatCardProps) {
  return (
    <Card size="sm">
      <CardContent>
        <div className="text-xs font-medium text-muted-foreground">{etichetta}</div>
        <div className="mt-1 text-2xl font-semibold tabular-nums tracking-tight">{valore}</div>
        {nota ? <div className="mt-1 text-xs text-muted-foreground">{nota}</div> : null}
      </CardContent>
    </Card>
  );
}

/** Le quattro card di testa di Finance. */
export function FinanceStats() {
  const { data, isLoading, isError } = useFinanceStats();

  if (isLoading) {
    return (
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonBlocco key={i} altezza="h-24" />
        ))}
      </div>
    );
  }
  if (isError || !data) return <ErroreCaricamento />;

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard etichetta="Incassato" valore={formatCurrency(data.incassato)} nota="Totale fatture pagate" />
      <StatCard etichetta="Da incassare" valore={formatCurrency(data.daIncassare)} nota="Fatture non ancora pagate" />
      <StatCard etichetta="Spese del mese" valore={formatCurrency(data.speseMese)} nota="Variabili del mese + fisse attive" />
      <StatCard
        etichetta="F24 da pagare"
        valore={formatCurrency(data.f24DaPagare)}
        nota={data.f24DaPagareCount > 0 ? `${data.f24DaPagareCount} ${data.f24DaPagareCount === 1 ? "rata" : "rate"}` : "Nessuna rata aperta"}
      />
    </div>
  );
}
