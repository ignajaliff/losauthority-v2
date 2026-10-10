/**
 * Prompt di "Crea idee": Aura propone idee di video brevi partendo dal METODO di
 * Wesley (tabella aura_conoscenza), dal materiale del cliente (scheda onboarding,
 * analisi, idee recenti, pubblicazioni che hanno funzionato) e dalla conversazione.
 * Risposta in due parti: testo breve + blocco <idee>[...]</idee> con le proposte.
 */
import { type Blocco, blocchiPrompt } from "../_shared/anthropic.ts";

export const TIPOLOGIE = ["virale", "consolidazione", "vendita", "content_series"] as const;
export type Tipologia = (typeof TIPOLOGIE)[number];

export interface Proposta {
  titolo: string;
  hook: string | null;
  script: string | null;
  tipologia: Tipologia | null;
}

export const SYSTEM = `Sei Aura, la creatrice di idee di Upscale, il percorso di Wesley Caicedo per creator e professionisti che crescono sui social. Aiuti un cliente a trovare e scrivere idee per i suoi prossimi video brevi (TikTok, Instagram).

Lavori SOLO con il METODO che ricevi nel contesto (blocco METODO DI WESLEY) e con i dati del cliente (scheda, analisi, idee già fatte, video che hanno funzionato). Non sei un assistente generico: se il cliente chiede altro, riportalo con gentilezza alle sue idee.

Come rispondi, SEMPRE in questo ordine:
1. Una risposta breve e conversazionale (2-4 frasi): cosa hai capito, perché proponi quello che proponi, o UNA domanda se ti manca un dato decisivo. Italiano, dai del tu, voce di Wesley: diretta, concreta, zero fuffa, zero complimenti vuoti.
2. Se proponi idee, subito dopo un blocco ESATTAMENTE così:
<idee>
[{"titolo": "…", "hook": "…", "script": "…", "tipologia": "virale|consolidazione|vendita|content_series"}]
</idee>
   - Da 1 a 3 idee, diverse tra loro. JSON valido, nessun testo dentro il blocco oltre all'array.
   - "titolo": nome interno breve (max 80 caratteri). "hook": la prima frase pronta da dire. "script": testo PARLATO completo in prima persona, 100-160 parole, senza titoli né elenchi. "tipologia": una delle quattro.
   - Le idee nascono dal cliente ideale e dai dolori del cliente, con le SUE parole e i SUOI esempi. Mai inventare numeri o fatti su di lui.
3. Se fai una domanda invece di proporre, NON mettere il blocco <idee>.

Se il cliente ti chiede di cambiare una proposta (più corta, altro hook, altra tipologia), rispondi con la versione nuova nel blocco <idee>, una sola idea.
Se nel contesto c'è un blocco STILE SCELTO DAL CLIENTE, ogni idea che proponi segue QUELLO stile: stessa struttura, stesso tipo di hook, stesso ritmo e chiusura, applicati a quanto chiede il messaggio. Lo stile vince sulle abitudini generali.
Se nel contesto c'è un blocco RICERCA TIKTOK SCELTA DAL CLIENTE, sono i video con più like degli ultimi 6 mesi sul suo tema (dati reali, li hai solo come didascalia: non li hai visti). Le idee prendono spunto da quello che torna tra i vincitori (temi, angoli, forme di hook) adattato al cliente e alla sua scheda: mai copiare un video, mai citare numeri che non sono nel blocco. I video segnati «da non replicare» non si usano mai come modello; quelli «fuori tema» o «sponsorizzato» pesano poco.
Se nel contesto c'è il blocco KIT BRAND DEL CLIENTE, per colori, font, tono di voce e regole della marca usa SOLO quei dati: non inventare codici colore o font.
Scrivi in testo semplice: NIENTE markdown, niente asterischi, niente titoli, niente elenchi nella risposta parlata.
Non promettere risultati. Nessun consiglio legale, medico o finanziario. Niente testo dopo il blocco </idee>.`;

