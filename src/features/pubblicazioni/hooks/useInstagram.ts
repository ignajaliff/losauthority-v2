import { useEffect, useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { erroreMutation, invocaEdge } from "@/shared/utils/invocaEdge";
import { handleDaUrl, type InstagramCliente, type RilevazioneFollower } from "../types";
import { chiaviPubblicazioni } from "./usePubblicazioni";

export const chiaviInstagram = {
  cliente: (clienteId: string) => ["pubblicazioni", "instagram", clienteId] as const,
  follower: (clienteId: string) => ["pubblicazioni", "follower", clienteId] as const,
};

/** Esito di `instagram-sync` (docs/edge-functions.md). */
interface EsitoSync {
  instagram: string;
  saltato?: boolean;
  profilo?: { ok: true; nuove: number; rilevazioni: number; follower?: number | null } | { ok: false; errore: string };
  metriche?: { ok: true; nuove: number; rilevazioni: number } | { ok: false; errore: string };
}

/**
 * Le letture dei follower del profilo Instagram attuale del cliente (una ogni lettura del profilo),
 * dalla più vecchia. Le righe di un profilo precedente (link cambiato dal team) restano fuori.
 * `inAttesa` = la prima lettura Instagram è in corso: si ricontrolla ogni 10 s.
 */
export function useFollower(clienteId: string | undefined, urlProfilo: string | null, inAttesa = false) {
  const handle = handleDaUrl(urlProfilo)?.toLowerCase() ?? null;
  return useQuery({
    queryKey: [...chiaviInstagram.follower(clienteId ?? ""), handle] as const,
    enabled: !!clienteId && !!handle,
    refetchInterval: inAttesa ? 10_000 : false,
    queryFn: async (): Promise<RilevazioneFollower[]> => {
      const { data, error } = await supabase
        .from("follower_rilevazioni")
        .select("*")
        .eq("cliente_id", clienteId ?? "")
        .eq("piattaforma", "instagram")
        .or(`profilo.is.null,profilo.eq.${handle}`)
        .order("rilevata_il", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });
}

/** Profilo collegato ma mai letto e senza errori: la prima lettura è in corso. */
export function primaLetturaInCorso(d: InstagramCliente | null | undefined): boolean {
  return !!d?.instagram && !d.instagram_sync_il && !d.instagram_sync_errore;
}

/** Controlli ogni 10 s durante la prima lettura: dopo 3 minuti ci si ferma (la lettura è morta senza scrivere l'errore). */
const SONDAGGI_MAX = 18;

/**
 * Profilo Instagram e stato della sincronizzazione del cliente (riga `clienti`, leggibile dal proprietario).
 * Mentre la prima lettura è in corso si ricontrolla ogni 10 s, al massimo per SONDAGGI_MAX volte.
 */
export function useInstagramCliente(clienteId: string | undefined) {
  return useQuery({
    queryKey: chiaviInstagram.cliente(clienteId ?? ""),
    enabled: !!clienteId,
    refetchInterval: (query) => (primaLetturaInCorso(query.state.data) && query.state.dataUpdateCount < SONDAGGI_MAX ? 10_000 : false),
    queryFn: async (): Promise<InstagramCliente | null> => {
      const { data, error } = await supabase
        .from("clienti")
        .select("instagram, instagram_sync_il, instagram_sync_errore")
        .eq("id", clienteId ?? "")
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

function useInvalidaInstagram(clienteId: string) {
  const queryClient = useQueryClient();
  return () => {
    void queryClient.invalidateQueries({ queryKey: chiaviInstagram.cliente(clienteId) });
    void queryClient.invalidateQueries({ queryKey: chiaviInstagram.follower(clienteId) });
    void queryClient.invalidateQueries({ queryKey: chiaviPubblicazioni.lista(clienteId) });
    void queryClient.invalidateQueries({ queryKey: ["clienti"] });
  };
}

/**
 * Quando la prima lettura finisce (la riga `clienti` smette di essere «in corso»),
 * ricarica carte e follower: il loro sondaggio si ferma nello stesso istante e
 * potrebbe aver letto per l'ultima volta prima che la funzione scrivesse.
 */
export function useRicaricaDopoPrimaLettura(clienteId: string, inCorso: boolean) {
  const queryClient = useQueryClient();
  const eraInCorso = useRef(inCorso);
  useEffect(() => {
    if (eraInCorso.current && !inCorso) {
      void queryClient.invalidateQueries({ queryKey: chiaviInstagram.follower(clienteId) });
      void queryClient.invalidateQueries({ queryKey: chiaviPubblicazioni.lista(clienteId) });
    }
    eraInCorso.current = inCorso;
  }, [inCorso, clienteId, queryClient]);
}

function descriviEsito(e: EsitoSync): string {
  if (e.saltato) return "Il profilo è già stato letto nelle ultime 24 ore: i numeri si aggiornano da soli.";
  const nuove = e.profilo?.ok ? e.profilo.nuove : 0;
  const rilevazioni = (e.profilo?.ok ? e.profilo.rilevazioni : 0) + (e.metriche?.ok ? e.metriche.rilevazioni : 0);
  const parti = [];
  if (nuove > 0) parti.push(`${nuove} ${nuove === 1 ? "video nuovo" : "video nuovi"}`);
  if (rilevazioni > 0) parti.push(`${rilevazioni} ${rilevazioni === 1 ? "rilevazione" : "rilevazioni"}`);
  return parti.length > 0 ? parti.join(" · ") : "Nessun video nuovo da registrare.";
}

/**
 * Il cliente collega il profilo (una volta sola) oppure chiede di rileggerlo.
 * La funzione aspetta Apify: può volerci un minuto.
 */
export function useCollegaInstagram(clienteId: string) {
  const invalida = useInvalidaInstagram(clienteId);
  return useMutation({
    mutationFn: (instagram?: string) => invocaEdge<EsitoSync>("instagram-sync", instagram ? { instagram } : {}),
    onSuccess: (e) => toast.success("Profilo Instagram letto", { description: descriviEsito(e) }),
    onError: erroreMutation("Lettura del profilo non riuscita"),
    // Anche se fallisce: il profilo può essere stato salvato e l'errore scritto in `instagram_sync_errore`.
    onSettled: () => invalida(),
  });
}

/** Il team forza subito profilo e numeri di un cliente («Aggiorna adesso»). */
export function useAggiornaInstagram(clienteId: string) {
  const invalida = useInvalidaInstagram(clienteId);
  return useMutation({
    mutationFn: () => invocaEdge<EsitoSync>("instagram-sync", { cliente_id: clienteId }),
    onSuccess: (e) => toast.success("Instagram aggiornato", { description: descriviEsito(e) }),
    onError: erroreMutation("Aggiornamento non riuscito"),
    onSettled: () => invalida(),
  });
}
