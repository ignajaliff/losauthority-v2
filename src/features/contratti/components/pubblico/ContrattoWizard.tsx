import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import type { DatiCliente, DocumentoContratto, Firma, TipoCliente } from "@contratti/tipi.ts";
import { validaDati, type Errori } from "@contratti/validazione.ts";
import { inviaDati, inviaFirma, urlPdfPubblico } from "../../api-pubblica";
import { cancellaBozza, daCampi, inCampi, leggiBozza, PASSI, salvaBozza, type Campi, type Passo } from "./campi";
import { ContrattoFirmato } from "./ContrattoFirmato";
import { PassoDati } from "./PassoDati";
import { PassoFirma } from "./PassoFirma";
import { PassoInformativa, PassoTipo } from "./PassiIniziali";

interface ContrattoWizardProps {
  token: string;
  programma: string;
  durataMesi: number;
  tipoIniziale: TipoCliente | null;
  datiIniziali: Partial<DatiCliente> | null;
  firmaFornitore: Firma | null;
  istruzioniPagamento: string | null;
}

/**
 * Il percorso del cliente sul suo link personale: informativa → come acquisti →
 * i tuoi dati → contratto e firme. Il testo del contratto arriva SEMPRE dal
 * server («Elabora»); alla firma si manda l'impronta del testo mostrato.
 */
