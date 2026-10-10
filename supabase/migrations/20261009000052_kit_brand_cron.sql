-- ============================================================================
-- 0052 · Kit Brand: rete di sicurezza per la lettura dei documenti (09/10/2026)
--
-- Il browser chiama `kit-brand-leggi` subito dopo l'upload; se la chiamata si
-- perde (rete, scheda chiusa), il cron riprende ogni 30 minuti i documenti
-- ancora `da_fare` o fermi `in_corso`.
-- ============================================================================
select cron.schedule('kit-brand-leggi', '*/30 * * * *', $$select private.chiama_edge_function('kit-brand-leggi')$$);
