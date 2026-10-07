-- ============================================================================
-- 20260925000008 · Tag del cliente in `clienti.tags` (text[]), via la ponte
--
-- Decisione 25/09/2026: come nel sistema precedente, le etichette del cliente
-- vivono in una colonna array sulla sua riga; `tags` resta il catalogo
-- riutilizzabile (pagina Tag). Rinomina/eliminazione di un tag si propagano
-- ai clienti con un trigger. Eccezione esplicita alla regola "niente array/JSON
-- per dati strutturati": scelta del cliente per semplicità.
-- ============================================================================

alter table public.clienti add column tags text[] not null default '{}';
comment on column public.clienti.tags is 'Etichette del cliente (label di public.tags). Sincronizzate dal trigger tags_sincronizza_clienti.';

-- Travaso dalla tabella ponte.
update public.clienti c
set tags = coalesce(
  (select array_agg(t.label order by t.label)
     from public.clienti_tags ct
     join public.tags t on t.id = ct.tag_id
    where ct.cliente_id = c.id),
  '{}'
);

create index clienti_tags_gin_idx on public.clienti using gin (tags);

-- ---------------------------------------------------------------------------
-- Vista lista clienti: tag_labels ora legge la colonna (stesse colonne, stesso ordine).
-- ---------------------------------------------------------------------------
create or replace view public.vista_clienti
with (security_invoker = true) as
select
  c.id,
  u.nombre,
  u.email,
  c.fase,
  c.stato_onboarding,
  c.data_inizio,
  c.prossima_call,
  c.prossima_call_source,
  c.telefono,
  c.instagram,
  c.tiktok,
  c.notion_hub_url,
  c.hub_creato_il,
  c.created_at,
  r.totali            as fatture_totali,
  r.da_pagare         as fatture_da_pagare,
  r.prossima_scadenza as fatture_prossima_scadenza,
  hc.call_corrente,
  hc.fatti,
  hc.totale,
  hc.in_corso,
  hc.di_wesley_aperti,
  c.tags              as tag_labels
from public.clienti c
join public.user_roles u on u.id = c.id
left join lateral (select * from private.fatture_riepilogo(c.id)) r on true
left join lateral (
  select
    b.call_n                                                         as call_corrente,
    count(*) filter (where k.stato = 'done')::int                    as fatti,
    count(*)::int                                                    as totale,
    count(*) filter (where k.stato = 'in_progress')::int             as in_corso,
    count(*) filter (where k.assegnato_a = 'wesley' and k.stato <> 'done')::int as di_wesley_aperti,
    count(*) filter (where k.stato <> 'done')                        as aperti
  from public.hub_board b
  join public.hub_compiti k on k.board_id = b.id
  where b.cliente_id = c.id and b.call_n between 1 and 4
  group by b.call_n
  order by (count(*) filter (where k.stato <> 'done') > 0) desc,
           case when count(*) filter (where k.stato <> 'done') > 0 then b.call_n else -b.call_n end
  limit 1
) hc on true
where u.rol = 'cliente';

drop table public.clienti_tags;

-- ---------------------------------------------------------------------------
-- Rinomina / elimina un tag del catalogo → aggiorna gli array dei clienti.
-- ---------------------------------------------------------------------------
create or replace function private.tags_sincronizza_clienti()
returns trigger
language plpgsql security definer
set search_path = ''
as $$
begin
  if tg_op = 'UPDATE' then
    if new.label <> old.label then
      update public.clienti
         set tags = array_replace(tags, old.label, new.label)
       where tags @> array[old.label];
    end if;
    return new;
  end if;
  -- DELETE
  update public.clienti
     set tags = array_remove(tags, old.label)
   where tags @> array[old.label];
  return old;
end;
$$;
revoke execute on function private.tags_sincronizza_clienti() from public, anon, authenticated;

create trigger tags_sincronizza_clienti
  after update of label or delete on public.tags
  for each row execute function private.tags_sincronizza_clienti();
