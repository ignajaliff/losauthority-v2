/**
 * Fasi del percorso Los Authority e stati dell'onboarding.
 * `value` è ciò che si salva nel DB (vincolo CHECK su `clienti`), le etichette
 * si possono cambiare liberamente.
 */
export type FaseValore = "onboarding" | "call_1" | "call_2" | "call_3" | "call_4" | "completato";

export interface Fase {
  value: FaseValore;
  label: string;
  breve: string;
}

export const FASI: Fase[] = [
  { value: "onboarding", label: "Onboarding", breve: "Onboarding" },
  { value: "call_1", label: "Call 1 — Offerta & Posizionamento", breve: "Call 1" },
  { value: "call_2", label: "Call 2 — Avatar & Dolori", breve: "Call 2" },
  { value: "call_3", label: "Call 3 — Crescita organica", breve: "Call 3" },
  { value: "call_4", label: "Call 4 — Automazioni AI", breve: "Call 4" },
  { value: "completato", label: "Completato", breve: "Completato" },
];

export function etichettaFase(value: string | null | undefined, breve = false): string {
  const f = FASI.find((x) => x.value === value);
  if (!f) return value ?? "—";
  return breve ? f.breve : f.label;
}

export type BadgeVariante = "default" | "secondary" | "outline" | "destructive";

/** Variante del Badge shadcn per la fase. */
export function varianteFase(value: string | null | undefined): BadgeVariante {
  if (value === "completato") return "default";
  if (value === "onboarding") return "outline";
  return "secondary";
}

export type StatoOnboardingValore = "nuovo" | "in_lavorazione" | "completato" | "hub_creato" | "fuori_target";

export const STATI_ONBOARDING: Array<{ value: StatoOnboardingValore; label: string }> = [
  { value: "nuovo", label: "Nuovo" },
  { value: "in_lavorazione", label: "In lavorazione" },
  { value: "completato", label: "Completato" },
  { value: "hub_creato", label: "Hub creato" },
  { value: "fuori_target", label: "Fuori target" },
];

export function etichettaStatoOnboarding(value: string | null | undefined): string {
  return STATI_ONBOARDING.find((s) => s.value === value)?.label ?? value ?? "—";
}

/** Variante del Badge shadcn per lo stato dell'onboarding. */
export function varianteStatoOnboarding(value: string | null | undefined): BadgeVariante {
  if (value === "hub_creato") return "default";
  if (value === "fuori_target") return "destructive";
  if (value === "nuovo") return "outline";
  return "secondary";
}
