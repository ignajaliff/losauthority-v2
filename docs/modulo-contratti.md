# Modulo contratti

Dal gestionale mandi un link personale. Il cliente inserisce i suoi dati, legge il contratto e lo firma dal telefono. Poi tu segni il pagamento e attivi il programma.

## Come si usa

1. **Contratti → Nuovo invito.** Scegli l'offerta. Ottieni un link e un messaggio pronto da copiare. Non serve dire a chi lo mandi: i dati li inserisce il cliente. Creando l'invito firmi la proposta: la tua firma salvata finisce sul contratto.
2. **Il cliente apre il link.** Apre l'informativa privacy (una pagina a sé, `/informativa-privacy`) e spunta di averne preso visione, sceglie come acquista (privato, partita IVA, società), compila i dati, preme *Elabora*, legge il contratto e firma due volte. La seconda firma è l'approvazione specifica delle clausole. Il pulsante finale è *Scarica il contratto firmato*: registra le firme e fa partire lo scaricamento del PDF. La pagina non parla di prezzo né di pagamento: la vendita avviene altrove, qui si raccolgono dati e firma.
3. **Il cliente ti manda il PDF per email.** La pagina finale glielo chiede e gli apre l'email già indirizzata a te: è una prova in più che l'ha letto e inviato lui. In parallelo **ti arriva un avviso su Telegram** con il link alla scheda del contratto, dove trovi la stessa copia archiviata dal sistema.
4. **Segna come pagato**, quando l'incasso è arrivato. Nasce la scheda del cliente, con contatti, social, tag *UPSCALE* e la fattura incassata. Al cliente non parte nulla. Nella lista clienti lo stato è *Da attivare*.
5. **Attiva**, dopo aver aperto a mano gli accessi (moduli Skool, gruppo WhatsApp, chiamate di gruppo). Spunti le tre consegne e premi *Attiva il programma*. Compare il messaggio di attivazione con le credenziali del sito: mandalo subito via email. Da quel giorno partono i 6 mesi e, per i privati, i 14 giorni di recesso.

**Offerte** (voce di menu, solo admin): qui decidi cosa vendi. Un'offerta è un nome, un contratto e un prezzo. Puoi crearne quante vuoi, cambiare nome e prezzo, disattivarle o eliminarle. Le modifiche valgono per gli inviti nuovi: quelli già mandati tengono offerta e prezzo che avevano. I contratti tra cui scegliere sono quelli già scritti nel codice, oggi solo «Programma UPSCALE». Per un programma con un contratto diverso serve prima il suo testo.

**Impostazioni** (in fondo alla pagina Contratti, solo admin): la tua firma, il tuo telefono, un messaggio facoltativo che il cliente vede dopo la firma.

**Dati già inseriti.** Se nella riga dell'invito ci sono già dei dati (inseriti a mano nel database per conto del cliente), il modulo li mostra compilati: il cliente controlla, conferma e firma.

## Cosa il sistema non fa

- **Non manda email.** Il sito non ha un servizio di posta. Il link dell'invito e il messaggio di attivazione li mandi tu: il gestionale ti prepara il testo e, dove serve, apre il tuo programma di posta. Il PDF firmato te lo manda il cliente.
- **Non gestisce la chiamata individuale.** La concordi tu con il cliente.
- **Non chiude l'account a scadenza.** La data di scadenza è registrata sul contratto; la chiusura per ora è manuale.

## Stati di un contratto

| Stato | Significato | Chi fa il passo dopo |
|---|---|---|
| Inviato / Aperto | Link creato, il cliente non ha ancora inserito i dati | Cliente |
| Dati inseriti | Ha premuto *Elabora*, non ha firmato | Cliente |
| Firmato · da incassare | PDF archiviato | Tu: segni il pagamento |
| Pagato · da attivare | Scheda cliente creata | Tu: apri gli accessi e attivi |
| Attivo | Programma in corso, scadenza registrata | Nessuno |
| Annullato | Invito ritirato, il link non funziona più | Nessuno |

Un invito non firmato si può annullare o eliminare. Un contratto firmato non si elimina dal gestionale.

## Per chi mette mano al codice

Tutto sta in `src/lib/contratti/` e `src/components/contratti/`.

