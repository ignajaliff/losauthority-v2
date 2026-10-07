import { Checkbox } from "@/shared/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";
import type { Mese } from "../periodo";
import { COLORE_SERIE, ETICHETTA_SERIE, SERIE, type Serie } from "../statistiche";

interface FiltriCrescitaProps {
  scelte: Serie[];
  onScelte: (scelte: Serie[]) => void;
  mesi: Mese[];
  da: string;
  a: string;
  onPeriodo: (da: string, a: string) => void;
}

interface MeseSelectProps {
  etichetta: string;
  descrizione: string;
  valore: string;
  mesi: Mese[];
  etichette: Record<string, string>;
  onScelta: (valore: string) => void;
}

/** «Da [mese]» o «a [mese]»: etichetta visibile corta, nome accessibile completo. */
function MeseSelect({ etichetta, descrizione, valore, mesi, etichette, onScelta }: MeseSelectProps) {
  return (
    <div className="flex items-center gap-2 whitespace-nowrap">
      <span className="text-muted-foreground" aria-hidden>
        {etichetta}
      </span>
      <Select value={valore} items={etichette} onValueChange={(v) => v && onScelta(v)}>
        <SelectTrigger size="sm" className="w-40 capitalize" aria-label={descrizione}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {mesi.map((m) => (
            <SelectItem key={m.valore} value={m.valore} className="capitalize">
              {m.etichetta}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

/** Caselle per scegliere le linee e i due mesi «Da» / «a» del periodo. */
export function FiltriCrescita({ scelte, onScelte, mesi, da, a, onPeriodo }: FiltriCrescitaProps) {
  const etichette: Record<string, string> = Object.fromEntries(mesi.map((m) => [m.valore, m.etichetta]));
  // Mesi in ordine cronologico per i menu; «a» parte dal mese scelto in «Da».
  const cronologici = [...mesi].reverse();

  function alterna(s: Serie, attiva: boolean) {
    onScelte(attiva ? SERIE.filter((x) => x === s || scelte.includes(x)) : scelte.filter((x) => x !== s));
  }

  return (
    <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
      <fieldset className="flex flex-wrap gap-2">
        <legend className="sr-only">Linee da mostrare</legend>
        {SERIE.map((s) => (
          <label
            key={s}
            className="inline-flex cursor-pointer items-center gap-2 rounded-md border bg-card px-3 py-1.5 text-sm has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring"
          >
            <Checkbox checked={scelte.includes(s)} onCheckedChange={(v) => alterna(s, v === true)} />
            <span className="size-2.5 rounded-full" style={{ backgroundColor: COLORE_SERIE[s] }} aria-hidden />
            {ETICHETTA_SERIE[s]}
          </label>
        ))}
      </fieldset>

      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-sm">
        <MeseSelect
          etichetta="Da"
          descrizione="Dal mese"
          valore={da}
          mesi={cronologici}
          etichette={etichette}
          onScelta={(v) => onPeriodo(v, v > a ? v : a)}
        />
        <MeseSelect
          etichetta="a"
          descrizione="Al mese"
          valore={a}
          mesi={cronologici.filter((m) => m.valore >= da)}
          etichette={etichette}
          onScelta={(v) => onPeriodo(da, v)}
        />
      </div>
    </div>
  );
}
