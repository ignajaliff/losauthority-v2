import { CON_CLIENTI, RAMI_PRODOTTI, type Blocco, type Opzione } from "./tipi.ts";

export const CANALI: Opzione[] = [
  { value: "passaparola", label: "Passaparola" },
  { value: "instagram", label: "Instagram" },
  { value: "tiktok", label: "TikTok" },
  { value: "facebook", label: "Facebook" },
  { value: "youtube", label: "YouTube" },
  { value: "linkedin", label: "LinkedIn" },
  { value: "google", label: "Google o sito" },
  { value: "pubblicita", label: "Pubblicità" },
  { value: "eventi", label: "Eventi" },
  { value: "negozio", label: "Negozio" },
  { value: "altro", label: "Altro" },
];

/**
 * Blocco B «I tuoi {clienti}»: due versioni scelte dalla 0.5. Chi ha clienti
 * racconta quelli veri (l'avatar si estrae da lì); chi non ne ha descrive chi
 * vorrebbe servire (l'avatar si costruisce).
 */
export const BLOCCO_B: Blocco = {
  id: "B_clienti",
  chiave: "B",
  titolo: "I tuoi {clienti}",
  emoji: "🤝",
  intro: "Ora le persone a cui vendi. Sono la bussola di tutto il percorso.",
  domande: [
    // --- versione «dai clienti veri» ---
    {
      id: "canali_acquisizione",
      codice: "B1",
      testo: "Pensa ai tuoi ultimi 5 {clienti}. Quanti sono arrivati da ciascun canale?",
      hint: "Metti un numero solo dove serve: le caselle vuote valgono zero.",
      tipo: "conteggi",
      obbligatoria: true,
      opzioni: CANALI,
      mostraSe: { clienti: ["continui"] },
    },
    {
      id: "canali_acquisizione",
      codice: "B1",
      testo: "Pensa agli ultimi {clienti} che hai avuto, anche se sono meno di 5. Quanti sono arrivati da ciascun canale?",
      hint: "Metti un numero solo dove serve: le caselle vuote valgono zero.",
      tipo: "conteggi",
      obbligatoria: true,
      opzioni: CANALI,
      mostraSe: { clienti: ["pochi"] },
    },
    {
      id: "cliente_migliore",
      codice: "B2-s",
      testo: "Il {cliente} che ti ha dato più soddisfazione negli ultimi 12 mesi: chi è, cosa cercava, cosa ha ottenuto?",
      tipo: "textarea",
      obbligatoria: true,
      mostraSe: { ramo: ["servizi"], clienti: CON_CLIENTI },
    },
    {
      id: "cliente_migliore",
      codice: "B2-p",
      testo: "Il tuo {cliente} più affezionato: chi è, cosa compra, perché torna da te?",
      tipo: "textarea",
      obbligatoria: true,
      mostraSe: { ramo: RAMI_PRODOTTI, clienti: CON_CLIENTI },
    },
    {
      id: "acquirente_utente",
      codice: "B3",
      testo: "Chi compra è la stessa persona che usa il tuo servizio o prodotto?",
      tipo: "select",
      obbligatoria: true,
      opzioni: [
        { value: "si", label: "Sì" },
        { value: "regalo", label: "No, spesso è un regalo" },
        { value: "familiare", label: "No, compra un familiare, per esempio un genitore per il figlio" },
        { value: "azienda", label: "No, in azienda decide un'altra persona" },
        { value: "altro", label: "Altro" },
      ],
      mostraSe: { clienti: CON_CLIENTI },
    },
    {
      id: "anti_cliente",
      codice: "B4",
      testo: "Che tipo di {clienti} NON vuoi più?",
      tipo: "textarea",
      obbligatoria: true,
      mostraSe: { clienti: CON_CLIENTI },
    },
    {
      id: "messaggi_tipici",
      codice: "B5",
      testo: "Incolla 2-3 messaggi che ti scrivono i {clienti} quando ti contattano la prima volta. Copia le parole esatte, anche con gli errori.",
      tipo: "textarea",
      obbligatoria: true,
      mostraSe: { clienti: CON_CLIENTI },
    },
    {
      id: "obiezioni",
      codice: "B6",
      testo: "Chi si interessa e poi non compra, cosa ti dice? Scrivi le sue parole, per esempio «costa troppo», «ci penso», «non è il momento».",
      tipo: "textarea",
      obbligatoria: true,
      mostraSe: { clienti: CON_CLIENTI },
    },
    // --- versione «da costruire» ---
    {
      id: "avatar_ipotesi",
      codice: "B1-n",
      testo: "A chi vuoi vendere? Descrivi questa persona come se la vedessi: età, lavoro, situazione, cosa le manca.",
      tipo: "textarea",
      obbligatoria: true,
      opinione: true,
      mostraSe: { clienti: ["nessuno"] },
    },
    {
      id: "domande_ricevute",
      codice: "B2-n",
      testo: "Le persone ti chiedono già consigli su questo argomento? Chi te li chiede e cosa ti chiedono?",
      tipo: "textarea",
      obbligatoria: true,
      mostraSe: { clienti: ["nessuno"] },
    },
    {
      id: "esperienze_prova",
      codice: "B3-n",
      testo: "Hai già lavorato per qualcuno, anche gratis, in prova o per amici? Com'è andata e cosa ti hanno detto dopo?",
      tipo: "textarea",
      obbligatoria: true,
      mostraSe: { clienti: ["nessuno"] },
    },
    {
      id: "anti_cliente",
      codice: "B4-n",
      testo: "Con che tipo di persone NON vorresti lavorare?",
      tipo: "textarea",
      obbligatoria: true,
      mostraSe: { clienti: ["nessuno"] },
    },
  ],
};
