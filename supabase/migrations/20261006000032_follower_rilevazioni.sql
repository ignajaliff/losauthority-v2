-- ============================================================================
-- 0032 · Follower nel tempo (06/10/2026)
--
-- Ogni lettura del profilo Instagram (`instagram-sync`: la prima appena
-- collegato, poi ogni 30 giorni, più «Rileggi il profilo» / «Aggiorna adesso»)
-- registra anche i follower del profilo: una riga per lettura, come le
-- rilevazioni dei video. Servono al grafico di crescita di Pubblicazioni
-- (visualizzazioni, follower e, più avanti, lead degli ultimi mesi).
-- Scrive solo la Edge Function (service role); il cliente legge le proprie.
-- ============================================================================

create table public.follower_rilevazioni (
  id           uuid primary key default gen_random_uuid(),
  cliente_id   uuid not null references public.clienti (id) on delete cascade,
  piattaforma  text not null default 'instagram' check (piattaforma in ('instagram', 'tiktok')),
  rilevata_il  timestamptz not null default now(),
  follower     integer not null check (follower >= 0),
  seguiti      integer check (seguiti is null or seguiti >= 0),
  post_totali  integer check (post_totali is null or post_totali >= 0),
  origine      text not null default 'instagram' check (origine in ('instagram', 'manuale')),
  created_at   timestamptz not null default now()
);
comment on table public.follower_rilevazioni is 'Follower del profilo nel tempo, una riga per lettura (instagram-sync ogni 30 giorni). Scrive solo la Edge Function.';
comment on column public.follower_rilevazioni.seguiti is 'Profili che il cliente segue, al momento della lettura.';
comment on column public.follower_rilevazioni.post_totali is 'Post pubblicati in tutto sul profilo, al momento della lettura.';

create index follower_rilevazioni_cliente_idx on public.follower_rilevazioni (cliente_id, piattaforma, rilevata_il desc);

alter table public.follower_rilevazioni enable row level security;
create policy "follower: lettura propria o team" on public.follower_rilevazioni for select to authenticated
  using (cliente_id = (select auth.uid()) or (select private.es_team()));
-- Nessuna policy di scrittura: inserisce il service role (instagram-sync).
revoke all on public.follower_rilevazioni from anon;