| File | Cosa contiene |
|---|---|
| `testo-privato.ts`, `testo-piva.ts` | I due testi del contratto. Ogni modifica cambia un contratto: aggiornare anche `MODELLO_*` |
| `informativa.ts` | L'informativa privacy, pubblicata su `/informativa-privacy` e richiamata nel contratto con il suo indirizzo |
| `fornitore.ts` | I dati di Wesley che compaiono nei testi |
| `modelli.ts` | L'elenco dei contratti disponibili per le offerte |
| `componi.ts` | Sceglie il testo, inserisce i dati, aggiunge gli allegati |
| `validazione.ts` | Controllo dei dati (codice fiscale, partita IVA, età) e pulizia della firma. Usato sia nel browser sia sul server |
| `firma.ts` | Le operazioni della pagina pubblica: salva i dati, registra la firma, archivia il PDF |
| `operazioni.ts` | Pagamento e attivazione |
| `actions.ts` | Le azioni del gestionale: controllano i permessi e chiamano le operazioni |
| `pdf.ts`, `pdf-contratto.ts`, `pdf-metriche.ts` | Il generatore del PDF |

Scelte da conoscere:

- **Il testo lo compone sempre il server.** La pagina manda l'impronta SHA-256 del testo che ha mostrato; se non coincide con quello ricomposto, la firma è rifiutata e il cliente rilegge.
- **Alla firma si salva il testo integrale** (`contracts.documento`) con la sua impronta. I contratti firmati non cambiano quando si aggiorna un testo.
- **Il PDF è scritto a mano**, senza librerie, con i font standard. Costa pochi millisecondi, quindi regge sui Worker, e a parità di dati produce gli stessi byte: si può rigenerare identico. Lettere fuori dall'alfabeto latino occidentale perdono il segno diacritico nel PDF (Ł diventa L).
- **Della firma si salva solo la forma del tratto**, ridotta ai punti che la disegnano. Niente tempi né pressione. La firma di Wesley è salvata come contorni pieni (`pieno: true`), ricavati da un'immagine con `scripts/salva-firma-fornitore.mjs`.
- **Offerta, prezzo e firma di Wesley si fissano sull'invito** al momento della creazione. Il telefono si legge dalle impostazioni quando il contratto viene composto.
- **Le rotte pubbliche sono handler** (`/api/contratto/[token]/…`), non server action: restano valide anche se si pubblica una nuova versione mentre il cliente ha la pagina aperta.

Database (progetto Supabase `zmisvqovyxlviqsenmyq`): tabelle `contracts`, `contract_settings` e `offers`, colonna `client_details.da_attivare`, bucket privato `contracts`. Leggono i contratti solo admin e staff fatture; creare o eliminare un invito spetta all'admin. La pagina pubblica passa dal service role e la chiave è il token del link. Un job `pg_cron` (`contracts-unsigned-retention`, ogni notte) cancella gli inviti mai firmati dopo 90 giorni dall'ultima attività, come dichiarato nell'informativa.

Nel database esistono anche la tabella `firme_contratti`, il bucket `contratti` e la funzione `firma-contratto`, creati il 1° ottobre 2026 da un'altra sessione. Questo modulo non li usa.

## Da decidere

| Punto | Stato attuale | Perché conta |
|---|---|---|
| Telefono del Fornitore | Non impostato | Nei contratti a distanza coi privati va indicato. Si aggiunge dalle Impostazioni |
| Termine per attivare | Non scritto | La legge chiede di dire entro quando parte il servizio. Proposta: «entro 3 giorni lavorativi dall'incasso» |
| Termine per pagare | Non scritto | Senza, un contratto firmato e non pagato resta sospeso. Proposta: 7 giorni dalla firma |
| Imposta di bollo | «ove dovuta» | Per i privati il prezzo deve essere totale. Decidere se i 2 € restano a carico tuo |
| Messaggio dopo la firma | Vuoto | Facoltativo. Se lo scrivi, il cliente lo legge appena ha firmato |

## Testi: cosa è stato cambiato e cosa va fatto validare

