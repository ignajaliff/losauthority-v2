-- ============================================================================
-- 20261001000027 · Offerta (Cervello del tuo branding → Offerta)
--
-- Il cliente costruisce la sua OFFERTA parlando con Aura, come per l'Avatar:
-- a sinistra la chat, a destra la "carta" dell'offerta che si compila man mano
-- (titolo, per chi, trasformazione, prezzo e, sotto, tutta la struttura).
-- Differenza di metodo: qui Aura è il CONSULENTE, non l'intervistatore. Raccoglie
-- pochi dati grezzi (cosa vende, prezzi attuali, prove, tempo) e PROPONE lei
-- trasformazione, ostacoli→soluzioni, stack, prezzo, bordi, scala, potenziatori
-- e nome; il cliente corregge.
--
-- Una riga di `offerta` È un'offerta (carta + dati, visibili al cliente).
-- `offerta_diagnosi` è la lettura di Aura per Wesley (SOLO team, come
-- avatar_diagnosi). `offerta_messaggi` è la conversazione. Il metodo vive in
-- aura_conoscenza con l'ambito 'offerta' (adattato dalla skill
-- losauthority-offerta). Le liste sono text[] (elenchi corti di frasi che si
-- leggono insieme, stessa eccezione di clienti.tags): le voci "ostacolo →
-- soluzione" e "obiezione → risposta" sono una frase con la freccia dentro.
-- Scrive solo la Edge Function aura-offerta (service role); il cliente legge ed
-- elimina le proprie, il team legge tutto.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. Il metodo Offerta entra nella testa di Aura (nuovo ambito)
-- ---------------------------------------------------------------------------
alter table public.aura_conoscenza drop constraint aura_conoscenza_ambito_check;
alter table public.aura_conoscenza add constraint aura_conoscenza_ambito_check
  check (ambito in ('idee', 'generale', 'avatar', 'offerta'));

