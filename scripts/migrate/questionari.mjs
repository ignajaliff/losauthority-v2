// Passo 4 · questionario_invii + questionario_risposte ← onboarding_submissions, questionnaire_submissions, onboarding_drafts.
import { intero, leggiTutto, scriviBlocchi, testo } from "./comune.mjs";

const QUESTIONARI = new Set(["onboarding", "avatar_dolori", "offerta"]);

export async function migraQuestionari(ctx) {
  const { old, report } = ctx;
  const invii = new Map(); // chiave cliente|questionario → { invio, risposte }
  const chiave = (c, q) => `${c}|${q}`;

  // 4a · onboarding_submissions (la più recente per user_id, già calcolata nel passo 3)
  const ultimi = ctx.onboardingUltimo ?? new Map();
  report.conta("questionario_invii", "vecchio", ultimi.size);
  for (const [idVecchio, s] of ultimi) {
    const clienteId = clienteValido(ctx, idVecchio, "questionario_invii", s.id);
    if (!clienteId) continue;
    invii.set(chiave(clienteId, "onboarding"), {
      invio: { cliente_id: clienteId, questionario_id: "onboarding", stato: "inviato", inviato_il: s.created_at, created_at: s.created_at },
      risposte: righeRisposte(ctx, s.answers, `onboarding_submissions ${s.id}`),
    });
  }

  // 4b · questionnaire_submissions (avatar_dolori, offerta): la più recente per coppia
  const qs = await leggiTutto(old, "questionnaire_submissions", { ordine: { colonna: "created_at", ascendente: false } });
  qs.sort((a, b) => String(b.updated_at ?? b.created_at).localeCompare(String(a.updated_at ?? a.created_at)));
  report.conta("questionario_invii", "vecchio", qs.length);
  const visti = new Set();
  for (const s of qs) {
    const coppia = `${s.user_id}|${s.questionario_id}`;
    if (visti.has(coppia)) {
      report.salta("questionario_invii", s.id, "submission più vecchia della stessa coppia");
      continue;
    }
    visti.add(coppia);
    if (!QUESTIONARI.has(s.questionario_id) || s.questionario_id === "onboarding") {
      report.salta("questionario_invii", s.id, `questionario_id "${s.questionario_id}" non gestito`);
      continue;
    }
    const clienteId = clienteValido(ctx, s.user_id, "questionario_invii", s.id);
    if (!clienteId) continue;
    const inviato = s.status === "completo";
    const quando = s.updated_at ?? s.created_at;
    invii.set(chiave(clienteId, s.questionario_id), {
      invio: {
        cliente_id: clienteId,
        questionario_id: s.questionario_id,
        stato: inviato ? "inviato" : "bozza",
        inviato_il: inviato ? quando : null,
        created_at: s.created_at,
      },
      aggiornatoIl: quando,
      risposte: righeRisposte(ctx, s.answers, `questionnaire_submissions ${s.id}`),
    });
  }

  // 4c · onboarding_drafts → bozza, solo se non esiste un invio "inviato" per quella coppia
  const bozze = await leggiTutto(old, "onboarding_drafts");
  report.conta("questionario_invii", "vecchio", bozze.length);
  const inviatiNelNuovo = ctx.esegui
    ? new Set((await leggiTutto(ctx.nuovo, "questionario_invii", { select: "cliente_id, questionario_id, stato" }))
        .filter((i) => i.stato === "inviato").map((i) => chiave(i.cliente_id, i.questionario_id)))
    : new Set();
  for (const b of bozze) {
    const idRiga = `${b.user_id}/${b.questionnaire_id}`;
    if (!QUESTIONARI.has(b.questionnaire_id)) {
      report.salta("questionario_invii", idRiga, `bozza con questionnaire_id "${b.questionnaire_id}" non gestito`);
      continue;
    }
    const clienteId = clienteValido(ctx, b.user_id, "questionario_invii", idRiga);
    if (!clienteId) continue;
    const k = chiave(clienteId, b.questionnaire_id);
    const presente = invii.get(k);
    if (presente?.invio.stato === "inviato" || inviatiNelNuovo.has(k)) {
      report.salta("questionario_invii", idRiga, "bozza ignorata: esiste già un invio inviato");
      continue;
    }
    if (presente && String(presente.aggiornatoIl ?? "") > String(b.updated_at ?? "")) {
      report.salta("questionario_invii", idRiga, "bozza più vecchia della submission in bozza");
      continue;
    }
    invii.set(k, {
      invio: {
        cliente_id: clienteId,
        questionario_id: b.questionnaire_id,
        stato: "bozza",
        schermata: testo(b.screen),
        sezione_indice: intero(b.section_index),
        inviato_il: null,
      },
      risposte: righeRisposte(ctx, b.answers, `onboarding_drafts ${idRiga}`),
    });
  }

  // Scrittura invii (upsert per coppia) e risposte (delete + insert per invio)
  const righeInvii = [...invii.values()].map((v) => ({ schermata: null, sezione_indice: null, ...v.invio }));
  await scriviBlocchi(ctx, "questionario_invii", righeInvii, {
    onConflict: "cliente_id,questionario_id",
    idDi: (r) => `${r.cliente_id}/${r.questionario_id}`,
  });
  const totaleRisposte = [...invii.values()].reduce((n, v) => n + v.risposte.length, 0);
  report.conta("questionario_risposte", "vecchio", totaleRisposte);
  if (!ctx.esegui) {
    report.conta("questionario_risposte", "nuovo", totaleRisposte);
    return;
  }
  const attuali = await leggiTutto(ctx.nuovo, "questionario_invii", { select: "id, cliente_id, questionario_id" });
  const idInvio = new Map(attuali.map((i) => [chiave(i.cliente_id, i.questionario_id), i.id]));
  for (const [k, v] of invii) {
    const invioId = idInvio.get(k);
    if (!invioId) {
      report.salta("questionario_risposte", k, "invio non trovato nel nuovo");
      continue;
    }
    const { error } = await ctx.nuovo.from("questionario_risposte").delete().eq("invio_id", invioId);
    if (error) {
      report.salta("questionario_risposte", k, `pulizia risposte: ${error.message}`);
      continue;
    }
    await scriviBlocchi(ctx, "questionario_risposte", v.risposte.map((r) => ({ ...r, invio_id: invioId })), {
      modo: "insert",
      idDi: (r) => `${k}/${r.domanda_id}/${r.ordine}`,
    });
  }
}

