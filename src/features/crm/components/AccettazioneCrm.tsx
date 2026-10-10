import { useState } from "react";
import { FileText } from "lucide-react";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Checkbox } from "@/shared/components/ui/checkbox";
import { useAccettaCrm } from "../hooks/useAccessoCrm";
import type { DocumentoLegale, VersioneCrm } from "../types";

interface AccettazioneCrmProps {
  clienteId: string;
  /** La versione in vigore, con il testo delle caselle. */
  versione: VersioneCrm;
  documenti: DocumentoLegale[];
  /** L'utente aveva accettato una versione precedente: la sezione si è richiusa. */
  rinnovo: boolean;
  onApri: (d: DocumentoLegale) => void;
  onAccettato: (accettatoIl: string, versione: number) => void;
}

/** La schermata che sostituisce il CRM finché la versione in vigore dei documenti non è accettata. */
export function AccettazioneCrm({ clienteId, versione, documenti, rinnovo, onApri, onAccettato }: AccettazioneCrmProps) {
  const accetta = useAccettaCrm(clienteId);
  // Nessuna casella già spuntata.
  const [spuntate, setSpuntate] = useState([false, false, false]);
  const caselle = [versione.casella_1, versione.casella_2, versione.casella_3];
  const tutte = spuntate.every(Boolean);

  return (
    <Card>
      <CardHeader className="gap-3">
        <p className="eyebrow">Prima di iniziare</p>
        <CardTitle>Attiva la sezione Clienti</CardTitle>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Qui segni le persone che ti contattano e quante ne chiudi. I dati di queste persone sono tuoi: tu decidi cosa scrivere e perché. Noi li
          custodiamo solo per far funzionare questa sezione. Per attivarla, leggi e accetta i documenti qui sotto.
        </p>
        {rinnovo ? (
          <p className="rounded-md border bg-muted/40 p-3 text-sm leading-relaxed">
            I documenti sono cambiati dalla versione che avevi accettato
            {versione.sintesi_modifiche ? `: ${versione.sintesi_modifiche}` : ""}. Per continuare, leggili e accettali di nuovo. I tuoi contatti
            sono salvati e intatti, e puoi esportarli anche adesso.
          </p>
        ) : null}
      </CardHeader>
      <CardContent className="grid gap-5">
        <ul className="grid gap-2">
          {documenti.map((d) => (
            <li key={d.id}>
              <button
                type="button"
                onClick={() => onApri(d)}
                className="inline-flex items-start gap-2 text-left text-sm font-medium underline-offset-4 hover:underline pointer-coarse:py-2 md:items-center"
              >
                <FileText className="mt-0.5 size-4 shrink-0 text-muted-foreground md:mt-0" aria-hidden />
                {/* Sul telefono il titolo va a capo come testo, con versione e bozza in coda. */}
                <span className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
                  <span>{d.titolo}</span>
                  <span className="text-xs font-normal whitespace-nowrap text-muted-foreground">· versione {d.versione}</span>
                  {d.bozza ? <Badge variant="expiring">Bozza</Badge> : null}
                </span>
              </button>
            </li>
          ))}
        </ul>
        <fieldset className="grid gap-3">
          <legend className="sr-only">Accettazione dei documenti</legend>
          {caselle.map((testo, i) => (
            <label key={i} className="flex cursor-pointer items-start gap-3 rounded-md border bg-card p-3 text-sm leading-relaxed has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring">
              <Checkbox
                className="mt-0.5"
                checked={spuntate[i]}
                onCheckedChange={(v) => setSpuntate((s) => s.map((x, j) => (j === i ? v === true : x)))}
              />
              <span>{testo}</span>
            </label>
          ))}
        </fieldset>
      </CardContent>
      <CardFooter className="flex-col items-stretch gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-muted-foreground">Versione {versione.versione} dei documenti. Salviamo cosa hai accettato e quando, come prova.</p>
        <Button
          disabled={!tutte || accetta.isPending}
          onClick={() => accetta.mutate(versione.versione, { onSuccess: (il) => onAccettato(il, versione.versione) })}
        >
          {accetta.isPending ? "Attivo…" : "Attiva la sezione Clienti"}
        </Button>
      </CardFooter>
    </Card>
  );
}
