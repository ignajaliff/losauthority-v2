-- ============================================================================
-- 0051 · Cervello del tuo branding → Kit Brand (09/10/2026)
--
-- Il «libro di marca» del cliente: nome del brand, payoff, tono di voce, logo
-- (chiaro e scuro), colori (righe con hex), font (righe, file facoltativo per
-- l'anteprima vera) e documenti del brand (righe, con il testo estratto da
-- Aura per leggerli nei prompt). Il cliente gestisce il proprio kit, il team
-- lo legge; tutti gli agenti di Aura lo ricevono nel tratto «cliente» del
-- prompt (`_shared/kit-brand.ts`).
-- File nel bucket privato `kit-brand`, cartella = id del cliente.
-- `testo_estratto` e `estrazione_stato` li scrive solo la Edge Function
-- `kit-brand-leggi` (service role): un trigger li protegge dal browser.
-- ============================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'kit-brand', 'kit-brand', false, 15728640,
  array[
    'application/pdf', 'image/png', 'image/jpeg', 'image/webp', 'image/svg+xml', 'text/plain',
    'font/ttf', 'font/otf', 'font/woff', 'font/woff2',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation'
  ]
)
on conflict (id) do nothing;

create policy "storage kit-brand: lettura propria o team" on storage.objects for select to authenticated
  using (bucket_id = 'kit-brand' and ((storage.foldername(name))[1] = (select auth.uid())::text or (select private.es_team())));
create policy "storage kit-brand: cliente carica nella sua cartella" on storage.objects for insert to authenticated
  with check (bucket_id = 'kit-brand' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "storage kit-brand: cliente elimina nella sua cartella" on storage.objects for delete to authenticated
  using (bucket_id = 'kit-brand' and (storage.foldername(name))[1] = (select auth.uid())::text);

-- ---------------------------------------------------------------------------
-- 1) kit_brand: una riga per cliente (id = cliente).
-- ---------------------------------------------------------------------------
create table public.kit_brand (
  id               uuid primary key references public.clienti (id) on delete cascade,
  nome_brand       text check (nome_brand is null or length(nome_brand) between 1 and 120),
  payoff           text check (payoff is null or length(payoff) <= 300),
  tono_voce        text check (tono_voce is null or length(tono_voce) <= 4000),
  note             text check (note is null or length(note) <= 4000),
  logo_path        text check (logo_path is null or length(logo_path) <= 300),
  logo_scuro_path  text check (logo_scuro_path is null or length(logo_scuro_path) <= 300),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
comment on table public.kit_brand is 'Kit Brand del cliente (Cervello → Kit Brand): nome, payoff, tono di voce, logo. Colori, font e documenti nelle tabelle figlie.';
create trigger set_updated_at before update on public.kit_brand
  for each row execute procedure extensions.moddatetime (updated_at);

-- ---------------------------------------------------------------------------
-- 2) Colori, font, documenti: una riga ciascuno.
-- ---------------------------------------------------------------------------
create table public.kit_brand_colori (
  id          uuid primary key default gen_random_uuid(),
  cliente_id  uuid not null references public.clienti (id) on delete cascade,
  hex         text not null check (hex ~ '^#[0-9a-f]{6}$'),
  nome        text check (nome is null or length(nome) <= 60),
  ruolo       text not null default 'altro' check (ruolo in ('primario', 'secondario', 'accento', 'sfondo', 'testo', 'altro')),
  ordine      integer not null default 0 check (ordine >= 0),
  created_at  timestamptz not null default now()
);
comment on table public.kit_brand_colori is 'Colori del brand: hex minuscolo con #, nome e ruolo. Max 12 per cliente.';
create index kit_brand_colori_cliente_idx on public.kit_brand_colori (cliente_id, ordine);

create table public.kit_brand_font (
  id            uuid primary key default gen_random_uuid(),
  cliente_id    uuid not null references public.clienti (id) on delete cascade,
  nome          text not null check (length(btrim(nome)) between 1 and 120),
  ruolo         text not null default 'titoli' check (ruolo in ('titoli', 'testo', 'accento')),
  storage_path  text unique check (storage_path is null or length(storage_path) <= 300),
  ordine        integer not null default 0 check (ordine >= 0),
  created_at    timestamptz not null default now()
);
comment on table public.kit_brand_font is 'Font del brand: nome, ruolo e file facoltativo (bucket kit-brand) per l''anteprima vera. Max 6 per cliente.';
create index kit_brand_font_cliente_idx on public.kit_brand_font (cliente_id, ordine);

create table public.kit_brand_documenti (
  id                uuid primary key default gen_random_uuid(),
  cliente_id        uuid not null references public.clienti (id) on delete cascade,
  nome              text not null check (length(btrim(nome)) between 1 and 255),
  descrizione       text check (descrizione is null or length(descrizione) <= 1000),
  storage_path      text not null unique check (length(storage_path) <= 300),
  dimensione        bigint not null check (dimensione >= 0),
  testo_estratto    text check (testo_estratto is null or length(testo_estratto) <= 30000),
  estrazione_stato  text not null default 'da_fare' check (estrazione_stato in ('da_fare', 'in_corso', 'fatta', 'non_leggibile', 'errore')),
  created_at        timestamptz not null default now()
);
comment on table public.kit_brand_documenti is 'Documenti del brand (brand book, linee guida…): file nel bucket kit-brand + testo estratto da Aura (PDF e immagini) per i prompt. Max 20 per cliente.';
create index kit_brand_documenti_cliente_idx on public.kit_brand_documenti (cliente_id, created_at);
create index kit_brand_documenti_da_leggere_idx on public.kit_brand_documenti (estrazione_stato) where estrazione_stato in ('da_fare', 'in_corso');

