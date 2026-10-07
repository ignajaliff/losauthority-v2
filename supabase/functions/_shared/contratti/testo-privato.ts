/**
 * Contratto «UPSCALE» — versione PRIVATI (consumatore). 16 articoli.
 *
 * È il testo che il cliente firma: ogni modifica qui cambia un contratto.
 * Quando il testo cambia, aggiorna MODELLO_PRIVATO: i contratti già firmati
 * non ne risentono (alla firma si salva il testo integrale).
 */

import { blocchi, dataBreve, euroBreve, euroContratto } from "./documento.ts";
import { FORNITORE as F, indirizzoInRiga } from "./fornitore.ts";
import { URL_INFORMATIVA } from "./informativa.ts";
import { sessoDaCodiceFiscale } from "./validazione.ts";
import type { Blocco, DatiPrivato } from "./tipi.ts";

export const MODELLO_PRIVATO = "upscale-privato-2026.10";

export function corpoPrivato(d: DatiPrivato, prezzo: number, telefonoFornitore?: string | null): Blocco[] {
  const telefono = telefonoFornitore ? `, telefono ${telefonoFornitore}` : "";
  const nato = sessoDaCodiceFiscale(d.codice_fiscale) === "F" ? "nata" : "nato";
  return blocchi(`
# Contratto Programma UPSCALE
## Parti e premesse
Contratto di prestazione di servizi formativi (artt. 2222 ss. c.c.) per il programma «UPSCALE» di Los Academy: durata 6 mesi, prezzo ${euroBreve(prezzo)} €.
= Tra
**${F.nome}**, titolare di partita IVA, con sede in ${F.sede}, P.IVA ${F.partitaIva}, C.F. ${F.codiceFiscale}, PEC ${F.pec}, email ${F.email}${telefono}, che presenta i propri programmi formativi con la denominazione commerciale «Los Academy» (di seguito il «Fornitore»);
= e
**${d.nome} ${d.cognome}**, ${nato} a ${d.luogo_nascita} il ${dataBreve(d.data_nascita)}, residente in ${indirizzoInRiga(d.indirizzo)}, C.F. ${d.codice_fiscale}, email ${d.email}, telefono ${d.telefono} (di seguito il «Cliente»).
= Premesso che
a) il Fornitore svolge attività di formazione e consulenza in marketing e comunicazione digitale, professione disciplinata ai sensi della legge 14 gennaio 2013, n. 4;
b) il Cliente intende acquistare il programma formativo «UPSCALE» descritto all'art. 2;
c) il Cliente ha letto il presente contratto prima della firma e ha così ricevuto le informazioni precontrattuali previste dalla legge, comprese quelle sul diritto di recesso (art. 10);
d) le premesse sono parte integrante del contratto.

### Art. 1 – Definizioni
- **Parti**: il Fornitore e il Cliente.
- **Los Academy**: denominazione commerciale dei programmi formativi del Fornitore; non è una società: la controparte del Cliente è ${F.nome}.
- **Programma**: il programma formativo «UPSCALE», della durata di 6 mesi, con i contenuti dell'art. 2.
- **Materiali**: lezioni registrate, testi, template, prompt, registrazioni delle chiamate e ogni altro contenuto del Fornitore.
- **Community Skool**: la community generale del Fornitore sulla piattaforma Skool, frequentata anche da persone che non partecipano al Programma.
- **Area riservata**: gli spazi riservati ai soli partecipanti al Programma: i moduli del programma «UPSCALE» dentro la Community Skool, le chiamate di gruppo, il gruppo WhatsApp privato e ogni altro spazio privato online che il Fornitore riserva ai partecipanti.
- **Community**: la Community Skool e l'Area riservata, considerate insieme.
- **Sito**: l'area clienti del sito ${F.sito}, strumento accessorio regolato dall'art. 3.6.
- **Piattaforme**: gli strumenti, di terzi o del Fornitore, usati per erogare il Programma (per esempio Skool, WhatsApp, i servizi di videochiamata e il Sito).
- **Attivazione**: il giorno in cui il Fornitore invia al Cliente, all'indirizzo email indicato nel contratto, la comunicazione con cui conferma di aver ricevuto il pagamento e di avergli aperto gli accessi all'Area riservata e ai Materiali; da quel giorno decorrono i 6 mesi.

### Art. 2 – Oggetto
2.1 Il Fornitore eroga al Cliente il Programma, composto da: (a) una libreria di lezioni registrate sui temi del Programma (contenuti, strategia, storie, offerta, vendita e prezzo), in continuo aggiornamento; (b) 1 chiamata di gruppo a settimana in diretta; (c) 1 chiamata individuale di onboarding di 1 ora; (d) accesso alla Community; (e) bonus: accesso al programma «LosAuthority». Sono componenti essenziali quelle delle lettere da (a) a (d).
2.2 Alla firma le lezioni coprono, a titolo indicativo: i 3 tipi di contenuti che vendono senza ads; piano di storie; ottimizzazione dell'offerta; aumento della percentuale di vendite; aumento del prezzo; vendita high ticket. Titoli, numero e ordine dei moduli possono cambiare (art. 3.5).

### Art. 3 – Erogazione e durata
3.1 Il Programma è erogato online. Ricevuto il pagamento, il Fornitore avvia l'onboarding: apre al Cliente gli accessi all'Area riservata e ai Materiali e gli invia via email la comunicazione di attivazione. Il giorno di quella comunicazione è l'Attivazione e da lì decorrono i 6 mesi. Chiamata di onboarding e ingresso nelle chiamate di gruppo sono concordati con il Cliente.
3.2 Il Programma dura 6 mesi dall'Attivazione. Alla scadenza cessano le chiamate di gruppo settimanali, il gruppo WhatsApp, l'accesso al Sito e gli altri servizi inclusi; le registrazioni delle live non restano disponibili. Come cortesia di lancio, senza assumere alcun obbligo contrattuale, il Fornitore intende lasciare al Cliente anche dopo la scadenza l'accesso alla Community Skool, alle lezioni già presenti nella Community Skool alla data della firma e al programma «UPSCALE», comprese le lezioni che aggiungerà in futuro dentro «UPSCALE». La cortesia non comprende programmi, corsi o percorsi diversi da «UPSCALE» che il Fornitore pubblicherà in futuro, su Skool o altrove, che restano a pagamento. La cortesia è riservata a chi arriva alla scadenza del Programma: non spetta in caso di recesso (art. 10) o di risoluzione (art. 11). La cortesia è gratuita, non concorre a formare il prezzo e cessa con la chiusura della Community Skool, che il Fornitore può decidere in qualsiasi momento, anche senza preavviso, senza che ciò dia diritto a rimborsi o indennizzi. Restano applicabili gli artt. 6 e 7.
3.3 Le chiamate di gruppo seguono un calendario del Fornitore, modificabile con preavviso di 24 ore; sono registrate e disponibili ai partecipanti. Le chiamate non seguite non danno diritto a recuperi individuali né a rimborsi.
3.4 La chiamata di onboarding va prenotata entro 60 giorni dall'Attivazione; poi il diritto decade.
3.5 Il Fornitore aggiorna, amplia e riorganizza lezioni e Materiali per seguire l'evoluzione delle piattaforme social, del mercato e del proprio metodo, e può cambiare le Piattaforme. Le componenti essenziali dell'art. 2.1 (lezioni registrate, onboarding, chiamate di gruppo settimanali, Community) restano garantite per tutta la durata.
3.6 Il Sito è uno strumento accessorio che il Fornitore mette a disposizione gratuitamente: non è una componente del Programma, non concorre a formare il prezzo e non rientra tra le componenti essenziali dell'art. 2.1. Il Fornitore può modificarlo, sospenderlo o chiuderlo in qualsiasi momento, senza che ciò dia diritto a rimborsi o indennizzi; quando è possibile avvisa prima il Cliente. Finché il Sito è attivo il Cliente può scaricare i documenti che lo riguardano; l'accesso al Sito cessa in ogni caso alla scadenza del Programma.

### Art. 4 – Natura della prestazione
4.1 Il Fornitore assume un'obbligazione di mezzi, non di risultato.
4.2 Non è garantito alcun risultato economico o commerciale (vendite, fatturato, clienti, follower, visualizzazioni, prezzi): i risultati dipendono dal mercato, dal settore e soprattutto dall'applicazione del Cliente.
4.3 Esempi, casi e numeri mostrati dal Fornitore sono illustrativi, non promesse.
4.4 Il Cliente dichiara di aver deciso l'acquisto sulla base dell'art. 2 e non di promesse di guadagno.
4.5 Il Programma ha finalità formative: non è consulenza legale, fiscale, finanziaria o medica e non rilascia titoli o qualifiche con valore legale.
4.6 Il Fornitore esercita una professione disciplinata ai sensi della L. 4/2013, non iscritta ad albi o ordini.

### Art. 5 – Corrispettivo e pagamento
5.1 Il prezzo è di ${euroContratto(prezzo)} €, operazione senza IVA ai sensi dell'art. 1, commi 54-89, L. 190/2014 (regime forfettario); comprende tutto quanto indicato all'art. 2, bonus incluso.
5.2 Il pagamento è unico e anticipato, con le modalità concordate tra le Parti; l'Attivazione è subordinata all'incasso. Non sono previste rateizzazioni.
5.3 Il bonus «LosAuthority» è incluso nel prezzo, non è rimborsabile né cedibile separatamente dal Programma e non ha valore autonomo. Restano fermi i rimborsi degli artt. 10.1 e 10.4.
5.4 Il Fornitore emette fattura al Cliente con il suo codice fiscale, con imposta di bollo ove dovuta.

### Art. 6 – Obblighi del Cliente e regole della Community
6.1 Il Cliente si impegna a: fornire dati veritieri; usare le credenziali solo personalmente; partecipare con rispetto verso il Fornitore e gli altri membri; non registrare le chiamate; non fare spam; non promuovere o vendere nella Community senza autorizzazione scritta del Fornitore; non contattare gli altri membri per fini commerciali senza il loro consenso; non promuovere, dentro o fuori la Community, prodotti, servizi o pratiche contrari ai valori del Fornitore, in particolare promesse di guadagno facile, schemi piramidali, contenuti offensivi o discriminatori.
6.2 L'accesso è personale e non trasferibile.
6.3 Se il Cliente viola l'art. 6.1 il Fornitore può richiamarlo per iscritto e, nei casi previsti dall'art. 11, sospenderne l'accesso e risolvere il contratto.

### Art. 7 – Proprietà intellettuale
7.1 Materiali, metodo, nome «Los Academy» e ogni contenuto del Programma sono di proprietà esclusiva del Fornitore (L. 633/1941 e D.Lgs. 30/2005).
7.2 Il Cliente riceve una licenza personale, non esclusiva, non trasferibile, limitata alla durata del Programma e al proprio uso; per le sole lezioni della cortesia dell'art. 3.2 la licenza dura finché il Fornitore mantiene la cortesia.
7.3 È vietato: copiare o scaricare i Materiali oltre quanto consentito dalle Piattaforme; diffonderli, pubblicarli, venderli, cederli o condividerli, anche gratis; usarli per creare corsi o contenuti formativi concorrenti; caricarli in sistemi di intelligenza artificiale per riprodurli o generarne derivati.
7.4 I contenuti che il Cliente produce applicando il Programma restano suoi.
7.5 In caso di violazione il Fornitore può chiedere inibitoria, rimozione dei contenuti e risarcimento, e risolvere il contratto (art. 11).

### Art. 8 – Riservatezza
8.1 Le informazioni condivise dagli altri partecipanti nella Community e nelle chiamate sono riservate: il Cliente non le divulga, né durante né dopo il Programma.
8.2 Il Fornitore tratta con riservatezza le informazioni sul business del Cliente e non le usa pubblicamente senza il consenso dell'art. 9.2.

### Art. 9 – Registrazioni e immagine
9.1 Chiamate di gruppo e live sono registrate e rese disponibili ai partecipanti, come descritto nell'informativa privacy (art. 14.2); in diretta si partecipa con camera e microfono attivi, chi non vuole essere ripreso guarda la registrazione. La chiamata individuale di onboarding è registrata per il Cliente e per il Fornitore e non è resa disponibile ad altri senza il consenso separato del Cliente. Il Cliente è informato di queste registrazioni e le accetta ai fini dell'art. 10 c.c. e degli artt. 96-97 L. 633/1941.
9.2 L'uso pubblico di clip, messaggi, screenshot, risultati o testimonianze del Cliente (sito, social, materiale promozionale, esempi per potenziali clienti) richiede un consenso scritto separato, chiesto di volta in volta.

### Art. 10 – Recesso
10.1 **Diritto di recesso.** Il Cliente può recedere entro 14 giorni dalla conclusione del contratto o, se successiva, dall'Attivazione, senza motivazione né costi (artt. 52 ss. D.Lgs. 206/2005), con qualsiasi dichiarazione esplicita della propria decisione di recedere, per esempio con una email a ${F.email} o una PEC a ${F.pec} che indichi nome e data del contratto. Il Fornitore rimborsa l'intero importo entro 14 giorni dal ricevimento, con lo stesso mezzo di pagamento.
10.2 **Materiali e accessi in caso di recesso.** Dall'Attivazione il Cliente ha accesso completo ai Materiali anche nei 14 giorni; se recede, perde subito ogni accesso ottenuto con il presente contratto (Area riservata, Materiali, Community Skool e Sito) e cancella i Materiali scaricati o copiati. Gli artt. 7 e 8 restano in vigore anche dopo il recesso.
10.3 **Dopo il termine.** Scaduti i 14 giorni il contratto è vincolante fino alla scadenza dei 6 mesi: interruzione o abbandono da parte del Cliente non danno diritto a rimborsi, neppure parziali.
10.4 **Interruzione da parte del Fornitore.** Il Fornitore può interrompere il Programma, per tutti o per il singolo Cliente, in qualsiasi momento e per qualsiasi motivo, con preavviso scritto di 30 giorni, rimborsando la quota di prezzo proporzionale ai giorni non goduti (prezzo diviso per i giorni totali dei 6 mesi, moltiplicato per i giorni residui) o, se il Cliente accetta, offrendo un programma equivalente per il periodo residuo. Nessun altro importo è dovuto. Il Cliente accetta fin d'ora che il Programma possa essere modificato (artt. 3.5 e 13) o interrotto a queste condizioni.

### Art. 11 – Risoluzione e sospensione
11.1 Ai sensi dell'art. 1456 c.c., il Fornitore può risolvere il contratto con comunicazione scritta se il Cliente: (a) viola i divieti dell'art. 7.3 o l'obbligo di riservatezza dell'art. 8.1; (b) cede a terzi le credenziali o l'accesso; (c) tiene condotte gravi verso il Fornitore o altri membri (offese, molestie, minacce, discriminazioni); (d) viola in modo grave, oppure di nuovo dopo un richiamo scritto, uno degli altri obblighi dell'art. 6.1: non registrare le chiamate, non fare spam, non promuovere o vendere senza autorizzazione, non contattare altri membri per fini commerciali senza il loro consenso, non promuovere guadagni facili, schemi piramidali o contenuti offensivi o discriminatori.
11.2 Con la risoluzione cessa ogni accesso ottenuto con il presente contratto: Area riservata, Materiali (lezioni registrate comprese), Community Skool e Sito. Gli importi pagati restano al Fornitore, salvo il maggior danno.
11.3 Nei casi dell'art. 11.1 il Fornitore può sospendere subito, in via cautelare, l'accesso a Community e chiamate; la sospensione non è inadempimento.

### Art. 12 – Responsabilità
12.1 Il Fornitore non risponde delle scelte imprenditoriali, commerciali, fiscali o di comunicazione del Cliente né dei loro risultati.
12.2 Il Fornitore non risponde di malfunzionamenti, modifiche o chiusure delle Piattaforme di terzi e dei social (Instagram, TikTok, LinkedIn e simili), né di blocchi degli account del Cliente. Per il Sito vale l'art. 3.6.
12.3 Restano ferme le norme inderogabili del D.Lgs. 206/2005 a tutela del Cliente.

### Art. 13 – Modifiche al Programma e forza maggiore
13.1 Il Fornitore può modificare contenuti, calendario e Piattaforme (art. 3.5); l'eliminazione di una componente essenziale dell'art. 2.1 richiede l'accordo scritto del Cliente.
13.2 Per forza maggiore o impedimento del Fornitore (malattia, guasti, cause non imputabili) le chiamate sono rinviate e recuperate e la durata è prorogata di pari periodo, senza rimborsi.

### Art. 14 – Dati personali
14.1 Titolare del trattamento è il Fornitore; finalità e basi giuridiche del trattamento (Reg. UE 2016/679) sono indicate nell'informativa privacy.
14.2 Il Cliente dichiara di aver preso visione, prima della firma, dell'informativa ex art. 13 del Regolamento, pubblicata all'indirizzo ${URL_INFORMATIVA}.
14.3 Le Piattaforme di terzi trattano i dati secondo le proprie informative. Il Cliente accetta che nel gruppo WhatsApp nome e numero di telefono siano visibili agli altri membri e rispetta i dati personali degli altri (art. 8).

### Art. 15 – Comunicazioni e disposizioni finali
15.1 Le comunicazioni ordinarie avvengono via email o messaggi privati su social e WhatsApp. Contestazioni, risoluzione e revoche vanno inviate via email o PEC agli indirizzi delle Parti; un messaggio privato vale solo se il destinatario ne conferma per iscritto la ricezione. Per il recesso vale l'art. 10.1.
15.2 Il presente contratto è l'intero accordo tra le Parti e sostituisce ogni intesa precedente, anche verbale o in chat.
15.3 Il Cliente non può cedere il contratto o i diritti che ne derivano.
15.4 Le modifiche valgono solo per iscritto; la nullità di una clausola non travolge le altre; la tolleranza di una violazione non è rinuncia.
15.5 Gli artt. 7 e 8 restano in vigore anche dopo la fine del contratto, per qualsiasi causa.

### Art. 16 – Legge applicabile e foro
16.1 Il contratto è regolato dalla legge italiana.
16.2 Per ogni controversia è competente il giudice di residenza o domicilio del Cliente (art. 66-bis D.Lgs. 206/2005).
`);
}

/** Seconda firma: approvazione specifica delle clausole (artt. 1341 e 1342 c.c.). */
export const APPROVAZIONE_PRIVATO =
  "**Approvazione specifica (artt. 1341 e 1342 c.c.).** Il Cliente dichiara di aver letto e di approvare specificamente le clausole: " +
  "3.2, 3.3, 3.4, 3.5 e 3.6 (cortesia di lancio e sua cessazione, chiamate non recuperabili, decadenza onboarding, aggiornamento contenuti, Sito accessorio e sua chiusura); " +
  "4 (nessuna garanzia di risultato); 5.3 (bonus non rimborsabile); 6.1 e 6.3 (regole di condotta, richiamo e sospensione); 7.2 e 7.3 (limiti della licenza); 9.1 (registrazioni); " +
  "10.2, 10.3 e 10.4 (accessi dopo il recesso, nessun rimborso dopo il termine, interruzione da parte del Fornitore); " +
  "11 (risoluzione espressa e sospensione); 12 (esclusioni di responsabilità); 13 (modifiche e forza maggiore); 15.3 (divieto di cessione).";

