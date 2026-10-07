import { startOfDay } from "date-fns";
import type { Periodo } from "./periodo";
import type { Pubblicazione } from "./types";

/**
 * Serie del grafico di crescita di Pubblicazioni. Tutte le grandezze sono
 * cumulative e si conoscono solo nei momenti di lettura: tra due letture il
 * valore si stima in linea retta, dopo l'ultima resta fermo.
 * Le visualizzazioni totali sono la somma, video per video, di queste stime.
 * Prima della prima lettura di un video: se la lettura è arrivata entro
 * RAMPA_GIORNI dalla pubblicazione si sale in linea retta da 0; se è arrivata
 * dopo (video vecchi, letti la prima volta al collegamento del profilo) le sue
 * visualizzazioni contano dal giorno di pubblicazione, perché i video brevi le
 * fanno quasi tutte nei primi giorni: così i mesi senza video nuovi non
 * mostrano una crescita inventata.
 * I lead invece si contano: il totale di quelli arrivati fino a quel giorno
 * (pagina Clienti), a gradini, quindi tra un arrivo e l'altro non c'è stima.
 */

export const SERIE = ["visualizzazioni", "follower", "lead"] as const;
export type Serie = (typeof SERIE)[number];

export const ETICHETTA_SERIE: Record<Serie, string> = {
  visualizzazioni: "Visualizzazioni",
  follower: "Follower",
  lead: "Lead",
};

/** Serie lette ogni tanto: tra due letture il valore è stimato. I lead no, si contano giorno per giorno. */
export const SERIE_STIMATE: ReadonlyArray<Serie> = ["visualizzazioni", "follower"];

/** Colore di ogni linea (token del tema): uguale nel grafico, nelle caselle e nei riepiloghi. */
export const COLORE_SERIE: Record<Serie, string> = {
  visualizzazioni: "var(--chart-1)",
  follower: "var(--chart-4)",
  lead: "var(--chart-5)",
};

/** Un valore letto in un istante (ms). */
export interface Campione {
  t: number;
  valore: number;
}

/** Una riga del grafico: l'istante, i valori e quali serie lì sono lette davvero (non stimate). */
export type RigaGrafico = { t: number; reali: Serie[] } & Partial<Record<Serie, number>>;

export interface RiepilogoSerie {
  /** Primo valore noto del periodo: a inizio periodo, o alla prima lettura se la serie parte dopo. */
  inizio: number | null;
  /** Istante a cui si riferisce `inizio`. */
  dal: number | null;
  /** Valore a fine periodo (null se non c'è nessuna lettura fino a lì). */
  fine: number | null;
  /** Crescita nel periodo; null se c'è una sola lettura e prima non c'era niente. */
  delta: number | null;
  /** Istanti con una lettura vera dentro il periodo. */
  letture: number;
}

export interface DatiGrafico {
  righe: RigaGrafico[];
  riepilogo: Record<Serie, RiepilogoSerie>;
}

const GIORNO = 86_400_000;
/** Oltre questo distacco tra pubblicazione e prima lettura non si stima la salita da 0. */
const RAMPA_GIORNI = 15;

/** Valore stimato all'istante t: undefined prima della prima lettura, lineare tra due letture, fermo dopo l'ultima. */
export function valoreA(campioni: Campione[], t: number): number | undefined {
  if (campioni.length === 0 || t < campioni[0].t) return undefined;
  for (let i = campioni.length - 1; i >= 0; i--) {
    const c = campioni[i];
    if (c.t === t) return c.valore;
    if (c.t < t) {
      const dopo = campioni[i + 1];
      if (!dopo) return c.valore;
      return c.valore + ((dopo.valore - c.valore) * (t - c.t)) / (dopo.t - c.t);
    }
  }
  return undefined;
}

