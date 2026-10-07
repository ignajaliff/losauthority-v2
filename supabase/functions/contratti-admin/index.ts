/**
 * contratti-admin — le operazioni del gestionale sul modulo contratti che hanno
 * bisogno del service role o di un controllo lato server. Il resto (offerte,
 * annullare/eliminare un invito, telefono e istruzioni) passa dalla RLS.
 *   { azione: "crea_invito", offerta_id, note? }   admin    → { ok, id, token, offerta, programma }
 *   { azione: "salva_firma", firma }               admin    → { ok }   (valida la forma del tratto)
 *   { azione: "segna_pagato", id, pagato_il? }      finance  → { ok, cliente_id, fattura_id }
 *   { azione: "attiva", id, consegne: string[] }    finance  → { ok, cliente_id, email, password?, nome, scade_il, recesso_fino_al }
 *   { azione: "pdf", id }                           finance  → { ok, url, nome_file }  (URL firmato 60 s, PDF rigenerato se manca)
 * Contratto completo: docs/edge-functions.md.
 */
import { errore, gestisciErrore, HttpError, json, leggiBody, preflight } from "../_shared/http.ts";
import { adminClient, type Chiamante, richiediFinance } from "../_shared/supabase.ts";
import { logError } from "../_shared/log.ts";
import { archiviaPdf, BUCKET_CONTRATTI, contrattoPerId, nomeFilePdf } from "../_shared/contratti-archivio.ts";
import { MODELLI_CONTRATTO, modelloValido } from "../_shared/contratti/modelli.ts";
import { STATI_FIRMATI } from "../_shared/contratti/tipi.ts";
import { validaFirma } from "../_shared/contratti/validazione.ts";
import { attivaProgramma, registraPagamento } from "./operazioni.ts";

type Body = { azione?: unknown; offerta_id?: unknown; note?: unknown; firma?: unknown; id?: unknown; pagato_il?: unknown; consegne?: unknown };

function richiediAdmin(c: Chiamante): void {
  if (c.rol !== "admin") throw new HttpError(403, "Solo l'admin può fare questa operazione.");
}

const idValido = (v: unknown): string => {
  if (typeof v !== "string" || !/^[0-9a-f-]{36}$/.test(v)) throw new HttpError(400, "Contratto non valido.");
  return v;
};

/** Token del link: 32 byte casuali in base64url, impossibile da indovinare. */
function nuovoToken(): string {
  const b = new Uint8Array(32);
  crypto.getRandomValues(b);
  let s = "";
  for (const x of b) s += String.fromCharCode(x);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/** L'invito si crea scegliendo un'offerta: i dati li inserisce poi il cliente. Offerta, prezzo e firma di Wesley si fissano ORA. */
async function creaInvito(body: Body, c: Chiamante): Promise<Response> {
  richiediAdmin(c);
  const offertaId = typeof body.offerta_id === "string" ? body.offerta_id : "";
  const note = typeof body.note === "string" ? body.note.trim().slice(0, 1000) || null : null;
  if (!offertaId) throw new HttpError(400, "Scegli un'offerta.");
  const admin = adminClient();
  const { data: offerta } = await admin.from("offerte").select("id, nome, modello, prezzo, attiva").eq("id", offertaId).maybeSingle();
  const o = offerta as { id: string; nome: string; modello: string; prezzo: string | number; attiva: boolean } | null;
  if (!o || !o.attiva) throw new HttpError(404, "Offerta non trovata o non più attiva.");
  if (!modelloValido(o.modello)) throw new HttpError(409, "Questa offerta usa un contratto che non esiste più.");
  const modello = MODELLI_CONTRATTO[o.modello];
  const { data: imp } = await admin.from("contratti_impostazioni").select("firma").maybeSingle();

  const token = nuovoToken();
  const { data, error } = await admin
    .from("contratti")
    .insert({
      token,
      creato_da: c.id,
      note,
      offerta_id: o.id,
      offerta_nome: o.nome,
      modello_contratto: o.modello,
      programma: modello.programma,
      durata_mesi: modello.durataMesi,
      prezzo: Number(o.prezzo),
      firma_fornitore: (imp as { firma?: unknown } | null)?.firma ?? null,
    })
    .select("id")
    .single();
  if (error || !data) {
    await logError("contratti:creaInvito", error ?? "nessuna riga", { offerta: o.id });
    throw new HttpError(500, "Non sono riuscito a creare l'invito. Riprova.");
  }
  return json({ ok: true, id: (data as { id: string }).id, token, offerta: o.nome, programma: modello.programma });
}

/** La firma di Wesley, tracciata una volta: finisce su ogni nuovo invito. */
async function salvaFirma(body: Body, c: Chiamante): Promise<Response> {
  richiediAdmin(c);
  const firma = validaFirma(body.firma);
  if (!firma) throw new HttpError(400, "Traccia la tua firma nel riquadro prima di salvare.");
  const { error } = await adminClient().from("contratti_impostazioni").update({ firma, firma_salvata_il: new Date().toISOString() }).eq("id", true);
  if (error) {
    await logError("contratti:salvaFirma", error, {});
    throw new HttpError(500, "Non sono riuscito a salvare la firma. Riprova.");
  }
  return json({ ok: true });
}

/** Il PDF del contratto firmato: URL firmato di 60 secondi (il bucket è privato, senza policy). */
async function pdf(body: Body): Promise<Response> {
  const id = idValido(body.id);
  const admin = adminClient();
  let row = await contrattoPerId(admin, id);
  if (!row) throw new HttpError(404, "Contratto non trovato.");
  if (!STATI_FIRMATI.includes(row.stato)) throw new HttpError(409, "Il contratto non è ancora firmato.");
  if (!row.pdf_path) {
    const bytes = await archiviaPdf(admin, row);
    if (!bytes) throw new HttpError(409, "Il contratto non ha tutto quello che serve per il PDF.");
    row = (await contrattoPerId(admin, id)) ?? row;
    if (!row.pdf_path) throw new HttpError(500, "Non sono riuscito ad archiviare il PDF. Riprova.");
  }
  const { data, error } = await admin.storage.from(BUCKET_CONTRATTI).createSignedUrl(row.pdf_path, 60, { download: nomeFilePdf(row) });
  if (error || !data?.signedUrl) {
    await logError("contratti:pdf:url", error ?? "nessun url", { id }, { silent: true });
    throw new HttpError(500, "Non sono riuscito a preparare il PDF. Riprova.");
  }
  return json({ ok: true, url: data.signedUrl, nome_file: nomeFilePdf(row) });
}

Deno.serve(async (req: Request) => {
  const pre = preflight(req);
  if (pre) return pre;
  try {
    const c = await richiediFinance(req);
    const body = await leggiBody<Body>(req);
    switch (body.azione) {
      case "crea_invito":
        return await creaInvito(body, c);
      case "salva_firma":
        return await salvaFirma(body, c);
      case "segna_pagato":
        return json({ ok: true, ...(await registraPagamento(adminClient(), idValido(body.id), body.pagato_il)) });
      case "attiva":
        return json({ ok: true, ...(await attivaProgramma(adminClient(), idValido(body.id), body.consegne)) });
      case "pdf":
        return await pdf(body);
      default:
        return errore("Azione non riconosciuta.", 400);
    }
  } catch (err) {
    return gestisciErrore(err);
  }
});
