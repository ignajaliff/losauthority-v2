import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { conParole } from "../../format";
import type { Opzione } from "../../types";
import type { CampoProps } from "./CampoTesto";

interface ConOpzioni {
  /** Le opzioni visibili con le risposte attuali (già filtrate dal chiamante). */
  opzioni: Opzione[];
}

/** Scelta singola a "chip" (select). Le etichette lunghe vanno a capo. */
export function CampoSelect({ domanda, valore, onChange, parole, opzioni, disabilitato, idErrore }: CampoProps<string> & ConOpzioni) {
  return (
    <div role="radiogroup" aria-labelledby={`${domanda.id}-label`} aria-describedby={idErrore} className="flex flex-wrap gap-2">
      {opzioni.map((opt) => {
        const selezionata = valore === opt.value;
        return (
          <Button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={selezionata}
            variant={selezionata ? "default" : "outline"}
            size="sm"
            className="h-auto min-h-8 whitespace-normal py-1.5 text-left"
            disabled={disabilitato}
            onClick={() => onChange(opt.value)}
          >
            {conParole(opt.label, parole)}
          </Button>
        );
      })}
    </div>
  );
}

/**
 * Scelta multipla a "chip" con eventuale valore libero "Altro".
 * Nel Record la lista contiene i value delle opzioni scelte; un elemento che
 * non corrisponde a nessuna opzione è il testo "Altro".
 */
export function CampoMultiselect({ domanda, valore, onChange, parole, opzioni, disabilitato, idErrore }: CampoProps<string[]> & ConOpzioni) {
  const valoriOpzioni = new Set(opzioni.map((o) => o.value));
  const scelte = valore.filter((v) => valoriOpzioni.has(v));
  const altro = valore.find((v) => !valoriOpzioni.has(v)) ?? "";

  const componi = (nuoveScelte: string[], nuovoAltro: string) =>
    nuovoAltro.trim() === "" ? nuoveScelte : [...nuoveScelte, nuovoAltro];

  const alterna = (v: string) =>
    onChange(componi(scelte.includes(v) ? scelte.filter((s) => s !== v) : [...scelte, v], altro));

  return (
    <div className="grid gap-3">
      <div role="group" aria-labelledby={`${domanda.id}-label`} aria-describedby={idErrore} className="flex flex-wrap gap-2">
        {opzioni.map((opt) => {
          const selezionata = scelte.includes(opt.value);
          return (
            <Button
              key={opt.value}
              type="button"
              aria-pressed={selezionata}
              variant={selezionata ? "default" : "outline"}
              size="sm"
              className="h-auto min-h-8 whitespace-normal py-1.5 text-left"
              disabled={disabilitato}
              onClick={() => alterna(opt.value)}
            >
              {conParole(opt.label, parole)}
            </Button>
          );
        })}
      </div>
      {domanda.consentiAltro ? (
        <Input
          id={domanda.id}
          type="text"
          placeholder="Altro… (specifica)"
          aria-label="Altro"
          value={altro}
          disabled={disabilitato}
          onChange={(e) => onChange(componi(scelte, e.target.value))}
        />
      ) : null}
    </div>
  );
}
