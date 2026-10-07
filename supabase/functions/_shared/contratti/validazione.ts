/**
 * Controllo e pulizia dei dati inseriti dal cliente nel modulo del contratto.
 * Usato due volte: nel browser (errori subito sotto il campo) e sul server
 * (che NON si fida del browser e ricontrolla tutto prima di salvare).
 */

import type { DatiCliente, DatiPrivato, DatiProfessionista, DatiSocieta, Indirizzo, TipoCliente } from "./tipi.ts";
import { codiceFiscaleCoerenteConData, codiceFiscaleValido, emailValida, nomeProprio, normalizzaSocial, normalizzaTelefono, partitaIvaValida, pulisci } from "./campi.ts";

export {
  codiceFiscaleCoerenteConData,
  codiceFiscaleValido,
  emailValida,
  nomeProprio,
  normalizzaSocial,
  normalizzaTelefono,
  partitaIvaValida,
  pulisci,
  sessoDaCodiceFiscale,
} from "./campi.ts";
export { validaFirma } from "./firma-forma.ts";

export type Errori = Record<string, string>;

/** Età in anni compiuti a oggi, da una data YYYY-MM-DD. */
function etaDa(dataIso: string, oggi: Date): number {
  const [a, m, g] = dataIso.split("-").map(Number);
  let eta = oggi.getUTCFullYear() - a;
  const mm = oggi.getUTCMonth() + 1;
  const gg = oggi.getUTCDate();
  if (mm < m || (mm === m && gg < g)) eta -= 1;
  return eta;
}

function dataValida(dataIso: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dataIso)) return false;
  const d = new Date(dataIso + "T00:00:00Z");
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === dataIso;
}

/* ---------- Validazione del modulo ---------- */

type Grezzo = Record<string, unknown>;

function leggiIndirizzo(raw: Grezzo, err: Errori, nome: string): Indirizzo {
  const src = (raw.indirizzo ?? {}) as Grezzo;
  const ind: Indirizzo = {
    via: pulisci(src.via, 120),
    cap: String(src.cap ?? "").replace(/\D/g, "").slice(0, 5),
    citta: nomeProprio(String(src.citta ?? "")),
    provincia: String(src.provincia ?? "").replace(/[^A-Za-z]/g, "").toUpperCase().slice(0, 2),
  };
  if (ind.via.length < 4) err["indirizzo.via"] = `Scrivi via e numero civico ${nome}.`;
  if (!/^\d{5}$/.test(ind.cap)) err["indirizzo.cap"] = "Il CAP ha 5 cifre.";
  if (ind.citta.length < 2) err["indirizzo.citta"] = "Scrivi il comune.";
  if (!/^[A-Z]{2}$/.test(ind.provincia)) err["indirizzo.provincia"] = "Sigla di 2 lettere, es. MI.";
  return ind;
}

function leggiContatti(raw: Grezzo, err: Errori) {
  const email = String(raw.email ?? "").trim().toLowerCase();
  const telefono = normalizzaTelefono(raw.telefono);
  if (!emailValida(email)) err.email = "Scrivi un'email valida: è quella a cui ricevi accessi e comunicazioni.";
  const cifre = telefono.replace(/\D/g, "");
  if (cifre.length < 8 || cifre.length > 15) {
    err.telefono = "Scrivi il tuo numero di cellulare: serve per il gruppo WhatsApp.";
  }
  return {
    email,
    telefono,
    instagram: normalizzaSocial(raw.instagram, "instagram"),
    tiktok: normalizzaSocial(raw.tiktok, "tiktok"),
  };
}

function leggiRecapitoFattura(raw: Grezzo, err: Errori) {
  const codice = String(raw.codice_destinatario ?? "").replace(/[^A-Za-z0-9]/g, "").toUpperCase().slice(0, 7);
  const pec = String(raw.pec ?? "").trim().toLowerCase();
  if (!codice && !pec) {
    err.codice_destinatario = "Indica il codice destinatario oppure la PEC: serve per la fattura elettronica.";
  } else {
    if (codice && codice.length !== 7) err.codice_destinatario = "Il codice destinatario ha 7 caratteri.";
    if (pec && !emailValida(pec)) err.pec = "Scrivi una PEC valida.";
  }
  return { codice_destinatario: codice, pec };
}

function leggiPersona(raw: Grezzo, err: Errori, oggi: Date) {
  const nome = nomeProprio(String(raw.nome ?? ""));
  const cognome = nomeProprio(String(raw.cognome ?? ""));
  const luogo_nascita = nomeProprio(String(raw.luogo_nascita ?? ""));
  const data_nascita = String(raw.data_nascita ?? "").trim();
  const codice_fiscale = String(raw.codice_fiscale ?? "").replace(/\s+/g, "").toUpperCase();

  if (nome.length < 2) err.nome = "Scrivi il tuo nome.";
  if (cognome.length < 2) err.cognome = "Scrivi il tuo cognome.";
  if (luogo_nascita.length < 2) err.luogo_nascita = "Scrivi il comune (o lo Stato estero) in cui sei nato.";
  if (!dataValida(data_nascita)) {
    err.data_nascita = "Scrivi la tua data di nascita.";
  } else if (etaDa(data_nascita, oggi) < 18) {
    err.data_nascita = "Per firmare il contratto devi essere maggiorenne.";
  } else if (etaDa(data_nascita, oggi) > 110) {
    err.data_nascita = "Controlla l'anno di nascita.";
  }
  if (!codiceFiscaleValido(codice_fiscale)) {
    err.codice_fiscale = "Il codice fiscale non è corretto: controlla di averlo scritto bene.";
  } else if (!err.data_nascita && !codiceFiscaleCoerenteConData(codice_fiscale, data_nascita)) {
    err.codice_fiscale = "Codice fiscale e data di nascita non coincidono: controlla quale dei due è sbagliato.";
  }
  return { nome, cognome, luogo_nascita, data_nascita, codice_fiscale };
}

