import { Plus, X } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import type { CampoProps } from "./CampoTesto";

/** Lista di link (profili social): un campo per riga, aggiungi/rimuovi. */
export function CampoLinkLista({ domanda, valore, onChange, disabilitato, invalido, idErrore }: CampoProps<string[]>) {
  const lista = valore.length > 0 ? valore : [""];

  const aggiorna = (i: number, v: string) => {
    const prossima = [...lista];
    prossima[i] = v;
    onChange(prossima);
  };
  const rimuovi = (i: number) => {
    const prossima = lista.filter((_, idx) => idx !== i);
    onChange(prossima.length > 0 ? prossima : [""]);
  };

  return (
    <div className="grid gap-2">
      {lista.map((link, i) => (
        <div key={i} className="flex gap-2">
          <Input
            id={i === 0 ? domanda.id : `${domanda.id}-${i}`}
            type="url"
            inputMode="url"
            placeholder={domanda.placeholder}
            aria-label={`Link ${i + 1}`}
            value={link}
            disabled={disabilitato}
            aria-invalid={invalido}
            aria-describedby={idErrore}
            onChange={(e) => aggiorna(i, e.target.value)}
          />
          {lista.length > 1 && !disabilitato ? (
            <Button type="button" variant="outline" size="icon" aria-label="Rimuovi link" onClick={() => rimuovi(i)}>
              <X aria-hidden />
            </Button>
          ) : null}
        </div>
      ))}
      {!disabilitato ? (
        <Button type="button" variant="link" size="sm" className="justify-self-start px-0" onClick={() => onChange([...lista, ""])}>
          <Plus aria-hidden /> Aggiungi un altro link
        </Button>
      ) : null}
    </div>
  );
}
