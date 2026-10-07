/**
 * Dal dataset Apify ai video salvati: filtro del documento, analisi delle
 * didascalie con Claude (a blocchi in parallelo, con un secondo tentativo sui
 * video mancanti), una top per lingua (decisione dell'utente del 07/10/2026),
 * «rimasti fuori per pochi giorni», avviso e osservazioni. Non salva mai righe
 * «analizzate a metà»: se l'analisi resta incompleta lancia un errore da
 * riprovare. Le osservazioni invece sono facoltative: se Claude non le scrive
 * resta solo la frase sulla lingua.
 */
import type { SupabaseClient } from "npm:@supabase/supabase-js@2";
import { HAS_ANTHROPIC, streamAnthropicText } from "../_shared/anthropic.ts";
import { logError } from "../_shared/log.ts";
import { leggiDataset } from "./apify.ts";
import {
  avvisoLingue,
  componiTop,
  erroriDataset,
  filtra,
  fraseLingue,
  fuoriSogliaFinali,
  normalizzaVideo,
  segnaliCerti,
  taglia,
  type Segnali,
  type VideoConLingua,
  type VideoTiktok,
} from "./filtro.ts";
import {
  type AnalisiVideo,
  leggiAnalisi,
  leggiOsservazioni,
  MODELLO_RICERCA,
  promptAnalisi,
  promptOsservazioni,
  SYSTEM_ANALISI,
  SYSTEM_OSSERVAZIONI,
  type TopPerOsservazioni,
  type VideoPerAnalisi,
} from "./prompt.ts";
import { ErroreElabora, MSG_VUOTA, type Ricerca } from "./tipi.ts";

/** Video per chiamata a Claude: blocchi piccoli in parallelo, più veloci e mai troncati. */
const VIDEO_PER_CHIAMATA = 20;
/** Uno stream bloccato finisce nel percorso «riprova» invece di far uccidere la funzione dalla piattaforma. */
const TIMEOUT_CLAUDE_MS = 60_000;

interface Riga extends VideoConLingua {
  diCosaParla: string | null;
  s: Segnali;
  a: AnalisiVideo | undefined;
}

/** Una chiamata a Claude sui video dati (tokens in proporzione: con JSON compatto non si tronca). */
async function chiediAnalisi(r: Ricerca, video: VideoPerAnalisi[]): Promise<Map<number, AnalisiVideo>> {
  const testo = await streamAnthropicText({
    system: SYSTEM_ANALISI,
    user: promptAnalisi({ tema: r.tema, keyword: r.keyword, video }),
    maxTokens: Math.min(4000, 300 + video.length * 110),
    tag: "ricerca-tiktok:analisi",
    model: MODELLO_RICERCA,
    utente: r.cliente_id,
    timeoutMs: TIMEOUT_CLAUDE_MS,
  });
  return leggiAnalisi(testo);
}

/** Analisi di tutti i video dati, a blocchi in parallelo; i mancanti si riprovano una volta, poi è un errore da riprovare. */
async function analizza(r: Ricerca, video: VideoPerAnalisi[]): Promise<Map<number, AnalisiVideo>> {
  const esito = new Map<number, AnalisiVideo>();
  const giro = async (lista: VideoPerAnalisi[]) => {
    const blocchi: VideoPerAnalisi[][] = [];
    for (let i = 0; i < lista.length; i += VIDEO_PER_CHIAMATA) blocchi.push(lista.slice(i, i + VIDEO_PER_CHIAMATA));
    const risposte = await Promise.all(blocchi.map((b) => chiediAnalisi(r, b)));
    // Ogni risposta vale solo per i numeri del suo blocco: un numero sbagliato resta mancante e si riprova.
    risposte.forEach((m, i) => {
      const attesi = new Set(blocchi[i].map((v) => v.n));
      for (const [n, a] of m) if (attesi.has(n) && !esito.has(n)) esito.set(n, a);
    });
  };
  await giro(video);
  const mancanti = video.filter((v) => !esito.has(v.n));
  if (mancanti.length > 0) await giro(mancanti);
  const ancora = video.filter((v) => !esito.has(v.n)).length;
  if (ancora > 0) throw new ErroreElabora(`analisi incompleta: ${ancora}/${video.length} video`, false);
  return esito;
}

