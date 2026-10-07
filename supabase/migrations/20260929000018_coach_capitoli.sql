-- ============================================================================
-- 20260929000018 · Wesley Coach: il minuto della lezione
--
-- Dieci lezioni Skool hanno nella descrizione i capitoli con il minutaggio
-- ("0:27:40 educare e qualificare il cliente alla vendita"). Quando Aura
-- consiglia una lezione per UN capitolo, salva anche quel capitolo così l'app
-- dice al cliente da che minuto guardare (il link Skool non può partire da lì).
--
-- `lezioni_capitoli` va in parallelo a `lezioni_ids` (stessa lunghezza, o
-- vuoto): l'elemento i è "tempo titolo" ("27:40 educare e qualificare…")
-- oppure '' se la lezione è consigliata per intero. Stessa eccezione lista di
-- clienti.tags: il cliente ha chiesto una sola tabella per questa pagina.
-- ============================================================================

alter table public.coach_messaggi
  add column lezioni_capitoli text[] not null default '{}'
    check (cardinality(lezioni_capitoli) = 0 or cardinality(lezioni_capitoli) = cardinality(lezioni_ids));

comment on column public.coach_messaggi.lezioni_capitoli is 'Per ogni lezione consigliata (stesso indice di lezioni_ids): "tempo titolo" del capitolo da cui guardare, oppure stringa vuota.';
