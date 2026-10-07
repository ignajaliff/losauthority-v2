/**
 * La "scheda" che Aura restituisce a ogni turno dentro <scheda>{…}</scheda>:
 * solo i campi imparati o corretti in quel turno. Qui si valida (nomi, tipi,
 * lunghezze come i check del database) e si separa in due update: la carta e
 * il dossier del cliente (tabella `avatar`) e la diagnosi per Wesley
 * (tabella `avatar_diagnosi`, che il cliente non legge).
 */

export const CAMPI_TESTO = {
  nome: 60,
  eta: 40,
  genere: 40,
  situazione: 160,
  contesto: 300,
  momento: 200,
  frase: 200,
  settore: 80,
  snapshot: 600,
  desiderio_pratico: 400,
  desiderio_emotivo: 400,
  dove_cerca: 300,
} as const;

export const CAMPI_LISTA = ["dolori_superficie", "dolori_profondi", "credenze_limitanti", "linguaggio", "piattaforme", "chi_segue", "obiezioni", "trigger_acquisto"] as const;

export const DIAGNOSI_TESTO = { quadro: 800, quanto_ristretto: 500, come_usarlo: 800 } as const;
export const DIAGNOSI_LISTA = ["punti_forza", "criticita", "da_validare"] as const;

export const ORIGINI = ["clienti_reali", "costruito", "misto"] as const;

export type CampoTesto = keyof typeof CAMPI_TESTO;
export type CampoLista = (typeof CAMPI_LISTA)[number];
export type DiagnosiTesto = keyof typeof DIAGNOSI_TESTO;
export type DiagnosiLista = (typeof DIAGNOSI_LISTA)[number];

/** Update pronto per `avatar`. */
export type CampiAvatar = Partial<Record<CampoTesto, string> & Record<CampoLista, string[]> & { origine: (typeof ORIGINI)[number] }>;
/** Update pronto per `avatar_diagnosi`. */
export type CampiDiagnosi = Partial<Record<DiagnosiTesto, string> & Record<DiagnosiLista, string[]>>;

const MAX_VOCE = 200;
const MAX_VOCI = 12;

const pulisciTesto = (v: unknown, max: number): string | null => {
  if (typeof v !== "string") return null;
  const t = v.replace(/\s+/g, " ").trim();
  return t.length > 0 ? t.slice(0, max) : null;
};

const pulisciLista = (v: unknown): string[] | null => {
  if (!Array.isArray(v)) return null;
  const voci = v.map((x) => pulisciTesto(x, MAX_VOCE)).filter((x): x is string => !!x);
  return voci.length > 0 ? [...new Set(voci)].slice(0, MAX_VOCI) : null;
};

