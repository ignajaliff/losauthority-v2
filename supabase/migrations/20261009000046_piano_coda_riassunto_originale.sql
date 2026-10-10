-- ============================================================================
-- 0046 · La coda del piano parte anche col solo riassunto originale (09/10/2026)
--
-- Le call che arrivano SENZA cliente (invitati con email non del gestionale)
-- hanno il riassunto di Fathom in originale ma non tradotto: la traduzione si
-- fa solo per i clienti, per non pagarla su call che forse non lo sono. Quando
-- il team le assegna a mano, la coda chiedeva il riassunto tradotto e bisognava
-- premere anche «Scarica riassunto». Ora basta assegnare: la call entra in coda
-- con l'originale e `aura-compiti` traduce il riassunto lei stessa prima di
-- scrivere il piano (così la scheda mostra anche il riassunto in italiano).
-- ============================================================================

create or replace function private.chiamate_piano_in_coda()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.cliente_id is not null
     and (new.riassunto is not null or new.riassunto_originale is not null or new.trascrizione is not null)
     and new.piano_stato is null then
    new.piano_stato := 'da_generare';
    new.piano_errore := null;
  end if;
  return new;
end;
$$;

create or replace trigger chiamate_piano_in_coda
  before insert or update of cliente_id, riassunto, riassunto_originale, trascrizione, piano_stato on public.chiamate
  for each row execute function private.chiamate_piano_in_coda();

create or replace trigger chiamate_piano_avvia
  after insert or update of cliente_id, riassunto, riassunto_originale, trascrizione, piano_stato on public.chiamate
  for each row execute function private.chiamate_piano_avvia();
