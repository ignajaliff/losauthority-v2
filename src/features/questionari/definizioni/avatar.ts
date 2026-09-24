import type { Sezione } from "../types";

/**
 * Scheda 2 — Avatar & Dolori (Los Authority).
 * Alimenta su Notion le pagine 🎯 Avatar e 🩸 Dolori (+ tono di voce).
 */
export const AVATAR_SEZIONI: Sezione[] = [
  {
    id: "A_chi",
    chiave: "A",
    titolo: "Chi è il tuo avatar",
    emoji: "🎯",
    intro:
      "La fotografia del cliente ideale. Concreto, non demografia da manuale. Suggerimento: pensa a UNA persona reale — “Marco, 38 anni, dentista con studio avviato” funziona meglio di “i professionisti”.",
    domande: [
      {
        id: "avatar_descrizione",
        testo:
          "Descrivi il tuo cliente ideale come se fosse una persona sola: chi è, che lavoro fa, che età, in che momento della sua vita/business si trova.",
        tipo: "textarea",
        obbligatoria: true,
        placeholder:
          "Es. Giulia, 34 anni, ha appena avuto un figlio, vuole rimettersi in forma ma è terrorizzata dalle diete punitive che ha già fatto…",
      },
      {
        id: "avatar_priorita",
        testo:
          "Hai più di un avatar? Elencali in ordine di priorità e di' a quale vuoi parlare di più nei prossimi 6 mesi.",
        tipo: "textarea",
        obbligatoria: true,
        placeholder:
          "Es. 1) neo-mamme (priorità) 2) donne 40+ in menopausa 3) sportive amatoriali. Nei prossimi 6 mesi parlo soprattutto alle neo-mamme.",
      },
      {
        id: "avatar_cliente_migliore",
        testo:
          "Il cliente che ti ha dato più soddisfazione negli ultimi 12 mesi: chi è, cosa cercava, cosa ha ottenuto.",
        tipo: "textarea",
        obbligatoria: true,
        placeholder:
          "Es. Giulia: voleva perdere peso dopo la gravidanza senza ossessionarsi col cibo. In 4 mesi -9kg e ha smesso di fare la fame. Mi ha portato 3 amiche.",
      },
      {
        id: "avatar_anti",
        testo: "Che tipo di clienti NON vuoi più? (e perché)",
        tipo: "textarea",
        obbligatoria: true,
        placeholder:
          "Es. Quelle che cercano la dieta-lampo per l'estate e mollano dopo due settimane: non ottengono risultati e mi prosciugano l'energia.",
      },
    ],
  },
  {
    id: "B_voce",
    chiave: "B",
    titolo: "La voce del tuo avatar",
    emoji: "💬",
    intro:
      "Le parole esatte che usano i tuoi clienti. Non parafrasare: copia-incolla il modo in cui parlano. Questa è la materia prima del tuo copy.",
    domande: [
      {
        id: "voce_messaggi",
        testo: "Incolla 2-3 messaggi tipici che ricevi dai clienti (le parole esatte: DM, email, WhatsApp).",
        tipo: "textarea",
        obbligatoria: true,
        placeholder:
          "Es. «Ciao, ma funziona davvero senza togliere i carboidrati?» · «Ho già provato di tutto, ho perso le speranze» · «Quanto costa il percorso?»",
      },
      {
        id: "voce_problema_soluzione",
        testo:
          "Come descrivono il loro problema con parole loro? E come descrivono la soluzione che vorrebbero?",
        tipo: "textarea",
        obbligatoria: true,
        placeholder:
          "Es. Problema: «non riesco a essere costante». Soluzione che vorrebbero: «qualcuno che mi segua passo passo senza farmi sentire in colpa».",
      },
      {
        id: "voce_frasi",
        testo: "Quali frasi senti ripetere più spesso, in call o nei messaggi?",
        tipo: "textarea",
        obbligatoria: false,
        placeholder: "Es. «ho già provato di tutto», «non ho tempo», «con me non funziona niente»",
      },
    ],
  },
  {
    id: "C_dolori",
    chiave: "C",
    titolo: "I dolori",
    emoji: "🩸",
    intro:
      "Distinguiamo i livelli del dolore. Esterno = quello che il cliente racconta. Interno = come lo fa sentire. Radice = la causa vera, spesso nascosta. Più scendi, più la comunicazione diventa potente.",
    domande: [
      {
        id: "dolore_esterno",
        testo: "DOLORE ESTERNO — il problema pratico e visibile che il cliente direbbe ad alta voce.",
        tipo: "textarea",
        obbligatoria: true,
        placeholder: "Es. «non riesco a perdere peso anche se mangio poco»",
      },
      {
        id: "dolore_interno",
        testo: "DOLORE INTERNO — come lo fa sentire quel problema. L'emozione sotto.",
        tipo: "textarea",
        obbligatoria: true,
        placeholder: "Es. «mi sento sbagliata e fuori controllo, mi vergogno del mio corpo»",
      },
      {
        id: "dolore_radice",
        testo: "DOLORE RADICE — la paura o convinzione profonda da cui nasce tutto.",
        tipo: "textarea",
        obbligatoria: true,
        placeholder: "Es. «forse il mio corpo è rotto e non cambierà mai»",
      },
      {
        id: "dolore_tentativi",
        testo:
          "Cosa ha già provato il tuo avatar per risolvere, prima di arrivare a te? Perché non ha funzionato?",
        tipo: "textarea",
        obbligatoria: true,
        placeholder:
          "Es. Diete fai-da-te e app conta-calorie: troppo rigide, le mollava dopo 2 settimane sentendosi una fallita.",
      },
      {
        id: "dolore_inazione",
        testo: "Cosa succede nella sua vita/business se NON risolve? (il costo dell'inazione)",
        tipo: "text",
        obbligatoria: true,
        placeholder: "Es. continua a evitare specchi e foto, salta eventi, l'autostima cala ancora.",
      },
    ],
  },
  {
    id: "D_desideri",
    chiave: "D",
    titolo: "Desideri e trasformazione",
    emoji: "✨",
    intro: "L'altra faccia del dolore: dove vuole arrivare il tuo avatar.",
    domande: [
      {
        id: "desiderio_risultato",
        testo:
          "Qual è il risultato concreto che il tuo avatar sogna di ottenere? (in numeri o fatti, non aggettivi)",
        tipo: "textarea",
        obbligatoria: true,
        placeholder:
          "Es. rientrare nei jeans di prima della gravidanza in 4 mesi, senza rinunciare alla pizza del sabato.",
      },
      {
        id: "desiderio_sentire",
        testo: "Oltre al risultato pratico, come vuole SENTIRSI? Come vuole essere visto dagli altri?",
        tipo: "textarea",
        obbligatoria: true,
        placeholder:
          "Es. di nuovo in controllo, leggera, fiera; vista come una mamma che si è ripresa la sua vita.",
      },
      {
        id: "desiderio_trasformazione",
        testo:
          "Qual è la trasformazione in una frase: da [come sta ora] a [come starà dopo aver lavorato con te]?",
        tipo: "text",
        obbligatoria: true,
        placeholder: "Es. da «a dieta perenne e sempre in colpa» a «mangio con serenità e mi piaccio».",
      },
    ],
  },
  {
    id: "E_obiezioni",
    chiave: "E",
    titolo: "Obiezioni e fiducia",
    emoji: "🤝",
    intro: "Cosa frena il tuo avatar dal comprare, e cosa lo rassicura.",
    domande: [
      {
        id: "obiezioni",
        testo:
          "Quali sono le 3 obiezioni più frequenti che senti prima dell'acquisto? (prezzo, tempo, “funziona per me?”…)",
        tipo: "textarea",
        obbligatoria: true,
        placeholder:
          "Es. 1) «costa troppo» 2) «non ho tempo di cucinare» 3) «con me non ha mai funzionato niente».",
      },
      {
        id: "fiducia_scatto",
        testo:
          "Cosa fa scattare la fiducia nei tuoi confronti? Cosa li convince che TU sei la persona giusta?",
        tipo: "textarea",
        obbligatoria: true,
        placeholder:
          "Es. i risultati reali delle clienti, il fatto che non demonizzo nessun cibo, il mio tono senza giudizio.",
      },
      {
        id: "fiducia_must",
        testo:
          "Cosa NON deve mai mancare nella tua comunicazione perché si fidino? (prove, testimonianze, modo di parlare…)",
        tipo: "text",
        obbligatoria: false,
        placeholder: "Es. testimonianze con foto prima/dopo e un tono empatico, mai colpevolizzante.",
      },
    ],
  },
];
