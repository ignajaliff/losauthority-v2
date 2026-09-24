// Utilità condivise dalla migrazione: env, client, lettura paginata, scritture a blocchi, report.
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { randomBytes } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

const RADICE = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
export const FILE_ENV = resolve(RADICE, "scripts", ".env.migrate");
const PAGINA = 1000;
const BLOCCO = 200;

export function caricaEnv() {
  if (existsSync(FILE_ENV)) {
    for (const riga of readFileSync(FILE_ENV, "utf8").split("\n")) {
      const t = riga.trim();
      if (!t || t.startsWith("#")) continue;
      const i = t.indexOf("=");
      if (i < 0) continue;
      const chiave = t.slice(0, i).trim();
      let valore = t.slice(i + 1).trim();
      if (/^(".*"|'.*')$/.test(valore)) valore = valore.slice(1, -1);
      if (!process.env[chiave]) process.env[chiave] = valore;
    }
  }
  const richieste = ["OLD_SUPABASE_URL", "OLD_SERVICE_ROLE_KEY", "NEW_SUPABASE_URL", "NEW_SERVICE_ROLE_KEY"];
  const mancanti = richieste.filter((k) => !process.env[k]);
  if (mancanti.length) {
    throw new Error(`Variabili mancanti: ${mancanti.join(", ")} (copia scripts/.env.migrate.example in scripts/.env.migrate)`);
  }
  if (process.env.OLD_SUPABASE_URL === process.env.NEW_SUPABASE_URL) {
    throw new Error("OLD_SUPABASE_URL e NEW_SUPABASE_URL puntano allo stesso progetto");
  }
  return {
    old: creaClient(process.env.OLD_SUPABASE_URL, process.env.OLD_SERVICE_ROLE_KEY),
    nuovo: creaClient(process.env.NEW_SUPABASE_URL, process.env.NEW_SERVICE_ROLE_KEY),
  };
}

function creaClient(url, chiave) {
  return createClient(url, chiave, { auth: { autoRefreshToken: false, persistSession: false } });
}

/** Legge tutte le righe di una tabella a pagine di 1000. */
export async function leggiTutto(client, tabella, { select = "*", ordine, filtro } = {}) {
  const righe = [];
  for (let da = 0; ; da += PAGINA) {
    let q = client.from(tabella).select(select).range(da, da + PAGINA - 1);
    if (ordine) q = q.order(ordine.colonna, { ascending: ordine.ascendente ?? true });
    if (filtro) q = filtro(q);
    const { data, error } = await q;
    if (error) throw new Error(`lettura ${tabella}: ${error.message}`);
    righe.push(...data);
    if (data.length < PAGINA) break;
  }
  return righe;
}

/** Tutti gli utenti auth di un progetto (paginato). */
export async function listaUtenti(client) {
  const utenti = [];
  for (let page = 1; ; page++) {
    const { data, error } = await client.auth.admin.listUsers({ page, perPage: PAGINA });
    if (error) throw new Error(`listUsers: ${error.message}`);
    utenti.push(...data.users);
    if (data.users.length < PAGINA) break;
  }
  return utenti;
}

/**
 * Upsert/insert a blocchi. Se un blocco fallisce riprova riga per riga per isolare
 * l'errore. In dry-run conta soltanto. Ritorna il numero di righe scritte.
 */
export async function scriviBlocchi(ctx, tabella, righe, opzioni = {}) {
  const { modo = "upsert", onConflict = "id", ignoreDuplicates = false, idDi = (r) => r.id } = opzioni;
  if (!righe.length) return 0;
  if (!ctx.esegui) {
    ctx.report.conta(tabella, "nuovo", righe.length);
    return righe.length;
  }
  const scrivi = (dati) =>
    modo === "insert"
      ? ctx.nuovo.from(tabella).insert(dati)
      : ctx.nuovo.from(tabella).upsert(dati, { onConflict, ignoreDuplicates });
  let scritte = 0;
  for (let i = 0; i < righe.length; i += BLOCCO) {
    const blocco = righe.slice(i, i + BLOCCO);
    const { error } = await scrivi(blocco);
    if (!error) {
      scritte += blocco.length;
      continue;
    }
    for (const riga of blocco) {
      const { error: e1 } = await scrivi(riga);
      if (e1) ctx.report.salta(tabella, idDi(riga), e1.message);
      else scritte++;
    }
  }
  ctx.report.conta(tabella, "nuovo", scritte);
  return scritte;
}

export function passwordCasuale(lunghezza = 16) {
  const alfabeto = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
  const byte = randomBytes(lunghezza);
  let out = "";
  for (let i = 0; i < lunghezza; i++) out += alfabeto[byte[i] % alfabeto.length];
  return out;
}

export function testo(valore, max) {
  if (valore === null || valore === undefined) return null;
  const s = String(valore).trim();
  if (!s) return null;
  return max ? s.slice(0, max) : s;
}

export function intero(valore) {
  if (valore === null || valore === undefined || valore === "") return null;
  const n = Number.parseInt(String(valore), 10);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

export function importo(valore, fallback = 0) {
  const n = Number(valore);
  return Number.isFinite(n) && n >= 0 ? n : fallback;
}

export function basename(percorso) {
  return String(percorso).split("/").filter(Boolean).pop() ?? String(percorso);
}

/** Raccoglie conteggi, righe saltate, note e password temporanee. */
export class Report {
  constructor() {
    this.tabelle = new Map();
    this.saltati = [];
    this.note = [];
    this.password = [];
  }
  conta(tabella, colonna, n = 1) {
    const r = this.tabelle.get(tabella) ?? { vecchio: 0, nuovo: 0, saltati: 0 };
    r[colonna] += n;
    this.tabelle.set(tabella, r);
  }
  salta(tabella, id, motivo) {
    this.conta(tabella, "saltati");
    this.saltati.push({ tabella, id: String(id ?? "?"), motivo });
  }
  nota(messaggio) {
    if (!this.note.includes(messaggio)) this.note.push(messaggio);
  }
  aggiungiPassword(email, password) {
    this.password.push({ email, password });
  }
  stampa(esegui) {
    console.log(`\n${"=".repeat(72)}\nRIEPILOGO ${esegui ? "(eseguito)" : "(dry-run: nessuna scrittura)"}\n${"=".repeat(72)}`);
    const righe = [["tabella", "vecchio", "nuovo", "saltati"]];
    for (const [t, r] of this.tabelle) righe.push([t, String(r.vecchio), String(r.nuovo), String(r.saltati)]);
    const larghezze = righe[0].map((_, c) => Math.max(...righe.map((r) => r[c].length)));
    const formatta = (r) => r.map((cella, c) => (c === 0 ? cella.padEnd(larghezze[c]) : cella.padStart(larghezze[c]))).join("  ");
    console.log(formatta(righe[0]));
    console.log(larghezze.map((l) => "-".repeat(l)).join("  "));
    for (const r of righe.slice(1)) console.log(formatta(r));
    if (this.saltati.length) {
      console.log(`\nRighe saltate (${this.saltati.length}):`);
      for (const s of this.saltati) console.log(`  - ${s.tabella} [${s.id}]: ${s.motivo}`);
    }
    if (this.note.length) {
      console.log("\nNote:");
      for (const n of this.note) console.log(`  - ${n}`);
    }
    if (this.password.length) {
      console.log("\nPassword temporanee (da recapitare; in alternativa usare il reset password):");
      for (const p of this.password) console.log(`  ${p.email} → ${p.password}`);
    } else if (esegui) {
      console.log("\nNessun utente creato: nessuna password temporanea.");
    }
  }
}
