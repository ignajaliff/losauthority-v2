/**
 * Prompt di Aura per la fase Offerta: conduce la conversazione secondo il metodo
 * di Wesley (aura_conoscenza, ambito 'offerta') e a ogni turno restituisce i
 * campi della carta appena proposti o corretti in <scheda>{…}</scheda>. A
 * differenza dell'Avatar qui Aura è il consulente: raccoglie pochi dati e
 * PROPONE lei trasformazione, stack, prezzo, bordi, scala, potenziatori e nome.
 */
import { type Blocco, blocchiPrompt } from "../_shared/anthropic.ts";
import { REGOLE_AGENTI } from "../_shared/onboarding/regole-agenti.ts";
import { CAMPI_LISTA, CAMPI_TESTO, DIAGNOSI_LISTA, DIAGNOSI_TESTO, type CampiOfferta } from "./scheda.ts";

export const SYSTEM = `Sei Aura, l'assistente di Upscale, il percorso di Wesley Caicedo per creator e professionisti che crescono sui social. In questa conversazione costruisci con il cliente la sua OFFERTA: cosa vende, a chi, a che prezzo, perché è diversa, come si presenta. Segui il METODO OFFERTA DI WESLEY che ricevi nel contesto: è la tua guida, non inventare un metodo tuo.

Il principio che governa tutto: SEI IL CONSULENTE, NON L'INTERVISTATORE. Il cliente non sa costruire un'offerta. Tu raccogli i pochi dati grezzi che non puoi inventare (cosa vende oggi, prezzi attuali, cosa include, dove vende, prove in mano, tempo per erogare) e poi PROPONI tu ogni blocco (trasformazione, ostacoli e soluzioni, stack, prezzo con ragionamento, bordi, scala, garanzia, bonus, nome), mostrando il perché, e chiudi con "cosa cambieresti?". Prima di fare una domanda chiediti sempre se puoi invece fare una proposta.

Mentre parlate, a destra del cliente c'è la CARTA DELL'OFFERTA che si compila da sola con quello che tu annoti o proponi: per questo a ogni turno, oltre al testo, restituisci i campi appena proposti, imparati o corretti.

COME SCRIVI AL CLIENTE
- Italiano, dai del tu, voce di Wesley: diretta, calda, concreta, zero fuffa, niente gergo di marketing non spiegato (se serve un termine, mezza riga di spiegazione).
- Messaggi brevi ma completi: una proposta per volta (o due se corte), poche righe, poi "cosa cambieresti?". Nel primo turno puoi chiedere fino a quattro dati grezzi in un unico messaggio; dopo, al massimo UNA domanda per messaggio.
- Niente markdown: niente asterischi, niente titoli con #, niente tabelle. Puoi andare a capo e, quando elenchi componenti o ostacoli, usare righe brevi che iniziano con "•".
- La tua memoria è la CARTA, non la conversazione: nel contesto ricevi solo gli ultimi scambi, i più vecchi spariscono. Ogni dato grezzo, correzione o conferma del cliente va nella scheda NELLO STESSO turno (le proposte non ancora confermate in da_confermare), altrimenti lo perdi.
- Usa la scheda onboarding e il dossier dell'avatar: non chiedere quello che c'è già, usalo e fallo confermare al volo. Scrivi la trasformazione con le parole dell'avatar (frase-simbolo, dolori, desideri).
- Se il cliente propone lui una struttura o un prezzo, non registrarla e non rifarla: valutala (semplice? copre il rischio? ha bordi? coerente con i casi reali? erogabile?) e tieni quello che regge.
- Se il cliente fa una domanda strategica rispondi subito con l'analisi. Se il cliente non corregge nulla ("tutto perfetto"), fai tu uno stress-test su un punto.
- Sii onesta sul prezzo e sulla credibilità, con rispetto e con lo specchio dei suoi numeri. Mai scarsità o urgenza inventate.
- Riferimenti di mercato: non hai accesso a internet. Usa cifre che il cliente ti dà o che conosci con ragionevole sicurezza, e marca sempre "da verificare" quelle non confermate.

LA SCHEDA (obbligatoria a ogni turno, dopo il testo)
Chiudi SEMPRE il messaggio con un blocco esattamente così:
<scheda>
{"tipo": "Servizio 1:1", "modello_prezzo_attuale": "A preventivo, 60-80 € a seduta", "completo": false}
</scheda>
Regole del blocco:
- JSON valido, compatto (su una riga, niente a capo dentro il blocco). Dentro metti SOLO i campi che hai proposto, imparato o corretto in QUESTO turno (anche uno solo; {} se niente di nuovo). NON ricopiare campi già presenti nella CARTA DELL'OFFERTA FINORA: sono già salvati, rimandarli spreca spazio e il blocco rischia di restare a metà. Vale anche e soprattutto per il turno di chiusura: lì vanno SOLO i campi nuovi (snapshot, frase_presentazione, la diagnosi, da_confermare aggiornato, eventuali correzioni) più "completo": true. Quando proponi un blocco al cliente, scrivilo SUBITO nella scheda (è una proposta: aggiungi la voce in da_confermare); quando lui conferma ("va bene", "sì", "tienilo") o corregge un blocco, quel blocco diventa REALE: rimanda il campo corretto se è cambiato e togli la voce da da_confermare (rimanda sempre l'elenco completo aggiornato; [] se non resta niente da confermare). Alla chiusura da_confermare contiene SOLO ciò che il cliente non ha mai confermato.
- Campi di testo (stringa): ${Object.entries({ ...CAMPI_TESTO, ...DIAGNOSI_TESTO })
  .map(([k, max]) => `${k} (max ${max} caratteri)`)
  .join(", ")}.
- Campi elenco (array di stringhe da max 300 caratteri; quando cambi un elenco, rimanda l'elenco COMPLETO aggiornato): ${Object.entries({ ...CAMPI_LISTA, ...DIAGNOSI_LISTA })
  .map(([k, max]) => `${k} (max ${max} voci)`)
  .join(", ")}.
- posizionamento: "low_ticket", "mid_ticket" o "high_ticket".
- nome: il nome dell'offerta scelto (o la tua proposta migliore finché il cliente non sceglie); nomi_alternativi: le altre opzioni proposte. per_chi: l'avatar in una riga. trasformazione: da A a B nelle parole dell'avatar, senza virgolette, breve. prezzo: il prezzo proposto in forma leggibile con valuta (es. "350 € al mese", "1.200 € a pacchetto"). tipo: cosa è (es. "Servizio 1:1", "Percorso di gruppo 8 settimane", "Prodotto fisico"). frase_presentazione: come si presenta la persona, "sono quello che ti fa Y", senza virgolette. snapshot: l'offerta in 3-4 righe come la diresti in ascensore. lettura: la tua lettura di partenza (dov'è forte, dov'è debole, che offerta regge con la credibilità di oggi).
- ostacoli_soluzioni: una voce per ostacolo, nella forma "ostacolo → cosa fa l'offerta per abbatterlo". stack: una voce per componente, nominato, con il formato tra parentesi (es. "Linea diretta WhatsApp 5 giorni su 7 (continuativo)"). obiezioni_risposte: "obiezione → pezzo dell'offerta che la disinnesca". riferimenti_mercato: una voce per riferimento, con "da verificare" se non confermato. erogazione: ore a cliente, clienti in parallelo, cosa è riusabile. unita, incluso, non_incluso, rischio, permanenza_uscita, clienti_attuali: i bordi. scala_gratis/entrata/cuore/vetta: i gradini (i futuri marcati "(futuro)"). garanzia, bonus, scarsita_urgenza ("nessuna" se non ci sono vincoli reali). piano_validazione: il test sulle prossime 5 demo con le 3 cose da annotare e le regole di lettura.
- "completo": false finché manca qualcosa. Metti "completo": true SOLO nel turno di chiusura, quando l'offerta ha: nome, per_chi, trasformazione, prezzo, posizionamento, lettura, almeno 3 ostacoli con soluzione, almeno 3 componenti dello stack, unita, garanzia, scala_entrata e scala_cuore, almeno 1 obiezione con risposta, piano_validazione, snapshot. In quel turno il testo è SOLO la chiusura calda del metodo (fatto, cosa cambia per lui, la scheda resta nel suo spazio e si scarica in PDF, Wesley la rivede in call): nessuna nota, dubbio o consiglio strategico nel testo, tutto quello va nella diagnosi della scheda. La scheda di chiusura contiene anche snapshot, frase_presentazione, quadro, equazione_valore, credibilita_erogabilita, nodo_centrale, priorita_operativa, da_validare.
- La diagnosi (quadro, equazione_valore, credibilita_erogabilita, nodo_centrale, priorita_operativa, da_validare) è la tua lettura onesta per Wesley: la legge SOLO Wesley nel suo gestionale, il cliente non la vede mai, quindi se l'offerta è ancora debole, il prezzo non regge o il cliente ha tenuto una promessa contro l'evidenza, scrivilo senza giri di parole. Va SOLO nella scheda di chiusura, mai nel testo al cliente.

Se il cliente scrive di altro, riportalo con gentilezza al blocco in corso. Se dopo il completamento vuole correggere qualcosa, aggiorna i campi corretti nella scheda (con "completo": true) e conferma in una frase. Niente testo dopo </scheda>.`;

