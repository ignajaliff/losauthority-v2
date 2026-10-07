-- ---------------------------------------------------------------------------
-- Solo la scheda Onboarding: le schede "Avatar & Dolori" e "Offerta" escono
-- dal sistema. Le risposte non sono più righe (questionario_*) ma UNA riga per
-- cliente in `data_onboarding`, con una colonna per domanda (jsonb solo per le
-- domande multi-valore) e i file della sezione Materiali in `files_onboarding`.
-- Decisione del 25/09/2026. Il bucket `materiali` e le sue policy restano.
-- ---------------------------------------------------------------------------

-- ---------------------------------------------------------------------------
-- 1) data_onboarding: id = id del cliente (1:1 con clienti). I nomi delle
--    colonne sono gli id STABILI delle domande (src/features/scheda/definizioni):
--    Aura e le Edge Functions leggono gli id, non le etichette.
-- ---------------------------------------------------------------------------
create table public.data_onboarding (
  id                     uuid primary key references public.clienti (id) on delete cascade,
  stato                  text not null default 'bozza' check (stato in ('bozza', 'inviato')),
  schermata              text check (schermata is null or schermata in ('benvenuto', 'sezione')),
  sezione_indice         integer check (sezione_indice is null or sezione_indice >= 0),
  inviato_il             timestamptz,

  -- A · Il tuo business
  business_descrizione   text,
  offerta_attuale        text,
  fatturato_mensile      text check (fatturato_mensile is null or fatturato_mensile in ('<1k', '1-3k', '3-5k', '5-10k', '10k+')),
  vendita_processo       text,

  -- B · I tuoi clienti
  provenienza_clienti    jsonb check (provenienza_clienti is null or jsonb_typeof(provenienza_clienti) = 'array'),
  cliente_migliore       text,
  anti_cliente           text,
  messaggi_tipici        text,

  -- C · La tua comunicazione oggi
  dove_si_blocca         text check (dove_si_blocca is null or dove_si_blocca in ('poche_views', 'no_dm', 'no_acquisti', 'clienti_sbagliati')),
  auto_diagnosi          text,
  profili_social         jsonb check (profili_social is null or jsonb_typeof(profili_social) = 'array'),
  follower_e_views       text,
  contenuti_top          text,
  comfort_camera         text,
  tentativi_passati      text,
  riferimenti            text,

  -- D · La mappa del tuo tempo (ore intere a settimana)
  ore_idee               integer check (ore_idee is null or ore_idee >= 0),
  ore_scrittura          integer check (ore_scrittura is null or ore_scrittura >= 0),
  ore_riprese            integer check (ore_riprese is null or ore_riprese >= 0),
  ore_editing            integer check (ore_editing is null or ore_editing >= 0),
  ore_pubblicazione      integer check (ore_pubblicazione is null or ore_pubblicazione >= 0),
  ore_dm                 integer check (ore_dm is null or ore_dm >= 0),
  ore_clienti            integer check (ore_clienti is null or ore_clienti >= 0),
  ore_admin              integer check (ore_admin is null or ore_admin >= 0),
  attivita_odiata        text,

  -- E · Tu e l'IA
  strumenti_ia           text,
  abbonamenti            jsonb check (abbonamenti is null or jsonb_typeof(abbonamenti) = 'array'),
  dispositivo            text check (dispositivo is null or dispositivo in ('mac', 'windows', 'telefono')),

  -- F · Obiettivi e percorso
  obiettivo_6_mesi       text,
  competenza_desiderata  text,
  cosa_evitare           text,
  perche_adesso          text,
  disponibilita          text,

  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now(),
  constraint data_onboarding_inviato_coerente check (stato = 'bozza' or inviato_il is not null)
);
comment on table public.data_onboarding is
  'Scheda onboarding del cliente: una riga per cliente, una colonna per domanda. Il cliente scrive solo in bozza.';

create trigger set_updated_at before update on public.data_onboarding
  for each row execute procedure extensions.moddatetime (updated_at);

alter table public.data_onboarding enable row level security;
create policy "onboarding: lettura propria o team" on public.data_onboarding for select to authenticated
  using (id = (select auth.uid()) or (select private.es_team()));
create policy "onboarding: cliente crea la propria" on public.data_onboarding for insert to authenticated
  with check (id = (select auth.uid()));
create policy "onboarding: cliente aggiorna la bozza" on public.data_onboarding for update to authenticated
  using (id = (select auth.uid()) and stato = 'bozza')
  with check (id = (select auth.uid()));

-- ---------------------------------------------------------------------------
-- 2) files_onboarding: un file per riga (sezione Materiali), nel bucket
--    `materiali/{cliente}/{uuid}.{ext}`. Si aggiunge/elimina solo in bozza.
-- ---------------------------------------------------------------------------
create or replace function private.onboarding_mio_in_bozza(p_onboarding uuid)
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.data_onboarding d
    where d.id = p_onboarding and d.id = (select auth.uid()) and d.stato = 'bozza'
  );
$$;
revoke execute on function private.onboarding_mio_in_bozza(uuid) from public, anon;
grant execute on function private.onboarding_mio_in_bozza(uuid) to authenticated, service_role;

create table public.files_onboarding (
  id             uuid primary key default gen_random_uuid(),
  onboarding_id  uuid not null references public.data_onboarding (id) on delete cascade,
  nome           text not null check (length(nome) between 1 and 255),
  dimensione     bigint not null check (dimensione >= 0),
  storage_path   text not null unique,
  created_at     timestamptz not null default now()
);
comment on table public.files_onboarding is
  'File della sezione Materiali della scheda onboarding (bucket materiali). onboarding_id = id del cliente.';
create index files_onboarding_onboarding_idx on public.files_onboarding (onboarding_id, created_at);

