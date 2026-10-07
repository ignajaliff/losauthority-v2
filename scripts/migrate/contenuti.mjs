// Passi 5-8 · analisi, note (client_notes → clienti.note), chiamate + chiamate_azioni, fathom_webhook_log.
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

/** "[gg/mm/aaaa] testo": le note datate del vecchio sistema diventano paragrafi di clienti.note. */
function paragrafoNota(n) {
  const giorno = n.created_at ? new Date(n.created_at).toLocaleDateString("it-IT") : null;
  const corpo = testo(n.body);
  return giorno ? `[${giorno}] ${corpo}` : corpo;
}

/**
 * client_notes → clienti.note (una sola nota per cliente, decisione 26/09/2026).
 * Deterministico e rieseguibile: nota = note di client_details + note datate in ordine.
 */
export async function migraNote(ctx) {
  const vecchie = await leggiTutto(ctx.old, "client_notes", { ordine: { colonna: "created_at", ascendente: true } });
  const dettagli = await leggiTutto(ctx.old, "client_details", { select: "id, note" });
  ctx.report.conta("clienti.note", "vecchio", vecchie.length);
  const baseDi = new Map(dettagli.map((d) => [clienteMappato(ctx, d.id), testo(d.note)]));

  const paragrafi = new Map();
  for (const n of vecchie) {
    const clienteId = clienteMappato(ctx, n.client_id);
    if (!clienteId) {
      ctx.report.salta("clienti.note", n.id, "cliente non migrato");
      continue;
    }
    if (!testo(n.body)) {
      ctx.report.salta("clienti.note", n.id, "testo vuoto");
      continue;
    }
    paragrafi.set(clienteId, [...(paragrafi.get(clienteId) ?? []), paragrafoNota(n)]);
  }

  const righe = [];
  for (const [clienteId, blocchi] of paragrafi) {
    const note = [baseDi.get(clienteId), ...blocchi].filter(Boolean).join("\n\n");
    if (note.length > 5000) ctx.report.nota(`Cliente ${clienteId}: note troncate a 5000 caratteri`);
    righe.push({ id: clienteId, note: note.slice(0, 5000) });
  }
  await scriviBlocchi(ctx, "clienti", righe, { onConflict: "id", idDi: (r) => r.id });
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
