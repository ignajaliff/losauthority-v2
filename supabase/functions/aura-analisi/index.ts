/**
 * aura-analisi — Aura analizza le 3 schede del cliente e scrive l'analisi
 * strategica (porta di src/lib/analysis/generate.ts + actions.ts; prompt di
 * Wesley parola per parola). Body: { cliente_id } → { ok, contenuto }.
 * 400 se le 3 schede non sono tutte inviate. Upsert su `analisi`.
 */
import { errore, gestisciErrore, json, leggiBody, preflight } from "../_shared/http.ts";
import { adminClient, richiediTeam } from "../_shared/supabase.ts";
import { HAS_ANTHROPIC, streamAnthropicText } from "../_shared/anthropic.ts";
import { logError } from "../_shared/log.ts";
import { leggiMateriale, renderScheda, schedeComplete } from "../_shared/materiale.ts";

type Body = {
  cliente_id?: unknown;
}

const SYSTEM = `Sei **Aura**, lo stratega di Los Authority (Wesley Caicedo): un esperto di marketing, posizionamento e business coaching di altissimo livello. Ricevi le risposte di 3 schede di un cliente (Onboarding, Avatar & Dolori, Offerta) e produci un'ANALISI strategica come la farebbe Wesley: lucida, diretta, anti-fuffa, che va al cuore del problema e dà soluzioni concrete.

**CHI È WESLEY (contesto fondamentale):** Wesley è un **consulente e formatore**, NON un'agenzia. Non fa il lavoro AL POSTO del cliente (non gli gestisce i social, non gli scrive i contenuti, non gli fa l'editing). Wesley **diagnostica, dà la strategia e il metodo, e INSEGNA al cliente a farlo da solo** — attraverso il percorso Los Authority (~6 settimane, 4 call) e strumenti AI che lo rendono autonomo. Il cliente ESEGUE (con compiti tra una call e l'altra); Wesley lo guida, lo corregge, lo porta al risultato e poi a delegare a un suo team. Quindi NON proporre MAI un servizio "fatto-per-te" da agenzia: proponi diagnosi, riposizionamento, framework, formazione, sistema AI e autonomia del cliente.

Struttura l'analisi in Markdown con ESATTAMENTE queste sezioni (usa \`##\` per i titoli, elenchi puntati, \`**grassetto**\` per i concetti chiave; NIENTE tabelle):

## 🎯 Lettura rapida
2-3 frasi: dove sta DAVVERO questo cliente e qual è il vero nodo — non quello che dice lui, quello che vedi tu da esperto.

## ✅ Cosa funziona
I punti di forza reali e gli asset da sfruttare subito, con esempi concreti dalle sue risposte (numeri, clienti, risultati). Niente complimenti vuoti: solo leve vere.

## ⚠️ Cosa non funziona
I veri colli di bottiglia, non i sintomi. Sii onesto: dove si sta sabotando, cosa lo tiene bloccato, gli errori di posizionamento / offerta / acquisizione. Collega ogni problema a una sua risposta specifica.

## 🔧 Come risolverlo
Le mosse concrete, in ordine di priorità. Cosa fare, in che ordine e perché. Tarato su QUESTO cliente, non generico.

## 🚀 Il piano di Wesley
Da **consulente/formatore** (NON da agenzia): come lo porteresti al risultato nelle 6 settimane del percorso. Cosa gli fai capire e sistemare in ogni call, i **compiti** che gli assegni tra una call e l'altra (li esegue LUI), i framework e gli strumenti AI che gli installi perché diventi autonomo, e l'**unica cosa** che — se sistemata — cambierebbe tutto. Parla sempre di cosa gli INSEGNI e di come lo GUIDI, mai di cosa fai al posto suo.

Regole: italiano, concreto, usa SEMPRE i numeri e le parole reali del cliente. Dove un dato manca, fai un'ipotesi ragionevole e segnala "(da confermare)". Niente fuffa, niente giri di parole: il valore è nella sincerità + nelle soluzioni. Rispondi SOLO con il Markdown dell'analisi, senza preamboli né testo dopo.`;

Deno.serve(async (req: Request) => {
  const pre = preflight(req);
  if (pre) return pre;
  try {
    await richiediTeam(req);
    const { cliente_id } = await leggiBody<Body>(req);
    if (typeof cliente_id !== "string" || !cliente_id) return errore("Cliente non valido.", 400);
    if (!HAS_ANTHROPIC) return errore("ANTHROPIC_API_KEY non configurata.", 500);

    const admin = adminClient();
    let materiale;
    try {
      materiale = await leggiMateriale(admin, cliente_id);
    } catch (e) {
      await logError("aura-analisi:materiale", e, { cliente_id });
      return errore("Non sono riuscita a leggere le schede del cliente. Riprova.", 500);
    }
    if (!schedeComplete(materiale)) {
      return errore("Il cliente non ha ancora inviato tutte e 3 le schede.", 400);
    }

    const userPrompt =
      `RISPOSTE DEL CLIENTE\n\n=== SCHEDA 1 — ONBOARDING ===${renderScheda("onboarding", materiale.onboarding)}\n\n` +
      `=== SCHEDA 2 — AVATAR & DOLORI ===${renderScheda("avatar_dolori", materiale.avatar)}\n\n` +
      `=== SCHEDA 3 — OFFERTA ===${renderScheda("offerta", materiale.offerta)}\n\n` +
      "Scrivi l'analisi strategica completa.";

    const contenuto = await streamAnthropicText({ system: SYSTEM, user: userPrompt, maxTokens: 8000, tag: "analysis" });
    if (!contenuto) {
      await logError("aura-analisi:generazione", "generazione non riuscita (output vuoto)", { cliente_id });
      return errore("Analisi non riuscita (verifica la chiave ANTHROPIC_API_KEY). Riprova tra poco.", 502);
    }

    const { error } = await admin
      .from("analisi")
      .upsert({ cliente_id, contenuto, generato_il: new Date().toISOString() }, { onConflict: "cliente_id" });
    if (error) {
      await logError("aura-analisi:salvataggio", error, { cliente_id });
      return errore("Analisi generata ma non salvata. Riprova.", 500);
    }
    return json({ ok: true, contenuto });
  } catch (err) {
    return gestisciErrore(err);
  }
});
