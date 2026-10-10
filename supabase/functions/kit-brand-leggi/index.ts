/**
 * kit-brand-leggi — legge i documenti del Kit Brand (PDF e immagini) e salva
 * il testo in `kit_brand_documenti.testo_estratto`, così gli agenti di Aura
 * li hanno nel prompt (`_shared/kit-brand.ts`). L'estrazione la fa il modello
 * stesso (document/image input, Haiku), come per i materiali dell'onboarding.
 *
 * POST { documento_id }  → il cliente proprietario (o il team) subito dopo
 *                          l'upload: legge quel documento.
 * POST {}                → cron / team: legge i documenti ancora `da_fare`
 *                          (o `in_corso` da più di 10 minuti), max 5 per giro.
 * Risposta: { ok, letti, non_leggibili, errori }.
 * Gli altri formati (docx, pptx, font…) restano `non_leggibile`: Aura ne vede
 * solo nome e descrizione.
 */
import type { SupabaseClient } from "npm:@supabase/supabase-js@2";
import { streamAnthropicText } from "../_shared/anthropic.ts";
import { gestisciErrore, HttpError, json, leggiBody, preflight } from "../_shared/http.ts";
import { logError } from "../_shared/log.ts";
import { adminClient, autorizzatoCron, chiamante, esTeam } from "../_shared/supabase.ts";

const BUCKET = "kit-brand";
const MAX_BYTE = 15 * 1024 * 1024;
const MAX_TESTO = 30000;
const MAX_PER_GIRO = 5;
const SOGLIA_IN_CORSO_MS = 10 * 60 * 1000;
const MODELLO = Deno.env.get("ANTHROPIC_MODEL_VELOCE") || "claude-haiku-4-5-20251001";

const MEDIA: Record<string, string> = { pdf: "application/pdf", jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", webp: "image/webp" };

const SYSTEM = `Estrai TUTTO il testo del documento o dell'immagine che ricevi, parola per parola, nella lingua in cui è scritto, senza riassumere e senza commentare. Mantieni titoli, elenchi e tabelle (una riga per voce). È materiale di marca (brand book, linee guida, presentazione): se ci sono codici colore, nomi di font, regole d'uso del logo, tono di voce o parole da usare/evitare, riportali esattamente. Se non c'è testo leggibile, scrivi "(nessun testo leggibile)". Restituisci solo il testo estratto.`;

interface Documento {
  id: string;
  cliente_id: string;
  nome: string;
  dimensione: number;
  storage_path: string;
  estrazione_stato: string;
  created_at: string;
}

function estensione(path: string): string {
  const punto = path.lastIndexOf(".");
  return punto >= 0 ? path.slice(punto + 1).toLowerCase() : "";
}

function base64(bytes: Uint8Array): string {
  let s = "";
  const passo = 0x8000;
  for (let i = 0; i < bytes.length; i += passo) s += String.fromCharCode(...bytes.subarray(i, i + passo));
  return btoa(s);
}

/** Prende in carico il documento (update condizionale: due chiamate insieme non lo leggono due volte). */
async function prendiInCarico(admin: SupabaseClient, d: Documento): Promise<boolean> {
  const { data, error } = await admin
    .from("kit_brand_documenti")
    .update({ estrazione_stato: "in_corso" })
    .eq("id", d.id)
    .eq("estrazione_stato", d.estrazione_stato)
    .select("id");
  if (error) throw error;
  return (data ?? []).length > 0;
}

type Esito = "letto" | "non_leggibile" | "errore";

async function leggiUno(admin: SupabaseClient, d: Documento): Promise<Esito> {
  const media = MEDIA[estensione(d.storage_path)];
  if (!media || d.dimensione > MAX_BYTE) {
    await admin.from("kit_brand_documenti").update({ estrazione_stato: "non_leggibile", testo_estratto: null }).eq("id", d.id);
    return "non_leggibile";
  }
  if (!(await prendiInCarico(admin, d))) return "errore";
  try {
    const { data: blob, error } = await admin.storage.from(BUCKET).download(d.storage_path);
    if (error || !blob) throw error ?? new Error("file assente");
    const dati = base64(new Uint8Array(await blob.arrayBuffer()));
    const blocco =
      media === "application/pdf"
        ? { type: "document", source: { type: "base64", media_type: media, data: dati }, title: d.nome }
        : { type: "image", source: { type: "base64", media_type: media, data: dati } };
    const testo = await streamAnthropicText({
      system: SYSTEM,
      user: [blocco, { type: "text", text: `File: ${d.nome}. Estrai tutto il testo.` }],
      maxTokens: 8000,
      tag: "kit-brand-leggi",
      model: MODELLO,
      utente: d.cliente_id,
      timeoutMs: 110_000,
    });
    if (!testo) throw new Error("nessun testo dal modello");
    const pulito = testo.trim();
    const leggibile = pulito.length > 0 && !/^\(nessun testo leggibile\)$/i.test(pulito);
    await admin
      .from("kit_brand_documenti")
      .update({ estrazione_stato: leggibile ? "fatta" : "non_leggibile", testo_estratto: leggibile ? pulito.slice(0, MAX_TESTO) : null })
      .eq("id", d.id);
    return leggibile ? "letto" : "non_leggibile";
  } catch (err) {
    await logError("kit-brand-leggi", err, { documento: d.id, cliente: d.cliente_id }, { silent: true });
    await admin.from("kit_brand_documenti").update({ estrazione_stato: "errore" }).eq("id", d.id);
    return "errore";
  }
}

const COLONNE = "id, cliente_id, nome, dimensione, storage_path, estrazione_stato, created_at";

Deno.serve(async (req) => {
  const pre = preflight(req);
  if (pre) return pre;
  try {
    const body = await leggiBody<{ documento_id?: string }>(req);
    const admin = adminClient();
    let daLeggere: Documento[] = [];

    if (typeof body.documento_id === "string" && body.documento_id) {
      const c = await chiamante(req);
      if (!c) throw new HttpError(401, "Accesso non autorizzato.");
      const { data, error } = await admin.from("kit_brand_documenti").select(COLONNE).eq("id", body.documento_id).maybeSingle();
      if (error) throw error;
      const d = data as Documento | null;
      if (!d || (d.cliente_id !== c.id && !esTeam(c.rol))) throw new HttpError(404, "Documento non trovato.");
      if (d.estrazione_stato !== "fatta") daLeggere = [d];
    } else {
      const c = autorizzatoCron(req) ? null : await chiamante(req);
      if (!autorizzatoCron(req) && (!c || !esTeam(c.rol))) throw new HttpError(403, "Riservato al team.");
      const soglia = new Date(Date.now() - SOGLIA_IN_CORSO_MS).toISOString();
      const { data, error } = await admin
        .from("kit_brand_documenti")
        .select(COLONNE)
        .or(`estrazione_stato.eq.da_fare,and(estrazione_stato.eq.in_corso,created_at.lt.${soglia})`)
        .order("created_at")
        .limit(MAX_PER_GIRO);
      if (error) throw error;
      daLeggere = (data ?? []) as Documento[];
    }

    const esiti = await Promise.all(daLeggere.map((d) => leggiUno(admin, d)));
    return json({
      ok: true,
      letti: esiti.filter((e) => e === "letto").length,
      non_leggibili: esiti.filter((e) => e === "non_leggibile").length,
      errori: esiti.filter((e) => e === "errore").length,
    });
  } catch (err) {
    return gestisciErrore(err);
  }
});