const segnaliDi = (x: Riga) =>
  [x.a?.daNonReplicare && !x.s.senzaDidascalia && "da non replicare", x.a?.fuoriTema && !x.s.senzaDidascalia && "fuori tema"].filter(
    (s): s is string => typeof s === "string",
  );

/** Fino a 2 osservazioni di Claude sulle top già composte. Facoltative: qualunque problema → nessuna. */
async function osservazioniDiClaude(r: Ricerca, soglia: string, top: Map<string, Riga[]>, fuori: Riga[]): Promise<string[]> {
  const perPrompt = (x: Riga) => ({ like: x.v.like, diCosaParla: x.diCosaParla, segnali: segnaliDi(x) });
  const tops: TopPerOsservazioni[] = [...top].map(([lingua, t]) => ({ lingua, video: t.map(perPrompt) }));
  if (tops.every((t) => t.video.length === 0)) return [];
  try {
    const testo = await streamAnthropicText({
      system: SYSTEM_OSSERVAZIONI,
      user: promptOsservazioni({ tema: r.tema, soglia, top: tops, fuoriSoglia: fuori.map(perPrompt) }),
      maxTokens: 400,
      tag: "ricerca-tiktok:osservazioni",
      model: MODELLO_RICERCA,
      utente: r.cliente_id,
      timeoutMs: TIMEOUT_CLAUDE_MS,
    });
    return leggiOsservazioni(testo);
  } catch (err) {
    await logError("ricerca-tiktok:osservazioni", err, { user: r.cliente_id, ricerca: r.id }, { silent: true });
    return [];
  }
}