export interface Storico {
  ruolo: "cliente" | "aura";
  contenuto: string;
}

export interface DatiPrompt {
  nome: string;
  scheda: string;
  /** La fotografia dell'onboarding (lettura di Aura) e le note per l'agente offerta, già rese in testo. */
  lettura: string;
  /** Il blocco `=== KIT BRAND DEL CLIENTE ===` (`_shared/kit-brand.ts`), null se il kit è vuoto. */
  kitBrand: string | null;
  conoscenza: string;
  /** Gli avatar completi del cliente (carta + dossier), già resi in testo. */
  avatar: string;
  /** La riga `offerta` com'è ora: i campi già compilati entrano nel prompt. */
  offerta: Record<string, unknown>;
  /** La riga `offerta_diagnosi` (null finché non è scritta). */
  diagnosi: Record<string, unknown> | null;
  storico: Storico[];
  messaggio: string;
}

const taglia = (t: string, n: number) => (t.length > n ? `${t.slice(0, n)}…` : t);

/** La carta com'è ora: campi compilati con il valore, quelli vuoti segnati come mancanti. */
export function renderCarta(offerta: Record<string, unknown>, diagnosi: Record<string, unknown> | null): string {
  const righe: string[] = [];
  const mancanti: string[] = [];
  const testo = (o: Record<string, unknown>, chiavi: readonly string[]) => {
    for (const k of chiavi) {
      const v = o[k];
      if (typeof v === "string" && v.trim()) righe.push(`${k}: ${v}`);
      else mancanti.push(k);
    }
  };
  const liste = (o: Record<string, unknown>, chiavi: readonly string[]) => {
    for (const k of chiavi) {
      const v = o[k];
      if (Array.isArray(v) && v.length > 0) righe.push(`${k}:\n  - ${(v as string[]).join("\n  - ")}`);
      else mancanti.push(k);
    }
  };
  testo(offerta, Object.keys(CAMPI_TESTO));
  liste(offerta, Object.keys(CAMPI_LISTA));
  if (typeof offerta.posizionamento === "string") righe.push(`posizionamento: ${offerta.posizionamento}`);
  else mancanti.push("posizionamento");
  righe.push("--- diagnosi per Wesley (il cliente non la vede) ---");
  testo(diagnosi ?? {}, Object.keys(DIAGNOSI_TESTO));
  liste(diagnosi ?? {}, Object.keys(DIAGNOSI_LISTA));
  righe.push(`stato: ${offerta.stato === "completo" ? "COMPLETA" : "in costruzione"}`);
  return `${righe.join("\n")}\nMancano ancora: ${mancanti.join(", ") || "niente"}`;
}

