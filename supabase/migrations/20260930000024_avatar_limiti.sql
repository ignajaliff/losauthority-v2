-- ============================================================================
-- 20260930000024 · Limiti dell'Avatar (dalla revisione del 30/09/2026)
--
-- 1. aura_usage.scope: il rate limit di Aura era un unico secchio per utente,
--    condiviso da tutte le funzioni (help 20, idee 30, coach 30, stile 10,
--    avatar 40): dieci turni di avatar bloccavano gli Stili per un'ora. Ora
--    ogni funzione può contare nel proprio ambito; senza p_scope si usa
--    'generale' e le funzioni esistenti continuano come prima.
-- 2. Massimo 12 avatar per cliente anche nel database (prima solo nel codice
--    della funzione, count-then-insert non atomico): trigger con lock sulla
--    riga del cliente, così due inserimenti concorrenti si mettono in coda.
-- ============================================================================

alter table public.aura_usage add column scope text not null default 'generale' check (length(scope) between 1 and 40);
create index aura_usage_user_scope_time_idx on public.aura_usage (user_id, scope, created_at desc);

create or replace function private.aura_help_allowed(p_user uuid, p_max integer, p_window_secs integer, p_scope text)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare cnt integer;
begin
  select count(*) into cnt
  from public.aura_usage
  where user_id = p_user and scope = p_scope and created_at > now() - make_interval(secs => p_window_secs);
  if cnt >= p_max then
    return false;
  end if;
  insert into public.aura_usage (user_id, scope) values (p_user, p_scope);
  return true;
end;
$$;

-- La versione a 3 argomenti resta e conta nell'ambito 'generale' (funzioni già deployate).
create or replace function private.aura_help_allowed(p_user uuid, p_max integer, p_window_secs integer)
returns boolean
language sql
security definer
set search_path = ''
as $$
  select private.aura_help_allowed(p_user, p_max, p_window_secs, 'generale');
$$;

create or replace function public.aura_help_allowed(p_user uuid, p_max integer, p_window_secs integer, p_scope text)
returns boolean
language sql
security definer
set search_path = ''
as $$
  select private.aura_help_allowed(p_user, p_max, p_window_secs, p_scope);
$$;
revoke execute on function private.aura_help_allowed(uuid, integer, integer, text) from public, anon;
revoke execute on function public.aura_help_allowed(uuid, integer, integer, text) from public, anon;
grant execute on function public.aura_help_allowed(uuid, integer, integer, text) to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- Massimo 12 avatar per cliente, garantito dal database.
-- ---------------------------------------------------------------------------
create or replace function private.avatar_limite_per_cliente()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  -- Serializza gli inserimenti dello stesso cliente: il conteggio è affidabile anche in concorrenza.
  perform 1 from public.clienti where id = new.cliente_id for update;
  if (select count(*) from public.avatar where cliente_id = new.cliente_id) >= 12 then
    raise exception 'Massimo 12 avatar per cliente';
  end if;
  return new;
end;
$$;
revoke execute on function private.avatar_limite_per_cliente() from public, anon, authenticated;

create trigger avatar_limite_per_cliente before insert on public.avatar
  for each row execute function private.avatar_limite_per_cliente();