/** Valore a gradini all'istante t: l'ultimo campione non successivo a t (undefined prima del primo). */
export function valoreGradino(campioni: Campione[], t: number): number | undefined {
  let valore: number | undefined;
  for (const c of campioni) {
    if (c.t > t) break;
    valore = c.valore;
  }
  return valore;
}

/**
 * Totale dei lead arrivati fino a ogni giorno di arrivo (date YYYY-MM-DD dalla pagina Clienti).
 * Parte da 0 in un istante lontano: prima del primo lead il totale è 0, non «nessuna lettura».
 * Nessun lead → nessun campione.
 */
export function campioniLead(arrivi: string[]): Campione[] {
  const perGiorno = new Map<number, number>();
  for (const a of arrivi) {
    const t = startOfDay(new Date(`${a}T00:00:00`)).getTime();
    if (Number.isFinite(t)) perGiorno.set(t, (perGiorno.get(t) ?? 0) + 1);
  }
  if (perGiorno.size === 0) return [];
  let totale = 0;
  const giorni = [...perGiorno.entries()].sort((x, y) => x[0] - y[0]).map(([t, n]) => ({ t, valore: (totale += n) }));
  return [{ t: 0, valore: 0 }, ...giorni];
}

/** Ordina per istante e, a parità di istante, tiene l'ultimo valore. */
function ordina(campioni: Campione[]): Campione[] {
  const perIstante = new Map<number, number>();
  for (const c of campioni) if (Number.isFinite(c.t) && Number.isFinite(c.valore)) perIstante.set(c.t, c.valore);
  return [...perIstante.entries()].sort((x, y) => x[0] - y[0]).map(([t, valore]) => ({ t, valore }));
}

/** Le visualizzazioni di un (video, piattaforma): punti per disegnare e letture vere. */
export interface SerieVideo {
  punti: Campione[];
  /** Istanti delle letture vere, in ordine. */
  letture: number[];
}

/** Per ogni (video, piattaforma) le letture delle visualizzazioni con il tratto prima della prima lettura (vedi in testa). */
export function campioniVisualizzazioni(pubblicazioni: Pubblicazione[]): SerieVideo[] {
  const perChiave = new Map<string, { pubblicata: number | null; campioni: Campione[] }>();
  for (const p of pubblicazioni) {
    const pubblicata = p.pubblicata_il ? startOfDay(new Date(`${p.pubblicata_il}T00:00:00`)).getTime() : null;
    for (const m of p.metriche) {
      if (m.visualizzazioni === null) continue;
      const chiave = `${p.id}:${m.piattaforma}`;
      const voce = perChiave.get(chiave) ?? { pubblicata, campioni: [] };
      voce.campioni.push({ t: new Date(m.rilevata_il).getTime(), valore: m.visualizzazioni });
      perChiave.set(chiave, voce);
    }
  }
  return [...perChiave.values()].map(({ pubblicata, campioni }) => {
    const letti = ordina(campioni);
    const letture = letti.map((c) => c.t);
    const primo = letti[0];
    if (!primo) return { punti: [], letture };
    // Senza data di pubblicazione: il primo valore vale da sempre (nessuna crescita inventata).
    if (pubblicata === null) return { punti: [{ t: 0, valore: primo.valore }, ...letti], letture };
    if (pubblicata >= primo.t) return { punti: letti, letture };
    if (primo.t - pubblicata <= RAMPA_GIORNI * GIORNO) return { punti: [{ t: pubblicata, valore: 0 }, ...letti], letture };
    return { punti: [{ t: pubblicata, valore: 0 }, { t: pubblicata + GIORNO, valore: primo.valore }, ...letti], letture };
  });
}

/**
 * Somma delle visualizzazioni stimate di tutti i video all'istante t. Un video non
 * ancora uscito vale 0 (è un dato, non una stima); undefined solo se non c'è nessun video letto.
 */
function totaleVisualizzazioni(perVideo: SerieVideo[], t: number): number | undefined {
  if (perVideo.every((v) => v.punti.length === 0)) return undefined;
  let somma = 0;
  for (const v of perVideo) somma += valoreA(v.punti, t) ?? 0;
  return Math.round(somma);
}

