-- ============================================================================
-- 20260925000007 · Compiti del piano d'azione
--
-- Checklist di cose che il cliente deve fare, in una tabella NOSTRA (prima
-- parte dell'uscita da Notion: le board "Compiti per call n°X" copiate in
-- hub_board/hub_compiti restano finché il modulo Percorso non le sostituisce).
-- Un compito = una riga: testo, stato, ordine, data di completamento.
-- Per ora scrive solo il team; la spunta dal lato cliente arriverà col modulo
-- Percorso (richiede una policy dedicata o una RPC per limitare le colonne).
-- ============================================================================

create table public.compiti (
  id             uuid primary key default gen_random_uuid(),
  cliente_id     uuid not null references public.clienti (id) on delete cascade,
  testo          text not null check (length(testo) between 1 and 1000),
  stato          text not null default 'da_fare' check (stato in ('da_fare', 'fatto')),
  ordine         smallint not null default 0 check (ordine >= 0),
  completato_il  timestamptz,
  creato_da      uuid references public.user_roles (id) on delete set null,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  -- fatto ⇔ ha una data di completamento (il trigger sotto la tiene allineata)
  constraint compiti_completato_coerente check ((stato = 'fatto') = (completato_il is not null))
);
comment on table public.compiti is 'Piano d''azione del cliente: una riga per compito (checklist).';

create index compiti_cliente_idx on public.compiti (cliente_id, ordine, created_at);

create trigger set_updated_at before update on public.compiti
  for each row execute procedure extensions.moddatetime (updated_at);

-- completato_il segue lo stato: si imposta quando diventa 'fatto', si azzera se torna 'da_fare'.
create or replace function private.compiti_allinea_completato()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.stato = 'fatto' then
    if new.completato_il is null then
      new.completato_il := now();
    end if;
  else
    new.completato_il := null;
  end if;
  return new;
end;
$$;
revoke execute on function private.compiti_allinea_completato() from public, anon, authenticated;

create trigger compiti_allinea_completato before insert or update of stato on public.compiti
  for each row execute function private.compiti_allinea_completato();

-- ---------------------------------------------------------------------------
-- RLS: il cliente legge i propri, il team fa tutto.
-- ---------------------------------------------------------------------------
alter table public.compiti enable row level security;

create policy "compiti: lettura propria o team" on public.compiti for select to authenticated
  using (cliente_id = (select auth.uid()) or (select private.es_team()));

create policy "compiti: team inserisce" on public.compiti for insert to authenticated
  with check ((select private.es_team()) and creato_da = (select auth.uid()));

create policy "compiti: team aggiorna" on public.compiti for update to authenticated
  using ((select private.es_team())) with check ((select private.es_team()));

create policy "compiti: team elimina" on public.compiti for delete to authenticated
  using ((select private.es_team()));

revoke all on public.compiti from anon;
