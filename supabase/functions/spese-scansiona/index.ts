/**
 * spese-scansiona — Claude vision legge uno scontrino (foto o PDF già caricato
 * nel bucket `ricevute`) e INSERISCE la spesa variabile con `ricevuta_path`.
 * Body: { storage_path } → { ok, spesa, avviso? }. Se Aura fallisce, la spesa
 * viene registrata comunque (importo 0, "Scontrino da compilare") con `avviso`.
 */
import { gestisciErrore, HttpError, json, leggiBody, preflight } from "../_shared/http.ts";
import { adminClient, richiediFinance } from "../_shared/supabase.ts";
import { estraiJson, streamAnthropicText } from "../_shared/anthropic.ts";
import { logError } from "../_shared/log.ts";
import { type BloccoAllegato, pathValido, scaricaComeBlocco } from "./documento.ts";

const BUCKET = "ricevute";

type Body = {
  storage_path?: unknown;
}

interface Estratto {
  importo: number | null;
  descrizione: string | null;
  data: string | null;
}

const SYSTEM =
  "Sei un assistente contabile italiano. Leggi foto e PDF di scontrini e ricevute. " +
  "Rispondi SOLO con JSON valido, senza testo attorno e senza blocchi di codice.";

const ISTRUZIONI =
  "Questa è la foto (o il PDF) di uno scontrino/ricevuta italiana. Estrai:\n" +
  '- "importo": il TOTALE effettivamente pagato in euro (cerca "TOTALE", "TOT", "TOTALE EURO", "IMPORTO PAGATO"). Numero con punto decimale, senza simboli. Se ci sono più totali usa il totale finale/complessivo.\n' +
  '- "descrizione": breve e utile: nome del negozio/esercente se leggibile, altrimenti la categoria (es. "Esselunga · spesa", "Bar · colazione", "Carburante"). Max 60 caratteri.\n' +
  '- "data": la data dello scontrino in formato YYYY-MM-DD. Se non leggibile, null.\n' +
  'Rispondi SOLO con: {"importo": number|null, "descrizione": string|null, "data": "YYYY-MM-DD"|null}';

function normalizza(obj: Record<string, unknown>): Estratto {
  const importo = typeof obj.importo === "number" && Number.isFinite(obj.importo) && obj.importo >= 0
    ? Math.round(obj.importo * 100) / 100
    : null;
  const data = typeof obj.data === "string" && /^\d{4}-\d{2}-\d{2}$/.test(obj.data) ? obj.data : null;
  const descrizione = typeof obj.descrizione === "string" && obj.descrizione.trim()
    ? obj.descrizione.trim().slice(0, 80)
    : null;
  return { importo, descrizione, data };
}

/** Lettura con Claude: null per qualsiasi fallimento (mai lancia). */
async function leggiScontrino(blocco: BloccoAllegato, path: string): Promise<Estratto | null> {
  const raw = await streamAnthropicText({
    system: SYSTEM,
    user: [blocco, { type: "text", text: ISTRUZIONI }],
    maxTokens: 300,
    tag: "spese-scansiona",
  });
  if (!raw) {
    await logError("spese-scansiona:anthropic", "Nessuna risposta dall'AI", { path }, { silent: true });
    return null;
  }
  const obj = estraiJson<Record<string, unknown>>(raw);
  if (!obj || typeof obj !== "object") {
    await logError("spese-scansiona:json", "Risposta AI senza JSON", { path, raw: raw.slice(0, 300) }, { silent: true });
    return null;
  }
  return normalizza(obj);
}

Deno.serve(async (req: Request) => {
  const pre = preflight(req);
  if (pre) return pre;
  try {
    await richiediFinance(req);
    const body = await leggiBody<Body>(req);
    if (!pathValido(body.storage_path)) throw new HttpError(400, "File dello scontrino non valido.");
    const path = body.storage_path;

    const blocco = await scaricaComeBlocco(BUCKET, path);
    if (!blocco) {
      await logError("spese-scansiona:download", "File non scaricabile o formato non leggibile", { path }, { silent: true });
    }
    const estratto = blocco ? await leggiScontrino(blocco, path) : null;

    const oggi = new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Rome" }).format(new Date());
    const riga = estratto
      ? {
        tipo: "variabile",
        importo: estratto.importo ?? 0,
        descrizione: estratto.descrizione ?? "Scontrino",
        data: estratto.data ?? oggi,
        ricevuta_path: path,
      }
      : { tipo: "variabile", importo: 0, descrizione: "Scontrino da compilare", data: oggi, ricevuta_path: path };

    const { data: spesa, error } = await adminClient().from("spese").insert(riga).select().single();
    if (error) {
      await logError("spese-scansiona:insert", error, { path });
      throw new HttpError(500, "Foto salvata ma non sono riuscito a registrare la spesa. Riprova.");
    }

    const avviso = !estratto
      ? "Non sono riuscita a leggere lo scontrino: compila importo e descrizione a mano."
      : estratto.importo == null
      ? "Scontrino letto ma senza importo: inseriscilo a mano."
      : undefined;
    return json(avviso ? { ok: true, spesa, avviso } : { ok: true, spesa });
  } catch (err) {
    return gestisciErrore(err);
  }
});
