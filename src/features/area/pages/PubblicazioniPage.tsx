import { useMemo, useState } from "react";
import { useAuth } from "@/features/auth";
import { useArriviLead } from "@/features/crm";
import { primoNome } from "@/features/scheda";
import {
  CardPubblicazione,
  CollegaInstagram,
  GraficoCrescita,
  PubblicazioneDialog,
  RilevazioneDialog,
  StatoInstagram,
  campioniLead,
  primaLetturaInCorso,
  useEliminaRilevazione,
  useFollower,
  useInstagramCliente,
  usePubblicazioni,
  useRicaricaDopoPrimaLettura,
  type Piattaforma,
  type Pubblicazione,
  type RilevazioneFollower,
} from "@/features/pubblicazioni";
import { PageHeader } from "@/shared/components/layout/PageHeader";
import { ErroreCaricamento, SkeletonBlocco, StatoVuoto } from "@/shared/components/layout/StatoCaricamento";

// Array vuoti stabili: un `?? []` nuovo a ogni render farebbe ricalcolare il grafico.
const NESSUNA: Pubblicazione[] = [];
const NESSUN_FOLLOWER: RilevazioneFollower[] = [];

/**
 * /area/pubblicazioni → gli ultimi video Instagram del cliente con le rilevazioni.
 * Le carte le crea `instagram-sync` (profilo collegato una volta sola); il cliente
 * può aggiungere rilevazioni a mano tra una lettura automatica e l'altra.
 */
export default function PubblicazioniPage() {
  const { utente } = useAuth();
  const clienteId = utente?.id ?? "";
  const instagram = useInstagramCliente(utente?.id);
  const collegato = !!instagram.data?.instagram;
  const inCorso = primaLetturaInCorso(instagram.data);
  const pubblicazioni = usePubblicazioni(utente?.id, inCorso);
  const follower = useFollower(utente?.id, instagram.data?.instagram ?? null, inCorso);
  // Dal CRM (pagina Clienti) solo i giorni di arrivo: niente nomi né recapiti. Senza accettazione dei documenti è vuoto.
  const lead = useArriviLead(utente?.id);
  const andamentoLead = useMemo(() => campioniLead(lead.data ?? []), [lead.data]);
  useRicaricaDopoPrimaLettura(clienteId, inCorso);
  const eliminaRilevazione = useEliminaRilevazione(clienteId);
  const [modifica, setModifica] = useState<Pubblicazione | null>(null);
  const [rilevazione, setRilevazione] = useState<{ pubblicazione: Pubblicazione; piattaforma: Piattaforma } | null>(null);

  if (!utente) return null;
  const nome = primoNome(utente.nombre);
  const lista = pubblicazioni.data ?? NESSUNA;
  const letture = follower.data ?? NESSUN_FOLLOWER;
  const caricamento = instagram.isLoading || pubblicazioni.isLoading || follower.isLoading || lead.isLoading;
  const errore = instagram.isError || pubblicazioni.isError || follower.isError || lead.isError;
  const conDati = lista.length > 0 || letture.length > 0 || andamentoLead.length > 0;

  return (
    <div className="grid gap-2">
      <PageHeader
        occhiello={`Il tuo percorso${nome ? ` · ${nome}` : ""}`}
        titolo="Pubblicazioni"
        sottotitolo="I tuoi ultimi video Instagram con visualizzazioni, mi piace e commenti, e come crescono follower e lead. I numeri si aggiornano da soli; puoi aggiungere una rilevazione quando vuoi."
      />

      {caricamento ? <SkeletonBlocco altezza="h-64" /> : null}
      {errore ? <ErroreCaricamento /> : null}

      {instagram.data && !collegato ? <CollegaInstagram clienteId={clienteId} /> : null}

      {instagram.data && collegato ? <StatoInstagram clienteId={clienteId} stato={instagram.data} /> : null}

      {collegato && pubblicazioni.data && lista.length === 0 ? (
        <StatoVuoto
          titolo={inCorso ? "Sto leggendo il tuo profilo" : "Nessun video trovato"}
          testo={
            inCorso
              ? "Ci vuole circa un minuto: i video compaiono qui da soli. Se non succede, il controllo riparte domani in automatico."
              : "Nel profilo non ho trovato video pubblici. Appena ne pubblichi uno, lo trovo al prossimo controllo (ogni 30 giorni) oppure premi «Rileggi il profilo»."
          }
        />
      ) : null}

      {!caricamento && !errore && conDati ? (
        <div className="mt-2">
          <GraficoCrescita pubblicazioni={lista} follower={letture} lead={andamentoLead} />
        </div>
      ) : null}

      {lista.length > 0 ? (
        <div className="mt-2 grid gap-4 md:grid-cols-2">
          {lista.map((p) => (
            <CardPubblicazione
              key={p.id}
              pubblicazione={p}
              onModifica={setModifica}
              onRileva={(x, piattaforma) => setRilevazione({ pubblicazione: x, piattaforma })}
              onEliminaRilevazione={(id) => eliminaRilevazione.mutate(id)}
              eliminaInCorso={eliminaRilevazione.isPending}
            />
          ))}
        </div>
      ) : null}

      <PubblicazioneDialog clienteId={clienteId} pubblicazione={modifica} onChiudi={() => setModifica(null)} />
      <RilevazioneDialog clienteId={clienteId} bersaglio={rilevazione} onChiudi={() => setRilevazione(null)} />
    </div>
  );
}
