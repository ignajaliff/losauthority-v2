-- ---------------------------------------------------------------------------
-- Onboarding v3 (documenti di Wesley del 02/10/2026: «Domande e percorsi» e
-- «Istruzioni per Claude»). Sei domande iniziali scelgono quale versione di
-- ogni blocco vede il cliente; tutte le versioni scrivono nello stesso campo.
-- A fine form Claude legge il profilo (compito 2): valori fissi, fotografia
-- per Wesley, fino a 3 domande di chiarimento, riepilogo da confermare, note
-- per gli agenti. Gli stati: bozza → lettura → chiarimenti → lettura →
-- riepilogo → inviato.
--
-- I dati presenti (1 riga, 100% di prova) escono di scena: decisione del
-- 02/10/2026. Le tabelle vecchie NON si eliminano qui (il filtro del MCP non
-- esegue DDL distruttivo senza conferma): si rinominano in `*_v2_old` e si
-- buttano a mano con il blocco "Pulizia" in fondo. La tabella nuova ha una
-- colonna per campo del documento di Wesley (l'id della domanda È il nome
-- della colonna).
-- ---------------------------------------------------------------------------

-- 0) Da parte le tabelle vecchie (policy e trigger restano attaccati a loro).
alter table public.files_onboarding rename to files_onboarding_v2_old;
alter index public.files_onboarding_onboarding_idx rename to files_onboarding_v2_old_idx;
alter table public.data_onboarding rename to data_onboarding_v2_old;

