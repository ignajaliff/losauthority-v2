-- ============================================================================
-- 0041 · Ricerca TikTok: la quota «una ogni 15 giorni» vale nel database
--
-- La Edge Function controllava la quota prima dell'insert e la ricontrollava
-- dopo, ma due richieste parallele potevano superarla (created_at = inizio
-- della transazione, non commit). Il trigger serializza gli insert dello
-- stesso cliente con un advisory lock di transazione e rifiuta il secondo.
-- Le ricerche in errore non contano (come nella funzione).
-- ============================================================================

create function private.ricerche_tiktok_quota()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  -- Un insert alla volta per cliente: il secondo aspetta il commit del primo e poi lo vede.
  perform pg_advisory_xact_lock(hashtext('ricerca_tiktok:' || new.cliente_id::text));
  if exists (
    select 1 from public.ricerche_tiktok
    where cliente_id = new.cliente_id
      and stato <> 'errore'
      and created_at >= now() - interval '15 days'
  ) then
    raise exception 'ricerca_tiktok_quota' using errcode = 'check_violation', hint = 'Una ricerca ogni 15 giorni';
  end if;
  return new;
end;
$$;
revoke execute on function private.ricerche_tiktok_quota() from public, anon, authenticated;

create trigger ricerche_tiktok_quota before insert on public.ricerche_tiktok
  for each row execute function private.ricerche_tiktok_quota();
