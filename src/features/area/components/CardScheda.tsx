import { Link } from "react-router-dom";
import { ExternalLink } from "lucide-react";
import { SCHEDA_ONBOARDING, useStatoScheda, ETICHETTA_STATO_SCHEDA, type StatoScheda } from "@/features/scheda";
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

/** La scheda onboarding come card cliccabile (Marmo): icona, occhiello, titolo, stato. */
export function CardScheda({ clienteId }: { clienteId: string }) {
  const { data, isLoading, isError } = useStatoScheda(clienteId);
  const q = SCHEDA_ONBOARDING;

  if (isLoading) return <SkeletonRighe righe={2} />;
  if (isError || !data) return <ErroreCaricamento />;

  return (
    <section aria-label="La tua scheda">
      <Link
        to={`/area/${q.slug}`}
        className="flex flex-wrap items-center gap-[18px] rounded-2xl border bg-card px-6 py-[22px] transition-[border-color,box-shadow] hover:border-input hover:shadow-sm"
      >
        <span
          aria-hidden
          className="grid size-[52px] shrink-0 place-items-center rounded-xl border bg-muted text-[26px] leading-none"
        >
          {q.icona}
        </span>
        <span className="min-w-0 flex-1">
          <span className="eyebrow block text-[11px] tracking-[0.08em]">{q.occhiello}</span>
          <span className="mt-0.5 mb-1 block font-display text-[22px] leading-tight font-medium text-foreground">{q.titolo}</span>
          <span className="block text-[13.5px] leading-relaxed text-muted-foreground">{q.sottotitolo}</span>
        </span>
        <span className="flex shrink-0 flex-col items-end gap-2.5">
          <Badge variant={TONO_STATO[data.stato]} dot={data.stato === "inviato"}>
            {ETICHETTA_STATO_SCHEDA[data.stato]}
          </Badge>
          <span className="inline-flex h-8 items-center rounded-sm bg-primary px-3.5 text-[13px] font-semibold text-primary-foreground">
            {AZIONE_STATO[data.stato]}
          </span>
        </span>
      </Link>
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
