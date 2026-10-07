# Sezione «Clienti» — documenti legali e regole GDPR

Guida per Wesley. Spiega come funziona il blocco di accettazione della sezione «Clienti» dell'area clienti e come pubblicare una nuova versione dei documenti.

## In breve

- La sezione «Clienti» è un piccolo CRM: l'utente segna i suoi contatti e quanti ne chiude. L'utente è il **titolare** di quei dati, tu sei il **responsabile del trattamento** (art. 28 GDPR).
- La sezione si apre solo dopo che l'utente ha accettato la **versione in vigore** di tre documenti: Termini d'uso, Accordo sul trattamento dei dati, Informativa privacy (per l'Informativa basta la presa visione). Le caselle sono tre, nessuna è già spuntata, e il pulsante «Attiva la sezione Clienti» si attiva solo quando sono spuntate tutte e tre.
- Il blocco vale **nel database**: senza un'accettazione valida, ogni lettura e scrittura dei contatti viene rifiutata, anche se qualcuno chiama il server direttamente. L'eccezione è «Esporta i miei contatti (CSV)», il pulsante in fondo alla pagina, che funziona sempre. Nel database anche la cancellazione dei propri contatti resta sempre permessa (art. 28(3) GDPR); dal 06/10/2026, su richiesta di Wesley, nella pagina c'è solo il pulsante di esportazione: i contatti si cancellano uno per uno dal popup del contatto (a sezione attiva).
- Il resto dell'area clienti non cambia.

## I documenti di oggi sono BOZZE

La versione 1 contiene testi provvisori, segnati «BOZZA — da sostituire». Mancano i testi definitivi dei Termini, dell'Accordo e dell'Informativa e, nella casella 2, i numeri e i titoli delle clausole da approvare per iscritto (artt. 1341-1342 c.c.). Quando sono pronti si pubblica la versione 2 (vedi sotto).

## Pubblicare una versione nuova

Si fa da un unico punto, senza toccare l'interfaccia: nel dashboard di Supabase → **SQL Editor** si esegue la funzione `private.crm_pubblica_versione`.

```sql
select private.crm_pubblica_versione(
  p_efficace_dal       => '2026-12-01 00:00+01',      -- da quando vale
  p_sintesi_modifiche  => 'Aggiungiamo un nuovo fornitore: …',  -- una riga semplice, la vede l'utente nell'avviso
  p_termini_titolo     => 'Termini d''uso della sezione Clienti',
  p_termini_testo      => $t$ …testo completo… $t$,  -- null = i Termini non cambiano
  p_accordo_titolo     => 'Accordo sul trattamento dei dati (art. 28 GDPR)',
  p_accordo_testo      => $t$ …testo completo… $t$,  -- null = l'Accordo non cambia
  p_informativa_titolo => 'Informativa privacy',
  p_informativa_testo  => null,                       -- null = l'Informativa non cambia
  p_casella_2          => 'Ai sensi degli artt. 1341 e 1342 del Codice civile approvo specificamente le seguenti clausole dei Termini d''uso: 4 (Limitazioni di responsabilità), 5 (Sospensione dell''account), 7 (Foro competente).'
  -- p_casella_1 e p_casella_3: se non si passano restano quelle della versione precedente
);
```

Cosa succede:

1. Ogni documento cambiato riceve un numero di versione nuovo; il testo completo resta salvato per sempre (non si può modificare né cancellare, nemmeno dal dashboard).
2. **Prima della data di efficacia** l'utente vede nella sezione un avviso: cosa cambia (la riga `p_sintesi_modifiche`), da quando, e i link ai documenti nuovi. Così può opporsi in tempo, per esempio a un nuovo fornitore.
3. **Dalla data di efficacia** la sezione si richiude alla prossima apertura e chiede di nuovo l'accettazione. Nel frattempo i contatti restano salvati e intatti, e l'utente può esportarli.

Regole che la funzione controlla da sola:

- La data di efficacia deve essere almeno **N giorni** nel futuro (preavviso stabilito dall'Accordo), appena qualcuno ha già accettato una versione. Oggi N = 30.
- La nuova versione deve entrare in vigore dopo la precedente.
- Le caselle non possono contenere le parole «consenso» o «acconsento»: la base giuridica è il contratto, non il consenso.

## I giorni stabiliti dall'Accordo

Si cambiano con un `update` nella tabella `crm_impostazioni`:

```sql
update public.crm_impostazioni set giorni_preavviso = 30, giorni_cancellazione_account = 30;
```

- `giorni_preavviso`: il preavviso minimo per una versione nuova (vedi sopra).
- `giorni_cancellazione_account`: entro quanti giorni dalla chiusura dell'account si cancellano i contatti. Oggi la cancellazione è **immediata** (quando si elimina l'utente, i suoi contatti si cancellano nello stesso momento), quindi rispetta qualsiasi valore.

## Il registro delle accettazioni

Tabella `crm_accettazioni`: una riga per ogni documento accettato, con utente, email, documento, versione, data e ora, e il **testo esatto delle caselle** che l'utente ha visto. Si può solo aggiungere: nessuno la modifica o la cancella, nemmeno tu. Quando l'utente accetta una versione nuova, quella vecchia resta. Il registro resta anche se l'utente chiude l'account: è la prova del contratto. L'utente vede la data e la versione accettata nella conferma subito dopo l'accettazione; il team le vede nella scheda del cliente (Impostazioni).

## Chi vede i contatti

- Ogni utente vede, crea, modifica e cancella solo i propri contatti.
- **Tu e lo staff non vedete i contatti** nell'uso normale del gestionale: prima della 0036 il team poteva leggerli, ora no.
- **Accesso per assistenza** (decisione del 06/10/2026): scheda del cliente → Impostazioni → «Sezione Clienti (CRM del cliente)» → «Vedi i contatti (assistenza)». Possono usarlo admin, staff e staff_fatture. Prima si scrive il motivo; il database registra l'accesso (chi, ruolo, quando, su quale cliente, perché, quanti contatti) e solo dopo mostra i contatti, **in sola lettura**. Il registro (`crm_accessi_assistenza`) si può solo aggiungere e lo vede solo il team, non il cliente. Va scritto nell'Accordo che anche lo staff autorizzato accede per assistenza.
- Nella stessa card vedi **quando il cliente ha accettato i documenti** e quale versione, con «Valida» o «Da riaccettare» se nel frattempo è uscita una versione nuova.
- Numeri per utente (contatti arrivati, chiusi, percentuale, valore) per seguire i risultati nel percorso: **non previsti**, finché non lo confermi e non lo scrivi nei Termini.
- Limite da sapere: chi entra direttamente nel dashboard di Supabase con l'account del progetto può vedere tutto, e l'app non può registrare quell'accesso. Teniamo l'accesso al dashboard solo a chi ne ha bisogno.

## Dati dei contatti

Solo quello che serve a seguirli e a contare i risultati: nome (o come l'utente lo chiama), canale di provenienza, data di arrivo, stato (nuovo, in trattativa, chiuso, perso) — obbligatori; valore della vendita se chiuso, telefono, email — facoltativi; più l'offerta dell'utente che interessa al contatto (è un dato dell'utente, non del contatto). Nessun campo note libero, nessun dato sensibile.

## Dove stanno i dati e servizi esterni

- Database Supabase nella regione **eu-central-1 (Francoforte)**, Unione Europea (verificato). I backup automatici di Supabase: **da confermare** nel dashboard (Database → Backups) e nel DPA di Supabase che restino nella stessa regione, prima del cutover.
- L'esportazione si genera dal database e si scarica nel browser: non passa da nessun altro servizio.
- I contatti **non vanno a nessun servizio di IA** (Aura non li legge) né ad altri servizi esterni. Se un giorno una funzione dovesse leggerli con l'IA, quel servizio va prima aggiunto all'Accordo.
- Il sito non ha strumenti di statistiche. Nomi, telefoni ed email dei contatti non compaiono negli indirizzi delle pagine né nei messaggi di errore; il grafico di Pubblicazioni legge solo i giorni di arrivo.
- Il frontend (solo file statici) andrà su Cloudflare Pages o Vercel al cutover: non conserva dati dei contatti, ma va citato tra i fornitori nell'Accordo.
