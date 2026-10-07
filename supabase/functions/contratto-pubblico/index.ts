/**
 * contratto-pubblico — la pagina del cliente (/contratto/:token), SENZA login:
 * la chiave è il token casuale del link. verify_jwt è spento apposta.
 *   POST { token, azione: "apri" }                                   → stato dell'invito per disegnare la pagina (e segna aperto_il)
 *   POST { token, azione: "dati", tipo, dichiarazione, informativa, dati } → valida, salva, compone: { documento, sha }
 *   POST { token, azione: "firma", firma_contratto, firma_clausole, accetto, approvo, sha } → firma + PDF + avviso Telegram
 *   GET  ?token=…&pdf=1                                               → il PDF firmato come allegato
 * Il testo del contratto lo compone sempre il server (contratto-pubblico/firma.ts).
 * Contratto completo: docs/edge-functions.md.
 */
import { corsHeaders, errore, gestisciErrore, HttpError, json, preflight } from "../_shared/http.ts";
import { adminClient } from "../_shared/supabase.ts";
import { contrattoPerToken, impostazioniPubbliche, nomeFilePdf, pdfFirmato, rispostaPdf, tokenPlausibile } from "../_shared/contratti-archivio.ts";
import { STATI_APERTI, STATI_FIRMATI } from "../_shared/contratti/tipi.ts";
import { firma, salvaDati } from "./firma.ts";

/** Tetto al corpo: dati del modulo + due firme stanno in poche decine di KB. */
const MAX_BYTE = 1_000_000;

async function leggiCorpo(req: Request): Promise<Record<string, unknown> | null> {
  if (Number(req.headers.get("content-length") ?? 0) > MAX_BYTE) return null;
  try {
    const testo = await req.text();
    if (testo.length > MAX_BYTE) return null;
    const v = JSON.parse(testo) as unknown;
    return v && typeof v === "object" ? (v as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

Deno.serve(async (req: Request) => {
  const pre = preflight(req);
  if (pre) return pre;
  try {
    const admin = adminClient();

    if (req.method === "GET") {
      const url = new URL(req.url);
      const token = url.searchParams.get("token");
      if (!tokenPlausibile(token) || url.searchParams.get("pdf") !== "1") return errore("Richiesta non valida.", 400);
      const row = await contrattoPerToken(admin, token);
      if (!row) return errore("Link non valido.", 404);
      const bytes = await pdfFirmato(admin, row);
      if (!bytes) return errore("Il contratto non è ancora firmato.", 404);
      return rispostaPdf(bytes, nomeFilePdf(row), corsHeaders);
    }

    if (req.method !== "POST") return errore("Metodo non ammesso.", 405);
    const body = await leggiCorpo(req);
    if (!body) return errore("Richiesta non valida.", 400);
    const token = body.token;
    if (!tokenPlausibile(token)) return errore("Link non valido.", 404);

    if (body.azione === "apri") {
      const row = await contrattoPerToken(admin, token);
      if (!row) return errore("Link non valido.", 404);
      const aperto = STATI_APERTI.includes(row.stato);
      if (aperto && !row.aperto_il) {
        // Prima apertura: resta agli atti (e Wesley vede «Aperto» nella lista).
        await admin.from("contratti").update({ aperto_il: new Date().toISOString() }).eq("id", row.id).is("aperto_il", null);
      }
      const firmato = STATI_FIRMATI.includes(row.stato) && !!row.firmato_il;
      const imp = aperto || row.stato === "firmato" ? await impostazioniPubbliche(admin) : null;
      return json({
        ok: true,
        stato: row.stato,
        programma: row.programma,
        durata_mesi: row.durata_mesi,
        // Dati già salvati (da un «Elabora» precedente): il modulo li mostra già compilati. Mai dopo la firma.
        tipo: aperto ? row.tipo : null,
        dati: aperto && Object.keys(row.dati ?? {}).length > 0 ? row.dati : null,
        firma_fornitore: aperto ? row.firma_fornitore : null,
        firmato_il: firmato ? row.firmato_il : null,
        // A pagamento già registrato le istruzioni non servono più.
        istruzioni_pagamento: imp?.istruzioni_pagamento ?? null,
      });
    }

    if (body.azione === "dati") {
      const esito = await salvaDati(admin, token, body);
      if (!esito.ok) return json({ ok: false, error: esito.error, errori: esito.errori }, esito.status);
      return json({ ok: true, documento: esito.documento, sha: esito.sha });
    }

    if (body.azione === "firma") {
      const esito = await firma(admin, token, body, req);
      if (!esito.ok) return json({ ok: false, error: esito.error, documento: esito.documento, sha: esito.sha }, esito.status);
      return json({ ok: true, firmato_il: esito.firmato_il });
    }

    throw new HttpError(400, "Azione non riconosciuta.");
  } catch (err) {
    return gestisciErrore(err);
  }
});
