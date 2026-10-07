-- ============================================================================
-- 20260929000022 · compiti.nota_skool
--
-- Mini messaggio accanto al link della lezione Skool di un sotto-compito
-- ("Dal minuto 20:03", "Guarda solo la seconda parte"): il team lo scrive con
-- il link, il cliente lo legge nel chip della lezione. Ha senso solo se c'è il
-- link. Protetto dal trigger compiti_solo_spunta_cliente come le altre colonne.
-- ============================================================================

alter table public.compiti
  add column nota_skool text
    check (nota_skool is null or (link_skool is not null and length(nota_skool) between 1 and 120));
comment on column public.compiti.nota_skool is 'Nota breve accanto al link Skool del sotto-compito (es. "Dal minuto 20:03"); solo con link_skool.';

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
       or new.link_skool is distinct from old.link_skool
       or new.nota_skool is distinct from old.nota_skool then
      raise exception 'Il cliente può solo spuntare i compiti';
    end if;
  end if;
  return new;
end;
$$;
