import { CON_CLIENTI, type Blocco } from "./tipi.ts";

/** Modulo iniziale «Da dove parti»: sei domande obbligatorie che scelgono le versioni dei blocchi. */
export const BLOCCO_INIZIO: Blocco = {
  id: "inizio",
  chiave: "0",
  titolo: "Da dove parti",
  emoji: "🧭",
  intro: "Sei domande veloci. Servono a farti vedere solo le domande che riguardano davvero il tuo lavoro.",
  domande: [
    { id: "nome", codice: "0.1", testo: "Come ti chiami?", tipo: "text", obbligatoria: true, placeholder: "Nome e cognome" },
    { id: "nome_attivita", codice: "0.1", testo: "Come si chiama la tua attività?", tipo: "text", obbligatoria: true, placeholder: "Il nome con cui ti conoscono (anche il tuo, se lavori col tuo nome)" },
    {
      id: "attivita_breve",
      codice: "0.2",
      testo: "Cosa fai e per chi? Scrivilo in una riga, come lo diresti a una persona che non ti conosce.",
      tipo: "text",
      obbligatoria: true,
      placeholder: "Es. Sono una psicologa e aiuto le mamme nel primo anno dopo il parto",
    },
    {
      id: "tipo",
      codice: "0.3",
      testo: "Cosa vendi principalmente?",
      tipo: "select",
      obbligatoria: true,
      opzioni: [
        { value: "servizi", label: "Servizi, cioè lavori tu con il cliente (consulenze, sedute, trattamenti, progetti)" },
        { value: "prodotti_fisici", label: "Prodotti fisici, cioè oggetti che produci o rivendi" },
        { value: "prodotti_digitali", label: "Prodotti digitali (corsi, ebook, abbonamenti, community)" },
        { value: "mix", label: "Un mix di queste cose" },
      ],
    },
    {
      id: "tipo_principale",
      codice: "0.3b",
      testo: "Cosa ti porta più fatturato oggi?",
      tipo: "select",
      obbligatoria: true,
      mostraSe: { tipo: ["mix"] },
      opzioni: [
        { value: "servizi", label: "Servizi" },
        { value: "prodotti_fisici", label: "Prodotti fisici" },
        { value: "prodotti_digitali", label: "Prodotti digitali" },
      ],
    },
    {
      id: "mercato",
      codice: "0.4",
      testo: "A chi vendi?",
      tipo: "select",
      obbligatoria: true,
      opzioni: [
        { value: "privati", label: "Privati" },
        { value: "aziende", label: "Aziende" },
        { value: "entrambi", label: "Entrambi" },
      ],
    },
    {
      id: "clienti",
      codice: "0.5",
      testo: "Hai già clienti che pagano?",
      tipo: "select",
      obbligatoria: true,
      opzioni: [
        { value: "nessuno", label: "No, non ancora" },
        { value: "pochi", label: "Sì, ma pochi e non con regolarità" },
        { value: "continui", label: "Sì, con continuità" },
      ],
    },
    {
      id: "social",
      codice: "0.6",
      testo: "Oggi come usi i social per il tuo lavoro?",
      tipo: "select",
      obbligatoria: true,
      opzioni: [
        { value: "non_pubblica", label: "Non pubblico, o quasi mai" },
        { value: "ogni_tanto", label: "Pubblico ogni tanto, meno di una volta a settimana" },
        { value: "settimanale", label: "Pubblico ogni settimana" },
        { value: "porta_clienti", label: "Pubblico e i social mi portano già clienti", mostraSe: { clienti: CON_CLIENTI } },
      ],
    },
  ],
};
