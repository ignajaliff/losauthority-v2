-- ============================================================================
-- 20260929000019 · Piano d'azione a due livelli: compiti padre e sotto-compiti
--
-- Il piano d'azione diventa una linea del tempo: le TAPPE (compiti padre,
-- padre_id null) contengono i SOTTO-COMPITI (padre_id = tappa) che il cliente
-- spunta dalla sua Dashboard. Regole, tutte nel database:
--   · un solo livello: un sotto-compito non può avere figli, il padre deve
--     essere dello stesso cliente;
--   · una tappa con sotto-compiti non si segna fatta a mano: il suo stato è
--     DERIVATO (trigger): fatta quando tutti i figli sono fatti, altrimenti
--     torna da fare;
--   · il cliente ora può aggiornare i propri compiti, ma SOLO lo stato (un
--     trigger blocca ogni altra colonna se chi scrive non è del team).
-- Cancellare una tappa cancella i suoi sotto-compiti (on delete cascade).
-- ============================================================================

alter table public.compiti
  add column padre_id uuid references public.compiti (id) on delete cascade;
comment on column public.compiti.padre_id is 'Tappa (compito padre) di cui questo è un sotto-compito; null = è una tappa.';

create index compiti_padre_idx on public.compiti (padre_id) where padre_id is not null;

-- ---------------------------------------------------------------------------
-- Gerarchia a un livello + tappa non completabile a mano con figli aperti.
-- ---------------------------------------------------------------------------
create or replace function private.compiti_controlla_gerarchia()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  padre_cliente uuid;
  padre_padre uuid;
begin
  if new.padre_id is not null then
    if new.padre_id = new.id then
      raise exception 'Un compito non può essere il padre di se stesso';
    end if;
    select cliente_id, padre_id into padre_cliente, padre_padre from public.compiti where id = new.padre_id;
    if not found then
      raise exception 'Compito padre non trovato';
    end if;
    if padre_cliente <> new.cliente_id then
      raise exception 'Il compito padre appartiene a un altro cliente';
    end if;
    if padre_padre is not null then
      raise exception 'Un sotto-compito non può avere altri sotto-compiti';
    end if;
    if tg_op = 'UPDATE' and exists (select 1 from public.compiti where padre_id = new.id) then
      raise exception 'Un compito con sotto-compiti non può diventare un sotto-compito';
    end if;
  end if;
  if new.padre_id is null and new.stato = 'fatto'
     and exists (select 1 from public.compiti where padre_id = new.id and stato <> 'fatto') then
    raise exception 'Completa prima tutti i sotto-compiti';
  end if;
  return new;
end;
$$;
revoke execute on function private.compiti_controlla_gerarchia() from public, anon, authenticated;

create trigger compiti_controlla_gerarchia before insert or update on public.compiti
  for each row execute function private.compiti_controlla_gerarchia();

-- ---------------------------------------------------------------------------
-- Stato della tappa derivato dai sotto-compiti (dopo insert/update/delete di un figlio).
-- Il padre ha padre_id null, quindi l'update che fa qui non rientra nel trigger.
-- ---------------------------------------------------------------------------
create or replace function private.compiti_sincronizza_padre()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  ids uuid[];
  pid uuid;
  nuovo text;
begin
  -- Padre vecchio e nuovo (se un figlio cambia tappa vanno ricalcolati entrambi); vuoto per le tappe.
  ids := array(
    select distinct x from unnest(array[
      case when tg_op <> 'INSERT' then old.padre_id end,
      case when tg_op <> 'DELETE' then new.padre_id end
    ]) x where x is not null
  );
  foreach pid in array ids loop
    select case when count(*) = 0 then null
                when count(*) filter (where stato <> 'fatto') = 0 then 'fatto'
                else 'da_fare' end
      into nuovo
      from public.compiti where padre_id = pid;
    if nuovo is not null then
      update public.compiti set stato = nuovo where id = pid and stato <> nuovo;
    end if;
  end loop;
  return null;
end;
$$;
revoke execute on function private.compiti_sincronizza_padre() from public, anon, authenticated;

create trigger compiti_sincronizza_padre after insert or update of stato, padre_id or delete on public.compiti
  for each row execute function private.compiti_sincronizza_padre();

-- ---------------------------------------------------------------------------
-- Il cliente spunta i propri compiti: può cambiare SOLO lo stato.
-- ---------------------------------------------------------------------------
create or replace function private.compiti_solo_spunta_cliente()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if (select auth.uid()) is not null and not (select private.es_team()) then
    if new.testo <> old.testo
       or new.ordine <> old.ordine
       or new.cliente_id <> old.cliente_id
       or new.padre_id is distinct from old.padre_id
       or new.creato_da is distinct from old.creato_da then
      raise exception 'Il cliente può solo spuntare i compiti';
    end if;
  end if;
  return new;
end;
$$;
revoke execute on function private.compiti_solo_spunta_cliente() from public, anon, authenticated;

create trigger compiti_solo_spunta_cliente before update on public.compiti
  for each row execute function private.compiti_solo_spunta_cliente();

-- Una sola policy di update (niente policy permissive doppie): il cliente sui propri, il team su tutti.
drop policy "compiti: team aggiorna" on public.compiti;
create policy "compiti: aggiorna proprio o team" on public.compiti for update to authenticated
  using (cliente_id = (select auth.uid()) or (select private.es_team()))
  with check (cliente_id = (select auth.uid()) or (select private.es_team()));
