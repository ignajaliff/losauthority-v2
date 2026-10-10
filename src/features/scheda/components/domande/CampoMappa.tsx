import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { FASCE_ORE } from "@onboarding/blocco-d-g.ts";
import { conParole } from "../../format";
import type { Opzione } from "../../types";
import type { CampoProps } from "./CampoTesto";

interface ConOpzioni {
  opzioni: Opzione[];
}

/** Scala 1-5 a chip, con gli estremi spiegati. */
export function CampoScala({ domanda, valore, onChange, disabilitato, idErrore }: CampoProps<string>) {
  const min = domanda.min ?? 1;
  const max = domanda.max ?? 5;
  const valori = Array.from({ length: max - min + 1 }, (_, i) => String(min + i));
  return (
    <div className="grid gap-1.5">
      <div role="radiogroup" aria-labelledby={`${domanda.id}-label`} aria-describedby={idErrore} className="flex flex-wrap gap-2">
        {valori.map((v) => (
          <Button
            key={v}
            type="button"
            role="radio"
            aria-checked={valore === v}
            variant={valore === v ? "default" : "outline"}
            size="sm"
            className="w-10 tabular-nums"
            disabled={disabilitato}
            onClick={() => onChange(v)}
          >
            {v}
          </Button>
        ))}
      </div>
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{min} = per niente</span>
        <span>{max} = molto</span>
      </div>
    </div>
  );
}

type Mappa = Record<string, string>;

/** Un numero per opzione (es. quanti clienti da ciascun canale). Caselle vuote = zero. */
export function CampoConteggi({ domanda, valore, onChange, parole, opzioni, disabilitato, idErrore }: CampoProps<Mappa> & ConOpzioni) {
  const totale = Object.values(valore).reduce((s, v) => s + (Number.parseInt(v, 10) || 0), 0);
  return (
    <div role="group" aria-labelledby={`${domanda.id}-label`} aria-describedby={idErrore} className="grid gap-2 sm:grid-cols-2">
      {opzioni.map((opt, i) => (
        <label key={opt.value} className="flex items-center justify-between gap-3 rounded-md border border-input px-3 py-1.5 text-sm">
          <span>{conParole(opt.label, parole)}</span>
          <Input
            id={i === 0 ? domanda.id : `${domanda.id}-${opt.value}`}
            type="text"
            inputMode="numeric"
            placeholder="0"
            className="w-16 text-right tabular-nums"
            value={valore[opt.value] ?? ""}
            disabled={disabilitato}
            onChange={(e) => onChange({ ...valore, [opt.value]: e.target.value.replace(/[^\d]/g, "") })}
          />
        </label>
      ))}
      <p className="text-xs text-muted-foreground sm:col-span-2">Totale: {totale}</p>
    </div>
  );
}

/** Una fascia di ore per opzione (0 · 1-2 · 3-5 · più di 5). */
export function CampoFasce({ domanda, valore, onChange, parole, opzioni, disabilitato, idErrore }: CampoProps<Mappa> & ConOpzioni) {
  return (
    <div role="group" aria-labelledby={`${domanda.id}-label`} aria-describedby={idErrore} className="grid gap-2">
      {opzioni.map((opt) => (
        <div key={opt.value} className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-input px-3 py-2">
          <span className="text-sm">{conParole(opt.label, parole)}</span>
          <div role="radiogroup" aria-label={conParole(opt.label, parole)} className="flex flex-wrap gap-1.5">
            {FASCE_ORE.map((f) => {
              const sel = valore[opt.value] === f.value;
              return (
                <Button
                  key={f.value}
                  type="button"
                  role="radio"
                  aria-checked={sel}
                  variant={sel ? "default" : "outline"}
                  size="xs"
                  className="tabular-nums pointer-coarse:h-9 pointer-coarse:min-w-9"
                  disabled={disabilitato}
                  onClick={() => onChange({ ...valore, [opt.value]: sel ? "" : f.value })}
                >
                  {f.label}
                </Button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
