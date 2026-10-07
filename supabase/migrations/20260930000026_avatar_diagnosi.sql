-- ============================================================================
-- 20260930000026 · La diagnosi dell'avatar esce dalla carta del cliente
--
-- La "lettura di Aura per Wesley" (quadro, punti di forza, criticità, quanto è
-- ristretto, come usarlo, da validare) NON deve arrivare al cliente: è materiale
-- per la call. Stava nelle stesse colonne di `avatar`, che il cliente legge via
-- RLS. Ora vive in `avatar_diagnosi` (1:1 con avatar), leggibile SOLO dal team:
-- così la separazione dati/diagnosi del metodo è garantita dal database, non
-- dall'interfaccia. Scrive solo la Edge Function aura-avatar.
--
-- In più il dossier del cliente guadagna le CREDENZE LIMITANTI (cosa l'avatar
-- crede di non poter fare, perché pensa che "per me non funziona"): utili per
-- la comunicazione tanto quanto i dolori.
-- ============================================================================

create table public.avatar_diagnosi (
  avatar_id         uuid primary key references public.avatar (id) on delete cascade,
  quadro            text check (quadro is null or length(quadro) <= 800),
  punti_forza       text[] not null default '{}' check (cardinality(punti_forza) <= 12),
  criticita         text[] not null default '{}' check (cardinality(criticita) <= 12),
  quanto_ristretto  text check (quanto_ristretto is null or length(quanto_ristretto) <= 500),
  come_usarlo       text check (come_usarlo is null or length(come_usarlo) <= 800),
  da_validare       text[] not null default '{}' check (cardinality(da_validare) <= 12),
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
comment on table public.avatar_diagnosi is 'La lettura di Aura per Wesley su un avatar: solo team. Il cliente vede carta e dossier, mai questa.';

create trigger set_updated_at before update on public.avatar_diagnosi
  for each row execute procedure extensions.moddatetime (updated_at);

-- Travaso delle diagnosi già scritte
insert into public.avatar_diagnosi (avatar_id, quadro, punti_forza, criticita, quanto_ristretto, come_usarlo, da_validare)
select id, quadro, punti_forza, criticita, quanto_ristretto, come_usarlo, da_validare
from public.avatar
where quadro is not null or quanto_ristretto is not null or come_usarlo is not null
   or cardinality(punti_forza) > 0 or cardinality(criticita) > 0 or cardinality(da_validare) > 0;

alter table public.avatar
  drop column quadro,
  drop column punti_forza,
  drop column criticita,
  drop column quanto_ristretto,
  drop column come_usarlo,
  drop column da_validare;

alter table public.avatar
  add column credenze_limitanti text[] not null default '{}' check (cardinality(credenze_limitanti) <= 12);
comment on column public.avatar.credenze_limitanti is 'Cosa l''avatar crede di non poter fare / perché pensa che per lui non funzioni (parole sue).';

alter table public.avatar_diagnosi enable row level security;
create policy "avatar diagnosi: solo team" on public.avatar_diagnosi for select to authenticated
  using ((select private.es_team()));
-- Scrive solo la Edge Function (service role): nessuna policy di insert/update/delete per authenticated.
revoke all on public.avatar_diagnosi from anon;

-- Il metodo di Aura: credenze limitanti nel blocco comune, e la diagnosi è per Wesley soltanto.
update public.aura_conoscenza
set contenuto = replace(
  contenuto,
  'C2 — Desideri e trasformazione:',
  'C1 bis — Credenze limitanti: "Cosa pensa questa persona di sé rispetto al problema? Cosa crede di non poter fare, o perché pensa che per lei non funzionerà?" Esempi per sbloccare: "ho già provato tutto", "non ho costanza", "alla mia età è tardi", "quelle cose funzionano solo agli altri". Estrai le convinzioni che la frenano, con le sue parole: sono i contenuti che smontano la scusa prima che la dica.
C2 — Desideri e trasformazione:'
)
where ambito = 'avatar' and titolo = 'Blocco comune — rendere vivo l''avatar';

update public.aura_conoscenza
set contenuto = replace(
  contenuto,
  'Quando la raccolta è completa scrivi il dossier: dati (dichiarati dal cliente) separati dalla diagnosi (la tua lettura per Wesley).',
  'Quando la raccolta è completa scrivi il dossier: dati (dichiarati dal cliente, li vede lui) separati dalla diagnosi (la tua lettura per Wesley: la vede SOLO Wesley nel gestionale, il cliente no, quindi puoi essere del tutto onesta).'
)
where ambito = 'avatar' and titolo = 'Il dossier finale e la diagnosi';
