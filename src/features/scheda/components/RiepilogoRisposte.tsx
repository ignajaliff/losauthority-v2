import type { ReactNode } from "react";
import { domandeVisibili } from "@onboarding/definizione.ts";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { conParole, formattaValore } from "../format";
import { SCHEDA_ONBOARDING } from "../scheda";
import type { Parole, Risposte } from "../types";

interface RiepilogoRisposteProps {
  risposte: Risposte;
  parole: Parole;
  /** Cosa mostrare al posto della domanda "allegati" (lista file). */
  allegati?: ReactNode;
}

/**
 * Risposte in sola lettura, blocco per blocco: solo le domande del percorso
 * del cliente (le versioni non viste non compaiono), con le sue parole.
 */
export function RiepilogoRisposte({ risposte, parole, allegati }: RiepilogoRisposteProps) {
  return (
    <div className="grid gap-4">
      {SCHEDA_ONBOARDING.definizione.map((blocco) => {
        const domande = domandeVisibili(blocco, risposte);
        if (domande.length === 0) return null;
        return (
          <Card key={blocco.id} size="sm" className="riepilogo-sezione">
            <CardHeader>
              <CardTitle>
                <span aria-hidden>{blocco.emoji}</span> {conParole(blocco.titolo, parole)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid gap-4">
                {domande.map((domanda) => (
                  <div key={domanda.id} className="riepilogo-domanda">
                    <dt className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                      {conParole(domanda.testo, parole)}
                      {domanda.opinione ? <span className="ml-1 normal-case tracking-normal">(opinione)</span> : null}
                    </dt>
                    <dd className="mt-1 whitespace-pre-wrap text-sm">
                      {domanda.tipo === "file-list" ? (allegati ?? "—") : formattaValore(domanda, risposte[domanda.id], parole)}
                    </dd>
                  </div>
                ))}
              </dl>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
