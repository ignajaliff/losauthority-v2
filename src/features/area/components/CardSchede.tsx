import { Link } from "react-router-dom";
import { ExternalLink } from "lucide-react";
import { QUESTIONARI, useStatiQuestionari, ETICHETTA_STATO_SCHEDA, type StatoScheda } from "@/features/questionari";
import { Badge } from "@/shared/components/ui/badge";
import { ErroreCaricamento, SkeletonRighe } from "@/shared/components/layout/StatoCaricamento";

const TONO_STATO: Record<StatoScheda, "outline" | "expiring" | "active"> = {
  mancante: "outline",
  bozza: "expiring",
  inviato: "active",
};

const AZIONE_STATO: Record<StatoScheda, string> = {
  mancante: "Compila",
  bozza: "Riprendi",
  inviato: "Rivedi",
};

/** Le 3 schede come card cliccabili (Marmo): numero in serif, occhiello, titolo, stato. */
export function CardSchede({ clienteId }: { clienteId: string }) {
  const { data, isLoading, isError } = useStatiQuestionari(clienteId);
  const inviate = data ? Object.values(data).filter((s) => s.stato === "inviato").length : 0;

  return (
    <section className="grid gap-4" aria-label="Le tue schede">
      <p className="eyebrow">
        <strong className="font-semibold text-foreground">{inviate}/3</strong> schede inviate
      </p>

      {isLoading ? <SkeletonRighe righe={3} /> : null}
      {isError ? <ErroreCaricamento /> : null}
      {data ? (
        <ul className="grid gap-4">
          {QUESTIONARI.map((q) => {
            const stato = data[q.id].stato;
            return (
              <li key={q.id}>
                <Link
                  to={`/area/${q.slug}`}
                  className="flex flex-wrap items-center gap-[18px] rounded-2xl border bg-card px-6 py-[22px] transition-[border-color,box-shadow] hover:border-input hover:shadow-sm"
                >
                  <span
                    aria-hidden
                    className="grid size-[52px] shrink-0 place-items-center rounded-xl border bg-muted font-display text-[27px] leading-none font-medium text-muted-foreground"
                  >
                    {q.num}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="eyebrow block text-[11px] tracking-[0.08em]">{q.occhiello}</span>
                    <span className="mt-0.5 mb-1 block font-display text-[22px] leading-tight font-medium text-foreground">{q.titolo}</span>
                    <span className="block text-[13.5px] leading-relaxed text-muted-foreground">{q.sottotitolo}</span>
                  </span>
                  <span className="flex shrink-0 flex-col items-end gap-2.5">
                    <Badge variant={TONO_STATO[stato]} dot={stato === "inviato"}>
                      {ETICHETTA_STATO_SCHEDA[stato]}
                    </Badge>
                    <span className="inline-flex h-8 items-center rounded-sm bg-primary px-3.5 text-[13px] font-semibold text-primary-foreground">
                      {AZIONE_STATO[stato]}
                    </span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      ) : null}
    </section>
  );
}

/** Link all'hub Notion, se il team lo ha già creato: card nera in evidenza. */
export function CardHub({ url }: { url: string }) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex flex-wrap items-center gap-[18px] rounded-2xl border border-primary bg-primary px-6 py-[22px] text-primary-foreground shadow-sm transition-opacity hover:opacity-95"
    >
      <span
        aria-hidden
        className="grid size-[52px] shrink-0 place-items-center rounded-xl border border-primary-foreground/25 bg-primary-foreground/15 text-[26px] leading-none"
      >
        🏠
      </span>
      <span className="min-w-[200px] flex-1">
        <span className="block text-[11px] font-semibold tracking-[0.08em] text-primary-foreground/65 uppercase">Il tuo spazio di lavoro</span>
        <span className="mt-0.5 mb-1 block font-display text-[22px] leading-tight font-medium">Hub Los Authority</span>
        <span className="block text-[13.5px] leading-relaxed text-primary-foreground/75">
          Strategia, documenti e materiali del tuo percorso, sempre aggiornati su Notion.
        </span>
      </span>
      <span className="inline-flex shrink-0 items-center gap-2 rounded-sm border border-primary-foreground bg-primary-foreground px-4 py-[9px] text-[13.5px] font-semibold text-primary">
        Apri l'hub <ExternalLink className="size-3.5" aria-hidden />
      </span>
    </a>
  );
}
