-- ============================================================================
-- 0004 · Hardening post-advisor
-- ============================================================================
-- Funzione provisionata da Supabase nei progetti nuovi: non deve essere chiamabile via API.
revoke execute on function public.rls_auto_enable() from public, anon, authenticated;
-- FK senza indice segnalata dall'advisor.
create index if not exists note_clienti_autore_idx on public.note_clienti (autore_id);
