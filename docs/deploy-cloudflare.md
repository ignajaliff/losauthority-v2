# Deploy del gestionale en Cloudflare

El frontend (React + Vite 6) se publica como **Cloudflare Worker con static assets**: no hay código de servidor, solo los archivos de `dist/`. El backend sigue en Supabase (base de datos, auth, Edge Functions) y no cambia.

## Qué hay en el repo

| Archivo | Para qué |
|---|---|
| `package.json` | `vite` 6.4.4, `@vitejs/plugin-react` 5.2.0 (la 6 solo funciona con Vite 8), `@cloudflare/vite-plugin` y `wrangler` |
| `vite.config.ts` | plugin `cloudflare()`; el build **falla** si faltan `VITE_SUPABASE_URL` o `VITE_SUPABASE_ANON_KEY` (sin ellas la app quedaría en blanco); chunks separados para react, supabase y la librería de UI |
| `wrangler.jsonc` | nombre `losauthority-v2` (igual que el proyecto en Cloudflare), `assets.directory: "./dist"` y `not_found_handling: "single-page-application"`: cualquier ruta (`/area/...`, `/contratto/:token`, `/stampa/...`) responde con `index.html`. |
| `.node-version` | Node 22.16.0 en el build de Cloudflare (`wrangler` necesita Node 22 o más) |
| `public/_headers` | `noindex`, sin iframes de otros sitios, `nosniff`, el token de los contratos no sale en el Referer |
| `src/main.tsx` | tras un deploy nuevo, una pestaña vieja que no encuentra un chunk se recarga sola una vez |

`npm run build` deja en `dist/` la web y un `wrangler.json` generado (que no se publica: lo excluye `dist/.assetsignore`). `npx wrangler deploy` usa ese archivo.

## Opción A: desde GitHub (recomendada)

1. **Subir el código**: todo el proyecto tiene que estar commiteado (incluidos `package.json` y `package-lock.json` juntos) en un repo **privado** de GitHub. El repo contiene documentos internos (PDF de clientes, `.skill`): no hacerlo público. `.env`, `dist/` y `node_modules/` ya están en `.gitignore`.
2. Cloudflare → **Workers & Pages → Create → Import a repository** → elegir el repo.
   - Nombre del proyecto: **`losauthority-v2`** (el mismo de `wrangler.jsonc`) (no `los-authority`: ese Worker ya existe y sirve la landing `wesleycaicedo.com`).
   - Build command: `npm run build` (**obligatorio**: si queda vacío, el deploy falla con *«The `assets` property in your configuration is missing the required `directory` property»*, porque `wrangler` lee `wrangler.jsonc` sin el `wrangler.json` que genera el build)
   - Deploy command: `npx wrangler deploy`
   - Alternativa en un solo campo: Deploy command `npm run deploy` (compila y despliega), con el Build command vacío
   - Root directory: vacío (la raíz)
3. **Variables del build** (Settings → Build → *Build variables and secrets*, no las de runtime):
   - `VITE_SUPABASE_URL` = `https://tcvftvvbheacsjbadtfg.supabase.co`
   - `VITE_SUPABASE_ANON_KEY` = la clave **publishable** (`sb_publishable_…`) de Supabase → Project Settings → API Keys, la misma del `.env` local. Nunca la secret ni la service_role.
   Son públicas (acaban dentro del JS), se pueden poner como texto. Si se cambian, hay que relanzar el deploy: Vite las fija al compilar.
4. **Dominio**: Settings → Domains & Routes → Add → Custom domain → `app.wesleycaicedo.com` (si la zona `wesleycaicedo.com` está en la misma cuenta, el DNS se crea solo).

## Opción B: desde el Mac, sin GitHub

Necesita Node 22 (el Mac tiene Node 20, que sirve para `npm run dev` y `npm run build` pero no para `wrangler`):

```
nvm install 22 && nvm use 22
npm run build            # usa el .env local
npx wrangler login
npx wrangler deploy
```

## En Supabase, antes de dar el link a nadie

1. **Authentication → Sign In / Providers → «Allow new users to sign up» = OFF.** Con la clave publicable dentro del JS, cualquiera podría crearse una cuenta cliente y gastar Anthropic y Apify. Las cuentas las crea el team desde el gestionale (`gestione-utenti`, con service role), no les afecta.
2. **Edge Functions → Secrets → `SITE_URL`** = `https://app.wesleycaicedo.com` (sin barra final; mientras no haya dominio, la URL `*.workers.dev`). Lo usan los links de los avisos de Telegram, de los recordatorios y del contrato firmado.
3. **Authentication → URL Configuration**: Site URL = el mismo dominio; Redirect URLs = `https://app.wesleycaicedo.com/**` y `http://localhost:5173/**`.
4. Los links de contrato y de acceso que copia Wesley salen del dominio desde el que trabaja (`window.location.origin`): trabajar siempre desde `app.wesleycaicedo.com`, no desde una URL de preview.

Las Edge Functions aceptan cualquier origen (CORS `*`): no hay que tocar nada para el dominio nuevo. La sesión de Supabase vive en el navegador por dominio: en el dominio nuevo hay que volver a entrar.

## Probado (07/10/2026)

`npm ci` limpio con el lockfile nuevo (Node 20, 22 y 24); build en una copia limpia de los archivos que irían al repo, con Node 22 (falla sin las variables, pasa con ellas); `wrangler deploy --dry-run` (193 archivos); `vite preview` en el runtime de Cloudflare: todas las rutas profundas devuelven la app, cabeceras de `_headers` aplicadas, `_headers`/`wrangler.json` no se publican; login real de un cliente en Chrome headless y las 12 páginas del área cliente sin errores, recarga directa de una ruta profunda, 375 px sin scroll horizontal; `npm run dev` con Node 20.
