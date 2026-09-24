import { Link } from "react-router-dom";
import { ExternalLink } from "lucide-react";
import { QUESTIONARI, useStatiQuestionari, ETICHETTA_STATO_SCHEDA, type StatoScheda } from "@/features/questionari";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { ErroreCaricamento, SkeletonRighe } from "@/shared/components/layout/StatoCaricamento";

const VARIANTE_STATO: Record<StatoScheda, "outline" | "secondary" | "default"> = {
  mancante: "outline",
  bozza: "secondary",
  inviato: "default",
};

/** Le 3 schede con stato e link alla compilazione. */
export function CardSchede({ clienteId }: { clienteId: string }) {
  const { data, isLoading, isError } = useStatiQuestionari(clienteId);
  const inviate = data ? Object.values(data).filter((s) => s.stato === "inviato").length : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Le tue schede</CardTitle>
        <CardDescription>
          Compila le 3 schede: più le riempi, migliore sarà l'ambiente che Wesley e il suo team costruiranno per te.{" "}
          <strong className="text-foreground">{inviate}/3</strong> inviate.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? <SkeletonRighe righe={3} /> : null}
        {isError ? <ErroreCaricamento /> : null}
        {data ? (
          <ul className="grid gap-3">
            {QUESTIONARI.map((q) => {
              const stato = data[q.id].stato;
              return (
                <li key={q.id} className="flex flex-wrap items-center gap-3 rounded-lg border p-3">
                  <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-muted text-lg font-medium" aria-hidden>
                    {q.num}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">{q.occhiello}</p>
                    <p className="font-medium">{q.titolo}</p>
                    <p className="text-xs text-muted-foreground">{q.sottotitolo}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={VARIANTE_STATO[stato]}>{ETICHETTA_STATO_SCHEDA[stato]}</Badge>
                    <Button size="sm" variant={stato === "inviato" ? "outline" : "default"} render={<Link to={`/area/${q.slug}`} />}>
                      {stato === "inviato" ? "Rivedi" : stato === "bozza" ? "Riprendi" : "Compila"}
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
        ) : null}
      </CardContent>
    </Card>
  );
}

/** Link all'hub Notion, se il team lo ha già creato. */
export function CardHub({ url }: { url: string }) {
  return (
    <Card className="bg-primary text-primary-foreground ring-0">
      <CardHeader>
        <CardDescription className="text-primary-foreground/70">Il tuo spazio di lavoro</CardDescription>
        <CardTitle>Il tuo hub Notion</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-primary-foreground/80">
          Strategia, documenti e materiali del tuo percorso, sempre aggiornati su Notion.
        </p>
        <Button variant="secondary" render={<a href={url} target="_blank" rel="noopener noreferrer" />}>
          Apri l'hub <ExternalLink aria-hidden />
        </Button>
      </CardContent>
    </Card>
  );
}
