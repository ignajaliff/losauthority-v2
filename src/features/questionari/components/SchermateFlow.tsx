import { Link } from "react-router-dom";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { AllegatiInvio } from "./AllegatiInvio";
import { RiepilogoRisposte } from "./RiepilogoRisposte";
import type { Questionario, Risposte } from "../types";

interface SchermataBenvenutoProps {
  questionario: Questionario;
  nome: string;
  /** true se c'è già una bozza con risposte: il pulsante dice "Riprendi". */
  riprende: boolean;
  onInizia: () => void;
}

/** Prima schermata della scheda: saluto + Iniziamo. */
export function SchermataBenvenuto({ questionario, nome, riprende, onInizia }: SchermataBenvenutoProps) {
  const saluto = nome ? `Ciao ${nome}.` : "Ciao.";
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">
          <span aria-hidden>{questionario.icona}</span> {questionario.titolo}
        </CardTitle>
        <CardDescription>{questionario.occhiello}</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <p className="text-base leading-relaxed">
          {saluto} {questionario.sottotitolo} In ogni risposta trovi un esempio per orientarti — e se hai un
          dubbio, chiedi pure ad Aura. Niente risposte perfette, solo quelle vere.
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <Button type="button" size="lg" onClick={onInizia}>
            {riprende ? "Riprendi" : "Iniziamo"}
          </Button>
          <span className="text-xs text-muted-foreground">Le tue risposte si salvano automaticamente.</span>
        </div>
      </CardContent>
    </Card>
  );
}

interface SchermataFattoProps {
  questionario: Questionario;
  risposte: Risposte;
  invioId: string;
  /** true se l'invio è avvenuto in questa visita (messaggio diverso). */
  appenaInviata: boolean;
}

/** Dopo l'invio: sola lettura con riepilogo risposte e allegati. */
export function SchermataFatto({ questionario, risposte, invioId, appenaInviata }: SchermataFattoProps) {
  return (
    <div className="grid gap-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">{appenaInviata ? "Ottimo lavoro" : "Scheda inviata"}</CardTitle>
          <CardDescription>
            {appenaInviata
              ? `Le tue risposte di "${questionario.titolo}" sono salvate. Più schede compili, migliore sarà il tuo ambiente.`
              : `Hai già inviato "${questionario.titolo}". Qui sotto puoi rivedere le risposte.`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button render={<Link to="/area" />}>Torna alla tua area</Button>
        </CardContent>
      </Card>
      <RiepilogoRisposte
        definizione={questionario.definizione}
        risposte={risposte}
        allegati={<AllegatiInvio invioId={invioId} />}
      />
    </div>
  );
}
