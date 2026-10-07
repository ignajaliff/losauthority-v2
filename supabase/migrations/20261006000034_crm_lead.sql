-- ============================================================================
-- 0034 · CRM del cliente (06/10/2026)
--
-- Pagina «Clienti» dello spazio cliente: i lead DEL CLIENTE (quelli di Wesley
-- restano in `lead`, la pipeline del gestionale). Una riga per persona: nome,
-- email, da dove è arrivata, l'offerta che le interessa (una delle `offerta`
-- del cliente, costruite con Aura nel Cervello) e lo stato
-- (interessato → da ricontattare → cliente).
-- `arrivato_il` è il giorno in cui la persona è arrivata (di default il giorno
-- in cui la si segna): alimenta la linea dei lead nel grafico di crescita di
-- Pubblicazioni. Il cliente gestisce i propri lead, il team li vede tutti.
-- ============================================================================

create table public.crm_lead (
  id           uuid primary key default gen_random_uuid(),
  cliente_id   uuid not null references public.clienti (id) on delete cascade,
  nome         text not null check (length(btrim(nome)) between 1 and 120),
  email        text check (email is null or (length(email) <= 254 and email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$')),
  fonte        text check (fonte is null or fonte in ('instagram', 'tiktok', 'whatsapp', 'passaparola', 'pubblicita', 'sito', 'evento', 'altro')),
  offerta_id   uuid references public.offerta (id) on delete set null,
  stato        text not null default 'interessato' check (stato in ('interessato', 'da_ricontattare', 'cliente')),
  arrivato_il  date not null default current_date check (arrivato_il >= date '2000-01-01'),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
comment on table public.crm_lead is 'CRM dello spazio cliente: i lead del cliente (non quelli di Wesley, che sono in lead). arrivato_il alimenta il grafico di Pubblicazioni.';
comment on column public.crm_lead.fonte is 'Da dove è arrivato il lead (chiave; le etichette sono nel frontend, features/crm/types.ts).';
comment on column public.crm_lead.offerta_id is 'L''offerta del cliente che interessa al lead (deve essere dello stesso cliente).';
comment on column public.crm_lead.arrivato_il is 'Giorno in cui il lead è arrivato: di default quando lo si segna, modificabile per i lead arrivati prima.';

create index crm_lead_cliente_idx on public.crm_lead (cliente_id, arrivato_il desc);
create index crm_lead_offerta_idx on public.crm_lead (offerta_id) where offerta_id is not null;

create trigger set_updated_at before update on public.crm_lead
  for each row execute procedure extensions.moddatetime (updated_at);

-- ---------------------------------------------------------------------------
-- Coerenza: l'offerta è dello stesso cliente, il lead non cambia cliente,
-- niente date nel futuro (un giorno di margine per i fusi), massimo 5000 lead.
-- ---------------------------------------------------------------------------
create function private.crm_lead_coerente()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'UPDATE' and new.cliente_id <> old.cliente_id then
    raise exception 'Un lead non può passare a un altro cliente' using errcode = 'check_violation';
  end if;
  if new.offerta_id is not null and not exists (
    select 1 from public.offerta o where o.id = new.offerta_id and o.cliente_id = new.cliente_id
  ) then
    raise exception 'L''offerta scelta non è di questo cliente' using errcode = 'check_violation';
  end if;
  if new.arrivato_il > current_date + 1 then
    raise exception 'La data di arrivo non può essere nel futuro' using errcode = 'check_violation';
  end if;
  if tg_op = 'INSERT' then
    perform 1 from public.clienti where id = new.cliente_id for update;
    if (select count(*) from public.crm_lead where cliente_id = new.cliente_id) >= 5000 then
      raise exception 'Massimo 5000 lead per cliente' using errcode = 'check_violation';
    end if;
  end if;
  return new;
end;
$$;
revoke execute on function private.crm_lead_coerente() from public, anon, authenticated;

create trigger crm_lead_coerente before insert or update on public.crm_lead
  for each row execute function private.crm_lead_coerente();

-- ---------------------------------------------------------------------------
-- RLS: il cliente gestisce i propri lead, il team tutti.
-- ---------------------------------------------------------------------------
alter table public.crm_lead enable row level security;

create policy "crm lead: lettura propria o team" on public.crm_lead for select to authenticated
  using (cliente_id = (select auth.uid()) or (select private.es_team()));

create policy "crm lead: inserisce proprietario o team" on public.crm_lead for insert to authenticated
  with check (cliente_id = (select auth.uid()) or (select private.es_team()));

create policy "crm lead: aggiorna proprietario o team" on public.crm_lead for update to authenticated
  using (cliente_id = (select auth.uid()) or (select private.es_team()))
  with check (cliente_id = (select auth.uid()) or (select private.es_team()));

create policy "crm lead: elimina proprietario o team" on public.crm_lead for delete to authenticated
  using (cliente_id = (select auth.uid()) or (select private.es_team()));

revoke all on public.crm_lead from anon;
