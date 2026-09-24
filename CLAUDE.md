# CLAUDE.md — Hoja de ruta del proyecto

> Este archivo es leído automáticamente por Claude al iniciar cualquier conversación en este proyecto.
> Contiene el contexto del sistema, las decisiones tomadas y el estado actual del desarrollo.
> **Mantenerlo actualizado es obligatorio** — es la memoria del proyecto entre sesiones.

---

## Proyecto

**Nombre**: Los Authority — Gestionale v2
**Tipo**: Sistema de gestión a medida (gestionale + área cliente + automatizaciones IA)
**Cliente**: Wesley Caicedo (wesleycaicedo.com)
**Desarrollado por**: Nuvvora
**Inicio**: 24/09/2026

### Descripción del sistema

Gestionale con el que Wesley y su staff siguen a los clientes del percorso de consultoría **Los Authority** (6 semanas, 4 call): pipeline de leads, ficha del cliente, onboarding en 3 fichas, llamadas Fathom, tareas del hub Notion, finanzas (facturas, gastos, F24) y lecciones Skool. Una asistente IA, **Aura**, escribe análisis, documentos del hub y tareas. Los clientes entran a su área para completar las fichas y ver su avance.

Rewrite del sistema anterior (Next.js en `../los-authority`) sobre un proyecto Supabase nuevo. Inventario funcional de paridad: https://claude.ai/code/artifact/4ec05a70-9294-4e7a-8b6b-fdb9de99e263

**Idioma**: la UI es en **italiano** (los usuarios son italianos). El código y los comentarios en italiano/español según el kit; nombres de tablas y columnas en italiano (conservados del sistema anterior para facilitar la migración de datos).

---

## Reglas del proyecto

Este proyecto respeta estrictamente los siguientes documentos. Leerlos antes de hacer cualquier cambio:

* [ai-pmp/rules.txt](ai-pmp/rules.txt) — Stack, arquitectura general y reglas de código
* [ai-pmp/frontend-rules.txt](ai-pmp/frontend-rules.txt) — Componentes, formularios, estado y UI
* [ai-pmp/supabase-rules.txt](ai-pmp/supabase-rules.txt) — Base de datos, RLS, seguridad y queries
* [ai-pmp/security-rules.txt](ai-pmp/security-rules.txt) — Signup, trampas de RLS, storage, hardening y auditoría
* [ai-pmp/error-handling.txt](ai-pmp/error-handling.txt) — Manejo de errores y estados de carga
* [ai-pmp/naming-rules.txt](ai-pmp/naming-rules.txt) — Convenciones de nombres
* [ai-pmp/git-rules.txt](ai-pmp/git-rules.txt) — Commits y ramas
* [docs/edge-functions.md](docs/edge-functions.md) — Contrato de las Edge Functions (frontend ↔ backend)

---

## Stack del proyecto

* React 18 + Vite 8 + TypeScript strict
* Tailwind CSS 4 (`@tailwindcss/vite`) + shadcn/ui (estilo `base-nova`, Base UI; componentes en `src/shared/components/ui/`)
* Supabase: auth + Postgres + Storage + Edge Functions (Deno) + pg_cron
* TanStack React Query · React Hook Form + Zod · React Router v6 · sonner (toast) · recharts · date-fns · lucide-react

Proyecto Supabase: `tcvftvvbheacsjbadtfg` (LosAuthority, eu-central-1). Cliente único en `src/integrations/supabase/client.ts`, tipos generados en `types.ts` (`npm run db:types`).

---

## Comandos

```
npm run dev          → servidor de desarrollo
npm run build        → build de producción (debe pasar sin errores antes de entregar)
npm run typecheck    → verificación de tipos (correr antes de entregar cualquier cambio)
npm run lint         → oxlint
npm run db:types     → regenerar src/integrations/supabase/types.ts (requiere supabase CLI logueada)
```

Migraciones versionadas en `supabase/migrations/` (aplicadas con el MCP; el archivo es la fuente de verdad). Edge Functions en `supabase/functions/`.

---

## Módulos del sistema

