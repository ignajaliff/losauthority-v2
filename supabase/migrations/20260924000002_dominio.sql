-- ============================================================================
-- 0002 · Tabelle di dominio: tag, note, analisi, questionari, chiamate,
--        hub Notion, lezioni, finanza, lead, osservabilità.
-- Niente JSON dove il dato è strutturato: solo log e payload esterni.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Tag riutilizzabili + tabella ponte (niente array sul cliente).
-- ---------------------------------------------------------------------------
create table public.tags (
  id          uuid primary key default gen_random_uuid(),
  label       text not null unique check (length(label) between 1 and 60),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create trigger set_updated_at before update on public.tags
  for each row execute procedure extensions.moddatetime (updated_at);
alter table public.tags enable row level security;
create policy "tags: team legge" on public.tags for select to authenticated using ((select private.es_team()));
create policy "tags: team inserisce" on public.tags for insert to authenticated with check ((select private.es_team()));
create policy "tags: team aggiorna" on public.tags for update to authenticated using ((select private.es_team())) with check ((select private.es_team()));
create policy "tags: team elimina" on public.tags for delete to authenticated using ((select private.es_team()));

create table public.clienti_tags (
  cliente_id  uuid not null references public.clienti (id) on delete cascade,
  tag_id      uuid not null references public.tags (id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (cliente_id, tag_id)
);
create index clienti_tags_tag_id_idx on public.clienti_tags (tag_id);
alter table public.clienti_tags enable row level security;
create policy "clienti_tags: team legge" on public.clienti_tags for select to authenticated using ((select private.es_team()));
create policy "clienti_tags: team inserisce" on public.clienti_tags for insert to authenticated with check ((select private.es_team()));
create policy "clienti_tags: team elimina" on public.clienti_tags for delete to authenticated using ((select private.es_team()));

-- ---------------------------------------------------------------------------
-- Note interne del team sul cliente.
-- ---------------------------------------------------------------------------
create table public.note_clienti (
  id          uuid primary key default gen_random_uuid(),
  cliente_id  uuid not null references public.clienti (id) on delete cascade,
  autore_id   uuid references public.user_roles (id) on delete set null,
  testo       text not null check (length(testo) between 1 and 5000),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index note_clienti_cliente_idx on public.note_clienti (cliente_id, created_at desc);
create trigger set_updated_at before update on public.note_clienti
  for each row execute procedure extensions.moddatetime (updated_at);
alter table public.note_clienti enable row level security;
create policy "note: team legge" on public.note_clienti for select to authenticated using ((select private.es_team()));
create policy "note: team inserisce" on public.note_clienti for insert to authenticated
  with check ((select private.es_team()) and autore_id = (select auth.uid()));
create policy "note: team elimina" on public.note_clienti for delete to authenticated using ((select private.es_team()));

-- ---------------------------------------------------------------------------
-- Analisi strategica di Aura (markdown), una per cliente.
-- ---------------------------------------------------------------------------
create table public.analisi (
  cliente_id   uuid primary key references public.clienti (id) on delete cascade,
  contenuto    text not null,
  generato_il  timestamptz not null default now(),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create trigger set_updated_at before update on public.analisi
  for each row execute procedure extensions.moddatetime (updated_at);
alter table public.analisi enable row level security;
create policy "analisi: team legge" on public.analisi for select to authenticated using ((select private.es_team()));
-- Scrittura solo via service_role (Edge Function aura-analisi).

-- ---------------------------------------------------------------------------
-- Questionari: un invio per (cliente, questionario); le risposte sono righe.
-- stato = bozza finché il cliente non invia. Multi-valore = più righe (ordine).
-- ---------------------------------------------------------------------------
create table public.questionario_invii (
  id               uuid primary key default gen_random_uuid(),
  cliente_id       uuid not null references public.clienti (id) on delete cascade,
  questionario_id  text not null check (questionario_id in ('onboarding', 'avatar_dolori', 'offerta')),
  stato            text not null default 'bozza' check (stato in ('bozza', 'inviato')),
  schermata        text,
  sezione_indice   integer check (sezione_indice is null or sezione_indice >= 0),
  inviato_il       timestamptz,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  unique (cliente_id, questionario_id)
);
create trigger set_updated_at before update on public.questionario_invii
  for each row execute procedure extensions.moddatetime (updated_at);
alter table public.questionario_invii enable row level security;
create policy "invii: lettura propria o team" on public.questionario_invii for select to authenticated
  using (cliente_id = (select auth.uid()) or (select private.es_team()));
create policy "invii: cliente crea il proprio" on public.questionario_invii for insert to authenticated
  with check (cliente_id = (select auth.uid()));
create policy "invii: cliente aggiorna la bozza" on public.questionario_invii for update to authenticated
  using (cliente_id = (select auth.uid()) and stato = 'bozza')
  with check (cliente_id = (select auth.uid()));

create table public.questionario_risposte (
  id          uuid primary key default gen_random_uuid(),
  invio_id    uuid not null references public.questionario_invii (id) on delete cascade,
  domanda_id  text not null check (length(domanda_id) between 1 and 80),
  ordine      smallint not null default 0 check (ordine >= 0),
  valore      text not null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (invio_id, domanda_id, ordine)
);
create trigger set_updated_at before update on public.questionario_risposte
  for each row execute procedure extensions.moddatetime (updated_at);
alter table public.questionario_risposte enable row level security;

create or replace function private.invio_e_mio_in_bozza(p_invio uuid)
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.questionario_invii i
    where i.id = p_invio and i.cliente_id = (select auth.uid()) and i.stato = 'bozza'
  );
$$;
create or replace function private.invio_e_mio(p_invio uuid)
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.questionario_invii i
    where i.id = p_invio and i.cliente_id = (select auth.uid())
  );
$$;
revoke execute on function private.invio_e_mio_in_bozza(uuid) from public, anon;
revoke execute on function private.invio_e_mio(uuid) from public, anon;
grant execute on function private.invio_e_mio_in_bozza(uuid) to authenticated, service_role;
grant execute on function private.invio_e_mio(uuid) to authenticated, service_role;

create policy "risposte: lettura propria o team" on public.questionario_risposte for select to authenticated
  using ((select private.invio_e_mio(invio_id)) or (select private.es_team()));
create policy "risposte: cliente inserisce in bozza" on public.questionario_risposte for insert to authenticated
  with check ((select private.invio_e_mio_in_bozza(invio_id)));
create policy "risposte: cliente aggiorna in bozza" on public.questionario_risposte for update to authenticated
  using ((select private.invio_e_mio_in_bozza(invio_id)))
  with check ((select private.invio_e_mio_in_bozza(invio_id)));
create policy "risposte: cliente elimina in bozza" on public.questionario_risposte for delete to authenticated
  using ((select private.invio_e_mio_in_bozza(invio_id)));

create table public.questionario_allegati (
  id            uuid primary key default gen_random_uuid(),
  invio_id      uuid not null references public.questionario_invii (id) on delete cascade,
  domanda_id    text not null,
  nome          text not null,
  dimensione    bigint not null check (dimensione >= 0),
  storage_path  text not null unique,
  created_at    timestamptz not null default now()
);
create index questionario_allegati_invio_idx on public.questionario_allegati (invio_id);
alter table public.questionario_allegati enable row level security;
create policy "allegati: lettura propria o team" on public.questionario_allegati for select to authenticated
  using ((select private.invio_e_mio(invio_id)) or (select private.es_team()));
create policy "allegati: cliente inserisce in bozza" on public.questionario_allegati for insert to authenticated
  with check ((select private.invio_e_mio_in_bozza(invio_id)));
create policy "allegati: cliente elimina in bozza" on public.questionario_allegati for delete to authenticated
  using ((select private.invio_e_mio_in_bozza(invio_id)));

-- ---------------------------------------------------------------------------
-- Chiamate Fathom + action items come righe.
-- ---------------------------------------------------------------------------
create table public.chiamate (
  id                    uuid primary key default gen_random_uuid(),
  cliente_id            uuid references public.clienti (id) on delete cascade,
  fathom_recording_id   text unique,
  titolo                text,
  registrata_il         timestamptz,
  share_url             text,
  riassunto             text,
  riassunto_originale   text,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);
create index chiamate_cliente_idx on public.chiamate (cliente_id, registrata_il desc);
create index chiamate_non_assegnate_idx on public.chiamate (registrata_il desc) where cliente_id is null;
create trigger set_updated_at before update on public.chiamate
  for each row execute procedure extensions.moddatetime (updated_at);
alter table public.chiamate enable row level security;
create policy "chiamate: lettura propria o team" on public.chiamate for select to authenticated
  using (cliente_id = (select auth.uid()) or (select private.es_team()));
create policy "chiamate: team inserisce" on public.chiamate for insert to authenticated with check ((select private.es_team()));
create policy "chiamate: team aggiorna" on public.chiamate for update to authenticated
  using ((select private.es_team())) with check ((select private.es_team()));
create policy "chiamate: team elimina" on public.chiamate for delete to authenticated using ((select private.es_team()));

create table public.chiamate_azioni (
  id           uuid primary key default gen_random_uuid(),
  chiamata_id  uuid not null references public.chiamate (id) on delete cascade,
  testo        text not null,
  ordine       smallint not null default 0 check (ordine >= 0),
  completata   boolean not null default false,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index chiamate_azioni_chiamata_idx on public.chiamate_azioni (chiamata_id, ordine);
create trigger set_updated_at before update on public.chiamate_azioni
  for each row execute procedure extensions.moddatetime (updated_at);
alter table public.chiamate_azioni enable row level security;

create or replace function private.chiamata_e_mia(p_chiamata uuid)
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.chiamate c
    where c.id = p_chiamata and c.cliente_id = (select auth.uid())
  );
$$;
revoke execute on function private.chiamata_e_mia(uuid) from public, anon;
grant execute on function private.chiamata_e_mia(uuid) to authenticated, service_role;

create policy "azioni: lettura propria o team" on public.chiamate_azioni for select to authenticated
  using ((select private.chiamata_e_mia(chiamata_id)) or (select private.es_team()));
create policy "azioni: team inserisce" on public.chiamate_azioni for insert to authenticated with check ((select private.es_team()));
create policy "azioni: team aggiorna" on public.chiamate_azioni for update to authenticated
  using ((select private.es_team())) with check ((select private.es_team()));
create policy "azioni: team elimina" on public.chiamate_azioni for delete to authenticated using ((select private.es_team()));

-- Log grezzo dei webhook Fathom (diagnostica): qui il JSON è legittimo.
create table public.fathom_webhook_log (
  id             bigint generated always as identity primary key,
  received_at    timestamptz not null default now(),
  payload        jsonb,
  emails         text[],
  matched_email  text
);
create index fathom_webhook_log_received_idx on public.fathom_webhook_log (received_at desc);
alter table public.fathom_webhook_log enable row level security;
create policy "fathom_log: team legge" on public.fathom_webhook_log for select to authenticated using ((select private.es_team()));

-- ---------------------------------------------------------------------------
-- Fotografia dei compiti Notion: board per call (0 = to-do list hub) + compiti.
-- Scritte SOLO dalla sync (service_role). Lettura team e cliente proprio.
-- ---------------------------------------------------------------------------
create table public.hub_board (
  id            uuid primary key default gen_random_uuid(),
  cliente_id    uuid not null references public.clienti (id) on delete cascade,
  call_n        smallint not null check (call_n between 0 and 4),
  notion_db_id  text not null,
  synced_at     timestamptz not null default now(),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (cliente_id, call_n)
);
create trigger set_updated_at before update on public.hub_board
  for each row execute procedure extensions.moddatetime (updated_at);
alter table public.hub_board enable row level security;
create policy "hub_board: lettura propria o team" on public.hub_board for select to authenticated
  using (cliente_id = (select auth.uid()) or (select private.es_team()));

create table public.hub_compiti (
  id              uuid primary key default gen_random_uuid(),
  board_id        uuid not null references public.hub_board (id) on delete cascade,
  notion_page_id  text not null unique,
  titolo          text not null,
  stato           text not null default 'not_started' check (stato in ('not_started', 'in_progress', 'done')),
  assegnato_a     text not null default 'cliente' check (assegnato_a in ('wesley', 'cliente')),
  scadenza        date,
  link_utile      text,
  ordine          smallint not null default 0,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index hub_compiti_board_idx on public.hub_compiti (board_id, ordine);
create trigger set_updated_at before update on public.hub_compiti
  for each row execute procedure extensions.moddatetime (updated_at);
alter table public.hub_compiti enable row level security;

create or replace function private.board_e_mia(p_board uuid)
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.hub_board b
    where b.id = p_board and b.cliente_id = (select auth.uid())
  );
$$;
revoke execute on function private.board_e_mia(uuid) from public, anon;
grant execute on function private.board_e_mia(uuid) to authenticated, service_role;

create policy "hub_compiti: lettura propria o team" on public.hub_compiti for select to authenticated
  using ((select private.board_e_mia(board_id)) or (select private.es_team()));

-- ---------------------------------------------------------------------------
-- Catalogo lezioni Skool (scritto dalla sync mensile) + stato delle sync.
-- ---------------------------------------------------------------------------
create table public.lezioni (
  id                    uuid primary key default gen_random_uuid(),
  key                   text not null unique,
  corso                 text,
  titolo                text not null,
  url                   text,
  descrizione           text,
  keywords              text[] not null default '{}',
  ordine                integer,
  attiva                boolean not null default true,
  vista_la_prima_volta  timestamptz not null default now(),
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);
create index lezioni_corso_idx on public.lezioni (corso, ordine) where attiva;
create trigger set_updated_at before update on public.lezioni
  for each row execute procedure extensions.moddatetime (updated_at);
alter table public.lezioni enable row level security;
create policy "lezioni: team legge" on public.lezioni for select to authenticated using ((select private.es_team()));

create table public.sync_stati (
  chiave      text primary key check (chiave in ('skool', 'notion_compiti', 'fathom', 'genera_hub')),
  synced_at   timestamptz,
  esito       text check (esito is null or esito in ('ok', 'errore', 'parziale')),
  dettaglio   text,
  totale      integer not null default 0 check (totale >= 0),
  nuove       integer not null default 0 check (nuove >= 0),
  updated_at  timestamptz not null default now()
);
create trigger set_updated_at before update on public.sync_stati
  for each row execute procedure extensions.moddatetime (updated_at);
alter table public.sync_stati enable row level security;
create policy "sync_stati: team legge" on public.sync_stati for select to authenticated using ((select private.es_team()));

-- ---------------------------------------------------------------------------
-- Finanza: fatture (cliente), spese, F24. Solo chi vede i soldi.
-- ---------------------------------------------------------------------------
create table public.fatture (
  id                  uuid primary key default gen_random_uuid(),
  cliente_id          uuid not null references public.clienti (id) on delete cascade,
  descrizione         text,
  importo             numeric(12,2) not null default 0 check (importo >= 0),
  emessa_il           date not null default current_date,
  pagata              boolean not null default false,
  pagata_il           date,
  prossimo_pagamento  date,
  note                text,
  pdf_path            text,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);
create index fatture_cliente_idx on public.fatture (cliente_id, emessa_il desc);
create index fatture_scadenze_idx on public.fatture (prossimo_pagamento) where not pagata and prossimo_pagamento is not null;
create trigger set_updated_at before update on public.fatture
  for each row execute procedure extensions.moddatetime (updated_at);
alter table public.fatture enable row level security;
create policy "fatture: lettura propria o finance" on public.fatture for select to authenticated
  using (cliente_id = (select auth.uid()) or (select private.es_finance()));
create policy "fatture: finance inserisce" on public.fatture for insert to authenticated with check ((select private.es_finance()));
create policy "fatture: finance aggiorna" on public.fatture for update to authenticated
  using ((select private.es_finance())) with check ((select private.es_finance()));
create policy "fatture: finance elimina" on public.fatture for delete to authenticated using ((select private.es_finance()));

-- Riepilogo fatture per lo staff base: conteggi e scadenza, MAI importi.
create or replace function private.fatture_riepilogo(p_cliente uuid)
returns table (totali integer, da_pagare integer, prossima_scadenza date)
language sql stable security definer
set search_path = ''
as $$
  select
    count(*)::int,
    count(*) filter (where not f.pagata)::int,
    min(f.prossimo_pagamento) filter (where not f.pagata and f.prossimo_pagamento >= current_date)
  from public.fatture f
  where f.cliente_id = p_cliente
    and (select private.es_team());
$$;
revoke execute on function private.fatture_riepilogo(uuid) from public, anon;
grant execute on function private.fatture_riepilogo(uuid) to authenticated, service_role;

create table public.spese (
  id             uuid primary key default gen_random_uuid(),
  descrizione    text not null check (length(descrizione) between 1 and 200),
  importo        numeric(12,2) not null check (importo >= 0),
  tipo           text not null check (tipo in ('fissa', 'variabile')),
  data           date not null default current_date,
  attiva         boolean not null default true,
  ricevuta_path  text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create index spese_data_idx on public.spese (data desc);
create index spese_fisse_attive_idx on public.spese (tipo) where tipo = 'fissa' and attiva;
create trigger set_updated_at before update on public.spese
  for each row execute procedure extensions.moddatetime (updated_at);
alter table public.spese enable row level security;
create policy "spese: finance legge" on public.spese for select to authenticated using ((select private.es_finance()));
create policy "spese: finance inserisce" on public.spese for insert to authenticated with check ((select private.es_finance()));
create policy "spese: finance aggiorna" on public.spese for update to authenticated
  using ((select private.es_finance())) with check ((select private.es_finance()));
create policy "spese: finance elimina" on public.spese for delete to authenticated using ((select private.es_finance()));

create table public.f24 (
  id           uuid primary key default gen_random_uuid(),
  descrizione  text,
  importo      numeric(12,2) check (importo is null or importo >= 0),
  scadenza     date,
  pagato       boolean not null default false,
  pagato_il    date,
  pdf_path     text not null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index f24_scadenza_idx on public.f24 (scadenza) where not pagato and scadenza is not null;
create trigger set_updated_at before update on public.f24
  for each row execute procedure extensions.moddatetime (updated_at);
alter table public.f24 enable row level security;
create policy "f24: finance legge" on public.f24 for select to authenticated using ((select private.es_finance()));
create policy "f24: finance inserisce" on public.f24 for insert to authenticated with check ((select private.es_finance()));
create policy "f24: finance aggiorna" on public.f24 for update to authenticated
  using ((select private.es_finance())) with check ((select private.es_finance()));
create policy "f24: finance elimina" on public.f24 for delete to authenticated using ((select private.es_finance()));

-- ---------------------------------------------------------------------------
-- Lead (pipeline commerciale): entità separata dai clienti.
-- ---------------------------------------------------------------------------
create table public.lead (
  id                  uuid primary key default gen_random_uuid(),
  nome                text not null check (length(nome) between 1 and 120),
  contatto            text,
  fonte               text check (fonte is null or fonte in ('Instagram', 'TikTok', 'Referral', 'Landing', 'WhatsApp', 'Email', 'Evento', 'Altro')),
  stage               text not null default 'nuovo'
                      check (stage in ('nuovo', 'contattato', 'call_fissata', 'proposta', 'cliente', 'perso')),
  valore              numeric(12,2) not null default 0 check (valore >= 0),
  note                text,
  prossima_azione     text,
  prossima_azione_il  date,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);
create index lead_stage_idx on public.lead (stage, updated_at desc);
create trigger set_updated_at before update on public.lead
  for each row execute procedure extensions.moddatetime (updated_at);
alter table public.lead enable row level security;
create policy "lead: team legge" on public.lead for select to authenticated using ((select private.es_team()));
create policy "lead: team inserisce" on public.lead for insert to authenticated with check ((select private.es_team()));
create policy "lead: team aggiorna" on public.lead for update to authenticated
  using ((select private.es_team())) with check ((select private.es_team()));
create policy "lead: team elimina" on public.lead for delete to authenticated using ((select private.es_team()));

-- ---------------------------------------------------------------------------
-- Osservabilità: errori applicativi (scritti dalle Edge Function) e rate limit Aura.
-- ---------------------------------------------------------------------------
create table public.error_log (
  id          bigint generated always as identity primary key,
  created_at  timestamptz not null default now(),
  scope       text not null,
  message     text not null,
  context     jsonb
);
create index error_log_created_idx on public.error_log (created_at desc);
alter table public.error_log enable row level security;
create policy "error_log: team legge" on public.error_log for select to authenticated using ((select private.es_team()));

create table public.aura_usage (
  id          bigint generated always as identity primary key,
  user_id     uuid not null references public.user_roles (id) on delete cascade,
  created_at  timestamptz not null default now()
);
create index aura_usage_user_time_idx on public.aura_usage (user_id, created_at desc);
alter table public.aura_usage enable row level security;
create policy "aura_usage: lettura propria" on public.aura_usage for select to authenticated using (user_id = (select auth.uid()));

create or replace function private.aura_help_allowed(p_user uuid, p_max integer, p_window_secs integer)
returns boolean
language plpgsql security definer
set search_path = ''
as $$
declare cnt integer;
begin
  select count(*) into cnt
  from public.aura_usage
  where user_id = p_user and created_at > now() - make_interval(secs => p_window_secs);
  if cnt >= p_max then
    return false;
  end if;
  insert into public.aura_usage (user_id) values (p_user);
  return true;
end;
$$;
revoke execute on function private.aura_help_allowed(uuid, integer, integer) from public, anon, authenticated;
grant execute on function private.aura_help_allowed(uuid, integer, integer) to service_role;
