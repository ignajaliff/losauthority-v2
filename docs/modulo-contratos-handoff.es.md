# Módulo Ofertas y Contratos: guía para portarlo a la v2

Qué hace, cómo está construido en la v1 y qué hay que conservar al reescribirlo con otro stack. La guía de uso para Wesley, en italiano, está en `docs/modulo-contratti.md`.

Todo el código está en `main` (PR #38 a #41 de `Losweb/los-authority`).

## Qué se conserva tal cual y qué se puede reescribir

| Pieza | Archivos | Al portar |
|---|---|---|
| Textos del contrato | `src/lib/contratti/testo-privato.ts`, `testo-piva.ts` | **Copiar sin tocar una coma.** Es lo que firma el cliente |
| Aviso de privacidad | `informativa.ts` | Copiar igual. El contrato cita su URL: `/informativa-privacy` |
| Datos del proveedor | `fornitore.ts` | Copiar igual |
| Composición del documento | `componi.ts`, `documento.ts` | Lógica pura, sin framework. Se puede copiar |
| Validación | `validazione.ts` | Lógica pura. Se usa en cliente y en servidor |
| Generador de PDF | `pdf.ts`, `pdf-contratto.ts`, `pdf-metriche.ts` | Lógica pura, sin dependencias. Se puede copiar o sustituir |
| Tipos | `tipi.ts`, `modelli.ts` | Copiar |
| Operaciones de servidor | `firma.ts`, `operazioni.ts`, `actions.ts`, `data.ts` | Reescribir para tu backend, manteniendo las reglas de abajo |
| Interfaz | `src/components/contratti/*`, páginas en `src/app` | Reescribir con tus componentes |

Los archivos "lógica pura" no importan nada de Next ni de Supabase. Sólo usan `crypto.subtle` e `Intl`.

## El flujo, de principio a fin

1. **Ofertas** (`/admin/offerte`). Wesley define lo que vende: nombre, modelo de contrato y precio. Hoy hay una: UPSCALE, 1.997 €.
2. **Nueva invitación** (`/admin/contratti/nuovo`). Elige una oferta. El sistema crea una fila en `contracts` con un token aleatorio de 32 bytes y **copia** en la fila el nombre de la oferta, el precio y la firma de Wesley. No se pide el nombre del cliente.
3. **Página pública** (`/contratto/[token]`). El cliente:
   - abre el aviso de privacidad y marca que lo ha visto;
   - elige cómo compra: `privato`, `professionista` o `societa`, y confirma una declaración;
   - rellena sus datos y pulsa **Elabora**: el servidor valida, guarda y devuelve el contrato compuesto;
   - lee el contrato, marca dos casillas y dibuja dos firmas. La segunda es la aprobación específica de cláusulas (arts. 1341 y 1342 del Código Civil italiano);
   - pulsa **Scarica il contratto firmato**: se registran las firmas, se genera el PDF y empieza la descarga.
4. **Después de firmar** la página le pide que envíe el PDF por email a Wesley. Wesley recibe un aviso por Telegram sin datos personales.
5. **Segna come pagato** (ficha del contrato). Crea la cuenta del cliente, su ficha con `da_attivare = true` y la factura cobrada. Al cliente no le llega nada.
6. **Attiva**. Wesley marca tres entregas hechas a mano (módulos Skool, grupo WhatsApp, llamadas) y activa. Se guarda la fecha, se calcula el vencimiento a 6 meses y, para privados, el fin del plazo de desistimiento a 14 días. Se genera la contraseña y un mensaje listo para enviar.

Estados de `contracts.status`: `inviato` → `compilato` → `firmato` → `pagato` → `attivo`, más `annullato`.

## Reglas que no se pueden perder

Estas son las que dan valor de prueba al contrato. Si alguna se rompe, el módulo deja de servir.

1. **El texto lo compone siempre el servidor.** El navegador nunca envía el texto. Envía los datos y, al firmar, el hash SHA-256 del texto que mostró. El servidor recompone desde los datos guardados y, si el hash no coincide, rechaza la firma con 409 y devuelve el texto actual.
2. **Al firmar se guarda una instantánea.** `contracts.documento` contiene el texto íntegro en bloques y `testo_sha256` su hash. Un contrato firmado no cambia aunque después se edite la plantilla.
3. **La firma es un cambio de estado condicional.** `UPDATE … WHERE status = 'compilato'`. Un doble clic devuelve la misma firma, no crea otra.
4. **El PDF es reproducible.** Mismos datos, mismos bytes: sin fecha del sistema ni números aleatorios. Se guarda en el bucket privado y se guarda su hash. Si falta el archivo, se regenera idéntico.
5. **De la firma dibujada sólo se guarda la forma.** Coordenadas del trazo simplificadas con Ramer-Douglas-Peucker. Nada de tiempos ni presión: así no es un dato biométrico. Lo afirma el aviso de privacidad, así que el código tiene que cumplirlo.
6. **La oferta se copia en la invitación.** Cambiar o borrar una oferta no altera las invitaciones ya enviadas.
7. **Todo dato se valida dos veces**, en el navegador y en el servidor, con la misma función.
8. **Rutas públicas estables.** En la v1 son route handlers, no server actions, para que un despliegue no rompa una página que el cliente tiene abierta.
9. **Retención.** Un job nocturno borra las invitaciones nunca firmadas a los 90 días. Lo promete el aviso de privacidad.

## Cómo se compone el contrato

`componiContratto(tipo, dati, { prezzo, telefonoFornitore })` devuelve un `DocumentoContratto`:

```ts
{
  modello: "upscale-privato-2026.10",   // versión del texto
  corpo: Blocco[],                      // de las partes al último artículo
  approvazione: string,                 // texto de la segunda firma
  allegati: [],                         // hoy vacío
  informativa_versione: "2026.10",
  firmatario_fornitore: string,
  firmatario_cliente: string,
}
```

Un `Blocco` es `{ t: "titolo" | "sezione" | "articolo" | "centro" | "p" | "voce" | "nota", testo }`. Dentro del texto `**así**` marca negrita. De esa misma lista salen tres cosas: el HTML que lee el cliente, el PDF y el texto plano sobre el que se calcula el hash (`testoInChiaro`).

Hay dos textos:

- `privato`: versión consumidor, 16 artículos, con desistimiento de 14 días.
- `professionista` y `societa`: versión con partita IVA, 17 artículos, sin desistimiento. Cambia el bloque de las partes y el art. 6.2.

Las plantillas son funciones que devuelven un template string. Los datos del cliente se limpian antes (`pulisci`) para que no puedan meter marcas de formato.

## Base de datos

Proyecto Supabase `zmisvqovyxlviqsenmyq`. Las migraciones están aplicadas ahí: `contracts_module`, `contracts_policies_retention`, `offers_and_contract_offer`.

**`offers`**: `id`, `created_at`, `nome`, `modello` (clave de `modelli.ts`), `prezzo`, `attiva`.

**`contracts`**, por grupos:

- Invitación: `id`, `created_at`, `created_by`, `token` (único), `status`, `note`.
- Condiciones copiadas: `offer_id`, `offerta`, `modello_contratto`, `programma`, `prezzo`, `durata_mesi`, `firma_fornitore`.
- Datos del cliente: `tipo`, `dati` (jsonb), `cliente_nome`, `cliente_email`.
- Prueba de firma: `aperto_il`, `informativa_letta_il`, `compilato_il`, `firmato_il`, `firma_ip`, `firma_user_agent`, `modello`, `documento` (jsonb), `testo_sha256`, `firma_contratto`, `firma_clausole`, `pdf_path`, `pdf_sha256`.
- Después: `pagato_il`, `invoice_id`, `client_id`, `attivato_il`, `attivazione_consegne`, `scade_il`, `recesso_fino_al`, `annullato_il`.

**`contract_settings`**: una sola fila. `firma` (firma de Wesley), `telefono_fornitore`, `istruzioni_pagamento`.

**`client_details.da_attivare`**: boolean, para que la lista de clientes muestre "Da attivare".

**Storage**: bucket privado `contracts`, ruta `<contract_id>/contratto.pdf`. Sin políticas: sólo service role.

**Permisos (RLS)**: leer y actualizar contratos, roles con acceso a dinero (`admin`, `staff_fatture`). Crear y borrar invitaciones y ofertas, sólo `admin`. La página pública usa service role y la llave es el token.

**pg_cron**: `contracts-unsigned-retention`, cada noche.

Columnas que quedaron sin uso y puedes ignorar: `contracts.penale`, `contracts.riferimento`, `contract_settings.penale_piva`.

## API pública

| Ruta | Qué hace |
|---|---|
| `POST /api/contratto/[token]/dati` | Recibe `{ tipo, dichiarazione, informativa, dati }`. Valida, guarda, pasa a `compilato`. Devuelve `{ documento, sha }` |
| `POST /api/contratto/[token]/firma` | Recibe `{ firma_contratto, firma_clausole, accetto, approvo, sha }`. Firma, genera y archiva el PDF, avisa por Telegram |
| `GET /api/contratto/[token]/pdf` | Devuelve el PDF firmado como adjunto |
| `GET /api/admin/contratti/[id]/pdf` | Lo mismo desde el panel, con sesión |

Una firma tiene esta forma: `{ w, h, tratti: number[][] }`, con cada trazo como `x0,y0,x1,y1…`. La de Wesley lleva además `pieno: true`: sus trazos son contornos cerrados que se rellenan, porque se sacó de una imagen (`scripts/salva-firma-fornitore.mjs`).

## Decisiones de Wesley que conviene no reabrir

- Se dice **programa UPSCALE**, nunca "percorso".
- La página del cliente no muestra precio ni habla de pago. La venta se hace aparte.
- El botón final dice "Scarica il contratto firmato".
- El PDF es corto y sin anexos: contrato, firmas y un registro técnico pequeño en la misma página.
- No hay penalización en cifras ni cláusula de conciliación previa.
- La activación es manual. La llamada 1:1 queda fuera del sistema.
- Para vender otro programa hace falta primero su texto de contrato. Se añade como modelo en `modelli.ts` y se engancha en `componi.ts`.

## Lo que la v1 no hace

- **No envía emails.** El sitio no tiene servicio de correo. Los mensajes se preparan y Wesley los envía.
- **No cierra la cuenta al vencer.** La fecha `scade_il` está guardada; el cierre es manual.
- **Caracteres fuera de Latin-1** pierden el diacrítico en el PDF (Ł sale como L), porque usa las fuentes estándar. Si en la v2 usas una librería con fuentes embebidas, desaparece.

## Abierto

- Wesley está decidiendo si la ficha del cliente debe crearse al firmar en vez de al marcar el pago. Pregúntale antes de portar ese paso.
- Los textos no los ha validado un abogado. La lista de riesgos señalados está en `docs/modulo-contratti.md`.
- En la base de datos hay una tabla `firme_contratti`, un bucket `contratti` y una edge function `firma-contratto` creados el 1 de octubre por otra sesión. Este módulo no los usa. La función acepta escrituras sin autenticación.
- El `.env` local apunta a producción. Para desarrollar la v2 conviene un proyecto Supabase aparte.
