-- ============================================================================
-- 0040 · Ricerca TikTok: eliminare non deve restituire la ricerca dei 15 giorni
--
-- La quota (una ricerca ogni 15 giorni) si conta sulle righe di
-- `ricerche_tiktok`: se il cliente potesse eliminare una ricerca recente ne
-- potrebbe lanciare subito un'altra. Si eliminano solo le ricerche in errore
-- (che non contano) o più vecchie di 15 giorni.
-- ============================================================================

alter policy "ricerche tiktok: elimina il proprietario" on public.ricerche_tiktok
  using (
    cliente_id = (select auth.uid())
    and (stato = 'errore' or created_at < now() - interval '15 days')
  );
