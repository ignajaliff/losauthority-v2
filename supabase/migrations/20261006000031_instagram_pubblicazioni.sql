-- ============================================================================
-- 0031 · Pubblicazioni da Instagram (06/10/2026)
--
-- Le carte di Pubblicazioni non nascono più a mano né dal Workflow: la Edge
-- Function `instagram-sync` legge il profilo Instagram del cliente
-- (`clienti.instagram`, impostato dall'onboarding o dal cliente una volta sola)
-- con Apify, crea una carta per ognuno degli ultimi video e registra i numeri.
-- Ogni 15 giorni aggiorna i numeri dei video noti (scraping per URL del post,
-- non del profilo); ogni 30 giorni rilegge il profilo per i video nuovi.
-- Le rilevazioni manuali restano possibili e convivono con quelle automatiche.
-- ============================================================================

-- Pubblicazioni: da dove viene la carta e il legame con il post Instagram.
alter table public.pubblicazioni
  add column origine         text not null default 'manuale'
                             check (origine in ('manuale', 'workflow', 'instagram')),
  add column url             text check (url is null or (length(url) <= 500 and url ~* '^https?://')),
  add column codice_esterno  text check (codice_esterno is null or length(codice_esterno) between 1 and 80),
  add column sincronizzata_il timestamptz;
comment on column public.pubblicazioni.origine is 'manuale (carta scritta a mano), workflow (nata dal Workflow, non più dal 06/10/2026), instagram (creata da instagram-sync).';
comment on column public.pubblicazioni.url is 'Link al post su Instagram: con questo si aggiornano i numeri senza rileggere il profilo.';
comment on column public.pubblicazioni.codice_esterno is 'shortCode del post Instagram: identifica il video tra una sincronizzazione e l''altra.';
comment on column public.pubblicazioni.sincronizzata_il is 'Ultima volta che instagram-sync ha registrato i numeri di questa carta.';

update public.pubblicazioni set origine = 'workflow' where contenuto_id is not null;

create unique index pubblicazioni_codice_esterno_idx
  on public.pubblicazioni (cliente_id, codice_esterno) where codice_esterno is not null;

-- Rilevazioni: automatiche (instagram, creato_da null) o manuali.
alter table public.pubblicazioni_metriche
  add column origine text not null default 'manuale' check (origine in ('manuale', 'instagram'));
comment on column public.pubblicazioni_metriche.origine is 'manuale = inserita dal cliente o dal team; instagram = letta da instagram-sync.';

-- Le colonne di sincronizzazione le scrive solo la funzione (service role):
-- dal browser (auth.uid() valorizzato) una carta nasce sempre 'manuale' e
-- url/codice/origine/sincronizzata_il non si toccano.
create or replace function private.pubblicazioni_colonne_sync()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if auth.uid() is null then
    return new;
  end if;
  if tg_op = 'INSERT' then
    if new.origine <> 'manuale' or new.url is not null or new.codice_esterno is not null or new.sincronizzata_il is not null then
      raise exception 'Le carte Instagram le crea la sincronizzazione automatica.' using errcode = '42501';
    end if;
  elsif new.origine is distinct from old.origine
     or new.url is distinct from old.url
     or new.codice_esterno is distinct from old.codice_esterno
     or new.sincronizzata_il is distinct from old.sincronizzata_il then
    raise exception 'Le colonne di sincronizzazione non si modificano a mano.' using errcode = '42501';
  end if;
  return new;
end;
$$;
revoke execute on function private.pubblicazioni_colonne_sync() from public, anon, authenticated;
create trigger pubblicazioni_colonne_sync before insert or update on public.pubblicazioni
  for each row execute function private.pubblicazioni_colonne_sync();

create or replace function private.metriche_origine_manuale()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if auth.uid() is not null and new.origine <> 'manuale' then
    raise exception 'Le rilevazioni Instagram le registra la sincronizzazione automatica.' using errcode = '42501';
  end if;
  return new;
end;
$$;
revoke execute on function private.metriche_origine_manuale() from public, anon, authenticated;
create trigger metriche_origine_manuale before insert or update on public.pubblicazioni_metriche
  for each row execute function private.metriche_origine_manuale();

-- Cliente: stato della sincronizzazione del profilo (il link è già in clienti.instagram).
alter table public.clienti
  add column instagram_sync_il     timestamptz,
  add column instagram_sync_errore text check (instagram_sync_errore is null or length(instagram_sync_errore) <= 500);
comment on column public.clienti.instagram_sync_il is 'Ultima lettura del profilo Instagram da parte di instagram-sync (si ripete ogni 30 giorni).';
comment on column public.clienti.instagram_sync_errore is 'Motivo dell''ultimo fallimento di instagram-sync, null se l''ultima lettura è andata bene.';

-- Il Workflow non crea più carte: la funzione del trigger diventa un no-op
-- (il trigger e la funzione si eliminano a mano, vedi la pulizia in CLAUDE.md).
create or replace function private.contenuti_sincronizza_pubblicazione()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  -- Dal 06/10/2026 le pubblicazioni arrivano da Instagram (instagram-sync).
  return new;
end;
$$;

-- Stato dell'ultimo giro automatico in sync_stati (chiave 'instagram').
alter table public.sync_stati drop constraint sync_stati_chiave_check;
alter table public.sync_stati add constraint sync_stati_chiave_check
  check (chiave in ('skool', 'notion_compiti', 'fathom', 'genera_hub', 'instagram'));

-- Job giornaliero: 05:00 UTC, prima del genera-hub.
select cron.schedule('instagram-sync', '0 5 * * *', $$select private.chiama_edge_function('instagram-sync')$$);
