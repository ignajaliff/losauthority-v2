-- ============================================================================
-- 20260929000017 · "Wesley Coach" (area cliente)
--
-- Una sola tabella: coach_messaggi. È la conversazione continua del cliente
-- con Aura nel ruolo di coach: il cliente racconta dove è bloccato, Aura cerca
-- nel catalogo Skool (`lezioni`, colonna keywords + descrizione) la lezione che
-- serve, risponde con un'indicazione e manda alla classe su Skool.
--
-- Come in idee_messaggi, la riga di Aura nasce 'in_corso' e finisce 'completato'
-- o 'errore' (con il motivo): così si sa sempre se ha risposto e si riprova.
-- `lezioni_ids` = le lezioni consigliate in quella risposta (uuid[], lista di
-- riferimenti come clienti.tags: il frontend le legge da `lezioni`).
-- Scrive solo la Edge Function aura-coach (service role); il cliente legge.
--
-- I clienti devono poter leggere le lezioni consigliate: nuova policy di select
-- sulle lezioni attive (sono le classi Skool a cui sono già iscritti).
-- ============================================================================

create table public.coach_messaggi (
  id           uuid primary key default gen_random_uuid(),
  cliente_id   uuid not null references public.clienti (id) on delete cascade,
  ruolo        text not null check (ruolo in ('cliente', 'aura')),
  contenuto    text not null default '' check (length(contenuto) <= 20000),
  -- cliente: sempre 'completato'. aura: in_corso → completato | errore
  stato        text not null default 'completato' check (stato in ('in_corso', 'completato', 'errore')),
  errore       text check (errore is null or length(errore) <= 500),
  modello      text,
  lezioni_ids  uuid[] not null default '{}' check (cardinality(lezioni_ids) <= 5),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
comment on table public.coach_messaggi is 'Wesley Coach: conversazione del cliente con Aura che consiglia le lezioni Skool. La riga di Aura traccia se e come ha risposto.';

create index coach_messaggi_cliente_idx on public.coach_messaggi (cliente_id, created_at);

create trigger set_updated_at before update on public.coach_messaggi
  for each row execute procedure extensions.moddatetime (updated_at);

alter table public.coach_messaggi enable row level security;
create policy "coach: lettura propria o team" on public.coach_messaggi for select to authenticated
  using (cliente_id = (select auth.uid()) or (select private.es_team()));
-- Scrive solo la Edge Function (service role): nessuna policy di insert/update/delete per authenticated.
revoke all on public.coach_messaggi from anon;

-- Le lezioni attive sono leggibili da ogni utente loggato (il team le leggeva già tutte).
create policy "lezioni: utenti leggono le attive" on public.lezioni for select to authenticated
  using (attiva);
