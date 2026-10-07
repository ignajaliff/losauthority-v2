-- ============================================================================
-- 0033 · Follower: quale profilo è stato letto (06/10/2026)
--
-- Se il team cambia `clienti.instagram`, le letture del profilo vecchio non
-- devono finire nella stessa linea del grafico: ogni riga ricorda l'handle
-- letto (in minuscolo) e il frontend mostra solo quelle del profilo attuale.
-- Le righe senza profilo (prima di questa migrazione) valgono per il profilo attuale.
-- ============================================================================

alter table public.follower_rilevazioni
  add column profilo text check (profilo is null or profilo ~ '^[a-z0-9._]{1,30}$');
comment on column public.follower_rilevazioni.profilo is 'Handle Instagram letto (minuscolo, senza @). Il grafico mostra solo le letture del profilo attuale del cliente.';
