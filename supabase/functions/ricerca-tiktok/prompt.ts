/**
 * Le tre parti della ricerca che servono a Claude (Haiku):
 *  1. dal tema e da chi è il cliente alle keyword «come le scrive una persona nella
 *     barra di ricerca», una per lingua (italiano, inglese, spagnolo);
 *  2. dalle didascalie: riga «di cosa parla» in italiano naturale, fuori tema,
 *     sponsorizzato, da non replicare, lingua quando TikTok non la sa;
 *  3. al massimo 2 osservazioni brevi sulle top già composte.
 * I numeri non passano mai dall'IA: like, views, date e autori vengono da Apify.
 */
import { ANTHROPIC_MODEL } from "../_shared/anthropic.ts";
import { estraiOggetto } from "../_shared/json.ts";
import { entroParole, taglia } from "./filtro.ts";
import { NOMI_LINGUA, nomeLingua } from "./tipi.ts";

export const MODELLO_RICERCA = Deno.env.get("ANTHROPIC_MODEL_RICERCA") || "claude-haiku-4-5-20251001";
/**
 * Le keyword sono una chiamata sola e decidono tutta la ricerca: si usa il modello principale (Haiku
 * le lasciava generiche anche con il contesto del cliente, prova del 07/10/2026).
 */
export const MODELLO_KEYWORD = Deno.env.get("ANTHROPIC_MODEL_KEYWORD") || ANTHROPIC_MODEL;

/** Parole massime di un'osservazione (frasi intere: oltre si toglie la frase). */
export const MAX_PAROLE_OSSERVAZIONE = 25;

export const SYSTEM_KEYWORD = `Prepari le ricerche su TikTok per trovare i video con più like su un tema, per un cliente che crea contenuti per il suo pubblico.
Ricevi il tema e chi è il cliente: cosa fa, cosa vende, a chi, i suoi clienti ideali. Il cliente cerca video da cui prendere spunto per i SUOI contenuti: le keyword devono trovare i video che guarda il suo pubblico (i suoi clienti ideali) su quel tema, non i video generici sul tema.
Regola: se il tema da solo è generico (es. «vendere sui social», «perdere peso», «crescere su instagram»), la keyword aggiunge l'angolo del cliente: il suo pubblico, il suo mestiere o il tipo di cosa che vende, con le parole che userebbe quel pubblico. Una keyword generica porta video di chiunque: chi vende prodotti, dropshipping, e-commerce, che al cliente non servono.
Esempi:
- nutrizionista che segue donne in menopausa, tema «perdere peso» → «dimagrire in menopausa» (non «perdere peso»: porta diete lampo e video per ventenni);
- consulente che aiuta i saloni di parrucchieri a riempire l'agenda, tema «trovare clienti» → «clienti per parrucchieri»;
- chi aiuta professionisti e imprenditori a vendere i loro servizi con i contenuti, tema «vendere sui social» → «trovare clienti sui social», «how to get clients on social media», «cómo conseguir clientes en redes sociales» (non «vendere sui social»: porta chi vende prodotti).
Se il tema è già specifico, lascialo com'è. Non stringere troppo: con parole rare TikTok trova pochi video. Scrivi ogni keyword come la scriverebbe una persona nella barra di ricerca di TikTok: da 2 a 5 parole separate, naturali («perdita di peso», non «perditadipeso»; niente hashtag, niente #). Non usare il nome del cliente o della sua attività.
Una sola keyword per ognuna delle lingue richieste, scritta come la cerca davvero chi parla quella lingua, non tradotta parola per parola dall'italiano.
Rispondi SOLO con JSON: {"keyword":[{"lingua":"it","testo":"..."},{"lingua":"en","testo":"..."},{"lingua":"es","testo":"..."}]}`;

export function promptKeyword(tema: string, lingue: readonly string[], cliente: string | null): string {
  return `Tema: ${tema}
Lingue: ${lingue.map((l) => `${l} (${NOMI_LINGUA[l] ?? l})`).join(", ")}

Il cliente:
${cliente ?? "(nessuna informazione: usa solo il tema)"}`;
}

export interface KeywordProposta {
  lingua: string;
  testo: string;
}

/**
 * Keyword proposte: una per lingua richiesta (il costo è per query), pulite, senza doppioni e
 * nell'ordine delle lingue. Una voce senza lingua va alla prima lingua rimasta senza keyword.
 */
