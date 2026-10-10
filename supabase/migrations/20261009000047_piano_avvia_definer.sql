-- ============================================================================
-- 0047 · Il trigger che avvia Aura non deve mai bloccare la call (09/10/2026)
--
-- `private.chiama_edge_function` è eseguibile solo da postgres. Il trigger
-- `chiamate_piano_avvia` la chiamava come SECURITY INVOKER: dal SQL Editor
-- (postgres) funzionava, ma dalle Edge Functions (service_role: webhook,
-- fathom-autoassign) e dal gestionale (authenticated: «Assegna a questo
-- cliente») dava «permission denied for function chiama_edge_function» e
-- faceva fallire l'intero insert/update della call. Ora il trigger è SECURITY
-- DEFINER e la chiamata è dentro un blocco di eccezione: se pg_net non parte,
-- la call resta `da_generare` e la riprende il cron entro 10 minuti.
-- ============================================================================

create or replace function private.chiamate_piano_avvia()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.piano_stato = 'da_generare' and (tg_op = 'INSERT' or old.piano_stato is distinct from 'da_generare') then
    begin
      perform private.chiama_edge_function('aura-compiti');
    exception when others then
      raise warning 'chiamate_piano_avvia: avvio non riuscito (%), ci pensa il cron', sqlerrm;
    end;
  end if;
  return null;
end;
$$;
revoke execute on function private.chiamate_piano_avvia() from public, anon, authenticated;