export interface Storico {
  ruolo: "cliente" | "aura";
  contenuto: string;
}

export interface TopPubblicazione {
  titolo: string;
  piattaforma: string;
  visualizzazioni: number | null;
}

/** Un video della ricerca TikTok agganciata al messaggio («Usa in Crea idee»). */
export interface VideoRicerca {
  sezione: string;
  posizione: number;
  autore: string | null;
  lingua: string | null;
  mi_piace: number | null;
  visualizzazioni: number | null;
  di_cosa_parla: string | null;
  didascalia: string | null;
  url: string;
  sponsorizzato: boolean;
  fuori_tema: boolean;
  da_non_replicare: boolean;
}

/** Ricerca TikTok scelta dal cliente (tabella ricerche_tiktok + ricerche_tiktok_video). */
export interface RicercaScelta {
  tema: string;
  soglia_dal: string | null;
  osservazioni: string[];
  video: VideoRicerca[];
}

/** Stile della pagina "Stili" richiamato dal cliente con "/" (tabella stili). */
export interface StileScelto {
  titolo: string;
  istruzioni: string;
}

export interface DatiPrompt {
  nome: string;
  scheda: string;
  analisi: string | null;
  /** Il blocco `=== KIT BRAND DEL CLIENTE ===` (`_shared/kit-brand.ts`), null se il kit è vuoto. */
  kitBrand: string | null;
  conoscenza: string;
  stile: StileScelto | null;
  ricerca: RicercaScelta | null;
  storico: Storico[];
  ideeRecenti: string[];
  topPubblicazioni: TopPubblicazione[];
  messaggio: string;
}

const taglia = (t: string, n: number) => (t.length > n ? `${t.slice(0, n)}…` : t);

const NOMI_LINGUA: Record<string, string> = { it: "italiano", en: "inglese", es: "spagnolo" };
const etichettaSezione = (v: VideoRicerca) =>
  v.sezione === "lingua_target" ? "[migliori nella sua lingua] " : v.sezione === "top_lingua" ? `[top in ${NOMI_LINGUA[v.lingua ?? ""] ?? v.lingua ?? "?"}] ` : "";

/** Il blocco della ricerca TikTok: una riga per video con numeri, segnali e la riga «di cosa parla» (una top per lingua dal 07/10/2026). */
function bloccoRicerca(r: RicercaScelta): string {
  const segnali = (v: VideoRicerca) =>
    [v.da_non_replicare && "DA NON REPLICARE", v.fuori_tema && "fuori tema", v.sponsorizzato && "sponsorizzato"].filter(Boolean).join(", ");
  const righe = r.video.map((v) => {
    const s = segnali(v);
    const tema = v.di_cosa_parla ?? (v.didascalia ? taglia(v.didascalia.replace(/\s+/g, " "), 160) : "senza didascalia");
    return `• ${etichettaSezione(v)}#${v.posizione} @${v.autore ?? "?"} (${v.lingua ?? "–"}) · ${v.mi_piace ?? "?"} like · ${v.visualizzazioni ?? "?"} views — ${tema}${s ? ` [${s}]` : ""}`;
  });
  const oss = r.osservazioni.length > 0 ? `\nOsservazioni: ${r.osservazioni.join(" · ")}` : "";
  return `=== RICERCA TIKTOK SCELTA DAL CLIENTE: "${r.tema}" (video dal ${r.soglia_dal ?? "?"}, ordinati per like dentro ogni top) ===\n${righe.join("\n")}${oss}\n\nLe idee di questa risposta prendono spunto da questi video.`;
}

