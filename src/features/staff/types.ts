import type { Tables } from "@/integrations/supabase/types";

/** Membro del team (admin, staff, staff_fatture) letto da user_roles. */
export type MembroStaff = Pick<Tables<"user_roles">, "id" | "nombre" | "email" | "rol" | "created_at">;

/** Ruoli assegnabili dalla UI: l'admin non si crea né si cambia da qui. */
export type RuoloStaff = "staff" | "staff_fatture";

export const RUOLI_STAFF: ReadonlyArray<{ valore: RuoloStaff; etichetta: string; descrizione: string }> = [
  {
    valore: "staff",
    etichetta: "Staff · Clienti",
    descrizione: "Vede clienti, onboarding e pipeline. Nessun importo, niente Finance.",
  },
  {
    valore: "staff_fatture",
    etichetta: "Staff · Clienti + Fatture",
    descrizione: "Come Staff · Clienti, in più vede Finance e gli importi delle fatture.",
  },
];

/** Credenziali mostrate UNA sola volta dopo la creazione. */
export interface CredenzialiStaff {
  nombre: string;
  email: string;
  password: string;
}
