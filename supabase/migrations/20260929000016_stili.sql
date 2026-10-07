-- ============================================================================
-- 20260929000016 · La pagina "Idee" si chiama "Stili"
--
-- Gli "stili" sono i format che il cliente insegna ad Aura con i suoi script e
-- che poi richiama in "Crea idee" con "/". Il nome "idee" confondeva con le
-- proposte (tabella idee): la tabella idee_skill diventa `stili` e
-- idee_messaggi.skill_id diventa stile_id. Stessi dati, stesse policy.
-- ============================================================================

alter table public.idee_skill rename to stili;
comment on table public.stili is 'Pagina Stili: format scritti da Aura a partire da script dello stesso stile. Il cliente li richiama in Crea idee con "/".';

alter table public.stili rename constraint idee_skill_pkey to stili_pkey;
alter table public.stili rename constraint idee_skill_cliente_id_fkey to stili_cliente_id_fkey;
alter index public.idee_skill_cliente_idx rename to stili_cliente_idx;

alter policy "skill: lettura propria o team" on public.stili rename to "stili: lettura propria o team";
alter policy "skill: aggiorna proprietario o team" on public.stili rename to "stili: aggiorna proprietario o team";
alter policy "skill: elimina proprietario o team" on public.stili rename to "stili: elimina proprietario o team";

alter table public.idee_messaggi rename column skill_id to stile_id;
alter table public.idee_messaggi rename constraint idee_messaggi_skill_id_fkey to idee_messaggi_stile_id_fkey;
alter index public.idee_messaggi_skill_idx rename to idee_messaggi_stile_idx;
