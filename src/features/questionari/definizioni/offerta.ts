import type { Sezione } from "../types";

/**
 * Scheda 3 — Offerta (Los Authority).
 * Alimenta su Notion la pagina 💎 Offerta (promessa, meccanismo, scala di valore,
 * prezzo/posizionamento, visione). Da compilare DOPO Avatar & Dolori.
 */
export const OFFERTA_SEZIONI: Sezione[] = [
  {
    id: "A_promessa",
    chiave: "A",
    titolo: "La promessa unica",
    emoji: "💎",
    intro:
      "Il cuore della tua offerta: cosa prometti, a chi, e perché solo tu. L'offerta nasce dal dolore dell'avatar, non al contrario.",
    domande: [
      {
        id: "promessa",
        testo:
          "In una frase: a CHI fai ottenere COSA, in quanto tempo? (la tua promessa, il più concreta possibile)",
        tipo: "textarea",
        obbligatoria: true,
        placeholder:
          "Es. Aiuto le neo-mamme a tornare in forma in 4 mesi senza diete punitive, mangiando anche la pizza del sabato.",
      },
      {
        id: "differenza",
        testo:
          "Cosa rende la tua promessa diversa da quella dei concorrenti? Perché un cliente dovrebbe scegliere te e non un altro?",
        tipo: "textarea",
        obbligatoria: true,
        placeholder:
          "Es. Non tolgo nessun cibo e lavoro sul rapporto col cibo, non solo sulle calorie: i risultati restano nel tempo.",
      },
      {
        id: "meccanismo",
        testo:
          "Qual è il tuo MECCANISMO? Il “come” unico con cui mantieni la promessa — il tuo metodo, anche se non ha ancora un nome.",
        tipo: "textarea",
        obbligatoria: true,
        placeholder:
          "Es. 3 fasi: 1) sblocco mentale col cibo, 2) piano flessibile su misura, 3) accompagnamento settimanale per la costanza.",
      },
      {
        id: "meccanismo_nome",
        testo: "Il tuo metodo/meccanismo ha già un nome? Se sì quale. Se no, descrivilo in 3 passaggi.",
        tipo: "text",
        obbligatoria: false,
        placeholder: "Es. “Metodo Equilibrio” — oppure: Sblocco → Piano flessibile → Costanza guidata.",
      },
    ],
  },
  {
    id: "B_inventario",
    chiave: "B",
    titolo: "Cosa vendi davvero",
    emoji: "🧾",
    intro: "L'inventario onesto di tutto ciò che offri oggi.",
    domande: [
      {
        id: "inventario",
        testo: "Elenca TUTTO quello che vendi oggi: nome, cosa include, prezzo, durata/formato.",
        tipo: "textarea",
        obbligatoria: true,
        placeholder:
          "Es. Ebook ricette 27€ · Consulenza singola 80€ · Percorso 1:1 di 3 mesi 600€ (call + piano + chat).",
      },
      {
        id: "top_fatturato_margine",
        testo: "Qual è il prodotto/servizio che genera più fatturato? E quale ti dà più margine?",
        tipo: "text",
        obbligatoria: true,
        placeholder: "Es. Più fatturato: il percorso 1:1. Più margine: l'ebook (costo quasi zero).",
      },
      {
        id: "smettere",
        testo: "C'è qualcosa che vendi ma che vorresti smettere di vendere? Perché?",
        tipo: "text",
        obbligatoria: false,
        placeholder: "Es. le consulenze singole: portano via tempo e non danno risultati duraturi.",
      },
    ],
  },
  {
    id: "C_scala",
    chiave: "C",
    titolo: "La scala di valore",
    emoji: "🪜",
    intro:
      "Come il cliente entra nel tuo mondo e come sale di livello. Una scala: dal gradino più basso (facile dire sì) al più alto (massimo valore e prezzo).",
    domande: [
      {
        id: "scala_ingresso",
        testo:
          "Qual è il PRIMO passo, il punto d'ingresso più facile per un nuovo cliente? (gratuito o a basso prezzo)",
        tipo: "textarea",
        obbligatoria: true,
        placeholder: "Es. una guida gratuita “3 colazioni che saziano” in cambio dell'email.",
      },
      {
        id: "scala_mezzo",
        testo: "Qual è l'offerta di mezzo — il prodotto/servizio principale dove sta il grosso del valore?",
        tipo: "textarea",
        obbligatoria: true,
        placeholder: "Es. il percorso 1:1 di 3 mesi a 600€.",
      },
      {
        id: "scala_alto",
        testo:
          "Qual è il gradino più ALTO? L'offerta premium per i clienti migliori. (se non ce l'hai, scrivi “non ancora”)",
        tipo: "textarea",
        obbligatoria: true,
        placeholder: "Es. non ancora — oppure: percorso annuale VIP con supporto prioritario.",
      },
      {
        id: "scala_salita",
        testo:
          "Come fa oggi un cliente a salire da un gradino all'altro? È un percorso intenzionale o capita a caso?",
        tipo: "textarea",
        obbligatoria: true,
        placeholder: "Es. capita a caso: chi compra l'ebook a volte chiede il percorso, ma non lo propongo io.",
      },
      {
        id: "scala_chi_entra",
        testo: "Chi entra dove? Quale avatar entra da quale gradino della scala? (collega con la scheda Avatar)",
        tipo: "textarea",
        obbligatoria: true,
        placeholder: "Es. le neo-mamme entrano dalla guida gratuita; chi è più decisa va dritta al percorso 1:1.",
      },
    ],
  },
  {
    id: "D_prezzo",
    chiave: "D",
    titolo: "Prezzo e posizionamento",
    emoji: "🏷️",
    intro: "Quanto chiedi e come lo giustifichi.",
    domande: [
      {
        id: "prezzo_come",
        testo: "Come arrivi ai tuoi prezzi oggi? (a sensazione, guardando i competitor, sui costi, sul valore…)",
        tipo: "textarea",
        obbligatoria: true,
        placeholder: "Es. a sensazione, guardando cosa fanno le altre nutrizioniste su Instagram.",
      },
      {
        id: "prezzo_posizione",
        testo:
          "Ti senti posizionato come l'opzione economica, media o premium del tuo mercato? Dove VORRESTI essere?",
        tipo: "text",
        obbligatoria: true,
        placeholder: "Es. oggi media; vorrei essere percepita come premium di fascia accessibile.",
      },
      {
        id: "prezzo_aumenti",
        testo: "Hai mai alzato i prezzi? Cosa è successo? Cosa ti frena dall'alzarli (ancora)?",
        tipo: "text",
        obbligatoria: false,
        placeholder:
          "Es. una volta, da 450 a 600€: nessuno si è lamentato. Mi frena la paura di perdere clienti.",
      },
    ],
  },
  {
    id: "E_visione",
    chiave: "E",
    titolo: "Strategia e visione dell'offerta",
    emoji: "🔭",
    intro: "Dove vuoi portare la tua offerta nei prossimi mesi.",
    domande: [
      {
        id: "visione_una_cosa",
        testo: "Se potessi vendere UNA cosa sola e basta nei prossimi 6 mesi, quale sarebbe e perché?",
        tipo: "textarea",
        obbligatoria: true,
        placeholder: "Es. il percorso 1:1: è dove do più valore e ho i risultati migliori.",
      },
      {
        id: "visione_manca",
        testo: "Cosa manca oggi nella tua offerta perché diventi davvero irresistibile per il tuo avatar?",
        tipo: "textarea",
        obbligatoria: true,
        placeholder: "Es. una garanzia chiara e una community di supporto tra le clienti.",
      },
      {
        id: "visione_garanzie",
        testo: "Hai garanzie, bonus o elementi che riducono il rischio percepito dal cliente? Quali?",
        tipo: "text",
        obbligatoria: false,
        placeholder: "Es. prima call gratuita e «se nel primo mese non ti trovi, ti rimborso».",
      },
      {
        id: "visione_legame_comunicazione",
        testo:
          "Come si lega la tua offerta alla tua comunicazione? I tuoi contenuti portano naturalmente verso ciò che vendi, o sono scollegati?",
        tipo: "textarea",
        obbligatoria: true,
        placeholder:
          "Es. scollegati: faccio reel di ricette ma non parlo mai del percorso né della trasformazione.",
      },
    ],
  },
];
