import type { Tables } from "@/integrations/supabase/types";

export const PIATTAFORME = ["tiktok", "instagram"] as const;
export type Piattaforma = (typeof PIATTAFORME)[number];

export const ETICHETTA_PIATTAFORMA: Record<Piattaforma, string> = {
  tiktok: "TikTok",
  instagram: "Instagram",
};

export function ePiattaforma(valore: string): valore is Piattaforma {
  return (PIATTAFORME as ReadonlyArray<string>).includes(valore);
}

export type Metrica = Tables<"pubblicazioni_metriche">;

/** Pubblicazione con le sue rilevazioni (ordinate dalla più vecchia). */
export type Pubblicazione = Tables<"pubblicazioni"> & { metriche: Metrica[] };

/** Carta creata da `instagram-sync`: il link e i numeri arrivano da Instagram. */
export const eInstagram = (p: Pubblicazione): boolean => p.origine === "instagram";

/** Rilevazione letta da Instagram (non si cancella a mano). */
export const eRilevazioneAutomatica = (m: Metrica): boolean => m.origine === "instagram";

/** Follower del profilo letti da `instagram-sync` (una riga per lettura del profilo). */
export type RilevazioneFollower = Tables<"follower_rilevazioni">;

/** Profilo Instagram del cliente e stato della sincronizzazione (colonne di `clienti`). */
export type InstagramCliente = Pick<Tables<"clienti">, "instagram" | "instagram_sync_il" | "instagram_sync_errore">;

/**
 * `instagram_sync_errore` del profilo privato: è l'unico errore scritto per il cliente
 * (stesso testo di MSG_PRIVATO in supabase/functions/instagram-sync/sync.ts).
 */
export function eProfiloPrivato(errore: string | null | undefined): boolean {
  return !!errore?.startsWith("Il profilo Instagram è privato");
}

/** "https://www.instagram.com/nome/" → "nome". */
export function handleDaUrl(url: string | null | undefined): string | null {
  const m = /instagram\.com\/([^/?#\s]+)/i.exec(url ?? "");
  return m ? m[1].replace(/^@/, "") : null;
}

export type PubblicazioneDati = Pick<Tables<"pubblicazioni">, "titolo" | "piattaforme" | "pubblicata_il" | "note">;

export type MetricaDati = Pick<Metrica, "piattaforma" | "rilevata_il" | "visualizzazioni" | "mi_piace" | "commenti">;

export const CAMPI_METRICA = ["visualizzazioni", "mi_piace", "commenti"] as const;
export type CampoMetrica = (typeof CAMPI_METRICA)[number];

export const ETICHETTA_CAMPO_METRICA: Record<CampoMetrica, string> = {
  visualizzazioni: "Visualizzazioni",
  mi_piace: "Mi piace",
  commenti: "Commenti",
};

/** Rilevazioni di una piattaforma, dalla più vecchia alla più recente. */
export function rilevazioniDi(p: Pubblicazione, piattaforma: Piattaforma): Metrica[] {
  return p.metriche.filter((m) => m.piattaforma === piattaforma);
}

/** Piattaforme da mostrare nella carta: quelle dichiarate più quelle con rilevazioni. */
export function piattaformeDi(p: Pubblicazione): Piattaforma[] {
  const set = new Set<Piattaforma>();
  for (const x of p.piattaforme) if (ePiattaforma(x)) set.add(x);
  for (const m of p.metriche) if (ePiattaforma(m.piattaforma)) set.add(m.piattaforma);
  return PIATTAFORME.filter((x) => set.has(x));
}
