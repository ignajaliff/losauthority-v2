-- ============================================================================
-- 0038 · Cervello del tuo branding → Concorrenti (06/10/2026)
--
-- Il cliente si crea le sue REFERENZE: persone o attività che fanno quello che
-- fa lui. Una carta per concorrente: nome, fino a 3 link social, cosa fa, e
-- tanti video (link) ciascuno con la sua descrizione (cosa c'è nel video,
-- cosa funziona). I video sono righe (`concorrenti_video`), i social sono
-- una lista breve di link (text[] ≤ 3, come `contenuti.riferimenti`).
-- Il cliente gestisce i propri; il team li legge (per la consulenza).
-- Si salvano carta + video insieme con `salva_concorrente` (una transazione).
-- ============================================================================

-- Tutti gli elementi sono link http(s) (usata nei CHECK delle liste).
create function private.solo_link(p_link text[])
returns boolean
language sql
immutable
set search_path = ''
as $$
  select coalesce(bool_and(l ~* '^https?://[^\s]+$' and length(l) <= 500), true) from unnest(p_link) as l;
$$;
revoke execute on function private.solo_link(text[]) from public, anon;
grant execute on function private.solo_link(text[]) to authenticated, service_role;

create table public.concorrenti (
  id          uuid primary key default gen_random_uuid(),
  cliente_id  uuid not null references public.clienti (id) on delete cascade,
  nome        text not null check (length(btrim(nome)) between 1 and 120),
  social      text[] not null default '{}' check (cardinality(social) <= 3 and private.solo_link(social)),
  cosa_fa     text check (cosa_fa is null or length(cosa_fa) <= 2000),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
comment on table public.concorrenti is 'Referenze del cliente (Cervello → Concorrenti): chi fa la stessa cosa. Social ≤ 3 link; i video sono in concorrenti_video.';
create index concorrenti_cliente_idx on public.concorrenti (cliente_id, created_at);
create trigger set_updated_at before update on public.concorrenti
  for each row execute procedure extensions.moddatetime (updated_at);

create table public.concorrenti_video (
  id              uuid primary key default gen_random_uuid(),
  concorrente_id  uuid not null references public.concorrenti (id) on delete cascade,
  url             text not null check (url ~* '^https?://[^\s]+$' and length(url) <= 500),
  descrizione     text check (descrizione is null or length(descrizione) <= 2000),
  ordine          integer not null default 0 check (ordine >= 0),
  created_at      timestamptz not null default now()
);
comment on table public.concorrenti_video is 'Video di una referenza: link + descrizione di cosa c''è nel video.';
create index concorrenti_video_concorrente_idx on public.concorrenti_video (concorrente_id, ordine);

-- Limiti: 50 referenze per cliente, 30 video per referenza.
create function private.concorrenti_limiti()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_table_name = 'concorrenti' then
    if tg_op = 'UPDATE' and new.cliente_id <> old.cliente_id then
      raise exception 'Una referenza non può passare a un altro cliente' using errcode = 'check_violation';
    end if;
    if tg_op = 'INSERT' then
      perform 1 from public.clienti where id = new.cliente_id for update;
      if (select count(*) from public.concorrenti where cliente_id = new.cliente_id) >= 50 then
        raise exception 'Massimo 50 referenze' using errcode = 'check_violation';
      end if;
    end if;
  else
    perform 1 from public.concorrenti where id = new.concorrente_id for update;
    if (select count(*) from public.concorrenti_video where concorrente_id = new.concorrente_id) >= 30 then
      raise exception 'Massimo 30 video per referenza' using errcode = 'check_violation';
    end if;
  end if;
  return new;
end;
$$;
revoke execute on function private.concorrenti_limiti() from public, anon, authenticated;
create trigger concorrenti_limiti before insert or update on public.concorrenti
  for each row execute function private.concorrenti_limiti();
create trigger concorrenti_video_limiti before insert on public.concorrenti_video
  for each row execute function private.concorrenti_limiti();

-- Proprietario della referenza (per la RLS dei video).
create function private.e_mio_concorrente(p_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.concorrenti c where c.id = p_id and c.cliente_id = (select auth.uid()));
$$;
revoke execute on function private.e_mio_concorrente(uuid) from public, anon;
grant execute on function private.e_mio_concorrente(uuid) to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- RLS: il cliente gestisce le proprie referenze, il team le legge.
-- ---------------------------------------------------------------------------
alter table public.concorrenti enable row level security;
alter table public.concorrenti_video enable row level security;

create policy "concorrenti: lettura propria o team" on public.concorrenti for select to authenticated
  using (cliente_id = (select auth.uid()) or (select private.es_team()));
create policy "concorrenti: inserisce il proprietario" on public.concorrenti for insert to authenticated
  with check (cliente_id = (select auth.uid()));
create policy "concorrenti: aggiorna il proprietario" on public.concorrenti for update to authenticated
  using (cliente_id = (select auth.uid()))
  with check (cliente_id = (select auth.uid()));
create policy "concorrenti: elimina il proprietario" on public.concorrenti for delete to authenticated
  using (cliente_id = (select auth.uid()));

create policy "concorrenti video: lettura propria o team" on public.concorrenti_video for select to authenticated
  using ((select private.e_mio_concorrente(concorrente_id)) or (select private.es_team()));
create policy "concorrenti video: inserisce il proprietario" on public.concorrenti_video for insert to authenticated
  with check ((select private.e_mio_concorrente(concorrente_id)));
create policy "concorrenti video: aggiorna il proprietario" on public.concorrenti_video for update to authenticated
  using ((select private.e_mio_concorrente(concorrente_id)))
  with check ((select private.e_mio_concorrente(concorrente_id)));
create policy "concorrenti video: elimina il proprietario" on public.concorrenti_video for delete to authenticated
  using ((select private.e_mio_concorrente(concorrente_id)));

revoke all on public.concorrenti, public.concorrenti_video from anon;

-- ---------------------------------------------------------------------------
-- Salva carta + video in una transazione. SECURITY INVOKER: valgono le policy
-- del chiamante (solo il proprietario). p_id null = nuova referenza.
-- I video arrivano come due liste parallele (url, descrizione) nell'ordine.
-- ---------------------------------------------------------------------------
create function public.salva_concorrente(
  p_id               uuid,
  p_nome             text,
  p_social           text[],
  p_cosa_fa          text,
  p_video_url        text[],
  p_video_descrizione text[]
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_id uuid := p_id;
  i integer;
begin
  if coalesce(cardinality(p_video_url), 0) <> coalesce(cardinality(p_video_descrizione), 0) then
    raise exception 'Video e descrizioni non corrispondono' using errcode = 'check_violation';
  end if;
  if v_id is null then
    insert into public.concorrenti (cliente_id, nome, social, cosa_fa)
    values ((select auth.uid()), p_nome, coalesce(p_social, '{}'), p_cosa_fa)
    returning id into v_id;
  else
    update public.concorrenti set nome = p_nome, social = coalesce(p_social, '{}'), cosa_fa = p_cosa_fa where id = v_id;
    if not found then
      raise exception 'Referenza non trovata' using errcode = 'no_data_found';
    end if;
    delete from public.concorrenti_video where concorrente_id = v_id;
  end if;
  for i in 1..coalesce(cardinality(p_video_url), 0) loop
    insert into public.concorrenti_video (concorrente_id, url, descrizione, ordine)
    values (v_id, p_video_url[i], nullif(btrim(p_video_descrizione[i]), ''), i - 1);
  end loop;
  return v_id;
end;
$$;
revoke execute on function public.salva_concorrente(uuid, text, text[], text, text[], text[]) from public, anon;
grant execute on function public.salva_concorrente(uuid, text, text[], text, text[], text[]) to authenticated;
