import { useMemo, useState } from "react";
import { Plus, Search } from "lucide-react";
import { PageHeader } from "@/shared/components/layout/PageHeader";
import { ErroreCaricamento, SkeletonBlocco } from "@/shared/components/layout/StatoCaricamento";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { formatCurrency, sumImporti } from "@/shared/utils/formatCurrency";
import { FunnelPills, type FiltroStage, type RiepilogoStage } from "../components/FunnelPills";
import { LeadDialog } from "../components/LeadDialog";
import { TabellaLead } from "../components/TabellaLead";
import { useLeads, useSpostaLead } from "../hooks/useLead";
import { eStageAperto, LEAD_STAGES, type Lead, type LeadStage } from "../types";

const FAR = "9999-12-31";

/** Prima le azioni in scadenza, poi chi non ha data (più recente prima). */
function ordina(a: Lead, b: Lead): number {
  const perData = (a.prossima_azione_il ?? FAR).localeCompare(b.prossima_azione_il ?? FAR);
  return perData !== 0 ? perData : b.updated_at.localeCompare(a.updated_at);
}

function riepilogoPerStage(leads: Lead[]): Record<string, RiepilogoStage> {
  const mappa: Record<string, RiepilogoStage> = Object.fromEntries(LEAD_STAGES.map((s) => [s.key, { count: 0, valore: 0 }]));
  for (const l of leads) {
    const voce = (mappa[l.stage] ??= { count: 0, valore: 0 });
    voce.count += 1;
    voce.valore = sumImporti([voce.valore, l.valore]);
  }
  return mappa;
}

/** Pipeline in stile CRM: imbuto per stage, ricerca e tabella con cambio stage inline. */
export default function PipelinePage() {
  const { data: leads, isLoading, isError } = useLeads();
  const sposta = useSpostaLead();
  const [dialog, setDialog] = useState<{ open: boolean; lead: Lead | null }>({ open: false, lead: null });
  const [filtro, setFiltro] = useState<FiltroStage>("tutti");
  const [ricerca, setRicerca] = useState("");

  const tutti = useMemo(() => leads ?? [], [leads]);
  const aperti = tutti.filter((l) => eStageAperto(l.stage));
  const valorePipeline = sumImporti(aperti.map((l) => l.valore));
  const perStage = useMemo(() => riepilogoPerStage(tutti), [tutti]);
  const totale: RiepilogoStage = { count: tutti.length, valore: sumImporti(tutti.map((l) => l.valore)) };

  const righe = useMemo(() => {
    const termine = ricerca.trim().toLowerCase();
    return tutti
      .filter((l) => (filtro === "tutti" ? true : l.stage === filtro))
      .filter((l) =>
        !termine
          ? true
          : [l.nome, l.contatto, l.fonte, l.note, l.prossima_azione]
              .filter(Boolean)
              .some((v) => String(v).toLowerCase().includes(termine)),
      )
      .sort(ordina);
  }, [tutti, filtro, ricerca]);

  const apriNuovo = () => setDialog({ open: true, lead: null });
  const apriLead = (lead: Lead) => setDialog({ open: true, lead });
  const handleSposta = (id: string, stage: LeadStage) => sposta.mutate({ id, stage });

  return (
    <div className="grid gap-4">
      <PageHeader
        titolo="Pipeline"
        sottotitolo={
          leads
            ? `${aperti.length} lead ${aperti.length === 1 ? "attivo" : "attivi"} · valore potenziale ${formatCurrency(valorePipeline)}`
            : "Lead e trattative in corso"
        }
        azioni={
          <Button size="sm" onClick={apriNuovo}>
            <Plus aria-hidden />
            Nuovo lead
          </Button>
        }
      />

      {isLoading ? <SkeletonBlocco altezza="h-96" /> : null}
      {isError ? <ErroreCaricamento /> : null}

      {leads ? (
        <>
          <FunnelPills totale={totale} perStage={perStage} attivo={filtro} onChange={setFiltro} />

          <div className="relative max-w-[420px]">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-[15px] -translate-y-1/2 text-muted-foreground" aria-hidden />
            <Input
              aria-label="Cerca lead"
              className="pl-9"
              value={ricerca}
              onChange={(e) => setRicerca(e.target.value)}
              placeholder="Cerca per nome, contatto, fonte…"
            />
          </div>

          <TabellaLead
            righe={righe}
            testoVuoto={tutti.length === 0 ? "Nessun lead ancora. Aggiungi il primo con “Nuovo lead”." : "Nessun lead con questi filtri."}
            onApri={apriLead}
            onSposta={handleSposta}
          />
        </>
      ) : null}

      <LeadDialog open={dialog.open} lead={dialog.lead} onOpenChange={(open) => setDialog((d) => ({ ...d, open }))} />
    </div>
  );
}