/** Il totale a t è una lettura vera se almeno un video è letto lì e nessun video è stimato (tutti letti, fermi dopo l'ultima lettura o non ancora usciti). */
function totaleReale(perVideo: SerieVideo[], t: number): boolean {
  let lettoQui = false;
  for (const v of perVideo) {
    if (v.punti.length === 0 || t < v.punti[0].t) continue;
    if (v.letture.includes(t)) lettoQui = true;
    else if (t < (v.letture.at(-1) ?? Infinity)) return false;
  }
  return lettoQui;
}

function riepilogo(valore: (t: number) => number | undefined, righe: RigaGrafico[], serie: Serie, periodo: Periodo, letture: number): RiepilogoSerie {
  const fine = valore(periodo.a) ?? null;
  const allInizio = valore(periodo.da);
  const dal = allInizio !== undefined ? periodo.da : (righe.find((r) => r[serie] !== undefined)?.t ?? null);
  const inizio = dal === null ? null : (valore(dal) ?? null);
  const confrontabile = allInizio !== undefined || letture >= 2;
  return { inizio, dal, fine, delta: confrontabile && inizio !== null && fine !== null ? fine - inizio : null, letture };
}

/**
 * Righe del grafico per il periodo: una per ogni istante in cui cambia la
 * pendenza di almeno una serie (letture e giorni di pubblicazione), più i due
 * estremi. Tra questi punti ogni serie è lineare, quindi il disegno è esatto.
 */
export function costruisciGrafico(pubblicazioni: Pubblicazione[], follower: Campione[], lead: Campione[], periodo: Periodo): DatiGrafico {
  const perVideo = campioniVisualizzazioni(pubblicazioni);
  const fol = ordina(follower);
  const led = ordina(lead);
  const intero = (v: number | undefined) => (v === undefined ? undefined : Math.round(v));
  const valore: Record<Serie, (t: number) => number | undefined> = {
    visualizzazioni: (t) => totaleVisualizzazioni(perVideo, t),
    follower: (t) => intero(valoreA(fol, t)),
    lead: (t) => valoreGradino(led, t),
  };
  const lettureFol = new Set(fol.map((c) => c.t));
  // Il punto di partenza a 0 non è un arrivo.
  const lettureLed = new Set(led.filter((c) => c.t > 0).map((c) => c.t));
  const reale: Record<Serie, (t: number) => boolean> = {
    visualizzazioni: (t) => totaleReale(perVideo, t),
    follower: (t) => lettureFol.has(t),
    lead: (t) => lettureLed.has(t),
  };

  const istanti = new Set<number>([periodo.da, periodo.a]);
  for (const v of perVideo) for (const c of v.punti) istanti.add(c.t);
  for (const c of [...fol, ...led]) istanti.add(c.t);

  const righe: RigaGrafico[] = [...istanti]
    .filter((t) => t >= periodo.da && t <= periodo.a)
    .sort((x, y) => x - y)
    .map((t) => {
      const riga: RigaGrafico = { t, reali: SERIE.filter((s) => reale[s](t)) };
      for (const s of SERIE) {
        const v = valore[s](t);
        if (v !== undefined) riga[s] = v;
      }
      return riga;
    });

  const lettureVideo = new Set(perVideo.flatMap((v) => v.letture));
  const dentro = (insieme: Set<number>) => [...insieme].filter((t) => t >= periodo.da && t <= periodo.a).length;
  return {
    righe,
    riepilogo: {
      visualizzazioni: riepilogo(valore.visualizzazioni, righe, "visualizzazioni", periodo, dentro(lettureVideo)),
      follower: riepilogo(valore.follower, righe, "follower", periodo, dentro(lettureFol)),
      lead: riepilogo(valore.lead, righe, "lead", periodo, dentro(lettureLed)),
    },
  };
}
