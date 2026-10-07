-- ============================================================================
-- 0036 · Sezione «Clienti»: accettazione dei documenti legali (06/10/2026)
--
-- Documento di Wesley «Clienti – permessi e GDPR». Nel CRM l'utente inserisce
-- dati personali dei SUOI contatti: lui è titolare, Wesley responsabile del
-- trattamento (art. 28 GDPR). Quindi:
--   * la sezione si apre solo dopo l'accettazione della versione in vigore di
--     Termini d'uso, Accordo sul trattamento e clausole artt. 1341-1342 c.c.
--     (+ presa visione dell'Informativa). Il blocco vale NEL DATABASE: senza
--     accettazione valida la RLS di `crm_lead` rifiuta ogni lettura e scrittura;
--     eccezioni: l'esportazione (`crm_esporta_contatti`) e la cancellazione dei
--     propri contatti (art. 28(3)(e)(g) GDPR: il titolare deve poter cancellare,
--     anche quando un contatto chiede di essere cancellato, pure a sezione chiusa).
--   * documenti e versioni si pubblicano da un unico punto,
--     `private.crm_pubblica_versione(...)` (SQL editor), senza toccare la UI;
--     testo completo di ogni versione conservato, mai modificabile.
--   * registro delle accettazioni: solo aggiunta, nessuno modifica o cancella
--     (trigger, anche per il service role), resta dopo la chiusura dell'account
--     (niente FK verso l'utente).
--   * il team NON vede più i contatti (prima li leggeva): nessuna policy team.
--     Li vede solo per assistenza con `crm_contatti_assistenza` (sola lettura,
--     motivo obbligatorio), che registra prima ogni accesso in
--     `crm_accessi_assistenza` (solo aggiunta). Il team legge le accettazioni
--     (data e versione, senza contatti) per la scheda del cliente.
--   * contatti con i soli dati che servono: stati nuovo/in_trattativa/chiuso/
--     perso, canale obbligatorio, valore solo se chiuso. Niente campo note.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. Contatti: valore della vendita (stati e canale obbligatorio nella 0037).
-- ---------------------------------------------------------------------------
-- (Stati nuovi e canale obbligatorio: migrazione 0037.)
alter table public.crm_lead add column valore numeric(12,2) check (valore is null or valore >= 0);
comment on column public.crm_lead.valore is 'Valore della vendita, solo per i contatti chiusi (il trigger lo azzera negli altri stati).';
comment on table public.crm_lead is 'Contatti del cliente (sezione Clienti). Titolare: il cliente; Wesley è responsabile del trattamento. Leggibili e scrivibili solo dal proprietario con accettazione valida (private.crm_attivo).';

create or replace function private.crm_lead_coerente()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'UPDATE' and new.cliente_id <> old.cliente_id then
    raise exception 'Un contatto non può passare a un altro cliente' using errcode = 'check_violation';
  end if;
  if new.offerta_id is not null and not exists (
    select 1 from public.offerta o where o.id = new.offerta_id and o.cliente_id = new.cliente_id
  ) then
    raise exception 'L''offerta scelta non è di questo cliente' using errcode = 'check_violation';
  end if;
  if new.arrivato_il > current_date + 1 then
    raise exception 'La data di arrivo non può essere nel futuro' using errcode = 'check_violation';
  end if;
  -- Il valore esiste solo per una vendita chiusa.
  if new.stato <> 'chiuso' then
    new.valore := null;
  end if;
  if tg_op = 'INSERT' then
    perform 1 from public.clienti where id = new.cliente_id for update;
    if (select count(*) from public.crm_lead where cliente_id = new.cliente_id) >= 5000 then
      raise exception 'Massimo 5000 contatti per cliente' using errcode = 'check_violation';
    end if;
  end if;
  return new;
end;
$$;
revoke execute on function private.crm_lead_coerente() from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- 2. Documenti legali e versioni (immutabili).
-- ---------------------------------------------------------------------------
create table public.documenti_legali (
  id             uuid primary key default gen_random_uuid(),
  documento      text not null check (documento in ('termini_clienti', 'accordo_trattamento', 'informativa_privacy')),
  versione       integer not null check (versione >= 1),
  titolo         text not null check (length(titolo) between 1 and 200),
  testo          text not null check (length(testo) between 1 and 200000),
  -- true = testo provvisorio da sostituire con quello definitivo
  bozza          boolean not null default false,
  pubblicato_il  timestamptz not null default now(),
  unique (documento, versione)
);
comment on table public.documenti_legali is 'Testo completo di ogni versione dei documenti della sezione Clienti. Solo aggiunta: si pubblica con private.crm_pubblica_versione().';

create table public.crm_versioni (
  versione           integer primary key check (versione >= 1),
  efficace_dal       timestamptz not null,
  -- una riga semplice: cosa cambia (es. un nuovo fornitore), mostrata nell'avviso
  sintesi_modifiche  text check (sintesi_modifiche is null or length(sintesi_modifiche) <= 300),
  termini_id         uuid not null references public.documenti_legali (id) on delete restrict,
  accordo_id         uuid not null references public.documenti_legali (id) on delete restrict,
  informativa_id     uuid not null references public.documenti_legali (id) on delete restrict,
  -- il testo esatto delle tre caselle di questa versione
  casella_1          text not null check (length(casella_1) between 1 and 1000),
  casella_2          text not null check (length(casella_2) between 1 and 1000),
  casella_3          text not null check (length(casella_3) between 1 and 1000),
  pubblicata_il      timestamptz not null default now()
);
comment on table public.crm_versioni is 'Pacchetto di documenti da accettare per aprire la sezione Clienti. In vigore = la versione più alta con efficace_dal <= now(). Solo aggiunta.';
create index crm_versioni_termini_idx on public.crm_versioni (termini_id);
create index crm_versioni_accordo_idx on public.crm_versioni (accordo_id);
create index crm_versioni_informativa_idx on public.crm_versioni (informativa_id);

-- Giorni stabiliti dall'Accordo (Wesley li cambia qui, con un update).
create table public.crm_impostazioni (
  id                           boolean primary key default true check (id),
  -- una nuova versione deve entrare in vigore almeno tra N giorni (se qualcuno ha già accettato)
  giorni_preavviso             integer not null default 30 check (giorni_preavviso between 0 and 365),
  -- entro quanti giorni dalla chiusura dell'account si cancellano i contatti (oggi: subito, a cascata)
  giorni_cancellazione_account integer not null default 30 check (giorni_cancellazione_account between 0 and 365),
  updated_at                   timestamptz not null default now()
);
insert into public.crm_impostazioni (id) values (true);
create trigger set_updated_at before update on public.crm_impostazioni
  for each row execute procedure extensions.moddatetime (updated_at);

-- ---------------------------------------------------------------------------
-- 3. Registro delle accettazioni: una riga per documento accettato.
--    Nessuna FK verso l'utente: resta anche se l'account si chiude.
-- ---------------------------------------------------------------------------
create table public.crm_accettazioni (
  id                  uuid primary key default gen_random_uuid(),
  -- le righe della stessa accettazione (stesso clic) condividono questo id
  accettazione_id     uuid not null,
  user_id             uuid not null,
  email               text,
  versione            integer not null references public.crm_versioni (versione) on delete restrict,
  documento           text not null check (documento in ('termini_clienti', 'accordo_trattamento', 'informativa_privacy')),
  documento_id        uuid not null references public.documenti_legali (id) on delete restrict,
  versione_documento  integer not null,
  -- il testo esatto delle caselle che l'utente ha visto e spuntato per questo documento
  testo_caselle       text[] not null check (cardinality(testo_caselle) between 1 and 3),
  accettato_il        timestamptz not null default now()
);
comment on table public.crm_accettazioni is 'Prova delle accettazioni della sezione Clienti. Solo aggiunta (trigger): nessuno modifica o cancella, resta dopo la chiusura dell''account.';
create index crm_accettazioni_utente_idx on public.crm_accettazioni (user_id, versione);
create index crm_accettazioni_versione_idx on public.crm_accettazioni (versione);
create index crm_accettazioni_documento_idx on public.crm_accettazioni (documento_id);

-- Solo aggiunta: vale anche per service role e amministratori.
create function private.solo_aggiunta()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  raise exception 'La tabella % è un registro: si può solo aggiungere', tg_table_name using errcode = 'insufficient_privilege';
end;
$$;
revoke execute on function private.solo_aggiunta() from public, anon, authenticated;

create trigger solo_aggiunta before update or delete on public.documenti_legali for each row execute function private.solo_aggiunta();
create trigger solo_aggiunta_truncate before truncate on public.documenti_legali for each statement execute function private.solo_aggiunta();
create trigger solo_aggiunta before update or delete on public.crm_versioni for each row execute function private.solo_aggiunta();
create trigger solo_aggiunta_truncate before truncate on public.crm_versioni for each statement execute function private.solo_aggiunta();
create trigger solo_aggiunta before update or delete on public.crm_accettazioni for each row execute function private.solo_aggiunta();
create trigger solo_aggiunta_truncate before truncate on public.crm_accettazioni for each statement execute function private.solo_aggiunta();

-- ---------------------------------------------------------------------------
-- 4. Il blocco: versione in vigore e accettazione valida.
-- ---------------------------------------------------------------------------
create function private.crm_versione_corrente()
returns integer
language sql
stable
security definer
set search_path = ''
as $$
  select max(versione) from public.crm_versioni where efficace_dal <= now();
$$;

create function private.crm_attivo(p_utente uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.crm_accettazioni a
    where a.user_id = p_utente and a.versione = private.crm_versione_corrente()
  );
$$;
revoke execute on function private.crm_versione_corrente() from public, anon;
revoke execute on function private.crm_attivo(uuid) from public, anon;
grant execute on function private.crm_versione_corrente() to authenticated, service_role;
grant execute on function private.crm_attivo(uuid) to authenticated, service_role;

-- Contatti: solo il proprietario, solo con accettazione valida. Il team non li vede.
-- Le vecchie policy «proprietario o team» si tolgono nella 0037: finché ci sono, il blocco non vale.
create policy "crm lead: lettura del proprietario con accettazione" on public.crm_lead for select to authenticated
  using (cliente_id = (select auth.uid()) and (select private.crm_attivo((select auth.uid()))));
create policy "crm lead: inserisce il proprietario con accettazione" on public.crm_lead for insert to authenticated
  with check (cliente_id = (select auth.uid()) and (select private.crm_attivo((select auth.uid()))));
create policy "crm lead: aggiorna il proprietario con accettazione" on public.crm_lead for update to authenticated
  using (cliente_id = (select auth.uid()) and (select private.crm_attivo((select auth.uid()))))
  with check (cliente_id = (select auth.uid()) and (select private.crm_attivo((select auth.uid()))));
-- La cancellazione resta sempre possibile per il proprietario (art. 28(3) GDPR).
create policy "crm lead: elimina il proprietario" on public.crm_lead for delete to authenticated
  using (cliente_id = (select auth.uid()));

-- ---------------------------------------------------------------------------
-- 5. RLS di documenti, versioni, impostazioni e registro.
-- ---------------------------------------------------------------------------
alter table public.documenti_legali enable row level security;
alter table public.crm_versioni enable row level security;
alter table public.crm_impostazioni enable row level security;
alter table public.crm_accettazioni enable row level security;

create policy "documenti legali: lettura clienti e team" on public.documenti_legali for select to authenticated
  using ((select private.tiene_rol('cliente')) or (select private.es_team()));
create policy "crm versioni: lettura clienti e team" on public.crm_versioni for select to authenticated
  using ((select private.tiene_rol('cliente')) or (select private.es_team()));
create policy "crm impostazioni: lettura team" on public.crm_impostazioni for select to authenticated
  using ((select private.es_team()));
create policy "crm accettazioni: le proprie o il team" on public.crm_accettazioni for select to authenticated
  using (user_id = (select auth.uid()) or (select private.es_team()));
-- Nessuna policy di scrittura: si pubblica e si accetta solo con le funzioni qui sotto.
revoke all on public.documenti_legali, public.crm_versioni, public.crm_impostazioni, public.crm_accettazioni from anon;

-- ---------------------------------------------------------------------------
-- 6. Funzioni chiamate dall'app (RPC, solo authenticated).
-- ---------------------------------------------------------------------------

-- Stato della sezione per l'utente collegato.
create function public.crm_stato()
returns table (attivo boolean, versione_corrente integer, versione_accettata integer, accettata_il timestamptz)
language sql
stable
security definer
set search_path = ''
as $$
  select
    private.crm_attivo((select auth.uid())),
    private.crm_versione_corrente(),
    a.versione,
    a.accettato_il
  from (select 1) uno
  left join lateral (
    select versione, accettato_il from public.crm_accettazioni
    where user_id = (select auth.uid())
    order by versione desc, accettato_il desc
    limit 1
  ) a on true;
$$;

-- Accetta la versione in vigore: le tre caselle devono essere spuntate.
-- Il testo registrato è quello della versione nel database (lo stesso mostrato).
create function public.crm_accetta(p_versione integer, p_caselle boolean[])
returns timestamptz
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_utente uuid := (select auth.uid());
  v_corrente integer := private.crm_versione_corrente();
  v public.crm_versioni%rowtype;
  v_gruppo uuid := gen_random_uuid();
  v_email text;
  v_quando timestamptz := now();
  v_gia timestamptz;
begin
  if v_utente is null or not exists (select 1 from public.clienti where id = v_utente) then
    raise exception 'Solo un cliente può attivare la sezione Clienti' using errcode = 'insufficient_privilege';
  end if;
  if v_corrente is null or p_versione is distinct from v_corrente then
    raise exception 'I documenti sono cambiati: ricarica la pagina e rileggili' using errcode = 'check_violation';
  end if;
  if p_caselle is distinct from array[true, true, true] then
    raise exception 'Servono tutte e tre le caselle' using errcode = 'check_violation';
  end if;
  select accettato_il into v_gia from public.crm_accettazioni where user_id = v_utente and versione = v_corrente limit 1;
  if v_gia is not null then
    return v_gia;
  end if;

  select * into v from public.crm_versioni where versione = v_corrente;
  select email into v_email from auth.users where id = v_utente;

  insert into public.crm_accettazioni (accettazione_id, user_id, email, versione, documento, documento_id, versione_documento, testo_caselle, accettato_il)
  select v_gruppo, v_utente, v_email, v_corrente, d.documento, d.id, d.versione, x.caselle, v_quando
  from (values
    (v.termini_id, array[v.casella_1, v.casella_2]),
    (v.accordo_id, array[v.casella_1]),
    (v.informativa_id, array[v.casella_3])
  ) as x (documento_id, caselle)
  join public.documenti_legali d on d.id = x.documento_id;
  return v_quando;
end;
$$;

-- Esportazione: sempre possibile, anche con la sezione chiusa. Solo i propri contatti.
create function public.crm_esporta_contatti()
returns table (nome text, email text, telefono text, canale text, arrivato_il date, stato text, valore numeric, offerta text)
language sql
stable
security definer
set search_path = ''
as $$
  select l.nome, l.email, l.telefono, l.fonte, l.arrivato_il, l.stato, l.valore, o.nome
  from public.crm_lead l
  left join public.offerta o on o.id = l.offerta_id
  where l.cliente_id = (select auth.uid())
  order by l.arrivato_il desc, l.created_at desc;
$$;

revoke execute on function public.crm_stato() from public, anon;
revoke execute on function public.crm_accetta(integer, boolean[]) from public, anon;
revoke execute on function public.crm_esporta_contatti() from public, anon;
grant execute on function public.crm_stato() to authenticated;
grant execute on function public.crm_accetta(integer, boolean[]) to authenticated;
grant execute on function public.crm_esporta_contatti() to authenticated;

-- ---------------------------------------------------------------------------
-- 7. Pubblicare una versione: l'unico punto (SQL editor del dashboard).
--    Un testo null = il documento non cambia (si riusa la sua ultima versione).
--    Caselle null = come nella versione precedente.
-- ---------------------------------------------------------------------------
create function private.crm_pubblica_versione(
  p_efficace_dal       timestamptz,
  p_sintesi_modifiche  text,
  p_termini_titolo     text default null,
  p_termini_testo      text default null,
  p_accordo_titolo     text default null,
  p_accordo_testo      text default null,
  p_informativa_titolo text default null,
  p_informativa_testo  text default null,
  p_casella_1          text default null,
  p_casella_2          text default null,
  p_casella_3          text default null,
  p_bozza              boolean default false
)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_prec public.crm_versioni%rowtype;
  v_nuova integer;
  v_preavviso integer;
  v_ids uuid[] := array[]::uuid[];
  v_doc text;
  v_titolo text;
  v_testo text;
  v_id uuid;
  v_c1 text;
  v_c2 text;
  v_c3 text;
  i integer;
begin
  select * into v_prec from public.crm_versioni order by versione desc limit 1;
  v_nuova := coalesce(v_prec.versione, 0) + 1;
  select giorni_preavviso into v_preavviso from public.crm_impostazioni where id;

  if v_prec.versione is not null and p_efficace_dal <= v_prec.efficace_dal then
    raise exception 'La nuova versione deve entrare in vigore dopo la precedente (%)', v_prec.efficace_dal;
  end if;
  if exists (select 1 from public.crm_accettazioni) and p_efficace_dal < now() + make_interval(days => v_preavviso) then
    raise exception 'Serve un preavviso di almeno % giorni: data di efficacia dal %', v_preavviso, (now() + make_interval(days => v_preavviso))::date;
  end if;

  for i in 1..3 loop
    v_doc := (array['termini_clienti', 'accordo_trattamento', 'informativa_privacy'])[i];
    v_titolo := (array[p_termini_titolo, p_accordo_titolo, p_informativa_titolo])[i];
    v_testo := (array[p_termini_testo, p_accordo_testo, p_informativa_testo])[i];
    if v_testo is null then
      select id into v_id from public.documenti_legali where documento = v_doc order by versione desc limit 1;
      if v_id is null then
        raise exception 'Manca il testo del documento % (prima pubblicazione)', v_doc;
      end if;
    else
      insert into public.documenti_legali (documento, versione, titolo, testo, bozza)
      values (
        v_doc,
        coalesce((select max(versione) from public.documenti_legali where documento = v_doc), 0) + 1,
        coalesce(v_titolo, (select titolo from public.documenti_legali where documento = v_doc order by versione desc limit 1)),
        v_testo,
        p_bozza
      )
      returning id into v_id;
    end if;
    v_ids := v_ids || v_id;
  end loop;

  v_c1 := coalesce(p_casella_1, v_prec.casella_1);
  v_c2 := coalesce(p_casella_2, v_prec.casella_2);
  v_c3 := coalesce(p_casella_3, v_prec.casella_3);
  if v_c1 is null or v_c2 is null or v_c3 is null then
    raise exception 'Mancano i testi delle caselle (prima pubblicazione)';
  end if;
  -- La base giuridica è il contratto: queste parole non vanno usate.
  if concat_ws(' ', v_c1, v_c2, v_c3) ~* '(consens|acconsent)' then
    raise exception 'Le caselle non devono usare «consenso» o «acconsento»';
  end if;

  insert into public.crm_versioni (versione, efficace_dal, sintesi_modifiche, termini_id, accordo_id, informativa_id, casella_1, casella_2, casella_3)
  values (v_nuova, p_efficace_dal, p_sintesi_modifiche, v_ids[1], v_ids[2], v_ids[3], v_c1, v_c2, v_c3);
  return v_nuova;
end;
$$;
revoke execute on function private.crm_pubblica_versione(timestamptz, text, text, text, text, text, text, text, text, text, text, boolean) from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- 8. Versione 1: BOZZE da sostituire con i testi definitivi di Wesley.
-- ---------------------------------------------------------------------------
select private.crm_pubblica_versione(
  p_efficace_dal => now(),
  p_sintesi_modifiche => null,
  p_bozza => true,
  p_termini_titolo => 'Termini d''uso della sezione Clienti',
  p_termini_testo => $t$BOZZA — testo provvisorio, da sostituire con i Termini d'uso definitivi approvati da Wesley Caicedo.

1. A cosa serve la sezione Clienti
La sezione Clienti ti permette di segnare le persone che ti contattano, da dove arrivano, a che punto siete e quante ne chiudi.

2. Cosa puoi scrivere
Solo i dati che ti servono per seguire i tuoi contatti: nome, canale di provenienza, data di arrivo, stato, valore della vendita, telefono o email. Non scrivere dati sulla salute, sulla religione, sulle opinioni politiche o altri dati sensibili.

3. I dati dei tuoi contatti sono tuoi
Sei tu il titolare dei dati dei tuoi contatti: decidi tu cosa scrivere e perché, e sei tu che devi informare i tuoi contatti su come usi i loro dati. Wesley Caicedo li custodisce solo per far funzionare questa sezione, come responsabile del trattamento (vedi l'Accordo sul trattamento dei dati).

4. Limitazioni di responsabilità
[Da completare.]

5. Sospensione dell'account
[Da completare.]

6. Modifiche ai Termini
Quando i documenti cambiano te lo diciamo prima nella sezione. Dalla data indicata la sezione ti chiede di accettarli di nuovo; nel frattempo i tuoi contatti restano salvati e puoi sempre esportarli.

7. Foro competente
[Da completare.]$t$,
  p_accordo_titolo => 'Accordo sul trattamento dei dati (art. 28 GDPR)',
  p_accordo_testo => $t$BOZZA — testo provvisorio, da sostituire con l'Accordo definitivo approvato da Wesley Caicedo.

1. Ruoli
Tu (l'utente) sei il titolare del trattamento dei dati dei tuoi contatti. Con questo Accordo nomini Wesley Caicedo responsabile del trattamento ai sensi dell'art. 28 del Regolamento (UE) 2016/679.

2. Cosa fa il responsabile
Custodisce i dati dei tuoi contatti solo per far funzionare la sezione Clienti e solo secondo le tue istruzioni. Non li usa per scopi suoi e non li manda a servizi di intelligenza artificiale.

3. Dove stanno i dati
Nel database del servizio, ospitato nell'Unione Europea (Supabase, regione Francoforte).

4. Altri fornitori (sub-responsabili)
[Elenco da completare.] Prima di aggiungere un nuovo fornitore te lo diciamo con un preavviso di [N] giorni, così puoi opporti.

5. Accesso per assistenza
Il responsabile e le persone da lui autorizzate (il suo staff) aprono i dati dei tuoi contatti solo se serve per assistenza, in sola lettura e scrivendo il motivo; ogni accesso viene registrato (chi, quando, perché).

6. Esportazione e cancellazione
Puoi esportare i tuoi contatti in ogni momento e cancellarli uno per uno o tutti. Se chiudi l'account i tuoi contatti vengono cancellati entro [N] giorni.

7. Sicurezza
[Da completare.]$t$,
  p_informativa_titolo => 'Informativa privacy',
  p_informativa_testo => $t$BOZZA — testo provvisorio, da sostituire con l'Informativa definitiva approvata da Wesley Caicedo.

Questa informativa spiega come Wesley Caicedo tratta i tuoi dati di utente quando usi la sezione Clienti: chi sei, quando hai accettato i documenti e quale versione. Questi dati servono a dimostrare il contratto e si conservano anche dopo la chiusura dell'account.

[Titolare, finalità, base giuridica, tempi di conservazione, diritti e contatti: da completare.]$t$,
  p_casella_1 => 'Ho letto e accetto i Termini d''uso della sezione Clienti e l''Accordo sul trattamento dei dati (art. 28 GDPR), con cui nomino Wesley Caicedo responsabile del trattamento dei dati dei miei contatti.',
  p_casella_2 => 'Ai sensi degli artt. 1341 e 1342 del Codice civile approvo specificamente le seguenti clausole dei Termini d''uso: [numeri e titoli delle clausole, da inserire quando i Termini sono definitivi].',
  p_casella_3 => 'Ho preso visione dell''Informativa privacy.'
);

-- ---------------------------------------------------------------------------
-- 9. Accesso del team per assistenza (decisione di Wesley, 06/10/2026):
--    admin, staff e staff_fatture; sola lettura; motivo obbligatorio; ogni
--    accesso registrato (chi, quando, su quale cliente, perché) PRIMA di
--    restituire i contatti. Il registro lo vede solo il team, non il cliente.
--    Nessuna FK: il registro resta anche se il cliente o l'operatore escono.
-- ---------------------------------------------------------------------------
create table public.crm_accessi_assistenza (
  id               uuid primary key default gen_random_uuid(),
  cliente_id       uuid not null,
  operatore_id     uuid not null,
  operatore_nome   text,
  operatore_ruolo  text,
  motivo           text not null check (length(btrim(motivo)) between 5 and 300),
  contatti_visti   integer not null default 0 check (contatti_visti >= 0),
  accesso_il       timestamptz not null default now()
);
comment on table public.crm_accessi_assistenza is 'Registro degli accessi del team ai contatti di un cliente (assistenza). Solo aggiunta: lo scrive crm_contatti_assistenza.';
create index crm_accessi_assistenza_cliente_idx on public.crm_accessi_assistenza (cliente_id, accesso_il desc);

create trigger solo_aggiunta before update or delete on public.crm_accessi_assistenza for each row execute function private.solo_aggiunta();
create trigger solo_aggiunta_truncate before truncate on public.crm_accessi_assistenza for each statement execute function private.solo_aggiunta();

alter table public.crm_accessi_assistenza enable row level security;
create policy "crm accessi assistenza: lettura team" on public.crm_accessi_assistenza for select to authenticated
  using ((select private.es_team()));
-- Nessuna policy di scrittura: lo scrive solo la funzione qui sotto.
revoke all on public.crm_accessi_assistenza from anon;

-- Contatti di un cliente in sola lettura per il team: prima registra l'accesso, poi li restituisce.
create function public.crm_contatti_assistenza(p_cliente uuid, p_motivo text)
returns table (nome text, email text, telefono text, canale text, arrivato_il date, stato text, valore numeric, offerta text)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_operatore uuid := (select auth.uid());
  v_nome text;
  v_ruolo text;
  v_quanti integer;
begin
  if not private.es_team() then
    raise exception 'Solo il team può aprire i contatti per assistenza' using errcode = 'insufficient_privilege';
  end if;
  if p_motivo is null or length(btrim(p_motivo)) < 5 then
    raise exception 'Scrivi il motivo dell''accesso' using errcode = 'check_violation';
  end if;
  if not exists (select 1 from public.clienti where id = p_cliente) then
    raise exception 'Cliente non trovato' using errcode = 'no_data_found';
  end if;
  select ur.nombre, ur.rol into v_nome, v_ruolo from public.user_roles ur where ur.id = v_operatore;
  select count(*) into v_quanti from public.crm_lead where cliente_id = p_cliente;

  insert into public.crm_accessi_assistenza (cliente_id, operatore_id, operatore_nome, operatore_ruolo, motivo, contatti_visti)
  values (p_cliente, v_operatore, v_nome, v_ruolo, btrim(p_motivo), v_quanti);

  return query
    select l.nome, l.email, l.telefono, l.fonte, l.arrivato_il, l.stato, l.valore, o.nome
    from public.crm_lead l
    left join public.offerta o on o.id = l.offerta_id
    where l.cliente_id = p_cliente
    order by l.arrivato_il desc, l.created_at desc;
end;
$$;
revoke execute on function public.crm_contatti_assistenza(uuid, text) from public, anon;
grant execute on function public.crm_contatti_assistenza(uuid, text) to authenticated;
