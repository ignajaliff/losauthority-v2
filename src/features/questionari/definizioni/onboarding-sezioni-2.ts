import type { Sezione } from "../types";

/** Scheda 1 — Onboarding, sezioni D–G. */
export const ONBOARDING_SEZIONI_2: Sezione[] = [
  {
    id: "D_tempo",
    chiave: "D",
    titolo: "La mappa del tuo tempo",
    emoji: "⏱️",
    nota: "Ore VERE a settimana, numeri interi (anche 0). È la sezione più importante per costruire le automazioni.",
    intro:
      "Quante ore VERE alla settimana spendi su ognuna di queste attività? Numeri interi, anche zero va benissimo.",
    domande: [
      { id: "ore_idee", testo: "Trovare idee per i contenuti", tipo: "number", obbligatoria: true, unita: "h / sett." },
      { id: "ore_scrittura", testo: "Scrivere contenuti (script, caption, post)", tipo: "number", obbligatoria: true, unita: "h / sett." },
      { id: "ore_riprese", testo: "Registrare / creare video", tipo: "number", obbligatoria: true, unita: "h / sett." },
      { id: "ore_editing", testo: "Editing video", tipo: "number", obbligatoria: true, unita: "h / sett." },
      { id: "ore_pubblicazione", testo: "Programmare e pubblicare", tipo: "number", obbligatoria: true, unita: "h / sett." },
      { id: "ore_dm", testo: "Rispondere a DM e commenti", tipo: "number", obbligatoria: true, unita: "h / sett." },
      { id: "ore_clienti", testo: "Call e lavoro con i clienti", tipo: "number", obbligatoria: true, unita: "h / sett." },
      { id: "ore_admin", testo: "Admin (fatture, email, organizzazione)", tipo: "number", obbligatoria: true, unita: "h / sett." },
      {
        id: "attivita_odiata",
        testo: "Di queste attività, quale odi di più? E quale non delegheresti mai?",
        tipo: "text",
        obbligatoria: true,
        placeholder: "Es. odio l'editing; non delegherei mai le call coi clienti",
      },
    ],
  },
  {
    id: "E_ia",
    chiave: "E",
    titolo: "Tu e l'IA",
    emoji: "🤖",
    intro: "Adesso il tuo rapporto con l'intelligenza artificiale. Dimmi come la usi oggi, anche se è poco o niente.",
    domande: [
      {
        id: "strumenti_ia",
        testo: "Quali strumenti IA usi oggi e per cosa?",
        tipo: "textarea",
        obbligatoria: true,
        placeholder: "Es. ChatGPT per le caption, CapCut per i sottotitoli...",
      },
      {
        id: "abbonamenti",
        testo: "Abbonamenti attivi.",
        tipo: "multiselect-text",
        obbligatoria: true,
        consentiAltro: true,
        opzioni: [
          { value: "chatgpt", label: "ChatGPT" },
          { value: "claude", label: "Claude" },
          { value: "canva", label: "Canva" },
          { value: "capcut", label: "CapCut" },
          { value: "nessuno", label: "Nessuno" },
        ],
      },
      {
        id: "dispositivo",
        testo: "Da che dispositivo lavori principalmente?",
        tipo: "select",
        obbligatoria: true,
        opzioni: [
          { value: "mac", label: "Mac" },
          { value: "windows", label: "Windows" },
          { value: "telefono", label: "Soprattutto telefono" },
        ],
      },
    ],
  },
  {
    id: "F_obiettivi",
    chiave: "F",
    titolo: "Obiettivi e percorso",
    emoji: "🎯",
    intro: "Quasi alla fine. Dove vuoi arrivare — e come incastriamo le 6 settimane nella tua vita reale.",
    domande: [
      {
        id: "obiettivo_6_mesi",
        testo:
          'Cosa vuoi che cambi nei prossimi 6 mesi? Qualcosa che ti farebbe dire "ne è valsa la pena" (avere un sistema che ti aiuta, chiudere più clienti, più visibilità...).',
        tipo: "textarea",
        obbligatoria: true,
        placeholder: 'Es. "Passare da 3k a 8k al mese" oppure "Un sistema di contenuti che gira da solo"',
      },
      {
        id: "competenza_desiderata",
        testo: "Se dovessi scegliere, quale cosa concreta vorresti imparare a fare dopo il percorso?",
        tipo: "textarea",
        obbligatoria: true,
        placeholder: "Es. scrivere hook che funzionano da solo, o automatizzare i contenuti con l'AI",
      },
      {
        id: "cosa_evitare",
        testo: "Cosa vuoi EVITARE mentre cresci?",
        tipo: "text",
        obbligatoria: true,
        placeholder: "Es. lavorare la sera, snaturarmi, bruciarmi...",
      },
      {
        id: "perche_adesso",
        testo: "Perché proprio adesso?",
        tipo: "text",
        obbligatoria: true,
        placeholder: "Cosa è cambiato / cosa ti ha spinto a partire ora...",
      },
      {
        id: "disponibilita",
        testo:
          "Quante ore a settimana puoi dedicare al percorso, realisticamente? E quali giorni e fasce orarie preferisci per le 4 call?",
        tipo: "text",
        obbligatoria: true,
        placeholder: "Es. 3-4 ore; preferisco martedì/giovedì pomeriggio",
      },
    ],
  },
  {
    id: "G_materiali",
    chiave: "G",
    titolo: "Materiali",
    emoji: "📎",
    intro:
      "Ultimo passo, e poi ti lascio in pace. Se ce li hai a portata di mano, allega i tuoi materiali — altrimenti puoi mandarli a Wesley dopo.",
    domande: [
      {
        id: "allegati",
        testo: "Presentazione della tua offerta, brand kit, o qualsiasi documento utile a Wesley.",
        hint: "Facoltativo. Puoi caricare più file (PDF, immagini, video mp4, testo — max 25 MB ciascuno).",
        tipo: "file-list",
        obbligatoria: false,
      },
    ],
  },
];