-- ---------------------------------------------------------------------------
-- 1) data_onboarding: id = id del cliente. Colonne = campi del profilo.
--    jsonb SOLO per le liste (multiselect, link) e per le due mappe
--    opzione → valore (canali_acquisizione: conteggi; ore_per_attivita: fasce)
--    e per `parole` (le 5 parole del mestiere): eccezione documentata, stessa
--    natura delle liste multi-valore già ammesse.
-- ---------------------------------------------------------------------------
create table public.data_onboarding (
  id                       uuid primary key references public.clienti (id) on delete cascade,
  stato                    text not null default 'bozza'
                           check (stato in ('bozza', 'lettura', 'chiarimenti', 'riepilogo', 'inviato')),
  schermata                text check (schermata is null or schermata in ('benvenuto', 'sezione')),
  sezione_indice           integer check (sezione_indice is null or sezione_indice >= 0),
  inviato_il               timestamptz,

  -- Lettura di Aura (scrive solo la Edge Function onboarding-lettura)
  parole                   jsonb check (parole is null or jsonb_typeof(parole) = 'object'),
  chiarimenti_fatti        boolean not null default false,
  lettura_errore           text,
  riepilogo                text,
  riepilogo_correzione     text check (riepilogo_correzione is null or length(riepilogo_correzione) <= 4000),
  materiali_testo          text check (materiali_testo is null or length(materiali_testo) <= 60000),

  -- 0 · Da dove parti
  nome                     text,
  nome_attivita            text,
  attivita_breve           text,
  tipo                     text check (tipo is null or tipo in ('servizi', 'prodotti_fisici', 'prodotti_digitali', 'mix')),
  tipo_principale          text check (tipo_principale is null or tipo_principale in ('servizi', 'prodotti_fisici', 'prodotti_digitali')),
  mercato                  text check (mercato is null or mercato in ('privati', 'aziende', 'entrambi')),
  clienti                  text check (clienti is null or clienti in ('nessuno', 'pochi', 'continui')),
  social                   text check (social is null or social in ('non_pubblica', 'ogni_tanto', 'settimanale', 'porta_clienti')),

  -- A · Il tuo lavoro e la tua offerta
  presentazione            text,
  offerta_attuale          text,
  spesa_media              numeric(12,2) check (spesa_media is null or spesa_media >= 0),
  margine                  integer check (margine is null or margine between 0 and 100),
  fatturato_fascia         text check (fatturato_fascia is null or fatturato_fascia in ('<1k', '1-3k', '3-5k', '5-10k', '10k+')),
  processo_vendita         text,
  processo_vendita_canali  jsonb check (processo_vendita_canali is null or jsonb_typeof(processo_vendita_canali) = 'array'),
  conversione              integer check (conversione is null or conversione between 0 and 10),
  ordini_mese              integer check (ordini_mese is null or ordini_mese >= 0),
  ritorno                  text,
  capacita                 text,
  consegna                 text,
  prove                    jsonb check (prove is null or jsonb_typeof(prove) = 'array'),
  prove_testo              text,
  offerta_secondaria       text,
  decisore                 text,
  ciclo_vendita            text check (ciclo_vendita is null or ciclo_vendita in ('<1_settimana', '1-4_settimane', '1-3_mesi', '>3_mesi')),

  -- B · I tuoi clienti
  canali_acquisizione      jsonb check (canali_acquisizione is null or jsonb_typeof(canali_acquisizione) = 'object'),
  cliente_migliore         text,
  acquirente_utente        text check (acquirente_utente is null or acquirente_utente in ('si', 'regalo', 'familiare', 'azienda', 'altro')),
  anti_cliente             text,
  messaggi_tipici          text,
  obiezioni                text,
  avatar_ipotesi           text,
  domande_ricevute         text,
  esperienze_prova         text,

  -- C · La tua comunicazione oggi
  link_profili             jsonb check (link_profili is null or jsonb_typeof(link_profili) = 'array'),
  camera_agio              integer check (camera_agio is null or camera_agio between 1 and 5),
  vincoli_camera           text,
  tentativi_passati        text,
  riferimenti              text,
  blocco_partenza          jsonb check (blocco_partenza is null or jsonb_typeof(blocco_partenza) = 'array'),
  blocco_partenza_testo    text,
  paure                    text,
  collo_bottiglia          text check (collo_bottiglia is null or collo_bottiglia in (
                             'poche_views', 'views_senza_contatti', 'contatti_senza_vendite', 'clienti_o_prezzi_sbagliati',
                             'visite_senza_acquisti', 'nessun_ritorno', 'margini_bassi')),
  diagnosi_cliente         text,
  frequenza                integer check (frequenza is null or frequenza >= 0),
  contenuti_migliori       text,
  follower                 integer check (follower is null or follower >= 0),
  views_medie              integer check (views_medie is null or views_medie >= 0),
  clienti_da_social        integer check (clienti_da_social is null or clienti_da_social >= 0),
  priorita_crescita        text check (priorita_crescita is null or priorita_crescita in ('piu_clienti', 'clienti_migliori', 'prezzi_alti', 'meno_tempo')),

  -- D · Il tuo tempo
  ore_social               text check (ore_social is null or ore_social in ('<1', '1-2', '3-5', '6-10', '>10')),
  attivita_pesanti         jsonb check (attivita_pesanti is null or jsonb_typeof(attivita_pesanti) = 'array'),
  non_delegabile           text,
  ore_per_attivita         jsonb check (ore_per_attivita is null or jsonb_typeof(ore_per_attivita) = 'object'),

  -- E · Tu e l'IA
  ia_uso                   text,
  abbonamenti              jsonb check (abbonamenti is null or jsonb_typeof(abbonamenti) = 'array'),
  dispositivo              text check (dispositivo is null or dispositivo in ('mac', 'windows', 'telefono')),

  -- F · Obiettivi e percorso
  obiettivo_6_mesi         text,
  competenza_obiettivo     text,
  da_evitare               text,
  perche_ora               text,
  ore_percorso             text check (ore_percorso is null or ore_percorso in ('1-2', '3-5', '6-10', '>10')),
  disponibilita_call       jsonb check (disponibilita_call is null or jsonb_typeof(disponibilita_call) = 'array'),

  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now(),
  constraint data_onboarding_inviato_coerente check (stato <> 'inviato' or inviato_il is not null)
);
comment on table public.data_onboarding is
  'Onboarding v3: una riga per cliente, una colonna per campo del profilo (documento «Domande e percorsi»). Il cliente scrive in bozza/chiarimenti/riepilogo; la lettura di Aura la scrive onboarding-lettura.';

