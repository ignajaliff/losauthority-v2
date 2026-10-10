-- ============================================================================
-- 0045 · Coda del piano d'azione: correzioni dopo la revisione (09/10/2026)
--
--   * Il trigger che avvia subito la Edge Function era `update of piano_stato`:
--     in Postgres scatta solo se la colonna è nel SET dell'UPDATE, e quando è il
--     trigger BEFORE a mettere `da_generare` (update di `riassunto` o di
--     `cliente_id`: webhook, «Scarica riassunto», assegnazione a mano) non
--     scattava. Ora ascolta anche quelle colonne.
--   * `piano_tentativi`: quante volte la funzione ha preso in carico la call.
--     Un'elaborazione che muore a metà (limite di tempo) lasciava la riga
--     `in_corso` e il cron la riprendeva ogni 10 minuti all'infinito, pagando
--     Claude ogni volta; dopo 3 tentativi passa a `errore`.
--   * Le call già presenti con cliente e riassunto entrano in coda (il trigger
--     BEFORE agisce solo su insert/update): oggi nessuna, è per completezza.
-- ============================================================================

create or replace trigger chiamate_piano_avvia after insert or update of cliente_id, riassunto, piano_stato on public.chiamate
  for each row execute function private.chiamate_piano_avvia();

alter table public.chiamate
  add column piano_tentativi smallint not null default 0 check (piano_tentativi between 0 and 20);
comment on column public.chiamate.piano_tentativi is 'Quante volte aura-compiti ha preso in carico la call; dopo 3 la coda la mette in errore.';

update public.chiamate
   set piano_stato = 'da_generare'
 where cliente_id is not null and riassunto is not null and piano_stato is null;
