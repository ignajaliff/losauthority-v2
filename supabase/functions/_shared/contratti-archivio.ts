/**
 * Lato server del modulo contratti, comune alla pagina pubblica
 * (`contratto-pubblico`) e al gestionale (`contratti-admin`): lettura della
 * riga, composizione del testo dai dati salvati, PDF archiviato nel bucket
 * privato `contratti` e rigenerato identico se manca.
 * La logica pura (testi, validazione, PDF) sta in ./contratti/*.ts.
 */
import type { SupabaseClient } from "npm:@supabase/supabase-js@2";
import { logError } from "./log.ts";
import { componiContratto } from "./contratti/componi.ts";
import { sha256Hex, testoInChiaro } from "./contratti/documento.ts";
import { pdfContratto } from "./contratti/pdf-contratto.ts";
import { STATI_FIRMATI, type DatiCliente, type DocumentoContratto, type Firma, type StatoContratto, type TipoCliente } from "./contratti/tipi.ts";

export const BUCKET_CONTRATTI = "contratti";

/** Riga della tabella `contratti` (nomi delle colonne della v2). */
export interface RigaContratto {
  id: string;
  created_at: string;
  creato_da: string | null;
  token: string;
  stato: StatoContratto;
  note: string | null;
  offerta_id: string | null;
  offerta_nome: string | null;
  modello_contratto: string;
  programma: string;
  prezzo: number;
  durata_mesi: number;
  firma_fornitore: Firma | null;
  tipo: TipoCliente | null;
  dati: Partial<DatiCliente>;
  cliente_nome: string | null;
  cliente_email: string | null;
  aperto_il: string | null;
  informativa_letta_il: string | null;
  compilato_il: string | null;
  firmato_il: string | null;
  firma_ip: string | null;
  firma_user_agent: string | null;
  modello: string | null;
  documento: DocumentoContratto | null;
  testo_sha256: string | null;
  firma_contratto: Firma | null;
  firma_clausole: Firma | null;
  pdf_path: string | null;
  pdf_sha256: string | null;
  pagato_il: string | null;
  fattura_id: string | null;
  cliente_id: string | null;
  attivato_il: string | null;
  attivazione_consegne: string[];
  scade_il: string | null;
  recesso_fino_al: string | null;
  annullato_il: string | null;
}

/** numeric arriva come stringa: nel codice il prezzo è sempre un numero. */
export function normalizzaRiga(row: Record<string, unknown>): RigaContratto {
  return { ...(row as unknown as RigaContratto), prezzo: Number(row.prezzo) };
}

/** Un token valido è lungo e fatto solo di lettere, cifre, - e _. */
export const tokenPlausibile = (token: unknown): token is string => typeof token === "string" && /^[A-Za-z0-9_-]{30,80}$/.test(token);

export async function contrattoPerToken(admin: SupabaseClient, token: string): Promise<RigaContratto | null> {
  if (!tokenPlausibile(token)) return null;
  const { data } = await admin.from("contratti").select("*").eq("token", token).maybeSingle();
  return data ? normalizzaRiga(data as Record<string, unknown>) : null;
}

export async function contrattoPerId(admin: SupabaseClient, id: string): Promise<RigaContratto | null> {
  const { data } = await admin.from("contratti").select("*").eq("id", id).maybeSingle();
  return data ? normalizzaRiga(data as Record<string, unknown>) : null;
}

export interface ImpostazioniPubbliche {
  istruzioni_pagamento: string | null;
  telefono_fornitore: string | null;
}

export async function impostazioniPubbliche(admin: SupabaseClient): Promise<ImpostazioniPubbliche> {
  const { data } = await admin.from("contratti_impostazioni").select("istruzioni_pagamento, telefono_fornitore").maybeSingle();
  const d = (data ?? {}) as Partial<ImpostazioniPubbliche>;
  return { istruzioni_pagamento: d.istruzioni_pagamento ?? null, telefono_fornitore: d.telefono_fornitore ?? null };
}

