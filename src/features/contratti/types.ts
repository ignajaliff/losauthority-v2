import type { Tables } from "@/integrations/supabase/types";
import type { DatiCliente, DocumentoContratto, Firma, StatoContratto, TipoCliente } from "@contratti/tipi.ts";

/** Riga di `contratti` con i jsonb già tipizzati (dati, documento, firme) e il prezzo come numero. */
export type Contratto = Omit<Tables<"contratti">, "dati" | "documento" | "firma_fornitore" | "firma_contratto" | "firma_clausole" | "stato" | "tipo" | "prezzo"> & {
  stato: StatoContratto;
  tipo: TipoCliente | null;
  prezzo: number;
  dati: Partial<DatiCliente>;
  documento: DocumentoContratto | null;
  firma_fornitore: Firma | null;
  firma_contratto: Firma | null;
  firma_clausole: Firma | null;
};

/** Colonne della lista: niente testo integrale né firme, che pesano e lì non servono. */
export const COLONNE_LISTA =
  "id, created_at, token, stato, programma, offerta_nome, note, prezzo, tipo, cliente_nome, cliente_email, aperto_il, compilato_il, firmato_il, pagato_il, attivato_il, scade_il, annullato_il, cliente_id";

export type ContrattoInLista = Pick<
  Contratto,
  | "id"
  | "created_at"
  | "token"
  | "stato"
  | "programma"
  | "offerta_nome"
  | "note"
  | "prezzo"
  | "tipo"
  | "cliente_nome"
  | "cliente_email"
  | "aperto_il"
  | "compilato_il"
  | "firmato_il"
  | "pagato_il"
  | "attivato_il"
  | "scade_il"
  | "annullato_il"
  | "cliente_id"
>;

export type Offerta = Omit<Tables<"offerte">, "prezzo"> & { prezzo: number };

export type ImpostazioniContratti = Omit<Tables<"contratti_impostazioni">, "firma"> & { firma: Firma | null };

/** numeric arriva come stringa dal database: nel codice il prezzo è sempre un numero. */
export function conPrezzoNumerico<T extends { prezzo: unknown }>(row: T): T & { prezzo: number } {
  return { ...row, prezzo: Number(row.prezzo) };
}

/** Indirizzo pubblico del link del cliente: stessa app, pagina /contratto/:token, sempre in https fuori da localhost. */
export function linkContratto(token: string): string {
  const o = window.location.origin;
  const origine = o.includes("localhost") || o.includes("127.0.0.1") ? o : o.replace(/^http:/, "https:");
  return `${origine}/contratto/${token}`;
}

/** Il messaggio con cui Wesley manda al cliente il link del contratto. */
export function messaggioInvito(programma: string, link: string): string {
  return (
    `Ciao!\n` +
    `Ecco il link per il contratto del programma ${programma}: inserisci i tuoi dati, leggilo e firmalo dal telefono. Ci vogliono pochi minuti.\n\n` +
    `${link}\n\n` +
    `Il link è personale: non girarlo ad altri.`
  );
}

/** Che cosa manca a questo contratto, detto in una riga. */
export function prossimoPasso(stato: StatoContratto): string {
  switch (stato) {
    case "inviato":
    case "compilato":
      return "Aspetta la firma del cliente";
    case "firmato":
      return "Segna il pagamento quando arriva";
    case "pagato":
      return "Apri gli accessi e attiva";
    case "attivo":
      return "Niente: programma in corso";
    default:
      return "—";
  }
}

/** "1.997,00" / "1997.50" / "1997" → numero (NaN se non si legge). */
export function leggiImporto(v: string): number {
  let s = v.trim().replace(/[€\s]/g, "");
  if (s.includes(",")) s = s.replace(/\./g, "").replace(",", ".");
  const n = Number(s);
  return Number.isFinite(n) ? Math.round(n * 100) / 100 : NaN;
}
