-- ============================================================================
-- 0042 · Ricerca TikTok: tre lingue automatiche e una top per lingua (07/10/2026)
--
-- Decisione dell'utente dopo la prima prova con ignaciojaliff29: la ricerca
-- cerca sempre in italiano, inglese e spagnolo (il cliente non sceglie più la
-- lingua) e consegna una top per ogni lingua invece di una top mista, in cui
-- la lingua con più pubblico (lo spagnolo) schiacciava l'italiano.
--   * `ricerche_tiktok.lingue`: fino a 3 lingue (default it, en, es);
--   * `ricerche_tiktok_video.sezione`: nuovo valore `top_lingua`, la lingua
--     della tabella è la colonna `lingua`; `top` e `lingua_target` restano per
--     le ricerche fatte prima di questa migrazione;
--   * la posizione è unica per sezione E lingua (ogni top parte da 1).
-- ============================================================================

alter table public.ricerche_tiktok
  drop constraint ricerche_tiktok_lingue_check,
  add constraint ricerche_tiktok_lingue_check check (cardinality(lingue) between 1 and 3),
  alter column lingue set default '{it,en,es}';

alter table public.ricerche_tiktok_video
  drop constraint ricerche_tiktok_video_sezione_check,
  add constraint ricerche_tiktok_video_sezione_check check (sezione in ('top', 'lingua_target', 'top_lingua', 'fuori_soglia')),
  -- Una top per lingua ha sempre la sua lingua.
  add constraint ricerche_tiktok_video_top_lingua_check check (sezione <> 'top_lingua' or lingua ~ '^[a-z]{2}$'),
  drop constraint ricerche_tiktok_video_ricerca_id_sezione_posizione_key,
  add constraint ricerche_tiktok_video_posizione_key unique nulls not distinct (ricerca_id, sezione, lingua, posizione);

comment on column public.ricerche_tiktok_video.sezione is
  'top_lingua = una top per lingua (la lingua è in `lingua`); fuori_soglia = grossi usciti pochi giorni prima della soglia; top e lingua_target = ricerche fatte prima del 07/10/2026 (top unica mista + migliori nella lingua target).';
