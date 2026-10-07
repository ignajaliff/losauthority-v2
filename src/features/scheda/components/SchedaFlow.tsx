import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { domandeVisibili } from "@onboarding/definizione.ts";
import { useAuth, type UtenteCorrente } from "@/features/auth";
import { Progress } from "@/shared/components/ui/progress";
import { ErroreCaricamento, SkeletonBlocco } from "@/shared/components/layout/StatoCaricamento";
import { logDev, MESSAGGIO_ERRORE_GENERICO } from "@/shared/utils/errors";
import { conParole, formattaValore, haRisposte, paroleDi, primoNome } from "../format";
import { comeStatoRiga, type IdDomanda, type Parole, type RigaChiarimento, type Risposte, type ValoreRisposta } from "../types";
import { SCHEDA_ONBOARDING } from "../scheda";
import { validaBlocco, validaScheda, type ErroriDomande } from "../schema";
import { salvaTutteLeRisposte, useScheda, type SchedaConRisposte } from "../hooks/useScheda";
import { useSalvaBozza } from "../hooks/useSalvaBozza";
import { ErroreAura, useConfermaOnboarding, useLeggiOnboarding, useParole, useRispondiChiarimenti, type RispostaChiarimento } from "../hooks/useGiroAura";
import { useChiarimenti } from "../hooks/useGiroAura";
import { IndicatoreSalvataggio } from "./IndicatoreSalvataggio";
import { BloccoFlow } from "./BloccoFlow";
import { SchermataBenvenuto, SchermataFatto } from "./SchermateFlow";
import { SchermataChiarimenti, SchermataLettura, SchermataRiepilogo } from "./SchermateAura";

type Schermata = "benvenuto" | "blocco" | "lettura" | "chiarimenti" | "riepilogo" | "fatto";

interface SchedaFlowProps {
  /** Chiamato subito dopo la conferma finale (es. per avviare una transizione). */
  onInviata?: () => void;
}

/** Carica la riga del cliente loggato (creandola al primo accesso) e avvia il flow. */
export function SchedaFlow({ onInviata }: SchedaFlowProps) {
  const { utente } = useAuth();
  const { data, isLoading, isError } = useScheda(utente?.id);
  if (!utente) return null;
  if (isLoading) return <SkeletonBlocco altezza="h-64" />;
  if (isError || !data) return <ErroreCaricamento />;
  return <FlowCompilazione key={data.riga.id} utente={utente} iniziale={data} onInviata={onInviata} />;
}

interface FlowCompilazioneProps extends SchedaFlowProps {
  utente: UtenteCorrente;
  iniziale: SchedaConRisposte;
}

function schermataIniziale(iniziale: SchedaConRisposte): Schermata {
  const fase = comeStatoRiga(iniziale.riga.stato);
  if (fase === "inviato") return "fatto";
  if (fase === "lettura") return "lettura";
  if (fase === "chiarimenti") return "chiarimenti";
  if (fase === "riepilogo") return "riepilogo";
  return iniziale.riga.schermata === "sezione" ? "blocco" : "benvenuto";
}

/**
 * Motore di compilazione: modulo iniziale + blocchi con domande condizionali,
 * bozza automatica, poi il giro con Aura (lettura → chiarimenti → riepilogo →
 * conferma) e sola lettura dopo l'invio.
 */
