-- ============================================================================
-- 20260927000014 · Crea idee con Aura (area cliente)
--
-- Quattro tabelle:
--   aura_conoscenza  → il METODO di Wesley che Aura legge per rispondere con i
--                      nostri dati (come si costruisce un'idea, hook, tipologie).
--                      La cura il team dal gestionale; il cliente non la vede.
--   idee_sessioni    → una sessione di lavoro del cliente con Aura ("studio").
--   idee_messaggi    → i messaggi della sessione, cliente e Aura. La riga di
--                      Aura nasce 'in_corso' e passa a 'completato' o 'errore':
--                      così si vede sempre se ha risposto e dove ha lasciato il
--                      messaggio, e si può riprovare.
--   idee             → le proposte (titolo, hook, script, tipologia) legate al
--                      messaggio che le ha generate. Aura PROPONE, il cliente
--                      conferma (salvata), scarta o le porta nel Workflow (usata).
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. Conoscenza di Aura
-- ---------------------------------------------------------------------------
create table public.aura_conoscenza (
  id          uuid primary key default gen_random_uuid(),
  ambito      text not null default 'idee' check (ambito in ('idee', 'generale')),
  titolo      text not null check (length(titolo) between 1 and 200),
  contenuto   text not null check (length(contenuto) between 1 and 20000),
  ordine      smallint not null default 0 check (ordine >= 0),
  attivo      boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
comment on table public.aura_conoscenza is 'Metodo di Wesley in blocchi di testo: Aura li legge nel prompt. Solo team.';

create index aura_conoscenza_ambito_idx on public.aura_conoscenza (ambito, ordine) where attivo;

create trigger set_updated_at before update on public.aura_conoscenza
  for each row execute procedure extensions.moddatetime (updated_at);

alter table public.aura_conoscenza enable row level security;
create policy "conoscenza: team legge" on public.aura_conoscenza for select to authenticated
  using ((select private.es_team()));
create policy "conoscenza: team inserisce" on public.aura_conoscenza for insert to authenticated
  with check ((select private.es_team()));
create policy "conoscenza: team aggiorna" on public.aura_conoscenza for update to authenticated
  using ((select private.es_team())) with check ((select private.es_team()));
create policy "conoscenza: team elimina" on public.aura_conoscenza for delete to authenticated
  using ((select private.es_team()));
revoke all on public.aura_conoscenza from anon;

-- Blocchi iniziali (da rivedere con Wesley: sono il punto di partenza, non la sua voce definitiva).
insert into public.aura_conoscenza (ambito, titolo, contenuto, ordine) values
('idee', 'Struttura di un video breve',
$$Ogni video breve ha tre parti, sempre nello stesso ordine.
1. HOOK (primi 2 secondi): una frase che parla del PROBLEMA dello spettatore, mai del creator. Niente "ciao ragazzi", niente logo. Formule che funzionano: "Se [situazione], stai sbagliando [cosa]"; "Nessuno ti dice che [verità scomoda]"; "[Numero] errori che fai quando [azione]"; "Ho [risultato] facendo solo questo".
2. SVILUPPO (20-40 secondi): un solo concetto, spiegato con un esempio concreto. Se ci sono più punti, massimo tre, numerati. Frasi corte. Una parola difficile = uno spettatore perso.
3. CHIUSURA (ultimi 5 secondi): una sola call to action, coerente con la tipologia (salva, commenta, segui, scrivimi). Mai due CTA insieme.$$, 1),
('idee', 'Le quattro tipologie di contenuto',
$$- CONTENUTO VIRALE: serve a farsi scoprire. Tema largo, emozione forte (sorpresa, identificazione, polemica sana). CTA: segui o condividi. Non vende mai.
- CONTENUTO DI CONSOLIDAZIONE: serve a farsi ricordare da chi già segue. Metodo, dietro le quinte, errori propri, casi reali. CTA: salva o commenta.
- CONTENUTO DI VENDITA: serve a far fare un passo. Parla di UN problema specifico del cliente ideale e di come il creator lo risolve. CTA: scrivimi / link in bio. Massimo 1 ogni 4-5 video.
- CONTENT SERIES: una rubrica ripetibile con lo stesso formato e lo stesso titolo ("Errore n.", "Rispondo a…"). Serve a creare abitudine. Ogni puntata deve reggere da sola.$$, 2),
('idee', 'Regole per proporre idee',
$$- Parti SEMPRE dal cliente ideale del creator e dai suoi dolori (scheda onboarding e analisi): un'idea buona per tutti è buona per nessuno.
- Ogni proposta ha: titolo interno, hook pronto da dire, script completo parlato (100-160 parole, così sta in 45-60 secondi), tipologia.
- Lo script è PARLATO: come lo direbbe il creator a voce, in prima persona, con le sue parole e i suoi esempi. Niente titoli, niente elenchi nel testo dello script.
- Se il cliente porta video di riferimento, prendi la STRUTTURA che funziona (ritmo, tipo di hook, formato), mai il contenuto: si adatta al suo settore, non si copia.
- Proponi da 1 a 3 idee per volta, diverse tra loro (angolo o tipologia). Meglio una idea forte che tre tiepide.
- Se manca un'informazione decisiva, fai UNA domanda prima di proporre.$$, 3);

-- ---------------------------------------------------------------------------
-- 2. Sessioni
-- ---------------------------------------------------------------------------
create table public.idee_sessioni (
  id          uuid primary key default gen_random_uuid(),
  cliente_id  uuid not null references public.clienti (id) on delete cascade,
  titolo      text not null check (length(titolo) between 1 and 120),
  stato       text not null default 'aperta' check (stato in ('aperta', 'archiviata')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
comment on table public.idee_sessioni is 'Una sessione "Crea idee" del cliente con Aura.';

create index idee_sessioni_cliente_idx on public.idee_sessioni (cliente_id, updated_at desc);

create trigger set_updated_at before update on public.idee_sessioni
  for each row execute procedure extensions.moddatetime (updated_at);

alter table public.idee_sessioni enable row level security;
create policy "sessioni: lettura propria o team" on public.idee_sessioni for select to authenticated
  using (cliente_id = (select auth.uid()) or (select private.es_team()));
create policy "sessioni: inserisce proprietario" on public.idee_sessioni for insert to authenticated
  with check (cliente_id = (select auth.uid()));
create policy "sessioni: aggiorna proprietario o team" on public.idee_sessioni for update to authenticated
  using (cliente_id = (select auth.uid()) or (select private.es_team()))
  with check (cliente_id = (select auth.uid()) or (select private.es_team()));
create policy "sessioni: elimina proprietario o team" on public.idee_sessioni for delete to authenticated
  using (cliente_id = (select auth.uid()) or (select private.es_team()));
revoke all on public.idee_sessioni from anon;

create or replace function private.e_mia_sessione(p_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.idee_sessioni s
    where s.id = p_id and (s.cliente_id = (select auth.uid()) or (select private.es_team()))
  );
$$;
revoke execute on function private.e_mia_sessione(uuid) from public, anon;
grant execute on function private.e_mia_sessione(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- 3. Messaggi (scritti dalla Edge Function aura-idee; il cliente li legge)
-- ---------------------------------------------------------------------------
create table public.idee_messaggi (
  id           uuid primary key default gen_random_uuid(),
  sessione_id  uuid not null references public.idee_sessioni (id) on delete cascade,
  ruolo        text not null check (ruolo in ('cliente', 'aura')),
  contenuto    text not null default '' check (length(contenuto) <= 20000),
  -- cliente: sempre 'completato'. aura: in_corso → completato | errore
  stato        text not null default 'completato' check (stato in ('in_corso', 'completato', 'errore')),
  errore       text check (errore is null or length(errore) <= 500),
  modello      text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
comment on table public.idee_messaggi is 'Conversazione della sessione. La riga di Aura traccia se e come ha risposto.';

create index idee_messaggi_sessione_idx on public.idee_messaggi (sessione_id, created_at);

create trigger set_updated_at before update on public.idee_messaggi
  for each row execute procedure extensions.moddatetime (updated_at);

alter table public.idee_messaggi enable row level security;
create policy "messaggi: lettura propria o team" on public.idee_messaggi for select to authenticated
  using ((select private.e_mia_sessione(sessione_id)));
-- Scrive solo la Edge Function (service role): nessuna policy di insert/update/delete per authenticated.
revoke all on public.idee_messaggi from anon;

-- ---------------------------------------------------------------------------
-- 4. Idee (proposte di Aura o del cliente)
-- ---------------------------------------------------------------------------
create table public.idee (
  id            uuid primary key default gen_random_uuid(),
  cliente_id    uuid not null references public.clienti (id) on delete cascade,
  sessione_id   uuid references public.idee_sessioni (id) on delete set null,
  messaggio_id  uuid references public.idee_messaggi (id) on delete set null,
  titolo        text not null check (length(titolo) between 1 and 200),
  hook          text check (hook is null or length(hook) <= 500),
  script        text check (script is null or length(script) <= 20000),
  tipologia     text check (tipologia in ('virale', 'consolidazione', 'vendita', 'content_series')),
  riferimenti   text[] not null default '{}' check (cardinality(riferimenti) <= 30),
  origine       text not null default 'aura' check (origine in ('aura', 'cliente', 'import')),
  stato         text not null default 'proposta' check (stato in ('proposta', 'salvata', 'usata', 'scartata')),
  contenuto_id  uuid references public.contenuti (id) on delete set null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
comment on table public.idee is 'Banco idee del cliente: proposte di Aura (da confermare), idee proprie o importate.';

create index idee_cliente_idx on public.idee (cliente_id, stato, created_at desc);
create index idee_messaggio_idx on public.idee (messaggio_id);

create trigger set_updated_at before update on public.idee
  for each row execute procedure extensions.moddatetime (updated_at);

alter table public.idee enable row level security;
create policy "idee: lettura propria o team" on public.idee for select to authenticated
  using (cliente_id = (select auth.uid()) or (select private.es_team()));
create policy "idee: inserisce proprietario o team" on public.idee for insert to authenticated
  with check ((cliente_id = (select auth.uid()) or (select private.es_team())) and origine <> 'aura');
create policy "idee: aggiorna proprietario o team" on public.idee for update to authenticated
  using (cliente_id = (select auth.uid()) or (select private.es_team()))
  with check (cliente_id = (select auth.uid()) or (select private.es_team()));
create policy "idee: elimina proprietario o team" on public.idee for delete to authenticated
  using (cliente_id = (select auth.uid()) or (select private.es_team()));
revoke all on public.idee from anon;
