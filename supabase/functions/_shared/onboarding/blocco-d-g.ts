import { PUBBLICA, type Blocco, type Opzione } from "./tipi.ts";

/** Le attività della settimana (D2 e D4): una voce cambia con il ramo. */
export const ATTIVITA: Opzione[] = [
  { value: "idee", label: "Trovare idee" },
  { value: "testi", label: "Scrivere i testi" },
  { value: "registrare", label: "Registrare i video" },
  { value: "montare", label: "Montare i video" },
  { value: "pubblicare", label: "Programmare e pubblicare" },
  { value: "messaggi", label: "Rispondere a messaggi e commenti" },
  { value: "clienti", label: "Call e lavoro con i {clienti}", mostraSe: { ramo: ["servizi"] } },
  { value: "produzione", label: "Produzione, ordini e spedizioni", mostraSe: { ramo: ["prodotti_fisici"] } },
  { value: "prodotto", label: "Creare il prodotto e seguire i {clienti}", mostraSe: { ramo: ["prodotti_digitali"] } },
  { value: "admin", label: "Fatture, email e organizzazione" },
];

/** Le attività che pesano sul tempo "operativo" dei contenuti (clienti.ore_operative). */
export const ATTIVITA_OPERATIVE = ["idee", "testi", "registrare", "montare", "pubblicare"] as const;

export const FASCE_ORE: Opzione[] = [
  { value: "0", label: "0" },
  { value: "1-2", label: "1-2" },
  { value: "3-5", label: "3-5" },
  { value: ">5", label: "Più di 5" },
];

/** Ore medie di ogni fascia (per sommare le ore operative). */
export const ORE_FASCIA: Record<string, number> = { "0": 0, "1-2": 1.5, "3-5": 4, ">5": 6 };

export const BLOCCO_D: Blocco = {
  id: "D_tempo",
  chiave: "D",
  titolo: "Il tuo tempo",
  emoji: "⏱️",
  intro: "Quanto tempo ti prende tutto questo oggi. Serve a capire cosa alleggerire per primo.",
  domande: [
    {
      id: "ore_social",
      codice: "D1",
      testo: "Quante ore a settimana dedichi ai social oggi, in totale?",
      tipo: "select",
      obbligatoria: true,
      opzioni: [
        { value: "<1", label: "Meno di 1" },
        { value: "1-2", label: "1-2" },
        { value: "3-5", label: "3-5" },
        { value: "6-10", label: "6-10" },
        { value: ">10", label: "Più di 10" },
      ],
      mostraSe: { social: PUBBLICA },
    },
    {
      id: "attivita_pesanti",
      codice: "D2",
      testo: "Quali di queste attività ti pesano di più?",
      tipo: "multiselect-text",
      obbligatoria: true,
      opzioni: ATTIVITA,
    },
    {
      id: "non_delegabile",
      codice: "D3",
      testo: "C'è un'attività che non delegheresti mai? Quale e perché?",
      tipo: "textarea",
      obbligatoria: true,
    },
    {
      id: "ore_per_attivita",
      codice: "D4",
      testo: "Per ognuna delle attività qui sopra: quante ore a settimana ci dedichi?",
      hint: "Facoltativa: serve a misurare le ore risparmiate a fine percorso.",
      tipo: "fasce",
      obbligatoria: false,
      opzioni: ATTIVITA,
    },
  ],
};