/** Compone il contratto di una riga dai suoi dati validati e ne calcola l'impronta. */
export async function componiDaRiga(admin: SupabaseClient, row: RigaContratto, tipo: TipoCliente, dati: DatiCliente) {
  const { telefono_fornitore } = await impostazioniPubbliche(admin);
  const documento = componiContratto(tipo, dati, { prezzo: row.prezzo, telefonoFornitore: telefono_fornitore });
  return { documento, sha: await sha256Hex(testoInChiaro(documento)) };
}

/** Scrive il PDF nell'archivio privato e ne registra percorso e impronta. null se la riga non è firmata. */
export async function archiviaPdf(admin: SupabaseClient, row: RigaContratto): Promise<Uint8Array | null> {
  if (!row.documento || !row.tipo || !row.firmato_il || !row.firma_contratto || !row.firma_clausole || !row.testo_sha256) return null;
  const bytes = pdfContratto({
    id: row.id,
    documento: row.documento,
    tipo: row.tipo,
    clienteNome: row.cliente_nome ?? "Cliente",
    creatoIl: row.created_at,
    informativaLettaIl: row.informativa_letta_il,
    compilatoIl: row.compilato_il,
    firmatoIl: row.firmato_il,
    firmaContratto: row.firma_contratto,
    firmaClausole: row.firma_clausole,
    firmaFornitore: row.firma_fornitore,
    ip: row.firma_ip,
    userAgent: row.firma_user_agent,
    testoSha256: row.testo_sha256,
  });
  const path = `${row.id}/contratto.pdf`;
  const { error: upErr } = await admin.storage.from(BUCKET_CONTRATTI).upload(path, bytes, { contentType: "application/pdf", upsert: true });
  if (upErr) {
    // Il contratto resta firmato (testo, firme e prove sono nel database): il PDF si rigenera identico alla prossima richiesta.
    await logError("contratti:archiviaPdf", upErr, { id: row.id }, { silent: true });
    return bytes;
  }
  const { error: dbErr } = await admin.from("contratti").update({ pdf_path: path, pdf_sha256: await sha256Hex(bytes) }).eq("id", row.id);
  if (dbErr) await logError("contratti:archiviaPdf:db", dbErr, { id: row.id }, { silent: true });
  return bytes;
}

/** I byte del PDF firmato: dall'archivio, oppure rigenerati se l'archivio non li ha. */
export async function pdfFirmato(admin: SupabaseClient, row: RigaContratto): Promise<Uint8Array | null> {
  if (!STATI_FIRMATI.includes(row.stato)) return null;
  if (row.pdf_path) {
    const { data, error } = await admin.storage.from(BUCKET_CONTRATTI).download(row.pdf_path);
    if (!error && data) return new Uint8Array(await data.arrayBuffer());
    await logError("contratti:pdf:download", error ?? "file mancante", { id: row.id }, { silent: true });
  }
  return archiviaPdf(admin, row);
}

/** Nome del file che scarica il cliente: "Contratto-UPSCALE-Mario-Rossi.pdf". */
export function nomeFilePdf(row: Pick<RigaContratto, "cliente_nome" | "programma">): string {
  const pulito = (row.cliente_nome ?? "cliente")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^A-Za-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return `Contratto-${row.programma}-${pulito || "cliente"}.pdf`;
}

/** Risposta che fa scaricare un PDF, mai messa in cache da nessuno. */
export function rispostaPdf(bytes: Uint8Array, nomeFile: string, extraHeaders: Record<string, string> = {}): Response {
  return new Response(bytes as BodyInit, {
    status: 200,
    headers: {
      ...extraHeaders,
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${nomeFile}"`,
      "Content-Length": String(bytes.length),
      "Cache-Control": "private, no-store",
      "X-Robots-Tag": "noindex",
    },
  });
}

/** `Los-` + 12 caratteri senza quelli ambigui (stessa regola di gestione-utenti). */
export function nuovaPassword(): string {
  const alfabeto = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
  const byte = new Uint8Array(12);
  crypto.getRandomValues(byte);
  let s = "";
  for (const b of byte) s += alfabeto[b % alfabeto.length];
  return `Los-${s}`;
}
