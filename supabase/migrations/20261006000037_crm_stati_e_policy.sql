-- ============================================================================
-- 0037 · Sezione «Clienti»: stati del documento GDPR e fine dell'accesso del team (06/10/2026)
--
-- Seconda metà della 0036, separata perché modifica dati e policy esistenti.
-- FINCHÉ NON È APPLICATA IL BLOCCO DI ACCETTAZIONE NON VALE: le vecchie policy
-- «proprietario o team» restano e, in OR con le nuove, lasciano leggere i
-- contatti al proprietario senza accettazione e a tutto il team.
--   * stati nuovo/in_trattativa/chiuso/perso (i contatti di prova si convertono:
--     interessato→nuovo, da_ricontattare→in_trattativa, cliente→chiuso);
--   * canale obbligatorio;
--   * via le 4 policy vecchie: restano solo quelle della 0036 (proprietario con
--     accettazione valida; cancellazione sempre per il proprietario). Il team
--     vede i contatti solo con crm_contatti_assistenza (accesso registrato).
-- Non cancella nessun contatto né nessuna tabella.
-- ============================================================================

alter table public.crm_lead drop constraint crm_lead_stato_check;
update public.crm_lead set stato = case stato
  when 'interessato' then 'nuovo'
  when 'da_ricontattare' then 'in_trattativa'
  when 'cliente' then 'chiuso'
  else stato end;
alter table public.crm_lead alter column stato set default 'nuovo';
alter table public.crm_lead add constraint crm_lead_stato_check check (stato in ('nuovo', 'in_trattativa', 'chiuso', 'perso'));

update public.crm_lead set fonte = 'altro' where fonte is null;
alter table public.crm_lead alter column fonte set not null;

drop policy "crm lead: lettura propria o team" on public.crm_lead;
drop policy "crm lead: inserisce proprietario o team" on public.crm_lead;
drop policy "crm lead: aggiorna proprietario o team" on public.crm_lead;
drop policy "crm lead: elimina proprietario o team" on public.crm_lead;

-- crm_stato legge solo dati che l'utente può già leggere: non serve SECURITY DEFINER (advisor 0029).
alter function public.crm_stato() security invoker;
