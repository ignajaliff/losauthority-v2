import { useMemo, useState } from "react";
import { CheckCircle2, Download, Plus } from "lucide-react";
import { useAuth } from "@/features/auth";
import {
  AccettazioneCrm,
  AvvisoNuovaVersione,
  DocumentoLegaleDialog,
  documentiDi,
  FiltroStati,
  LeadCrmDialog,
  STATI_LEAD,
  StatisticheCrm,
  TabellaLeadCrm,
  useCambiaStatoLeadCrm,
  useDocumentiCrm,
  useEsportaContatti,
  useLeadCrm,
  useStatoCrm,
  versione,
  versioneInArrivo,
  type DocumentoLegale,
  type FiltroStato,
  type LeadCrm,
  type OffertaScelta,
  type StatoLead,
} from "@/features/crm";
import { codiceOfferta, useOfferte } from "@/features/offerta";
import { primoNome } from "@/features/scheda";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent } from "@/shared/components/ui/card";
import { PageHeader } from "@/shared/components/layout/PageHeader";
import { ErroreCaricamento, SkeletonBlocco, StatoVuoto } from "@/shared/components/layout/StatoCaricamento";
import { formatDateTime } from "@/shared/utils/formatDate";

/** Il popup tiene il contatto anche mentre si chiude, così il titolo non cambia durante l'animazione. */
interface Popup {
  aperto: boolean;
  /** null → nuovo contatto. */
  lead: LeadCrm | null;
}

/**
 * /area/clienti → il CRM del cliente. Si apre solo dopo l'accettazione della versione in
 * vigore dei documenti (Termini, Accordo art. 28, clausole 1341-1342, presa visione
 * dell'Informativa): il blocco vale nel database (RLS di `crm_lead`), qui si mostra la
 * schermata di accettazione al posto della tabella. L'esportazione funziona sempre.
 */
