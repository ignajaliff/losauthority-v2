import { Link } from "react-router-dom";
import { Button } from "@/shared/components/ui/button";
import { AuraSfera } from "@/shared/components/brand/AuraSfera";
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

/** Prima schermata della scheda (Marmo): Aura al centro, frase in corsivo, Iniziamo. */
export function SchermataBenvenuto({ questionario, nome, riprende, onInizia }: SchermataBenvenutoProps) {
  const saluto = nome ? `Ciao ${nome}.` : "Ciao.";
  return (
    <div className="mx-auto flex max-w-[600px] flex-col items-center gap-[26px] pt-[6vh] text-center">
      <AuraSfera dimensione={104} />
      <div className="grid gap-3">
        <p className="eyebrow">
          {questionario.occhiello} · {questionario.titolo}
        </p>
        <p
          aria-live="polite"
          className="font-display text-[clamp(20px,3vw,27px)] leading-[1.45] font-normal tracking-[-0.01em] text-foreground italic"
        >
          {saluto} {questionario.sottotitolo} In ogni risposta trovi un esempio per orientarti, e se hai un dubbio chiedi
          pure a me. Niente risposte perfette, solo quelle vere.
        </p>
      </div>
      <div className="flex flex-col items-center gap-3">
        <Button type="button" size="lg" onClick={onInizia}>
          {riprende ? "Riprendi" : "Iniziamo"}
        </Button>
        <span className="text-xs text-muted-foreground">Le tue risposte si salvano automaticamente.</span>
      </div>
    </div>
  );
}

interface SchermataFattoProps {
  questionario: Questionario;
  risposte: Risposte;
  invioId: string;
  /** true se l'invio è avvenuto in questa visita (messaggio diverso). */
  appenaInviata: boolean;
}

/** Dopo l'invio: Aura, card centrata in serif, poi il riepilogo in sola lettura. */
export function SchermataFatto({ questionario, risposte, invioId, appenaInviata }: SchermataFattoProps) {
  return (
    <div className="grid gap-8">
      <div className="flex flex-col items-center gap-6 text-center">
        <AuraSfera dimensione={88} />
        <div className="w-full max-w-[520px] rounded-lg border bg-card p-10">
          <h2 className="text-[30px] leading-tight">{appenaInviata ? "Ottimo lavoro." : "Scheda inviata"}</h2>
          <p className="mx-auto mt-3.5 max-w-[460px] text-[15px] leading-relaxed text-muted-foreground">
            {appenaInviata
              ? `Le tue risposte di "${questionario.titolo}" sono salvate. Più schede compili, migliore sarà il tuo ambiente.`
              : `Hai già inviato "${questionario.titolo}". Qui sotto puoi rivedere le risposte.`}
          </p>
          <Button className="mt-7" render={<Link to="/area" />}>
            Torna alla tua area
          </Button>
        </div>
      </div>
      <RiepilogoRisposte
        definizione={questionario.definizione}
        risposte={risposte}
        allegati={<AllegatiInvio invioId={invioId} />}
      />
    </div>
  );
}
