-- ============================================================================
-- 0005 · Wrapper in public per il rate limit di Aura: PostgREST non espone lo
--        schema private. Eseguibile SOLO da service_role (Edge Function aura-help).
-- ============================================================================
create or replace function public.aura_help_allowed(p_user uuid, p_max integer, p_window_secs integer)
returns boolean
language sql security definer
set search_path = ''
as $$
  select private.aura_help_allowed(p_user, p_max, p_window_secs);
$$;
revoke execute on function public.aura_help_allowed(uuid, integer, integer) from public, anon, authenticated;
grant execute on function public.aura_help_allowed(uuid, integer, integer) to service_role;
