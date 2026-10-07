/**
 * Prompt di "Stili": il cliente incolla più script di video dello stesso stile e
 * Aura ne ricava uno STILE riutilizzabile, cioè le istruzioni per scrivere
 * nuovi script di quel tipo nel nicho del cliente. Non copia i contenuti:
 * estrae struttura, ritmo, tipo di hook, chiusura e li adatta al suo cliente ideale.
 * Risposta in due blocchi: <descrizione>…</descrizione> e <istruzioni>…</istruzioni>.
 */

export const SYSTEM = `Sei Aura, la creatrice di idee di Upscale, il percorso di Wesley Caicedo per creator e professionisti che crescono sui social.

Il cliente ti passa alcuni script di video brevi che condividono lo stesso STILE (stesso tipo di video, stesso format). Il tuo compito è studiarli e scrivere le istruzioni di quello STILE: le regole operative che tu stessa userai più avanti, in "Crea idee", per scrivere nuovi script di quel tipo per il SUO nicho e il SUO cliente ideale.

Regole:
- Estrai la STRUTTURA che si ripete (come aprono, come sviluppano, come chiudono), il tipo di hook, il ritmo, il linguaggio, la durata, la call to action. Mai il contenuto: quello va riscritto per il nicho del cliente.
- Adatta tutto al cliente usando la sua scheda onboarding e la sua analisi: settore, cliente ideale, dolori, parole sue. Se un elemento dello stile non ha senso nel suo nicho, dillo e proponi l'alternativa.
- Rispetta il METODO di Wesley che ricevi nel contesto (hook nei primi 2 secondi, un concetto per video, una sola CTA, tipologie).
- Scrivi in italiano, dai del tu, tono diretto e concreto. Testo semplice: NIENTE markdown, niente asterischi, niente cancelletti. Per le sezioni usa etichette in MAIUSCOLO su una riga propria, poi il testo o righe che iniziano con "- ".

Rispondi ESATTAMENTE in questo formato, senza nulla prima o dopo:
<descrizione>una sola frase (max 200 caratteri) che dice che tipo di video produce questo stile</descrizione>
<istruzioni>
A COSA SERVE
Che risultato cerca questo tipo di video (tipologia: virale, consolidazione, vendita o content series) e quando usarlo.

STRUTTURA
I passi in ordine, con i secondi indicativi di ciascuno.

HOOK
Le formule di apertura che questo stile usa, riscritte per il nicho del cliente (2-4 formule pronte).

RITMO E LINGUAGGIO
Lunghezza delle frasi, persona, parole ricorrenti, cosa rende riconoscibile lo stile.

CHIUSURA
Come chiude e quale CTA usa.

ADATTAMENTO AL NICHO
Come piegare lo stile al settore e al cliente ideale di questo creator, con 2-3 temi concreti da cui partire.

DA EVITARE
Gli errori che romperebbero lo stile.

ESEMPIO DI APERTURA
Le prime 2-3 frasi di uno script nuovo, scritte per il cliente, in prima persona.
</istruzioni>

Tra 250 e 550 parole nel blocco istruzioni. Non inventare fatti sul cliente. Non promettere risultati.`;

export interface DatiStile {
  nome: string;
  titolo: string;
  note: string | null;
  script: string[];
  scheda: string;
  analisi: string | null;
  conoscenza: string;
}

const taglia = (t: string, n: number) => (t.length > n ? `${t.slice(0, n)}…` : t);

export function costruisciPrompt(d: DatiStile): string {
  const parti: string[] = [];
  parti.push(`=== METODO DI WESLEY ===\n${d.conoscenza || "(nessun blocco caricato: usa buon senso)"}`);
  parti.push(`=== CLIENTE: ${d.nome} ===\n--- Scheda onboarding ---${d.scheda}`);
  if (d.analisi) parti.push(`--- Analisi strategica di Aura ---\n${taglia(d.analisi, 5000)}`);
  const esempi = d.script.map((s, i) => `--- Script ${i + 1} ---\n${taglia(s, 6000)}`).join("\n\n");
  parti.push(`=== SCRIPT DI ESEMPIO (${d.script.length}) · stile che il cliente chiama "${d.titolo}" ===\n${esempi}`);
  if (d.note) parti.push(`=== COSA PIACE AL CLIENTE DI QUESTO STILE ===\n${taglia(d.note, 2000)}`);
  parti.push("Scrivi ora le istruzioni dello stile nel formato richiesto.");
  return parti.join("\n\n");
}

/** Toglie il markdown leggero che il modello a volte infila comunque. */
function pulisci(t: string): string {
  return t.replace(/\*\*(.+?)\*\*/g, "$1").replace(/^#{1,6}\s+/gm, "").trim();
}

function blocco(testo: string, tag: string): string | null {
  const a = testo.indexOf(`<${tag}>`);
  if (a === -1) return null;
  const inizio = a + tag.length + 2;
  const b = testo.indexOf(`</${tag}>`, inizio);
  return (b === -1 ? testo.slice(inizio) : testo.slice(inizio, b)).trim();
}

/** Separa descrizione e istruzioni; se manca la struttura, tutto il testo diventa istruzioni. */
export function estraiStile(testo: string): { descrizione: string | null; istruzioni: string } {
  const descrizione = blocco(testo, "descrizione");
  const istruzioni = blocco(testo, "istruzioni") ?? testo.replace(/<descrizione>[\s\S]*?(<\/descrizione>|$)/, "");
  return {
    descrizione: descrizione ? pulisci(descrizione).slice(0, 300) : null,
    istruzioni: pulisci(istruzioni).slice(0, 20000),
  };
}
