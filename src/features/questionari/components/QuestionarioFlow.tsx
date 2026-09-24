import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useAuth, type UtenteCorrente } from "@/features/auth";
import { Progress } from "@/shared/components/ui/progress";
import { ErroreCaricamento, SkeletonBlocco } from "@/shared/components/layout/StatoCaricamento";
import { primoNome, haRisposte } from "../format";
import { avvisoOre, validaSezione, type ErroriDomande } from "../schema";
import { useInvio, type InvioConRisposte } from "../hooks/useInvio";
import { useSalvaBozza } from "../hooks/useSalvaBozza";
import { ErroreValidazione, useInviaQuestionario } from "../hooks/useInviaQuestionario";
import { IndicatoreSalvataggio } from "./IndicatoreSalvataggio";
import { SchermataBenvenuto, SchermataFatto } from "./SchermateFlow";
import { SezioneFlow } from "./SezioneFlow";
import type { Questionario, Risposte, ValoreRisposta } from "../types";

type Schermata = "benvenuto" | "sezione" | "fatto";

interface QuestionarioFlowProps {
  questionario: Questionario;
}

/** Carica invio + risposte del cliente loggato e avvia il flow (stato inizializzato dai dati). */
export function QuestionarioFlow({ questionario }: QuestionarioFlowProps) {
  const { utente } = useAuth();
  const { data, isLoading, isError } = useInvio(utente?.id, questionario);
  if (!utente) return null;
  if (isLoading) return <SkeletonBlocco altezza="h-64" />;
  if (isError || !data) return <ErroreCaricamento />;
  return <FlowCompilazione key={data.invio.id} questionario={questionario} utente={utente} iniziale={data} />;
}

interface FlowCompilazioneProps {
  questionario: Questionario;
  utente: UtenteCorrente;
  iniziale: InvioConRisposte;
}

function schermataIniziale(iniziale: InvioConRisposte): Schermata {
  if (iniziale.invio.stato === "inviato") return "fatto";
  return iniziale.invio.schermata === "sezione" ? "sezione" : "benvenuto";
}

/**
 * Motore di compilazione: navigazione per sezioni con progresso, bozza
 * automatica, errori inline, invio finale e sola lettura dopo l'invio.
 */
function FlowCompilazione({ questionario, utente, iniziale }: FlowCompilazioneProps) {
  const clienteId = utente.id;
  const invioId = iniziale.invio.id;
  const sezioni = questionario.definizione;
  const totale = sezioni.length;

  const bozza = useSalvaBozza({ invioId, clienteId, questionario });
  const invio = useInviaQuestionario({ invioId, clienteId, questionario, primaDiInviare: bozza.svuota });

  const [schermata, setSchermata] = useState<Schermata>(() => schermataIniziale(iniziale));
  const [indice, setIndice] = useState(() =>
    Math.min(Math.max(iniziale.invio.sezione_indice ?? 0, 0), totale - 1),
  );
  const [risposte, setRisposte] = useState<Risposte>(iniziale.risposte);
  const [errori, setErrori] = useState<ErroriDomande>({});
  const [avviso, setAvviso] = useState<string | null>(null);
  const [oreConfermate, setOreConfermate] = useState(false);
  const [appenaInviata, setAppenaInviata] = useState(false);
  const inizioRef = useRef<HTMLDivElement>(null);

  function scorriInAlto() {
    requestAnimationFrame(() => inizioRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
  }

  function handleChange(id: string, valore: ValoreRisposta) {
    const prossime = { ...risposte, [id]: valore };
    setRisposte(prossime);
    if (errori[id]) {
      const { [id]: _rimosso, ...resto } = errori;
      setErrori(resto);
    }
    bozza.programma(prossime, [id], { schermata: "sezione", sezioneIndice: indice });
  }

  function vaiASezione(i: number) {
    setErrori({});
    setAvviso(null);
    setOreConfermate(false);
    setIndice(i);
    setSchermata("sezione");
    bozza.programma(risposte, [], { schermata: "sezione", sezioneIndice: i });
    scorriInAlto();
  }

  function procedi() {
    setAvviso(null);
    if (indice < totale - 1) {
      vaiASezione(indice + 1);
      return;
    }
    invio.mutate(risposte, {
      onSuccess: () => {
        setAppenaInviata(true);
        setSchermata("fatto");
        scorriInAlto();
      },
      onError: (errore) => {
        if (!(errore instanceof ErroreValidazione)) return;
        const prima = errore.esito.primaSezioneInvalida;
        if (prima === null) return;
        vaiASezione(prima);
        setErrori(errore.esito.perSezione[sezioni[prima]?.id ?? ""] ?? {});
      },
    });
  }

  function handleAvanti() {
    const sezione = sezioni[indice];
    if (!sezione) return;
    const errs = validaSezione(sezione, risposte);
    if (Object.keys(errs).length > 0) {
      setErrori(errs);
      scorriInAlto();
      return;
    }
    setErrori({});
    const avv = avvisoOre(sezione, risposte);
    if (avv && !oreConfermate) {
      setAvviso(avv);
      return;
    }
    procedi();
  }

  function handleIndietro() {
    setErrori({});
    setAvviso(null);
    if (indice === 0) setSchermata("benvenuto");
    else vaiASezione(indice - 1);
  }

  const sezione = sezioni[indice];
  const progresso = schermata === "fatto" ? 100 : schermata === "benvenuto" ? 0 : Math.round(((indice + 1) / totale) * 100);
  const inBozza = iniziale.invio.stato === "bozza" && schermata !== "fatto";

  return (
    <div className="grid gap-4">
      <div ref={inizioRef} />
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Link to="/area" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" aria-hidden /> La tua area
        </Link>
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground">
            {questionario.occhiello} · {questionario.titolo}
          </span>
          {inBozza && schermata === "sezione" ? (
            <IndicatoreSalvataggio stato={bozza.stato} ultimoSalvataggio={bozza.ultimoSalvataggio} />
          ) : null}
        </div>
      </div>
      <Progress value={progresso} aria-label="Avanzamento della scheda" />

      {schermata === "benvenuto" ? (
        <SchermataBenvenuto
          questionario={questionario}
          nome={primoNome(utente.nombre)}
          riprende={haRisposte(risposte)}
          onInizia={() => vaiASezione(0)}
        />
      ) : null}

      {schermata === "sezione" && sezione ? (
        <SezioneFlow
          sezione={sezione}
          indice={indice}
          totale={totale}
          risposte={risposte}
          errori={errori}
          avviso={avviso}
          invioInCorso={invio.isPending}
          questionarioId={questionario.id}
          invioId={invioId}
          clienteId={clienteId}
          onChange={handleChange}
          onIndietro={handleIndietro}
          onAvanti={handleAvanti}
          onConfermaOre={() => {
            setOreConfermate(true);
            procedi();
          }}
          onRivediOre={() => setAvviso(null)}
        />
      ) : null}

      {schermata === "fatto" ? (
        <SchermataFatto questionario={questionario} risposte={risposte} invioId={invioId} appenaInviata={appenaInviata} />
      ) : null}
    </div>
  );
}
