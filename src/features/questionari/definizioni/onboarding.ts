import type { Sezione } from "../types";
import { ONBOARDING_SEZIONI_1 } from "./onboarding-sezioni-1";
import { ONBOARDING_SEZIONI_2 } from "./onboarding-sezioni-2";

/**
 * Scheda 1 — Onboarding (single source of truth, v2).
 * Ogni domanda ha un `id` STABILE identico al sistema precedente: Aura e le
 * Edge Functions leggono gli id, non le etichette.
 */
export const ONBOARDING_SEZIONI: Sezione[] = [...ONBOARDING_SEZIONI_1, ...ONBOARDING_SEZIONI_2];

/** Ore che entrano nel calcolo di `ore_operative` (lo fa l'Edge Function onboarding-completato). */
export const ORE_OPERATIVE_IDS = [
  "ore_idee",
  "ore_scrittura",
  "ore_riprese",
  "ore_editing",
  "ore_pubblicazione",
] as const;

/** Tutte le ore della mappa del tempo (incluse dm/clienti/admin). */
export const TUTTE_LE_ORE_IDS = [
  ...ORE_OPERATIVE_IDS,
  "ore_dm",
  "ore_clienti",
  "ore_admin",
] as const;

/** Id della sezione con la mappa del tempo (regola di conferma ore). */
export const SEZIONE_TEMPO_ID = "D_tempo";