function clienteValido(ctx, idVecchio, tabella, idRiga) {
  if (!idVecchio) {
    ctx.report.salta(tabella, idRiga, "user_id nullo");
    return null;
  }
  const nuovoId = ctx.idNuovo(idVecchio);
  if (!nuovoId) {
    ctx.report.salta(tabella, idRiga, `utente ${idVecchio} non migrato`);
    return null;
  }
  if (ctx.ruoli.get(idVecchio) !== "cliente") {
    ctx.report.salta(tabella, idRiga, `utente ${idVecchio} non è un cliente`);
    return null;
  }
  return nuovoId;
}

/** answers jsonb → righe {domanda_id, ordine, valore}. Oggetti annidati → JSON.stringify (segnalato). */
function righeRisposte(ctx, answers, origine) {
  const righe = [];
  if (!answers || typeof answers !== "object" || Array.isArray(answers)) return righe;
  const scalare = (v, chiaveDomanda) => {
    if (v === null || v === undefined) return null;
    if (typeof v === "object") {
      ctx.report.nota(`${origine}: risposta "${chiaveDomanda}" era un oggetto → salvata come JSON`);
      return JSON.stringify(v);
    }
    const s = String(v);
    return s.trim() ? s : null;
  };
  for (const [k, v] of Object.entries(answers)) {
    const domandaId = testo(k, 80);
    if (!domandaId) continue;
    if (Array.isArray(v)) {
      let ordine = 0;
      for (const el of v) {
        const valore = scalare(el, k);
        if (valore !== null) righe.push({ domanda_id: domandaId, ordine: ordine++, valore });
      }
      continue;
    }
    const valore = scalare(v, k);
    if (valore !== null) righe.push({ domanda_id: domandaId, ordine: 0, valore });
  }
  return righe;
}
