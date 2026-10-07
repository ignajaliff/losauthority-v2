import { useEffect, useState } from "react";
import { Button } from "@/shared/components/ui/button";
import { Textarea } from "@/shared/components/ui/textarea";
import { AuraSfera } from "@/shared/components/brand/AuraSfera";
import type { RigaChiarimento } from "../types";
import type { RispostaChiarimento } from "../hooks/useGiroAura";

const FRASI_LETTURA = [
  "Sto leggendo le tue risposte…",
  "Confronto quello che pensi con quello che i numeri dicono…",
  "Cerco cosa manca per capirti bene…",
  "Preparo un riepilogo con parole tue…",
];

interface SchermataLetturaProps {
  /** Messaggio d'errore se la lettura è fallita: compare il pulsante Riprova. */
  errore: string | null;
  inCorso: boolean;
  onRiprova: () => void;
  onTornaAlleRisposte: () => void;
  /** Rete di sicurezza: scarica un .txt con le risposte in memoria (se il salvataggio è fallito non si perde nulla). */
  onScaricaCopia?: () => void;
}

/** «Aura sta leggendo»: la sfera che parla e una frase di stato che ruota. */
export function SchermataLettura({ errore, inCorso, onRiprova, onTornaAlleRisposte, onScaricaCopia }: SchermataLetturaProps) {
  const [i, setI] = useState(0);
  useEffect(() => {
    if (!inCorso) return;
    const t = window.setInterval(() => setI((x) => (x + 1) % FRASI_LETTURA.length), 4200);
    return () => window.clearInterval(t);
  }, [inCorso]);

  return (
    <div className="mx-auto flex max-w-[560px] flex-col items-center gap-7 pt-[8vh] text-center" role="status" aria-live="polite">
      <AuraSfera dimensione={112} parla={inCorso} />
      {errore ? (
        <div className="grid gap-4">
          <p className="font-display text-[clamp(20px,3vw,26px)] leading-[1.4] font-normal italic">Non sono riuscita a leggere tutto.</p>
          <p className="text-sm text-muted-foreground">{errore}</p>
          <div className="flex flex-wrap justify-center gap-2">
            <Button type="button" onClick={onRiprova}>
              Riprova
            </Button>
            <Button type="button" variant="outline" onClick={onTornaAlleRisposte}>
              Torna alle risposte
            </Button>
          </div>
          {onScaricaCopia ? (
            <Button type="button" variant="link" size="sm" className="justify-self-center" onClick={onScaricaCopia}>
              Scarica una copia delle tue risposte (.txt)
            </Button>
          ) : null}
        </div>
      ) : (
        <div className="grid gap-3">
          <p className="eyebrow">Aura legge il tuo onboarding</p>
          <p className="font-display text-[clamp(20px,3vw,26px)] leading-[1.4] font-normal italic">{FRASI_LETTURA[i]}</p>
          <p className="text-sm text-muted-foreground">Ci vuole circa un minuto. Lascia aperta la pagina.</p>
        </div>
      )}
    </div>
  );
}

interface SchermataChiarimentiProps {
  chiarimenti: RigaChiarimento[];
  inviando: boolean;
  onInvia: (risposte: RispostaChiarimento[]) => void;
}

/** Le domande di chiarimento di Aura (al massimo 3): un fatto ciascuna, poi «Invia le risposte». */
export function SchermataChiarimenti({ chiarimenti, inviando, onInvia }: SchermataChiarimentiProps) {
  const [risposte, setRisposte] = useState<Record<string, string>>(() => Object.fromEntries(chiarimenti.map((c) => [c.id, c.risposta ?? ""])));
  const tutteDate = chiarimenti.every((c) => (risposte[c.id] ?? "").trim() !== "");

  return (
    <div className="grid gap-5">
      <div className="flex items-start gap-5">
        <AuraSfera dimensione={56} />
        <div className="min-w-0 flex-1 pt-1">
          <p className="eyebrow">Ancora {chiarimenti.length === 1 ? "una cosa" : `${chiarimenti.length} cose`}</p>
          <p className="mt-3 font-display text-[clamp(18px,2.4vw,23px)] leading-[1.4] font-normal italic">
            Ho letto tutto. Mi manca qualche dato per capirti davvero: rispondi con i fatti, come vengono.
          </p>
        </div>
      </div>
      <div className="grid gap-5 rounded-lg border bg-card p-6">
        {chiarimenti.map((c, i) => (
          <div key={c.id} className="grid gap-2">
            <label htmlFor={`chiarimento-${c.id}`} className="text-sm font-medium leading-snug">
              {i + 1}. {c.domanda}
            </label>
            <Textarea
              id={`chiarimento-${c.id}`}
              rows={3}
              value={risposte[c.id] ?? ""}
              disabled={inviando}
              onChange={(e) => setRisposte((r) => ({ ...r, [c.id]: e.target.value }))}
            />
          </div>
        ))}
        <div className="flex justify-end">
          <Button type="button" disabled={inviando || !tutteDate} onClick={() => onInvia(chiarimenti.map((c) => ({ id: c.id, risposta: risposte[c.id] ?? "" })))}>
            {inviando ? "Un attimo…" : "Invia le risposte"}
          </Button>
        </div>
      </div>
    </div>
  );
}

interface SchermataRiepilogoProps {
  riepilogo: string;
  correzioneIniziale: string;
  confermando: boolean;
  onConferma: (correzione: string) => void;
  onCorreggiRisposte: () => void;
}

/** «Ho capito bene?»: il riepilogo di Aura con parole del cliente, un campo per correggere, Confermo. */
export function SchermataRiepilogo({ riepilogo, correzioneIniziale, confermando, onConferma, onCorreggiRisposte }: SchermataRiepilogoProps) {
  const [correzione, setCorrezione] = useState(correzioneIniziale);
  return (
    <div className="grid gap-5">
      <div className="flex items-start gap-5">
        <AuraSfera dimensione={56} />
        <div className="min-w-0 flex-1 pt-1">
          <p className="eyebrow">Il tuo riepilogo</p>
          <p className="mt-3 font-display text-[clamp(18px,2.4vw,23px)] leading-[1.4] font-normal italic">Ecco cosa ho capito di te. Leggilo con calma.</p>
        </div>
      </div>
      <div className="grid gap-5 rounded-lg border bg-card p-6">
        <p className="whitespace-pre-wrap text-[15px] leading-relaxed">{riepilogo}</p>
        <div className="grid gap-2 border-t pt-5">
          <label htmlFor="riepilogo-correzione" className="text-sm font-medium">
            Se qualcosa non torna, correggilo qui sotto (facoltativo)
          </label>
          <Textarea id="riepilogo-correzione" rows={3} value={correzione} disabled={confermando} onChange={(e) => setCorrezione(e.target.value)} />
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Button type="button" variant="outline" disabled={confermando} onClick={onCorreggiRisposte}>
            Correggi le risposte
          </Button>
          <Button type="button" size="lg" disabled={confermando} onClick={() => onConferma(correzione)}>
            {confermando ? "Invio…" : "Ho capito bene, confermo"}
          </Button>
        </div>
      </div>
    </div>
  );
}
