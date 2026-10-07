-- ============================================================================
-- 20260926000011 · Contenuti: data di pubblicazione prevista
--
-- Quando il cliente PREVEDE di pubblicare il video (pianificazione). Distinta
-- da pubblicato_il, che è la data reale. Servirà alla vista calendario del
-- Workflow: i contenuti si dispongono per data prevista.
-- ============================================================================

alter table public.contenuti
  add column pubblicazione_prevista date;

comment on column public.contenuti.pubblicazione_prevista is 'Data in cui il cliente prevede di pubblicare (vista calendario).';
comment on column public.contenuti.pubblicato_il is 'Data reale di pubblicazione: si compila quando lo stato passa a pubblicato.';

create index contenuti_prevista_idx on public.contenuti (cliente_id, pubblicazione_prevista)
  where pubblicazione_prevista is not null;