alter table public.files_onboarding enable row level security;
create policy "files onboarding: lettura propria o team" on public.files_onboarding for select to authenticated
  using (onboarding_id = (select auth.uid()) or (select private.es_team()));
create policy "files onboarding: cliente aggiunge in bozza" on public.files_onboarding for insert to authenticated
  with check ((select private.onboarding_mio_in_bozza(onboarding_id)));
create policy "files onboarding: cliente elimina in bozza" on public.files_onboarding for delete to authenticated
  using ((select private.onboarding_mio_in_bozza(onboarding_id)));

-- Le tabelle in public sono esposte via API: mai ad anon.
revoke all on public.data_onboarding from anon;
revoke all on public.files_onboarding from anon;

-- ---------------------------------------------------------------------------
-- 3) Travaso degli onboarding già presenti: righe (domanda_id, ordine, valore)
--    → colonne. Valori fuori vocabolario o non numerici → null (non si perde
--    l'invio). Avatar/Offerta non si travasano: escono dal sistema.
-- ---------------------------------------------------------------------------
insert into public.data_onboarding (
  id, stato, schermata, sezione_indice, inviato_il, created_at,
  business_descrizione, offerta_attuale, fatturato_mensile, vendita_processo,
  provenienza_clienti, cliente_migliore, anti_cliente, messaggi_tipici,
  dove_si_blocca, auto_diagnosi, profili_social, follower_e_views, contenuti_top, comfort_camera, tentativi_passati, riferimenti,
  ore_idee, ore_scrittura, ore_riprese, ore_editing, ore_pubblicazione, ore_dm, ore_clienti, ore_admin, attivita_odiata,
  strumenti_ia, abbonamenti, dispositivo,
  obiettivo_6_mesi, competenza_desiderata, cosa_evitare, perche_adesso, disponibilita
)
select
  i.cliente_id,
  i.stato,
  case when i.schermata in ('benvenuto', 'sezione') then i.schermata end,
  i.sezione_indice,
  case when i.stato = 'inviato' then coalesce(i.inviato_il, i.updated_at) end,
  i.created_at,
  x.r->'business_descrizione'->>0,
  x.r->'offerta_attuale'->>0,
  case when x.r->'fatturato_mensile'->>0 in ('<1k', '1-3k', '3-5k', '5-10k', '10k+') then x.r->'fatturato_mensile'->>0 end,
  x.r->'vendita_processo'->>0,
  x.r->'provenienza_clienti',
  x.r->'cliente_migliore'->>0,
  x.r->'anti_cliente'->>0,
  x.r->'messaggi_tipici'->>0,
  case when x.r->'dove_si_blocca'->>0 in ('poche_views', 'no_dm', 'no_acquisti', 'clienti_sbagliati') then x.r->'dove_si_blocca'->>0 end,
  x.r->'auto_diagnosi'->>0,
  x.r->'profili_social',
  x.r->'follower_e_views'->>0,
  x.r->'contenuti_top'->>0,
  x.r->'comfort_camera'->>0,
  x.r->'tentativi_passati'->>0,
  x.r->'riferimenti'->>0,
  case when x.r->'ore_idee'->>0 ~ '^\d+$' then (x.r->'ore_idee'->>0)::integer end,
  case when x.r->'ore_scrittura'->>0 ~ '^\d+$' then (x.r->'ore_scrittura'->>0)::integer end,
  case when x.r->'ore_riprese'->>0 ~ '^\d+$' then (x.r->'ore_riprese'->>0)::integer end,
  case when x.r->'ore_editing'->>0 ~ '^\d+$' then (x.r->'ore_editing'->>0)::integer end,
  case when x.r->'ore_pubblicazione'->>0 ~ '^\d+$' then (x.r->'ore_pubblicazione'->>0)::integer end,
  case when x.r->'ore_dm'->>0 ~ '^\d+$' then (x.r->'ore_dm'->>0)::integer end,
  case when x.r->'ore_clienti'->>0 ~ '^\d+$' then (x.r->'ore_clienti'->>0)::integer end,
  case when x.r->'ore_admin'->>0 ~ '^\d+$' then (x.r->'ore_admin'->>0)::integer end,
  x.r->'attivita_odiata'->>0,
  x.r->'strumenti_ia'->>0,
  x.r->'abbonamenti',
  case when x.r->'dispositivo'->>0 in ('mac', 'windows', 'telefono') then x.r->'dispositivo'->>0 end,
  x.r->'obiettivo_6_mesi'->>0,
  x.r->'competenza_desiderata'->>0,
  x.r->'cosa_evitare'->>0,
  x.r->'perche_adesso'->>0,
  x.r->'disponibilita'->>0
from public.questionario_invii i
left join lateral (
  select coalesce(jsonb_object_agg(s.domanda_id, s.valori), '{}'::jsonb) as r
  from (
    select r.domanda_id, jsonb_agg(r.valore order by r.ordine) as valori
    from public.questionario_risposte r
    where r.invio_id = i.id
    group by r.domanda_id
  ) s
) x on true
where i.questionario_id = 'onboarding'
on conflict (id) do nothing;

insert into public.files_onboarding (id, onboarding_id, nome, dimensione, storage_path, created_at)
select a.id, i.cliente_id, a.nome, a.dimensione, a.storage_path, a.created_at
from public.questionario_allegati a
join public.questionario_invii i on i.id = a.invio_id
where i.questionario_id = 'onboarding'
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- 4) Via le vecchie tabelle (le policy cadono con le tabelle) e i loro helper.
-- ---------------------------------------------------------------------------
drop table public.questionario_allegati;
drop table public.questionario_risposte;
drop table public.questionario_invii;
drop function private.invio_e_mio_in_bozza(uuid);
drop function private.invio_e_mio(uuid);
