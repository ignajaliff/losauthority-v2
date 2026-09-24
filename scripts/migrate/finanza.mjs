// Passo 9 · fatture ← invoices, spese ← expenses, f24 ← f24_forms, con copia dei file tra i bucket.
import { basename, importo, leggiTutto, scriviBlocchi, testo } from "./comune.mjs";

const MIME = { pdf: "application/pdf", jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", webp: "image/webp", heic: "image/heic" };

/** Copia un file da bucket vecchio a nuovo (download + upload). Salta se già presente. Ritorna true se il file esiste nel nuovo. */
async function copiaFile(ctx, bucketVecchio, pathVecchio, bucketNuovo, pathNuovo) {
  if (!ctx.esegui) return true;
  const cartella = pathNuovo.includes("/") ? pathNuovo.slice(0, pathNuovo.lastIndexOf("/")) : "";
  const nome = basename(pathNuovo);
  const { data: esistenti } = await ctx.nuovo.storage.from(bucketNuovo).list(cartella, { search: nome });
  if (esistenti?.some((f) => f.name === nome)) return true;
  const { data: blob, error } = await ctx.old.storage.from(bucketVecchio).download(pathVecchio);
  if (error || !blob) throw new Error(`download ${bucketVecchio}/${pathVecchio}: ${error?.message ?? "file assente"}`);
  const estensione = nome.includes(".") ? nome.split(".").pop().toLowerCase() : "";
  const contentType = blob.type && blob.type !== "application/octet-stream" ? blob.type : MIME[estensione] ?? "application/octet-stream";
  const corpo = Buffer.from(await blob.arrayBuffer());
  const { error: e2 } = await ctx.nuovo.storage.from(bucketNuovo).upload(pathNuovo, corpo, { contentType, upsert: true });
  if (e2) throw new Error(`upload ${bucketNuovo}/${pathNuovo}: ${e2.message}`);
  return true;
}

function clienteMappato(ctx, idVecchio) {
  if (!idVecchio) return null;
  const nuovoId = ctx.idNuovo(idVecchio);
  return nuovoId && ctx.ruoli.get(idVecchio) === "cliente" ? nuovoId : null;
}

export async function migraFatture(ctx) {
  const vecchie = await leggiTutto(ctx.old, "invoices");
  ctx.report.conta("fatture", "vecchio", vecchie.length);
  ctx.report.conta("file fatture", "vecchio", vecchie.filter((f) => f.pdf_path).length);
  const righe = [];
  for (const f of vecchie) {
    const clienteId = clienteMappato(ctx, f.client_id);
    if (!clienteId) {
      ctx.report.salta("fatture", f.id, `cliente ${f.client_id} non migrato`);
      continue;
    }
    let pdfPath = null;
    if (f.pdf_path) {
      const destinazione = `${clienteId}/${basename(f.pdf_path)}`;
      try {
        await copiaFile(ctx, "invoices", f.pdf_path, "fatture", destinazione);
        pdfPath = destinazione;
        ctx.report.conta("file fatture", "nuovo");
      } catch (e) {
        ctx.report.salta("file fatture", f.id, e.message);
      }
    }
    righe.push({
      id: f.id,
      cliente_id: clienteId,
      descrizione: testo(f.descrizione),
      importo: importo(f.importo),
      emessa_il: f.emessa_il ?? String(f.created_at ?? new Date().toISOString()).slice(0, 10),
      pagata: Boolean(f.pagata),
      pagata_il: f.pagata_il ?? null,
      prossimo_pagamento: f.prossimo_pagamento ?? null,
      note: testo(f.note),
      pdf_path: pdfPath,
      created_at: f.created_at,
    });
  }
  await scriviBlocchi(ctx, "fatture", righe);
}

export async function migraSpese(ctx) {
  const vecchie = await leggiTutto(ctx.old, "expenses");
  ctx.report.conta("spese", "vecchio", vecchie.length);
  ctx.report.conta("file ricevute", "vecchio", vecchie.filter((s) => s.receipt_path).length);
  const righe = [];
  for (const s of vecchie) {
    let ricevutaPath = null;
    if (s.receipt_path) {
      try {
        await copiaFile(ctx, "receipts", s.receipt_path, "ricevute", s.receipt_path);
        ricevutaPath = s.receipt_path;
        ctx.report.conta("file ricevute", "nuovo");
      } catch (e) {
        ctx.report.salta("file ricevute", s.id, e.message);
      }
    }
    const tipo = s.tipo === "fissa" || s.tipo === "variabile" ? s.tipo : "variabile";
    if (tipo !== s.tipo) ctx.report.nota(`Spesa ${s.id}: tipo "${s.tipo}" sconosciuto → variabile`);
    righe.push({
      id: s.id,
      descrizione: testo(s.descrizione, 200) ?? "Spesa",
      importo: importo(s.importo),
      tipo,
      data: s.data ?? String(s.created_at ?? new Date().toISOString()).slice(0, 10),
      attiva: s.attiva ?? true,
      ricevuta_path: ricevutaPath,
      created_at: s.created_at,
    });
  }
  await scriviBlocchi(ctx, "spese", righe);
}

export async function migraF24(ctx) {
  const vecchi = await leggiTutto(ctx.old, "f24_forms");
  ctx.report.conta("f24", "vecchio", vecchi.length);
  ctx.report.conta("file f24", "vecchio", vecchi.filter((f) => f.pdf_path).length);
  const righe = [];
  for (const f of vecchi) {
    if (!f.pdf_path) {
      ctx.report.salta("f24", f.id, "pdf_path mancante (obbligatorio nel nuovo schema)");
      continue;
    }
    try {
      await copiaFile(ctx, "f24", f.pdf_path, "f24", f.pdf_path);
      ctx.report.conta("file f24", "nuovo");
    } catch (e) {
      ctx.report.salta("file f24", f.id, e.message);
      ctx.report.salta("f24", f.id, "PDF non copiato");
      continue;
    }
    righe.push({
      id: f.id,
      descrizione: testo(f.descrizione),
      importo: f.importo === null || f.importo === undefined ? null : importo(f.importo, null),
      scadenza: f.scadenza ?? null,
      pagato: Boolean(f.pagato),
      pagato_il: f.pagato_il ?? null,
      pdf_path: f.pdf_path,
      created_at: f.created_at,
    });
  }
  await scriviBlocchi(ctx, "f24", righe);
}
