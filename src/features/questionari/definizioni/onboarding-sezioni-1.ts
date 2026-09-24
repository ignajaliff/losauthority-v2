import type { Sezione } from "../types";

/** Scheda 1 — Onboarding, sezioni A–C (mirror del documento "Onboarding_Los_Authority_v2"). */
export const ONBOARDING_SEZIONI_1: Sezione[] = [
  {
    id: "A_business",
    chiave: "A",
    titolo: "Il tuo business",
    emoji: "🏢",
    intro:
      "Partiamo dalle fondamenta. Raccontami in parole tue cosa fai e come funziona oggi — niente risposte perfette, solo quelle vere.",
    domande: [
      {
        id: "business_descrizione",
        testo: "Cosa fai, per chi, da quanto tempo? Come ti presenteresti a un nuovo socio in 2 minuti.",
        tipo: "textarea",
        obbligatoria: true,
        placeholder: "Es. Aiuto liberi professionisti a... da circa 3 anni. I miei clienti sono...",
      },
      {
        id: "offerta_attuale",
        testo: "Cosa vendi oggi, a che prezzo, com'è strutturato?",
        tipo: "textarea",
        obbligatoria: true,
        placeholder: "Es. Percorso 1:1 da 3 mesi a 1.500€, più una consulenza singola a...",
      },
      {
        id: "fatturato_mensile",
        testo: "Fatturato medio mensile degli ultimi 6 mesi.",
        tipo: "select",
        obbligatoria: true,
        opzioni: [
          { value: "<1k", label: "Meno di 1.000€" },
          { value: "1-3k", label: "1.000 – 3.000€" },
          { value: "3-5k", label: "3.000 – 5.000€" },
          { value: "5-10k", label: "5.000 – 10.000€" },
          { value: "10k+", label: "Oltre 10.000€" },
        ],
      },
      {
        id: "vendita_processo",
        testo:
          "Come trasformi un contatto in cliente, oggi? Raccontami l'ultimo cliente chiuso, dal primo messaggio alla firma. E su 10 persone interessate, quante comprano?",
        tipo: "textarea",
        obbligatoria: true,
        placeholder:
          "Es. Mi scrivono in DM, faccio una call gratuita, mando un preventivo... su 10 ne chiudo circa 3.",
      },
    ],
  },
  {
    id: "B_clienti",
    chiave: "B",
    titolo: "I tuoi clienti",
    emoji: "🤝",
    intro:
      "Ora i tuoi clienti. Sono la bussola di tutto il percorso: capiamo chi attiri davvero e chi vorresti attirare.",
    domande: [
      {
        id: "provenienza_clienti",
        testo: "I tuoi ultimi 5 clienti: da dove sono arrivati?",
        tipo: "multiselect-text",
        obbligatoria: true,
        consentiAltro: true,
        opzioni: [
          { value: "referral", label: "Passaparola / referral" },
          { value: "instagram", label: "Instagram" },
          { value: "linkedin", label: "LinkedIn" },
          { value: "eventi", label: "Eventi" },
        ],
      },
      {
        id: "cliente_migliore",
        testo:
          "Il cliente che ti ha dato più soddisfazione negli ultimi 12 mesi: chi è, cosa cercava, cosa ha ottenuto.",
        tipo: "textarea",
        obbligatoria: true,
        placeholder: "Chi era, il problema con cui è arrivato, il risultato...",
      },
      {
        id: "anti_cliente",
        testo: "Che tipo di clienti NON vuoi più?",
        tipo: "textarea",
        obbligatoria: false,
        placeholder: "Quelli che... (facoltativo, ma molto utile)",
      },
      {
        id: "messaggi_tipici",
        testo: "Incolla 2-3 messaggi tipici che ricevi dai clienti (le parole esatte).",
        tipo: "textarea",
        obbligatoria: true,
        placeholder: '"Ciao, volevo sapere se..." — le parole vere valgono oro.',
      },
    ],
  },
  {
    id: "C_comunicazione",
    chiave: "C",
    titolo: "La tua comunicazione oggi — la diagnosi",
    emoji: "🩺",
    intro:
      "Comunichi già: il punto è capire dove si rompe. Questa è la sezione che decide la forma del tuo percorso — rispondi senza filtri.",
    domande: [
      {
        id: "dove_si_blocca",
        testo: "Dove si blocca, oggi?",
        tipo: "select",
        obbligatoria: true,
        opzioni: [
          { value: "poche_views", label: "Pubblico, ma faccio poche visualizzazioni" },
          { value: "no_dm", label: "Le views ci sono, ma quasi nessuno mi scrive" },
          { value: "no_acquisti", label: "Mi scrivono, ma pochi comprano" },
          { value: "clienti_sbagliati", label: "Vendo, ma a clienti sbagliati o prezzi troppo bassi" },
        ],
      },
      {
        id: "auto_diagnosi",
        testo: "Comunichi da tempo, ma i risultati non sono quelli che speravi. Secondo te, perché?",
        tipo: "textarea",
        obbligatoria: true,
        placeholder: "La tua ipotesi, anche se non sei sicuro...",
      },
      {
        id: "profili_social",
        testo: "Link ai tuoi profili social",
        hint: "Incolla sia Instagram che TikTok — usa “+ Aggiungi un altro link” per il secondo. Gli handle possono essere diversi tra le due piattaforme: copia il link esatto da ciascun profilo.",
        tipo: "url-list",
        obbligatoria: true,
        placeholder: "https://instagram.com/iltuoprofilo",
      },
      {
        id: "follower_e_views",
        testo: "Follower, views medie degli ultimi 30 giorni e quanti contenuti pubblichi a settimana?",
        tipo: "textarea",
        obbligatoria: true,
        placeholder: 'Es. "4.800 follower, reel 2-5k views, pubblico 3 volte a settimana"',
      },
      {
        id: "contenuti_top",
        testo: "I 3 tuoi contenuti che hanno funzionato meglio (link o descrizione).",
        tipo: "textarea",
        obbligatoria: true,
        placeholder: "1) ...\n2) ...\n3) ...",
      },
      {
        id: "comfort_camera",
        testo:
          "Quanto sei a tuo agio davanti alla camera, da 1 a 5? Hai vincoli? (metterci la faccia, la voce, privacy legata al tuo lavoro...)",
        tipo: "text",
        obbligatoria: true,
        placeholder: "Es. 3/5 — ok la voce, ma non posso mostrare i clienti",
      },
      {
        id: "tentativi_passati",
        testo:
          "Cosa hai già provato per farti conoscere online e quanto hai investito, circa? Com'è andata? (corsi, agenzie, ads, ecc.)",
        tipo: "textarea",
        obbligatoria: true,
        placeholder: "Cosa hai provato, quanto ci hai investito, il risultato...",
      },
      {
        id: "riferimenti",
        testo: "2-3 creator/professionisti la cui comunicazione ami.",
        tipo: "textarea",
        obbligatoria: false,
        placeholder: "Nome + perché ti piace (facoltativo)",
      },
    ],
  },
];
