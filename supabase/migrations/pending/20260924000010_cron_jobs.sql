-- ============================================================================
-- 0010 · Job automatici (pg_cron → Edge Functions via pg_net).
-- DA APPLICARE AL CUTOVER, dopo aver impostato i secret delle Edge Function.
-- Prima: select vault.create_secret('<CRON_SECRET>', 'cron_secret');
-- Orari in UTC (7:00 UTC = 9:00 Italia d'estate).
-- ============================================================================

create extension if not exists pg_cron;

create or replace function private.chiama_edge_function(p_nome text)
returns bigint
language plpgsql security definer
set search_path = ''
as $$
declare
  v_secret text;
begin
  select decrypted_secret into v_secret from vault.decrypted_secrets where name = 'cron_secret';
  return extensions.net.http_post(
    url     := 'https://tcvftvvbheacsjbadtfg.supabase.co/functions/v1/' || p_nome,
    headers := jsonb_build_object('Content-Type', 'application/json', 'Authorization', 'Bearer ' || v_secret),
    body    := '{}'::jsonb,
    timeout_milliseconds := 120000
  );
end;
$$;
revoke execute on function private.chiama_edge_function(text) from public, anon, authenticated;

select cron.schedule('payment-reminders', '0 7 * * *',    $$select private.chiama_edge_function('payment-reminders')$$);
select cron.schedule('fathom-autoassign', '*/15 * * * *', $$select private.chiama_edge_function('fathom-autoassign')$$);
select cron.schedule('notion-compiti',    '*/30 * * * *', $$select private.chiama_edge_function('notion-compiti')$$);
select cron.schedule('genera-hub',        '0 8 * * *',    $$select private.chiama_edge_function('genera-hub')$$);
select cron.schedule('skool-lezioni',     '0 4 1 * *',    $$select private.chiama_edge_function('skool-lezioni')$$);
