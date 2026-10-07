-- ============================================================================
-- 20260925000009 · Una sola nota per cliente: resta `clienti.note`
--
-- Decisione 26/09/2026: le "note interne" datate (note_clienti) si eliminano;
-- il team scrive i suoi appunti nel campo Note della scheda (clienti.note).
-- Le eventuali note esistenti si accodano al campo prima di eliminare la tabella.
-- ============================================================================

update public.clienti c
set note = nullif(
  concat_ws(
    E'\n\n',
    nullif(c.note, ''),
    (select string_agg(format('[%s] %s', to_char(n.created_at, 'DD/MM/YYYY'), n.testo), E'\n\n' order by n.created_at)
       from public.note_clienti n where n.cliente_id = c.id)
  ),
  ''
)
where exists (select 1 from public.note_clienti n where n.cliente_id = c.id);

drop table public.note_clienti;
