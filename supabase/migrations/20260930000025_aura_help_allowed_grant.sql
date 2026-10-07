-- ============================================================================
-- 20260930000025 · aura_help_allowed(…, p_scope): niente EXECUTE per authenticated
--
-- La 24 aveva concesso l'esecuzione del wrapper pubblico a `authenticated`:
-- è SECURITY DEFINER e la chiamano solo le Edge Function (service role), come
-- la versione a 3 argomenti. L'advisor di sicurezza lo ha segnalato: revocato.
-- ============================================================================

revoke execute on function public.aura_help_allowed(uuid, integer, integer, text) from authenticated;