export const BLOCCO_E: Blocco = {
  id: "E_ia",
  chiave: "E",
  titolo: "Tu e l'IA",
  emoji: "✨",
  intro: "Da dove parti con gli strumenti. Non è un esame: serve a tarare il percorso.",
  domande: [
    {
      id: "ia_uso",
      codice: "E1",
      testo: "Quali strumenti di intelligenza artificiale usi oggi, e per cosa?",
      tipo: "textarea",
      obbligatoria: false,
      placeholder: "Se non ne usi, scrivi «nessuno»",
    },
    {
      id: "abbonamenti",
      codice: "E2",
      testo: "Quali abbonamenti hai attivi?",
      tipo: "multiselect-text",
      obbligatoria: true,
      consentiAltro: true,
      opzioni: [
        { value: "chatgpt", label: "ChatGPT" },
        { value: "claude", label: "Claude" },
        { value: "gemini", label: "Gemini" },
        { value: "canva", label: "Canva" },
        { value: "capcut", label: "CapCut" },
        { value: "nessuno", label: "Nessuno" },
      ],
    },
    {
      id: "dispositivo",
      codice: "E3",
      testo: "Da che dispositivo lavori di più?",
      tipo: "select",
      obbligatoria: true,
      opzioni: [
        { value: "mac", label: "Mac" },
        { value: "windows", label: "Windows" },
        { value: "telefono", label: "Soprattutto telefono" },
      ],
    },
  ],
};

const GIORNI = ["lunedi", "martedi", "mercoledi", "giovedi", "venerdi", "sabato", "domenica"] as const;
const ETICHETTE_GIORNI: Record<(typeof GIORNI)[number], string> = {
  lunedi: "Lunedì",
  martedi: "Martedì",
  mercoledi: "Mercoledì",
  giovedi: "Giovedì",
  venerdi: "Venerdì",
  sabato: "Sabato",
  domenica: "Domenica",
};

export const BLOCCO_F: Blocco = {
  id: "F_obiettivi",
  chiave: "F",
  titolo: "Obiettivi e percorso",
  emoji: "🎯",
  intro: "Dove vuoi arrivare e quanto puoi metterci, davvero.",
  domande: [
    {
      id: "obiettivo_6_mesi",
      codice: "F1",
      testo: "Cosa vuoi che cambi nei prossimi 6 mesi? Qualcosa che ti farebbe dire «ne è valsa la pena».",
      tipo: "textarea",
      obbligatoria: true,
    },
    {
      id: "competenza_obiettivo",
      codice: "F2",
      testo: "Quale cosa concreta vorresti saper fare da solo alla fine del percorso?",
      tipo: "textarea",
      obbligatoria: true,
    },
    { id: "da_evitare", codice: "F3", testo: "Cosa vuoi EVITARE mentre cresci?", tipo: "textarea", obbligatoria: true },
    { id: "perche_ora", codice: "F4", testo: "Perché proprio adesso?", tipo: "textarea", obbligatoria: true },
    {
      id: "ore_percorso",
      codice: "F5",
      testo: "Quante ore a settimana puoi dedicare al percorso, davvero?",
      tipo: "select",
      obbligatoria: true,
      opzioni: [
        { value: "1-2", label: "1-2" },
        { value: "3-5", label: "3-5" },
        { value: "6-10", label: "6-10" },
        { value: ">10", label: "Più di 10" },
      ],
    },
    {
      id: "disponibilita_call",
      codice: "F6",
      testo: "Quali giorni e fasce orarie preferisci per le call?",
      tipo: "multiselect-text",
      obbligatoria: true,
      opzioni: [
        ...GIORNI.map((g) => ({ value: g, label: ETICHETTE_GIORNI[g] })),
        { value: "mattina", label: "Mattina" },
        { value: "pomeriggio", label: "Pomeriggio" },
        { value: "sera", label: "Sera" },
      ],
    },
  ],
};

export const BLOCCO_G: Blocco = {
  id: "G_materiali",
  chiave: "G",
  titolo: "Materiali",
  emoji: "📎",
  intro: "Se hai documenti pronti, caricali qui: Aura e Wesley li leggono insieme alle tue risposte.",
  domande: [
    {
      id: "allegati",
      codice: "G1",
      testo: "Carica la presentazione della tua offerta, il listino, il brand kit o altri documenti utili.",
      hint: "PDF e immagini vengono letti da Aura; gli altri file restano a disposizione di Wesley.",
      tipo: "file-list",
      obbligatoria: false,
    },
  ],
};
