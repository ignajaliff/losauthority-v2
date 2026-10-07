import type { Tables } from "@/integrations/supabase/types";

/** Un'offerta del cliente: la carta (fronte) + tutta la struttura costruita con Aura. */
export type Offerta = Tables<"offerta">;
/** Un messaggio della conversazione che costruisce un'offerta (cliente o Aura). */
export type MessaggioOfferta = Tables<"offerta_messaggi">;
/** La lettura di Aura per Wesley su un'offerta: la legge solo il team. */
export type DiagnosiOfferta = Tables<"offerta_diagnosi">;

/** Frasi di stato mentre Aura legge e costruisce la proposta. */
export const FASI_OFFERTA = [
  "Rileggo quello che vendi oggi…",
  "Applico l'equazione del valore…",
  "Costruisco la proposta…",
  "Controllo che regga con la tua credibilità e il tuo tempo…",
  "Ancora un attimo…",
] as const;

export const ETICHETTA_POSIZIONAMENTO: Record<string, string> = {
  low_ticket: "Low ticket",
  mid_ticket: "Mid ticket",
  high_ticket: "High ticket",
};

/** Numero di serie sulla carta: OF-0001, OF-0002… (posizione dell'offerta tra quelle del cliente). */
export const codiceOfferta = (numero: number) => `OF-${String(numero).padStart(4, "0")}`;

/** I campi del fronte della carta, per contare quanto è compilata. */
const CAMPI_CARTA = ["nome", "per_chi", "trasformazione", "prezzo", "posizionamento", "tipo", "garanzia", "scala_entrata"] as const;

export function campiCompilati(o: Offerta): { fatti: number; totale: number } {
  const fatti = CAMPI_CARTA.filter((k) => {
    const v = o[k];
    return typeof v === "string" && v.trim().length > 0;
  }).length;
  return { fatti, totale: CAMPI_CARTA.length };
}

/** Una voce della struttura: etichetta + testo oppure elenco. */
export interface VoceOfferta {
  etichetta: string;
  testo?: string | null;
  lista?: string[];
  /** Le voci "a → b" si rendono con la freccia in evidenza. */
  freccia?: boolean;
  corsivo?: boolean;
}

export interface SezioneOfferta {
  titolo: string;
  voci: VoceOfferta[];
}

const haValore = (v: VoceOfferta) => (v.lista ? v.lista.length > 0 : !!v.testo?.trim());

/** Nome di colonna → etichetta leggibile: Aura mette in da_confermare i nomi dei campi. */
const ETICHETTA_CAMPO: Record<string, string> = {
  nome: "Nome dell'offerta",
  per_chi: "Per chi",
  trasformazione: "Trasformazione",
  prezzo: "Prezzo",
  posizionamento: "Posizionamento",
  tipo: "Cos'è",
  frase_presentazione: "Come ti presenti",
  snapshot: "In ascensore",
  lettura: "Lettura di partenza",
  stato_partenza: "Stato di partenza",
  modello_prezzo_attuale: "Modello di prezzo attuale",
  prove: "Prove",
  buchi_credibilita: "Buchi di credibilità",
  ostacoli_soluzioni: "Ostacoli → soluzioni",
  stack: "Stack",
  erogazione: "Erogazione",
  valore_risultato: "Valore del risultato",
  riferimenti_mercato: "Riferimenti di mercato",
  ancora: "Ancora",
  ragionamento_prezzo: "Ragionamento del prezzo",
  prezzo_precedente: "Prezzo precedente",
  unita: "Unità",
  incluso: "Incluso",
  non_incluso: "Non incluso",
  rischio: "Chi porta il rischio",
  permanenza_uscita: "Permanenza e uscita",
  clienti_attuali: "Clienti attuali",
  scala_gratis: "Scala · gratis",
  scala_entrata: "Scala · entrata",
  scala_cuore: "Scala · cuore",
  scala_vetta: "Scala · vetta",
  garanzia: "Garanzia",
  bonus: "Bonus",
  scarsita_urgenza: "Scarsità e urgenza",
  nomi_alternativi: "Nomi alternativi",
  obiezioni_risposte: "Obiezioni → risposta",
  piano_validazione: "Piano di validazione",
};

const leggibile = (voce: string) => ETICHETTA_CAMPO[voce] ?? voce;

/**
 * La struttura dell'offerta in sezioni, nell'ordine della scheda del metodo.
 * Una sola fonte per la carta a schermo, la vista del team e il PDF: le
 * sezioni senza nemmeno una voce compilata non si mostrano.
 */
