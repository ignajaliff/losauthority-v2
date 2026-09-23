-- ============================================================================
-- 0003 · Storage (bucket privati + policy per ruolo/cartella) e viste di lettura.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Bucket privati. File nominati {cartella}/{uuid}.{ext}, mai col nome originale.
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('fatture',   'fatture',   false, 10485760, array['application/pdf']),
  ('f24',       'f24',       false, 10485760, array['application/pdf']),
  ('ricevute',  'ricevute',  false, 10485760, array['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'application/pdf']),
  ('materiali', 'materiali', false, 26214400, array['application/pdf', 'image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'text/plain'])
on conflict (id) do nothing;

-- fatture: finance tutto; il cliente legge la cartella col proprio id.
create policy "storage fatture: finance legge" on storage.objects for select to authenticated
  using (bucket_id = 'fatture' and ((select private.es_finance()) or (storage.foldername(name))[1] = (select auth.uid())::text));
create policy "storage fatture: finance carica" on storage.objects for insert to authenticated
  with check (bucket_id = 'fatture' and (select private.es_finance()));
create policy "storage fatture: finance aggiorna" on storage.objects for update to authenticated
  using (bucket_id = 'fatture' and (select private.es_finance()))
  with check (bucket_id = 'fatture' and (select private.es_finance()));
create policy "storage fatture: finance elimina" on storage.objects for delete to authenticated
  using (bucket_id = 'fatture' and (select private.es_finance()));

-- f24 e ricevute: solo finance.
create policy "storage f24: finance legge" on storage.objects for select to authenticated
  using (bucket_id = 'f24' and (select private.es_finance()));
create policy "storage f24: finance carica" on storage.objects for insert to authenticated
  with check (bucket_id = 'f24' and (select private.es_finance()));
create policy "storage f24: finance elimina" on storage.objects for delete to authenticated
  using (bucket_id = 'f24' and (select private.es_finance()));

create policy "storage ricevute: finance legge" on storage.objects for select to authenticated
  using (bucket_id = 'ricevute' and (select private.es_finance()));
create policy "storage ricevute: finance carica" on storage.objects for insert to authenticated
  with check (bucket_id = 'ricevute' and (select private.es_finance()));
create policy "storage ricevute: finance elimina" on storage.objects for delete to authenticated
  using (bucket_id = 'ricevute' and (select private.es_finance()));

-- materiali: il cliente scrive/legge nella propria cartella; il team legge tutto.
create policy "storage materiali: lettura propria o team" on storage.objects for select to authenticated
  using (bucket_id = 'materiali' and ((storage.foldername(name))[1] = (select auth.uid())::text or (select private.es_team())));
create policy "storage materiali: cliente carica nella sua cartella" on storage.objects for insert to authenticated
  with check (bucket_id = 'materiali' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "storage materiali: cliente elimina nella sua cartella" on storage.objects for delete to authenticated
  using (bucket_id = 'materiali' and (storage.foldername(name))[1] = (select auth.uid())::text);

-- ---------------------------------------------------------------------------
-- Vista lista clienti: una riga per cliente con stato derivato dei compiti.
-- security_invoker: rispetta la RLS di chi legge.
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
  (select coalesce(array_agg(t.label order by t.label), '{}')
     from public.clienti_tags ct join public.tags t on t.id = ct.tag_id
    where ct.cliente_id = c.id) as tag_labels
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

-- ---------------------------------------------------------------------------
-- Vista serie finanziarie mensili (Finance): incassato, da incassare, spese.
-- ---------------------------------------------------------------------------
create or replace view public.vista_finanza_mensile
with (security_invoker = true) as
with mesi as (
  select date_trunc('month', d)::date as mese
  from generate_series(date_trunc('month', current_date) - interval '11 months', date_trunc('month', current_date), interval '1 month') d
)
select
  m.mese,
  coalesce((select sum(f.importo) from public.fatture f where f.pagata and f.pagata_il >= m.mese and f.pagata_il < m.mese + interval '1 month'), 0)::numeric(12,2) as incassato,
  coalesce((select sum(f.importo) from public.fatture f where f.emessa_il >= m.mese and f.emessa_il < m.mese + interval '1 month'), 0)::numeric(12,2) as fatturato,
  coalesce((select sum(s.importo) from public.spese s where s.tipo = 'variabile' and s.data >= m.mese and s.data < m.mese + interval '1 month'), 0)::numeric(12,2) as spese_variabili,
  coalesce((select sum(s.importo) from public.spese s where s.tipo = 'fissa' and s.attiva and s.data < m.mese + interval '1 month'), 0)::numeric(12,2) as spese_fisse,
  coalesce((select sum(x.importo) from public.f24 x where x.scadenza >= m.mese and x.scadenza < m.mese + interval '1 month'), 0)::numeric(12,2) as f24
from mesi m
order by m.mese;

-- Le viste in public sono esposte via API: solo authenticated, RLS delle tabelle sottostanti.
revoke all on public.vista_clienti from anon;
revoke all on public.vista_finanza_mensile from anon;
grant select on public.vista_clienti to authenticated;
grant select on public.vista_finanza_mensile to authenticated;