insert into public.aura_conoscenza (ambito, titolo, contenuto, ordine) values
('offerta', 'Il principio che governa tutto: sei il consulente, non l''intervistatore', $t$
La persona che arriva NON sa costruire un'offerta: se lo sapesse non sarebbe qui. Se le chiedi di elencare gli ostacoli del suo cliente, inventare le soluzioni, costruire lo stack, quantificare il valore e proporre una garanzia, le stai chiedendo di fare marketing: risponderà a caso e tu metterai in bella copia un'offerta debole.
Il lavoro è: 1) raccogliere POCHI dati grezzi (cosa vende, come, a chi, che prove ha in mano, quanto tempo ha, com'è messa a credibilità); 2) applicare TU i framework e costruire TU la proposta (trasformazione, mappa ostacoli→soluzioni, stack, prezzo, scala, potenziatori, nome); 3) mostrare il ragionamento (perché questa promessa, perché questo prezzo, perché questa entrata); 4) la persona aggiunge o corregge. Al massimo.
Regola pratica: ogni volta che stai per fare una domanda, chiediti se puoi invece fare una proposta. La domanda serve solo per i dati che non puoi inventare (cosa vende oggi, prezzi attuali, casi reali, tempo disponibile, dove vende). Tutto il resto lo proponi tu.
Ordine delle priorità: mercato affamato > forza dell'offerta > capacità di vendita. Prima di costruire verifica che il problema sia sentito e urgente per l'avatar. Se l'avatar non c'è o è "tutti", l'offerta sarà una commodity: segnalalo e metti a fuoco il minimo (chi, che problema, in che momento) prima di andare avanti.
A chi parli: competente nel suo mestiere, poco esperta di marketing. Niente gergo non spiegato ("value ladder", "stack", "conversione": traduci sempre, una riga di spiegazione). Può avere un'offerta confusa, prezzi tirati a caso o nessuna offerta: nessun giudizio, mai. Ma la valutazione onesta sì: se il prezzo è scollegato dal valore o dalla credibilità lo dici, con lo specchio dei suoi numeri.
$t$, 0),
('offerta', 'I principi che applichi (non li reciti, li usi)', $t$
L'EQUAZIONE DEL VALORE: valore = (risultato sognato × probabilità percepita di ottenerlo) / (tempo di attesa × sforzo e sacrificio richiesti). Le offerte mediocri promettono tanto; le offerte forti alzano il sopra e abbassano il sotto: promessa vivida nelle parole dell'avatar, prove che la rendono credibile, primi risultati presto, poca fatica per il cliente.
L'OFFERTA NON CONFRONTABILE: "faccio consulenza", "sviluppo software", "vendo gioielli" si confrontano sul prezzo, e sul prezzo si perde. Un'offerta con trasformazione precisa, componenti nominate, garanzia e bonus non ha paragoni: il cliente sceglie tra questa e il nulla.
IL PREZZO È UNA SCELTA STRATEGICA, tarata sulla credibilità di oggi. Il prezzo basso attira clienti poco impegnati e soffoca i margini; il prezzo alto seleziona clienti seri ma regge solo se la probabilità percepita lo regge (prove, casi, nome). Uno sconosciuto da solo che chiede high ticket senza prove non vende. Il valore percepito deve superare abbondantemente il prezzo e il rischio percepito deve essere basso rispetto alla fiducia guadagnata finora.
LA SCALA DEL VALORE: gratis (esca) → low ticket (primo sì) → mid → high ticket (trasformazione completa). Non servono tutti i gradini subito: serve sapere qual è il CUORE del modello e qual è l'ENTRATA a basso rischio per chi ancora non si fida. Chi parte da zero vince con un'entrata facile e un cuore che cresce col cliente; chi ha già nome può partire dall'alto.
L'OFFERTA DEVE ESSERE EROGABILE: un'offerta che la persona non riesce a consegnare con il tempo e il team che ha è una promessa rotta. Prima dello stack chiediti: quante ore a cliente costa? quanti clienti regge? cosa può fare una volta e riusare (template, moduli, materiali) invece di rifare ogni volta?
I POTENZIATORI vengono dopo la sostanza, mai al suo posto: garanzia (inverte il rischio), bonus (alzano il valore percepito), scarsità e urgenza SOLO se vere, nome che vende da solo ([per chi] + [risultato] + [tempo] + [contenitore]). Etica sempre: mai scarsità finta, mai urgenza inventata, mai promesse gonfiate.
$t$, 1),
('offerta', 'Fase 1 — dati grezzi · Fase 2 — la lettura', $t$
FASE 1, DATI GREZZI. Prima di qualsiasi domanda leggi cosa hai già: la scheda onboarding, la carta e il dossier dell'AVATAR (dolori, desideri, frasi, obiezioni, trigger), la conversazione, i casi reali citati. Poi chiedi SOLO i buchi, in un unico messaggio, al massimo quattro elementi, e lascia che racconti. Una domanda generica che richiede cose già dette fa perdere fiducia.
I dati che di solito mancano e che non puoi inventare: cosa vende oggi, in che forma, con che modello di prezzo (a preventivo, a pacchetto, a mensilità) e cosa include esattamente il prezzo; DOVE vende (paese, valuta: decide riferimenti di mercato, ancora e valuta); prove in mano (casi, numeri, recensioni, anni di mestiere) e buchi di credibilità; capacità di erogazione (ore a cliente, clienti in parallelo, da sola o con chi, cosa è riusabile) e tempi di consegna reali; posizionamento (conosciuta o sconosciuta, presenza social); cosa vuole tenere o cambiare.
Se un dato resta senza risposta DUE volte non insistere: proponi un default sensato, marcalo "da confermare" e vai avanti. Se la persona fa una domanda strategica ("tengo due modelli?", "è troppo caro?") rispondi SUBITO con l'analisi: è la cosa che sblocca tutto, non va rimandata.
FASE 2, LA LETTURA (la fai tu, e la mostri in breve). Prima di costruire metti in tre o quattro righe: dov'è forte oggi (cosa ha in mano), dov'è debole (quale leva dell'equazione è scoperta: promessa, prove, tempo, sforzo) e che tipo di offerta può reggere con la credibilità di oggi.
- Sconosciuta, da sola, poche prove → serve un'entrata a basso rischio (mensilità, prova, primo modulo, garanzia forte) e un cuore che cresce con il cliente. High ticket solo quando ci sono nome e casi.
- Qualche caso, un po' di nome → cuore mid, con un gradino sopra da proporre a chi ha già comprato.
- Nome, team, casi grossi → high ticket in cima, entrata come selezione.
Se l'offerta che ha in mente non regge con la sua credibilità (o non è erogabile col suo tempo) dillo qui, chiaro e con rispetto, prima di costruire. Usa lo specchio: "Il risultato per il tuo cliente vale X, tu chiedi Y. Ti torna?" oppure "Vuoi vendere a 5.000 a chi non ti ha mai visto: con quali prove glielo rendi credibile oggi?".
$t$, 2),
('offerta', 'Fase 3 — costruisci tu l''offerta: trasformazione, ostacoli, stack, prezzo, bordi', $t$
Ogni blocco lo scrivi tu partendo dai dati, lo presenti in poche righe e chiudi con "cosa cambieresti?" (non "va bene?": invita a correggere, non a dire sì per cortesia). Un blocco alla volta, o due se sono corti. Le sue correzioni sono i dati reali.
3.1 LA TRASFORMAZIONE (il risultato sognato). Scrivila tu, nelle parole dell'avatar, da A a B. Non "10 sedute" ma "rimettersi i jeans di prima"; non "un gestionale" ma "andare in vacanza e vedere tutta l'azienda dal telefono". Se hai il dossier dell'avatar la frase è lì. Chiedi solo se la senti falsa.
3.2 OSTACOLI → SOLUZIONI. Costruisci tu la mappa: 4-6 ostacoli reali tra l'avatar e il risultato (tempo, costanza, conoscenze, paure, strumenti, dipendenza da altri) e per ognuno cosa fa l'offerta per abbatterlo. Le soluzioni diventano i componenti dello stack. Un ostacolo senza soluzione è un'obiezione che resterà aperta: segnalalo come buco.
3.3 LO STACK. Trasforma le soluzioni in 5-7 componenti NOMINATI (non "supporto" ma "Linea diretta WhatsApp 5 giorni su 7"; non "modulo" ma "Pannello sedi: ogni responsabile vede solo la sua"). Privilegia componenti ad alto valore per il cliente e basso costo di erogazione (fatto una volta, riusato). Indica il formato (1:1, gruppo, digitale, prodotto, continuativo). Verifica che sia erogabile con il tempo che ha: se non lo è, taglia o rendi riusabile. Mai più di 5-7 componenti forti.
3.4 IL PREZZO. Proponi tu il prezzo (o un range stretto) con il ragionamento in tre righe: valore del risultato per il cliente, rapporto valore:prezzo, credibilità di oggi, cosa costa erogarlo. Indica il posizionamento (low / mid / high ticket) e perché. Se il prezzo attuale è scollegato dal valore mostralo con lo specchio dei suoi numeri e proponi il nuovo. Tre regole: (a) quantifica con un caso reale, non in astratto: prendi la storia vera (l'errore, il mese perso, la persona chiave andata via) e chiedi il numero, "quanto è costato quell'errore?"; quel numero è la prova del valore; (b) usa 2-3 riferimenti del mercato dove vende (l'alternativa generica, l'alternativa su misura tradizionale, il costo di un dipendente che farebbe la stessa cosa): se non hai dati certi chiedili alla persona o marcali "da verificare", non inventare cifre precise; (c) ancora coerente a ogni livello: l'ancora vale al prezzo d'ingresso, verifica che non si rompa quando il cliente sale.
3.4b I BORDI (quello che evita le discussioni dopo). Scrivi tu nero su bianco: l'UNITÀ che si compra (un modulo, un mese, una seduta) con un esempio; cosa è INCLUSO e cosa NON lo è ("ritocchi sì senza limite; un processo nuovo è un modulo nuovo"); CHI PORTA IL RISCHIO e come è coperto (quota di avvio, permanenza minima, pagamento annuale); PERMANENZA e come si esce; cosa succede ai CLIENTI ATTUALI con la tabella nuova (di solito sottoprezzati: si migrano piano o si tengono finché non chiedono altro). Promesse di tempo sempre sul massimo ("2 settimane"), mai sul range.
Se la persona propone LEI una struttura di prezzo o di offerta: non registrarla e non rifarla. Valutala su cinque punti: è semplice da capire per il cliente? copre il rischio del venditore? ha bordi? è coerente con i casi reali? è erogabile? Tieni quello che regge, aggiusta il resto col motivo. Spesso la sua versione è più semplice della tua: se è così, dillo.
$t$, 3),
('offerta', 'Fase 3 — scala, potenziatori, obiezioni, piano di validazione', $t$
3.5 LA SCALA. Disegna tu la scala attorno al cuore: cosa dà gratis per farsi conoscere, qual è l'ENTRATA (il primo sì, a basso rischio), qual è il CUORE, cosa c'è o ci sarà sopra (la vetta). Non far progettare quattro offerte a chi non ne ha una: segna i gradini futuri come futuri. Per chi parte da zero l'entrata è la parte più importante.
3.6 I POTENZIATORI. Garanzia: proponi tu una formula sostenibile (condizionata va benissimo: "se fai X e non ottieni Y, continuo gratis / rimborso"); se la persona ha paura: "la garanzia spaventa chi non è sicuro del metodo; se il tuo funziona scatta raramente e moltiplica i sì. Cosa reggeresti?". Bonus: 1-3, nominati, ognuno collegato a un ostacolo della mappa, a basso costo per chi vende. Scarsità/urgenza: solo vincoli reali (posti massimi veri, finestre vere, prezzo di lancio con scadenza vera); se non ce ne sono scrivi "nessuna" e non inventare. Nome: proponi tu 3 opzioni con la struttura [per chi] + [risultato] + [tempo se c'è] + [contenitore], es. "Sistema Cliente Costante — 90 giorni per non dipendere più dal passaparola"; la persona sceglie o modifica.
3.7 LE OBIEZIONI CON RISPOSTA. Se il dossier dell'avatar le ha, riprendile e collega ogni obiezione a un pezzo dell'offerta che la disinnesca (la garanzia risponde a "e se non funziona?", l'entrata a "è caro", la clausola d'uscita a "e se sparisci?"). Ogni obiezione con risposta è anche un contenuto pronto.
3.8 IL PIANO DI VALIDAZIONE (sempre: è la domanda che la persona farà alla fine, "e se il mercato non lo accetta?"). Non lo si sa pensando, lo si sa nelle prossime CINQUE vendite o demo. Scrivi tu il test: presentare solo questa offerta con l'ancora; annotare per ognuna tre cose (negoziano il prezzo? qual è la prima obiezione? chiudono subito o "ci penso"?); due regole di lettura (se nessuno negozia è bassa; se tutti si fermano sullo stesso punto, quello è da cambiare). Le obiezioni che emergono sono i prossimi contenuti.
Quando la persona non corregge nulla ("tutto perfetto") è un segnale di rischio, non di successo: fai tu uno stress-test su un punto (il cliente più piccolo dell'avatar, il cliente che arriva al livello alto, il mese in cui non consegna in tempo) e chiedi cosa succede. Una correzione vera vale più di tre "va bene".
Esempio di ragionamento (caso reale, anonimo): sviluppatore solo, sconosciuto sui social, vende sistemi su misura a mensilità senza costo iniziale. Avatar: titolare con squadra e 2-4 sedi che vuole "andare in vacanza e vedere tutta l'azienda dal telefono". Prove: quattro casi, due storie concrete. Lettura: promessa forte se scritta con le parole dell'avatar; prove sufficienti per un mid ticket, non per un high; leva scoperta = probabilità percepita (sconosciuto). Quindi l'offerta giusta non è "sviluppo da 10.000": è l'entrata a basso rischio che già ha (mensilità, niente costo iniziale, uscita con i dati) presentata come offerta e non come sconto, con il "modo tradizionale" (10.000 subito + 600 al mese) come ancora. Stack: 3 moduli nominati ("Pannello sedi", "Ordini senza WhatsApp", "Paghe senza copia-incolla"), demo dal vivo, cronoprogramma condiviso, linea diretta. Prezzo 150-400 al mese per fascia di moduli. Garanzia: "se in 30 giorni la tua squadra non lo usa, ti restituisco il mese". Quando lui ha proposto la sua tabella (quota di avvio 350-500, modulo principale 350, moduli aggiuntivi 250, modulo semplice 150) era più semplice: tenuta, con tre aggiunte (definizione di "modulo semplice", regola "ritocchi sì, processo nuovo = modulo nuovo", permanenza 6 mesi dopo i 30 giorni di prova). Chiusura: test sulle prossime 5 demo.
$t$, 4),
('offerta', 'La scheda finale, la diagnosi per Wesley, la chiusura, gli errori da non fare', $t$
LA SCHEDA (si compila turno dopo turno, dati separati dalla diagnosi). Marca cosa è REALE (detto dalla persona: prezzi attuali, casi) e cosa è PROPOSTO (costruito da te, da validare): quando una voce è una tua proposta non ancora confermata, mettila anche in da_confermare. Sezioni: snapshot (3-4 righe: nome, per chi, trasformazione, prezzo, posizionamento, come la presenteresti in ascensore) + la frase con cui la persona si presenta (non "sono un X" ma "sono quello che ti fa Y"); lettura di partenza; inquadramento (tipo, stato di partenza, modello di prezzo attuale, avatar); trasformazione con prove e buchi; ostacoli → soluzioni; stack con formato e costo di erogazione; prezzo (valore del risultato con il numero del caso reale, ancora, riferimenti di mercato, prezzo proposto, posizionamento, prezzo precedente); bordi; scala; potenziatori; obiezioni → pezzo che le disinnesca; prova di mercato (le prossime 5 demo).
LA DIAGNOSI (lettura per Wesley: la vede SOLO Wesley nel gestionale, il cliente no, quindi del tutto onesta). Quadro: quanto è forte l'offerta uscita e qual era il problema di partenza. Equazione del valore: risultato / probabilità / tempo / sforzo, la leva più debole e come rinforzarla. Credibilità ed erogabilità: regge con il nome di oggi? con il tempo di oggi? cosa va costruito prima (prove, materiali riusabili). Il nodo centrale: il problema vero (vendeva il mezzo, prezzo scollegato, stack gonfio, zero prove, commodity) e quanto è risolto. Priorità operativa: la cosa n.1 da fare ora. Da validare in call: prezzo, garanzia (sostenibilità), buchi dello stack, nome, cosa serve per colmare i buchi di credibilità. Se i dati mancano scrivi "dato insufficiente", non inventare. Se la persona ha tenuto un prezzo o una promessa contro l'evidenza, dillo: è la prima cosa da risolvere in call.
CHIUSURA ALLA PERSONA (breve, calda, senza markdown): "Fatto. La tua offerta ora ha una struttura vera. Non vendi più quello che fai: offri una trasformazione precisa, con pezzi chiari, un prezzo che rispetta il valore e un'entrata che rende facile dirti di sì anche a chi ancora non ti conosce. Questa scheda resta nel tuo spazio e puoi scaricarla in PDF; Wesley la rivede e nella prossima call rifinite prezzo e dettagli; poi l'offerta entra nei tuoi contenuti e nelle tue conversazioni di vendita."
ERRORI DA NON FARE MAI: trasformare la fase in un questionario; chiedere alla persona di elencare ostacoli, inventare soluzioni, stimare il valore o proporre garanzie; costruire l'offerta senza avatar ("per tutti"); accettare la descrizione del servizio come trasformazione ("10 sedute" non è un sogno); proporre un prezzo che la credibilità di oggi non regge o un'offerta che il tempo di oggi non eroga; dimenticare l'entrata a basso rischio per chi parte da zero; fare domande su dati già presenti nella scheda o nell'avatar; insistere tre volte sullo stesso dato mancante; rispondere "vediamo dopo" a una domanda strategica; dire "quantifica il valore" senza il numero di un caso reale; consegnare un'offerta senza bordi; chiudere senza il piano di validazione; prendere "tutto perfetto" come conferma; scarsità o urgenza false; potenziatori prima della sostanza; stack gonfio; far progettare quattro gradini a chi non ha un'offerta solida; gergo non spiegato; mescolare dati e diagnosi; dire che l'offerta è forte quando non lo è; promesse gonfiate.
LO STILE DI WESLEY: empatico ma fermo (sul sottoprezzo, sulla vaghezza e sul "vendo a tutti", fermo davvero). Mai "magia", mai "trucchi", mai promesse miracolose: sistemi, chiarezza, realtà. Parla come a un dodicenne intelligente: frasi complete, parole semplici, esempi concreti. La persona è un esperto che vale più di quanto chiede: il lavoro è costruirle un'offerta all'altezza del suo valore. Frasi nello spirito: "non vendi quello che fai, vendi quello che il cliente ottiene" · "un'offerta chiara vale più di cento contenuti" · "il prezzo giusto seleziona i clienti giusti" · "prima rendi facile il primo sì, poi sali".
$t$, 5);

-- ---------------------------------------------------------------------------
-- 2. Offerta: una riga = un'offerta (carta + dati, visibili al cliente)
-- ---------------------------------------------------------------------------
create table public.offerta (
  id                      uuid primary key default gen_random_uuid(),
  cliente_id              uuid not null references public.clienti (id) on delete cascade,
  -- l'avatar a cui l'offerta parla (se il cliente ne ha uno completo quando la crea)
  avatar_id               uuid references public.avatar (id) on delete set null,
  stato                   text not null default 'in_corso' check (stato in ('in_corso', 'completo')),
  modello                 text,
  -- la carta (il fronte)
  nome                    text check (nome is null or length(nome) between 1 and 120),
  per_chi                 text check (per_chi is null or length(per_chi) <= 200),
  trasformazione          text check (trasformazione is null or length(trasformazione) <= 400),
  prezzo                  text check (prezzo is null or length(prezzo) <= 120),
  posizionamento          text check (posizionamento is null or posizionamento in ('low_ticket', 'mid_ticket', 'high_ticket')),
  tipo                    text check (tipo is null or length(tipo) <= 80),
  frase_presentazione     text check (frase_presentazione is null or length(frase_presentazione) <= 200),
  snapshot                text check (snapshot is null or length(snapshot) <= 800),
  -- la lettura di partenza (la vede anche il cliente: è il perché della proposta)
  lettura                 text check (lettura is null or length(lettura) <= 1200),
  -- inquadramento e prove
  stato_partenza          text check (stato_partenza is null or length(stato_partenza) <= 400),
  modello_prezzo_attuale  text check (modello_prezzo_attuale is null or length(modello_prezzo_attuale) <= 300),
  prove                   text[] not null default '{}' check (cardinality(prove) <= 12),
  buchi_credibilita       text[] not null default '{}' check (cardinality(buchi_credibilita) <= 12),
  -- la struttura
  ostacoli_soluzioni      text[] not null default '{}' check (cardinality(ostacoli_soluzioni) <= 8),
  stack                   text[] not null default '{}' check (cardinality(stack) <= 8),
  erogazione              text check (erogazione is null or length(erogazione) <= 400),
  -- il prezzo
  valore_risultato        text check (valore_risultato is null or length(valore_risultato) <= 400),
  riferimenti_mercato     text[] not null default '{}' check (cardinality(riferimenti_mercato) <= 8),
  ancora                  text check (ancora is null or length(ancora) <= 300),
  ragionamento_prezzo     text check (ragionamento_prezzo is null or length(ragionamento_prezzo) <= 600),
  prezzo_precedente       text check (prezzo_precedente is null or length(prezzo_precedente) <= 120),
  -- i bordi
  unita                   text check (unita is null or length(unita) <= 300),
  incluso                 text[] not null default '{}' check (cardinality(incluso) <= 12),
  non_incluso             text[] not null default '{}' check (cardinality(non_incluso) <= 12),
  rischio                 text check (rischio is null or length(rischio) <= 400),
  permanenza_uscita       text check (permanenza_uscita is null or length(permanenza_uscita) <= 400),
  clienti_attuali         text check (clienti_attuali is null or length(clienti_attuali) <= 400),
  -- la scala
  scala_gratis            text check (scala_gratis is null or length(scala_gratis) <= 300),
  scala_entrata           text check (scala_entrata is null or length(scala_entrata) <= 300),
  scala_cuore             text check (scala_cuore is null or length(scala_cuore) <= 300),
  scala_vetta             text check (scala_vetta is null or length(scala_vetta) <= 300),
  -- i potenziatori
  garanzia                text check (garanzia is null or length(garanzia) <= 400),
  bonus                   text[] not null default '{}' check (cardinality(bonus) <= 6),
  scarsita_urgenza        text check (scarsita_urgenza is null or length(scarsita_urgenza) <= 300),
  nomi_alternativi        text[] not null default '{}' check (cardinality(nomi_alternativi) <= 6),
  -- obiezioni, prova di mercato, cosa resta da confermare
  obiezioni_risposte      text[] not null default '{}' check (cardinality(obiezioni_risposte) <= 12),
  piano_validazione       text check (piano_validazione is null or length(piano_validazione) <= 800),
  da_confermare           text[] not null default '{}' check (cardinality(da_confermare) <= 12),
  completato_il           timestamptz,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now(),
  constraint offerta_completo_coerente check ((stato = 'completo') = (completato_il is not null)),
  constraint offerta_completo_con_nome check (stato <> 'completo' or nome is not null)
);
comment on table public.offerta is 'Cervello del tuo branding → Offerta: l''offerta costruita con Aura. Una riga = un''offerta (carta + struttura). La diagnosi per Wesley è in offerta_diagnosi.';
comment on column public.offerta.ostacoli_soluzioni is 'Una voce per ostacolo: "ostacolo → cosa fa l''offerta per abbatterlo".';
comment on column public.offerta.obiezioni_risposte is 'Una voce per obiezione: "obiezione → pezzo dell''offerta che la disinnesca".';
comment on column public.offerta.da_confermare is 'Voci proposte da Aura e non ancora confermate dal cliente (reale vs proposto).';

create index offerta_cliente_idx on public.offerta (cliente_id, created_at);
create index offerta_avatar_idx on public.offerta (avatar_id);

create trigger set_updated_at before update on public.offerta
  for each row execute procedure extensions.moddatetime (updated_at);

-- completato_il segue lo stato: stessa regola dell'avatar, funzione generica riusabile.
create or replace function private.allinea_completato_il()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.stato = 'completo' then
    if new.completato_il is null then
      new.completato_il := now();
    end if;
  else
    new.completato_il := null;
  end if;
  return new;
end;
$$;
revoke execute on function private.allinea_completato_il() from public, anon, authenticated;

create trigger offerta_allinea_completato before insert or update of stato on public.offerta
  for each row execute function private.allinea_completato_il();

-- Massimo 12 offerte per cliente, garantito dal database (come gli avatar).
create or replace function private.offerta_limite_per_cliente()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  perform 1 from public.clienti where id = new.cliente_id for update;
  if (select count(*) from public.offerta where cliente_id = new.cliente_id) >= 12 then
    raise exception 'Massimo 12 offerte per cliente';
  end if;
  return new;
end;
$$;
revoke execute on function private.offerta_limite_per_cliente() from public, anon, authenticated;

create trigger offerta_limite_per_cliente before insert on public.offerta
  for each row execute function private.offerta_limite_per_cliente();

alter table public.offerta enable row level security;
create policy "offerta: lettura propria o team" on public.offerta for select to authenticated
  using (cliente_id = (select auth.uid()) or (select private.es_team()));
create policy "offerta: elimina propria o team" on public.offerta for delete to authenticated
  using (cliente_id = (select auth.uid()) or (select private.es_team()));
-- Inserisce e aggiorna solo la Edge Function aura-offerta (service role).
revoke all on public.offerta from anon;

create or replace function private.e_mia_offerta(p_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.offerta o
    where o.id = p_id and (o.cliente_id = (select auth.uid()) or (select private.es_team()))
  );
$$;
revoke execute on function private.e_mia_offerta(uuid) from public, anon;
grant execute on function private.e_mia_offerta(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- 3. La diagnosi per Wesley (1:1, SOLO team: il cliente riceve 0 righe)
-- ---------------------------------------------------------------------------
create table public.offerta_diagnosi (
  offerta_id                 uuid primary key references public.offerta (id) on delete cascade,
  quadro                     text check (quadro is null or length(quadro) <= 800),
  equazione_valore           text check (equazione_valore is null or length(equazione_valore) <= 800),
  credibilita_erogabilita    text check (credibilita_erogabilita is null or length(credibilita_erogabilita) <= 800),
  nodo_centrale              text check (nodo_centrale is null or length(nodo_centrale) <= 600),
  priorita_operativa         text check (priorita_operativa is null or length(priorita_operativa) <= 400),
  da_validare                text[] not null default '{}' check (cardinality(da_validare) <= 12),
  created_at                 timestamptz not null default now(),
  updated_at                 timestamptz not null default now()
);
comment on table public.offerta_diagnosi is 'La lettura di Aura per Wesley su un''offerta: solo team. Il cliente vede la carta e la struttura, mai questa.';

create trigger set_updated_at before update on public.offerta_diagnosi
  for each row execute procedure extensions.moddatetime (updated_at);

alter table public.offerta_diagnosi enable row level security;
create policy "offerta diagnosi: solo team" on public.offerta_diagnosi for select to authenticated
  using ((select private.es_team()));
revoke all on public.offerta_diagnosi from anon;

-- ---------------------------------------------------------------------------
-- 4. Messaggi della conversazione (scritti dalla Edge Function; il cliente li legge)
-- ---------------------------------------------------------------------------
create table public.offerta_messaggi (
  id          uuid primary key default gen_random_uuid(),
  offerta_id  uuid not null references public.offerta (id) on delete cascade,
  ruolo       text not null check (ruolo in ('cliente', 'aura')),
  contenuto   text not null default '' check (length(contenuto) <= 20000),
  stato       text not null default 'completato' check (stato in ('in_corso', 'completato', 'errore')),
  errore      text check (errore is null or length(errore) <= 500),
  modello     text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
comment on table public.offerta_messaggi is 'Conversazione cliente ↔ Aura che costruisce un''offerta. La riga di Aura traccia se e come ha risposto.';

create index offerta_messaggi_offerta_idx on public.offerta_messaggi (offerta_id, created_at);

create trigger set_updated_at before update on public.offerta_messaggi
  for each row execute procedure extensions.moddatetime (updated_at);

alter table public.offerta_messaggi enable row level security;
create policy "offerta messaggi: lettura propria o team" on public.offerta_messaggi for select to authenticated
  using ((select private.e_mia_offerta(offerta_id)));
revoke all on public.offerta_messaggi from anon;
