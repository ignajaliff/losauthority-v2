-- ============================================================================
-- 20260926000012 · Contenuti: script e riferimenti
--
-- `script`: il testo completo del video (fase script).
-- `riferimenti`: lista di link di ispirazione, uno per elemento (text[] come
-- `clienti.tags`: una lista semplice non merita una tabella né un jsonb).
-- ============================================================================

alter table public.contenuti
  add column script text check (script is null or length(script) <= 20000),
  add column riferimenti text[] not null default '{}' check (cardinality(riferimenti) <= 30);

comment on column public.contenuti.script is 'Testo completo del video.';
comment on column public.contenuti.riferimenti is 'Link di riferimento/ispirazione, uno per elemento.';
