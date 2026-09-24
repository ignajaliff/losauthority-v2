/**
 * Definizioni MINIME delle 3 schede (mirror di src/lib/onboarding/schema.ts,
 * src/lib/questionnaires/avatar.ts e offerta.ts del sistema precedente):
 * solo id stabile → etichetta, raggruppati per sezione, più le opzioni dei
 * menu (valore → etichetta) e l'unità dei numeri. Niente UI: servono a
 * formattare le risposte come "materiale" per i prompt di Aura.
 */

export type QuestionarioId = "onboarding" | "avatar_dolori" | "offerta";

export interface Campo {
  id: string;
  label: string;
  /** "file" = allegati: mai nel materiale. "numero" = con unità. */
  tipo?: "file" | "numero";
  unita?: string;
  /** Menu / multiselect: valore salvato → etichetta leggibile. */
  opzioni?: Record<string, string>;
}

export interface Sezione {
  titolo: string;
  campi: Campo[];
}

export const TITOLI: Record<QuestionarioId, string> = {
  onboarding: "Onboarding (scheda 1 di 3)",
  avatar_dolori: "Avatar & Dolori (scheda 2 di 3)",
  offerta: "Offerta (scheda 3 di 3)",
};

const ORE = "h / sett.";

export const SEZIONI: Record<QuestionarioId, Sezione[]> = {
  onboarding: [
    { titolo: "Il tuo business", campi: [
      { id: "business_descrizione", label: "Cosa fai, per chi, da quanto tempo? Come ti presenteresti a un nuovo socio in 2 minuti." },
      { id: "offerta_attuale", label: "Cosa vendi oggi, a che prezzo, com'è strutturato?" },
      { id: "fatturato_mensile", label: "Fatturato medio mensile degli ultimi 6 mesi.", opzioni: { "<1k": "Meno di 1.000€", "1-3k": "1.000 – 3.000€", "3-5k": "3.000 – 5.000€", "5-10k": "5.000 – 10.000€", "10k+": "Oltre 10.000€" } },
      { id: "vendita_processo", label: "Come trasformi un contatto in cliente, oggi? Raccontami l'ultimo cliente chiuso, dal primo messaggio alla firma. E su 10 persone interessate, quante comprano?" },
    ] },
    { titolo: "I tuoi clienti", campi: [
      { id: "provenienza_clienti", label: "I tuoi ultimi 5 clienti: da dove sono arrivati?", opzioni: { referral: "Passaparola / referral", instagram: "Instagram", linkedin: "LinkedIn", eventi: "Eventi" } },
      { id: "cliente_migliore", label: "Il cliente che ti ha dato più soddisfazione negli ultimi 12 mesi: chi è, cosa cercava, cosa ha ottenuto." },
      { id: "anti_cliente", label: "Che tipo di clienti NON vuoi più?" },
      { id: "messaggi_tipici", label: "Incolla 2-3 messaggi tipici che ricevi dai clienti (le parole esatte)." },
    ] },
    { titolo: "La tua comunicazione oggi — la diagnosi", campi: [
      { id: "dove_si_blocca", label: "Dove si blocca, oggi?", opzioni: { poche_views: "Pubblico, ma faccio poche visualizzazioni", no_dm: "Le views ci sono, ma quasi nessuno mi scrive", no_acquisti: "Mi scrivono, ma pochi comprano", clienti_sbagliati: "Vendo, ma a clienti sbagliati o prezzi troppo bassi" } },
      { id: "auto_diagnosi", label: "Comunichi da tempo, ma i risultati non sono quelli che speravi. Secondo te, perché?" },
      { id: "profili_social", label: "Link ai tuoi profili social" },
      { id: "follower_e_views", label: "Follower, views medie degli ultimi 30 giorni e quanti contenuti pubblichi a settimana?" },
      { id: "contenuti_top", label: "I 3 tuoi contenuti che hanno funzionato meglio (link o descrizione)." },
      { id: "comfort_camera", label: "Quanto sei a tuo agio davanti alla camera, da 1 a 5? Hai vincoli? (metterci la faccia, la voce, privacy legata al tuo lavoro...)" },
      { id: "tentativi_passati", label: "Cosa hai già provato per farti conoscere online e quanto hai investito, circa? Com'è andata? (corsi, agenzie, ads, ecc.)" },
      { id: "riferimenti", label: "2-3 creator/professionisti la cui comunicazione ami." },
    ] },
    { titolo: "La mappa del tuo tempo", campi: [
      { id: "ore_idee", label: "Trovare idee per i contenuti", tipo: "numero", unita: ORE },
      { id: "ore_scrittura", label: "Scrivere contenuti (script, caption, post)", tipo: "numero", unita: ORE },
      { id: "ore_riprese", label: "Registrare / creare video", tipo: "numero", unita: ORE },
      { id: "ore_editing", label: "Editing video", tipo: "numero", unita: ORE },
      { id: "ore_pubblicazione", label: "Programmare e pubblicare", tipo: "numero", unita: ORE },
      { id: "ore_dm", label: "Rispondere a DM e commenti", tipo: "numero", unita: ORE },
      { id: "ore_clienti", label: "Call e lavoro con i clienti", tipo: "numero", unita: ORE },
      { id: "ore_admin", label: "Admin (fatture, email, organizzazione)", tipo: "numero", unita: ORE },
      { id: "attivita_odiata", label: "Di queste attività, quale odi di più? E quale non delegheresti mai?" },
    ] },
    { titolo: "Tu e l'IA", campi: [
      { id: "strumenti_ia", label: "Quali strumenti IA usi oggi e per cosa?" },
      { id: "abbonamenti", label: "Abbonamenti attivi.", opzioni: { chatgpt: "ChatGPT", claude: "Claude", canva: "Canva", capcut: "CapCut", nessuno: "Nessuno" } },
      { id: "dispositivo", label: "Da che dispositivo lavori principalmente?", opzioni: { mac: "Mac", windows: "Windows", telefono: "Soprattutto telefono" } },
    ] },
    { titolo: "Obiettivi e percorso", campi: [
      { id: "obiettivo_6_mesi", label: "Cosa vuoi che cambi nei prossimi 6 mesi? Qualcosa che ti farebbe dire \"ne è valsa la pena\" (avere un sistema che ti aiuta, chiudere più clienti, più visibilità...)." },
      { id: "competenza_desiderata", label: "Se dovessi scegliere, quale cosa concreta vorresti imparare a fare dopo il percorso?" },
      { id: "cosa_evitare", label: "Cosa vuoi EVITARE mentre cresci?" },
      { id: "perche_adesso", label: "Perché proprio adesso?" },
      { id: "disponibilita", label: "Quante ore a settimana puoi dedicare al percorso, realisticamente? E quali giorni e fasce orarie preferisci per le 4 call?" },
    ] },
    { titolo: "Materiali", campi: [
      { id: "allegati", label: "Presentazione della tua offerta, brand kit, o qualsiasi documento utile a Wesley.", tipo: "file" },
    ] },
  ],
  avatar_dolori: [
    { titolo: "Chi è il tuo avatar", campi: [
      { id: "avatar_descrizione", label: "Descrivi il tuo cliente ideale come se fosse una persona sola: chi è, che lavoro fa, che età, in che momento della sua vita/business si trova." },
      { id: "avatar_priorita", label: "Hai più di un avatar? Elencali in ordine di priorità e di' a quale vuoi parlare di più nei prossimi 6 mesi." },
      { id: "avatar_cliente_migliore", label: "Il cliente che ti ha dato più soddisfazione negli ultimi 12 mesi: chi è, cosa cercava, cosa ha ottenuto." },
      { id: "avatar_anti", label: "Che tipo di clienti NON vuoi più? (e perché)" },
    ] },
    { titolo: "La voce del tuo avatar", campi: [
      { id: "voce_messaggi", label: "Incolla 2-3 messaggi tipici che ricevi dai clienti (le parole esatte: DM, email, WhatsApp)." },
      { id: "voce_problema_soluzione", label: "Come descrivono il loro problema con parole loro? E come descrivono la soluzione che vorrebbero?" },
      { id: "voce_frasi", label: "Quali frasi senti ripetere più spesso, in call o nei messaggi?" },
    ] },
    { titolo: "I dolori", campi: [
      { id: "dolore_esterno", label: "DOLORE ESTERNO — il problema pratico e visibile che il cliente direbbe ad alta voce." },
      { id: "dolore_interno", label: "DOLORE INTERNO — come lo fa sentire quel problema. L'emozione sotto." },
      { id: "dolore_radice", label: "DOLORE RADICE — la paura o convinzione profonda da cui nasce tutto." },
      { id: "dolore_tentativi", label: "Cosa ha già provato il tuo avatar per risolvere, prima di arrivare a te? Perché non ha funzionato?" },
      { id: "dolore_inazione", label: "Cosa succede nella sua vita/business se NON risolve? (il costo dell'inazione)" },
    ] },
    { titolo: "Desideri e trasformazione", campi: [
      { id: "desiderio_risultato", label: "Qual è il risultato concreto che il tuo avatar sogna di ottenere? (in numeri o fatti, non aggettivi)" },
      { id: "desiderio_sentire", label: "Oltre al risultato pratico, come vuole SENTIRSI? Come vuole essere visto dagli altri?" },
      { id: "desiderio_trasformazione", label: "Qual è la trasformazione in una frase: da [come sta ora] a [come starà dopo aver lavorato con te]?" },
    ] },
    { titolo: "Obiezioni e fiducia", campi: [
      { id: "obiezioni", label: "Quali sono le 3 obiezioni più frequenti che senti prima dell'acquisto? (prezzo, tempo, “funziona per me?”…)" },
      { id: "fiducia_scatto", label: "Cosa fa scattare la fiducia nei tuoi confronti? Cosa li convince che TU sei la persona giusta?" },
      { id: "fiducia_must", label: "Cosa NON deve mai mancare nella tua comunicazione perché si fidino? (prove, testimonianze, modo di parlare…)" },
    ] },
  ],
  offerta: [
    { titolo: "La promessa unica", campi: [
      { id: "promessa", label: "In una frase: a CHI fai ottenere COSA, in quanto tempo? (la tua promessa, il più concreta possibile)" },
      { id: "differenza", label: "Cosa rende la tua promessa diversa da quella dei concorrenti? Perché un cliente dovrebbe scegliere te e non un altro?" },
      { id: "meccanismo", label: "Qual è il tuo MECCANISMO? Il “come” unico con cui mantieni la promessa — il tuo metodo, anche se non ha ancora un nome." },
      { id: "meccanismo_nome", label: "Il tuo metodo/meccanismo ha già un nome? Se sì quale. Se no, descrivilo in 3 passaggi." },
    ] },
    { titolo: "Cosa vendi davvero", campi: [
      { id: "inventario", label: "Elenca TUTTO quello che vendi oggi: nome, cosa include, prezzo, durata/formato." },
      { id: "top_fatturato_margine", label: "Qual è il prodotto/servizio che genera più fatturato? E quale ti dà più margine?" },
      { id: "smettere", label: "C'è qualcosa che vendi ma che vorresti smettere di vendere? Perché?" },
    ] },
    { titolo: "La scala di valore", campi: [
      { id: "scala_ingresso", label: "Qual è il PRIMO passo, il punto d'ingresso più facile per un nuovo cliente? (gratuito o a basso prezzo)" },
      { id: "scala_mezzo", label: "Qual è l'offerta di mezzo — il prodotto/servizio principale dove sta il grosso del valore?" },
      { id: "scala_alto", label: "Qual è il gradino più ALTO? L'offerta premium per i clienti migliori. (se non ce l'hai, scrivi “non ancora”)" },
      { id: "scala_salita", label: "Come fa oggi un cliente a salire da un gradino all'altro? È un percorso intenzionale o capita a caso?" },
      { id: "scala_chi_entra", label: "Chi entra dove? Quale avatar entra da quale gradino della scala? (collega con la scheda Avatar)" },
    ] },
    { titolo: "Prezzo e posizionamento", campi: [
      { id: "prezzo_come", label: "Come arrivi ai tuoi prezzi oggi? (a sensazione, guardando i competitor, sui costi, sul valore…)" },
      { id: "prezzo_posizione", label: "Ti senti posizionato come l'opzione economica, media o premium del tuo mercato? Dove VORRESTI essere?" },
      { id: "prezzo_aumenti", label: "Hai mai alzato i prezzi? Cosa è successo? Cosa ti frena dall'alzarli (ancora)?" },
    ] },
    { titolo: "Strategia e visione dell'offerta", campi: [
      { id: "visione_una_cosa", label: "Se potessi vendere UNA cosa sola e basta nei prossimi 6 mesi, quale sarebbe e perché?" },
      { id: "visione_manca", label: "Cosa manca oggi nella tua offerta perché diventi davvero irresistibile per il tuo avatar?" },
      { id: "visione_garanzie", label: "Hai garanzie, bonus o elementi che riducono il rischio percepito dal cliente? Quali?" },
      { id: "visione_legame_comunicazione", label: "Come si lega la tua offerta alla tua comunicazione? I tuoi contenuti portano naturalmente verso ciò che vendi, o sono scollegati?" },
    ] },
  ],
};

/** id → etichetta, per scheda (derivato dalle sezioni: una sola fonte). */
export const DOMANDE: Record<QuestionarioId, Record<string, string>> = {
  onboarding: {},
  avatar_dolori: {},
  offerta: {},
};
for (const q of Object.keys(SEZIONI) as QuestionarioId[]) {
  for (const s of SEZIONI[q]) for (const c of s.campi) DOMANDE[q][c.id] = c.label;
}

export function eQuestionarioId(v: unknown): v is QuestionarioId {
  return v === "onboarding" || v === "avatar_dolori" || v === "offerta";
}

export function testoDomanda(q: QuestionarioId | null, domandaId: string): string | null {
  if (!q || !domandaId) return null;
  return DOMANDE[q][domandaId] ?? null;
}
