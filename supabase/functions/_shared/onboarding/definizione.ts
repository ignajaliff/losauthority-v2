/**
 * La definizione dell'onboarding v3: i blocchi nell'ordine in cui il cliente
 * li vede, le domande piatte e le parole del mestiere. Unica fonte per il
 * browser, le Edge Functions e il gestionale.
 */
import { BLOCCO_INIZIO } from "./blocco-inizio.ts";
import { BLOCCO_A } from "./blocco-a.ts";
import { BLOCCO_B } from "./blocco-b.ts";
import { BLOCCO_C } from "./blocco-c.ts";
import { BLOCCO_D, BLOCCO_E, BLOCCO_F, BLOCCO_G } from "./blocco-d-g.ts";
import {
  domandeVisibili,
  eDomandaLista,
  eDomandaMappa,
  opzioniVisibili,
  ramoDi,
  type Blocco,
  type Domanda,
  type IdCampo,
  type Parole,
  type Ramo,
  type Risposte,
  type ValoreRisposta,
} from "./tipi.ts";

export const TITOLO_SCHEDA = "Onboarding";

export const BLOCCHI: Blocco[] = [BLOCCO_INIZIO, BLOCCO_A, BLOCCO_B, BLOCCO_C, BLOCCO_D, BLOCCO_E, BLOCCO_F, BLOCCO_G];

/** Tutte le versioni di tutte le domande, in ordine. */
export const DOMANDE: Domanda[] = BLOCCHI.flatMap((b) => b.domande);

/** Una versione per id (la prima): per etichette e tipo quando non conta la versione. */
export const DOMANDA_PER_ID: ReadonlyMap<IdCampo, Domanda> = new Map(
  DOMANDE.filter((d, i, all) => all.findIndex((x) => x.id === d.id) === i).map((d) => [d.id, d]),
);

export function domandaPerId(id: string): Domanda | undefined {
  return DOMANDA_PER_ID.get(id as IdCampo);
}

/**
 * La versione attiva di ogni domanda con queste risposte: una sola per id,
 * nell'ordine dei blocchi. È il "percorso" del cliente (regola 3 del compito 2).
 */
export function domandeAttive(r: Risposte): Domanda[] {
  const viste = new Set<IdCampo>();
  const out: Domanda[] = [];
  for (const b of BLOCCHI) {
    for (const d of domandeVisibili(b, r)) {
      if (viste.has(d.id)) continue;
      viste.add(d.id);
      out.push(d);
    }
  }
  return out;
}

// --- Parole del mestiere -----------------------------------------------------

const ESEMPI_LISTINO: Record<Ramo, string> = {
  servizi: "consulenza singola 80 €, pacchetto da 5 sedute 350 €, progetto da 1.500 € in su",
  prodotti_fisici: "borsa piccola 90 €, borsa grande 180 €, pezzo su misura da 400 € in su",
  prodotti_digitali: "corso 197 €, abbonamento 29 € al mese, ebook 19 €",
};

/** Le parole standard quando Claude non ha ancora risposto (o la chiamata è fallita). */
export function paroleDefault(ramo: Ramo | null): Parole {
  const prodotti = ramo === "prodotti_fisici" || ramo === "prodotti_digitali";
  return {
    cliente: "cliente",
    clienti: "clienti",
    cosa_vende: prodotti ? "prodotto" : "servizio",
    cosa_vende_plurale: prodotti ? "prodotti" : "servizi",
    esempio_listino: ESEMPI_LISTINO[ramo ?? "servizi"],
  };
}

const CHIAVI_PAROLE: (keyof Parole)[] = ["cliente", "clienti", "cosa_vende", "cosa_vende_plurale", "esempio_listino"];

/** Le parole salvate (jsonb) se complete, altrimenti quelle standard. */
export function paroleDaJson(grezzo: unknown, r: Risposte): Parole {
  const base = paroleDefault(ramoDi(r));
  if (!grezzo || typeof grezzo !== "object") return base;
  const o = grezzo as Record<string, unknown>;
  const out = { ...base };
  for (const k of CHIAVI_PAROLE) {
    const v = o[k];
    if (typeof v === "string" && v.trim()) out[k] = v.trim();
  }
  return out;
}

/** Sostituisce {cliente} {clienti} {cosa_vende} {cosa_vende_plurale} {esempio_listino}; maiuscola a inizio frase. */
export function conParole(testo: string, parole: Parole): string {
  return testo.replace(/\{(cliente|clienti|cosa_vende|cosa_vende_plurale|esempio_listino)\}/g, (tutto, chiave: keyof Parole, pos: number) => {
    const parola = parole[chiave] ?? tutto;
    const inizioFrase = pos === 0 || /[.!?]\s*$/.test(testo.slice(0, pos));
    return inizioFrase ? parola.charAt(0).toUpperCase() + parola.slice(1) : parola;
  });
}

// --- Valori ------------------------------------------------------------------

export function etichettaOpzione(d: Domanda, value: string, parole: Parole): string {
  const o = d.opzioni?.find((x) => x.value === value);
  return o ? conParole(o.label, parole) : value;
}

function vuoto(v: ValoreRisposta | undefined): boolean {
  if (v === undefined || v === null) return true;
  if (typeof v === "string") return v.trim() === "";
  if (Array.isArray(v)) return v.every((x) => x.trim() === "");
  return Object.values(v).every((x) => x.trim() === "" || x === "0");
}

/** Testo leggibile di una risposta (etichette dei menu, unità, liste, conteggi). "—" se vuota. */
export function formattaValore(d: Domanda, v: ValoreRisposta | undefined, parole: Parole): string {
  if (vuoto(v)) return "—";
  if (typeof v === "string") {
    if (d.tipo === "select") return etichettaOpzione(d, v, parole);
    if ((d.tipo === "number" || d.tipo === "scala") && d.unita) return `${v.trim()} ${d.unita}`;
    if (d.tipo === "scala") return `${v.trim()} su ${d.max ?? 5}`;
    return v;
  }
  if (Array.isArray(v)) {
    return v
      .map((x) => x.trim())
      .filter(Boolean)
      .map((x) => (d.tipo === "multiselect-text" ? etichettaOpzione(d, x, parole) : x))
      .join(", ");
  }
  if (!v) return "—";
  return Object.entries(v)
    .filter(([, val]) => val.trim() !== "" && val !== "0")
    .map(([k, val]) => `${etichettaOpzione(d, k, parole)}: ${d.tipo === "fasce" ? `${val} h` : val}`)
    .join(", ");
}

/** Riga di data_onboarding (o qualsiasi record) → risposte in memoria. */
export function risposteDaRecord(riga: Record<string, unknown>): Risposte {
  const r: Risposte = {};
  for (const d of DOMANDA_PER_ID.values()) {
    if (d.tipo === "file-list") continue;
    const v = riga[d.id];
    if (v === null || v === undefined) continue;
    if (eDomandaLista(d.tipo)) {
      if (Array.isArray(v)) {
        const lista = v.filter((x): x is string => typeof x === "string" && x.trim() !== "");
        if (lista.length > 0) r[d.id] = lista;
      }
    } else if (eDomandaMappa(d.tipo)) {
      if (v && typeof v === "object" && !Array.isArray(v)) {
        const mappa: Record<string, string> = {};
        for (const [k, val] of Object.entries(v as Record<string, unknown>)) {
          if (typeof val === "string" || typeof val === "number") mappa[k] = String(val);
        }
        if (Object.keys(mappa).length > 0) r[d.id] = mappa;
      }
    } else {
      r[d.id] = String(v);
    }
  }
  return r;
}

export { domandeVisibili, opzioniVisibili };
