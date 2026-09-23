# Edge Functions — contratto frontend ↔ backend

Tutte in `supabase/functions/<nome>/index.ts`, Deno, moduli condivisi in `supabase/functions/_shared/`.
Il frontend le chiama con `supabase.functions.invoke("<nome>", { body })` (il JWT dell'utente viene allegato da supabase-js).
Risposta sempre `{ ok: true, ...dati }` oppure `{ ok: false, error: "<messaggio per l'utente>" }` con status 4xx/5xx.

## Autenticazione

| Tipo | Come | Funzioni |
| --- | --- | --- |
| Utente loggato (JWT) | `richiediTeam` / `richiediFinance` / `richiediAdmin` / `richiediUtente` da `_shared/supabase.ts` | tutte quelle chiamate dalla UI |
| Job pg_cron | `Authorization: Bearer <CRON_SECRET>` (`richiediCronOTeam`: accetta anche un utente team per il lancio manuale) | payment-reminders, fathom-autoassign, notion-compiti, genera-hub, skool-lezioni |
| Webhook esterno | token proprio nel query/header, `verify_jwt: false` | fathom-webhook, telegram-webhook, calendar-sync |

## Funzioni

| Nome | Auth | Body | Risposta | Effetto |
| --- | --- | --- | --- | --- |
| `gestione-utenti` | team (crea_cliente, reset_password su clienti) · admin (crea_staff, aggiorna_ruolo, elimina_utente, reset_password su staff) | `{ azione: "crea_cliente", email, nombre, password?, telefono?, tag_ids?: string[] }` · `{ azione: "crea_staff", email, nombre, rol: "staff"\|"staff_fatture", password? }` · `{ azione: "aggiorna_ruolo", user_id, rol }` · `{ azione: "reset_password", user_id, password? }` · `{ azione: "elimina_utente", user_id }` | `{ ok, id?, password? }` (password generata = `Los-` + 12 char, mostrata UNA volta) | Admin API auth; per lo staff aggiorna `user_roles.rol` e rimuove la riga `clienti` |
| `aura-analisi` | team | `{ cliente_id }` | `{ ok, contenuto }` | Scrive `analisi` (upsert) dalle 3 schede |
| `aura-compiti` | team | `{ chiamata_id, call_n: 1..4 }` | `{ ok, scritti, totale }` | Piano + espansione in parallelo, scrive nella board Notion, poi rilancia la sync di quel cliente |
| `genera-hub` | cron o team | `{}` (tutti i clienti pronti, max 2) · `{ cliente_id }` (manuale) | `{ ok, esiti: [{ cliente_id, ok, hub_url?, errore? }] }` | Prende un foglio dal pool, lo intesta, Aura scrive i 5 documenti, aggiorna `clienti.notion_hub_url`, `hub_creato_il`, `stato_onboarding='hub_creato'`; Telegram |
| `notion-compiti` | cron o team | `{}` · `{ cliente_id }` | `{ ok, letti, errori }` | Legge le board 1..4 (+ to-do = 0) → `hub_board` + `hub_compiti` (upsert per notion_page_id, cancella i rimossi); avanza `clienti.fase` alla call corrente senza mai tornare indietro né toccare `completato`; Telegram solo se falliscono TUTTI |
| `fathom-webhook` | token Fathom (`?token=` o header `x-fathom-token`) | payload Fathom | `{ ok }` | Log in `fathom_webhook_log`, estrae email, abbina cliente, upsert `chiamate` per `fathom_recording_id`, traduce il riassunto |
| `fathom-autoassign` | cron o team | `{}` | `{ ok, nuove }` | Legge le call recenti dall'API Fathom, salta quelle già presenti, abbina per email; Telegram se ne assegna |
| `fathom-riassunto` | team | `{ chiamata_id }` | `{ ok, riassunto }` | Scarica il riassunto dall'API Fathom, lo traduce in italiano, aggiorna `chiamate` |
| `telegram-webhook` | `x-telegram-bot-api-secret-token` = TELEGRAM_WEBHOOK_SECRET; chat in TELEGRAM_ALLOWED_CHAT_IDS | update Telegram | `{ ok }` | Aura risponde a domande sui numeri con uno snapshot (clienti, fatture, F24, spese, chiamate). Sola lettura |
| `payment-reminders` | cron o team | `{}` | `{ ok, fatture, f24 }` | Telegram con fatture non pagate in scadenza domani e F24 in scadenza domani |
| `skool-lezioni` | cron o admin | `{}` | `{ ok, lezioni, nuove }` | Apify → upsert `lezioni` per `key`; `sync_stati('skool')`; Telegram se nuove o cookie scaduto |
| `calendar-sync` | `Authorization: Bearer <CALENDAR_SYNC_SECRET>` | `{ eventi: [{ inizio: ISO, invitati: string[] }] }` | `{ ok, aggiornati }` | Abbina invitati ↔ email cliente, imposta `prossima_call` (ora italiana salvata come UTC "a muro") con source `calendar`; azzera quelle sparite |
| `spese-scansiona` | finance | `{ storage_path }` (bucket `ricevute`) | `{ ok, spesa }` | Claude vision legge importo/descrizione/data e INSERISCE la spesa variabile con `ricevuta_path` |
| `f24-estrai` | finance | `{ storage_path }` (bucket `f24`) · `{ f24_id }` (rilettura) | `{ ok, righe: F24[] }` | Claude legge il PDF, una riga `f24` per rata; in rilettura aggiorna la riga e aggiunge le rate mancanti |
| `onboarding-completato` | cliente | `{}` | `{ ok, completato: boolean }` | Se le 3 schede sono `inviato`: calcola `profilo`/`ore_operative`, `stato_onboarding='completato'` (solo da nuovo/in_lavorazione), `onboarding_completato_il`; Telegram una sola volta |
| `aura-help` | cliente | `{ domanda, questionario_id, domanda_id }` | `{ ok, risposta }` | Aiuto contestuale mentre compila; rate limit via `private.aura_help_allowed(user, 20, 3600)` |

## Secret da impostare nel progetto (Dashboard → Edge Functions → Secrets)

`CRON_SECRET`, `ANTHROPIC_API_KEY`, `ANTHROPIC_MODEL` (opz.), `NOTION_TOKEN`, `NOTION_WESLEY_USER_ID` (id utente Notion di Wesley per Assigned To), `FATHOM_API_KEY`, `FATHOM_WEBHOOK_TOKEN`, `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`, `TELEGRAM_ALLOWED_CHAT_IDS`, `TELEGRAM_WEBHOOK_SECRET`, `APIFY_TOKEN`, `SKOOL_COOKIES`, `CALENDAR_SYNC_SECRET`, `SITE_URL`.
`SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` sono iniettati automaticamente.

## Regole comuni (dal sistema attuale, non negoziabili)

1. Anthropic sempre in streaming; ogni funzione AI ritorna `null` in errore e il chiamante mostra un messaggio umano. Mai un record a metà.
2. Notion: timeout 20 s + un secondo tentativo. Un cliente che fallisce → `logError(…, { silent: true })`; Telegram solo se falliscono tutti.
3. Nessun lavoro dopo la risposta HTTP (niente fire-and-forget).
4. Nel `context` di `logError` mai token, cookie o segreti.
5. Le date "a muro" italiane si salvano come se fossero UTC: non convertire fusi a metà strada.
6. La fase del cliente avanza da sola ma non regredisce mai e non tocca `completato`.
