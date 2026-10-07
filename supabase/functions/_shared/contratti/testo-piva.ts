/**
 * Contratto «UPSCALE» — versione per chi compra con PARTITA IVA
 * (professionista o società). 17 articoli.
 *
 * È il testo che il cliente firma: ogni modifica qui cambia un contratto.
 * Quando il testo cambia, aggiorna MODELLO_PIVA: i contratti già firmati non
 * ne risentono (alla firma si salva il testo integrale).
 */

import { blocchi, dataBreve, euroBreve, euroContratto } from "./documento.ts";
import { FORNITORE as F, indirizzoInRiga } from "./fornitore.ts";
import { URL_INFORMATIVA } from "./informativa.ts";
import { sessoDaCodiceFiscale } from "./validazione.ts";
import type { Blocco, DatiProfessionista, DatiSocieta, RecapitoFattura } from "./tipi.ts";

export const MODELLO_PIVA = "upscale-piva-2026.10";

function recapitoFattura(r: RecapitoFattura): string {
  const parti: string[] = [];
  if (r.codice_destinatario) parti.push(`codice destinatario ${r.codice_destinatario}`);
  if (r.pec) parti.push(`PEC ${r.pec}`);
  return parti.join(", ");
}

/** Il blocco «e …» delle parti: cambia tra professionista e società. */
function parteCliente(tipo: "professionista" | "societa", dati: DatiProfessionista | DatiSocieta): string {
  if (tipo === "societa") {
    const s = dati as DatiSocieta;
    return (
      `**${s.ragione_sociale}**, con sede legale in ${indirizzoInRiga(s.indirizzo)}, C.F. ${s.codice_fiscale}, ` +
      `P.IVA ${s.partita_iva}, ${recapitoFattura(s)}, in persona del legale rappresentante ` +
      `${s.rappresentante_nome} ${s.rappresentante_cognome}, email ${s.email}, telefono ${s.telefono} (di seguito il «Cliente»).`
    );
  }
  const p = dati as DatiProfessionista;
  const nato = sessoDaCodiceFiscale(p.codice_fiscale) === "F" ? "nata" : "nato";
  return (
    `**${p.nome} ${p.cognome}**, ${nato} a ${p.luogo_nascita} il ${dataBreve(p.data_nascita)}, con sede in ` +
    `${indirizzoInRiga(p.indirizzo)}, C.F. ${p.codice_fiscale}, P.IVA ${p.partita_iva}, ${recapitoFattura(p)}, ` +
    `email ${p.email}, telefono ${p.telefono} (di seguito il «Cliente»).`
  );
}

