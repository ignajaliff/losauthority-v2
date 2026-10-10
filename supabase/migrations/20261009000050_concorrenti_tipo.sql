-- ============================================================================
-- 0050 · Competitors: ogni referenza è un «competitor» o un'«ispirazione» (09/10/2026)
--
-- La pagina Concorrenti diventa «Competitors» e le carte si dividono in due
-- tipi. Le referenze già presenti diventano competitor (default).
-- `salva_concorrente` riceve il tipo: la firma cambia, quindi si toglie la
-- vecchia (con un parametro in più sarebbe un overload ambiguo per PostgREST).
-- ============================================================================

alter table public.concorrenti
  add column tipo text not null default 'competitor' check (tipo in ('competitor', 'ispirazione'));
comment on column public.concorrenti.tipo is 'competitor = fa la stessa cosa; ispirazione = profilo da cui prendere spunto.';

drop function public.salva_concorrente(uuid, text, text[], text, text[], text[]);

create function public.salva_concorrente(
  p_id               uuid,
  p_nome             text,
  p_tipo             text,
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
    insert into public.concorrenti (cliente_id, nome, tipo, social, cosa_fa)
    values ((select auth.uid()), p_nome, p_tipo, coalesce(p_social, '{}'), p_cosa_fa)
    returning id into v_id;
  else
    update public.concorrenti set nome = p_nome, tipo = p_tipo, social = coalesce(p_social, '{}'), cosa_fa = p_cosa_fa where id = v_id;
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
revoke execute on function public.salva_concorrente(uuid, text, text, text[], text, text[], text[]) from public, anon;
grant execute on function public.salva_concorrente(uuid, text, text, text[], text, text[], text[]) to authenticated;