/** Da un JSON qualsiasi ai campi validi, divisi tra carta/dossier e diagnosi (ignora tutto il resto). */
export function validaCampi(grezzo: unknown): { avatar: CampiAvatar; diagnosi: CampiDiagnosi } {
  const avatar: CampiAvatar = {};
  const diagnosi: CampiDiagnosi = {};
  if (!grezzo || typeof grezzo !== "object") return { avatar, diagnosi };
  const o = grezzo as Record<string, unknown>;
  for (const [k, max] of Object.entries(CAMPI_TESTO) as Array<[CampoTesto, number]>) {
    const t = pulisciTesto(o[k], max);
    if (!t) continue;
    // La frase-simbolo va senza virgolette: le mette la carta.
    avatar[k] = k === "frase" ? t.replace(/^["'«»“”„]+|["'«»“”„]+$/g, "").trim() || t : t;
  }
  for (const k of CAMPI_LISTA) {
    const l = pulisciLista(o[k]);
    if (l) avatar[k] = l;
  }
  if (typeof o.origine === "string" && (ORIGINI as readonly string[]).includes(o.origine)) {
    avatar.origine = o.origine as (typeof ORIGINI)[number];
  }
  for (const [k, max] of Object.entries(DIAGNOSI_TESTO) as Array<[DiagnosiTesto, number]>) {
    const t = pulisciTesto(o[k], max);
    if (t) diagnosi[k] = t;
  }
  for (const k of DIAGNOSI_LISTA) {
    const l = pulisciLista(o[k]);
    if (l) diagnosi[k] = l;
  }
  return { avatar, diagnosi };
}

export type MotivoScheda = "ok" | "nessun_blocco" | "json_invalido";

export interface SchedaEstratta {
  risposta: string;
  avatar: CampiAvatar;
  diagnosi: CampiDiagnosi;
  /** Aura dichiara la raccolta finita (va comunque verificato con campiMancanti). */
  completo: boolean;
  motivo: MotivoScheda;
  /** Il blocco grezzo, per il log quando il JSON non si legge. */
  grezzo: string;
}

/** Separa il testo per il cliente dal blocco <scheda>; segnala se il blocco manca o non è JSON. */
export function estraiScheda(testo: string): SchedaEstratta {
  const apre = testo.indexOf("<scheda>");
  const pulisci = (t: string) => t.replace(/\*\*(.+?)\*\*/g, "$1").replace(/^#{1,6}\s+/gm, "").trim();
  const vuota = (risposta: string, motivo: MotivoScheda, grezzo: string): SchedaEstratta => ({ risposta, avatar: {}, diagnosi: {}, completo: false, motivo, grezzo });
  if (apre === -1) return vuota(pulisci(testo), "nessun_blocco", "");
  const chiude = testo.indexOf("</scheda>", apre);
  const grezzo = chiude > apre ? testo.slice(apre + 8, chiude) : testo.slice(apre + 8);
  const coda = chiude > apre ? testo.slice(chiude + 9) : "";
  const risposta = pulisci(`${testo.slice(0, apre)}\n${coda}`);
  const a = grezzo.indexOf("{");
  const b = grezzo.lastIndexOf("}");
  if (a === -1 || b <= a) return vuota(risposta, "json_invalido", grezzo);
  let json: unknown;
  try {
    json = JSON.parse(grezzo.slice(a, b + 1));
  } catch {
    return vuota(risposta, "json_invalido", grezzo);
  }
  const completo = !!json && typeof json === "object" && (json as { completo?: unknown }).completo === true;
  return { risposta, ...validaCampi(json), completo, motivo: "ok", grezzo };
}

/**
 * Cosa manca perché l'avatar sia davvero completo (stesse soglie del prompt):
 * si calcola sulle righe unite (avatar + diagnosi + campi del turno), non sulla parola di Aura.
 */
export function campiMancanti(avatar: Record<string, unknown>, diagnosi: Record<string, unknown>): string[] {
  const testo = (o: Record<string, unknown>, k: string) => typeof o[k] === "string" && (o[k] as string).trim().length > 0;
  const lista = (k: string, min: number) => Array.isArray(avatar[k]) && (avatar[k] as unknown[]).length >= min;
  const mancanti: string[] = [];
  for (const k of ["nome", "eta", "genere", "situazione", "contesto", "momento", "desiderio_pratico", "desiderio_emotivo", "snapshot"]) {
    if (!testo(avatar, k)) mancanti.push(k);
  }
  if (!testo(diagnosi, "quadro")) mancanti.push("quadro");
  if (!lista("dolori_superficie", 1)) mancanti.push("dolori_superficie");
  if (!lista("dolori_profondi", 1)) mancanti.push("dolori_profondi");
  if (!lista("linguaggio", 3)) mancanti.push("linguaggio (almeno 3 frasi)");
  if (!lista("piattaforme", 1)) mancanti.push("piattaforme");
  if (!lista("obiezioni", 2)) mancanti.push("obiezioni (almeno 2)");
  if (!lista("trigger_acquisto", 1)) mancanti.push("trigger_acquisto");
  return mancanti;
}
