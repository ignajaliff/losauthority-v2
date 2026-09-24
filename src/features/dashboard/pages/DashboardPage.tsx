import { ChiamateNonAssegnate } from "@/features/chiamate";
import { PageHeader } from "@/shared/components/layout/PageHeader";
import { DaFareOggi } from "../components/DaFareOggi";
import { ErroriRecenti } from "../components/ErroriRecenti";
import { ProssimeCall } from "../components/ProssimeCall";
import { StatCard } from "../components/StatCard";
import { UltimiOnboarding } from "../components/UltimiOnboarding";
import { useClientiDashboard, useErroriRecenti, useLeadDaFare, useUltimiOnboarding } from "../hooks/useDashboard";
import type { ClienteDashboard, StatisticheDashboard } from "../types";

const SETTE_GIORNI_MS = 7 * 24 * 60 * 60 * 1000;

function calcolaStatistiche(clienti: ClienteDashboard[]): StatisticheDashboard {
  const adesso = Date.now();
  const adessoIso = new Date(adesso).toISOString();
  const limite = new Date(adesso + SETTE_GIORNI_MS).toISOString();
  return {
    clientiAttivi: clienti.filter((c) => c.fase !== "completato").length,
    onboardingDaLavorare: clienti.filter(
      (c) => c.stato_onboarding === "nuovo" || c.stato_onboarding === "in_lavorazione",
    ).length,
    prontiPerHub: clienti.filter((c) => c.stato_onboarding === "completato").length,
    callProssimi7Giorni: clienti.filter(
      (c) => !!c.prossima_call && c.prossima_call >= adessoIso && c.prossima_call <= limite,
    ).length,
  };
}

export default function DashboardPage() {
  const clienti = useClientiDashboard();
  const onboarding = useUltimiOnboarding();
  const lead = useLeadDaFare();
  const errori = useErroriRecenti();

  const stat = clienti.data ? calcolaStatistiche(clienti.data) : undefined;

  return (
    <div className="grid gap-6">
      <PageHeader titolo="Dashboard" sottotitolo="Il punto sui clienti, le call e le cose da fare." />

      {errori.data && errori.data.length > 0 ? <ErroriRecenti errori={errori.data} /> : null}

      <section aria-label="Contatori" className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard etichetta="Clienti attivi" valore={stat?.clientiAttivi} caricamento={clienti.isLoading} />
        <StatCard etichetta="Onboarding da lavorare" valore={stat?.onboardingDaLavorare} caricamento={clienti.isLoading} />
        <StatCard etichetta="Pronti per l'hub" valore={stat?.prontiPerHub} caricamento={clienti.isLoading} />
        <StatCard etichetta="Call nei prossimi 7 giorni" valore={stat?.callProssimi7Giorni} caricamento={clienti.isLoading} />
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <ProssimeCall clienti={clienti.data} caricamento={clienti.isLoading} errore={clienti.isError} />
        <DaFareOggi
          clienti={clienti.data}
          lead={lead.data}
          caricamento={clienti.isLoading || lead.isLoading}
          errore={clienti.isError || lead.isError}
        />
        <UltimiOnboarding onboarding={onboarding.data} caricamento={onboarding.isLoading} errore={onboarding.isError} />
        <ChiamateNonAssegnate />
      </div>
    </div>
  );
}
