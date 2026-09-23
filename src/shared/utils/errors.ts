/** Log solo in sviluppo: in produzione un console.error può far trapelare dettagli interni. */
export function logDev(...args: unknown[]): void {
  if (import.meta.env.DEV) console.error(...args);
}

/** Messaggio generico per l'utente finale: mai il messaggio interno di Supabase. */
export const MESSAGGIO_ERRORE_GENERICO = "Riprova tra poco o contatta l'amministratore.";
