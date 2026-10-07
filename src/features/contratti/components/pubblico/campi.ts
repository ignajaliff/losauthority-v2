import type { DatiCliente, TipoCliente } from "@contratti/tipi.ts";

/** I campi del modulo, piatti: "indirizzo.via" → valore. */
export type Campi = Record<string, string>;

/** Dai dati salvati (annidati) ai campi piatti del modulo. */
export function inCampi(dati: Partial<DatiCliente> | null | undefined): Campi {
  const out: Campi = {};
  if (!dati) return out;
  for (const [k, v] of Object.entries(dati)) {
    if (v && typeof v === "object") {
      for (const [k2, v2] of Object.entries(v as object)) out[`${k}.${k2}`] = String(v2 ?? "");
    } else if (v != null) out[k] = String(v);
  }
  return out;
}

/** Dai campi piatti all'oggetto annidato che il server valida. */
export function daCampi(campi: Campi): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(campi)) {
    const [a, b] = k.split(".");
    if (b) {
      const dentro = (out[a] as Record<string, unknown> | undefined) ?? {};
      dentro[b] = v;
      out[a] = dentro;
    } else out[a] = v;
  }
  return out;
}

export interface Bozza {
  tipo?: TipoCliente;
  campi?: Campi;
}

/** Bozza salvata in questa scheda del browser (il telefono può aver ricaricato la pagina mentre cercavi il codice fiscale). */
export function leggiBozza(chiave: string): Bozza | null {
  try {
    const raw = window.sessionStorage.getItem(chiave);
    return raw ? (JSON.parse(raw) as Bozza) : null;
  } catch {
    return null;
  }
}

export function salvaBozza(chiave: string, bozza: Bozza): void {
  try {
    window.sessionStorage.setItem(chiave, JSON.stringify(bozza));
  } catch {
    /* spazio non disponibile: pazienza */
  }
}

export function cancellaBozza(chiave: string): void {
  try {
    window.sessionStorage.removeItem(chiave);
  } catch {
    /* niente da pulire */
  }
}

export type Passo = "informativa" | "tipo" | "dati" | "contratto" | "fatto";

export const PASSI: { id: Passo; label: string }[] = [
  { id: "informativa", label: "Privacy" },
  { id: "tipo", label: "Acquisto" },
  { id: "dati", label: "Dati" },
  { id: "contratto", label: "Firma" },
];

export const TIPI: { id: TipoCliente; titolo: string; testo: string; dichiarazione: string }[] = [
  {
    id: "privato",
    titolo: "Privato",
    testo: "Acquisto come persona, senza partita IVA.",
    dichiarazione:
      "Dichiaro di acquistare il programma come persona fisica, per scopi estranei a un'attività professionale o d'impresa, e di non usare una partita IVA per questo acquisto.",
  },
  {
    id: "professionista",
    titolo: "Partita IVA",
    testo: "Sono un professionista o una ditta individuale e acquisto per la mia attività.",
    dichiarazione:
      "Dichiaro di essere titolare di partita IVA e di acquistare il programma nell'esercizio della mia attività professionale o d'impresa. So che in questo caso non ho il diritto di recesso previsto per i consumatori.",
  },
  {
    id: "societa",
    titolo: "Società",
    testo: "Acquista una società e firmo io come legale rappresentante.",
    dichiarazione:
      "Dichiaro di essere il legale rappresentante della società, o di avere i poteri per firmare in suo nome, e che la società acquista il programma nell'esercizio della propria attività. So che in questo caso non c'è il diritto di recesso previsto per i consumatori. Se a seguire il programma sarà un'altra persona, le consegno l'informativa sul trattamento dei dati.",
  },
];
