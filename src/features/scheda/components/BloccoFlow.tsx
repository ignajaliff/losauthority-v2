import { domandeVisibili } from "@onboarding/definizione.ts";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { AuraSfera } from "@/shared/components/brand/AuraSfera";
import { conParole } from "../format";
import type { ErroriDomande } from "../schema";
import type { Blocco, IdDomanda, Parole, Risposte, ValoreRisposta } from "../types";
import { DomandaCampo } from "./domande/DomandaCampo";

interface BloccoFlowProps {
  blocco: Blocco;
  indice: number;
  totale: number;
  risposte: Risposte;
  parole: Parole;
  errori: ErroriDomande;
  avanzando: boolean;
  clienteId: string;
  onChange: (id: IdDomanda, valore: ValoreRisposta) => void;
  onIndietro: () => void;
  onAvanti: () => void;
}

/** Schermata di un blocco: intro di Aura, le domande VISIBILI con queste risposte, navigazione. */
export function BloccoFlow(props: BloccoFlowProps) {
  const { blocco, indice, totale, risposte, parole, errori, avanzando } = props;
  const ultimo = indice === totale - 1;
  const domande = domandeVisibili(blocco, risposte);

  return (
    <div className="grid gap-4">
      <div className="flex items-start gap-5">
        <AuraSfera dimensione={56} />
        <div className="min-w-0 flex-1 pt-1">
          <p className="eyebrow">
            Passo {indice + 1} di {totale}
          </p>
          <p
            aria-live="polite"
            className="mt-3 font-display text-[clamp(18px,2.4vw,23px)] leading-[1.4] font-normal tracking-[-0.01em] text-foreground italic"
          >
            {conParole(blocco.intro, parole)}
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-display text-2xl font-medium">
            <span aria-hidden>{blocco.emoji}</span> {conParole(blocco.titolo, parole)}
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-6">
          {domande.map((domanda) => (
            <DomandaCampo
              key={`${domanda.id}-${domanda.codice}`}
              domanda={domanda}
              valore={risposte[domanda.id]}
              risposte={risposte}
              parole={parole}
              errore={errori[domanda.id]}
              onChange={props.onChange}
              clienteId={props.clienteId}
              inBozza
            />
          ))}
        </CardContent>
      </Card>

      <div className="flex items-center justify-between">
        <Button type="button" variant="outline" onClick={props.onIndietro} disabled={avanzando}>
          Indietro
        </Button>
        <Button type="button" onClick={props.onAvanti} disabled={avanzando}>
          {ultimo ? (avanzando ? "Un attimo…" : "Fai leggere ad Aura") : "Continua"}
        </Button>
      </div>
    </div>
  );
}
