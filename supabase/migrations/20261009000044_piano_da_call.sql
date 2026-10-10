-- ============================================================================
-- 0044 · Piano d'azione scritto da Aura dalla prima call (09/10/2026)
--
-- Decisione dell'utente: con Upscale c'è UNA sola call (quella iniziale dopo
-- l'onboarding) e il piano d'azione del cliente lo scrive Aura in automatico
-- dalla registrazione Fathom, direttamente in `compiti` (tappe + sotto-compiti),
-- senza Notion e senza bottone. Nel database:
--   * `chiamate.piano_stato`: la coda. Appena una call ha un cliente E un
--     riassunto (webhook, cron fathom-autoassign, assegnazione a mano,
--     «Scarica riassunto») il trigger la mette `da_generare` e chiama subito la
--     Edge Function `aura-compiti`, che la porta a `in_corso` → `pronto` |
--     `errore` | `saltato` (il cliente ha già un piano di Aura: non si pesta).
--     Un cron ogni 10 minuti riprende ciò che resta in coda o fermo.
--   * `chiamate.trascrizione`: il testo integrale della call letto dall'API
--     Fathom (quando c'è, Aura legge quello e non solo il riassunto).
--   * `compiti.origine` (team | aura | cliente) e `compiti.chiamata_id`: da
--     dove viene ogni compito; «Rigenera» sostituisce solo quelli di Aura.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1) chiamate: trascrizione e stato del piano
-- ---------------------------------------------------------------------------
alter table public.chiamate
  add column trascrizione        text check (trascrizione is null or length(trascrizione) <= 400000),
  add column piano_stato         text check (piano_stato in ('da_generare', 'in_corso', 'pronto', 'errore', 'saltato')),
  add column piano_errore        text check (piano_errore is null or length(piano_errore) <= 500),
  add column piano_avviato_il    timestamptz,
  add column piano_generato_il   timestamptz;

comment on column public.chiamate.trascrizione is 'Trascrizione integrale della call (API Fathom), letta da Aura per il piano d''azione.';
comment on column public.chiamate.piano_stato is 'Piano d''azione di Aura da questa call: da_generare (in coda) → in_corso → pronto | errore | saltato (il cliente ha già un piano). null = la call non ha ancora cliente o riassunto.';
comment on column public.chiamate.piano_errore is 'Motivo dell''ultimo errore o del salto (lo vede il team nella scheda).';
comment on column public.chiamate.piano_avviato_il is 'Quando Aura ha iniziato a scrivere (per riprendere le elaborazioni ferme).';
comment on column public.chiamate.piano_generato_il is 'Quando il piano è stato scritto in compiti.';

create index chiamate_piano_coda_idx on public.chiamate (piano_avviato_il)
  where piano_stato in ('da_generare', 'in_corso');

-- ---------------------------------------------------------------------------
-- 2) compiti: origine e call di provenienza
-- ---------------------------------------------------------------------------
alter table public.compiti
  add column origine     text not null default 'team' check (origine in ('team', 'aura', 'cliente')),
  add column chiamata_id uuid references public.chiamate (id) on delete set null;

comment on column public.compiti.origine is 'Chi ha scritto il compito: team (gestionale), aura (piano dalla call), cliente (area cliente).';
comment on column public.compiti.chiamata_id is 'Call da cui Aura ha scritto il compito (null per i compiti del team).';

create index compiti_chiamata_idx on public.compiti (chiamata_id) where chiamata_id is not null;

-- Il cliente continua a poter cambiare SOLO lo stato: anche origine e chiamata_id sono protette.
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
       or new.chiamata_id is distinct from old.chiamata_id then
      raise exception 'Il cliente può solo spuntare i compiti';
    end if;
  end if;
  return new;
end;
$$;

-- Dal gestionale il team inserisce solo compiti propri: quelli di Aura nascono dalla Edge Function (service role).
alter policy "compiti: team inserisce" on public.compiti
  with check ((select private.es_team()) and creato_da = (select auth.uid()) and origine = 'team' and chiamata_id is null);

-- ---------------------------------------------------------------------------
-- 3) La coda: una call con cliente e riassunto va in `da_generare` (una volta
--    sola: se il piano è già stato scritto o saltato, lo stato non si tocca;
--    «Rigenera» lo rimette in coda dalla Edge Function).
-- ---------------------------------------------------------------------------
create or replace function private.chiamate_piano_in_coda()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.cliente_id is not null and new.riassunto is not null and new.piano_stato is null then
    new.piano_stato := 'da_generare';
    new.piano_errore := null;
  end if;
  return new;
end;
$$;
revoke execute on function private.chiamate_piano_in_coda() from public, anon, authenticated;

create trigger chiamate_piano_in_coda before insert or update of cliente_id, riassunto, piano_stato on public.chiamate
  for each row execute function private.chiamate_piano_in_coda();

-- Appena una call entra in coda, la Edge Function parte (pg_net manda la richiesta
-- dopo il commit, quindi la funzione vede la riga). Senza aspettare il cron.
create or replace function private.chiamate_piano_avvia()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.piano_stato = 'da_generare' and (tg_op = 'INSERT' or old.piano_stato is distinct from 'da_generare') then
    perform private.chiama_edge_function('aura-compiti');
  end if;
  return null;
end;
$$;
revoke execute on function private.chiamate_piano_avvia() from public, anon, authenticated;

create trigger chiamate_piano_avvia after insert or update of piano_stato on public.chiamate
  for each row execute function private.chiamate_piano_avvia();

-- Rete di sicurezza: riprende le call in coda o ferme (funzione caduta, Fathom lento).
select cron.schedule('aura-compiti', '*/10 * * * *', $$select private.chiama_edge_function('aura-compiti')$$);
