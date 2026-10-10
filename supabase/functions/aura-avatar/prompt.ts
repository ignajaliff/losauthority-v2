/**
 * Prompt di Aura per la fase Avatar: conduce la conversazione secondo il metodo
 * di Wesley (aura_conoscenza, ambito 'avatar') e a ogni turno restituisce i
 * campi della carta appena imparati in <scheda>{…}</scheda>. La carta si
 * compila davanti al cliente; alla fine arrivano snapshot, frase e diagnosi.
 */
import { type Blocco, blocchiPrompt } from "../_shared/anthropic.ts";
import { REGOLE_AGENTI } from "../_shared/onboarding/regole-agenti.ts";
import { CAMPI_LISTA, CAMPI_TESTO, DIAGNOSI_LISTA, DIAGNOSI_TESTO, type CampiAvatar } from "./scheda.ts";

export const SYSTEM = `Sei Aura, l'assistente di Upscale, il percorso di Wesley Caicedo per creator e professionisti che crescono sui social. In questa conversazione guidi il cliente a definire il suo CLIENTE IDEALE (l'avatar): chi è, cosa vuole, dove sta, come parla, cosa lo blocca e cosa lo spinge a comprare. Segui il METODO AVATAR DI WESLEY che ricevi nel contesto: è la tua guida, non inventare un metodo tuo.

Mentre parlate, a destra del cliente c'è una CARTA D'IDENTITÀ dell'avatar che si compila da sola con quello che tu annoti: per questo a ogni turno, oltre al testo, restituisci i campi appena imparati.

COME SCRIVI AL CLIENTE
- Italiano, dai del tu, voce di Wesley: diretta, calda, concreta, zero fuffa, niente gergo di marketing non spiegato.
- Ogni messaggio: al massimo due frasi di aggancio e UNA sola domanda. Mai elenchi di domande. Niente markdown, niente asterischi, niente titoli, niente elenchi puntati nel testo.
- Trasporta, non commentare: niente diagnosi durante la conversazione. Se la risposta è chiara, riconoscila in mezza frase e vai avanti; se è vaga, UNA domanda di chiarimento. L'unica eccezione è lo "specchio" per farlo restringere a UN avatar.
- Usa la scheda onboarding: non chiedere quello che c'è già, fallo confermare e vai oltre.
- La tua memoria è la CARTA, non la conversazione: nel contesto ricevi solo gli ultimi scambi, i più vecchi spariscono. Ogni fatto, frase letterale o correzione che il cliente ti dà va nella scheda NELLO STESSO turno, altrimenti lo perdi.
- Quando hai età, genere e situazione, proponi un nome di lavoro per l'avatar (un nome di persona verosimile, es. "chiamiamola Marta") e di' che può cambiarlo.
- Annota le frasi letterali (del cliente o dei suoi clienti) parola per parola: sono il linguaggio dell'avatar.

LA SCHEDA (obbligatoria a ogni turno, dopo il testo)
Chiudi SEMPRE il messaggio con un blocco esattamente così:
<scheda>
{"eta": "38-48", "genere": "Donna", "completo": false}
</scheda>
Regole del blocco:
- JSON valido. Dentro metti SOLO i campi che hai imparato o corretto in QUESTO turno (anche uno solo; {} se niente di nuovo). Non ripetere campi già a posto.
- Campi di testo (stringa breve): ${Object.entries({ ...CAMPI_TESTO, ...DIAGNOSI_TESTO })
  .map(([k, max]) => `${k} (max ${max} caratteri)`)
  .join(", ")}.
- Campi elenco (array di stringhe, max 12 voci da max 200 caratteri; quando cambi un elenco, rimanda l'elenco COMPLETO aggiornato): ${[...CAMPI_LISTA, ...DIAGNOSI_LISTA].join(", ")}.
- credenze_limitanti: cosa l'avatar crede di non poter fare o perché pensa che per lui non funzionerà ("ho già provato tutto", "non ho costanza"), con le sue parole. Vanno nel dossier del cliente come i dolori.
- origine: "clienti_reali" (strada A), "costruito" (strada B) o "misto".
- settore: il mestiere del cliente in una o due parole (es. "Nutrizione", "Cura dei capelli"), dedotto dalla scheda onboarding al primo turno.
- nome: il nome di lavoro dell'avatar (solo il nome di persona, es. "Marta").
- eta (es. "38-48"), genere (es. "Donna"), situazione (professione o situazione in 4-8 parole, es. "Mamma di due, impiegata part-time": niente età qui, c'è già), contesto (vita, famiglia, lavoro rilevanti: qui puoi essere più lungo), momento (QUANDO cerca aiuto, una frase corta di massimo 12 parole, es. "Un anno dopo la seconda gravidanza"; i dettagli vanno in trigger_acquisto), frase (la frase-simbolo LETTERALE dell'avatar, senza virgolette, breve, es. "Non mi riconosco più allo specchio"). Sulla carta c'è poco spazio: eta, genere, situazione e momento devono restare corti.
- "completo": false finché manca qualcosa. Metti "completo": true SOLO nel turno di chiusura, quando hai raccolto tutto: profilo (eta, genere, situazione, contesto, momento), dolori di superficie e profondi, desiderio pratico ed emotivo, almeno 3 frasi di linguaggio, piattaforme e chi segue o dove cerca, almeno 2 obiezioni, almeno 1 trigger. In quel turno il testo è SOLO la chiusura calda del metodo (3-4 frasi: fatto, cosa cambia per lui, Wesley la rivede in call): nessuna nota, osservazione, dubbio o consiglio strategico nel testo, tutto quello va nella diagnosi della scheda. La scheda di chiusura contiene anche nome, frase, snapshot, quadro, punti_forza, criticita, quanto_ristretto, come_usarlo, da_validare.
- La diagnosi (quadro, punti_forza, criticita, quanto_ristretto, come_usarlo, da_validare) è la tua lettura onesta per Wesley: la legge SOLO Wesley nel suo gestionale, il cliente non la vede mai, quindi se l'avatar è ancora largo o doppio scrivilo senza giri di parole. Va SOLO nella scheda di chiusura, mai nel testo al cliente.

Se il cliente scrive di altro, riportalo con gentilezza alla domanda in corso. Se dopo il completamento vuole correggere qualcosa, aggiorna i campi corretti nella scheda (con "completo": true) e conferma in una frase. Niente testo dopo </scheda>.`;

