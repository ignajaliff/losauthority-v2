import { Bar, CartesianGrid, ComposedChart, Line, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/shared/components/ui/chart";
import { ErroreCaricamento, SkeletonBlocco, StatoVuoto } from "@/shared/components/layout/StatoCaricamento";
import { formatCurrency } from "@/shared/utils/formatCurrency";
import { useSerieMensile } from "../hooks/useSerieMensile";

const config = {
  fatturato: { label: "Fatturato", color: "var(--chart-1)" },
  incassato: { label: "Incassato", color: "var(--chart-3)" },
  spese: { label: "Spese", color: "var(--chart-5)" },
} satisfies ChartConfig;

const compatto = new Intl.NumberFormat("it-IT", { notation: "compact", maximumFractionDigits: 1 });

function euroCompatto(valore: number): string {
  return `€ ${compatto.format(valore)}`;
}

function valoreNumerico(valore: unknown): number {
  const v = Array.isArray(valore) ? valore[0] : valore;
  return typeof v === "number" ? v : Number(v) || 0;
}

/** Ultimi 12 mesi: barre fatturato vs incassato, linea spese (fisse + variabili). */
export function FinanceGrafico() {
  const { data: serie, isLoading, isError } = useSerieMensile();

  const vuota = serie?.every((p) => p.fatturato === 0 && p.incassato === 0 && p.spese === 0) ?? true;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Andamento mensile</CardTitle>
        <CardDescription>Ultimi 12 mesi · fatturato e incassato per mese, spese fisse + variabili.</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? <SkeletonBlocco altezza="h-64" /> : null}
        {isError ? <ErroreCaricamento /> : null}
        {serie && vuota ? <StatoVuoto titolo="Ancora nessun movimento" testo="Il grafico si riempie con fatture pagate e spese." /> : null}
        {serie && !vuota ? (
          <ChartContainer config={config} className="aspect-auto h-64 w-full">
            <ComposedChart data={serie} barGap={2} margin={{ left: 4, right: 4, top: 8 }}>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="etichetta" tickLine={false} axisLine={false} tickMargin={8} />
              <YAxis tickLine={false} axisLine={false} width={64} tickFormatter={euroCompatto} />
              <ChartTooltip
                cursor={{ fill: "var(--muted)" }}
                content={
                  <ChartTooltipContent
                    formatter={(valore, nome) => (
                      <div className="flex flex-1 items-center justify-between gap-4 leading-none">
                        <span className="text-muted-foreground">{config[nome as keyof typeof config]?.label ?? nome}</span>
                        <span className="font-mono font-medium tabular-nums text-foreground">{formatCurrency(valoreNumerico(valore))}</span>
                      </div>
                    )}
                  />
                }
              />
              <ChartLegend content={<ChartLegendContent />} />
              <Bar dataKey="fatturato" fill="var(--color-fatturato)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="incassato" fill="var(--color-incassato)" radius={[4, 4, 0, 0]} />
              <Line
                type="monotone"
                dataKey="spese"
                stroke="var(--color-spese)"
                strokeWidth={2}
                dot={{ r: 4, strokeWidth: 2, stroke: "var(--background)", fill: "var(--color-spese)" }}
                activeDot={{ r: 5 }}
              />
            </ComposedChart>
          </ChartContainer>
        ) : null}
      </CardContent>
    </Card>
  );
}
