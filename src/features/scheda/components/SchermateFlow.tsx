import { Link } from "react-router-dom";
import { Button } from "@/shared/components/ui/button";
import { AuraSfera } from "@/shared/components/brand/AuraSfera";
import type { Scheda } from "../scheda";
import type { Parole, Risposte } from "../types";
import { ListaFiles } from "./ListaFiles";
import { RiepilogoRisposte } from "./RiepilogoRisposte";

interface SchermataBenvenutoProps {
  scheda: Scheda;
  nome: string;
  /** true se c'è già una bozza con risposte: il pulsante dice "Riprendi". */
  riprende: boolean;
  onInizia: () => void;
}

/** Prima schermata della scheda (Marmo): Aura al centro, frase in corsivo, Iniziamo. */
export function SchermataBenvenuto({ scheda, nome, riprende, onInizia }: SchermataBenvenutoProps) {
  const saluto = nome ? `Ciao ${nome}.` : "Ciao.";
  return (
    <div className="mx-auto flex max-w-[600px] flex-col items-center gap-[26px] pt-[6vh] text-center">
      <AuraSfera dimensione={104} />
      <div className="grid gap-3">
        <p className="eyebrow">
          {scheda.occhiello} · {scheda.titolo}
        </p>
        <p
          aria-live="polite"
          className="font-display text-[clamp(20px,3vw,27px)] leading-[1.45] font-normal tracking-[-0.01em] text-foreground italic"
        >
          {saluto} {scheda.sottotitolo} Sei domande veloci all'inizio decidono cosa ti chiedo dopo: vedrai solo quello che
          riguarda il tuo lavoro. Se hai un dubbio chiedi pure a me. Niente risposte perfette, solo quelle vere.
        </p>
      </div>
      <div className="flex flex-col items-center gap-3">
        <Button type="button" size="lg" onClick={onInizia}>
          {riprende ? "Riprendi" : "Iniziamo"}
        </Button>
        <span className="text-xs text-muted-foreground">Le tue risposte si salvano automaticamente: puoi fermarti e riprendere.</span>
      </div>
    </div>
  );
}

interface SchermataFattoProps {
  scheda: Scheda;
  risposte: Risposte;
  parole: Parole;
  clienteId: string;
  /** true se la conferma è avvenuta in questa visita (messaggio diverso). */
  appenaInviata: boolean;
}

/** Dopo la conferma: Aura, card centrata in serif, poi il riepilogo in sola lettura. */
export function SchermataFatto({ scheda, risposte, parole, clienteId, appenaInviata }: SchermataFattoProps) {
  return (
    <div className="grid gap-8">
      <div className="flex flex-col items-center gap-6 text-center">
        <AuraSfera dimensione={88} />
        <div className="w-full max-w-[520px] rounded-lg border bg-card p-10">
          <h2 className="text-[30px] leading-tight">{appenaInviata ? "Ottimo lavoro." : "Scheda inviata"}</h2>
          <p className="mx-auto mt-3.5 max-w-[460px] text-[15px] leading-relaxed text-muted-foreground">
            {appenaInviata
              ? `Le tue risposte di "${scheda.titolo}" sono salvate. Wesley le legge prima della prima call.`
              : `Hai già inviato "${scheda.titolo}". Qui sotto puoi rivedere le risposte.`}
          </p>
          <Button className="mt-7" render={<Link to="/area" />}>
            Torna alla tua area
          </Button>
        </div>
      </div>
      <RiepilogoRisposte risposte={risposte} parole={parole} allegati={<ListaFiles clienteId={clienteId} />} />
    </div>
  );
}
