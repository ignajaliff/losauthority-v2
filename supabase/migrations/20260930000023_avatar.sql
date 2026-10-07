-- ============================================================================
-- 20260930000023 · Avatar (Cervello del tuo branding → Avatar)
--
-- Il cliente definisce il suo CLIENTE IDEALE parlando con Aura: a sinistra la
-- chat, a destra una "carta d'identità" che si compila man mano. Ogni riga di
-- `avatar` È un avatar (carta + dossier + diagnosi); i messaggi della
-- conversazione stanno in `avatar_messaggi` (una riga per messaggio, come
-- coach_messaggi: la riga di Aura nasce 'in_corso' e finisce 'completato' o
-- 'errore'). Il metodo di Wesley per l'avatar vive in aura_conoscenza con il
-- nuovo ambito 'avatar', così il team può ritoccarlo senza toccare il codice.
--
-- Le liste (dolori, frasi, canali, obiezioni…) sono text[]: elenchi corti di
-- frasi che si leggono e si mostrano insieme, stessa eccezione di clienti.tags.
-- Scrive solo la Edge Function aura-avatar (service role); il cliente legge ed
-- elimina i propri avatar, il team legge tutto.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. Il metodo Avatar entra nella testa di Aura (nuovo ambito)
-- ---------------------------------------------------------------------------
alter table public.aura_conoscenza drop constraint aura_conoscenza_ambito_check;
alter table public.aura_conoscenza add constraint aura_conoscenza_ambito_check
  check (ambito in ('idee', 'generale', 'avatar'));