function FlowCompilazione({ utente, iniziale, onInviata }: FlowCompilazioneProps) {
  const scheda = SCHEDA_ONBOARDING;
  const clienteId = utente.id;
  const blocchi = scheda.definizione;
  const totale = blocchi.length;

  const bozza = useSalvaBozza(clienteId);
  const leggi = useLeggiOnboarding(clienteId);
  const rispondi = useRispondiChiarimenti(clienteId);
  const conferma = useConfermaOnboarding(clienteId);
  const paroleMutation = useParole(clienteId);
  const chiarimentiQuery = useChiarimenti(clienteId);

  const [schermata, setSchermata] = useState<Schermata>(() => schermataIniziale(iniziale));
  const [indice, setIndice] = useState(() => Math.min(Math.max(iniziale.riga.sezione_indice ?? 0, 0), totale - 1));
  const [risposte, setRisposte] = useState<Risposte>(iniziale.risposte);
  const [parole, setParole] = useState<Parole>(() => paroleDi(iniziale.risposte, iniziale.riga));
  const [errori, setErrori] = useState<ErroriDomande>({});
  const [chiarimenti, setChiarimenti] = useState<RigaChiarimento[] | null>(null);
  const [riepilogo, setRiepilogo] = useState<string | null>(iniziale.riga.riepilogo);
  const [erroreLettura, setErroreLettura] = useState<string | null>(() =>
    comeStatoRiga(iniziale.riga.stato) === "lettura" ? "La lettura si è interrotta. Riproviamo?" : null,
  );
  const [appenaInviata, setAppenaInviata] = useState(false);
  const inizioRef = useRef<HTMLDivElement>(null);

  const listaChiarimenti = chiarimenti ?? chiarimentiQuery.data ?? [];

  function scorriInAlto() {
    requestAnimationFrame(() => inizioRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
  }

  function handleChange(id: IdDomanda, valore: ValoreRisposta) {
    const prossime = { ...risposte, [id]: valore };
    setRisposte(prossime);
    if (errori[id]) {
      const { [id]: _rimosso, ...resto } = errori;
      setErrori(resto);
    }
    bozza.programma(prossime, [id], { schermata: "sezione", sezioneIndice: indice });
  }

  function vaiABlocco(i: number) {
    setErrori({});
    setIndice(i);
    setSchermata("blocco");
    bozza.programma(risposte, [], { schermata: "sezione", sezioneIndice: i });
    scorriInAlto();
  }

  /** Compito 1: dopo il modulo iniziale Aura adatta le parole del form. Non blocca. */
  function chiediParole(r: Risposte) {
    const attivita = typeof r.attivita_breve === "string" ? r.attivita_breve : "";
    const tipo = typeof r.tipo === "string" ? r.tipo : "";
    if (!attivita || !tipo) return;
    paroleMutation.mutate(
      { attivita_breve: attivita, tipo, tipo_principale: typeof r.tipo_principale === "string" ? r.tipo_principale : undefined },
      { onSuccess: (p) => p && setParole(p) },
    );
  }

  async function avviaLettura(r: Risposte) {
    const esito = validaScheda(blocchi, r);
    if (!esito.ok && esito.primoBloccoInvalido !== null) {
      const i = esito.primoBloccoInvalido;
      vaiABlocco(i);
      setErrori(esito.perBlocco[blocchi[i]?.id ?? ""] ?? {});
      return;
    }
    setErroreLettura(null);
    setSchermata("lettura");
    scorriInAlto();
    try {
      // Prima tutto quello che è in memoria va nel database (anche se un salvataggio automatico era fallito).
      await bozza.svuota().catch(() => undefined);
      await salvaTutteLeRisposte(clienteId, r, totale - 1);
    } catch (err) {
      logDev(err);
      setErroreLettura("Non sono riuscita a salvare le tue risposte. Restano qui nella pagina: non ricaricare, riprova tra poco.");
      return;
    }
    leggi.mutate(undefined, {
      onSuccess: (e) => {
        setChiarimenti(e.chiarimenti);
        setRiepilogo(e.riepilogo);
        setSchermata(e.stato);
        scorriInAlto();
      },
      onError: (err) => setErroreLettura(err instanceof ErroreAura ? err.message : MESSAGGIO_ERRORE_GENERICO),
    });
  }

  function handleAvanti() {
    const blocco = blocchi[indice];
    if (!blocco) return;
    const errs = validaBlocco(blocco, risposte);
    if (Object.keys(errs).length > 0) {
      setErrori(errs);
      scorriInAlto();
      return;
    }
    setErrori({});
    if (blocco.id === "inizio") chiediParole(risposte);
    if (indice < totale - 1) vaiABlocco(indice + 1);
    else void avviaLettura(risposte);
  }

  function handleIndietro() {
    setErrori({});
    if (indice === 0) setSchermata("benvenuto");
    else vaiABlocco(indice - 1);
  }

  /** Le risposte ai chiarimenti: salvate nelle righe e aggiunte in coda al campo di testo che completano. */
  async function handleChiarimenti(risposteChiarimenti: RispostaChiarimento[]) {
    const prossime = { ...risposte };
    const toccate: IdDomanda[] = [];
    for (const c of listaChiarimenti) {
      const testo = risposteChiarimenti.find((r) => r.id === c.id)?.risposta.trim();
      if (!testo) continue;
      const campo = c.campo as IdDomanda;
      const domanda = blocchi.flatMap((b) => domandeVisibili(b, prossime)).find((d) => d.id === campo);
      if (!domanda || (domanda.tipo !== "textarea" && domanda.tipo !== "text")) continue;
      const attuale = typeof prossime[campo] === "string" ? (prossime[campo] as string).trim() : "";
      prossime[campo] = attuale ? `${attuale}\n\nChiarimento: ${testo}` : testo;
      toccate.push(campo);
    }
    try {
      await rispondi.mutateAsync(risposteChiarimenti);
    } catch {
      return;
    }
    setRisposte(prossime);
    if (toccate.length > 0) bozza.programma(prossime, toccate, { schermata: "sezione", sezioneIndice: indice });
    void avviaLettura(prossime);
  }

  /** Rete di sicurezza: le risposte in memoria come .txt leggibile (domanda → risposta). */
  function scaricaCopia() {
    const righe = blocchi.flatMap((b) =>
      domandeVisibili(b, risposte)
        .filter((d) => d.tipo !== "file-list")
        .map((d) => `${conParole(d.testo, parole)}\n→ ${formattaValore(d, risposte[d.id], parole)}\n`),
    );
    const blob = new Blob([`Onboarding — copia delle risposte (${new Date().toLocaleString("it-IT")})\n\n${righe.join("\n")}`], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "onboarding-risposte.txt";
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleConferma(correzione: string) {
    conferma.mutate(correzione, {
      onSuccess: () => {
        setAppenaInviata(true);
        setSchermata("fatto");
        scorriInAlto();
        onInviata?.();
      },
    });
  }

  const blocco = blocchi[indice];
  const progresso =
    schermata === "fatto" ? 100 : schermata === "riepilogo" ? 95 : schermata === "lettura" || schermata === "chiarimenti" ? 88 : schermata === "benvenuto" ? 0 : Math.round(((indice + 1) / (totale + 1)) * 100);
  const inCorso = schermata !== "fatto";

  return (
    <div className="grid gap-4">
      <div ref={inizioRef} />
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Link to="/area" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" aria-hidden /> La tua area
        </Link>
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground">
            {scheda.occhiello} · {scheda.titolo}
          </span>
          {inCorso && schermata === "blocco" ? <IndicatoreSalvataggio stato={bozza.stato} ultimoSalvataggio={bozza.ultimoSalvataggio} /> : null}
        </div>
      </div>
      <Progress value={progresso} aria-label="Avanzamento della scheda" />

      {schermata === "benvenuto" ? (
        <SchermataBenvenuto scheda={scheda} nome={primoNome(utente.nombre)} riprende={haRisposte(risposte)} onInizia={() => vaiABlocco(0)} />
      ) : null}

      {schermata === "blocco" && blocco ? (
        <BloccoFlow
          blocco={blocco}
          indice={indice}
          totale={totale}
          risposte={risposte}
          parole={parole}
          errori={errori}
          avanzando={leggi.isPending}
          clienteId={clienteId}
          onChange={handleChange}
          onIndietro={handleIndietro}
          onAvanti={handleAvanti}
        />
      ) : null}

      {schermata === "lettura" ? (
        <SchermataLettura
          errore={erroreLettura}
          inCorso={leggi.isPending}
          onRiprova={() => void avviaLettura(risposte)}
          onTornaAlleRisposte={() => vaiABlocco(totale - 1)}
          onScaricaCopia={scaricaCopia}
        />
      ) : null}

      {schermata === "chiarimenti" ? (
        chiarimentiQuery.isLoading && !chiarimenti ? (
          <SkeletonBlocco altezza="h-48" />
        ) : listaChiarimenti.length === 0 ? (
          <SchermataLettura errore="Non trovo le domande di Aura. Riproviamo la lettura?" inCorso={false} onRiprova={() => void avviaLettura(risposte)} onTornaAlleRisposte={() => vaiABlocco(totale - 1)} />
        ) : (
          <SchermataChiarimenti key={listaChiarimenti.map((c) => c.id).join()} chiarimenti={listaChiarimenti} inviando={rispondi.isPending || leggi.isPending} onInvia={(r) => void handleChiarimenti(r)} />
        )
      ) : null}

      {schermata === "riepilogo" ? (
        riepilogo ? (
          <SchermataRiepilogo
            riepilogo={riepilogo}
            correzioneIniziale={iniziale.riga.riepilogo_correzione ?? ""}
            confermando={conferma.isPending}
            onConferma={handleConferma}
            onCorreggiRisposte={() => vaiABlocco(0)}
          />
        ) : (
          <SchermataLettura errore="Il riepilogo non è pronto. Riproviamo la lettura?" inCorso={false} onRiprova={() => void avviaLettura(risposte)} onTornaAlleRisposte={() => vaiABlocco(totale - 1)} />
        )
      ) : null}

      {schermata === "fatto" ? <SchermataFatto scheda={scheda} risposte={risposte} parole={parole} clienteId={clienteId} appenaInviata={appenaInviata} /> : null}
    </div>
  );
}