create trigger set_updated_at before update on public.data_onboarding
  for each row execute procedure extensions.moddatetime (updated_at);

-- Il cliente non cambia stato da solo (tranne riepilogo → inviato, la conferma)
-- e non tocca le colonne che scrive Aura. Il team e la Edge Function (service
-- role, auth.uid() nullo) non hanno limiti.
create or replace function private.onboarding_transizioni()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if (select auth.uid()) is null or (select private.es_team()) then
    if new.stato = 'inviato' and new.inviato_il is null then new.inviato_il := now(); end if;
    return new;
  end if;
  if new.stato is distinct from old.stato then
    if not (old.stato = 'riepilogo' and new.stato = 'inviato') then
      raise exception 'Il passaggio di stato lo fa Aura: % → % non è consentito', old.stato, new.stato;
    end if;
    new.inviato_il := now();
  end if;
  if new.parole is distinct from old.parole
     or new.riepilogo is distinct from old.riepilogo
     or new.chiarimenti_fatti is distinct from old.chiarimenti_fatti
     or new.lettura_errore is distinct from old.lettura_errore
     or new.materiali_testo is distinct from old.materiali_testo then
    raise exception 'Queste colonne le scrive solo Aura';
  end if;
  return new;
end;
$$;
create trigger onboarding_transizioni before update on public.data_onboarding
  for each row execute function private.onboarding_transizioni();

alter table public.data_onboarding enable row level security;
create policy "onboarding: lettura propria o team" on public.data_onboarding for select to authenticated
  using (id = (select auth.uid()) or (select private.es_team()));
create policy "onboarding: cliente crea la propria" on public.data_onboarding for insert to authenticated
  with check (id = (select auth.uid()));
create policy "onboarding: cliente aggiorna finché non è inviata" on public.data_onboarding for update to authenticated
  using (id = (select auth.uid()) and stato in ('bozza', 'chiarimenti', 'riepilogo'))
  with check (id = (select auth.uid()));

-- La riga del cliente loggato è in uno di questi stati?
create or replace function private.onboarding_mio_in_stato(p_onboarding uuid, p_stati text[])
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.data_onboarding d
    where d.id = p_onboarding and d.id = (select auth.uid()) and d.stato = any (p_stati)
  );
$$;
revoke execute on function private.onboarding_mio_in_stato(uuid, text[]) from public, anon;
grant execute on function private.onboarding_mio_in_stato(uuid, text[]) to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- 2) files_onboarding (blocco G): come prima; il cliente aggiunge/elimina
--    finché il form è aperto (bozza o chiarimenti).
-- ---------------------------------------------------------------------------
create table public.files_onboarding (
  id             uuid primary key default gen_random_uuid(),
  onboarding_id  uuid not null references public.data_onboarding (id) on delete cascade,
  nome           text not null check (length(nome) between 1 and 255),
  dimensione     bigint not null check (dimensione >= 0),
  storage_path   text not null unique,
  created_at     timestamptz not null default now()
);
comment on table public.files_onboarding is
  'File del blocco Materiali (bucket materiali). onboarding_id = id del cliente. PDF e immagini li legge Aura in materiali_testo.';
create index files_onboarding_onboarding_idx on public.files_onboarding (onboarding_id, created_at);

alter table public.files_onboarding enable row level security;
create policy "files onboarding: lettura propria o team" on public.files_onboarding for select to authenticated
  using (onboarding_id = (select auth.uid()) or (select private.es_team()));
create policy "files onboarding: cliente aggiunge" on public.files_onboarding for insert to authenticated
  with check ((select private.onboarding_mio_in_stato(onboarding_id, array['bozza', 'chiarimenti'])));
create policy "files onboarding: cliente elimina" on public.files_onboarding for delete to authenticated
  using ((select private.onboarding_mio_in_stato(onboarding_id, array['bozza', 'chiarimenti'])));

