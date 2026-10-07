-- ============================================================================
-- 0035 · Telefono del lead nel CRM del cliente (06/10/2026)
--
-- Il cliente annota anche il numero di telefono (spesso i lead arrivano da
-- WhatsApp). Facoltativo: cifre, spazi, +, -, punti e parentesi.
-- ============================================================================

alter table public.crm_lead
  add column telefono text check (telefono is null or telefono ~ '^\+?[0-9 ().-]{5,30}$');
comment on column public.crm_lead.telefono is 'Numero di telefono del lead (facoltativo), come lo scrive il cliente.';
