import { opzioniVisibili } from "@onboarding/definizione.ts";
import { conParole } from "../../format";
import { AiutoAura } from "../AiutoAura";
import { CampoAllegati } from "./CampoAllegati";
import { CampoLinkLista } from "./CampoLinkLista";
import { CampoConteggi, CampoFasce, CampoScala } from "./CampoMappa";
import { CampoMultiselect, CampoSelect } from "./CampoScelta";
import { CampoNumero, CampoTesto } from "./CampoTesto";
import type { Domanda, IdDomanda, Parole, Risposte, ValoreRisposta } from "../../types";

export interface DomandaCampoProps {
  domanda: Domanda;
  valore: ValoreRisposta | undefined;
  /** Tutte le risposte: servono a filtrare le opzioni condizionali. */
  risposte: Risposte;
  parole: Parole;
  errore?: string;
  onChange: (id: IdDomanda, valore: ValoreRisposta) => void;
  clienteId: string;
  inBozza: boolean;
}

function comeTesto(v: ValoreRisposta | undefined): string {
  return typeof v === "string" ? v : "";
}
function comeLista(v: ValoreRisposta | undefined): string[] {
  return Array.isArray(v) ? v : [];
}
function comeMappa(v: ValoreRisposta | undefined): Record<string, string> {
  return v && typeof v === "object" && !Array.isArray(v) ? v : {};
}

/** Etichetta + hint + controllo per tipo + errore inline + aiuto di Aura. Le parole del mestiere entrano nei testi. */
export function DomandaCampo({ domanda, valore, risposte, parole, errore, onChange, clienteId, inBozza }: DomandaCampoProps) {
  const idErrore = errore ? `${domanda.id}-errore` : undefined;
  const set = (v: ValoreRisposta) => onChange(domanda.id, v);
  const comuni = { domanda, parole, disabilitato: !inBozza, invalido: !!errore, idErrore };
  const opzioni = opzioniVisibili(domanda, risposte);

  let controllo: React.ReactNode;
  switch (domanda.tipo) {
    case "text":
    case "textarea":
      controllo = <CampoTesto {...comuni} valore={comeTesto(valore)} onChange={set} />;
      break;
    case "number":
      controllo = <CampoNumero {...comuni} valore={comeTesto(valore)} onChange={set} />;
      break;
    case "scala":
      controllo = <CampoScala {...comuni} valore={comeTesto(valore)} onChange={set} />;
      break;
    case "select":
      controllo = <CampoSelect {...comuni} opzioni={opzioni} valore={comeTesto(valore)} onChange={set} />;
      break;
    case "multiselect-text":
      controllo = <CampoMultiselect {...comuni} opzioni={opzioni} valore={comeLista(valore)} onChange={set} />;
      break;
    case "conteggi":
      controllo = <CampoConteggi {...comuni} opzioni={opzioni} valore={comeMappa(valore)} onChange={set} />;
      break;
    case "fasce":
      controllo = <CampoFasce {...comuni} opzioni={opzioni} valore={comeMappa(valore)} onChange={set} />;
      break;
    case "url-list":
      controllo = <CampoLinkLista {...comuni} valore={comeLista(valore)} onChange={set} />;
      break;
    case "file-list":
      controllo = <CampoAllegati domanda={domanda} clienteId={clienteId} inBozza={inBozza} />;
      break;
  }

  return (
    <div className="grid gap-2">
      <div className="flex items-start justify-between gap-3">
        <label id={`${domanda.id}-label`} htmlFor={domanda.id} className="text-sm font-medium leading-snug">
          {conParole(domanda.testo, parole)}
          {domanda.obbligatoria ? <span className="text-muted-foreground"> *</span> : null}
        </label>
        {inBozza && domanda.tipo !== "file-list" ? <AiutoAura domandaId={domanda.id} /> : null}
      </div>
      {domanda.hint ? <p className="text-xs text-muted-foreground">{conParole(domanda.hint, parole)}</p> : null}
      {controllo}
      {errore ? (
        <p id={idErrore} role="alert" className="text-sm text-destructive">
          {errore}
        </p>
      ) : null}
    </div>
  );
}
