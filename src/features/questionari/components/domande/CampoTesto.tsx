import { Input } from "@/shared/components/ui/input";
import { Textarea } from "@/shared/components/ui/textarea";
import type { Domanda } from "../../types";

export interface CampoProps<V> {
  domanda: Domanda;
  valore: V;
  onChange: (valore: V) => void;
  disabilitato?: boolean;
  invalido?: boolean;
  idErrore?: string;
}

/** Domande di tipo text / textarea. */
export function CampoTesto({ domanda, valore, onChange, disabilitato, invalido, idErrore }: CampoProps<string>) {
  const comuni = {
    id: domanda.id,
    placeholder: domanda.placeholder,
    value: valore,
    disabled: disabilitato,
    "aria-invalid": invalido,
    "aria-describedby": idErrore,
  };
  if (domanda.tipo === "textarea") {
    return <Textarea {...comuni} rows={4} onChange={(e) => onChange(e.target.value)} />;
  }
  return <Input {...comuni} type="text" onChange={(e) => onChange(e.target.value)} />;
}

/** Domande numeriche (ore/settimana): interi ≥ 0, salvati come testo. */
export function CampoNumero({ domanda, valore, onChange, disabilitato, invalido, idErrore }: CampoProps<string>) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-lg border border-input px-3 py-2">
      <label htmlFor={domanda.id} className="text-sm">
        {domanda.testo}
        {domanda.obbligatoria ? <span className="text-muted-foreground"> *</span> : null}
      </label>
      <div className="flex shrink-0 items-center gap-2">
        <Input
          id={domanda.id}
          type="number"
          inputMode="numeric"
          min={0}
          step={1}
          placeholder="0"
          className="w-20 text-right tabular-nums"
          value={valore}
          disabled={disabilitato}
          aria-invalid={invalido}
          aria-describedby={idErrore}
          onChange={(e) => onChange(e.target.value.replace(/[^\d]/g, ""))}
        />
        {domanda.unita ? <span className="w-14 text-xs text-muted-foreground">{domanda.unita}</span> : null}
      </div>
    </div>
  );
}
