// Passo 4 · data_onboarding ← onboarding_submissions (inviati) + onboarding_drafts (bozze).
// Una riga per cliente, una colonna per domanda; le risposte multi-valore in jsonb.
// Avatar & Dolori e Offerta (questionnaire_submissions) NON si migrano: sono uscite dal sistema.
import { intero, leggiTutto, scriviBlocchi, testo } from "./comune.mjs";

/** Colonne di data_onboarding per tipo: testo libero, menu (con vocabolario), ore (integer), liste (jsonb). */
const COLONNE_TESTO = [
  "business_descrizione", "offerta_attuale", "vendita_processo",
  "cliente_migliore", "anti_cliente", "messaggi_tipici",
  "auto_diagnosi", "follower_e_views", "contenuti_top", "comfort_camera", "tentativi_passati", "riferimenti",
  "attivita_odiata", "strumenti_ia",
  "obiettivo_6_mesi", "competenza_desiderata", "cosa_evitare", "perche_adesso", "disponibilita",
];
const COLONNE_MENU = {
  fatturato_mensile: ["<1k", "1-3k", "3-5k", "5-10k", "10k+"],
  dove_si_blocca: ["poche_views", "no_dm", "no_acquisti", "clienti_sbagliati"],
  dispositivo: ["mac", "windows", "telefono"],
};
const COLONNE_ORE = ["ore_idee", "ore_scrittura", "ore_riprese", "ore_editing", "ore_pubblicazione", "ore_dm", "ore_clienti", "ore_admin"];
const COLONNE_LISTA = ["provenienza_clienti", "profili_social", "abbonamenti"];
const SCHERMATE = new Set(["benvenuto", "sezione"]);

export async function migraOnboarding(ctx) {
  const { old, report } = ctx;
  const righe = new Map(); // id cliente nuovo → riga data_onboarding

  // 4a · onboarding_submissions: la più recente per user_id (già calcolata nel passo 3) → inviato
  const ultimi = ctx.onboardingUltimo ?? new Map();
  report.conta("data_onboarding", "vecchio", ultimi.size);
  for (const [idVecchio, s] of ultimi) {
    const clienteId = clienteValido(ctx, idVecchio, `onboarding_submissions ${s.id}`);
    if (!clienteId) continue;
    righe.set(clienteId, {
      id: clienteId,
      stato: "inviato",
      inviato_il: s.created_at,
      created_at: s.created_at,
      ...colonneDaAnswers(ctx, s.answers, `onboarding_submissions ${s.id}`),
    });
  }

  // 4b · onboarding_drafts (solo questionnaire_id = onboarding) → bozza, se il cliente non ha già inviato
  const bozze = await leggiTutto(old, "onboarding_drafts");
  report.conta("data_onboarding", "vecchio", bozze.length);
  const inviatiNelNuovo = ctx.esegui
    ? new Set((await leggiTutto(ctx.nuovo, "data_onboarding", { select: "id, stato" })).filter((r) => r.stato === "inviato").map((r) => r.id))
    : new Set();
  for (const b of bozze) {
    const idRiga = `onboarding_drafts ${b.user_id}/${b.questionnaire_id}`;
    if (b.questionnaire_id !== "onboarding") {
      report.salta("data_onboarding", idRiga, `bozza "${b.questionnaire_id}": scheda non più nel sistema`);
      continue;
    }
    const clienteId = clienteValido(ctx, b.user_id, idRiga);
    if (!clienteId) continue;
    if (righe.get(clienteId)?.stato === "inviato" || inviatiNelNuovo.has(clienteId)) {
      report.salta("data_onboarding", idRiga, "bozza ignorata: l'onboarding è già stato inviato");
      continue;
    }
    righe.set(clienteId, {
      id: clienteId,
      stato: "bozza",
      inviato_il: null,
      schermata: SCHERMATE.has(b.screen) ? b.screen : null,
      sezione_indice: intero(b.section_index),
      ...colonneDaAnswers(ctx, b.answers, idRiga),
    });
  }

  await scriviBlocchi(ctx, "data_onboarding", [...righe.values()], { onConflict: "id" });
}

function clienteValido(ctx, idVecchio, idRiga) {
  if (!idVecchio) {
    ctx.report.salta("data_onboarding", idRiga, "user_id nullo");
    return null;
  }
  const nuovoId = ctx.idNuovo(idVecchio);
  if (!nuovoId) {
    ctx.report.salta("data_onboarding", idRiga, `utente ${idVecchio} non migrato`);
    return null;
  }
  if (ctx.ruoli.get(idVecchio) !== "cliente") {
    ctx.report.salta("data_onboarding", idRiga, `utente ${idVecchio} non è un cliente`);
    return null;
  }
  return nuovoId;
}

/** Lista di stringhe non vuote da un valore jsonb (stringa singola → lista di 1). */
function lista(valore) {
  const grezzi = Array.isArray(valore) ? valore : valore === null || valore === undefined ? [] : [valore];
  return grezzi.map((v) => (typeof v === "object" ? JSON.stringify(v) : String(v)).trim()).filter(Boolean);
}

/** answers jsonb (id domanda → valore) → colonne di data_onboarding. Chiavi sconosciute: segnalate e ignorate. */
function colonneDaAnswers(ctx, answers, origine) {
  const colonne = {};
  if (!answers || typeof answers !== "object" || Array.isArray(answers)) return colonne;
  for (const [chiave, valore] of Object.entries(answers)) {
    if (COLONNE_TESTO.includes(chiave)) {
      colonne[chiave] = testo(Array.isArray(valore) ? valore.join("\n") : valore);
    } else if (chiave in COLONNE_MENU) {
      const v = testo(Array.isArray(valore) ? valore[0] : valore);
      if (v && !COLONNE_MENU[chiave].includes(v)) ctx.report.nota(`${origine}: "${chiave}" = "${v}" fuori vocabolario → null`);
      colonne[chiave] = v && COLONNE_MENU[chiave].includes(v) ? v : null;
    } else if (COLONNE_ORE.includes(chiave)) {
      colonne[chiave] = intero(Array.isArray(valore) ? valore[0] : valore);
    } else if (COLONNE_LISTA.includes(chiave)) {
      const l = lista(valore);
      colonne[chiave] = l.length ? l : null;
    } else if (chiave !== "allegati") {
      ctx.report.nota(`${origine}: risposta "${chiave}" senza colonna in data_onboarding → ignorata`);
    }
  }
  return colonne;
}
