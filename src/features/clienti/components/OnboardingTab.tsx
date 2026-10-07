import { Printer } from "lucide-react";
import { ListaFiles, RiepilogoRisposte, type StatoRiga } from "@/features/scheda";
import { ErroreCaricamento, SkeletonBlocco, StatoVuoto } from "@/shared/components/layout/StatoCaricamento";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { formatDateTime } from "@/shared/utils/formatDate";
import { useSchedaOnboarding, type SchedaOnboardingCliente } from "../hooks/useSchedaOnboarding";
import type { ClienteDettaglio } from "../types";
import { AnalisiAura } from "./AnalisiAura";
import { BadgeStatoOnboarding } from "./BadgesCliente";
import { FotografiaAura } from "./FotografiaAura";
import "../stampa.css";

const ETICHETTA_FASE: Record<Exclude<StatoRiga, "inviato">, string> = {
  bozza: "In compilazione",
  lettura: "Aura sta leggendo",
  chiarimenti: "In attesa dei chiarimenti",
  riepilogo: "Riepilogo da confermare",
};

function BadgeScheda({ scheda }: { scheda: SchedaOnboardingCliente }) {
  if (scheda.fase === "inviato") {
    return (
      <Badge variant="active" dot>
        Inviata il {formatDateTime(scheda.inviatoIl)}
      </Badge>
    );
  }
  return (
    <Badge variant="expiring">
      {ETICHETTA_FASE[scheda.fase]} · ultimo salvataggio {formatDateTime(scheda.aggiornatoIl)}
    </Badge>
  );
}

/** Risposte della scheda con intestazione, allegati e stampa. */
function SchedaOnboarding({ cliente, scheda }: { cliente: ClienteDettaglio; scheda: SchedaOnboardingCliente }) {
  const dettagli = [
    typeof cliente.ore_operative === "number" ? `${cliente.ore_operative}h operative a settimana` : null,
    cliente.profilo ? `profilo: ${cliente.profilo}` : null,
  ].filter(Boolean);

  return (
    <div className="grid gap-4">
      <div className="no-stampa flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-xl">Scheda onboarding</h3>
        <Button variant="outline" size="sm" onClick={() => window.print()}>
          <Printer aria-hidden /> Stampa / PDF
        </Button>
      </div>
      <div className="no-stampa flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
        <BadgeScheda scheda={scheda} />
        {dettagli.length > 0 ? <span>{dettagli.join(" · ")}</span> : null}
      </div>

      {/* Intestazione della sola stampa: il riepilogo qui sotto si stampa così com'è. */}
      <div className="solo-stampa hidden mb-4 border-b-2 pb-2">
        <h2 className="text-2xl font-semibold">{cliente.utente.nombre}</h2>
        <p className="text-sm text-muted-foreground">
          Scheda onboarding · {cliente.utente.email} · <BadgeStatoOnboarding stato={cliente.stato_onboarding} />
        </p>
      </div>

      <section className="scheda-stampa">
        <RiepilogoRisposte
          risposte={scheda.risposte}
          parole={scheda.parole}
          allegati={<ListaFiles clienteId={cliente.id} testoVuoto="Nessun file allegato." />}
        />
        {scheda.materialiTesto ? (
          <details className="mt-4 rounded-md border px-3 py-2 text-sm">
            <summary className="cursor-pointer font-medium">Testo estratto dai materiali caricati</summary>
            <p className="mt-2 whitespace-pre-wrap text-muted-foreground">{scheda.materialiTesto}</p>
          </details>
        ) : null}
      </section>
    </div>
  );
}

/**
 * Tab Onboarding della scheda cliente: la fotografia di Aura (compito 2), poi
 * l'analisi strategica (come prima), poi la scheda con allegati e stampa.
 */
export function OnboardingTab({ cliente }: { cliente: ClienteDettaglio }) {
  const { data: scheda, isLoading, isError } = useSchedaOnboarding(cliente.id);

  return (
    <div className="grid gap-6">
      <div className="no-stampa grid gap-6">
        <FotografiaAura clienteId={cliente.id} scheda={scheda ?? null} />
        <AnalisiAura clienteId={cliente.id} />
      </div>
      {isLoading ? <SkeletonBlocco altezza="h-64" /> : null}
      {isError ? <ErroreCaricamento /> : null}
      {!isLoading && !isError && !scheda ? (
        <StatoVuoto titolo="Scheda non ancora iniziata" testo="Il cliente non ha ancora aperto la scheda onboarding nella sua area." />
      ) : null}
      {scheda ? <SchedaOnboarding cliente={cliente} scheda={scheda} /> : null}
    </div>
  );
}
