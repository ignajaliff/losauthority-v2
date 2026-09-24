// Passi 5-8 · analisi, note_clienti, chiamate + chiamate_azioni, fathom_webhook_log.
import { leggiTutto, scriviBlocchi, testo } from "./comune.mjs";

function clienteMappato(ctx, idVecchio) {
  if (!idVecchio) return null;
  const nuovoId = ctx.idNuovo(idVecchio);
  return nuovoId && ctx.ruoli.get(idVecchio) === "cliente" ? nuovoId : null;
}

export async function migraAnalisi(ctx) {
  const vecchie = await leggiTutto(ctx.old, "client_analyses");
  ctx.report.conta("analisi", "vecchio", vecchie.length);
  const righe = [];
  for (const a of vecchie) {
    const clienteId = clienteMappato(ctx, a.client_id);
    if (!clienteId) {
      ctx.report.salta("analisi", a.client_id, "cliente non migrato");
      continue;
    }
    const contenuto = testo(a.content);
    if (!contenuto) {
      ctx.report.salta("analisi", a.client_id, "contenuto vuoto");
      continue;
    }
    righe.push({ cliente_id: clienteId, contenuto, generato_il: a.generated_at ?? a.updated_at ?? new Date().toISOString() });
  }
  await scriviBlocchi(ctx, "analisi", righe, { onConflict: "cliente_id", idDi: (r) => r.cliente_id });
}

export async function migraNote(ctx) {
  const vecchie = await leggiTutto(ctx.old, "client_notes");
  ctx.report.conta("note_clienti", "vecchio", vecchie.length);
  const righe = [];
  for (const n of vecchie) {
    const clienteId = clienteMappato(ctx, n.client_id);
    if (!clienteId) {
      ctx.report.salta("note_clienti", n.id, "cliente non migrato");
      continue;
    }
    const corpo = testo(n.body);
    if (!corpo) {
      ctx.report.salta("note_clienti", n.id, "testo vuoto");
      continue;
    }
    if (corpo.length > 5000) ctx.report.nota(`Nota ${n.id} troncata a 5000 caratteri`);
    righe.push({ id: n.id, cliente_id: clienteId, autore_id: null, testo: corpo.slice(0, 5000), created_at: n.created_at });
  }
  await scriviBlocchi(ctx, "note_clienti", righe);
}

export async function migraChiamate(ctx) {
  const vecchie = await leggiTutto(ctx.old, "client_calls");
  ctx.report.conta("chiamate", "vecchio", vecchie.length);
  const righe = [];
  const azioniPer = new Map();
  for (const c of vecchie) {
    const clienteId = clienteMappato(ctx, c.client_id);
    if (c.client_id && !clienteId) ctx.report.nota(`Chiamata ${c.id}: cliente ${c.client_id} non migrato → lasciata non assegnata`);
    righe.push({
      id: c.id,
      cliente_id: clienteId,
      fathom_recording_id: testo(c.fathom_recording_id),
      titolo: testo(c.title),
      registrata_il: c.recorded_at ?? null,
      share_url: testo(c.share_url),
      riassunto: testo(c.summary),
      created_at: c.created_at,
    });
    azioniPer.set(c.id, azioniDa(ctx, c));
  }
  await scriviBlocchi(ctx, "chiamate", righe);

  const totale = [...azioniPer.values()].reduce((n, a) => n + a.length, 0);
  ctx.report.conta("chiamate_azioni", "vecchio", totale);
  if (!ctx.esegui) {
    ctx.report.conta("chiamate_azioni", "nuovo", totale);
    return;
  }
  const presenti = new Set((await leggiTutto(ctx.nuovo, "chiamate", { select: "id" })).map((c) => c.id));
  for (const [chiamataId, azioni] of azioniPer) {
    if (!presenti.has(chiamataId)) {
      if (azioni.length) ctx.report.salta("chiamate_azioni", chiamataId, "chiamata non presente nel nuovo");
      continue;
    }
    const { error } = await ctx.nuovo.from("chiamate_azioni").delete().eq("chiamata_id", chiamataId);
    if (error) {
      ctx.report.salta("chiamate_azioni", chiamataId, `pulizia azioni: ${error.message}`);
      continue;
    }
    await scriviBlocchi(ctx, "chiamate_azioni", azioni.map((a) => ({ ...a, chiamata_id: chiamataId })), {
      modo: "insert",
      idDi: (a) => `${chiamataId}/${a.ordine}`,
    });
  }
}

/** action_items: array di stringhe o di oggetti {text|description}; qualsiasi altra forma → segnalata. */
function azioniDa(ctx, chiamata) {
  const items = chiamata.action_items;
  if (items === null || items === undefined) return [];
  if (!Array.isArray(items)) {
    ctx.report.nota(`Chiamata ${chiamata.id}: action_items non è un array → ignorato`);
    return [];
  }
  const azioni = [];
  for (const el of items) {
    let t = null;
    if (typeof el === "string") t = el;
    else if (el && typeof el === "object") t = el.text ?? el.description ?? el.title ?? null;
    if (t === null && el && typeof el === "object") {
      ctx.report.nota(`Chiamata ${chiamata.id}: action item senza text/description → salvato come JSON`);
      t = JSON.stringify(el);
    }
    const valore = testo(t);
    if (valore) azioni.push({ testo: valore, ordine: azioni.length, completata: Boolean(el?.completed ?? el?.done ?? false) });
  }
  return azioni;
}

export async function migraFathomLog(ctx) {
  const vecchi = await leggiTutto(ctx.old, "fathom_webhook_log", { ordine: { colonna: "received_at", ascendente: true } });
  ctx.report.conta("fathom_webhook_log", "vecchio", vecchi.length);
  const chiave = (r) => `${r.received_at}|${r.matched_email ?? ""}`;
  const presenti = ctx.esegui
    ? new Set((await leggiTutto(ctx.nuovo, "fathom_webhook_log", { select: "received_at, matched_email" })).map(chiave))
    : new Set();
  const righe = vecchi
    .filter((r) => !presenti.has(chiave(r)))
    .map((r) => ({ received_at: r.received_at, payload: r.payload ?? null, emails: r.emails ?? null, matched_email: r.matched_email ?? null }));
  if (vecchi.length - righe.length) ctx.report.nota(`fathom_webhook_log: ${vecchi.length - righe.length} righe già presenti nel nuovo`);
  await scriviBlocchi(ctx, "fathom_webhook_log", righe, { modo: "insert", idDi: (r) => r.received_at });
}