export async function elabora(admin: SupabaseClient, r: Ricerca, datasetId: string, quando: Date): Promise<"pronta" | "errore"> {
  const dataset = await leggiDataset(datasetId);
  if (!dataset.ok) throw new ErroreElabora(dataset.dettaglio, dataset.definitivo === true);
  const video = dataset.items.map(normalizzaVideo).filter((v): v is VideoTiktok => v !== null);
  // Le ricerche nate prima delle tre lingue automatiche hanno 1-2 lingue: valgono quelle.
  const lingue = r.lingue.length > 0 ? r.lingue : [r.lingua_target];
  const esito = filtra(video, { oggi: quando, quanti: r.quanti, lingue });
  const soglia = esito.soglia.toISOString().slice(0, 10);

  // Nessun video: la ricerca non conta nei 15 giorni (il cliente può riprovare con altre parole).
  if (esito.raccolti === 0) {
    await logError("ricerca-tiktok:vuota", erroriDataset(dataset.items).join(" | ") || "dataset senza video", {
      user: r.cliente_id,
      ricerca: r.id,
      items: dataset.items.length,
    });
    const { error } = await admin.from("ricerche_tiktok").update({ stato: "errore", errore: MSG_VUOTA, raccolti: 0, recenti: 0, soglia_dal: soglia }).eq("id", r.id);
    if (error) throw error;
    return "errore";
  }

  // I candidati: le top provvisorie per lingua, i video di lingua incerta e i fuori soglia (senza doppioni).
  const candidati = [...new Map([...[...esito.certi.values()].flat(), ...esito.incerti, ...esito.fuoriSoglia].map((v) => [v.url, v])).values()];
  const numerati = candidati.map((v, i) => ({ n: i + 1, v, s: segnaliCerti(v.testo) }));
  // Claude legge solo le didascalie vere (senza didascalia o solo hashtag si sa già cosa scrivere).
  const daAnalizzare: VideoPerAnalisi[] = numerati.filter((x) => !x.s.senzaDidascalia && !x.s.soloHashtag).map((x) => ({ n: x.n, lingua: x.v.lingua, testo: x.v.testo }));
  let analisi = new Map<number, AnalisiVideo>();
  if (daAnalizzare.length > 0) {
    if (!HAS_ANTHROPIC) throw new ErroreElabora("ANTHROPIC_API_KEY mancante", false);
    analisi = await analizza(r, daAnalizzare);
  }

  const righe: Riga[] = numerati.map(({ n, v, s }) => {
    const letta = analisi.get(n);
    // Una didascalia che non dice niente non si può giudicare: niente segnali di Claude (come senza didascalia).
    const a = letta && letta.tema === "didascalia non chiara" ? { ...letta, fuoriTema: false, sponsorizzato: false, daNonReplicare: false } : letta;
    // Lingua: quella di TikTok; se «un» la deduce Aura dal testo; se nessuno la sa «–» (e il video non entra in una top).
    const lingua = v.lingua && v.lingua !== "un" ? v.lingua : (a?.lingua ?? "–");
    const diCosaParla = s.senzaDidascalia ? "senza didascalia" : s.soloHashtag ? "solo hashtag" : (a?.tema ?? null);
    return { v, lingua, diCosaParla, s, a };
  });
  const recente = (x: Riga) => x.v.creato !== null && x.v.creato >= esito.soglia;
  const top = componiTop(righe.filter(recente), lingue, r.quanti);
  const fuori = fuoriSogliaFinali(righe.filter((x) => !recente(x)), top, r.quanti);

  const insert = [
    ...[...top].flatMap(([lingua, t]) => t.map((x, i) => ({ x, sezione: "top_lingua", posizione: i + 1, lingua }))),
    ...fuori.map((x, i) => ({ x, sezione: "fuori_soglia", posizione: i + 1, lingua: x.lingua })),
  ].map(({ x: { v, diCosaParla, s, a }, sezione, posizione, lingua }) => ({
    ricerca_id: r.id,
    sezione,
    posizione,
    query: v.query ? taglia(v.query, 200) : null,
    autore: v.autore ? taglia(v.autore, 200) : null,
    lingua,
    mi_piace: v.like,
    visualizzazioni: v.views,
    pubblicato_il: v.creato?.toISOString() ?? null,
    url: v.url.slice(0, 500),
    didascalia: v.testo ? taglia(v.testo, 2200) : null,
    di_cosa_parla: diCosaParla,
    senza_didascalia: s.senzaDidascalia,
    solo_hashtag: s.soloHashtag,
    sponsorizzato: s.sponsorizzato || (!s.senzaDidascalia && (a?.sponsorizzato ?? false)),
    // Senza didascalia non si può giudicare (il documento: «la riga viene dalla didascalia»).
    fuori_tema: !s.senzaDidascalia && (a?.fuoriTema ?? false),
    da_non_replicare: !s.senzaDidascalia && (a?.daNonReplicare ?? false),
  }));

  // Prima di scrivere: se la funzione muore durante le osservazioni non resta niente a metà.
  const frase = fraseLingue(top);
  const osservazioni = [...(frase ? [frase] : []), ...(await osservazioniDiClaude(r, soglia, top, fuori))].slice(0, 3);

  // Una elaborazione ripresa riparte pulita.
  const { error: errPulizia } = await admin.from("ricerche_tiktok_video").delete().eq("ricerca_id", r.id);
  if (errPulizia) throw errPulizia;
  if (insert.length > 0) {
    const { error } = await admin.from("ricerche_tiktok_video").insert(insert);
    if (error) throw error;
  }

  const { error } = await admin
    .from("ricerche_tiktok")
    .update({
      stato: "pronta",
      errore: null,
      soglia_dal: soglia,
      raccolti: esito.raccolti,
      recenti: esito.recenti,
      avviso: avvisoLingue(top, r.quanti),
      osservazioni,
      completata_il: new Date().toISOString(),
    })
    .eq("id", r.id);
  if (error) throw error;
  return "pronta";
}
