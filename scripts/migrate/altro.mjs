// Passo 10 · lead ← leads, error_log ← error_log (ultime 200).
import { importo, leggiTutto, scriviBlocchi, testo } from "./comune.mjs";

const STAGE = new Set(["nuovo", "contattato", "call_fissata", "proposta", "cliente", "perso"]);
const FONTI = new Set(["Instagram", "TikTok", "Referral", "Landing", "WhatsApp", "Email", "Evento", "Altro"]);

export async function migraLead(ctx) {
  const vecchi = await leggiTutto(ctx.old, "leads");
  ctx.report.conta("lead", "vecchio", vecchi.length);
  const righe = [];
  for (const l of vecchi) {
    const nome = testo(l.nome, 120);
    if (!nome) {
      ctx.report.salta("lead", l.id, "nome vuoto");
      continue;
    }
    let stage = l.stage ?? "nuovo";
    if (!STAGE.has(stage)) {
      ctx.report.nota(`Lead ${l.id}: stage "${stage}" sconosciuto → nuovo`);
      stage = "nuovo";
    }
    let fonte = testo(l.fonte);
    if (fonte && !FONTI.has(fonte)) {
      ctx.report.nota(`Lead ${l.id}: fonte "${fonte}" non ammessa → Altro`);
      fonte = "Altro";
    }
    righe.push({
      id: l.id,
      nome,
      contatto: testo(l.contatto),
      fonte,
      stage,
      valore: importo(l.valore),
      note: testo(l.note),
      prossima_azione: testo(l.prossima_azione),
      prossima_azione_il: l.prossima_azione_il ?? null,
      created_at: l.created_at,
      updated_at: l.updated_at ?? l.created_at,
    });
  }
  await scriviBlocchi(ctx, "lead", righe);
}

export async function migraErrorLog(ctx) {
  const { data, error } = await ctx.old
    .from("error_log")
    .select("created_at, scope, message, context")
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) throw new Error(`lettura error_log: ${error.message}`);
  const vecchi = [...data].reverse();
  ctx.report.conta("error_log", "vecchio", vecchi.length);
  const chiave = (r) => `${r.created_at}|${r.scope}|${r.message}`;
  const presenti = ctx.esegui
    ? new Set((await leggiTutto(ctx.nuovo, "error_log", { select: "created_at, scope, message" })).map(chiave))
    : new Set();
  const righe = [];
  for (const r of vecchi) {
    if (presenti.has(chiave(r))) continue;
    const scope = testo(r.scope) ?? "sconosciuto";
    const message = testo(r.message) ?? "(vuoto)";
    righe.push({ created_at: r.created_at, scope, message, context: r.context ?? null });
  }
  if (vecchi.length - righe.length) ctx.report.nota(`error_log: ${vecchi.length - righe.length} righe già presenti nel nuovo`);
  await scriviBlocchi(ctx, "error_log", righe, { modo: "insert", idDi: (r) => `${r.created_at} ${r.scope}` });
}
