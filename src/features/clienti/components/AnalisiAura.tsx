import { Sparkles } from "lucide-react";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { ErroreCaricamento, SkeletonBlocco } from "@/shared/components/layout/StatoCaricamento";
import { formatDateShort } from "@/shared/utils/formatDate";
import { useAnalisi, useGeneraAnalisi } from "../hooks/useAnalisi";
import { MarkdownSemplice } from "./MarkdownSemplice";

/** Analisi strategica di Aura dalla scheda onboarding del cliente. */
export function AnalisiAura({ clienteId }: { clienteId: string }) {
  const { data, isLoading, isError } = useAnalisi(clienteId);
  const genera = useGeneraAnalisi(clienteId);

  if (isLoading) return <SkeletonBlocco />;
  if (isError || !data) return <ErroreCaricamento />;

  const pronta = data.schedaInviata;
  const ha = data.analisi !== null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Analisi di Aura
          <Badge variant={ha ? "active" : "outline"}>{ha ? "Pronta" : "Nessuna"}</Badge>
        </CardTitle>
        <CardDescription>
          Aura legge la scheda onboarding del cliente: cosa funziona, cosa no, come risolverlo e il piano.
          {ha && data.analisi ? ` Generata il ${formatDateShort(data.analisi.generato_il)}.` : ""}
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <Button size="sm" variant={ha ? "outline" : "default"} onClick={() => genera.mutate()} disabled={!pronta || genera.isPending}>
            <Sparkles aria-hidden />
            {genera.isPending ? "Aura sta analizzando…" : ha ? "Rigenera analisi con Aura" : "Genera analisi con Aura"}
          </Button>
          {!pronta ? <span className="text-xs text-muted-foreground">Serve la scheda onboarding inviata dal cliente.</span> : null}
          {genera.isPending ? <span className="text-xs text-muted-foreground">Circa un minuto: lascia aperta la pagina.</span> : null}
        </div>
        {data.analisi ? (
          <div className="border-t pt-4">
            <MarkdownSemplice testo={data.analisi.contenuto} />
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