I due testi partono dai tuoi contratti. Sono state applicate le modifiche concordate e alcune correzioni emerse da due revisioni indipendenti (una sui contratti, una sull'informativa). Nessuna revisione sostituisce un avvocato: chi valida i tuoi contratti deve leggere questi testi prima che diventino lo standard.

**Modifiche concordate, in entrambe le versioni**

- Due definizioni al posto di «Community»: *Community Skool* e *Area riservata*; «Community» le indica insieme.
- *Attivazione* è il giorno della comunicazione di attivazione via email, non più il rilascio delle credenziali.
- Il sito è uno strumento accessorio gratuito, che puoi modificare o chiudere (art. 3.6); «Piattaforme» comprende anche i tuoi strumenti.
- A fine programma restano community Skool, lezioni presenti alla firma e programma UPSCALE; cessano chiamate, WhatsApp, registrazioni delle live e accesso al sito. La cortesia non spetta a chi recede o subisce la risoluzione.
- L'esclusione del vecchio 6.3 è confluita nell'art. 11, con l'elenco delle violazioni allargato alle regole di condotta.
- Chi recede o subisce la risoluzione perde ogni accesso ottenuto col contratto, community Skool compresa.

**Solo versione partita IVA**

- Via i video Loom; articoli rinumerati.
- Nessun recesso e nessun rimborso dopo firma e pagamento, con rinuncia al recesso dell'art. 2227 c.c. e salvaguardia per chi risultasse consumatore.
- Art. 3.2 uguale ai privati. Parti in due varianti (professionista, società con legale rappresentante). Definiti *Cliente Professionista* e *Cliente Consumatore*. Corretto il refuso del 16.2.
- La società risponde di chi segue il programma (art. 6.2).
- Nessuna penale in cifre: l'art. 13 prevede solo risarcimento del danno, inibitoria e rimozione dei contenuti. Scelta di Wesley: un'eventuale penale si valuta caso per caso, a parte.

**Correzioni dalle revisioni**

- Recesso dei privati con qualsiasi dichiarazione esplicita, come vuole la legge (art. 10.1, 15.1).
- Clausola risolutiva riferita a obblighi precisi (art. 11.1).
- Licenza estesa alle lezioni lasciate in cortesia (art. 7.2).
- La chiamata individuale è registrata per il solo cliente (art. 9.1).
- Rimborso pro rata calcolato sui giorni totali, così non supera mai il prezzo (art. 10.4 e 10.3).
- Limite di responsabilità riscritto perché dolo e colpa grave restino sempre fuori (art. 12.3 partita IVA).
- Tolta la clausola sul tentativo di soluzione bonaria prima del giudizio (era 16.3 nei privati e 17.4 nelle partite IVA): scelta di Wesley.
- Elenco della seconda firma completato con 6.1 e 6.3.
- Clausola di sopravvivenza anche nei privati (art. 15.5); definite le «Parti»; dichiarate le componenti essenziali (art. 2.1).
- Elenco della seconda firma, definizioni e clausole di cui sopra. Una correzione proposta NON è stata tenuta, per scelta di Wesley: il riepilogo dell'ordine e il pulsante «con obbligo di pagamento» (vedi sotto).

**Rischi segnalati e lasciati come sono, da far valutare**

- *Niente allegati, per scelta di Wesley.* Il PDF contiene solo contratto, firme e registro della firma (6 pagine per i privati, 7 per le partite IVA). L'informativa privacy non è allegata: il contratto dice che il cliente ne ha preso visione e ne indica l'indirizzo; il registro riporta data, ora e versione. Se l'informativa cambia, va aggiornato `VERSIONE_INFORMATIVA`: la versione vecchia resta solo nella storia del codice. Il modulo di recesso tipo non viene consegnato: per i privati la legge lo prevede, e se manca il termine di 14 giorni può allungarsi fino a 12 mesi.

- *Pulsante finale, solo per i privati.* Quando un contratto a distanza obbliga a pagare, l'art. 51 del Codice del Consumo vuole che il pulsante finale lo dica in modo chiaro («ordine con obbligo di pagare» o simile), altrimenti il consumatore può sostenere di non essere vincolato. Wesley ha scelto «Scarica il contratto firmato» perché la vendita e il pagamento avvengono a parte. Chi valida i contratti deve dire se regge, soprattutto quando il cliente firma prima di aver pagato.

- *Privati, art. 10.3 e 10.4.* Tu puoi interrompere per qualsiasi motivo, il cliente dopo 14 giorni non può uscire: squilibrio che la legge presume vessatorio.
- *Privati, art. 11.2.* Trattenere l'intero prezzo in caso di espulsione può essere considerato una penale eccessiva. È la tua scelta, resta un rischio.
- *Privati, art. 12.2 e 13.2.* Esclusione di responsabilità per le piattaforme e nessun rimborso in caso di impedimento.
- *Privati, art. 4.4 e 15.2.* Dichiarazione di non aver ricevuto promesse e clausola di intero accordo.
- *Art. 3.4.* La chiamata «va prenotata» entro 60 giorni ma si concorda con te.
- Le lezioni registrate sono probabilmente «contenuto digitale» per la legge: da valutare la modifica unilaterale dell'art. 3.5.

**Informativa privacy**

Scritta da zero, perché non esisteva. Sta su una pagina pubblica del sito. I tempi di conservazione sono impegni: 10 anni per contratto e prova della firma; 12 mesi dopo la fine del programma per l'area clienti e le chiamate individuali; 24 mesi per le registrazioni di gruppo; 90 giorni per gli inviti non firmati (questo lo fa il sistema da solo, gli altri vanno rispettati a mano). Fuori dal testo restano da fare: registro dei trattamenti, accordi con i fornitori, verifica dei link pubblici delle registrazioni Fathom. Telegram riceve nomi di clienti dalle risposte di Aura: da valutare.