/** Tre tratti per il prompt caching: metodo (fisso), stile+scheda+analisi (fissi nella sessione), idee recenti+pubblicazioni+ricerca TikTok+storico+messaggio. */
export function costruisciPrompt(d: DatiPrompt): Blocco[] {
  const fisso = [`=== METODO DI WESLEY (usa SOLO questo) ===\n${d.conoscenza || "(nessun blocco caricato: usa buon senso e chiedi conferma)"}`];
  const cliente: string[] = [];
  if (d.stile) {
    cliente.push(`=== STILE SCELTO DAL CLIENTE: "${d.stile.titolo}" ===\n${taglia(d.stile.istruzioni, 12000)}\n\nLe idee di questa risposta seguono questo stile.`);
  }
  cliente.push(`=== CLIENTE: ${d.nome} ===\n--- Scheda onboarding ---${d.scheda}`);
  if (d.analisi) cliente.push(`--- Analisi strategica di Aura ---\n${taglia(d.analisi, 6000)}`);
  if (d.kitBrand) cliente.push(d.kitBrand);
  const variabile: string[] = [];
  if (d.ideeRecenti.length > 0) {
    variabile.push(`--- Idee già proposte o salvate (non ripeterle) ---\n${d.ideeRecenti.map((t) => `• ${t}`).join("\n")}`);
  }
  if (d.topPubblicazioni.length > 0) {
    const righe = d.topPubblicazioni.map(
      (p) => `• ${p.titolo} (${p.piattaforma}${p.visualizzazioni != null ? `, ${p.visualizzazioni} visualizzazioni` : ""})`,
    );
    variabile.push(`--- Video del cliente che hanno funzionato meglio ---\n${righe.join("\n")}`);
  }
  if (d.ricerca && d.ricerca.video.length > 0) variabile.push(bloccoRicerca(d.ricerca));
  if (d.storico.length > 0) {
    const righe = d.storico.map((m) => `${m.ruolo === "cliente" ? "CLIENTE" : "AURA"}: ${taglia(m.contenuto, 1500)}`);
    variabile.push(`=== CONVERSAZIONE FINORA ===\n${righe.join("\n\n")}`);
  }
  variabile.push(`=== NUOVO MESSAGGIO DEL CLIENTE ===\n${d.messaggio}`);
  return blocchiPrompt(fisso, cliente, variabile);
}

const str = (v: unknown, max: number): string | null => {
  if (typeof v !== "string") return null;
  const t = v.trim();
  return t ? t.slice(0, max) : null;
};

/** Toglie il markdown leggero che il modello a volte infila comunque (grassetti, titoli). */
function pulisci(t: string): string {
  return t.replace(/\*\*(.+?)\*\*/g, "$1").replace(/^#{1,6}\s+/gm, "").trim();
}

/** Separa la risposta parlata dal blocco <idee> e valida le proposte (max 3). */
export function estraiProposte(testo: string): { risposta: string; proposte: Proposta[] } {
  const apre = testo.indexOf("<idee>");
  const chiude = testo.indexOf("</idee>");
  if (apre === -1) return { risposta: pulisci(testo), proposte: [] };
  const risposta = pulisci(testo.slice(0, apre));
  const grezzo = chiude > apre ? testo.slice(apre + 6, chiude) : testo.slice(apre + 6);
  const a = grezzo.indexOf("[");
  const b = grezzo.lastIndexOf("]");
  if (a === -1 || b <= a) return { risposta, proposte: [] };
  let lista: unknown;
  try {
    lista = JSON.parse(grezzo.slice(a, b + 1));
  } catch {
    return { risposta, proposte: [] };
  }
  if (!Array.isArray(lista)) return { risposta, proposte: [] };
  const proposte: Proposta[] = [];
  for (const el of lista.slice(0, 3)) {
    if (!el || typeof el !== "object") continue;
    const o = el as Record<string, unknown>;
    const titolo = str(o.titolo, 200);
    if (!titolo) continue;
    const tip = str(o.tipologia, 40);
    proposte.push({
      titolo,
      hook: str(o.hook, 500),
      script: str(o.script, 20000),
      tipologia: tip && (TIPOLOGIE as ReadonlyArray<string>).includes(tip) ? (tip as Tipologia) : null,
    });
  }
  return { risposta, proposte };
}