export function sezioniOfferta(o: Offerta): SezioneOfferta[] {
  const tutte: SezioneOfferta[] = [
    {
      titolo: "Lettura di partenza",
      voci: [{ etichetta: "Dov'è forte, dov'è debole, cosa regge oggi", testo: o.lettura }],
    },
    {
      titolo: "Inquadramento",
      voci: [
        { etichetta: "Stato di partenza", testo: o.stato_partenza },
        { etichetta: "Modello di prezzo attuale", testo: o.modello_prezzo_attuale },
        { etichetta: "Prove in mano", lista: o.prove },
        { etichetta: "Buchi di credibilità", lista: o.buchi_credibilita },
      ],
    },
    {
      titolo: "Ostacoli → soluzioni",
      voci: [{ etichetta: "Cosa si mette tra il cliente e il risultato, e cosa fa l'offerta", lista: o.ostacoli_soluzioni, freccia: true }],
    },
    {
      titolo: "Lo stack",
      voci: [
        { etichetta: "I componenti, nominati", lista: o.stack },
        { etichetta: "Erogazione", testo: o.erogazione },
      ],
    },
    {
      titolo: "Il prezzo",
      voci: [
        { etichetta: "Valore del risultato", testo: o.valore_risultato },
        { etichetta: "Ancora", testo: o.ancora },
        { etichetta: "Riferimenti di mercato", lista: o.riferimenti_mercato },
        { etichetta: "Perché questo prezzo", testo: o.ragionamento_prezzo },
        { etichetta: "Prezzo precedente", testo: o.prezzo_precedente },
      ],
    },
    {
      titolo: "I bordi",
      voci: [
        { etichetta: "Unità", testo: o.unita },
        { etichetta: "Incluso", lista: o.incluso },
        { etichetta: "Non incluso", lista: o.non_incluso },
        { etichetta: "Chi porta il rischio", testo: o.rischio },
        { etichetta: "Permanenza e uscita", testo: o.permanenza_uscita },
        { etichetta: "Clienti attuali", testo: o.clienti_attuali },
      ],
    },
    {
      titolo: "La scala",
      voci: [
        { etichetta: "Gratis", testo: o.scala_gratis },
        { etichetta: "Entrata", testo: o.scala_entrata },
        { etichetta: "Cuore", testo: o.scala_cuore },
        { etichetta: "Vetta", testo: o.scala_vetta },
      ],
    },
    {
      titolo: "I potenziatori",
      voci: [
        { etichetta: "Garanzia", testo: o.garanzia },
        { etichetta: "Bonus", lista: o.bonus },
        { etichetta: "Scarsità e urgenza", testo: o.scarsita_urgenza },
        { etichetta: "Nomi alternativi", lista: o.nomi_alternativi, corsivo: true },
      ],
    },
    {
      titolo: "Obiezioni → risposta",
      voci: [{ etichetta: "Ogni obiezione e il pezzo dell'offerta che la disinnesca", lista: o.obiezioni_risposte, freccia: true }],
    },
    {
      titolo: "Prova di mercato",
      voci: [{ etichetta: "Le prossime 5 demo", testo: o.piano_validazione }],
    },
    {
      titolo: "Da confermare",
      voci: [{ etichetta: "Proposte di Aura ancora da confermare con Wesley", lista: o.da_confermare.map(leggibile) }],
    },
  ];
  return tutte.map((s) => ({ ...s, voci: s.voci.filter(haValore) })).filter((s) => s.voci.length > 0);
}

/** La struttura ha qualcosa da mostrare oltre al fronte? */
export const haStruttura = (o: Offerta): boolean => sezioniOfferta(o).length > 0;

const senzaAccenti = (t: string) => t.normalize("NFD").replace(/[̀-ͯ]/g, "");

/** La riga "codice" in fondo alla carta, come sul retro di un documento: NOME<<PREZZO<<MID<TICKET<<<<< */
export function rigaCodice(o: Offerta): string {
  const pezzi = [o.nome, o.prezzo, o.posizionamento?.replace("_", " ")]
    .filter((v): v is string => !!v && v.trim().length > 0)
    .map((v) => senzaAccenti(v).toUpperCase().replace(/[^A-Z0-9]+/g, "<").replace(/^<+|<+$/g, "").slice(0, 22));
  const testo = pezzi.length > 0 ? pezzi.join("<<") : "OFFERTA<IN<COSTRUZIONE";
  return testo.padEnd(44, "<").slice(0, 44);
}
