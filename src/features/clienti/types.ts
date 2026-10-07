import type { Tables } from "@/integrations/supabase/types";

/** Riga della lista clienti (vista con stato derivato). */
export type ClienteRiga = Tables<"vista_clienti">;

export type Cliente = Tables<"clienti">;

/** Scheda cliente: dati di gestione (con `tags` string[]) + anagrafica da user_roles. */
export interface ClienteDettaglio extends Cliente {
  utente: { nombre: string; email: string; rol: string };
}

/** Compito del piano d'azione (tabella `compiti`, una riga per voce della checklist). */
export type Compito = Pick<Tables<"compiti">, "id" | "testo" | "stato" | "ordine" | "completato_il" | "created_at" | "padre_id" | "link_skool" | "nota_skool">;
export type StatoCompito = "da_fare" | "fatto";

/** Tappa del piano d'azione: compito padre (padre_id null) con i suoi sotto-compiti in ordine. */
export interface Tappa extends Compito {
  figli: Compito[];
}

export interface AnalisiCliente {
  contenuto: string;
  generato_il: string;
}

/** Analisi di Aura + se il cliente ha già inviato la scheda onboarding (serve per generarla). */
export interface StatoAnalisi {
  analisi: AnalisiCliente | null;
  schedaInviata: boolean;
}

/** Credenziali mostrate UNA volta dopo la creazione dell'account. */
export interface CredenzialiCliente {
  id: string;
  email: string;
  password: string;
  nombre: string;
}

/** Filtri della lista clienti. */
export interface FiltriClienti {
  testo: string;
  fase: string;
}
