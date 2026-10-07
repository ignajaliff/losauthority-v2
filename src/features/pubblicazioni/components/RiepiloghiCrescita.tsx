import { format } from "date-fns";
import { it } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { formatConteggio, formatDelta } from "../format";
import { COLORE_SERIE, ETICHETTA_SERIE, type RiepilogoSerie, type Serie } from "../statistiche";

interface RiepiloghiCrescitaProps {
  scelte: Serie[];
  riepilogo: Record<Serie, RiepilogoSerie>;
}

const giorno = (t: number) => format(t, "d MMM", { locale: it });

/** I lead si contano (pagina Clienti): non ci sono letture, solo arrivi. */
function notaLead(r: RiepilogoSerie): { testo: string; positivo: boolean } {
  if (r.fine === null) return { testo: "Ancora nessun lead: li segni nella pagina Clienti", positivo: false };
  const dal = r.dal !== null ? ` dal ${giorno(r.dal)}` : "";
  if (!r.delta) return { testo: `Nessun lead nuovo${dal}`, positivo: false };
  return { testo: `+${formatConteggio(r.delta)}${dal}`, positivo: true };
}

/** La riga sotto il numero: crescita nel periodo, oppure perché non si può ancora dire. */
function nota(s: Serie, r: RiepilogoSerie): { testo: string; positivo: boolean } {
  if (s === "lead") return notaLead(r);
  if (r.fine === null) return { testo: "Nessuna lettura nel periodo", positivo: false };
  if (r.letture === 0) return { testo: "Nessuna lettura nel periodo: è l'ultimo valore noto", positivo: false };
  if (r.delta === null) return { testo: "Una sola lettura nel periodo: la crescita si vede dalla prossima", positivo: false };
  const delta = formatDelta(r.fine, r.inizio) ?? "=";
  const dal = r.dal !== null && r.inizio !== null ? ` dal ${giorno(r.dal)}` : "";
  return { testo: delta === "=" ? `Invariato${dal}` : `${delta}${dal}`, positivo: delta.startsWith("+") };
}

/** Un riquadro per linea scelta: valore a fine periodo e crescita nel periodo. */
export function RiepiloghiCrescita({ scelte, riepilogo }: RiepiloghiCrescitaProps) {
  if (scelte.length === 0) return null;
  return (
    <dl className="grid gap-3 sm:grid-cols-3">
      {scelte.map((s) => {
        const r = riepilogo[s];
        const n = nota(s, r);
        return (
          <div key={s} className="rounded-lg border bg-muted/40 px-3 py-2.5">
            <dt className="eyebrow inline-flex items-center gap-1.5 text-[10px]">
              <span className="size-2 rounded-full" style={{ backgroundColor: COLORE_SERIE[s] }} aria-hidden />
              {ETICHETTA_SERIE[s]}
            </dt>
            <dd className="figure mt-1 text-xl leading-tight">{formatConteggio(r.fine)}</dd>
            <dd className={cn("text-[11px]", n.positivo ? "text-status-active" : "text-muted-foreground")}>{n.testo}</dd>
          </div>
        );
      })}
    </dl>
  );
}