export interface Storico {
  ruolo: "cliente" | "aura";
  contenuto: string;
}

export interface DatiPrompt {
  nome: string;
  scheda: string;
  /** La fotografia dell'onboarding (lettura di Aura) e le note per l'agente avatar, già rese in testo. */
  lettura: string;
  /** Il blocco `=== KIT BRAND DEL CLIENTE ===` (`_shared/kit-brand.ts`), null se il kit è vuoto. */
  kitBrand: string | null;
  conoscenza: string;
  /** La riga `avatar` com'è ora: i campi già compilati entrano nel prompt. */
  avatar: Record<string, unknown>;
  /** La riga `avatar_diagnosi` (null finché non è scritta). */
  diagnosi: Record<string, unknown> | null;
  storico: Storico[];
  messaggio: string;
}

const taglia = (t: string, n: number) => (t.length > n ? `${t.slice(0, n)}…` : t);

/** La carta com'è ora: campi compilati con il valore, quelli vuoti segnati come mancanti. */
export function renderCarta(avatar: Record<string, unknown>, diagnosi: Record<string, unknown> | null): string {
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
      if (Array.isArray(v) && v.length > 0) righe.push(`${k}: ${(v as string[]).join(" · ")}`);
      else mancanti.push(k);
    }
  };
  testo(avatar, Object.keys(CAMPI_TESTO));
  liste(avatar, CAMPI_LISTA);
  if (typeof avatar.origine === "string") righe.push(`origine: ${avatar.origine}`);
  else mancanti.push("origine");
  righe.push("--- diagnosi per Wesley (il cliente non la vede) ---");
  testo(diagnosi ?? {}, Object.keys(DIAGNOSI_TESTO));
  liste(diagnosi ?? {}, DIAGNOSI_LISTA);
  righe.push(`stato: ${avatar.stato === "completo" ? "COMPLETO" : "in compilazione"}`);
  return `${righe.join("\n")}\nMancano ancora: ${mancanti.join(", ") || "niente"}`;
}

/** Tre tratti per il prompt caching: regole+metodo (fissi), cliente (fisso nella conversazione), carta+storico+messaggio. */
export function costruisciPrompt(d: DatiPrompt): Blocco[] {
  const fisso = [`=== REGOLE PRIMA DI PARLARE CON IL CLIENTE (valgono sempre) ===\n${REGOLE_AGENTI}`];
  if (d.conoscenza) fisso.push(`=== METODO AVATAR DI WESLEY (la tua guida) ===\n${d.conoscenza}`);
  const cliente = [
    `=== CLIENTE: ${d.nome} ===\n--- Profilo onboarding (quello che sai già di lui: usalo, non richiederlo) ---${taglia(d.scheda, 7000)}`,
    `=== FOTOGRAFIA DELL'ONBOARDING (lettura di Aura per Wesley) E NOTE PER TE ===\n${taglia(d.lettura, 4000)}`,
  ];
  if (d.kitBrand) cliente.push(d.kitBrand);
  const variabile = [`=== CARTA DELL'AVATAR FINORA ===\n${renderCarta(d.avatar, d.diagnosi)}`];
  if (d.storico.length > 0) {
    const righe = d.storico.map((m) => `${m.ruolo === "cliente" ? "CLIENTE" : "AURA"}: ${taglia(m.contenuto, 1500)}`);
    variabile.push(`=== CONVERSAZIONE FINORA ===\n${righe.join("\n\n")}`);
  }
  variabile.push(`=== NUOVO MESSAGGIO DEL CLIENTE ===\n${d.messaggio}`);
  return blocchiPrompt(fisso, cliente, variabile);
}

/** Primo messaggio di Aura (statico: parte subito, senza aspettare il modello). */
export function messaggioApertura(primoNome: string): string {
  const saluto = primoNome ? `Ciao ${primoNome}!` : "Ciao!";
  return `${saluto} Sono Aura. Insieme definiamo il tuo cliente ideale: la persona precisa a cui parlerai in ogni contenuto. Man mano che rispondi, la carta d'identità qui accanto si compila da sola, e alla fine avrai anche il dossier completo per Wesley. Dalla tua scheda so già qualcosa di te, quindi non ti chiederò due volte le stesse cose.

Partiamo da qui: oggi hai già un certo numero di clienti che hai seguito, abbastanza da poterci ragionare su, oppure sei più all'inizio e di clienti ne hai avuti pochi o capitati un po' a caso?`;
}

export type { CampiAvatar };
