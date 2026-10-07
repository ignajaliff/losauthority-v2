-- ============================================================================
-- 20260927000013 · Pubblicazioni e metriche (area cliente)
--
-- `pubblicazioni`: la "carta" di un video pubblicato: titolo, su quali
-- piattaforme (tiktok / instagram / entrambe), data. Nasce da sola quando un
-- contenuto del Workflow passa a 'pubblicato' (trigger), oppure a mano.
-- `pubblicazioni_metriche`: le rilevazioni nel tempo, una riga per
-- (pubblicazione, piattaforma, momento): visualizzazioni, mi piace, commenti.
-- Più rilevazioni per la stessa pubblicazione → confronto 24 h vs 1 settimana.
-- ============================================================================

create table public.pubblicazioni (
  id             uuid primary key default gen_random_uuid(),
  cliente_id     uuid not null references public.clienti (id) on delete cascade,
  contenuto_id   uuid unique references public.contenuti (id) on delete set null,
  titolo         text not null check (length(titolo) between 1 and 200),
  piattaforme    text[] not null default '{}'
                 check (piattaforme <@ array['tiktok', 'instagram']::text[] and cardinality(piattaforme) <= 2),
  pubblicata_il  date,
  note           text check (note is null or length(note) <= 2000),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
comment on table public.pubblicazioni is 'Video pubblicati del cliente: una carta per pubblicazione, con le piattaforme.';

create index pubblicazioni_cliente_idx on public.pubblicazioni (cliente_id, pubblicata_il desc, created_at desc);

create trigger set_updated_at before update on public.pubblicazioni
  for each row execute procedure extensions.moddatetime (updated_at);

create table public.pubblicazioni_metriche (
  id                uuid primary key default gen_random_uuid(),
  pubblicazione_id  uuid not null references public.pubblicazioni (id) on delete cascade,
  piattaforma       text not null check (piattaforma in ('tiktok', 'instagram')),
  rilevata_il       timestamptz not null default now(),
  visualizzazioni   integer check (visualizzazioni is null or visualizzazioni >= 0),
  mi_piace          integer check (mi_piace is null or mi_piace >= 0),
  commenti          integer check (commenti is null or commenti >= 0),
  creato_da         uuid references public.user_roles (id) on delete set null,
  created_at        timestamptz not null default now(),
  constraint metriche_almeno_un_valore check (coalesce(visualizzazioni, mi_piace, commenti) is not null)
);
comment on table public.pubblicazioni_metriche is 'Rilevazioni nel tempo di una pubblicazione, per piattaforma.';

create index pubblicazioni_metriche_idx on public.pubblicazioni_metriche (pubblicazione_id, piattaforma, rilevata_il desc);

-- ---------------------------------------------------------------------------
-- Workflow → Pubblicazioni: quando un contenuto diventa 'pubblicato' nasce la
-- carta (se non c'è già). Se torna indietro e la carta non ha rilevazioni, la
-- carta sparisce; se ha rilevazioni resta (i dati non si buttano).
-- ---------------------------------------------------------------------------
create or replace function private.contenuti_sincronizza_pubblicazione()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.stato = 'pubblicato' then
    insert into public.pubblicazioni (cliente_id, contenuto_id, titolo, pubblicata_il)
    values (new.cliente_id, new.id, new.titolo, new.pubblicato_il)
    on conflict (contenuto_id) do update
      set pubblicata_il = coalesce(public.pubblicazioni.pubblicata_il, excluded.pubblicata_il);
  elsif tg_op = 'UPDATE' and old.stato = 'pubblicato' then
    delete from public.pubblicazioni p
    where p.contenuto_id = new.id
      and not exists (select 1 from public.pubblicazioni_metriche m where m.pubblicazione_id = p.id);
  end if;
  return new;
end;
$$;
revoke execute on function private.contenuti_sincronizza_pubblicazione() from public, anon, authenticated;

create trigger contenuti_sincronizza_pubblicazione after insert or update of stato on public.contenuti
  for each row execute function private.contenuti_sincronizza_pubblicazione();

-- ---------------------------------------------------------------------------
-- RLS: il cliente gestisce le proprie, il team tutte.
-- ---------------------------------------------------------------------------
alter table public.pubblicazioni enable row level security;

create policy "pubblicazioni: lettura propria o team" on public.pubblicazioni for select to authenticated
  using (cliente_id = (select auth.uid()) or (select private.es_team()));
create policy "pubblicazioni: inserisce proprietario o team" on public.pubblicazioni for insert to authenticated
  with check (cliente_id = (select auth.uid()) or (select private.es_team()));
create policy "pubblicazioni: aggiorna proprietario o team" on public.pubblicazioni for update to authenticated
  using (cliente_id = (select auth.uid()) or (select private.es_team()))
  with check (cliente_id = (select auth.uid()) or (select private.es_team()));
create policy "pubblicazioni: elimina proprietario o team" on public.pubblicazioni for delete to authenticated
  using (cliente_id = (select auth.uid()) or (select private.es_team()));

revoke all on public.pubblicazioni from anon;

-- Le metriche seguono il proprietario della pubblicazione.
create or replace function private.e_mia_pubblicazione(p_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.pubblicazioni p
    where p.id = p_id and (p.cliente_id = (select auth.uid()) or (select private.es_team()))
  );
$$;
revoke execute on function private.e_mia_pubblicazione(uuid) from public, anon;
grant execute on function private.e_mia_pubblicazione(uuid) to authenticated;

alter table public.pubblicazioni_metriche enable row level security;

create policy "metriche: lettura propria o team" on public.pubblicazioni_metriche for select to authenticated
  using ((select private.e_mia_pubblicazione(pubblicazione_id)));
create policy "metriche: inserisce proprietario o team" on public.pubblicazioni_metriche for insert to authenticated
  with check ((select private.e_mia_pubblicazione(pubblicazione_id)) and creato_da = (select auth.uid()));
create policy "metriche: aggiorna proprietario o team" on public.pubblicazioni_metriche for update to authenticated
  using ((select private.e_mia_pubblicazione(pubblicazione_id)))
  with check ((select private.e_mia_pubblicazione(pubblicazione_id)));
create policy "metriche: elimina proprietario o team" on public.pubblicazioni_metriche for delete to authenticated
  using ((select private.e_mia_pubblicazione(pubblicazione_id)));

revoke all on public.pubblicazioni_metriche from anon;