| Módulo | Estado | Tablas Supabase | Notas |
|--------|--------|-----------------|-------|
| Auth | Completo | user_roles, private.admin_emails | Login /auth/login, ProtectedRoute, roles admin/staff/staff_fatture/cliente |
| Dashboard | UI lista | vista_clienti, clienti, error_log | Conteos, próximas call, últimos onboarding, errores |
| Pipeline (lead) | UI lista | lead | Kanban por etapa |
| Clienti | UI lista | clienti, tags, clienti_tags, note_clienti, analisi, hub_board, hub_compiti | Lista (vista_clienti) + ficha con tabs |
| Chiamate | UI lista | chiamate, chiamate_azioni, fathom_webhook_log | Tab Call de la ficha |
| Onboarding / Questionari | UI lista | questionario_invii, questionario_risposte, questionario_allegati | 3 fichas: onboarding, avatar_dolori, offerta |
| Area cliente | UI lista | (las mismas + chiamate + fatture propias) | /area, /area/:slug |
| Finance | UI lista | fatture, spese, f24, vista_finanza_mensile | Solo admin y staff_fatture |
| Lezioni | UI lista | lezioni, sync_stati | Solo admin |
| Staff | UI lista | user_roles | Solo admin, via Edge Function gestione-utenti |
| Tag | UI lista | tags, clienti_tags | |
| Errori | UI lista | error_log | Pantalla nueva (no existía) |
| Edge Functions | Completo | — | 16 funciones desplegadas (ver docs/edge-functions.md); faltan los secrets en el dashboard |

Estados posibles: `Pendiente` / `En desarrollo` / `UI lista` (escrito, typecheck ok, sin prueba en browser) / `Completo`

---

## Base de datos — Tablas creadas

```
- user_roles              → un registro por usuario auth: nombre, email, rol
- private.admin_emails    → allowlist: emails que nacen admin
- clienti                 → datos de gestión del cliente (1:1 user_roles): fase, stato_onboarding, prossima_call, contactos, hub Notion
- tags / clienti_tags     → etiquetas reutilizables + tabla puente
- note_clienti            → notas internas del equipo
- analisi                 → análisis estratégico de Aura (markdown), una por cliente
- questionario_invii      → un envío por (cliente, questionario): bozza/inviato
- questionario_risposte   → una fila por respuesta (multi-valor = varias filas con ordine)
- questionario_allegati   → archivos de la sección Materiali (bucket materiali)
- chiamate                → llamadas Fathom con resumen traducido
- chiamate_azioni         → action items de cada llamada
- fathom_webhook_log      → payload crudo de los webhooks (jsonb, es log)
- hub_board / hub_compiti → snapshot de las boards Notion (call 0 = to-do, 1..4) y sus tareas
- lezioni                 → catálogo Skool
- sync_stati              → estado de la última sync por job
- fatture                 → facturas del cliente (PDF en bucket fatture/{cliente_id}/{uuid}.pdf)
- spese                   → gastos fijos y variables (foto en bucket ricevute)
- f24                     → cuotas F24 (PDF en bucket f24)
- lead                    → pipeline comercial
- error_log               → errores de aplicación (context jsonb, es log)
- aura_usage              → rate limit de la ayuda Aura
- vista_clienti           → lista de clientes con estado derivado (compiti x/y, facturas, tags)
- vista_finanza_mensile   → series mensuales para Finance
```

Funciones en `private`: `tiene_rol(text)`, `es_team()`, `es_finance()`, `handle_new_user()`, `fatture_riepilogo(uuid)`, `aura_help_allowed(...)`, helpers de dueño para RLS.

---

## Roles del sistema

| Rol | Permisos |
|-----|----------|
| admin | Todo: gestionale, Finance, Lezioni, Staff |
| staff_fatture | Gestionale + Finance + importes de facturas |
| staff | Gestionale sin importes (ve conteos de facturas, no cifras) |
| cliente | Solo su área: fichas, llamadas, hub, facturas propias |

**Alta de usuarios**: signup público **deshabilitado**. El team crea clientes desde "Nuovo cliente" y el admin crea staff desde "Nuovo staff", ambos vía Edge Function `gestione-utenti` (service role). El trigger `handle_new_user` asigna `admin` si el email está en `private.admin_emails`, si no `cliente`; el staff se promueve después vía service role.

---

## Checklist de seguridad

- [ ] Signup público deshabilitado en el dashboard (verificar `disable_signup` — ver security-rules.txt §1) → **pendiente: hacerlo en el dashboard del proyecto nuevo**
- [x] Ninguna política `FOR ALL` para lecturas, ninguna con `(true)`, ninguna que dependa solo de `auth.uid() IS NOT NULL`
- [x] Buckets de storage privados + signed URLs para datos de clientes
- [x] Tabla `user_roles` con RLS propio: nadie puede modificar su rol desde el cliente
- [x] Función `tiene_rol()` con `SECURITY DEFINER` creada (en schema `private`, EXECUTE solo authenticated)
- [x] Trigger `handle_new_user` creado
- [x] Toda tabla nueva: RLS habilitado + `WITH CHECK` en políticas de escritura
- [x] Toda tabla nueva: trigger de `updated_at` + constraints SQL
- [x] Campos de dinero en `numeric(12,2)`
- [x] `get_advisors` sin alertas de seguridad (24/09/2026)

---

## Decisiones técnicas tomadas

