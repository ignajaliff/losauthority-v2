-- ============================================================================
-- 0048 · Memoria del webhook Fathom registrato (09/10/2026)
--
-- L'API di Fathom non elenca i webhook (GET /webhooks → 404): per non crearne
-- due uguali, `fathom-webhook-setup` ricorda qui l'id di quello creato e la
-- data. Una riga sola (impostazioni_app), scrive solo il service role.
-- ============================================================================

alter table public.impostazioni_app
  add column fathom_webhook_id text check (fathom_webhook_id is null or length(fathom_webhook_id) <= 100),
  add column fathom_webhook_registrato_il timestamptz;
comment on column public.impostazioni_app.fathom_webhook_id is 'Id del webhook creato su Fathom da fathom-webhook-setup (per non registrarlo due volte).';
