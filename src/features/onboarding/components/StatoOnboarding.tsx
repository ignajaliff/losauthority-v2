import { QUESTIONARI, type QuestionarioId, type StatoQuestionario, type StatoScheda } from "@/features/questionari";
import { Badge } from "@/shared/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";
import { cn } from "@/lib/utils";
import {
  ETICHETTA_STATO_ONBOARDING,
  STATI_ONBOARDING,
  VARIANTE_STATO_ONBOARDING,
  eStatoOnboarding,
  type StatoOnboarding,
} from "../types";

/** Badge con l'etichetta dello stato dell'onboarding. */
export function BadgeStatoOnboarding({ stato }: { stato: StatoOnboarding }) {
  return <Badge variant={VARIANTE_STATO_ONBOARDING[stato]}>{ETICHETTA_STATO_ONBOARDING[stato]}</Badge>;
}

const CLASSE_PALLINO: Record<StatoScheda, string> = {
  mancante: "border border-border bg-transparent",
  bozza: "bg-muted-foreground/50",
  inviato: "bg-primary",
};

/** Tre pallini: mancante (vuoto) / bozza (grigio) / inviata (pieno). */
export function PalliniSchede({ schede }: { schede: Record<QuestionarioId, StatoQuestionario> }) {
  const descrizione = QUESTIONARI.map((q) => `${q.titolo}: ${schede[q.id].stato}`).join(", ");
  return (
    <span className="inline-flex items-center gap-1.5" role="img" aria-label={descrizione} title={descrizione}>
      {QUESTIONARI.map((q) => (
        <span key={q.id} className={cn("size-2.5 rounded-full", CLASSE_PALLINO[schede[q.id].stato])} />
      ))}
    </span>
  );
}

const ITEMS_STATO: Record<string, string> = { ...ETICHETTA_STATO_ONBOARDING };

export type ValoreSelectStato = StatoOnboarding | "tutti";

interface SelectStatoOnboardingProps {
  valore: ValoreSelectStato;
  onChange: (stato: ValoreSelectStato) => void;
  disabilitato?: boolean;
  /** Con `tutti` aggiunge l'opzione "Tutti gli stati" (filtro lista). */
  conTutti?: boolean;
}

/** Select degli stati dell'onboarding (filtro in lista o cambio stato nel dettaglio). */
export function SelectStatoOnboarding({ valore, onChange, disabilitato, conTutti }: SelectStatoOnboardingProps) {
  const items = conTutti ? { tutti: "Tutti gli stati", ...ITEMS_STATO } : ITEMS_STATO;
  return (
    <Select
      items={items}
      value={valore}
      disabled={disabilitato}
      onValueChange={(v) => {
        if (v === "tutti" || (typeof v === "string" && eStatoOnboarding(v))) onChange(v);
      }}
    >
      <SelectTrigger aria-label="Stato onboarding" className="min-w-44">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {conTutti ? <SelectItem value="tutti">Tutti gli stati</SelectItem> : null}
        {STATI_ONBOARDING.map((s) => (
          <SelectItem key={s} value={s}>
            {ETICHETTA_STATO_ONBOARDING[s]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