export function leggiKeyword(testo: string | null, lingue: readonly string[]): KeywordProposta[] {
  const o = testo ? (estraiOggetto(testo) as { keyword?: unknown } | null) : null;
  const lista = Array.isArray(o?.keyword) ? o.keyword : [];
  const perLingua = new Map<string, string>();
  const senzaLingua: string[] = [];
  for (const k of lista) {
    const voce = k as { testo?: unknown; lingua?: unknown };
    const grezzo = typeof k === "string" ? k : typeof voce?.testo === "string" ? voce.testo : "";
    const t = taglia(grezzo.replace(/#/g, "").replace(/\s+/g, " ").trim(), 80);
    if (t.length < 2) continue;
    const lingua = typeof voce?.lingua === "string" ? voce.lingua.toLowerCase() : null;
    if (lingua === null) senzaLingua.push(t);
    else if (lingue.includes(lingua) && !perLingua.has(lingua)) perLingua.set(lingua, t);
  }
  for (const l of lingue) if (!perLingua.has(l) && senzaLingua.length > 0) perLingua.set(l, senzaLingua.shift() as string);
  const fuori: KeywordProposta[] = [];
  for (const l of lingue) {
    const t = perLingua.get(l);
    if (t && !fuori.some((x) => x.testo.toLowerCase() === t.toLowerCase())) fuori.push({ lingua: l, testo: t });
  }
  return fuori;
}

export const SYSTEM_ANALISI = `Lavori su una ricerca dei video TikTok con più like. Ricevi l'elenco dei video con la didascalia. NON hai visto i video: lavori solo sulla didascalia. Non scrivi copy, non dai consigli, non giudichi i video.

Per ogni video:
- "tema": di cosa parla, preso dalla didascalia anche se è in un'altra lingua, massimo 10 parole (meglio 8). Scrivilo in italiano naturale, come lo direbbe un italiano che lavora sui social: una frase che si legge bene (con articoli e preposizioni), non un elenco di parole chiave e non una traduzione parola per parola. Sì «vendere sui social», «visibilità», «strategia»; no «reti sociali», «alcance», «estrategia». Lascia come sono i termini che in italiano si usano in inglese (live, dropshipping, e-commerce, coach) e i nomi propri. Se la didascalia è vuota scrivi "senza didascalia"; se contiene solo hashtag scrivi "solo hashtag"; se non dice di cosa parla il video (solo numeri, emoji o una sigla) scrivi "didascalia non chiara". Non descrivere un video dalla sola keyword.
- "fuori_tema": true se dalla didascalia il video non c'entra con il tema della ricerca, anche se porta l'hashtag.
- "sponsorizzato": true se il testo contiene pubblicità, adv/publi, un codice sconto o un link affiliato.
- "da_non_replicare": true SOLO nelle nicchie di salute (dimagrimento, alimentazione, integratori) per video che spingono digiuni estremi, diete lampo, farmaci o chili persi irreali. Altrimenti false.
- "lingua": codice ISO a 2 lettere dedotto dal testo SOLO se la lingua indicata è "un" o manca; altrimenti null.
Con una didascalia che non dice niente non puoi giudicare: "fuori_tema", "sponsorizzato" e "da_non_replicare" sono false.

Rispondi SOLO con JSON compatto su una riga, un oggetto per ogni video ricevuto: {"video":[{"n":1,"tema":"...","fuori_tema":false,"sponsorizzato":false,"da_non_replicare":false,"lingua":null}]}`;

export interface VideoPerAnalisi {
  n: number;
  lingua: string | null;
  testo: string;
}

export function promptAnalisi(d: { tema: string; keyword: string[]; video: VideoPerAnalisi[] }): string {
  const righe = d.video.map((v) => `${v.n}. lingua=${v.lingua ?? "manca"}\n   didascalia: ${taglia(v.testo.replace(/\s+/g, " "), 400)}`);
  return `Tema della ricerca: ${d.tema}
Keyword usate: ${d.keyword.join(", ")}

${righe.join("\n")}`;
}

/** Parole che non chiudono una frase italiana («… senza pagare la»). */
const PAROLE_VUOTE = /^(di|a|da|in|con|su|per|tra|fra|e|o|che|il|lo|la|i|gli|le|l'|un|una|uno|del|dello|della|dei|degli|delle|al|allo|alla|ai|agli|alle|dal|dalla|nel|nella|nei|sul|sulla|sui)$/i;

/** Al massimo 10 parole (regola del documento), tagliate a parola intera e senza finire su un articolo o una preposizione. */
export function dieciParole(testo: string): string | null {
  const parole = testo.trim().split(/\s+/);
  if (parole.length <= 10) return taglia(parole.join(" "), 120);
  const p = parole.slice(0, 10);
  while (p.length > 1 && PAROLE_VUOTE.test(p[p.length - 1])) p.pop();
  return taglia(p.join(" ").replace(/[,;:–-]+$/, ""), 120);
}

export interface AnalisiVideo {
  tema: string | null;
  fuoriTema: boolean;
  sponsorizzato: boolean;
  daNonReplicare: boolean;
  lingua: string | null;
}

/** Risposta dell'analisi → per numero di video; i video mancanti non ci sono (li riprova chi chiama). */
export function leggiAnalisi(testo: string | null): Map<number, AnalisiVideo> {
  const o = testo ? (estraiOggetto(testo) as { video?: unknown } | null) : null;
  const video = new Map<number, AnalisiVideo>();
  for (const raw of Array.isArray(o?.video) ? o.video : []) {
    const v = raw as Record<string, unknown>;
    if (typeof v.n !== "number") continue;
    const lingua = typeof v.lingua === "string" && /^[a-z]{2}$/i.test(v.lingua) ? v.lingua.toLowerCase() : null;
    video.set(v.n, {
      tema: typeof v.tema === "string" && v.tema.trim() ? dieciParole(v.tema) : null,
      fuoriTema: v.fuori_tema === true,
      sponsorizzato: v.sponsorizzato === true,
      daNonReplicare: v.da_non_replicare === true,
      lingua,
    });
  }
  return video;
}

export const SYSTEM_OSSERVAZIONI = `Ricevi il risultato di una ricerca dei video TikTok con più like degli ultimi 6 mesi su un tema: una top per lingua, con i like e una riga su di cosa parla ogni video (presa dalla didascalia: i video non li hai visti), più gli eventuali video rimasti fuori dalla soglia per pochi giorni.
Scrivi al massimo 2 osservazioni che escono da questi dati: quali forme o argomenti di video tornano tra i primi, che differenza c'è tra le lingue negli argomenti, cosa è rimasto fuori per pochi giorni (solo se c'è).
Regole:
- Ogni osservazione è UNA frase di massimo 20 parole, in italiano naturale (non tradotto parola per parola).
- Niente numeri e niente conteggi: li mostrano già le tabelle.
- Non confrontare i numeri tra le lingue (quale lingua ha più like, views o engagement): lo scrive già il sistema.
- Scrivi «lingue», non «idiomi»; niente calchi dallo spagnolo o dall'inglese.
- Niente consigli su cosa fare, niente giudizi sui video, niente copy.
- Non prendere come esempio positivo i video segnati «da non replicare».
Rispondi SOLO con JSON: {"osservazioni":["...","..."]}`;

export interface TopPerOsservazioni {
  lingua: string;
  video: Array<{ like: number | null; diCosaParla: string | null; segnali: string[] }>;
}

export function promptOsservazioni(d: { tema: string; soglia: string; top: TopPerOsservazioni[]; fuoriSoglia: TopPerOsservazioni["video"] }): string {
  const riga = (v: TopPerOsservazioni["video"][number], i: number) =>
    `${i + 1}. ${v.like ?? "?"} like — ${v.diCosaParla ?? "(nessuna riga)"}${v.segnali.length > 0 ? ` [${v.segnali.join(", ")}]` : ""}`;
  const blocchi = d.top.map((t) =>
    t.video.length > 0 ? `Top in ${nomeLingua(t.lingua)}:\n${t.video.map(riga).join("\n")}` : `Top in ${nomeLingua(t.lingua)}: nessun video recente.`,
  );
  const fuori = d.fuoriSoglia.length > 0 ? `\n\nRimasti fuori dalla soglia per pochi giorni:\n${d.fuoriSoglia.map(riga).join("\n")}` : "";
  return `Tema della ricerca: ${d.tema}
Video dal ${d.soglia} (ultimi 6 mesi).

${blocchi.join("\n\n")}${fuori}`;
}

/** Al massimo 2 osservazioni, ognuna di frasi intere entro MAX_PAROLE_OSSERVAZIONE parole. */
export function leggiOsservazioni(testo: string | null): string[] {
  const o = testo ? (estraiOggetto(testo) as { osservazioni?: unknown } | null) : null;
  return (Array.isArray(o?.osservazioni) ? o.osservazioni : [])
    .filter((x): x is string => typeof x === "string" && x.trim().length > 0)
    .map((x) => entroParole(taglia(x, 600), MAX_PAROLE_OSSERVAZIONE))
    .filter((x): x is string => x !== null)
    .slice(0, 2);
}
