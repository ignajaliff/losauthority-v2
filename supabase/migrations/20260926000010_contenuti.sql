-- ============================================================================
-- 20260926000010 · Contenuti (Workflow dell'area cliente)
--
-- Ogni riga è un'idea di video del cliente che attraversa una pipeline di
-- stati: Fase script (default) → Da registrare → Da editare → Pronto per
-- upload → Pubblicato. Tipologia (virale / consolidazione / vendita /
-- content series), data di pubblicazione (si compila quando passa a
-- "pubblicato") e link Drive con il materiale del video.
-- Scrivono sia il cliente (solo i propri) sia il team.
-- ============================================================================

create table public.contenuti (
  id             uuid primary key default gen_random_uuid(),
  cliente_id     uuid not null references public.clienti (id) on delete cascade,
  titolo         text not null check (length(titolo) between 1 and 200),
  stato          text not null default 'fase_script'
                 check (stato in ('fase_script', 'da_registrare', 'da_editare', 'pronto_upload', 'pubblicato')),
  tipologia      text check (tipologia in ('virale', 'consolidazione', 'vendita', 'content_series')),
  pubblicato_il  date,
  drive_url      text check (drive_url is null or (length(drive_url) <= 2000 and drive_url ~* '^https?://')),
  note           text check (note is null or length(note) <= 2000),
  ordine         smallint not null default 0 check (ordine >= 0),
  creato_da      uuid references public.user_roles (id) on delete set null,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  -- pubblicato ⇔ ha una data di pubblicazione (il trigger sotto la tiene allineata)
  constraint contenuti_pubblicato_coerente check ((stato = 'pubblicato') = (pubblicato_il is not null))
);
comment on table public.contenuti is 'Workflow dei video del cliente: una riga per idea, con stato a pipeline.';

create index contenuti_cliente_idx on public.contenuti (cliente_id, stato, ordine, created_at);

create trigger set_updated_at before update on public.contenuti
  for each row execute procedure extensions.moddatetime (updated_at);

-- pubblicato_il segue lo stato: oggi (ora italiana) quando diventa 'pubblicato', null altrimenti.
create or replace function private.contenuti_allinea_pubblicato()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.stato = 'pubblicato' then
    if new.pubblicato_il is null then
      new.pubblicato_il := (now() at time zone 'Europe/Rome')::date;
    end if;
  else
    new.pubblicato_il := null;
  end if;
  return new;
end;
$$;
revoke execute on function private.contenuti_allinea_pubblicato() from public, anon, authenticated;

create trigger contenuti_allinea_pubblicato before insert or update of stato, pubblicato_il on public.contenuti
  for each row execute function private.contenuti_allinea_pubblicato();

-- ---------------------------------------------------------------------------
-- RLS: il cliente gestisce i propri contenuti, il team tutti.
-- ---------------------------------------------------------------------------
alter table public.contenuti enable row level security;

create policy "contenuti: lettura propria o team" on public.contenuti for select to authenticated
  using (cliente_id = (select auth.uid()) or (select private.es_team()));

create policy "contenuti: inserisce proprietario o team" on public.contenuti for insert to authenticated
  with check (
    (cliente_id = (select auth.uid()) or (select private.es_team()))
    and creato_da = (select auth.uid())
  );

create policy "contenuti: aggiorna proprietario o team" on public.contenuti for update to authenticated
  using (cliente_id = (select auth.uid()) or (select private.es_team()))
  with check (cliente_id = (select auth.uid()) or (select private.es_team()));

create policy "contenuti: elimina proprietario o team" on public.contenuti for delete to authenticated
  using (cliente_id = (select auth.uid()) or (select private.es_team()));

revoke all on public.contenuti from anon;