-- ---------------------------------------------------------------------------
-- 3) onboarding_lettura: la lettura di Aura per WESLEY (1:1 col cliente).
--    I valori fissi sono colonne filtrabili; fotografia e note in chiaro.
--    `opinioni_vs_fatti` e `domande_chiarimento` sono istantanee scritte dalla
--    funzione e rilette tali quali (come contratti.documento): jsonb.
--    SELECT solo team: il cliente non la vede mai (separazione garantita in DB).
-- ---------------------------------------------------------------------------
create table public.onboarding_lettura (
  id                   uuid primary key references public.data_onboarding (id) on delete cascade,
  giro                 integer not null default 1 check (giro between 1 and 2),
  modello              text,
  chiarezza_offerta    text check (chiarezza_offerta is null or chiarezza_offerta in ('chiara', 'parziale', 'confusa')),
  collo_bottiglia      text check (collo_bottiglia is null or collo_bottiglia in (
                         'non_pubblica', 'poche_views', 'views_senza_contatti', 'contatti_senza_vendite',
                         'clienti_o_prezzi_sbagliati', 'visite_senza_acquisti', 'nessun_ritorno', 'margini_bassi')),
  fase_economica       text check (fase_economica is null or fase_economica in ('partenza', 'sopravvivenza', 'stabile', 'scala')),
  urgenza              text check (urgenza is null or urgenza in ('alta', 'media', 'bassa')),
  gruppo_ia            text check (gruppo_ia is null or gruppo_ia in ('zero_digitale', 'digitale_base', 'usa_gia_ia')),
  nodo_centrale        text check (nodo_centrale is null or nodo_centrale in ('PARTENZA', 'VISIBILITA', 'VENDITA', 'RITORNO', 'OPERATIVITA')),
  snapshot             text,
  opinioni_vs_fatti    jsonb not null default '[]'::jsonb check (jsonb_typeof(opinioni_vs_fatti) = 'array'),
  punti_di_forza       text[] not null default '{}',
  criticita            text[] not null default '{}',
  perche_nodo_centrale text,
  priorita_operativa   text,
  da_validare_in_call  text[] not null default '{}',
  domande_chiarimento  jsonb not null default '[]'::jsonb check (jsonb_typeof(domande_chiarimento) = 'array'),
  note_avatar          text,
  note_offerta         text,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);
comment on table public.onboarding_lettura is
  'Lettura dell''onboarding fatta da Aura per Wesley (compito 2): valori fissi, fotografia, note per gli agenti. Il cliente non la vede.';
create trigger set_updated_at before update on public.onboarding_lettura
  for each row execute procedure extensions.moddatetime (updated_at);
alter table public.onboarding_lettura enable row level security;
create policy "lettura onboarding: solo team" on public.onboarding_lettura for select to authenticated
  using ((select private.es_team()));

-- ---------------------------------------------------------------------------
-- 4) onboarding_chiarimenti: le domande di chiarimento che il cliente vede e
--    a cui risponde (una riga ciascuna). Le inserisce la funzione; il cliente
--    cambia SOLO `risposta` mentre lo stato è `chiarimenti`.
-- ---------------------------------------------------------------------------
create table public.onboarding_chiarimenti (
  id          uuid primary key default gen_random_uuid(),
  cliente_id  uuid not null references public.data_onboarding (id) on delete cascade,
  ordine      integer not null check (ordine between 1 and 3),
  domanda     text not null check (length(domanda) between 1 and 600),
  campo       text not null check (length(campo) between 1 and 60),
  risposta    text check (risposta is null or length(risposta) <= 4000),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (cliente_id, ordine)
);
comment on table public.onboarding_chiarimenti is
  'Domande di chiarimento di Aura a fine form (max 3) con la risposta del cliente. Il perché per Wesley sta in onboarding_lettura.domande_chiarimento.';