export function corpoPiva(
  tipo: "professionista" | "societa",
  dati: DatiProfessionista | DatiSocieta,
  prezzo: number,
  telefonoFornitore?: string | null,
): Blocco[] {
  const telefono = telefonoFornitore ? `, telefono ${telefonoFornitore}` : "";
  const accesso =
    tipo === "societa"
      ? `6.2 L'accesso è personale e non trasferibile. Il Programma è fruito da una sola persona fisica, indicata dal Cliente alla firma: ${(dati as DatiSocieta).partecipante_nome} ${(dati as DatiSocieta).partecipante_cognome}. Il Cliente risponde del rispetto degli artt. 6, 7 e 8 da parte di tale persona.`
      : "6.2 L'accesso è personale e non trasferibile.";

  return blocchi(`
# Contratto Programma UPSCALE
## Parti e premesse
Contratto di prestazione di servizi formativi (artt. 2222 ss. c.c.) per il programma «UPSCALE» di Los Academy: durata 6 mesi, prezzo ${euroBreve(prezzo)} €.
= Tra
**${F.nome}**, titolare di partita IVA, con sede in ${F.sede}, P.IVA ${F.partitaIva}, C.F. ${F.codiceFiscale}, PEC ${F.pec}, email ${F.email}${telefono}, che presenta i propri programmi formativi con la denominazione commerciale «Los Academy» (di seguito il «Fornitore»);
= e
${parteCliente(tipo, dati)}
= Premesso che
a) il Fornitore svolge attività di formazione e consulenza in marketing e comunicazione digitale, professione disciplinata ai sensi della legge 14 gennaio 2013, n. 4;
b) il Cliente intende acquistare il programma formativo «UPSCALE» descritto all'art. 2;
c) il Cliente dichiara di essere titolare di partita IVA n. ${dati.partita_iva} e di concludere il presente contratto nell'esercizio della propria attività imprenditoriale o professionale, per la crescita del proprio business;
d) il Cliente ha letto il presente contratto prima della firma e ha così ricevuto le informazioni precontrattuali previste dalla legge;
e) le premesse sono parte integrante del contratto.

### Art. 1 – Definizioni
- **Parti**: il Fornitore e il Cliente.
- **Los Academy**: la denominazione commerciale con cui il Fornitore presenta i propri programmi formativi. Non è una società né un soggetto distinto dal Fornitore: la controparte del Cliente è ${F.nome}.
- **Programma**: il programma formativo «UPSCALE», della durata di 6 mesi, con i contenuti dell'art. 2.
- **Materiali**: lezioni registrate, testi, template, prompt, registrazioni delle chiamate e ogni altro contenuto messo a disposizione dal Fornitore.
- **Community Skool**: la community generale del Fornitore sulla piattaforma Skool, frequentata anche da persone che non partecipano al Programma.
- **Area riservata**: gli spazi riservati ai soli partecipanti al Programma: i moduli del programma «UPSCALE» dentro la Community Skool, le chiamate di gruppo, il gruppo WhatsApp privato e ogni altro spazio privato online che il Fornitore riserva ai partecipanti.
- **Community**: la Community Skool e l'Area riservata, considerate insieme.
- **Sito**: l'area clienti del sito ${F.sito}, strumento accessorio regolato dall'art. 3.6.
- **Piattaforme**: gli strumenti, di terzi o del Fornitore, usati per erogare il Programma (piattaforma corsi, community, videochiamate, Sito).
- **Attivazione**: il giorno in cui il Fornitore invia al Cliente, all'indirizzo email indicato nel contratto, la comunicazione con cui conferma di aver ricevuto il pagamento e di avergli aperto gli accessi all'Area riservata e ai Materiali; da quel giorno decorrono i 6 mesi.
- **Cliente Professionista**: il Cliente che conclude il contratto nell'esercizio della propria attività imprenditoriale o professionale, come dichiarato nella premessa c).
- **Cliente Consumatore**: la persona fisica che agisce per scopi estranei all'attività imprenditoriale o professionale eventualmente svolta (art. 3 D.Lgs. 206/2005).

### Art. 2 – Oggetto
2.1 Il Fornitore eroga al Cliente il Programma, composto da: (a) una libreria di lezioni registrate sui temi del Programma (contenuti, strategia, storie, offerta, vendita e prezzo), in continuo aggiornamento e ampliamento; (b) 1 chiamata di gruppo a settimana in diretta; (c) 1 chiamata individuale di onboarding di 1 ora; (d) accesso alla Community; (e) bonus: accesso al programma «LosAuthority». Sono componenti essenziali quelle delle lettere da (a) a (d).
2.2 Alla data della firma le lezioni registrate coprono, a titolo indicativo, questi moduli: i 3 tipi di contenuti che vendono senza ads; piano di storie; ottimizzazione dell'offerta; aumento della percentuale di vendite; aumento del prezzo del servizio o prodotto; vendita high ticket. Titoli, numero e ordine dei moduli possono cambiare ai sensi dell'art. 3.5.

### Art. 3 – Erogazione e durata
3.1 Il Programma è erogato online. Ricevuto il pagamento, il Fornitore avvia il processo di onboarding con il Cliente: gli apre gli accessi all'Area riservata e ai Materiali e gli invia via email la comunicazione di attivazione. Il giorno di quella comunicazione è l'Attivazione: da quel giorno il Cliente accede ai Materiali e alla Community e decorrono i 6 mesi. La chiamata di onboarding e l'ingresso nelle chiamate di gruppo sono concordati con il Cliente.
3.2 Il Programma dura 6 mesi dall'Attivazione. Alla scadenza cessano le chiamate di gruppo settimanali, il gruppo WhatsApp, l'accesso al Sito e gli altri servizi inclusi; le registrazioni delle live non restano disponibili. Come cortesia di lancio, senza assumere alcun obbligo contrattuale, il Fornitore intende lasciare al Cliente anche dopo la scadenza l'accesso alla Community Skool, alle lezioni già presenti nella Community Skool alla data della firma e al programma «UPSCALE», comprese le lezioni che aggiungerà in futuro dentro «UPSCALE». La cortesia non comprende programmi, corsi o percorsi diversi da «UPSCALE» che il Fornitore pubblicherà in futuro, su Skool o altrove, che restano a pagamento. La cortesia è riservata a chi arriva alla scadenza del Programma: non spetta in caso di risoluzione (art. 11). La cortesia è gratuita, non concorre a formare il prezzo e cessa con la chiusura della Community Skool, che il Fornitore può decidere in qualsiasi momento, anche senza preavviso, senza che ciò dia diritto a rimborsi o indennizzi. Restano applicabili gli artt. 6 e 7.
3.3 Le chiamate di gruppo seguono un calendario comunicato dal Fornitore, che può modificarlo con preavviso di almeno 24 ore. Le chiamate sono registrate e rese disponibili ai partecipanti. Le chiamate non seguite dal Cliente non danno diritto a sessioni di recupero individuali né a rimborsi.
3.4 La chiamata di onboarding va prenotata dal Cliente entro 60 giorni dall'Attivazione. Scaduto il termine, il diritto alla chiamata decade.
3.5 Il Fornitore aggiorna, amplia e riorganizza le lezioni e i Materiali nel corso del tempo, per adeguarli all'evoluzione delle piattaforme social, del mercato e del proprio metodo, e può sostituire le Piattaforme usate. Le componenti essenziali dell'art. 2.1 (lezioni registrate, chiamata di onboarding, chiamate di gruppo settimanali, Community) restano garantite per tutta la durata del Programma.
3.6 Il Sito è uno strumento accessorio che il Fornitore mette a disposizione gratuitamente: non è una componente del Programma, non concorre a formare il prezzo e non rientra tra le componenti essenziali dell'art. 2.1. Il Fornitore può modificarlo, sospenderlo o chiuderlo in qualsiasi momento, senza che ciò dia diritto a rimborsi o indennizzi; quando è possibile avvisa prima il Cliente. Finché il Sito è attivo il Cliente può scaricare i documenti che lo riguardano; l'accesso al Sito cessa in ogni caso alla scadenza del Programma.

### Art. 4 – Natura della prestazione
4.1 Il Fornitore assume un'obbligazione di mezzi, non di risultato: si impegna a erogare il Programma con diligenza e competenza, non a garantire un esito.
4.2 Il Fornitore non garantisce alcun risultato economico o commerciale: vendite, fatturato, clienti, follower, visualizzazioni o prezzi. I risultati dipendono dal mercato, dal settore e soprattutto dall'applicazione del Cliente.
4.3 Esempi, casi e numeri mostrati nel Programma o nella comunicazione del Fornitore sono illustrativi e non costituiscono promessa o garanzia.
4.4 Il Cliente dichiara di aver deciso l'acquisto sulla base dei contenuti dell'art. 2 e non di promesse di guadagno.
4.5 Il Programma ha finalità formative. Non è consulenza legale, fiscale, finanziaria o medica e non sostituisce i professionisti abilitati. Al termine non viene rilasciato alcun titolo di studio o qualifica con valore legale.
4.6 Il Fornitore esercita una professione disciplinata ai sensi della L. 4/2013 e non è iscritto ad albi o ordini professionali.

### Art. 5 – Corrispettivo e pagamento
5.1 Il prezzo del Programma è di **${euroContratto(prezzo)} €**. Operazione senza applicazione dell'IVA ai sensi dell'art. 1, commi 54-89, L. 190/2014 (regime forfettario). Il prezzo comprende tutto quanto indicato all'art. 2, bonus incluso.
5.2 Il pagamento è unico e anticipato, con le modalità concordate tra le Parti. L'Attivazione è subordinata all'incasso. Non sono previste rateizzazioni.
5.3 Il bonus «LosAuthority» è incluso nel prezzo. Non è rimborsabile né cedibile separatamente dal Programma e non ha un valore autonomo ai fini del presente contratto. Resta fermo il rimborso dell'art. 10.3.
5.4 Il Fornitore emette fattura per il pagamento ricevuto, con imposta di bollo ove dovuta.

### Art. 6 – Obblighi del Cliente e regole della Community
6.1 Il Cliente si impegna a: fornire dati veritieri; usare le credenziali solo personalmente e non cederle a terzi; partecipare in modo rispettoso verso il Fornitore e gli altri membri; non registrare le chiamate con mezzi propri; non fare spam; non promuovere né vendere prodotti o servizi nella Community senza autorizzazione scritta del Fornitore; non contattare gli altri membri per finalità commerciali senza il loro consenso; non promuovere, dentro o fuori la Community, prodotti, servizi o pratiche contrari ai valori del Fornitore, in particolare promesse di guadagno facile, schemi piramidali, contenuti offensivi o discriminatori.
${accesso}
6.3 Se il Cliente viola l'art. 6.1 il Fornitore può richiamarlo per iscritto e, nei casi previsti dall'art. 11, sospenderne l'accesso e risolvere il contratto.

### Art. 7 – Proprietà intellettuale
7.1 I Materiali, il metodo, il nome «Los Academy» e ogni contenuto del Programma sono di proprietà esclusiva del Fornitore e sono protetti dalla L. 633/1941 e dal D.Lgs. 30/2005.
7.2 Il Cliente riceve una licenza personale, non esclusiva, non trasferibile e limitata alla durata del Programma, per il solo uso nella propria attività; per le sole lezioni della cortesia dell'art. 3.2 la licenza dura finché il Fornitore mantiene la cortesia.
7.3 È vietato: copiare o scaricare i Materiali oltre quanto consentito dalle Piattaforme; diffonderli, pubblicarli, venderli o cederli; condividerli con terzi anche gratuitamente; usarli per creare corsi, programmi o contenuti formativi concorrenti; caricarli in sistemi di intelligenza artificiale per riprodurli o generare contenuti derivati.
7.4 I contenuti che il Cliente produce applicando il Programma (post, video, offerte) restano di proprietà del Cliente.

### Art. 8 – Riservatezza
8.1 Le informazioni condivise nella Community e nelle chiamate dagli altri partecipanti (dati aziendali, numeri, situazioni personali) sono riservate. Il Cliente non le divulga a terzi, né durante né dopo il Programma.
8.2 Il Fornitore tratta con riservatezza le informazioni sul business del Cliente e non le usa pubblicamente senza il consenso previsto dall'art. 9.2.

### Art. 9 – Registrazioni e immagine
9.1 Le chiamate di gruppo e le live sono registrate e rese disponibili ai partecipanti al Programma, come descritto nell'informativa privacy (art. 15.2). La partecipazione in diretta avviene con camera e microfono attivi: chi non desidera essere ripreso non partecipa alla diretta e guarda la registrazione. La chiamata individuale di onboarding è registrata per il Cliente e per il Fornitore e non è resa disponibile ad altri senza il consenso separato del Cliente. Il Cliente è informato di queste registrazioni e le accetta ai fini dell'art. 10 c.c. e degli artt. 96 e 97 L. 633/1941.
9.2 L'uso pubblico di estratti, clip, messaggi, screenshot, risultati o testimonianze del Cliente (sito, social, materiale promozionale, esempi per potenziali clienti) richiede un consenso scritto separato, che il Fornitore chiede al Cliente di volta in volta.

### Art. 10 – Recesso e interruzione
10.1 **Nessun diritto di recesso.** Il Cliente Professionista non ha il diritto di recesso che la legge riserva ai consumatori (artt. 52 ss. D.Lgs. 206/2005). Dalla firma il contratto è vincolante fino alla scadenza dei 6 mesi e gli importi pagati non sono rimborsabili, salvo quanto previsto all'art. 10.3. Il Cliente Professionista rinuncia al recesso previsto dall'art. 2227 c.c. Se, nonostante la dichiarazione della premessa c), il Cliente risulta Cliente Consumatore, può recedere entro 14 giorni dalla conclusione del contratto o, se successiva, dall'Attivazione, con qualsiasi dichiarazione esplicita inviata a ${F.email} o ${F.pec}, e il Fornitore rimborsa l'intero importo entro 14 giorni dal ricevimento.
10.2 **Abbandono.** L'interruzione o l'abbandono del Programma da parte del Cliente non dà diritto a rimborsi, neppure parziali.
10.3 **Interruzione del Programma da parte del Fornitore.** Il Fornitore può interrompere il Programma, per tutti i partecipanti o per il singolo Cliente, in qualsiasi momento e per qualsiasi motivo, con preavviso scritto di 30 giorni. In tal caso rimborsa al Cliente la quota di prezzo proporzionale ai giorni dei 6 mesi non ancora goduti (prezzo diviso per i giorni totali dei 6 mesi, moltiplicato per i giorni residui), oppure, se il Cliente accetta, gli offre l'accesso a un programma equivalente per il periodo residuo. Nessun altro importo è dovuto. Il Cliente accetta fin d'ora che il Programma possa essere modificato (artt. 3.5 e 14) o interrotto a queste condizioni.

### Art. 11 – Risoluzione e sospensione
11.1 Ai sensi dell'art. 1456 c.c., il Fornitore può risolvere il contratto con semplice comunicazione scritta se il Cliente: (a) viola i divieti dell'art. 7.3 (Proprietà intellettuale) o l'obbligo di riservatezza dell'art. 8.1; (b) cede a terzi le credenziali o l'accesso (art. 6.1); (c) tiene condotte gravi verso il Fornitore o altri membri (offese, molestie, minacce, discriminazioni); (d) viola in modo grave, oppure di nuovo dopo un richiamo scritto, uno degli altri obblighi dell'art. 6.1: non registrare le chiamate, non fare spam, non promuovere o vendere senza autorizzazione, non contattare altri membri per finalità commerciali senza il loro consenso, non promuovere guadagni facili, schemi piramidali o contenuti offensivi o discriminatori.
11.2 Con la risoluzione cessa ogni accesso ottenuto con il presente contratto: Area riservata, Materiali (lezioni registrate comprese), Community Skool e Sito. Gli importi pagati restano acquisiti dal Fornitore, salvo il risarcimento del maggior danno.
11.3 Nei casi dell'art. 11.1 il Fornitore può sospendere subito, in via cautelare, l'accesso alla Community e alle chiamate, in attesa della decisione definitiva. La sospensione non costituisce inadempimento del Fornitore.

### Art. 12 – Responsabilità
12.1 Il Fornitore non risponde delle scelte imprenditoriali, commerciali, fiscali o di comunicazione che il Cliente compie applicando il Programma, né dei risultati che ne derivano.
12.2 Il Fornitore non risponde di malfunzionamenti, interruzioni, modifiche o chiusure delle Piattaforme di terzi, comprese le piattaforme social (Instagram, TikTok, LinkedIn e simili), né di blocchi o limitazioni degli account del Cliente. Per il Sito vale l'art. 3.6.
12.3 Verso il Cliente Professionista la responsabilità del Fornitore è limitata a un importo massimo pari al prezzo pagato e sono esclusi danni indiretti, mancato guadagno e perdita di opportunità; ciò non vale in caso di dolo o colpa grave né negli altri casi in cui la legge vieta di limitare la responsabilità (art. 1229 c.c.). Verso il Cliente Consumatore si applicano le norme inderogabili del D.Lgs. 206/2005.

### Art. 13 – Rimedi in caso di violazione
13.1 In caso di violazione degli artt. 6.1 (cessione delle credenziali), 7 (Proprietà intellettuale) o 8 (Riservatezza), il Fornitore può chiedere il risarcimento del danno, oltre alla risoluzione di cui all'art. 11.
13.2 Resta fermo il diritto del Fornitore di ottenere l'inibitoria e la rimozione dei contenuti diffusi.

### Art. 14 – Modifiche al Programma e forza maggiore
14.1 Il Fornitore può modificare contenuti, calendario e Piattaforme ai sensi dell'art. 3.5. L'eliminazione di una delle componenti essenziali dell'art. 2.1 richiede l'accordo scritto del Cliente.
14.2 In caso di forza maggiore o di impedimento del Fornitore (malattia, guasti tecnici, cause non imputabili), le chiamate sono rinviate e recuperate e la durata del Programma è prorogata per il periodo corrispondente. Ciò non dà diritto a rimborsi.

### Art. 15 – Dati personali
15.1 Titolare del trattamento è il Fornitore. Finalità e basi giuridiche del trattamento (Reg. UE 2016/679) sono indicate nell'informativa privacy.
15.2 Il Cliente dichiara di aver preso visione, prima della firma, dell'informativa ai sensi dell'art. 13 del Regolamento, pubblicata all'indirizzo ${URL_INFORMATIVA}.
15.3 Le Piattaforme di terzi trattano i dati secondo le proprie informative. Il Cliente è consapevole che nel gruppo WhatsApp il suo nome e il suo numero di telefono sono visibili agli altri membri e accetta questa modalità. Il Cliente si impegna a rispettare i dati personali degli altri membri (art. 8).

### Art. 16 – Comunicazioni e disposizioni finali
16.1 Le comunicazioni ordinarie avvengono via email o tramite messaggi privati sui social e su WhatsApp, agli indirizzi e agli account indicati dalle Parti. Recesso, contestazioni, risoluzione e revoca dei consensi vanno inviati via email o PEC agli indirizzi indicati nelle Parti; un messaggio privato ha effetto solo se il destinatario ne conferma per iscritto la ricezione.
16.2 Il presente contratto costituisce l'intero accordo tra le Parti e sostituisce ogni intesa precedente, anche verbale o in chat.
16.3 Il Cliente non può cedere il contratto o i diritti che ne derivano.
16.4 Le modifiche sono valide solo per iscritto. La nullità di una clausola non travolge le altre. La tolleranza di una violazione non vale come rinuncia a farla valere.
16.5 Gli artt. 7 (Proprietà intellettuale), 8 (Riservatezza) e 13 (Rimedi in caso di violazione) restano in vigore anche dopo la fine del contratto, per qualsiasi causa.

### Art. 17 – Legge applicabile e foro
17.1 Il contratto è regolato dalla legge italiana.
17.2 Per il Cliente Professionista è competente in via esclusiva il Foro di Milano.
17.3 Per il Cliente Consumatore è competente il giudice del luogo di residenza o di domicilio del consumatore (art. 66-bis D.Lgs. 206/2005).
`);
}

/** Seconda firma: approvazione specifica delle clausole (artt. 1341 e 1342 c.c.). */
export const APPROVAZIONE_PIVA =
  "**Approvazione specifica ai sensi degli artt. 1341 e 1342 c.c.** Il Cliente dichiara di aver letto e di approvare specificamente le seguenti clausole: " +
  "3.2, 3.3, 3.4, 3.5 e 3.6 (cortesia di lancio e sua cessazione, chiamate non recuperabili, decadenza della chiamata di onboarding, aggiornamento dei contenuti, Sito accessorio e sua chiusura); " +
  "4 (natura della prestazione ed esclusione di garanzie di risultato); 5.3 (bonus non rimborsabile); 6.1 e 6.3 (regole di condotta, richiamo e sospensione); 7.2 e 7.3 (limiti della licenza); 9.1 (registrazione delle chiamate); " +
  "10.1, 10.2 e 10.3 (nessun diritto di recesso e nessun rimborso, abbandono, interruzione del Programma da parte del Fornitore); " +
  "11 (clausola risolutiva espressa e sospensione); 12 (limitazioni di responsabilità); 14 (modifiche e forza maggiore); 16.3 (divieto di cessione); 17.2 (foro esclusivo).";
