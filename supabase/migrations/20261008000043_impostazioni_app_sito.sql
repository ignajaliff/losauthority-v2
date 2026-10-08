-- ============================================================================
-- 0043 · Dominio del gestionale automatico per i link delle notifiche (08/10/2026)
--
-- Prima i link nei messaggi Telegram del team (onboarding completato, contratto
-- firmato, promemoria fatture/F24, chiamate Fathom da assegnare) usavano il
-- secret SITE_URL delle Edge Functions, da cambiare a mano a ogni dominio nuovo.
-- Ora il dominio lo registra il browser del TEAM quando apre il gestionale
-- (window.location.origin, esclusi localhost e le preview): le funzioni lo
-- leggono da qui. Non si prende l'Origin delle richieste perché
-- `contratto-pubblico` è pubblica e chiunque potrebbe inventarlo.
--   * `impostazioni_app`: una sola riga (id = true), `sito_url` = origin
--     (schema + host [+ porta], senza percorso), `sito_aggiornato_il`;
--   * `registra_sito(p_url)`: SECURITY INVOKER, scrive solo se cambia; la RLS
--     lascia scrivere solo il team (un cliente aggiorna 0 righe, senza errore).
-- ============================================================================

create table public.impostazioni_app (
  id                  boolean primary key default true check (id),
  sito_url            text check (sito_url is null or (sito_url ~ '^https?://[a-z0-9.-]+(:[0-9]{1,5})?$' and length(sito_url) <= 200)),
  sito_aggiornato_il  timestamptz,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);
comment on table public.impostazioni_app is 'Impostazioni globali del gestionale (una riga). sito_url = dominio da cui il team usa il gestionale, per i link delle notifiche: lo registra il browser del team.';
create trigger set_updated_at before update on public.impostazioni_app
  for each row execute procedure extensions.moddatetime (updated_at);

insert into public.impostazioni_app (id) values (true);

alter table public.impostazioni_app enable row level security;
create policy "impostazioni app: lettura team" on public.impostazioni_app for select to authenticated
  using ((select private.es_team()));
create policy "impostazioni app: aggiorna il team" on public.impostazioni_app for update to authenticated
  using ((select private.es_team()))
  with check ((select private.es_team()) and id);
-- Nessuna policy di insert/delete: la riga è una sola e nasce qui.
revoke all on public.impostazioni_app from anon;

-- Il browser del team chiama questa funzione all'apertura del gestionale. Invoker: vale la RLS.
create function public.registra_sito(p_url text)
returns void
language sql
security invoker
set search_path = ''
as $$
  update public.impostazioni_app
     set sito_url = p_url, sito_aggiornato_il = now()
   where id and sito_url is distinct from p_url;
$$;
revoke execute on function public.registra_sito(text) from public, anon;
grant execute on function public.registra_sito(text) to authenticated;