export default function ClientiAreaPage() {
  const { utente } = useAuth();
  const clienteId = utente?.id ?? "";
  const stato = useStatoCrm(utente?.id);
  const docs = useDocumentiCrm(!!utente);
  const attivo = stato.data?.attivo === true;
  // Senza accettazione il database non restituirebbe niente: non si chiede neanche.
  const lead = useLeadCrm(attivo ? utente?.id : undefined);
  const offerte = useOfferte(attivo ? utente?.id : undefined);
  const cambiaStato = useCambiaStatoLeadCrm(clienteId);
  const esporta = useEsportaContatti();
  const [filtro, setFiltro] = useState<FiltroStato>("tutti");
  const [popup, setPopup] = useState<Popup>({ aperto: false, lead: null });
  const [documentoAperto, setDocumentoAperto] = useState<DocumentoLegale | null>(null);
  const [appenaAccettato, setAppenaAccettato] = useState<{ il: string; versione: number } | null>(null);

  const scelte = useMemo<OffertaScelta[]>(
    () => (offerte.data ?? []).map((o, i) => ({ id: o.id, nome: o.nome ?? `${codiceOfferta(i + 1)} · senza nome` })),
    [offerte.data],
  );
  const nomiOfferte = useMemo(() => Object.fromEntries(scelte.map((o) => [o.id, o.nome])), [scelte]);

  if (!utente) return null;
  const nome = primoNome(utente.nombre);
  const tutti = lead.data ?? [];
  const perStato = Object.fromEntries(STATI_LEAD.map((s) => [s, tutti.filter((l) => l.stato === s).length])) as Record<StatoLead, number>;
  const righe = filtro === "tutti" ? tutti : tutti.filter((l) => l.stato === filtro);

  const d = docs.data;
  const corrente = stato.data?.versioneCorrente ?? null;
  const inVigore = d ? versione(d, corrente) : null;
  const inArrivo = d ? versioneInArrivo(d, corrente) : null;
  const pronto = !!stato.data && !!d;

  return (
    <div className="grid gap-6">
      <PageHeader
        occhiello={`Il tuo percorso${nome ? ` · ${nome}` : ""}`}
        titolo="Clienti"
        sottotitolo="Le persone che ti contattano: da dove arrivano, quale offerta vogliono, a che punto siete e quante ne chiudi. Ogni contatto compare anche nel grafico di Pubblicazioni il giorno in cui è arrivato."
        azioni={
          attivo && !appenaAccettato ? (
            <Button onClick={() => setPopup({ aperto: true, lead: null })}>
              <Plus aria-hidden /> Nuovo contatto
            </Button>
          ) : null
        }
      />

      {stato.isLoading || docs.isLoading ? <SkeletonBlocco altezza="h-64" /> : null}
      {stato.isError || docs.isError || lead.isError ? <ErroreCaricamento /> : null}

      {d && inArrivo ? <AvvisoNuovaVersione versione={inArrivo} documenti={documentiDi(d, inArrivo)} onApri={setDocumentoAperto} /> : null}

      {pronto && appenaAccettato ? (
        <Card>
          <CardContent className="flex flex-col items-start gap-3 py-6">
            <CheckCircle2 className="size-6 text-status-active" aria-hidden />
            <p className="font-medium">La sezione Clienti è attiva</p>
            <p className="text-sm text-muted-foreground">
              Hai accettato la versione {appenaAccettato.versione} dei documenti il {formatDateTime(appenaAccettato.il)}.
            </p>
            <Button onClick={() => setAppenaAccettato(null)}>Vai ai tuoi contatti</Button>
          </CardContent>
        </Card>
      ) : null}

      {pronto && !attivo && !appenaAccettato ? (
        inVigore ? (
          <AccettazioneCrm
            key={inVigore.versione}
            clienteId={clienteId}
            versione={inVigore}
            documenti={documentiDi(d, inVigore)}
            rinnovo={stato.data?.versioneAccettata !== null}
            onApri={setDocumentoAperto}
            onAccettato={(il, v) => setAppenaAccettato({ il, versione: v })}
          />
        ) : (
          <StatoVuoto titolo="La sezione Clienti non è ancora disponibile" testo="I documenti da accettare non sono ancora pubblicati." />
        )
      ) : null}

      {attivo && !appenaAccettato ? (
        <>
          {lead.isLoading ? <SkeletonBlocco altezza="h-48" /> : null}
          {lead.data && tutti.length === 0 ? (
            <StatoVuoto
              titolo="Ancora nessun contatto"
              testo="Quando qualcuno ti scrive o chiede informazioni, premi «Nuovo contatto»: nome, da dove è arrivato, quando e a che punto siete."
            />
          ) : null}
          {tutti.length > 0 ? (
            <>
              <StatisticheCrm contatti={tutti} />
              <div className="grid gap-4">
                <FiltroStati totale={tutti.length} perStato={perStato} attivo={filtro} onChange={setFiltro} />
                <TabellaLeadCrm
                  righe={righe}
                  nomiOfferte={nomiOfferte}
                  testoVuoto="Nessun contatto in questo stato."
                  onApri={(l) => setPopup({ aperto: true, lead: l })}
                  onCambiaStato={(id, s) => cambiaStato.mutate({ id, stato: s })}
                />
              </div>
            </>
          ) : null}
        </>
      ) : null}

      {/* L'esportazione funziona sempre, anche a sezione chiusa: i contatti sono del cliente. */}
      {pronto ? (
        <Button variant="outline" className="w-fit" disabled={esporta.isPending} onClick={() => esporta.mutate()}>
          <Download aria-hidden /> {esporta.isPending ? "Preparo il file…" : "Esporta i miei contatti (CSV)"}
        </Button>
      ) : null}

      <LeadCrmDialog
        clienteId={clienteId}
        aperto={popup.aperto}
        lead={popup.lead}
        offerte={scelte}
        onChiudi={() => setPopup((p) => ({ ...p, aperto: false }))}
      />
      <DocumentoLegaleDialog documento={documentoAperto} onChiudi={() => setDocumentoAperto(null)} />
    </div>
  );
}
