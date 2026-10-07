/**
 * I «valori fissi» della lettura dell'onboarding (compito 2 di Claude): poche
 * etichette standard che il gestionale usa per filtrare e ordinare i clienti.
 * Stesse liste del check in `onboarding_lettura`.
 */

export const CHIAREZZA_OFFERTA = ["chiara", "parziale", "confusa"] as const;
export const COLLO_BOTTIGLIA = [
  "non_pubblica",
  "poche_views",
  "views_senza_contatti",
  "contatti_senza_vendite",
  "clienti_o_prezzi_sbagliati",
  "visite_senza_acquisti",
  "nessun_ritorno",
  "margini_bassi",
] as const;
export const FASE_ECONOMICA = ["partenza", "sopravvivenza", "stabile", "scala"] as const;
export const URGENZA = ["alta", "media", "bassa"] as const;
export const GRUPPO_IA = ["zero_digitale", "digitale_base", "usa_gia_ia"] as const;
export const NODO_CENTRALE = ["PARTENZA", "VISIBILITA", "VENDITA", "RITORNO", "OPERATIVITA"] as const;

export type ChiarezzaOfferta = (typeof CHIAREZZA_OFFERTA)[number];
export type ColloBottiglia = (typeof COLLO_BOTTIGLIA)[number];
export type FaseEconomica = (typeof FASE_ECONOMICA)[number];
export type Urgenza = (typeof URGENZA)[number];
export type GruppoIa = (typeof GRUPPO_IA)[number];
export type NodoCentrale = (typeof NODO_CENTRALE)[number];

export interface ValoriFissi {
  chiarezza_offerta: ChiarezzaOfferta | null;
  collo_bottiglia: ColloBottiglia | null;
  fase_economica: FaseEconomica | null;
  urgenza: Urgenza | null;
  gruppo_ia: GruppoIa | null;
  nodo_centrale: NodoCentrale | null;
}

/** Etichette italiane per il gestionale. */
export const ETICHETTE_VALORI = {
  chiarezza_offerta: { chiara: "Offerta chiara", parziale: "Offerta parziale", confusa: "Offerta confusa" },
  collo_bottiglia: {
    non_pubblica: "Non pubblica",
    poche_views: "Poche visualizzazioni",
    views_senza_contatti: "Views senza contatti",
    contatti_senza_vendite: "Contatti senza vendite",
    clienti_o_prezzi_sbagliati: "Clienti o prezzi sbagliati",
    visite_senza_acquisti: "Visite senza acquisti",
    nessun_ritorno: "Nessun ritorno",
    margini_bassi: "Margini bassi",
  },
  fase_economica: { partenza: "Partenza", sopravvivenza: "Sopravvivenza", stabile: "Stabile", scala: "Scala" },
  urgenza: { alta: "Urgenza alta", media: "Urgenza media", bassa: "Urgenza bassa" },
  gruppo_ia: { zero_digitale: "Zero digitale", digitale_base: "Digitale base", usa_gia_ia: "Usa già l'IA" },
  nodo_centrale: { PARTENZA: "Partenza", VISIBILITA: "Visibilità", VENDITA: "Vendita", RITORNO: "Ritorno", OPERATIVITA: "Operatività" },
} as const;

function inLista<T extends string>(lista: readonly T[], v: unknown, maiuscolo = false): T | null {
  if (typeof v !== "string") return null;
  const norm = maiuscolo ? v.trim().toUpperCase() : v.trim().toLowerCase();
  return (lista as readonly string[]).includes(norm) ? (norm as T) : null;
}

/** Normalizza i valori fissi restituiti dal modello (maiuscole/minuscole tollerate): fuori lista → null, mai un valore inventato in DB. */
export function normalizzaValoriFissi(grezzo: unknown): ValoriFissi {
  const o = grezzo && typeof grezzo === "object" ? (grezzo as Record<string, unknown>) : {};
  return {
    chiarezza_offerta: inLista(CHIAREZZA_OFFERTA, o.chiarezza_offerta),
    collo_bottiglia: inLista(COLLO_BOTTIGLIA, o.collo_bottiglia),
    fase_economica: inLista(FASE_ECONOMICA, o.fase_economica),
    urgenza: inLista(URGENZA, o.urgenza),
    gruppo_ia: inLista(GRUPPO_IA, o.gruppo_ia),
    nodo_centrale: inLista(NODO_CENTRALE, o.nodo_centrale, true),
  };
}