export function ContrattoWizard({ token, programma, durataMesi, tipoIniziale, datiIniziali, firmaFornitore, istruzioniPagamento }: ContrattoWizardProps) {
  const bozzaKey = `contratto:${token}`;
  const [passo, setPasso] = useState<Passo>("informativa");
  const [letta, setLetta] = useState(false);
  // Si riparte dalla bozza di questa scheda, se c'è; altrimenti da ciò che è già salvato sul server.
  const [tipo, setTipo] = useState<TipoCliente | null>(() => leggiBozza(bozzaKey)?.tipo ?? tipoIniziale);
  const [dichiaro, setDichiaro] = useState(false);
  const [campi, setCampi] = useState<Campi>(() => {
    const bozza = leggiBozza(bozzaKey)?.campi;
    return bozza && Object.keys(bozza).length > 0 ? bozza : inCampi(datiIniziali);
  });
  const [errori, setErrori] = useState<Errori>({});
  const [messaggio, setMessaggio] = useState<string | null>(null);
  const [inviando, setInviando] = useState(false);
  const [documento, setDocumento] = useState<DocumentoContratto | null>(null);
  const [sha, setSha] = useState<string | null>(null);
  const [accetto, setAccetto] = useState(false);
  const [approvo, setApprovo] = useState(false);
  const [firma1, setFirma1] = useState<Firma | null>(null);
  const [firma2, setFirma2] = useState<Firma | null>(null);
  const [firmatoIl, setFirmatoIl] = useState<string | null>(null);
  const cima = useRef<HTMLDivElement>(null);

  // La bozza si aggiorna a ogni modifica e sparisce alla firma.
  useEffect(() => {
    if (passo !== "fatto") salvaBozza(bozzaKey, { tipo: tipo ?? undefined, campi });
  }, [bozzaKey, tipo, campi, passo]);

  function vai(p: Passo) {
    setMessaggio(null);
    setPasso(p);
    requestAnimationFrame(() => cima.current?.scrollIntoView({ block: "start" }));
  }

  function campo(nome: string, v: string) {
    setCampi((c) => ({ ...c, [nome]: v }));
    if (errori[nome]) {
      setErrori((e) => {
        const resto = { ...e };
        delete resto[nome];
        return resto;
      });
    }
  }

  function scegliTipo(t: TipoCliente) {
    if (tipo === t) return;
    setTipo(t);
    setDichiaro(false);
    setErrori({});
  }

  async function elabora() {
    if (!tipo) return;
    // Primo controllo qui, per mostrare subito gli errori sotto i campi: è la stessa funzione del server.
    const locale = validaDati(tipo, daCampi(campi));
    if (!locale.ok) {
      setErrori(locale.errori);
      setMessaggio("Controlla i campi segnati in rosso.");
      return;
    }
    setInviando(true);
    setMessaggio(null);
    const esito = await inviaDati(token, tipo, dichiaro, letta, daCampi(campi));
    setInviando(false);
    if (!esito.ok) {
      if (esito.errori) setErrori(esito.errori);
      setMessaggio(esito.error);
      return;
    }
    setErrori({});
    setDocumento(esito.documento);
    setSha(esito.sha);
    setAccetto(false);
    setApprovo(false);
    setFirma1(null);
    setFirma2(null);
    vai("contratto");
  }

  async function firmaOra() {
    if (!firma1 || !firma2 || !accetto || !approvo || !sha) return;
    setInviando(true);
    setMessaggio(null);
    const esito = await inviaFirma(token, firma1, firma2, sha);
    setInviando(false);
    if (!esito.ok) {
      // Il testo è cambiato dopo l'anteprima: si mostra quello nuovo, da rileggere.
      if (esito.documento && esito.sha) {
        setDocumento(esito.documento);
        setSha(esito.sha);
        setAccetto(false);
        setApprovo(false);
      }
      setMessaggio(esito.status === 0 ? "Connessione assente. Controlla la rete e riprova: la firma non è stata inviata." : esito.error);
      return;
    }
    cancellaBozza(bozzaKey);
    setFirmatoIl(esito.firmato_il);
    vai("fatto");
    // Il pulsante promette il contratto firmato: lo scaricamento parte da solo (la risposta è un allegato, la pagina resta qui).
    window.location.assign(urlPdfPubblico(token));
  }

  if (passo === "fatto") {
    return (
      <div ref={cima}>
        <ContrattoFirmato token={token} firmatoIl={firmatoIl ?? new Date().toISOString()} istruzioniPagamento={istruzioniPagamento} appenaFirmato />
      </div>
    );
  }

  const indice = PASSI.findIndex((p) => p.id === passo);
  return (
    <div ref={cima} className="grid gap-5 scroll-mt-4">
      <ol aria-label="Passi" className="flex gap-1.5">
        {PASSI.map((p, i) => (
          <li key={p.id} className="grid flex-1 gap-1.5" aria-current={i === indice ? "step" : undefined}>
            <span className={cn("h-[3px] rounded-sm", i <= indice ? "bg-foreground" : "bg-border")} />
            <span className={cn("text-[11.5px]", i === indice ? "font-bold text-foreground" : i < indice ? "font-medium text-foreground" : "text-muted-foreground")}>
              {i + 1}. {p.label}
            </span>
          </li>
        ))}
      </ol>

      {passo === "informativa" ? (
        <PassoInformativa programma={programma} durataMesi={durataMesi} letta={letta} onLetta={setLetta} onAvanti={() => vai("tipo")} />
      ) : null}
      {passo === "tipo" ? (
        <PassoTipo tipo={tipo} dichiaro={dichiaro} onTipo={scegliTipo} onDichiaro={setDichiaro} onIndietro={() => vai("informativa")} onAvanti={() => vai("dati")} />
      ) : null}
      {passo === "dati" && tipo ? (
        <PassoDati
          tipo={tipo}
          campi={campi}
          errori={errori}
          messaggio={messaggio}
          inviando={inviando}
          onCampo={campo}
          onCopiaRappresentante={() => setCampi((c) => ({ ...c, partecipante_nome: c.rappresentante_nome ?? "", partecipante_cognome: c.rappresentante_cognome ?? "" }))}
          onIndietro={() => vai("tipo")}
          onElabora={() => void elabora()}
        />
      ) : null}
      {passo === "contratto" && documento ? (
        <PassoFirma
          documento={documento}
          firmaFornitore={firmaFornitore}
          accetto={accetto}
          approvo={approvo}
          firma1={firma1}
          firma2={firma2}
          messaggio={messaggio}
          inviando={inviando}
          onAccetto={setAccetto}
          onApprovo={setApprovo}
          onFirma1={setFirma1}
          onFirma2={setFirma2}
          onModifica={() => vai("dati")}
          onFirma={() => void firmaOra()}
        />
      ) : null}
    </div>
  );
}
