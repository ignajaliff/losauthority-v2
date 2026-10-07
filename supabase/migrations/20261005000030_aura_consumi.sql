-- Consumo di token delle chiamate ad Anthropic (05/10/2026).
-- Una riga per chiamata, scritta solo dalle Edge Function (service role) tramite
-- _shared/consumi.ts. Serve a misurare quanto costa ogni agente e ogni cliente e
-- a verificare che il prompt caching funzioni (cache_lettura_tokens > 0 dal
-- secondo turno in poi). Non è un log applicativo: è una tabella da interrogare.

create table public.aura_consumi (
  id                      bigint generated always as identity primary key,
  funzione                text not null check (length(funzione) between 1 and 60),
  user_id                 uuid references public.user_roles (id) on delete set null,
  modello                 text not null check (length(modello) between 1 and 80),
  input_tokens            integer not null default 0 check (input_tokens >= 0),
  cache_lettura_tokens    integer not null default 0 check (cache_lettura_tokens >= 0),
  cache_scrittura_tokens  integer not null default 0 check (cache_scrittura_tokens >= 0),
  output_tokens           integer not null default 0 check (output_tokens >= 0),
  created_at              timestamptz not null default now()
);
comment on table public.aura_consumi is 'Token di ogni chiamata ad Anthropic: input a prezzo pieno, letti/scritti in cache, output. Scrive solo la Edge Function.';

create index aura_consumi_created_idx on public.aura_consumi (created_at desc);
create index aura_consumi_user_idx on public.aura_consumi (user_id, created_at desc);

alter table public.aura_consumi enable row level security;
-- Solo il team legge; nessuna policy di scrittura: inserisce il service role.
create policy "aura_consumi: team legge" on public.aura_consumi
  for select to authenticated using ((select private.es_team()));
