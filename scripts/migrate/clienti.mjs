// Passi 2-3 · tags + clienti_tags ← client_tags/client_details.tags; clienti ← client_details + onboarding_submissions.
import { intero, leggiTutto, scriviBlocchi, testo } from "./comune.mjs";

const FASI = new Set(["onboarding", "call_1", "call_2", "call_3", "call_4", "completato"]);
const STATI = new Set(["nuovo", "in_lavorazione", "completato", "hub_creato", "fuori_target"]);
const SORGENTI = new Set(["calendar", "manuale"]);

export async function migraTag(ctx) {
  const { old, report } = ctx;
  const vecchi = await leggiTutto(old, "client_tags");
  report.conta("tags", "vecchio", vecchi.length);
  const righe = [];
  for (const t of vecchi) {
    const label = testo(t.label, 60);
    if (!label) report.salta("tags", t.id, "label vuota");
    else righe.push({ label });
  }
  await creaTagMancanti(ctx, righe.map((r) => r.label), "tags");
}

/** Crea (on conflict do nothing) i tag mancanti e ricarica la mappa label → id. */
async function creaTagMancanti(ctx, labels, tabellaConteggio) {
  const uniche = [...new Set(labels.map((l) => l.toLowerCase()))];
  const righe = uniche.filter((l) => !ctx.tagPerLabel.has(l)).map((l) => labels.find((x) => x.toLowerCase() === l)).map((label) => ({ label }));
  if (tabellaConteggio) {
    await scriviBlocchi(ctx, "tags", righe, { onConflict: "label", ignoreDuplicates: true, idDi: (r) => r.label });
  } else if (righe.length) {
    ctx.report.nota(`Tag creati perché usati dai clienti ma assenti in client_tags: ${righe.map((r) => r.label).join(", ")}`);
    await scriviBlocchi(ctx, "tags", righe, { onConflict: "label", ignoreDuplicates: true, idDi: (r) => r.label });
  }
  if (ctx.esegui) {
    const attuali = await leggiTutto(ctx.nuovo, "tags", { select: "id, label" });
    for (const t of attuali) ctx.tagPerLabel.set(t.label.toLowerCase(), t.id);
  } else {
    for (const r of righe) ctx.tagPerLabel.set(r.label.toLowerCase(), `nuovo:${r.label}`);
  }
}

export async function migraClienti(ctx) {
  const { old, report } = ctx;
  const dettagli = await leggiTutto(old, "client_details");
  const invii = await leggiTutto(old, "onboarding_submissions", { ordine: { colonna: "created_at", ascendente: false } });
  const ultimoPer = new Map();
  for (const s of invii) if (s.user_id && !ultimoPer.has(s.user_id)) ultimoPer.set(s.user_id, s);
  ctx.onboardingUltimo = ultimoPer;

  const idVecchi = new Set([...dettagli.map((d) => d.id), ...ultimoPer.keys()]);
  const dettaglioPer = new Map(dettagli.map((d) => [d.id, d]));
  report.conta("clienti", "vecchio", idVecchi.size);
  report.conta("clienti_tags", "vecchio", dettagli.reduce((n, d) => n + (Array.isArray(d.tags) ? d.tags.length : 0), 0));

  const righeClienti = [];
  const labelUsate = [];
  const tagPerCliente = [];
  for (const idVecchio of idVecchi) {
    const nuovoId = ctx.idNuovo(idVecchio);
    if (!nuovoId) {
      report.salta("clienti", idVecchio, "utente non migrato");
      continue;
    }
    if (ctx.ruoli.get(idVecchio) !== "cliente") {
      report.salta("clienti", idVecchio, `ruolo ${ctx.ruoli.get(idVecchio)}: non è un cliente`);
      continue;
    }
    const d = dettaglioPer.get(idVecchio) ?? {};
    const s = ultimoPer.get(idVecchio);
    righeClienti.push(rigaCliente(ctx, nuovoId, idVecchio, d, s));
    for (const label of Array.isArray(d.tags) ? d.tags : []) {
      const l = testo(label, 60);
      if (!l) continue;
      labelUsate.push(l);
      tagPerCliente.push({ nuovoId, label: l });
    }
  }
  await scriviBlocchi(ctx, "clienti", righeClienti);

  await creaTagMancanti(ctx, labelUsate, null);
  const righeTag = [];
  for (const { nuovoId, label } of tagPerCliente) {
    const tagId = ctx.tagPerLabel.get(label.toLowerCase());
    if (!tagId) report.salta("clienti_tags", `${nuovoId}/${label}`, "tag non trovato");
    else righeTag.push({ cliente_id: nuovoId, tag_id: tagId });
  }
  await scriviBlocchi(ctx, "clienti_tags", righeTag, {
    onConflict: "cliente_id,tag_id",
    ignoreDuplicates: true,
    idDi: (r) => `${r.cliente_id}/${r.tag_id}`,
  });
}

function rigaCliente(ctx, nuovoId, idVecchio, d, s) {
  const { report } = ctx;
  let fase = d.fase ?? "onboarding";
  if (!FASI.has(fase)) {
    report.nota(`Cliente ${idVecchio}: fase "${fase}" sconosciuta → onboarding`);
    fase = "onboarding";
  }
  let stato = s?.status ?? "nuovo";
  if (!STATI.has(stato)) {
    report.nota(`Cliente ${idVecchio}: stato onboarding "${stato}" sconosciuto → nuovo`);
    stato = "nuovo";
  }
  const oreOperative = intero(s?.ore_operative);
  if (s?.ore_operative != null && oreOperative === null) {
    report.nota(`Cliente ${idVecchio}: ore_operative "${s.ore_operative}" non intero → null`);
  }
  const aggiornatoIl = s?.updated_at ?? s?.created_at ?? null;
  return {
    id: nuovoId,
    fase,
    stato_onboarding: stato,
    onboarding_completato_il: stato === "completato" || stato === "hub_creato" ? s?.created_at ?? null : null,
    hub_creato_il: stato === "hub_creato" ? aggiornatoIl : null,
    data_inizio: d.data_inizio ?? null,
    prossima_call: d.prossima_call ?? null,
    prossima_call_source: SORGENTI.has(d.prossima_call_source) ? d.prossima_call_source : null,
    telefono: testo(d.telefono),
    instagram: testo(d.instagram),
    tiktok: testo(d.tiktok),
    note: testo(d.note),
    profilo: testo(s?.profilo),
    ore_operative: oreOperative,
    notion_hub_url: testo(s?.notion_hub_url),
  };
}
