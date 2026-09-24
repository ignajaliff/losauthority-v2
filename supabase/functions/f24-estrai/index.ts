/**
 * f24-estrai — Claude legge un F24 (PDF nel bucket `f24`) e registra una riga
 * per ogni versamento/rata.
 * Body: { storage_path } (nuovo upload) oppure { f24_id } (rilettura).
 *  - storage_path: una riga `f24` per pagamento; se non legge nulla, una riga
 *    vuota con pdf_path da compilare a mano.
 *  - f24_id: aggiorna quella riga col primo pagamento e inserisce le rate
 *    mancanti (stesso pdf_path, confronto per scadenza).
 * Risposta { ok, righe: F24[] }.
 */
import { gestisciErrore, HttpError, json, leggiBody, preflight } from "../_shared/http.ts";
import { adminClient, richiediFinance } from "../_shared/supabase.ts";
import { logError } from "../_shared/log.ts";
import { descrizioneRata, leggiPagamenti, type Pagamento, pathValido, scaricaPdf } from "./estrazione.ts";

type Body = {
  storage_path?: unknown;
  f24_id?: unknown;
}

interface RigaF24 {
  id: string;
  scadenza: string | null;
  pdf_path: string;
}

async function righePerPdf(pdfPath: string): Promise<unknown[]> {
  const { data, error } = await adminClient()
    .from("f24")
    .select("*")
    .eq("pdf_path", pdfPath)
    .order("scadenza", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: true });
  if (error) {
    await logError("f24-estrai:righe", error, { pdfPath });
    throw new HttpError(500, "F24 registrato ma non sono riuscito a rileggere le righe. Ricarica la pagina.");
  }
  return (data ?? []) as unknown[];
}

/** Nuovo PDF: una riga per pagamento (o una riga vuota da compilare). */
async function daStoragePath(path: string): Promise<Response> {
  const pdf = await scaricaPdf(path);
  if (!pdf) throw new HttpError(404, "Non trovo il PDF appena caricato. Riprova.");
  const pagamenti = await leggiPagamenti(pdf, path);

  const righe = pagamenti && pagamenti.length > 0
    ? pagamenti.map((p, i) => ({
      descrizione: descrizioneRata(p, i + 1, pagamenti.length),
      importo: p.importo,
      scadenza: p.scadenza,
      pdf_path: path,
    }))
    : [{ descrizione: null, importo: null, scadenza: null, pdf_path: path }];

  const { error } = await adminClient().from("f24").insert(righe);
  if (error) {
    await logError("f24-estrai:insert", error, { path, n: righe.length });
    throw new HttpError(500, "PDF caricato ma non sono riuscito a registrare l'F24. Riprova.");
  }
  return json({ ok: true, righe: await righePerPdf(path), letti: pagamenti?.length ?? 0 });
}

/** Rilettura di una riga esistente: aggiorna la riga e aggiunge le rate mancanti. */
async function daF24Id(f24Id: string): Promise<Response> {
  const admin = adminClient();
  const { data: rigaRaw } = await admin.from("f24").select("id, scadenza, pdf_path").eq("id", f24Id).maybeSingle();
  const riga = rigaRaw as RigaF24 | null;
  if (!riga?.pdf_path) throw new HttpError(404, "F24 non trovato.");

  const pdf = await scaricaPdf(riga.pdf_path);
  if (!pdf) throw new HttpError(404, "Il PDF di questo F24 non è più nel bucket.");
  const pagamenti: Pagamento[] | null = await leggiPagamenti(pdf, riga.pdf_path);
  if (!pagamenti || pagamenti.length === 0) {
    throw new HttpError(422, "Non sono riuscita a leggere importo e scadenza dal PDF: compila a mano.");
  }

  // Questa riga prende il primo versamento…
  const primo = pagamenti[0];
  const { error: errUpdate } = await admin
    .from("f24")
    .update({
      descrizione: descrizioneRata(primo, 1, pagamenti.length),
      importo: primo.importo,
      scadenza: primo.scadenza,
    })
    .eq("id", f24Id);
  if (errUpdate) {
    await logError("f24-estrai:update", errUpdate, { f24Id });
    throw new HttpError(500, "Non sono riuscito ad aggiornare l'F24. Riprova.");
  }

  // …le altre rate si aggiungono solo se manca una riga sorella con quella scadenza
  // (stesso PDF): così «Rileggi» premuto due volte non duplica nulla.
  if (pagamenti.length > 1) {
    const { data: sorelleRaw } = await admin.from("f24").select("id, scadenza, pdf_path").eq("pdf_path", riga.pdf_path);
    const scadenzeEsistenti = new Set(
      ((sorelleRaw ?? []) as RigaF24[]).map((s) => s.scadenza).filter((s): s is string => !!s),
    );
    const mancanti = pagamenti
      .map((p, i) => ({ p, i: i + 1 }))
      .filter(({ p, i }) => i > 1 && (!p.scadenza || !scadenzeEsistenti.has(p.scadenza)))
      .map(({ p, i }) => ({
        descrizione: descrizioneRata(p, i, pagamenti.length),
        importo: p.importo,
        scadenza: p.scadenza,
        pdf_path: riga.pdf_path,
      }));
    if (mancanti.length > 0) {
      const { error: errInsert } = await admin.from("f24").insert(mancanti);
      if (errInsert) await logError("f24-estrai:rate", errInsert, { f24Id, n: mancanti.length });
    }
  }
  return json({ ok: true, righe: await righePerPdf(riga.pdf_path), letti: pagamenti.length });
}

Deno.serve(async (req: Request) => {
  const pre = preflight(req);
  if (pre) return pre;
  try {
    await richiediFinance(req);
    const body = await leggiBody<Body>(req);
    if (typeof body.f24_id === "string" && body.f24_id.trim()) return await daF24Id(body.f24_id.trim());
    if (pathValido(body.storage_path)) return await daStoragePath(body.storage_path);
    throw new HttpError(400, "Indica il PDF da leggere (storage_path) o l'F24 da rileggere (f24_id).");
  } catch (err) {
    return gestisciErrore(err);
  }
});