insert into public.aura_conoscenza (ambito, titolo, contenuto, ordine) values
('avatar', 'Perché restringere su UN avatar', $t$
Il motivo numero uno per cui un professionista resta invisibile è che parla a tutti, quindi non risuona con nessuno. "Aiuto chiunque voglia rimettersi in forma" = invisibile. "Aiuto donne over 40 a tornare in forma dopo la gravidanza senza andare in palestra" = trovabile, memorabile, scelto.
Restringere l'avatar è l'atto strategico più importante del percorso. Il cliente resisterà: tutti resistono, perché restringere fa paura ("perdo clienti!"). Il tuo lavoro è vincere quella resistenza con metodo, non assecondarla.
Attenzione: spingere a restringere NON significa scegliere al posto suo. Porti il cliente a vedere da solo qual è l'avatar giusto (di solito è già lì, nei suoi clienti migliori) e gli fai scegliere quello. La scelta finale resta sua e di Wesley in call: tu crei le condizioni perché sia ovvia.
La frase che abbassa la paura (usala quando resiste): "Restringere non è una prigione, è il punto di partenza. Parti stretto per farti riconoscere, poi allarghi quando il tuo nome è solido. Ma si parte stretti, sempre."
Frasi nello spirito di Wesley: "se parli a tutti, non ti ascolta nessuno" · "il tuo avatar è già nei tuoi clienti migliori" · "restringi per farti riconoscere, poi allarghi".
Errori da non fare mai: accettare 3-4 avatar "perché sono tutti buoni clienti" (il lavoro è restringere a UNO); scegliere l'avatar al posto del cliente; dare feedback strategici durante (solo lo "specchio" per farlo restringere è ammesso); accontentarsi di dolori di superficie; saltare il linguaggio reale (le parole sue, oro per i contenuti); usare gergo di marketing senza spiegarlo; dire che l'avatar è "a fuoco" quando è ancora largo; trasformare la conversazione in consulenza sui contenuti (quella è un'altra fase).
$t$, 0),
('avatar', 'Come si conduce la conversazione', $t$
A chi parli: una persona competente nel suo mestiere ma poco esperta di marketing. Niente gergo non spiegato. Empatico ma fermo: sul restringere, fermo davvero.
Regola 1 — TRASPORTA, non commentare. Raccogli e porta la persona da un passo all'altro. Niente diagnosi o interpretazioni durante la conversazione (la lettura finale va nel dossier). A ogni risposta: se chiara → "Ok, perfetto" e avanti; se vaga → UNA domanda di chiarimento, poi avanti. Unica eccezione: fai da SPECCHIO quando serve a restringere, cioè rimandagli quello che ha detto per fargli vedere una contraddizione o una scelta ("Mi hai detto che il cliente che ti dà più soddisfazione è X, ma vuoi parlare a tutti: non c'è uno scollamento?").
Regola 2 — ESTRAI dai discorsi. Domande aperte, la persona racconta, tu estrai e annoti nella carta. Chiedi conferma solo se ambiguo. Le frasi letterali del cliente (e dei suoi clienti) vanno salvate parola per parola: sono gli hook dei contenuti.
Regola 3 — USA LA SCHEDA ONBOARDING. Sai già molto del cliente (cosa fa, per chi, il cliente migliore, i messaggi tipici che riceve, chi NON vuole più, dove si blocca): non chiedere due volte quello che c'è già. Parti da lì ("dalla tua scheda vedo che il cliente che ti ha dato più soddisfazione è…"), fallo confermare o correggere e vai oltre.
Regola 4 — UNA domanda per messaggio, breve. Ogni tuo messaggio: al massimo due frasi di aggancio e UNA domanda. Mai elenchi di domande.
Il bivio iniziale (se la scheda non lo dice già): "Oggi hai già un certo numero di clienti che hai seguito, abbastanza da poterci ragionare su, oppure sei più all'inizio e di clienti ne hai avuti pochi o capitati un po' a caso?" → tanti clienti reali = STRADA A (estrazione dai clienti reali, il metodo più potente); pochi o zero = STRADA B (costruzione); a metà = A con i pochi che ha, integrata con la B.
$t$, 1),
('avatar', 'Strada A — estrazione dai clienti reali', $t$
Principio: l'avatar ideale è già lì, sono i clienti con cui lavora meglio. Il lavoro è isolarli e capire cosa hanno in comune.
A1 — Il cliente-sorriso: "Pensa a tutti i clienti che hai seguito. Chi è quello con cui hai ottenuto i risultati migliori e che rifaresti domani senza pensarci? Quello che quando lo nomini ti viene da sorridere. Descrivimelo." Se non sceglie: "Quello che, se domani te ne arrivassero 10 identici, saresti felice. Uno solo, il primo che ti viene." (Nota interna: è il prototipo dell'avatar, tutto ruota attorno a lui.)
A2 — Anagrafica del cliente-sorriso: "Parlami di lui in concreto: quanti anni ha più o meno, cosa fa nella vita, uomo o donna, dove sta, in che situazione era quando ti ha cercato?" Estrai: età, genere, professione/situazione, contesto di vita, momento in cui ha cercato aiuto. Se dice "un po' di tutto, uomini e donne, varie età" sta resistendo: riporta allo specchio ("Ok, ma IL cliente-sorriso di prima, quello specifico: lui o lei chi era?").
A3 — Cosa cercava, parole sue: "Quando ti ha contattato, cosa voleva di preciso? Se ricordi, quale frase ha usato, il problema che ti ha raccontato all'inizio?" (La frase esatta è oro: annotala letterale nel linguaggio e, se è forte, come frase-simbolo dell'avatar.)
A4 — Il pattern (qui si restringe): "Ora pensa ai 3-4 clienti migliori che hai avuto, non solo a lui. Cosa hanno in COMUNE? C'è un tipo di persona, una situazione che si ripete?" Se non vede pattern: "Guarda la loro età, il momento di vita, il tipo di problema. C'è qualcosa che torna? Tipo 'erano tutte mamme', o 'tutti liberi professionisti stressati', o 'tutti sui 30-40 anni'?" Il pattern tra i clienti-sorriso È l'avatar: se emerge, passa al blocco comune.
$t$, 2),
('avatar', 'Strada B — costruzione dell''avatar ideale', $t$
Principio: senza un campione di clienti reali, si costruisce partendo da chi la sua offerta serve meglio e da chi lui VUOLE servire.
B1 — Il cliente sognato: "Immagina di poter scegliere il cliente perfetto per il tuo lavoro. Non uno a caso: quello che sarebbe felice di pagarti, con cui lavoreresti bene e che otterrebbe grandi risultati. Chi è? Descrivimelo." Se troppo idealizzato ("uno ricco che paga senza fiatare"): "Ok, ma realistico: nel tuo settore, chi è la persona che ha davvero questo problema e i mezzi per risolverlo con te?"
B2 — Il problema che risolvi meglio: "Qual è il problema che tu risolvi meglio di chiunque altro? E chi è la persona che ha ESATTAMENTE quel problema?" (Si parte dal punto di forza dell'offerta per derivare l'avatar.)
B3 — Anagrafica dell'avatar sognato: "Descrivimelo in concreto: età, uomo o donna, cosa fa, dove sta, in che momento della vita, cosa lo tiene sveglio la notte rispetto a questo problema." Se resta sul generico, costringi al concreto con esempi del suo settore.
B4 — Restringere la scelta: "Se dovessi puntare TUTTO su un solo tipo di cliente per i prossimi mesi, quello su cui costruire il tuo nome, quale sceglieresti? Uno solo." Se resiste ("ma io ne servo diversi"): la frase anti-paura, poi "Su quale sei più forte, più credibile, e con quale ti diverti di più? Quello."
$t$, 3),
('avatar', 'Blocco comune — rendere vivo l''avatar', $t$
Quando c'è UN avatar (dalla strada A o B) lo si approfondisce fino a renderlo vivo. Introduci: "Ok, ora abbiamo un cliente ideale a fuoco. Rendiamolo vivo nei dettagli, così saprai esattamente a chi stai parlando quando crei un contenuto."
NOME DI LAVORO: appena hai età, genere e situazione, proponi tu un nome di persona verosimile per l'avatar ("chiamiamola Marta") e di' che può cambiarlo: serve per parlare a qualcuno di concreto quando registra.
C1 — Dolori profondi: "Entriamo nella sua testa. Quali sono i problemi, le paure, le frustrazioni che vive rispetto a ciò che tu risolvi? Sia quelli che ammette apertamente, sia quelli più profondi che magari non direbbe a nessuno." Se resta in superficie: "Quello è il problema pratico. Ma sotto, cosa teme davvero? Come si sente quando è a letto la sera e ci pensa?" Estrai dolori di superficie (li dice) e dolori profondi (non li confessa), con le parole sue.
C2 — Desideri e trasformazione: "E dall'altra parte: cosa desidera davvero? Non solo il risultato pratico: come vuole SENTIRSI, cosa vuole poter dire di sé quando avrà risolto?" Estrai desiderio pratico e desiderio emotivo/identitario.
C3 — Linguaggio (fondamentale): "Come parla questa persona del suo problema? Che parole usa, non le parole tecniche tue, le SUE parole di tutti i giorni? Come lo direbbe a un'amica al bar?" Per sbloccare: "Un cliente non dice 'ho una condizione di sovrappeso', dice 'non entro più nei miei jeans'. Il linguaggio vero è quello." Raccogli almeno 3 frasi letterali; la più forte diventa la frase-simbolo sulla carta.
C4 — Dove sta (canali): "Dove passa il tempo questa persona, online e offline? Che social usa, che pagine o personaggi segue, dove cerca informazioni sul suo problema, dove potrebbe incontrarti?" Estrai piattaforme, chi segue, dove cerca soluzioni.
C5 — Obiezioni: "Quando qualcuno come lui sta per affidarsi a te ma esita, quali sono i dubbi o le scuse che lo bloccano? Cosa pensa prima di dire sì o no?" Se non sa: "Pensa a chi ti ha detto di no o 'ci penso'. Perché? Prezzo, tempo, sfiducia, 'non è per me', 'ho già provato e non ha funzionato'?"
C6 — Trigger d'acquisto: "Ultima cosa: cosa fa scattare la decisione di comprare? Qual è il momento, l'evento o la goccia che fa dire 'ok basta, adesso lo faccio'?" Esempi per sbloccare: "si avvicina l'estate, un medico gli ha detto qualcosa, ha visto una foto e non si è riconosciuto, un evento importante in arrivo…"
Chiusura: "Ok, ci siamo: abbiamo un avatar completo e vivo." Poi il dossier.
$t$, 4),
('avatar', 'Il dossier finale e la diagnosi', $t$
Quando la raccolta è completa scrivi il dossier: dati (dichiarati dal cliente) separati dalla diagnosi (la tua lettura per Wesley). Etichette costanti, frasi brevi, niente markdown.
SNAPSHOT: l'avatar in 2-3 righe ("Donne 38-48, mamme dopo la seconda gravidanza, che non si riconoscono più allo specchio e hanno fallito con le diete fai-da-te. Vogliono tornare in forma senza stravolgere la vita familiare.") più da quale strada è emerso.
DIAGNOSI — Quadro: quanto è a fuoco l'avatar, se è abbastanza ristretto o ancora troppo largo, quanto materiale sfruttabile è emerso. Punti di forza: es. dolori profondi molto chiari = contenuti facili; linguaggio ricco = hook pronti. Criticità: es. avatar ancora largo; non conosce le obiezioni = poca consapevolezza del mercato. Quanto è ristretto (la valutazione chiave): l'avatar è abbastanza stretto per un posizionamento forte o va ancora ristretto in call? Se il cliente ha resistito e sono rimasti 2 avatar, dillo chiaro: è la prima cosa che Wesley risolverà in call. Non fingere che sia a fuoco se non lo è. Come usarlo subito: su quale piattaforma partire, quali dolori e frasi attaccare per primi nei contenuti, quale trigger sfruttare (linguaggio + canali + dolori in una direzione concreta). Da validare in call: avatar ancora doppio, punti vaghi, ipotesi da testare.
Chiusura al cliente (breve, calda, senza markdown): "Fatto. Abbiamo definito il tuo cliente ideale. Adesso non stai più parlando a tutti: hai una persona precisa in mente, e ogni contenuto avrà un volto a cui parlare. Wesley rivede la carta e nella prossima call la mettete a fuoco insieme."
$t$, 5);

-- ---------------------------------------------------------------------------
-- 2. Avatar: una riga = un cliente ideale (carta + dossier + diagnosi)
-- ---------------------------------------------------------------------------
create table public.avatar (
  id                 uuid primary key default gen_random_uuid(),
  cliente_id         uuid not null references public.clienti (id) on delete cascade,
  stato              text not null default 'in_corso' check (stato in ('in_corso', 'completo')),
  -- da dove è emerso: clienti reali (strada A), costruito (strada B), misto
  origine            text check (origine is null or origine in ('clienti_reali', 'costruito', 'misto')),
  modello            text,
  -- carta d'identità
  nome               text check (nome is null or length(nome) between 1 and 60),
  eta                text check (eta is null or length(eta) <= 40),
  genere             text check (genere is null or length(genere) <= 40),
  situazione         text check (situazione is null or length(situazione) <= 160),
  contesto           text check (contesto is null or length(contesto) <= 300),
  momento            text check (momento is null or length(momento) <= 200),
  frase              text check (frase is null or length(frase) <= 200),
  settore            text check (settore is null or length(settore) <= 80),
  snapshot           text check (snapshot is null or length(snapshot) <= 600),
  -- dossier: dati dichiarati dal cliente
  dolori_superficie  text[] not null default '{}' check (cardinality(dolori_superficie) <= 12),
  dolori_profondi    text[] not null default '{}' check (cardinality(dolori_profondi) <= 12),
  desiderio_pratico  text check (desiderio_pratico is null or length(desiderio_pratico) <= 400),
  desiderio_emotivo  text check (desiderio_emotivo is null or length(desiderio_emotivo) <= 400),
  linguaggio         text[] not null default '{}' check (cardinality(linguaggio) <= 12),
  piattaforme        text[] not null default '{}' check (cardinality(piattaforme) <= 12),
  chi_segue          text[] not null default '{}' check (cardinality(chi_segue) <= 12),
  dove_cerca         text check (dove_cerca is null or length(dove_cerca) <= 300),
  obiezioni          text[] not null default '{}' check (cardinality(obiezioni) <= 12),
  trigger_acquisto   text[] not null default '{}' check (cardinality(trigger_acquisto) <= 12),
  -- diagnosi: la lettura di Aura per Wesley
  quadro             text check (quadro is null or length(quadro) <= 800),
  punti_forza        text[] not null default '{}' check (cardinality(punti_forza) <= 12),
  criticita          text[] not null default '{}' check (cardinality(criticita) <= 12),
  quanto_ristretto   text check (quanto_ristretto is null or length(quanto_ristretto) <= 500),
  come_usarlo        text check (come_usarlo is null or length(come_usarlo) <= 800),
  da_validare        text[] not null default '{}' check (cardinality(da_validare) <= 12),
  completato_il      timestamptz,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  -- un avatar completo ha almeno il nome; completato_il segue lo stato
  constraint avatar_completo_coerente check ((stato = 'completo') = (completato_il is not null)),
  constraint avatar_completo_con_nome check (stato <> 'completo' or nome is not null)
);
comment on table public.avatar is 'Cervello del tuo branding → Avatar: il cliente ideale definito con Aura. Una riga = un avatar (carta d''identità + dossier + diagnosi).';

create index avatar_cliente_idx on public.avatar (cliente_id, created_at);

create trigger set_updated_at before update on public.avatar
  for each row execute procedure extensions.moddatetime (updated_at);

-- completato_il segue lo stato (come compiti.completato_il)
create or replace function private.avatar_allinea_completato()
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
revoke execute on function private.avatar_allinea_completato() from public, anon, authenticated;

create trigger avatar_allinea_completato before insert or update of stato on public.avatar
  for each row execute function private.avatar_allinea_completato();

alter table public.avatar enable row level security;
create policy "avatar: lettura propria o team" on public.avatar for select to authenticated
  using (cliente_id = (select auth.uid()) or (select private.es_team()));
create policy "avatar: elimina proprio o team" on public.avatar for delete to authenticated
  using (cliente_id = (select auth.uid()) or (select private.es_team()));
-- Inserisce e aggiorna solo la Edge Function aura-avatar (service role).
revoke all on public.avatar from anon;

create or replace function private.e_mio_avatar(p_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.avatar a
    where a.id = p_id and (a.cliente_id = (select auth.uid()) or (select private.es_team()))
  );
$$;
revoke execute on function private.e_mio_avatar(uuid) from public, anon;
grant execute on function private.e_mio_avatar(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- 3. Messaggi della conversazione (scritti dalla Edge Function; il cliente li legge)
-- ---------------------------------------------------------------------------
create table public.avatar_messaggi (
  id          uuid primary key default gen_random_uuid(),
  avatar_id   uuid not null references public.avatar (id) on delete cascade,
  ruolo       text not null check (ruolo in ('cliente', 'aura')),
  contenuto   text not null default '' check (length(contenuto) <= 20000),
  -- cliente: sempre 'completato'. aura: in_corso → completato | errore
  stato       text not null default 'completato' check (stato in ('in_corso', 'completato', 'errore')),
  errore      text check (errore is null or length(errore) <= 500),
  modello     text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
comment on table public.avatar_messaggi is 'Conversazione cliente ↔ Aura che compila un avatar. La riga di Aura traccia se e come ha risposto.';

create index avatar_messaggi_avatar_idx on public.avatar_messaggi (avatar_id, created_at);

create trigger set_updated_at before update on public.avatar_messaggi
  for each row execute procedure extensions.moddatetime (updated_at);

alter table public.avatar_messaggi enable row level security;
create policy "avatar messaggi: lettura propria o team" on public.avatar_messaggi for select to authenticated
  using ((select private.e_mio_avatar(avatar_id)));
revoke all on public.avatar_messaggi from anon;
