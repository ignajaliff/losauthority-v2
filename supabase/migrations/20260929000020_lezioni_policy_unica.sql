-- ============================================================================
-- 20260929000020 · lezioni: una sola policy di select
--
-- La migrazione 17 aveva aggiunto "utenti leggono le attive" accanto a "team
-- legge": due policy permissive sulla stessa azione (segnalate dall'advisor di
-- performance). Unite in una: il team legge tutto, gli altri solo le attive.
-- ============================================================================

drop policy "lezioni: team legge" on public.lezioni;
drop policy "lezioni: utenti leggono le attive" on public.lezioni;
create policy "lezioni: attive per tutti, tutte per il team" on public.lezioni for select to authenticated
  using (attiva or (select private.es_team()));
