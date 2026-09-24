import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import type { CampoProps } from "./CampoTesto";

/** Scelta singola a "chip" (select). */
export function CampoSelect({ domanda, valore, onChange, disabilitato, idErrore }: CampoProps<string>) {
  return (
    <div role="radiogroup" aria-labelledby={`${domanda.id}-label`} aria-describedby={idErrore} className="flex flex-wrap gap-2">
      {domanda.opzioni?.map((opt) => {
        const selezionata = valore === opt.value;
        return (
          <Button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={selezionata}
            variant={selezionata ? "default" : "outline"}
            size="sm"
            disabled={disabilitato}
            onClick={() => onChange(opt.value)}
          >
            {opt.label}
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
export function CampoMultiselect({ domanda, valore, onChange, disabilitato, idErrore }: CampoProps<string[]>) {
  const valoriOpzioni = new Set((domanda.opzioni ?? []).map((o) => o.value));
  const scelte = valore.filter((v) => valoriOpzioni.has(v));
  const altro = valore.find((v) => !valoriOpzioni.has(v)) ?? "";

  const componi = (nuoveScelte: string[], nuovoAltro: string) =>
    nuovoAltro.trim() === "" ? nuoveScelte : [...nuoveScelte, nuovoAltro];

  const alterna = (v: string) =>
    onChange(componi(scelte.includes(v) ? scelte.filter((s) => s !== v) : [...scelte, v], altro));

  return (
    <div className="grid gap-3">
      <div role="group" aria-labelledby={`${domanda.id}-label`} aria-describedby={idErrore} className="flex flex-wrap gap-2">
        {domanda.opzioni?.map((opt) => {
          const selezionata = scelte.includes(opt.value);
          return (
            <Button
              key={opt.value}
              type="button"
              aria-pressed={selezionata}
              variant={selezionata ? "default" : "outline"}
              size="sm"
              disabled={disabilitato}
              onClick={() => alterna(opt.value)}
            >
              {opt.label}
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
