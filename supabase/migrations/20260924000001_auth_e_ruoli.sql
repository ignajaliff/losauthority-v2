-- ============================================================================
-- 0001 · Auth, ruoli e cliente base
-- Regole: ai-pmp/supabase-rules.txt · ai-pmp/security-rules.txt
-- ============================================================================

create extension if not exists moddatetime with schema extensions;
create extension if not exists pg_net with schema extensions;

-- Schema privato: funzioni SECURITY DEFINER e tabelle interne, mai esposte all'API.
create schema if not exists private;
revoke all on schema private from public, anon;
grant usage on schema private to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- Allowlist admin: chi si registra con una di queste email nasce admin.
-- ---------------------------------------------------------------------------
create table private.admin_emails (
  email       text primary key,
  created_at  timestamptz not null default now()
);
alter table private.admin_emails enable row level security;
-- Nessuna policy: solo service_role e le funzioni definer la leggono.

-- ---------------------------------------------------------------------------
-- user_roles: un record per utente auth. Il ruolo decide tutto.
-- Scrittura SOLO via service_role (Edge Function). Nessuna policy di scrittura.
-- ---------------------------------------------------------------------------
create table public.user_roles (
  id          uuid primary key references auth.users (id) on delete cascade,
  nombre      text not null,
  email       text not null unique,
  rol         text not null default 'cliente'
              check (rol in ('admin', 'staff', 'staff_fatture', 'cliente')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index user_roles_rol_idx on public.user_roles (rol);
create trigger set_updated_at
  before update on public.user_roles
  for each row execute procedure extensions.moddatetime (updated_at);
alter table public.user_roles enable row level security;

-- ---------------------------------------------------------------------------
-- Funzioni di ruolo (una sola volta, usate da tutte le policy).
-- SECURITY DEFINER + search_path fisso + EXECUTE solo per authenticated.
-- ---------------------------------------------------------------------------
create or replace function private.tiene_rol(rol_requerido text)
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.user_roles
    where id = (select auth.uid()) and rol = rol_requerido
  );
$$;

create or replace function private.es_team()
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.user_roles
    where id = (select auth.uid()) and rol in ('admin', 'staff', 'staff_fatture')
  );
$$;

create or replace function private.es_finance()
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.user_roles
    where id = (select auth.uid()) and rol in ('admin', 'staff_fatture')
  );
$$;

revoke execute on function private.tiene_rol(text) from public, anon;
revoke execute on function private.es_team() from public, anon;
revoke execute on function private.es_finance() from public, anon;
grant execute on function private.tiene_rol(text) to authenticated, service_role;
grant execute on function private.es_team() to authenticated, service_role;
grant execute on function private.es_finance() to authenticated, service_role;

-- Ogni utente legge il proprio ruolo; il team legge tutti (liste clienti/staff).
create policy "user_roles: lettura propria o team"
  on public.user_roles for select to authenticated
  using (id = (select auth.uid()) or (select private.es_team()));

-- ---------------------------------------------------------------------------
-- clienti: dati di gestione del cliente, 1:1 con user_roles (rol = cliente).
-- Lo stato dell'onboarding e l'hub Notion vivono qui (uno per cliente).
-- ---------------------------------------------------------------------------
create table public.clienti (
  id                        uuid primary key references public.user_roles (id) on delete cascade,
  fase                      text not null default 'onboarding'
                            check (fase in ('onboarding', 'call_1', 'call_2', 'call_3', 'call_4', 'completato')),
  stato_onboarding          text not null default 'nuovo'
                            check (stato_onboarding in ('nuovo', 'in_lavorazione', 'completato', 'hub_creato', 'fuori_target')),
  onboarding_completato_il  timestamptz,
  data_inizio               date,
  prossima_call             timestamptz,
  prossima_call_source      text
                            check (prossima_call_source is null or prossima_call_source in ('calendar', 'manuale')),
  telefono                  text,
  instagram                 text,
  tiktok                    text,
  note                      text,
  profilo                   text,
  ore_operative             integer check (ore_operative is null or ore_operative >= 0),
  notion_hub_url            text,
  hub_creato_il             timestamptz,
  created_at                timestamptz not null default now(),
  updated_at                timestamptz not null default now()
);
create index clienti_fase_idx on public.clienti (fase);
create index clienti_stato_onboarding_idx on public.clienti (stato_onboarding);
create index clienti_prossima_call_idx on public.clienti (prossima_call) where prossima_call is not null;
create trigger set_updated_at
  before update on public.clienti
  for each row execute procedure extensions.moddatetime (updated_at);
alter table public.clienti enable row level security;

create policy "clienti: lettura propria o team"
  on public.clienti for select to authenticated
  using (id = (select auth.uid()) or (select private.es_team()));
create policy "clienti: team inserisce"
  on public.clienti for insert to authenticated
  with check ((select private.es_team()));
create policy "clienti: team aggiorna"
  on public.clienti for update to authenticated
  using ((select private.es_team()))
  with check ((select private.es_team()));
-- Nessuna delete: l'eliminazione del cliente passa dall'Edge Function (cancella l'utente auth).

-- ---------------------------------------------------------------------------
-- Alta utenti: ogni nuovo auth.users riceve user_roles (+ clienti se cliente).
-- Ruolo: admin se in allowlist, altrimenti SEMPRE cliente (minimo privilegio).
-- Lo staff viene promosso dopo, via service_role.
-- ---------------------------------------------------------------------------
create or replace function private.handle_new_user()
returns trigger
language plpgsql security definer
set search_path = ''
as $$
declare
  v_rol    text;
  v_nombre text;
begin
  v_nombre := coalesce(
    nullif(new.raw_user_meta_data ->> 'nombre', ''),
    nullif(new.raw_user_meta_data ->> 'full_name', ''),
    new.email
  );
  if exists (select 1 from private.admin_emails a where lower(a.email) = lower(new.email)) then
    v_rol := 'admin';
  else
    v_rol := 'cliente';
  end if;

  insert into public.user_roles (id, nombre, email, rol)
  values (new.id, v_nombre, new.email, v_rol)
  on conflict (id) do nothing;

  if v_rol = 'cliente' then
    insert into public.clienti (id) values (new.id) on conflict (id) do nothing;
  end if;
  return new;
end;
$$;
revoke execute on function private.handle_new_user() from public, anon, authenticated;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function private.handle_new_user();

-- Tiene in sync email/nome se cambiano in auth.
create or replace function private.handle_user_updated()
returns trigger
language plpgsql security definer
set search_path = ''
as $$
begin
  update public.user_roles
  set email = new.email,
      nombre = coalesce(nullif(new.raw_user_meta_data ->> 'nombre', ''), nombre)
  where id = new.id;
  return new;
end;
$$;
revoke execute on function private.handle_user_updated() from public, anon, authenticated;

create trigger on_auth_user_updated
  after update of email, raw_user_meta_data on auth.users
  for each row execute function private.handle_user_updated();
