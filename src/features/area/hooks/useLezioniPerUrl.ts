import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/** Titolo e corso di una lezione Skool, trovata per URL (i sotto-compiti salvano solo il link). */
export interface LezioneLink {
  url: string;
  titolo: string;
  corso: string | null;
}

/** Le lezioni del catalogo che corrispondono ai link dati, indicizzate per URL (una query per tutte). */
export function useLezioniPerUrl(urls: string[]) {
  const ordinati = [...new Set(urls)].sort();
  return useQuery({
    queryKey: ["area", "lezioni-per-url", ...ordinati],
    enabled: ordinati.length > 0,
    staleTime: 5 * 60 * 1000,
    queryFn: async (): Promise<Map<string, LezioneLink>> => {
      const { data, error } = await supabase.from("lezioni").select("url, titolo, corso").in("url", ordinati);
      if (error) throw error;
      const mappa = new Map<string, LezioneLink>();
      for (const l of data ?? []) if (l.url) mappa.set(l.url, { url: l.url, titolo: l.titolo, corso: l.corso });
      return mappa;
    },
  });
}
