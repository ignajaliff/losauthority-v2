import { AiutoAura } from "../AiutoAura";
import { CampoAllegati } from "./CampoAllegati";
import { CampoLinkLista } from "./CampoLinkLista";
import { CampoMultiselect, CampoSelect } from "./CampoScelta";
import { CampoNumero, CampoTesto } from "./CampoTesto";
import type { Domanda, QuestionarioId, ValoreRisposta } from "../../types";

export interface DomandaCampoProps {
  domanda: Domanda;
  valore: ValoreRisposta | undefined;
  errore?: string;
  onChange: (id: string, valore: ValoreRisposta) => void;
  questionarioId: QuestionarioId;
  invioId: string;
  clienteId: string;
  inBozza: boolean;
}

function comeTesto(v: ValoreRisposta | undefined): string {
  return typeof v === "string" ? v : "";
}
function comeLista(v: ValoreRisposta | undefined): string[] {
  return Array.isArray(v) ? v : [];
}

/** Etichetta + hint + controllo per tipo + errore inline + aiuto di Aura. */
export function DomandaCampo({ domanda, valore, errore, onChange, questionarioId, invioId, clienteId, inBozza }: DomandaCampoProps) {
  const idErrore = errore ? `${domanda.id}-errore` : undefined;
  const set = (v: ValoreRisposta) => onChange(domanda.id, v);
  const comuni = { domanda, disabilitato: !inBozza, invalido: !!errore, idErrore };

  let controllo: React.ReactNode;
  switch (domanda.tipo) {
    case "text":
    case "textarea":
      controllo = <CampoTesto {...comuni} valore={comeTesto(valore)} onChange={set} />;
      break;
    case "number":
      controllo = <CampoNumero {...comuni} valore={comeTesto(valore)} onChange={set} />;
      break;
    case "select":
      controllo = <CampoSelect {...comuni} valore={comeTesto(valore)} onChange={set} />;
      break;
    case "multiselect-text":
      controllo = <CampoMultiselect {...comuni} valore={comeLista(valore)} onChange={set} />;
      break;
    case "url-list":
      controllo = <CampoLinkLista {...comuni} valore={comeLista(valore)} onChange={set} />;
      break;
    case "file-list":
      controllo = <CampoAllegati domanda={domanda} invioId={invioId} clienteId={clienteId} inBozza={inBozza} />;
      break;
  }

  // Il campo numerico porta già la sua etichetta nella riga.
  const mostraEtichetta = domanda.tipo !== "number";

  return (
    <div className="grid gap-2">
      <div className="flex items-start justify-between gap-3">
        {mostraEtichetta ? (
          <label id={`${domanda.id}-label`} htmlFor={domanda.id} className="text-sm font-medium leading-snug">
            {domanda.testo}
            {domanda.obbligatoria ? <span className="text-muted-foreground"> *</span> : null}
          </label>
        ) : (
          <span />
        )}
        {inBozza ? <AiutoAura questionarioId={questionarioId} domandaId={domanda.id} /> : null}
      </div>
      {domanda.hint ? <p className="text-xs text-muted-foreground">{domanda.hint}</p> : null}
      {controllo}
      {errore ? (
        <p id={idErrore} role="alert" className="text-sm text-destructive">
          {errore}
        </p>
      ) : null}
    </div>
  );
}
