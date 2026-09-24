import type { Tables } from "@/integrations/supabase/types";

/** Riga della lista clienti (vista con stato derivato). */
export type ClienteRiga = Tables<"vista_clienti">;

export type Cliente = Tables<"clienti">;

export type Tag = Pick<Tables<"tags">, "id" | "label">;

/** Scheda cliente: dati di gestione + anagrafica da user_roles + tag. */
export interface ClienteDettaglio extends Cliente {
  utente: { nombre: string; email: string; rol: string };
  tags: Tag[];
}

export interface NotaCliente {
  id: string;
  testo: string;
  created_at: string;
  autore_id: string | null;
  autore: { nombre: string } | null;
}

export type HubCompito = Pick<
  Tables<"hub_compiti">,
  "id" | "titolo" | "stato" | "assegnato_a" | "scadenza" | "link_utile" | "ordine"
>;

export interface HubBoardConCompiti {
  id: string;
  call_n: number;
  synced_at: string;
  compiti: HubCompito[];
}

export interface AnalisiCliente {
  contenuto: string;
  generato_il: string;
}

/** Analisi di Aura + quante schede il cliente ha già inviato (servono tutte e 3). */
export interface StatoAnalisi {
  analisi: AnalisiCliente | null;
  schedeInviate: number;
}

export const SCHEDE_RICHIESTE = 3;

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
