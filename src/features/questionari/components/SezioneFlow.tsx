import { Alert, AlertDescription, AlertTitle } from "@/shared/components/ui/alert";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { DomandaCampo } from "./domande/DomandaCampo";
import { SEZIONE_TEMPO_ID } from "../definizioni/onboarding";
import { totaleOre, type ErroriDomande } from "../schema";
import type { QuestionarioId, Risposte, Sezione, ValoreRisposta } from "../types";

interface SezioneFlowProps {
  sezione: Sezione;
  indice: number;
  totale: number;
  risposte: Risposte;
  errori: ErroriDomande;
  avviso: string | null;
  invioInCorso: boolean;
  questionarioId: QuestionarioId;
  invioId: string;
  clienteId: string;
  onChange: (id: string, valore: ValoreRisposta) => void;
  onIndietro: () => void;
  onAvanti: () => void;
  onConfermaOre: () => void;
  onRivediOre: () => void;
}

/** Schermata di una sezione: intro, domande, totale ore (D_tempo), avviso, navigazione. */
export function SezioneFlow(props: SezioneFlowProps) {
  const { sezione, indice, totale, risposte, errori, avviso, invioInCorso } = props;
  const ultima = indice === totale - 1;
  const ore = sezione.id === SEZIONE_TEMPO_ID ? totaleOre(risposte) : null;

  return (
    <div className="grid gap-4">
      <div>
        <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
          Sezione {indice + 1} di {totale}
        </p>
        <p className="mt-1 text-base leading-relaxed">{sezione.intro}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            <span aria-hidden>{sezione.emoji}</span> {sezione.titolo}
          </CardTitle>
          {sezione.nota ? <CardDescription>{sezione.nota}</CardDescription> : null}
        </CardHeader>
        <CardContent className="grid gap-6">
          {sezione.domande.map((domanda) => (
            <DomandaCampo
              key={domanda.id}
              domanda={domanda}
              valore={risposte[domanda.id]}
              errore={errori[domanda.id]}
              onChange={props.onChange}
              questionarioId={props.questionarioId}
              invioId={props.invioId}
              clienteId={props.clienteId}
              inBozza
            />
          ))}

          {ore !== null ? (
            <div className="flex items-center justify-between rounded-lg bg-muted px-4 py-3">
              <span className="text-sm text-muted-foreground">Totale ore a settimana</span>
              <span className={ore > 60 ? "text-lg font-semibold text-destructive tabular-nums" : "text-lg font-semibold tabular-nums"}>
                {ore} h
              </span>
            </div>
          ) : null}

          {avviso ? (
            <Alert>
              <AlertTitle>Un attimo</AlertTitle>
              <AlertDescription>
                <p>{avviso}</p>
                <div className="mt-3 flex gap-2">
                  <Button type="button" size="sm" onClick={props.onConfermaOre}>
                    Sì, è corretto
                  </Button>
                  <Button type="button" size="sm" variant="outline" onClick={props.onRivediOre}>
                    Rivedo i numeri
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          ) : null}
        </CardContent>
      </Card>

      <div className="flex items-center justify-between">
        <Button type="button" variant="outline" onClick={props.onIndietro} disabled={invioInCorso}>
          Indietro
        </Button>
        <Button type="button" onClick={props.onAvanti} disabled={invioInCorso}>
          {ultima ? (invioInCorso ? "Invio…" : "Invia") : "Continua"}
        </Button>
      </div>
    </div>
  );
}
