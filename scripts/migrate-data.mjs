#!/usr/bin/env node
// Migrazione dati: progetto Supabase vecchio (Next.js) → nuovo (v2).
//   node scripts/migrate-data.mjs            → dry-run: piano e conteggi, nessuna scrittura
//   node scripts/migrate-data.mjs --esegui   → esegue (idempotente: rieseguibile)
// Env in scripts/.env.migrate (vedi scripts/.env.migrate.example).
// NON migra hub_compiti e skool_lessons: si rigenerano con le sync (notion-compiti, skool-lezioni).
import { caricaEnv, FILE_ENV, Report } from "./migrate/comune.mjs";
import { migraUtenti } from "./migrate/utenti.mjs";
import { migraClienti, migraTag } from "./migrate/clienti.mjs";
import { migraOnboarding } from "./migrate/onboarding.mjs";
import { migraAnalisi, migraChiamate, migraFathomLog, migraNote } from "./migrate/contenuti.mjs";
import { migraF24, migraFatture, migraSpese } from "./migrate/finanza.mjs";
import { migraErrorLog, migraLead } from "./migrate/altro.mjs";

const PASSI = [
  ["1. Utenti (auth.users + profiles.role → auth.users + user_roles)", migraUtenti],
  ["2a. Tag (client_tags → tags)", migraTag],
  ["2b/3. Clienti con i loro tag (client_details + onboarding_submissions → clienti, colonna tags)", migraClienti],
  ["4. Onboarding (onboarding_submissions + onboarding_drafts → data_onboarding; avatar/offerta non migrati)", migraOnboarding],
  ["5. Analisi (client_analyses → analisi)", migraAnalisi],
  ["6. Note (client_notes → clienti.note, accodate al campo note)", migraNote],
  ["7. Chiamate (client_calls → chiamate + chiamate_azioni)", migraChiamate],
  ["8. Log webhook Fathom (fathom_webhook_log)", migraFathomLog],
  ["9a. Fatture (invoices → fatture, bucket invoices → fatture)", migraFatture],
  ["9b. Spese (expenses → spese, bucket receipts → ricevute)", migraSpese],
  ["9c. F24 (f24_forms → f24, bucket f24 → f24)", migraF24],
  ["10a. Lead (leads → lead)", migraLead],
  ["10b. Errori (error_log, ultime 200)", migraErrorLog],
];

function leggiArgomenti() {
  const args = process.argv.slice(2);
  const esegui = args.includes("--esegui");
  const dryRun = args.includes("--dry-run");
  const sconosciuti = args.filter((a) => a !== "--esegui" && a !== "--dry-run");
  if (sconosciuti.length || (esegui && dryRun)) {
    console.error("Uso: node scripts/migrate-data.mjs [--dry-run | --esegui]");
    process.exit(2);
  }
  return { esegui };
}

async function main() {
  const { esegui } = leggiArgomenti();
  const { old, nuovo } = caricaEnv();
  const report = new Report();
  const ctx = {
    old,
    nuovo,
    esegui,
    report,
    mappa: new Map(), // id utente vecchio → id nuovo (null in dry-run per gli utenti da creare)
    ruoli: new Map(), // id utente vecchio → ruolo
    tagPerLabel: new Map(), // label minuscola → id tag nuovo
    onboardingUltimo: new Map(), // id utente vecchio → onboarding_submissions più recente
    /** Id nuovo del cliente; in dry-run usa l'id vecchio come segnaposto per contare. */
    idNuovo(idVecchio) {
      if (!this.mappa.has(idVecchio)) return null;
      return this.mappa.get(idVecchio) ?? (this.esegui ? null : idVecchio);
    },
  };

  console.log(`Migrazione dati Los Authority → v2 · modalità: ${esegui ? "ESECUZIONE" : "dry-run (nessuna scrittura)"}`);
  console.log(`Env: ${FILE_ENV}\nVecchio: ${process.env.OLD_SUPABASE_URL}\nNuovo:   ${process.env.NEW_SUPABASE_URL}\n`);
  console.log("Piano:");
  for (const [nome] of PASSI) console.log(`  ${nome}`);
  console.log("  (non migrati: hub_compiti, skool_lessons, skool_sync_state → rigenerati dalle sync)\n");

  for (const [nome, passo] of PASSI) {
    const inizio = Date.now();
    process.stdout.write(`→ ${nome} … `);
    try {
      await passo(ctx);
      console.log(`ok (${((Date.now() - inizio) / 1000).toFixed(1)}s)`);
    } catch (e) {
      console.log("ERRORE");
      report.salta(nome, "passo", e instanceof Error ? e.message : String(e));
      report.nota(`Il passo "${nome}" si è interrotto: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  report.stampa(esegui);
  if (!esegui) console.log("\nDry-run terminato. Per scrivere: node scripts/migrate-data.mjs --esegui");
  else console.log("\nDopo la migrazione: lanciare le sync notion-compiti e skool-lezioni per rigenerare hub e lezioni.");
}

main().catch((e) => {
  console.error(`\nErrore fatale: ${e instanceof Error ? e.message : String(e)}`);
  process.exit(1);
});
