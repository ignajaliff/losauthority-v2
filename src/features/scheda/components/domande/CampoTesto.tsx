import { Input } from "@/shared/components/ui/input";
import { Textarea } from "@/shared/components/ui/textarea";
import type { Domanda, Parole } from "../../types";

export interface CampoProps<V> {
  domanda: Domanda;
  valore: V;
  onChange: (valore: V) => void;
  parole: Parole;
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

/** Domande numeriche: un numero con la sua unità accanto (interi; decimali solo per la spesa media). */
export function CampoNumero({ domanda, valore, onChange, disabilitato, invalido, idErrore }: CampoProps<string>) {
  const decimali = domanda.id === "spesa_media";
  return (
    <div className="flex items-center gap-2">
      <Input
        id={domanda.id}
        type="text"
        inputMode={decimali ? "decimal" : "numeric"}
        placeholder={domanda.placeholder ?? "0"}
        className="w-28 text-right tabular-nums"
        value={valore}
        disabled={disabilitato}
        aria-invalid={invalido}
        aria-describedby={idErrore}
        onChange={(e) => onChange(e.target.value.replace(decimali ? /[^\d.,]/g : /[^\d]/g, ""))}
      />
      {domanda.unita ? <span className="text-sm text-muted-foreground">{domanda.unita}</span> : null}
    </div>
  );
}