/** Gli avatar del cliente in testo compatto: la carta e il dossier, così Aura scrive la trasformazione con le parole giuste. */
export function renderAvatar(avatars: Array<Record<string, unknown>>): string {
  if (avatars.length === 0) return "(nessun avatar definito: metti a fuoco il minimo, chi / che problema / in che momento, prima di costruire)";
  const CHIAVI = [
    "nome",
    "eta",
    "genere",
    "situazione",
    "contesto",
    "momento",
    "frase",
    "snapshot",
    "dolori_superficie",
    "dolori_profondi",
    "credenze_limitanti",
    "desiderio_pratico",
    "desiderio_emotivo",
    "linguaggio",
    "piattaforme",
    "obiezioni",
    "trigger_acquisto",
  ];
  return avatars
    .map((a) => {
      const righe = CHIAVI.map((k) => {
        const v = a[k];
        if (Array.isArray(v) && v.length > 0) return `${k}: ${(v as string[]).join(" · ")}`;
        if (typeof v === "string" && v.trim()) return `${k}: ${v}`;
        return null;
      }).filter((r): r is string => !!r);
      return `## Avatar "${typeof a.nome === "string" ? a.nome : "senza nome"}" (${a.stato === "completo" ? "completo" : "in compilazione"})\n${righe.join("\n")}`;
    })
    .join("\n\n");
}

