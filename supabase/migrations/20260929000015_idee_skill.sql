-- ============================================================================
-- 20260929000015 · Pagina "Idee" dell'area cliente: le skill di Aura
--
-- Una sola tabella: idee_skill. Il cliente carica più script dello stesso
-- stile; Aura li studia e scrive la "skill" (istruzioni per rifare quel tipo
-- di idea nel suo nicho). Qui si salva la skill completa, con titolo e una
-- riga di descrizione per la carta. Gli script caricati restano come fonte
-- (script_fonte) per poterla rigenerare.
--
-- Stato: la riga nasce 'in_corso' quando Aura sta studiando, poi 'pronta' o
-- 'errore' (stesso schema di idee_messaggi). Scrive la Edge Function
-- aura-skill (service role); il cliente legge, ritocca titolo/istruzioni ed
-- elimina. Nessun insert per authenticated: nascono solo tramite Aura.
--
-- In "Crea idee" il cliente richiama una skill con "/": il messaggio ricorda
-- quale (idee_messaggi.skill_id) e la Edge Function aura-idee la mette nel prompt.
-- ============================================================================

create table public.idee_skill (
  id            uuid primary key default gen_random_uuid(),
  cliente_id    uuid not null references public.clienti (id) on delete cascade,
  titolo        text not null check (length(titolo) between 1 and 120),
  -- Una riga per la carta, scritta da Aura.
  descrizione   text check (descrizione is null or length(descrizione) <= 300),
  -- La skill: come si costruisce quell'idea nel nicho del cliente.
  istruzioni    text not null default '' check (length(istruzioni) <= 20000),
  -- Gli script incollati dal cliente (uno per elemento), fonte della skill.
  script_fonte  text[] not null default '{}' check (cardinality(script_fonte) between 0 and 10),
  -- Cosa gli piace di questo stile, se lo ha detto.
  note          text check (note is null or length(note) <= 2000),
  stato         text not null default 'in_corso' check (stato in ('in_corso', 'pronta', 'errore')),
  errore        text check (errore is null or length(errore) <= 500),
  modello       text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
comment on table public.idee_skill is 'Pagina Idee: skill scritte da Aura a partire da script dello stesso stile. Il cliente le richiama in Crea idee con "/".';

create index idee_skill_cliente_idx on public.idee_skill (cliente_id, created_at desc);

create trigger set_updated_at before update on public.idee_skill
  for each row execute procedure extensions.moddatetime (updated_at);

alter table public.idee_skill enable row level security;
create policy "skill: lettura propria o team" on public.idee_skill for select to authenticated
  using (cliente_id = (select auth.uid()) or (select private.es_team()));
-- Insert solo dalla Edge Function aura-skill (service role).
create policy "skill: aggiorna proprietario o team" on public.idee_skill for update to authenticated
  using (cliente_id = (select auth.uid()) or (select private.es_team()))
  with check (cliente_id = (select auth.uid()) or (select private.es_team()));
create policy "skill: elimina proprietario o team" on public.idee_skill for delete to authenticated
  using (cliente_id = (select auth.uid()) or (select private.es_team()));
revoke all on public.idee_skill from anon;

-- Il messaggio del cliente ricorda la skill richiamata con "/".
alter table public.idee_messaggi
  add column skill_id uuid references public.idee_skill (id) on delete set null;
create index idee_messaggi_skill_idx on public.idee_messaggi (skill_id) where skill_id is not null;
