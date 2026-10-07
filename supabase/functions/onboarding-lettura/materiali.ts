/**
 * Blocco G: il testo dei file caricati (PDF e immagini) va in
 * `materiali_testo`, così Claude lo legge insieme al resto del profilo e
 * l'agente offerta lo ritrova. Lo estrae il modello stesso (document/image
 * input): niente librerie. Gli altri formati restano a disposizione di Wesley.
 */
import type { SupabaseClient } from "npm:@supabase/supabase-js@2";
import { streamAnthropicText } from "../_shared/anthropic.ts";
import { logError } from "../_shared/log.ts";

const BUCKET = "materiali";
const MAX_FILE = 5;
const MAX_BYTE_FILE = 15 * 1024 * 1024;
const MAX_TESTO = 60000;
const MODELLO_ESTRAZIONE = Deno.env.get("ANTHROPIC_MODEL_VELOCE") || "claude-haiku-4-5-20251001";

const MEDIA: Record<string, string> = {
  pdf: "application/pdf",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
};

interface FileRiga {
  nome: string;
  dimensione: number;
  storage_path: string;
}

function base64(bytes: Uint8Array): string {
  let s = "";
  const passo = 0x8000;
  for (let i = 0; i < bytes.length; i += passo) s += String.fromCharCode(...bytes.subarray(i, i + passo));
  return btoa(s);
}

function estensione(path: string): string {
  const punto = path.lastIndexOf(".");
  return punto >= 0 ? path.slice(punto + 1).toLowerCase() : "";
}

const SYSTEM = `Estrai TUTTO il testo del documento o dell'immagine che ricevi, in italiano se è in italiano, parola per parola, senza riassumere e senza commentare. Mantieni titoli, elenchi, prezzi e tabelle (una riga per voce). Se è un listino o una presentazione dell'offerta, i prezzi e cosa comprendono sono la parte più importante. Se non c'è testo leggibile, scrivi "(nessun testo leggibile)". Restituisci solo il testo estratto.`;

/**
 * Testo estratto dai file del cliente (max 5, PDF e immagini, 15 MB l'uno).
 * null se non c'è nulla da leggere. Un file che fallisce non blocca gli altri.
 */
export async function estraiMateriali(admin: SupabaseClient, clienteId: string): Promise<string | null> {
  const { data, error } = await admin.from("files_onboarding").select("nome, dimensione, storage_path").eq("onboarding_id", clienteId).order("created_at");
  if (error) {
    await logError("onboarding-lettura:materiali:lista", error, { cliente: clienteId }, { silent: true });
    return null;
  }
  const leggibili = ((data ?? []) as FileRiga[]).filter((f) => MEDIA[estensione(f.storage_path)] && f.dimensione <= MAX_BYTE_FILE).slice(0, MAX_FILE);
  if (leggibili.length === 0) return null;

  // In parallelo: due PDF lunghi uno dopo l'altro (~2 minuti) non lasciavano tempo alla lettura
  // dentro i 150 s della funzione (prova del 07/10/2026). L'ordine dei file resta quello di caricamento.
  const testi = await Promise.all(leggibili.map((f) => estraiUno(admin, clienteId, f)));
  const pezzi = leggibili.flatMap((f, i) => (testi[i] ? [`### ${f.nome}\n${testi[i]}`] : []));
  if (pezzi.length === 0) return null;
  return pezzi.join("\n\n").slice(0, MAX_TESTO);
}

async function estraiUno(admin: SupabaseClient, clienteId: string, f: FileRiga): Promise<string | null> {
  const media = MEDIA[estensione(f.storage_path)];
  const { data: blob, error } = await admin.storage.from(BUCKET).download(f.storage_path);
  if (error || !blob) {
    await logError("onboarding-lettura:materiali:download", error ?? "file assente", { cliente: clienteId, file: f.storage_path }, { silent: true });
    return null;
  }
  const bytes = new Uint8Array(await blob.arrayBuffer());
  const dati = base64(bytes);
  const blocco =
    media === "application/pdf"
      ? { type: "document", source: { type: "base64", media_type: media, data: dati }, title: f.nome }
      : { type: "image", source: { type: "base64", media_type: media, data: dati } };
  const testo = await streamAnthropicText({
    system: SYSTEM,
    user: [blocco, { type: "text", text: `File: ${f.nome}. Estrai tutto il testo.` }],
    maxTokens: 6000,
    tag: "onboarding-lettura:materiali",
    model: MODELLO_ESTRAZIONE,
    utente: clienteId,
  });
  if (!testo) await logError("onboarding-lettura:materiali:modello", "nessun testo", { cliente: clienteId, file: f.nome }, { silent: true });
  return testo;
}