* **Sin JSON para datos estructurados**: respuestas de cuestionarios, tareas del hub, action items y tags son filas. JSON solo en `fathom_webhook_log.payload` y `error_log.context` (logs).
* **Nombres de columnas en italiano**, heredados del sistema anterior (`importo`, `pagata`, `emessa_il`), para una migración de datos uno a uno.
* **Funciones de rol en schema `private`** (no `public`) para que no sean invocables vía RPC por `anon`; `tiene_rol` conserva el nombre del kit.
* **Escrituras privilegiadas solo vía Edge Functions**: alta/baja de usuarios, roles, snapshots de Notion, catálogo Skool, análisis de Aura, error_log.
* **Estado del onboarding y hub Notion viven en `clienti`** (uno por cliente), no en el envío del cuestionario.
* **Cron con pg_cron → Edge Functions** vía `private.chiama_edge_function` y secreto en Vault (`supabase/migrations/pending/`, aplicar al cutover).
* **shadcn estilo base-nova** (Base UI en lugar de Radix): el componente `form` se escribió a mano en `src/shared/components/ui/form.tsx`.
* **Landing pública** queda en la app Next anterior; este gestionale vive en un subdominio.
* React 18 pinneado (el scaffold traía 19) para respetar rules.txt.

---

## Estado actual del desarrollo

**Última sesión**: 24/09/2026
**Próximo paso**: prueba en browser de cada módulo con un usuario admin y uno cliente, configurar secrets de Edge Functions y deshabilitar signup en el dashboard, ensayar `npm run migrate:data -- --dry-run`, luego cutover según docs/cutover.md.

**Lo que está funcionando**:
* Schema v2 aplicado (5 migraciones), advisors de seguridad limpios
* Auth: login, roles, ProtectedRoute, shells del gestionale y del área cliente, rutas lazy
* 13 módulos de frontend escritos (~16k líneas), `npm run typecheck` y `npm run build` en verde, sin `any`, sin archivos > 300 líneas
* 16 Edge Functions desplegadas en el proyecto nuevo (auth propia verificada con smoke test 401)
* `scripts/migrate-data.mjs` idempotente (dry-run por defecto), helper compartido `shared/utils/invocaEdge.ts`

**Lo que está pendiente**:
* Prueba manual en browser de todos los módulos (ningún agente ejecutó `npm run dev`): flujo bozza → invio con RLS real, uploads a buckets, Select de Base UI dentro de los formularios
* Secrets de las Edge Functions en el dashboard (lista en docs/edge-functions.md) y `vault.create_secret` para el cron
* Deshabilitar signup público en el dashboard del proyecto nuevo (security-rules §1)
* Crear el primer usuario admin desde el dashboard (dev@gmail.com está en la allowlist)
* Ensayo de migración de datos, cron jobs (`supabase/migrations/pending/`) y re-registro de webhooks al cutover (docs/cutover.md)
* Repo remoto en GitHub (hoy solo local)

**Problemas conocidos o deuda técnica**:
* Badge "compiti completi" usa la variante `default` porque el tema no tiene token `success`; agregar token en `index.css` si se quiere verde
* Gráfico de Finance con paleta neutra shadcn (`--chart-*`): revisar cuando se inyecte el design system
* `profilo` del cliente: el cálculo determinista solo produce `saturo` o null (el viejo sistema nunca implementó la fase 2 con IA)
* `calendar-sync` no cierra automáticamente las call pasadas de origen manual (el viejo sí)

---

## Instrucciones para la IA

1. **Antes de escribir cualquier código**, leer los documentos de `ai-pmp/` referenciados arriba.
2. **No empezar nuevos módulos** sin que el usuario lo indique explícitamente.
3. **Antes de entregar cualquier cambio**: correr `npm run typecheck` y verificar que no hay imports rotos ni errores. Si el cambio es grande, verificar también que `npm run build` pasa.
4. **Si hay ambigüedad** en un requerimiento, preguntar antes de implementar.
5. **No agregar dependencias nuevas** sin consultarlo primero.
6. **Actualizar la tabla de módulos** de este archivo cuando se complete uno.
7. **El límite es 300 líneas por archivo** — si se supera, dividir en subarchivos o componentes.
8. **Nunca leer, imprimir ni commitear el contenido de `.env`** ni de ningún archivo con credenciales.
9. **Después de cualquier cambio de schema en Supabase**, correr `get_advisors` del MCP y corregir las alertas de seguridad antes de dar por terminada la tarea. Guardar el SQL en `supabase/migrations/`.
10. **Al terminar una sesión de trabajo**, actualizar la sección "Estado actual del desarrollo" de este archivo.
11. **La UI es en italiano.** Etiquetas que Wesley usa (Non iniziato, Hub creato, Fuori target…) conservan su nombre.
