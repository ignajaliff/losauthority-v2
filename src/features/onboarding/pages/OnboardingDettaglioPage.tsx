import { Link, useParams } from "react-router-dom";
import { ArrowLeft, ExternalLink, Printer } from "lucide-react";
import { AllegatiInvio, QUESTIONARI, RiepilogoRisposte, type Questionario } from "@/features/questionari";
import { PageHeader } from "@/shared/components/layout/PageHeader";
import { ErroreCaricamento, SkeletonBlocco, StatoVuoto } from "@/shared/components/layout/StatoCaricamento";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/components/ui/tabs";
import { formatDateTime } from "@/shared/utils/formatDate";
import { useAggiornaStatoOnboarding, useClienteOnboarding } from "../hooks/useOnboarding";
import { BadgeStatoOnboarding, SelectStatoOnboarding } from "../components/StatoOnboarding";
import { eStatoOnboarding, type ClienteOnboarding } from "../types";
import "../stampa.css";

function SchedaCliente({ q, dati }: { q: Questionario; dati: ClienteOnboarding }) {
  const invio = dati.invii[q.id];
  if (!invio) return <StatoVuoto titolo="Non ancora iniziata" testo="Il cliente non ha ancora aperto questa scheda." />;
  return (
    <div className="grid gap-3">
      <p className="text-sm text-muted-foreground">
        {invio.stato === "inviato" ? `Inviata il ${formatDateTime(invio.inviatoIl)}` : "In bozza: il cliente sta ancora compilando."}
      </p>
      <RiepilogoRisposte
        definizione={q.definizione}
        risposte={invio.risposte}
        allegati={<AllegatiInvio invioId={invio.id} testoVuoto="Nessun file allegato." />}
      />
    </div>
  );
}

/** Dettaglio onboarding di un cliente: stato, le 3 schede, allegati, stampa. */
export default function OnboardingDettaglioPage() {
  const { id } = useParams<{ id: string }>();
  const { data, isLoading, isError } = useClienteOnboarding(id);
  const aggiorna = useAggiornaStatoOnboarding(id ?? "");

  if (isLoading) return <SkeletonBlocco altezza="h-64" />;
  if (isError) return <ErroreCaricamento />;
  if (!data) {
    return (
      <div className="grid gap-4">
        <StatoVuoto titolo="Cliente non trovato" />
        <Button variant="outline" className="justify-self-start" render={<Link to="/onboarding" />}>
          <ArrowLeft aria-hidden /> Onboarding
        </Button>
      </div>
    );
  }

  const stato = eStatoOnboarding(data.cliente.stato_onboarding) ? data.cliente.stato_onboarding : "nuovo";
  const sottotitolo = [
    data.email,
    typeof data.cliente.ore_operative === "number" ? `${data.cliente.ore_operative}h operative/sett.` : null,
    data.cliente.profilo ? `profilo: ${data.cliente.profilo}` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="grid gap-4">
      <div className="no-stampa">
        <Link to="/onboarding" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" aria-hidden /> Onboarding
        </Link>
      </div>

      <PageHeader
        titolo={data.nombre}
        sottotitolo={sottotitolo}
        azioni={
          <div className="no-stampa flex flex-wrap items-center gap-2">
            <SelectStatoOnboarding valore={stato} disabilitato={aggiorna.isPending} onChange={(s) => {
                if (s !== "tutti") aggiorna.mutate(s);
              }}
            />
            {data.cliente.notion_hub_url ? (
              <Button variant="outline" render={<a href={data.cliente.notion_hub_url} target="_blank" rel="noopener noreferrer" />}>
                Apri hub Notion <ExternalLink aria-hidden />
              </Button>
            ) : null}
            <Button variant="outline" onClick={() => window.print()}>
              <Printer aria-hidden /> Stampa / PDF
            </Button>
          </div>
        }
      />

      <div className="no-stampa">
        <Tabs defaultValue={QUESTIONARI[0]?.id}>
          <TabsList>
            {QUESTIONARI.map((q) => (
              <TabsTrigger key={q.id} value={q.id}>
                {q.num}. {q.titolo}
                <Badge variant={data.invii[q.id]?.stato === "inviato" ? "default" : "outline"} className="ml-1">
                  {data.invii[q.id]?.stato === "inviato" ? "Inviata" : data.invii[q.id] ? "Bozza" : "—"}
                </Badge>
              </TabsTrigger>
            ))}
          </TabsList>
          {QUESTIONARI.map((q) => (
            <TabsContent key={q.id} value={q.id} className="pt-4">
              <SchedaCliente q={q} dati={data} />
            </TabsContent>
          ))}
        </Tabs>
      </div>

      {/* Vista di stampa: intestazione + tutte e tre le schede in sequenza. */}
      <div className="solo-stampa hidden">
        <div className="mb-4 border-b-2 pb-2">
          <h2 className="text-2xl font-semibold">{data.nombre}</h2>
          <p className="text-sm text-muted-foreground">
            Schede onboarding · {data.email} · <BadgeStatoOnboarding stato={stato} />
          </p>
        </div>
        {QUESTIONARI.map((q) => (
          <section key={q.id} className="scheda-stampa mb-6">
            <h3 className="mb-3 text-lg font-semibold">
              {q.num}. {q.titolo}
            </h3>
            <SchedaCliente q={q} dati={data} />
          </section>
        ))}
      </div>
    </div>
  );
}