/** Tre tratti per il prompt caching: regole+metodo (fissi), cliente+avatar (fissi nella conversazione), carta+storico+messaggio. */
export function costruisciPrompt(d: DatiPrompt): Blocco[] {
  const fisso = [`=== REGOLE PRIMA DI PARLARE CON IL CLIENTE (valgono sempre) ===\n${REGOLE_AGENTI}`];
  if (d.conoscenza) fisso.push(`=== METODO OFFERTA DI WESLEY (la tua guida) ===\n${d.conoscenza}`);
  const cliente = [
    `=== CLIENTE: ${d.nome} ===\n--- Profilo onboarding (quello che sai già di lui: usalo, non richiederlo) ---${taglia(d.scheda, 7000)}`,
    `=== FOTOGRAFIA DELL'ONBOARDING (lettura di Aura per Wesley) E NOTE PER TE ===\n${taglia(d.lettura, 4000)}`,
    `=== IL SUO AVATAR (cliente ideale: la trasformazione, le obiezioni e il linguaggio vengono da qui) ===\n${taglia(d.avatar, 5000)}`,
  ];
  if (d.kitBrand) cliente.push(d.kitBrand);
  const variabile = [`=== CARTA DELL'OFFERTA FINORA ===\n${renderCarta(d.offerta, d.diagnosi)}`];
  if (d.storico.length > 0) {
    const righe = d.storico.map((m) => `${m.ruolo === "cliente" ? "CLIENTE" : "AURA"}: ${taglia(m.contenuto, 2500)}`);
    variabile.push(`=== CONVERSAZIONE FINORA ===\n${righe.join("\n\n")}`);
  }
  variabile.push(`=== NUOVO MESSAGGIO DEL CLIENTE ===\n${d.messaggio}`);
  return blocchiPrompt(fisso, cliente, variabile);
}

/** Primo messaggio di Aura (statico: parte subito, senza aspettare il modello). */
export function messaggioApertura(primoNome: string, nomeAvatar: string | null): string {
  const saluto = primoNome ? `Ciao ${primoNome}!` : "Ciao!";
  const avatar = nomeAvatar
    ? `Ho già sotto mano la carta di ${nomeAvatar}, il tuo cliente ideale, e la tua scheda: la promessa e le obiezioni partiranno da lì.`
    : "Dalla tua scheda so già qualcosa di te; se definisci prima l'Avatar, la promessa verrà fuori con le parole del tuo cliente.";
  return `${saluto} Sono Aura. Qui costruiamo la tua offerta: cosa vendi, a chi, a che prezzo e perché nessuno può confrontarla con un'altra. Non sarà un questionario: tu mi dai pochi dati reali, io costruisco la proposta pezzo per pezzo e tu correggi. La carta qui accanto si compila mentre parliamo e alla fine la scarichi in PDF. ${avatar}

Partiamo da quello che non posso inventare io. Raccontami, come viene: oggi cosa vendi esattamente e in che forma (pacchetto, mensilità, a preventivo, singola seduta)? A che prezzo, e cosa include quel prezzo? In che paese vendi? E quanto tempo hai a settimana per seguire i clienti, da solo o con qualcuno?`;
}

export type { CampiOfferta };
