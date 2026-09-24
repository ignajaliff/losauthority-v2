import { useState } from "react";
import { Plus } from "lucide-react";
import { PageHeader } from "@/shared/components/layout/PageHeader";
import { ErroreCaricamento, SkeletonBlocco, StatoVuoto } from "@/shared/components/layout/StatoCaricamento";
import { Button } from "@/shared/components/ui/button";
import { formatCurrency, sumImporti } from "@/shared/utils/formatCurrency";
import { LeadDialog } from "../components/LeadDialog";
import { PipelineBoard } from "../components/PipelineBoard";
import { useLeads, useSpostaLead } from "../hooks/useLead";
import { eStageAperto, type Lead, type LeadStage } from "../types";

export default function PipelinePage() {
  const { data: leads, isLoading, isError } = useLeads();
  const sposta = useSpostaLead();
  const [dialog, setDialog] = useState<{ open: boolean; lead: Lead | null }>({ open: false, lead: null });

  const aperti = (leads ?? []).filter((l) => eStageAperto(l.stage));
  const valorePipeline = sumImporti(aperti.map((l) => l.valore));

  const apriNuovo = () => setDialog({ open: true, lead: null });
  const apriLead = (lead: Lead) => setDialog({ open: true, lead });
  const handleSposta = (id: string, stage: LeadStage) => sposta.mutate({ id, stage });

  return (
    <>
      <PageHeader
        titolo="Pipeline"
        sottotitolo={
          leads
            ? `${aperti.length} lead ${aperti.length === 1 ? "aperto" : "aperti"} · valore pipeline ${formatCurrency(valorePipeline)}`
            : "Lead e trattative in corso"
        }
        azioni={
          <Button onClick={apriNuovo}>
            <Plus aria-hidden />
            Nuovo lead
          </Button>
        }
      />

      {isLoading ? (
        <SkeletonBlocco altezza="h-96" />
      ) : isError ? (
        <ErroreCaricamento />
      ) : !leads || leads.length === 0 ? (
        <StatoVuoto titolo="Nessun lead ancora" testo="Aggiungi il primo con “Nuovo lead”." />
      ) : (
        <PipelineBoard leads={leads} onApri={apriLead} onSposta={handleSposta} />
      )}

      <LeadDialog
        open={dialog.open}
        lead={dialog.lead}
        onOpenChange={(open) => setDialog((d) => ({ ...d, open }))}
      />
    </>
  );
}
