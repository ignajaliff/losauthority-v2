-- ============================================================================
-- 0039 · Crea idee → Ricerca TikTok top video (07/10/2026)
--
-- Documento di Wesley «Ricerca TikTok top video — regole per l'agente IA».
-- Il cliente scrive un tema, Aura propone 1-4 keyword, la Edge Function
-- `ricerca-tiktok` lancia Apify (`clockworks/tiktok-scraper`), tiene i video
-- degli ultimi 6 mesi ordinati per like, li segnala e consegna la top.
-- Una ricerca ogni 15 giorni per cliente (lo controlla la funzione).
--   * `ricerche_tiktok`: una riga per ricerca (input, stato della run, esito);
--   * `ricerche_tiktok_video`: una riga per video consegnato, con i segnali
--     (senza didascalia, solo hashtag, sponsorizzato, fuori tema, da non replicare);
--   * `idee_messaggi.ricerca_id`: la ricerca agganciata a un messaggio di
--     Crea idee («Usa in Crea idee»), come `stile_id`.
-- Scrive solo la Edge Function (service role); il cliente legge ed elimina le
-- proprie, il team le legge.
-- ============================================================================

create table public.ricerche_tiktok (
  id              uuid primary key default gen_random_uuid(),
  cliente_id      uuid not null references public.clienti (id) on delete cascade,
  tema            text not null check (length(btrim(tema)) between 1 and 200),
  lingua_target   text not null default 'it' check (lingua_target ~ '^[a-z]{2}$'),
  lingue          text[] not null default '{it}' check (cardinality(lingue) between 1 and 2),
  metodo          text not null default 'keyword' check (metodo in ('keyword', 'hashtag')),
  -- le query lanciate (keyword o hashtag), 1-4 come vuole il documento
  keyword         text[] not null check (cardinality(keyword) between 1 and 4),
  quanti          smallint not null default 15 check (quanti between 5 and 30),
  stato           text not null default 'in_corso' check (stato in ('in_corso', 'elaborazione', 'pronta', 'errore')),
  errore          text check (errore is null or length(errore) <= 500),
  apify_run_id    text,
  -- esito
  soglia_dal      date,
  raccolti        integer check (raccolti is null or raccolti >= 0),
  recenti         integer check (recenti is null or recenti >= 0),
  avviso          text check (avviso is null or length(avviso) <= 300),
  osservazioni    text[] not null default '{}' check (cardinality(osservazioni) <= 3),
  modello         text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  completata_il   timestamptz
);
comment on table public.ricerche_tiktok is 'Ricerche TikTok top video del cliente (Crea idee). Scrive solo la Edge Function ricerca-tiktok; una ogni 15 giorni.';
create index ricerche_tiktok_cliente_idx on public.ricerche_tiktok (cliente_id, created_at desc);
create trigger set_updated_at before update on public.ricerche_tiktok
  for each row execute procedure extensions.moddatetime (updated_at);

create table public.ricerche_tiktok_video (
  id                uuid primary key default gen_random_uuid(),
  ricerca_id        uuid not null references public.ricerche_tiktok (id) on delete cascade,
  sezione           text not null check (sezione in ('top', 'lingua_target', 'fuori_soglia')),
  posizione         smallint not null check (posizione >= 1),
  query             text check (query is null or length(query) <= 200),
  autore            text check (autore is null or length(autore) <= 200),
  lingua            text check (lingua is null or length(lingua) <= 10),
  mi_piace          bigint check (mi_piace is null or mi_piace >= 0),
  visualizzazioni   bigint check (visualizzazioni is null or visualizzazioni >= 0),
  pubblicato_il     timestamptz,
  url               text not null check (url ~* '^https?://' and length(url) <= 500),
  didascalia        text check (didascalia is null or length(didascalia) <= 2200),
  di_cosa_parla     text check (di_cosa_parla is null or length(di_cosa_parla) <= 120),
  senza_didascalia  boolean not null default false,
  solo_hashtag      boolean not null default false,
  sponsorizzato     boolean not null default false,
  fuori_tema        boolean not null default false,
  da_non_replicare  boolean not null default false,
  created_at        timestamptz not null default now(),
  unique (ricerca_id, sezione, posizione)
);
comment on table public.ricerche_tiktok_video is 'Un video consegnato da una ricerca TikTok: numeri da Apify, riga «di cosa parla» dalla didascalia, segnali (non filtri).';

-- Proprietario della ricerca (per la RLS dei video).
create function private.e_mia_ricerca(p_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.ricerche_tiktok r where r.id = p_id and r.cliente_id = (select auth.uid()));
$$;
revoke execute on function private.e_mia_ricerca(uuid) from public, anon;
grant execute on function private.e_mia_ricerca(uuid) to authenticated, service_role;

alter table public.ricerche_tiktok enable row level security;
alter table public.ricerche_tiktok_video enable row level security;

create policy "ricerche tiktok: lettura propria o team" on public.ricerche_tiktok for select to authenticated
  using (cliente_id = (select auth.uid()) or (select private.es_team()));
create policy "ricerche tiktok: elimina il proprietario" on public.ricerche_tiktok for delete to authenticated
  using (cliente_id = (select auth.uid()));
create policy "ricerche tiktok video: lettura propria o team" on public.ricerche_tiktok_video for select to authenticated
  using ((select private.e_mia_ricerca(ricerca_id)) or (select private.es_team()));
-- Nessuna policy di insert/update: scrive la Edge Function (service role).
revoke all on public.ricerche_tiktok, public.ricerche_tiktok_video from anon;

-- Crea idee: la ricerca agganciata a un messaggio del cliente («Usa in Crea idee»).
alter table public.idee_messaggi add column ricerca_id uuid references public.ricerche_tiktok (id) on delete set null;
create index idee_messaggi_ricerca_idx on public.idee_messaggi (ricerca_id) where ricerca_id is not null;
comment on column public.idee_messaggi.ricerca_id is 'Ricerca TikTok usata come riferimento in questo messaggio (Usa in Crea idee).';
