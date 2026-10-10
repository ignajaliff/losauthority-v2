-- ============================================================================
-- 0049 · compiti.pagina: «fallo qui» (09/10/2026)
--
-- Pedido dell'utente: se un sotto-compito si fa in una pagina dell'area cliente
-- (costruire l'offerta, l'avatar, salvare i concorrenti, mettere un video nel
-- Workflow…), accanto alla lezione Skool il cliente vede anche il link diretto a
-- quella pagina. La chiave rimanda alla lista condivisa
-- supabase/functions/_shared/area/pagine.ts (il percorso lo sa il browser);
-- Aura la sceglie per chiave, il team dal popup «Sotto-compito». Solo per i
-- sotto-compiti, come link_skool. Protetta dal trigger compiti_solo_spunta_cliente.
-- ============================================================================

alter table public.compiti
  add column pagina text
    check (
      pagina is null
      or (padre_id is not null and pagina in (
        'avatar', 'offerta', 'concorrenti', 'kit_brand', 'crea_idee', 'ricerca_tiktok',
        'stili', 'workflow', 'pubblicazioni', 'clienti', 'coach'
      ))
    );
comment on column public.compiti.pagina is 'Pagina dell''area cliente dove si fa il sotto-compito («Fallo qui»): chiave di _shared/area/pagine.ts; solo per i sotto-compiti.';

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
       or new.nota_skool is distinct from old.nota_skool
       or new.origine <> old.origine
       or new.chiamata_id is distinct from old.chiamata_id
       or new.pagina is distinct from old.pagina then
      raise exception 'Il cliente può solo spuntare i compiti';
    end if;
  end if;
  return new;
end;
$$;