-- Limiti per cliente (12 colori, 6 font, 20 documenti) con lock sulla riga del cliente.
create function private.kit_brand_limiti()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_max integer;
  v_n integer;
begin
  if tg_op = 'UPDATE' and new.cliente_id <> old.cliente_id then
    raise exception 'Una voce del kit non può passare a un altro cliente' using errcode = 'check_violation';
  end if;
  if tg_op = 'INSERT' then
    perform 1 from public.clienti where id = new.cliente_id for update;
    v_max := case tg_table_name when 'kit_brand_colori' then 12 when 'kit_brand_font' then 6 else 20 end;
    execute format('select count(*) from public.%I where cliente_id = $1', tg_table_name) into v_n using new.cliente_id;
    if v_n >= v_max then
      raise exception 'Massimo % voci' , v_max using errcode = 'check_violation';
    end if;
  end if;
  return new;
end;
$$;
revoke execute on function private.kit_brand_limiti() from public, anon, authenticated;
create trigger kit_brand_colori_limiti before insert or update on public.kit_brand_colori
  for each row execute function private.kit_brand_limiti();
create trigger kit_brand_font_limiti before insert or update on public.kit_brand_font
  for each row execute function private.kit_brand_limiti();
create trigger kit_brand_documenti_limiti before insert or update on public.kit_brand_documenti
  for each row execute function private.kit_brand_limiti();

-- Il testo estratto e il suo stato li scrive solo la Edge Function (service role, auth.uid() null).
create function private.kit_brand_documenti_solo_aura()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if auth.uid() is null then
    return new;
  end if;
  if tg_op = 'INSERT' then
    new.testo_estratto := null;
    new.estrazione_stato := 'da_fare';
  elsif new.testo_estratto is distinct from old.testo_estratto or new.estrazione_stato is distinct from old.estrazione_stato then
    raise exception 'Il testo estratto lo scrive Aura.' using errcode = '42501';
  end if;
  return new;
end;
$$;
revoke execute on function private.kit_brand_documenti_solo_aura() from public, anon, authenticated;
create trigger kit_brand_documenti_solo_aura before insert or update on public.kit_brand_documenti
  for each row execute function private.kit_brand_documenti_solo_aura();

-- ---------------------------------------------------------------------------
-- RLS: il cliente gestisce il proprio kit, il team lo legge.
-- ---------------------------------------------------------------------------
alter table public.kit_brand enable row level security;
alter table public.kit_brand_colori enable row level security;
alter table public.kit_brand_font enable row level security;
alter table public.kit_brand_documenti enable row level security;

create policy "kit brand: lettura propria o team" on public.kit_brand for select to authenticated
  using (id = (select auth.uid()) or (select private.es_team()));
create policy "kit brand: crea il proprietario" on public.kit_brand for insert to authenticated
  with check (id = (select auth.uid()));
create policy "kit brand: aggiorna il proprietario" on public.kit_brand for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));

create policy "kit brand colori: lettura propria o team" on public.kit_brand_colori for select to authenticated
  using (cliente_id = (select auth.uid()) or (select private.es_team()));
create policy "kit brand colori: inserisce il proprietario" on public.kit_brand_colori for insert to authenticated
  with check (cliente_id = (select auth.uid()));
create policy "kit brand colori: aggiorna il proprietario" on public.kit_brand_colori for update to authenticated
  using (cliente_id = (select auth.uid())) with check (cliente_id = (select auth.uid()));
create policy "kit brand colori: elimina il proprietario" on public.kit_brand_colori for delete to authenticated
  using (cliente_id = (select auth.uid()));

create policy "kit brand font: lettura propria o team" on public.kit_brand_font for select to authenticated
  using (cliente_id = (select auth.uid()) or (select private.es_team()));
create policy "kit brand font: inserisce il proprietario" on public.kit_brand_font for insert to authenticated
  with check (cliente_id = (select auth.uid()));
create policy "kit brand font: aggiorna il proprietario" on public.kit_brand_font for update to authenticated
  using (cliente_id = (select auth.uid())) with check (cliente_id = (select auth.uid()));
create policy "kit brand font: elimina il proprietario" on public.kit_brand_font for delete to authenticated
  using (cliente_id = (select auth.uid()));

create policy "kit brand documenti: lettura propria o team" on public.kit_brand_documenti for select to authenticated
  using (cliente_id = (select auth.uid()) or (select private.es_team()));
create policy "kit brand documenti: inserisce il proprietario" on public.kit_brand_documenti for insert to authenticated
  with check (cliente_id = (select auth.uid()));
create policy "kit brand documenti: aggiorna il proprietario" on public.kit_brand_documenti for update to authenticated
  using (cliente_id = (select auth.uid())) with check (cliente_id = (select auth.uid()));
create policy "kit brand documenti: elimina il proprietario" on public.kit_brand_documenti for delete to authenticated
  using (cliente_id = (select auth.uid()));

revoke all on public.kit_brand, public.kit_brand_colori, public.kit_brand_font, public.kit_brand_documenti from anon;
