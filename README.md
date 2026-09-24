# Los Authority — Gestionale v2

Gestionale + area cliente + automazioni Aura per il percorso Los Authority di Wesley Caicedo.
Stack: React 18 · Vite · TypeScript · Tailwind 4 · shadcn/ui · Supabase · React Query.

Leggi `CLAUDE.md` per contesto, regole (`ai-pmp/`) e stato. Contratto backend in `docs/edge-functions.md`.

```bash
npm install
cp .env.example .env   # compilare con URL e anon key del progetto Supabase
npm run dev
```

## Migrazione dati

Porta i dati dal progetto Supabase precedente (`../los-authority`) a questo. Lo script è idempotente: si può rilanciare senza duplicare (upsert per id; gli utenti sono cercati per email).

```bash
cp scripts/.env.migrate.example scripts/.env.migrate   # service role key dei due progetti (gitignorato)
npm run migrate:data                                   # dry-run: piano e conteggi, nessuna scrittura
npm run migrate:data -- --esegui                       # esegue la migrazione
```

Alla fine stampa la tabella vecchio/nuovo/saltati, le righe saltate con il motivo e le **password temporanee** degli utenti creati (le password non si possono copiare via API: recapitarle o far usare il reset). `hub_compiti` e le lezioni Skool non vengono migrati: si rigenerano lanciando le Edge Function `notion-compiti` e `skool-lezioni`.