function leggiPartitaIva(raw: Grezzo, err: Errori): string {
  const piva = String(raw.partita_iva ?? "").replace(/\s+/g, "").replace(/^IT/i, "");
  if (!partitaIvaValida(piva)) err.partita_iva = "La partita IVA non è corretta: ha 11 cifre.";
  return piva;
}

export type EsitoValidazione =
  | { ok: true; dati: DatiCliente }
  | { ok: false; errori: Errori };

/** Controlla e ripulisce i dati del modulo. `oggi` serve solo ai test. */
export function validaDati(tipo: TipoCliente, grezzo: unknown, oggi = new Date()): EsitoValidazione {
  const raw = (grezzo && typeof grezzo === "object" ? grezzo : {}) as Grezzo;
  const err: Errori = {};

  if (tipo === "privato") {
    const persona = leggiPersona(raw, err, oggi);
    const indirizzo = leggiIndirizzo(raw, err, "di residenza");
    const contatti = leggiContatti(raw, err);
    const dati: DatiPrivato = { ...persona, indirizzo, ...contatti };
    return Object.keys(err).length ? { ok: false, errori: err } : { ok: true, dati };
  }

  if (tipo === "professionista") {
    const persona = leggiPersona(raw, err, oggi);
    const partita_iva = leggiPartitaIva(raw, err);
    const indirizzo = leggiIndirizzo(raw, err, "della sede");
    const recapito = leggiRecapitoFattura(raw, err);
    const contatti = leggiContatti(raw, err);
    const dati: DatiProfessionista = { ...persona, partita_iva, indirizzo, ...recapito, ...contatti };
    return Object.keys(err).length ? { ok: false, errori: err } : { ok: true, dati };
  }

  // società
  const ragione_sociale = pulisci(raw.ragione_sociale, 140);
  if (ragione_sociale.length < 2) err.ragione_sociale = "Scrivi la ragione sociale, completa della forma (es. S.r.l.).";
  const partita_iva = leggiPartitaIva(raw, err);
  const codice_fiscale = String(raw.codice_fiscale ?? "").replace(/\s+/g, "").toUpperCase();
  if (!partitaIvaValida(codice_fiscale) && !codiceFiscaleValido(codice_fiscale)) {
    err.codice_fiscale = "Il codice fiscale della società non è corretto (di solito coincide con la partita IVA).";
  }
  const indirizzo = leggiIndirizzo(raw, err, "della sede legale");
  const recapito = leggiRecapitoFattura(raw, err);
  const rappresentante_nome = nomeProprio(String(raw.rappresentante_nome ?? ""));
  const rappresentante_cognome = nomeProprio(String(raw.rappresentante_cognome ?? ""));
  if (rappresentante_nome.length < 2) err.rappresentante_nome = "Scrivi il nome del legale rappresentante.";
  if (rappresentante_cognome.length < 2) err.rappresentante_cognome = "Scrivi il cognome del legale rappresentante.";
  const partecipante_nome = nomeProprio(String(raw.partecipante_nome ?? ""));
  const partecipante_cognome = nomeProprio(String(raw.partecipante_cognome ?? ""));
  if (partecipante_nome.length < 2) err.partecipante_nome = "Scrivi il nome di chi seguirà il programma.";
  if (partecipante_cognome.length < 2) err.partecipante_cognome = "Scrivi il cognome di chi seguirà il programma.";
  const contatti = leggiContatti(raw, err);
  const dati: DatiSocieta = {
    ragione_sociale,
    indirizzo,
    codice_fiscale,
    partita_iva,
    ...recapito,
    rappresentante_nome,
    rappresentante_cognome,
    partecipante_nome,
    partecipante_cognome,
    ...contatti,
  };
  return Object.keys(err).length ? { ok: false, errori: err } : { ok: true, dati };
}

/* ---------- Nomi da mostrare ---------- */

/** Il nome con cui il cliente compare nel gestionale e sotto la firma. */
export function nomeCliente(tipo: TipoCliente, dati: DatiCliente): string {
  if (tipo === "societa") return (dati as DatiSocieta).ragione_sociale;
  const p = dati as DatiPrivato;
  return `${p.nome} ${p.cognome}`.trim();
}

/** La persona che riceve gli accessi: per una società è chi segue il programma. */
export function nomePartecipante(tipo: TipoCliente, dati: DatiCliente): string {
  if (tipo === "societa") {
    const s = dati as DatiSocieta;
    return `${s.partecipante_nome} ${s.partecipante_cognome}`.trim();
  }
  return nomeCliente(tipo, dati);
}