create trigger set_updated_at before update on public.onboarding_chiarimenti
  for each row execute procedure extensions.moddatetime (updated_at);

create or replace function private.chiarimenti_solo_risposta_cliente()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if (select auth.uid()) is null or (select private.es_team()) then return new; end if;
  if new.cliente_id is distinct from old.cliente_id or new.ordine is distinct from old.ordine
     or new.domanda is distinct from old.domanda or new.campo is distinct from old.campo then
    raise exception 'Il cliente può scrivere solo la risposta';
  end if;
  return new;
end;
$$;
create trigger chiarimenti_solo_risposta_cliente before update on public.onboarding_chiarimenti
  for each row execute function private.chiarimenti_solo_risposta_cliente();

alter table public.onboarding_chiarimenti enable row level security;
create policy "chiarimenti: lettura propria o team" on public.onboarding_chiarimenti for select to authenticated
  using (cliente_id = (select auth.uid()) or (select private.es_team()));
create policy "chiarimenti: cliente risponde" on public.onboarding_chiarimenti for update to authenticated
  using ((select private.onboarding_mio_in_stato(cliente_id, array['chiarimenti'])))
  with check (cliente_id = (select auth.uid()));

-- Le tabelle in public sono esposte via API: mai ad anon.
revoke all on public.data_onboarding from anon;
revoke all on public.files_onboarding from anon;
revoke all on public.onboarding_lettura from anon;
revoke all on public.onboarding_chiarimenti from anon;

-- ---------------------------------------------------------------------------
-- 5) vista_clienti: nodo centrale e fase economica dalla lettura (in coda).
-- ---------------------------------------------------------------------------
create or replace view public.vista_clienti
with (security_invoker = true) as
select c.id, u.nombre, u.email, c.fase, c.stato_onboarding, c.data_inizio, c.prossima_call, c.prossima_call_source,
  c.telefono, c.instagram, c.tiktok, c.notion_hub_url, c.hub_creato_il, c.created_at,
  r.totali as fatture_totali, r.da_pagare as fatture_da_pagare, r.prossima_scadenza as fatture_prossima_scadenza,
  hc.call_corrente, hc.fatti, hc.totale, hc.in_corso, hc.di_wesley_aperti,
  c.tags as tag_labels,
  c.da_attivare,
  l.nodo_centrale,
  l.fase_economica
from public.clienti c
join public.user_roles u on u.id = c.id
left join lateral (select * from private.fatture_riepilogo(c.id)) r on true
left join lateral (
  select b.call_n as call_corrente,
    count(*) filter (where k.stato = 'done')::integer as fatti,
    count(*)::integer as totale,
    count(*) filter (where k.stato = 'in_progress')::integer as in_corso,
    count(*) filter (where k.assegnato_a = 'wesley' and k.stato <> 'done')::integer as di_wesley_aperti,
    count(*) filter (where k.stato <> 'done') as aperti
  from public.hub_board b
  join public.hub_compiti k on k.board_id = b.id
  where b.cliente_id = c.id and b.call_n between 1 and 4
  group by b.call_n
  order by (count(*) filter (where k.stato <> 'done') > 0) desc,
    (case when count(*) filter (where k.stato <> 'done') > 0 then b.call_n else -b.call_n end)
  limit 1
) hc on true
left join public.onboarding_lettura l on l.id = c.id
where u.rol = 'cliente';

-- ---------------------------------------------------------------------------
-- 6) Le regole per gli agenti avatar e offerta (compito 3 del documento di
--    Wesley) vivono nel codice: supabase/functions/_shared/onboarding/regole-agenti.ts
--    (aura-avatar e aura-offerta le mettono in testa al prompt).
--
-- Pulizia da fare a mano (DDL distruttivo, con conferma):
--   delete from public.analisi;                      -- 1 analisi di prova
--   drop table public.files_onboarding_v2_old;
--   drop table public.data_onboarding_v2_old;
--   drop function private.onboarding_mio_in_bozza(uuid);
-- ---------------------------------------------------------------------------
