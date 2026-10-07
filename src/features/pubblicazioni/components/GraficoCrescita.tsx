import { useMemo, useState } from "react";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/shared/components/ui/chart";
import { StatoVuoto } from "@/shared/components/layout/StatoCaricamento";
import { formatConteggio } from "../format";
import { dominio, periodoDaMesi, tacche, ultimiMesi } from "../periodo";
import { COLORE_SERIE, costruisciGrafico, ETICHETTA_SERIE, SERIE, SERIE_STIMATE, type Campione, type RigaGrafico, type Serie } from "../statistiche";
import type { Pubblicazione, RilevazioneFollower } from "../types";
import { FiltriCrescita } from "./FiltriCrescita";
import { RiepiloghiCrescita } from "./RiepiloghiCrescita";

const config = {
  visualizzazioni: { label: ETICHETTA_SERIE.visualizzazioni, color: COLORE_SERIE.visualizzazioni },
  follower: { label: ETICHETTA_SERIE.follower, color: COLORE_SERIE.follower },
  lead: { label: ETICHETTA_SERIE.lead, color: COLORE_SERIE.lead },
} satisfies ChartConfig;

const giorno = (t: number) => format(t, "d MMM", { locale: it });

interface GraficoCrescitaProps {
  pubblicazioni: Pubblicazione[];
  follower: RilevazioneFollower[];
  /** Totale dei lead arrivati nel tempo (pagina Clienti, `campioniLead`). */
  lead: Campione[];
}

interface PuntinoProps {
  cx?: number;
  cy?: number;
  index?: number;
  payload?: RigaGrafico;
}

/** Pallino solo dove c'è una lettura vera (per i lead: un giorno con almeno un arrivo). */
function puntino(serie: Serie) {
  return function Puntino({ cx, cy, index, payload }: PuntinoProps) {
    const chiave = `${serie}-${index ?? 0}`;
    if (cx === undefined || cy === undefined || !payload?.reali.includes(serie)) return <g key={chiave} />;
    return <circle key={chiave} cx={cx} cy={cy} r={3.5} fill={COLORE_SERIE[serie]} stroke="var(--background)" strokeWidth={1.5} />;
  };
}

