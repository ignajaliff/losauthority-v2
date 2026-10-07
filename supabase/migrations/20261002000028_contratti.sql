-- ============================================================================
-- 20261002000028 · Offerte e Contratti (porting del modulo della v1)
--
-- Wesley definisce le OFFERTE (nome, modello di contratto, prezzo), crea un
-- INVITO per contratto (link con token casuale) e lo manda al cliente, che dalla
-- pagina pubblica legge l'informativa, dice come acquista (privato / partita
-- IVA / società), inserisce i dati, legge il contratto composto DAL SERVER e lo
-- firma due volte (contratto + approvazione specifica delle clausole, artt.
-- 1341-1342 c.c.). Poi Wesley segna il pagamento (nasce l'account del cliente,
-- la sua scheda con da_attivare e la fattura incassata) e attiva il programma.
--
-- Regole che danno valore di prova al contratto (docs/modulo-contratos-handoff):
--   · alla firma si salva l'istantanea del testo (`documento`) e la sua impronta
--     SHA-256 (`testo_sha256`): un contratto firmato non cambia più;
--   · la firma è un cambio di stato condizionale (where stato = 'compilato');
--   · l'offerta si COPIA nell'invito: cambiarla dopo non tocca gli inviti;
--   · delle firme disegnate si tiene solo la forma (niente tempi né pressione);
--   · il PDF è riproducibile e archiviato nel bucket privato `contratti`;
--   · gli inviti mai firmati si cancellano dopo 90 giorni (lo promette
--     l'informativa privacy).
--
-- Eccezione documentata alla regola "niente JSON per dati strutturati":
-- `dati`, `documento`, `firma_*` sono ISTANTANEE immutabili (prova della firma),
-- non dati da interrogare: si salvano e si rileggono tali e quali, come un log.
--
-- Stati: inviato → compilato → firmato → pagato → attivo, più annullato.
-- Permessi: legge e aggiorna chi vede i soldi (admin, staff_fatture); crea ed
-- elimina inviti e offerte solo l'admin. La pagina pubblica passa dalla Edge
-- Function `contratto-pubblico` (service role, la chiave è il token).
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. Offerte: cosa si vende (nome + modello di contratto + prezzo)
-- ---------------------------------------------------------------------------
create table public.offerte (
  id          uuid primary key default gen_random_uuid(),
  nome        text not null check (length(nome) between 1 and 80),
  -- chiave di MODELLI_CONTRATTO (_shared/contratti/modelli.ts): oggi solo 'upscale'
  modello     text not null check (length(modello) between 1 and 40),
  prezzo      numeric(12,2) not null check (prezzo > 0),
  attiva      boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
comment on table public.offerte is 'Offerte in vendita: nome, modello di contratto e prezzo. Si scelgono creando un invito; l''invito ne copia i valori.';
create trigger set_updated_at before update on public.offerte
  for each row execute procedure extensions.moddatetime (updated_at);

alter table public.offerte enable row level security;
create policy "offerte: finance legge" on public.offerte for select to authenticated
  using ((select private.es_finance()));
create policy "offerte: admin inserisce" on public.offerte for insert to authenticated
  with check ((select private.tiene_rol('admin')));
create policy "offerte: admin aggiorna" on public.offerte for update to authenticated
  using ((select private.tiene_rol('admin'))) with check ((select private.tiene_rol('admin')));
create policy "offerte: admin elimina" on public.offerte for delete to authenticated
  using ((select private.tiene_rol('admin')));
revoke all on public.offerte from anon;

-- ---------------------------------------------------------------------------
-- 2. Impostazioni del modulo: una sola riga (firma di Wesley, telefono, istruzioni)
-- ---------------------------------------------------------------------------
create table public.contratti_impostazioni (
  id                    boolean primary key default true check (id),
  -- firma del Fornitore: { w, h, tratti: number[][], pieno?: true } (contorni pieni, da immagine)
  firma                 jsonb,
  firma_salvata_il      timestamptz,
  telefono_fornitore    text check (telefono_fornitore is null or length(telefono_fornitore) <= 30),
  istruzioni_pagamento  text check (istruzioni_pagamento is null or length(istruzioni_pagamento) <= 1500),
  updated_at            timestamptz not null default now()
);
comment on table public.contratti_impostazioni is 'Una riga sola: la firma di Wesley (va su ogni nuovo invito), il suo telefono nel contratto e il messaggio mostrato dopo la firma.';
insert into public.contratti_impostazioni (id) values (true);
create trigger set_updated_at before update on public.contratti_impostazioni
  for each row execute procedure extensions.moddatetime (updated_at);

alter table public.contratti_impostazioni enable row level security;
create policy "contratti impostazioni: finance legge" on public.contratti_impostazioni for select to authenticated
  using ((select private.es_finance()));
create policy "contratti impostazioni: admin aggiorna" on public.contratti_impostazioni for update to authenticated
  using ((select private.tiene_rol('admin'))) with check ((select private.tiene_rol('admin')));
-- La firma la salva solo la Edge Function (valida la forma del tratto); telefono e istruzioni si aggiornano dal gestionale.
revoke all on public.contratti_impostazioni from anon;

-- ---------------------------------------------------------------------------
-- 3. Contratti: un invito = una riga, che poi diventa il contratto firmato
-- ---------------------------------------------------------------------------
create table public.contratti (
  id                    uuid primary key default gen_random_uuid(),
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  creato_da             uuid references public.user_roles (id) on delete set null,
  -- il link del cliente: 32 byte casuali in base64url
  token                 text not null unique check (length(token) between 30 and 80),
  stato                 text not null default 'inviato'
                        check (stato in ('inviato', 'compilato', 'firmato', 'pagato', 'attivo', 'annullato')),
  note                  text check (note is null or length(note) <= 1000),
  -- condizioni COPIATE dall'offerta al momento dell'invito
  offerta_id            uuid references public.offerte (id) on delete set null,
  offerta_nome          text,
  modello_contratto     text not null,
  programma             text not null,
  prezzo                numeric(12,2) not null check (prezzo > 0),
  durata_mesi           integer not null check (durata_mesi between 1 and 60),
  firma_fornitore       jsonb,
  -- dati del cliente (istantanea di ciò che ha inserito e validato il server)
  tipo                  text check (tipo is null or tipo in ('privato', 'professionista', 'societa')),
  dati                  jsonb not null default '{}'::jsonb,
  cliente_nome          text,
  cliente_email         text,
  -- prova della firma
  aperto_il             timestamptz,
  informativa_letta_il  timestamptz,
  compilato_il          timestamptz,
  firmato_il            timestamptz,
  firma_ip              text check (firma_ip is null or length(firma_ip) <= 64),
  firma_user_agent      text check (firma_user_agent is null or length(firma_user_agent) <= 400),
  modello               text,
  documento             jsonb,
  testo_sha256          text check (testo_sha256 is null or testo_sha256 ~ '^[0-9a-f]{64}$'),
  firma_contratto       jsonb,
  firma_clausole        jsonb,
  pdf_path              text,
  pdf_sha256            text check (pdf_sha256 is null or pdf_sha256 ~ '^[0-9a-f]{64}$'),
  -- dopo la firma
  pagato_il             date,
  fattura_id            uuid references public.fatture (id) on delete set null,
  cliente_id            uuid references public.clienti (id) on delete set null,
  attivato_il           timestamptz,
  attivazione_consegne  text[] not null default '{}',
  scade_il              date,
  recesso_fino_al       date,
  annullato_il          timestamptz,
  -- un contratto firmato ha sempre testo, impronta e due firme
  constraint contratti_firmato_completo check (
    stato not in ('firmato', 'pagato', 'attivo')
    or (firmato_il is not null and documento is not null and testo_sha256 is not null
        and firma_contratto is not null and firma_clausole is not null and tipo is not null)
  )
);
comment on table public.contratti is 'Inviti e contratti firmati del programma. `documento` + `testo_sha256` sono l''istantanea di ciò che il cliente ha firmato: non cambiano più.';
comment on column public.contratti.attivazione_consegne is 'Le consegne spuntate all''attivazione (moduli_skool, gruppo_whatsapp, chiamate_gruppo): lista corta di chiavi, come clienti.tags.';

create index contratti_stato_idx on public.contratti (stato, created_at desc);
create index contratti_cliente_idx on public.contratti (cliente_id) where cliente_id is not null;
create trigger set_updated_at before update on public.contratti
  for each row execute procedure extensions.moddatetime (updated_at);

alter table public.contratti enable row level security;
create policy "contratti: finance legge" on public.contratti for select to authenticated
  using ((select private.es_finance()));
create policy "contratti: finance aggiorna" on public.contratti for update to authenticated
  using ((select private.es_finance())) with check ((select private.es_finance()));
create policy "contratti: admin inserisce" on public.contratti for insert to authenticated
  with check ((select private.tiene_rol('admin')));
create policy "contratti: admin elimina" on public.contratti for delete to authenticated
  using ((select private.tiene_rol('admin')));
revoke all on public.contratti from anon;

-- ---------------------------------------------------------------------------
-- 4. La scheda cliente sa che il programma va attivato
-- ---------------------------------------------------------------------------
alter table public.clienti add column da_attivare boolean not null default false;
comment on column public.clienti.da_attivare is 'true dal pagamento del contratto all''attivazione del programma: la lista clienti mostra "Da attivare".';

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
  c.tags              as tag_labels,
  c.da_attivare
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
           (case when count(*) filter (where k.stato <> 'done') > 0 then b.call_n else -b.call_n end)
  limit 1
) hc on true
where u.rol = 'cliente';

-- ---------------------------------------------------------------------------
-- 5. Archivio dei PDF firmati: bucket privato, solo service role (nessuna policy)
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('contratti', 'contratti', false, 10485760, array['application/pdf']);

-- ---------------------------------------------------------------------------
-- 6. Ritenzione: gli inviti mai firmati spariscono dopo 90 giorni (informativa, punto 6)
-- ---------------------------------------------------------------------------
create or replace function private.contratti_pulizia()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare n integer;
begin
  with cancellati as (
    delete from public.contratti
    where stato in ('inviato', 'compilato', 'annullato')
      and greatest(created_at, coalesce(aperto_il, created_at), coalesce(compilato_il, created_at), coalesce(annullato_il, created_at))
          < now() - interval '90 days'
    returning id
  )
  select count(*) into n from cancellati;
  return n;
end;
$$;
revoke execute on function private.contratti_pulizia() from public, anon, authenticated;

select cron.schedule('contratti-pulizia', '30 3 * * *', $$select private.contratti_pulizia()$$);
