import type { ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { formattaValore } from "../format";
import type { Risposte, Sezione } from "../types";

interface RiepilogoRisposteProps {
  definizione: Sezione[];
  risposte: Risposte;
  /** Cosa mostrare al posto della domanda "allegati" (lista file). */
  allegati?: ReactNode;
}

/** Risposte di una scheda in sola lettura: etichetta domanda + valore, sezione per sezione. */
export function RiepilogoRisposte({ definizione, risposte, allegati }: RiepilogoRisposteProps) {
  return (
    <div className="grid gap-4">
      {definizione.map((sezione) => (
        <Card key={sezione.id} size="sm" className="riepilogo-sezione">
          <CardHeader>
            <CardTitle>
              <span aria-hidden>{sezione.emoji}</span> {sezione.titolo}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid gap-4">
              {sezione.domande.map((domanda) => (
                <div key={domanda.id} className="riepilogo-domanda">
                  <dt className="text-xs font-medium tracking-wide text-muted-foreground uppercase">{domanda.testo}</dt>
                  <dd className="mt-1 whitespace-pre-wrap text-sm">
                    {domanda.tipo === "file-list" ? (allegati ?? "—") : formattaValore(domanda, risposte[domanda.id])}
                  </dd>
                </div>
              ))}
            </dl>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
