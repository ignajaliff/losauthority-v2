-- ============================================================================
-- 20260929000021 · compiti.link_skool
--
-- Un sotto-compito può portare il link della lezione Skool con cui si fa:
-- il team lo incolla creando il sotto-compito, il cliente lo vede nella sua
-- tappa ("ti aiuta la lezione …"). Solo per i sotto-compiti (padre_id non
-- null) e solo URL della classroom Skool. Il cliente non può cambiarlo
-- (aggiunto alle colonne protette dal trigger compiti_solo_spunta_cliente).
-- ============================================================================

alter table public.compiti
  add column link_skool text
    check (
      link_skool is null
      or (padre_id is not null and length(link_skool) <= 500 and link_skool ~ '^https://(www\.)?skool\.com/')
    );
comment on column public.compiti.link_skool is 'Lezione Skool con cui fare il sotto-compito (URL della classroom); solo per i sotto-compiti.';

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
       or new.creato_da is distinct from old.creato_da
       or new.link_skool is distinct from old.link_skool then
      raise exception 'Il cliente può solo spuntare i compiti';
    end if;
  end if;
  return new;
end;
$$;
