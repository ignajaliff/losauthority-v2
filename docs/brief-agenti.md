# Brief comune per chi sviluppa un modulo (umano o agente)

Leggi PRIMA, nell'ordine: `CLAUDE.md`, `ai-pmp/rules.txt`, `ai-pmp/frontend-rules.txt`, `ai-pmp/supabase-rules.txt`, `ai-pmp/error-handling.txt`, `ai-pmp/naming-rules.txt`, `docs/edge-functions.md`. Il sistema da replicare è in `../los-authority` (Next.js): leggi il codice del dominio che ti tocca e replica il comportamento, non la struttura.

## Cosa NON fare
- Non toccare file fuori dalla tua cartella `src/features/<dominio>/` (o `supabase/functions/<nome>/`), salvo dove il tuo brief lo dice esplicitamente.
- Non modificare `src/app/routes.tsx`, `src/shared/**`, `src/integrations/**`, `src/lib/**`, le migrazioni applicate, `CLAUDE.md`.
- Non eseguire `npx shadcn add`: usa i componenti già in `src/shared/components/ui/` (leggi il file per l'API: sono shadcn "base-nova" su Base UI, non Radix). Un componente che manca lo scrivi nel tuo dominio.
- Non installare dipendenze. Non fare commit. Non creare tabelle né policy: lo schema è chiuso (se ti manca qualcosa, dillo nel report finale).
- Niente `any`, niente colori hardcoded, max 300 righe per file, UI in ITALIANO.

## Struttura di un dominio
```
src/features/<dominio>/
  pages/<Nome>Page.tsx     ← default export, il nome del file è fissato in routes.tsx
  components/              ← smart components
  hooks/use<Entita>.ts     ← React Query; query key ["<dominio>", "<entita>", id?]
  schema.ts                ← Zod
  types.ts                 ← tipi del dominio (Tables<"tabella"> da @/integrations/supabase/types)
  index.ts                 ← export pubblici del dominio (solo ciò che altri domini importano)
```

## Pattern obbligatori
- Dati: `useQuery`/`useMutation` in `hooks/`, mai Supabase dentro i componenti. Errori gestiti nel hook: `if (error) throw error`.
- Mutation: `toast.success("…")` + `queryClient.invalidateQueries`; `onError` → `toast.error("Titolo", { description: MESSAGGIO_ERRORE_GENERICO })` + `logDev(error)` (`@/shared/utils/errors`).
- Lettura: `isLoading` → `SkeletonRighe`/`SkeletonBlocco`; `isError` → `ErroreCaricamento`; vuoto → `StatoVuoto` (tutti in `@/shared/components/layout/StatoCaricamento`).
- Form: React Hook Form + Zod con `Form, FormField, FormItem, FormLabel, FormControl, FormMessage` da `@/shared/components/ui/form`. Errori inline, mai toast.
- Auth: `useAuth()` da `@/features/auth` → `{ utente: { id, email, nombre, rol }, session }`; `esFinance(rol)`, `esTeam(rol)`.
- Edge Functions: `supabase.functions.invoke("<nome>", { body })`; la risposta è `{ ok, ... }` o `{ ok:false, error }` → mostra `error` all'utente.
- Storage: file nominati `{cartella}/{crypto.randomUUID()}.{ext}`; lettura con `supabase.storage.from(bucket).createSignedUrl(path, 60)`.
- Soldi: `formatCurrency`, `sumImporti` da `@/shared/utils/formatCurrency`; date con `@/shared/utils/formatDate`.
- Intestazione pagina: `PageHeader` da `@/shared/components/layout/PageHeader`.
- Tipi DB: `import type { Tables, TablesInsert } from "@/integrations/supabase/types"`.

## Prima di dichiarare finito
1. `npm run typecheck` passa (0 errori nel TUO dominio; ignora errori di altri domini in corso).
2. Nessun file > 300 righe, nessun `any`, nessun import rotto.
3. Report finale: elenco file creati e funzionalità coperte, cosa manca rispetto al brief, cosa hai dovuto assumere.
