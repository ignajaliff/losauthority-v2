import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { logDev } from "@/shared/utils/errors";

/** Nome del Worker in wrangler.jsonc: le sue preview sono «<prefisso>-<nome>.<sottodominio>.workers.dev». */
const NOME_WORKER = "losauthority-v2";

/** Host da non registrare: i link delle notifiche non devono puntare a una copia locale o a una preview. */
const NON_DA_REGISTRARE = [
  /^(localhost|127\.0\.0\.1|0\.0\.0\.0|\[::1\])$/,
  /\.local$/,
  // Preview di Cloudflare Workers (versione o ramo) e di Pages.
  new RegExp(`^[^.]+-${NOME_WORKER}\\.[^.]+\\.workers\\.dev$`),
  /^[0-9a-f]{8}\.[^.]+\.pages\.dev$/,
];

/**
 * Il dominio da cui il team usa il gestionale finisce in `impostazioni_app.sito_url`: le Edge Functions
 * lo usano per i link nei messaggi Telegram (onboarding completato, contratto firmato, scadenze,
 * call Fathom). Così, cambiando dominio, i link seguono da soli: niente SITE_URL da aggiornare.
 * Solo nel build di produzione servito in https (mai `npm run dev`, neanche da un IP di rete o un
 * tunnel). Una chiamata all'apertura del gestionale: la funzione scrive solo se il valore cambia e
 * la RLS lascia scrivere solo il team. Un errore non disturba l'utente: alla prossima apertura si riprova.
 */
export function useRegistraSito(attivo: boolean) {
  useEffect(() => {
    if (!attivo || !import.meta.env.PROD) return;
    const { origin, hostname, protocol } = window.location;
    if (protocol !== "https:" || NON_DA_REGISTRARE.some((r) => r.test(hostname))) return;
    void supabase.rpc("registra_sito", { p_url: origin }).then(({ error }) => {
      if (error) logDev("registra_sito", error);
    });
  }, [attivo]);
}