/** Andamento di visualizzazioni totali, follower e lead nel periodo scelto (default: ultimi 3 mesi). */
export function GraficoCrescita({ pubblicazioni, follower, lead }: GraficoCrescitaProps) {
  // Il mese corrente fissa l'elenco dei mesi; il limite «adesso» del periodo si ricalcola a ogni dato nuovo.
  const [oggi] = useState(() => new Date());
  const mesi = useMemo(() => ultimiMesi(oggi, 12), [oggi]);
  const [da, setDa] = useState(mesi[2].valore);
  const [a, setA] = useState(mesi[0].valore);
  const [scelte, setScelte] = useState<Serie[]>([...SERIE]);

  const campioniFollower = useMemo<Campione[]>(
    () => follower.map((f) => ({ t: new Date(f.rilevata_il).getTime(), valore: f.follower })),
    [follower],
  );
  const dati = useMemo(() => {
    const periodo = periodoDaMesi(da, a, new Date());
    return { periodo, ...costruisciGrafico(pubblicazioni, campioniFollower, lead, periodo) };
  }, [pubblicazioni, campioniFollower, lead, da, a]);
  const { periodo } = dati;

  const visibili = scelte.filter((s) => dati.righe.some((r) => r[s] !== undefined));
  const soloUna = visibili.length === 1 ? visibili[0] : null;
  const soloLead = scelte.length === 1 && scelte[0] === "lead";

  return (
    <Card>
      <CardHeader>
        <p className="eyebrow">Andamento</p>
        <CardTitle className="mt-1">Come stai crescendo</CardTitle>
        <CardDescription>
          Visualizzazioni totali dei tuoi video, follower e lead. I pallini sono le letture vere; tra una lettura e l'altra visualizzazioni e
          follower sono stimati. I lead si contano giorno per giorno.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-5">
        <FiltriCrescita
          scelte={scelte}
          onScelte={setScelte}
          mesi={mesi}
          da={da}
          a={a}
          onPeriodo={(nuovoDa, nuovoA) => {
            setDa(nuovoDa);
            setA(nuovoA);
          }}
        />

        <RiepiloghiCrescita scelte={scelte} riepilogo={dati.riepilogo} />

        {visibili.length === 0 ? (
          <StatoVuoto
            titolo={scelte.length === 0 ? "Scegli almeno una linea" : soloLead ? "Ancora nessun lead" : "Ancora nessun dato in questo periodo"}
            testo={
              scelte.length === 0
                ? "Spunta visualizzazioni, follower o lead qui sopra."
                : soloLead
                  ? "Quando segni un lead nella pagina Clienti compare qui, nel giorno in cui è arrivato."
                  : "Le letture arrivano dal tuo profilo Instagram: i numeri dei video ogni 15 giorni, i follower ogni 30. Prova a scegliere mesi più recenti."
            }
          />
        ) : (
          <ChartContainer config={config} className="aspect-auto h-72 w-full">
            {/* Senza asse Y visibile serve margine a sinistra, se no la prima data dell'asse X esce dal bordo. */}
            <LineChart data={dati.righe} margin={{ left: soloUna ? 4 : 20, right: 16, top: 8 }}>
              <CartesianGrid vertical={false} yAxisId={soloUna ?? visibili[0]} />
              <XAxis
                dataKey="t"
                type="number"
                scale="time"
                domain={[periodo.da, periodo.a]}
                ticks={tacche(periodo)}
                interval={0}
                tickFormatter={giorno}
                tickLine={false}
                axisLine={false}
                tickMargin={8}
              />
              {visibili.map((s) => (
                <YAxis
                  key={s}
                  yAxisId={s}
                  hide={soloUna !== s}
                  domain={dominio(dati.righe.flatMap((r) => (r[s] === undefined ? [] : [r[s]])))}
                  allowDataOverflow
                  allowDecimals={false}
                  tickLine={false}
                  axisLine={false}
                  width={56}
                  tickFormatter={(v: number) => formatConteggio(v)}
                />
              ))}
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    labelFormatter={(_, payload) => {
                      const t = (payload[0]?.payload as RigaGrafico | undefined)?.t;
                      return t ? format(t, "d MMMM yyyy", { locale: it }) : "";
                    }}
                    formatter={(valore, nome, item) => {
                      const s = nome as Serie;
                      const riga = item.payload as RigaGrafico;
                      return (
                        <div className="flex flex-1 items-center justify-between gap-4 leading-none">
                          <span className="text-muted-foreground">
                            {ETICHETTA_SERIE[s]}
                            {riga.reali.includes(s) || !SERIE_STIMATE.includes(s) ? "" : " · stima"}
                          </span>
                          <span className="font-mono font-medium tabular-nums text-foreground">{formatConteggio(Number(valore))}</span>
                        </div>
                      );
                    }}
                  />
                }
              />
              {visibili.map((s) => (
                <Line
                  key={s}
                  yAxisId={s}
                  dataKey={s}
                  type={s === "lead" ? "stepAfter" : "monotoneX"}
                  stroke={COLORE_SERIE[s]}
                  strokeWidth={2}
                  connectNulls
                  isAnimationActive={false}
                  dot={puntino(s)}
                  activeDot={{ r: 4.5 }}
                />
              ))}
            </LineChart>
          </ChartContainer>
        )}
        <p className="text-xs text-muted-foreground">
          Le visualizzazioni sono la somma dei video che vedi qui sotto e contano dal giorno in cui li hai pubblicati. I follower si leggono dal
          profilo ogni 30 giorni, i numeri dei video ogni 15. I lead sono quelli che segni nella pagina Clienti, contati dal giorno in cui
          sono arrivati. Con più linee insieme ognuna ha la sua scala: per confrontare i numeri guarda i riquadri qui sopra.
        </p>
      </CardContent>
    </Card>
  );
}
