# Runbook di cutover — dal gestionale Next (wesleycaicedo.com) al v2

Obiettivo: un solo giorno di passaggio, il vecchio progetto Supabase `zmisvqovyxlviqsenmyq` resta in pausa 30 giorni per rollback.

## Prima del cutover (si può fare con calma)

1. **Dashboard Supabase progetto nuovo `tcvftvvbheacsjbadtfg`**
   - Authentication → Sign In / Providers → "Allow new users to sign up" = **OFF**.
   - Authentication → Passwords → Leaked password protection ON, minimo 8 caratteri.
   - Authentication → Email OTP expiry ≤ 1 ora.
   - Authentication → URL Configuration → Site URL = `https://app.wesleycaicedo.com`, redirect URLs idem.
2. **Secret delle Edge Functions** (Edge Functions → Secrets): tutti quelli elencati in `docs/edge-functions.md`. Generare `CRON_SECRET` e `CALENDAR_SYNC_SECRET` nuovi (32+ caratteri casuali).
3. **Vault**: `select vault.create_secret('<CRON_SECRET>', 'cron_secret');` (stesso valore del secret).
4. **Deploy frontend** su Cloudflare Workers (static assets, `@cloudflare/vite-plugin`, Vite 6) con `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` del progetto nuovo come *build variables*, dominio `app.wesleycaicedo.com`. Build: `npm run build`, deploy: `npx wrangler deploy`. Il fallback SPA è in `wrangler.jsonc`. Passi completi in [deploy-cloudflare.md](deploy-cloudflare.md).
5. **Prova generale della migrazione**: `npm run migrate:data -- --dry-run` poi `--esegui` sul progetto nuovo; verificare i conteggi; si può ripetere (idempotente). Poi svuotare se si vuole ripartire puliti prima del giorno X (o lasciare: la migrazione finale aggiorna).
6. Verificare a mano ogni pantalla con l'account admin e con un account cliente di prova.

## Il giorno del cutover

1. Avvisare il team: 1 ora di congelamento (niente modifiche sul vecchio).
2. `npm run migrate:data -- --esegui` (dati + file dei bucket + utenti).
3. Comunicare le **password temporanee** agli utenti (l'API non migra gli hash) oppure far usare "Reset password" dallo staff.
4. ✅ Applicata il 25/09/2026: `supabase/migrations/20260924000010_cron_jobs.sql` (secret `cron_secret` in Vault). Verificare `select * from cron.job;`.
5. Sul progetto vecchio: `select cron.unschedule(jobname) from cron.job;` (spegne i 5 job).
6. **Webhook Fathom**: lanciare `select private.chiama_edge_function('fathom-webhook-setup')` nel SQL Editor (registra via API il webhook verso `fathom-webhook?token=…`, idempotente; la risposta in `net._http_response` elenca anche gli altri webhook dell'account); rimuovere il vecchio della v1 via API (`DELETE /external/v1/webhooks/{id}`).
7. **Webhook Telegram**: `https://api.telegram.org/bot<TOKEN>/setWebhook?url=https://tcvftvvbheacsjbadtfg.supabase.co/functions/v1/telegram-webhook&secret_token=<TELEGRAM_WEBHOOK_SECRET>`.
8. **Google Apps Script** (`integrations/google-calendar` nel vecchio repo): cambiare URL in `https://tcvftvvbheacsjbadtfg.supabase.co/functions/v1/calendar-sync` e il secret.
9. Lanciare a mano dal gestionale: Lezioni → Sincronizza ora; e le funzioni `notion-compiti` e `fathom-autoassign` (da un utente team, POST con il JWT) per ripopolare gli snapshot.
10. Sito pubblico (Next): far puntare il link "Login" a `https://app.wesleycaicedo.com/auth/login` (o redirect da `/login`).
11. Smoke test: login admin, staff, cliente; scheda cliente; Finance; area cliente; un Telegram di prova.

## Dopo

- Mettere in **pausa** il progetto vecchio dopo 7 giorni senza problemi; eliminarlo dopo 30.
- Cloudflare Worker `los-authority`: lasciarlo per la landing; rimuovere i secret delle integrazioni (Notion, Anthropic, Fathom, Telegram, Apify) che non servono più lì.
- Aggiornare `CLAUDE.md` (Stato attuale) e chiudere l'inventario funzionale spuntando la paridad.
