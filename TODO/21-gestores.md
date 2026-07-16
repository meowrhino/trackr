# 21 — Cuentas gestor (compartir con tu gestoría)

## Estado: ✅ v1 implementada (2026-07-16) · backend + frontend en ramas `gestores`
## Primer caso real: Diega (beta del rol gestor) — pendiente solo desplegar y probar en producción

> **Implementado y verificado E2E en local** (wrangler dev + navegador): toggle en signup,
> cuenta gestora con par ECDH y código auto-publicado al entrar, activación por admin,
> vínculo persona→gestora con confirmación de huella y alcance, blob sombra cifrado en cada
> sync, cartera de la gestora con visor protegido (banner + restauración; el sync del gestor
> se pausa para no contaminar su cuenta). Alcance fiscal verificado estanco (0 horas, 0 notas,
> 0 journey). Tests: 29/29 unit + 22/22 E2E backend.
> **Pendiente:** desplegar (migrate-gestores.sql en D1 prod + deploy + merge frontend),
> Etapa A de autoría (audit[]), Etapa B (edición del gestor por operaciones), y verificar el
> renderizado del modal de confirmación en un navegador real (posible artefacto de captura).
> **Decisión v1:** un email por cuenta; segundo rol = email distinto o alias `+gestora@`.

---

## La idea

Dos tipos de cuenta en TRACKR: **persona** (lo que existe hoy) y **gestor**. Una persona puede
vincularse a un gestor introduciendo su **código público** en Configuración; a partir de ahí el
gestor ve (y en una fase posterior, edita) los datos de esa persona. Todo con consentimiento
explícito por cliente y revocable — no existe un "superadmin que lo ve todo": el zero-knowledge
se mantiene porque se comparte **hacia la clave pública del gestor**, nunca entregando secretos.

Estrategia: construirlo genérico desde el día uno (el rol, no un hack para un caso). La primera
gestora se da de alta por el flujo normal; abrir el rol a más gestores después no requiere
cambios de esquema.

---

## Decisiones tomadas

- **Cuentas separadas, sin switch.** Una cuenta es persona O gestor desde su creación. Quien
  quiera ambos roles se abre dos cuentas. Simplifica todo (una cuenta gestor no tiene datos
  fiscales propios; tiene par de claves y cartera de clientes).
  - ⚠️ Detalle pendiente: `users.email` es único en D1. Si la gestora quiere además su cuenta
    persona, necesita otro email — o relajamos la unicidad a (email, role). Decidir al implementar.
- **Toggle en el signup** (persona por defecto, gestor como opción). El gating existente cubre el
  abuso: los registros nacen `active=0` y los aprueba el admin desde el panel; `SIGNUPS_OPEN`
  sigue controlando la apertura general. Un gestor sin grants no ve nada de nadie.
- **Compartir cifrado (E2E), no canal en claro.** La alternativa en claro rompería el diferencial
  zero-knowledge de TRACKR. Las piezas de cripto ya existen en `crypto-account.js` (AES-GCM,
  HKDF, envelopes); solo falta ECDH P-256 (WebCrypto nativo) para envolver claves.
- **Lo que mete la persona en Config es el código PÚBLICO del gestor** (id + huella de clave),
  jamás un secreto. El gestor jamás recibe la contraseña/DEK de la persona: recibe una clave de
  copia envuelta hacia su pública.

---

## Infraestructura

### Backend (trackr-api)

**Esquema D1:**
- `users.role` → `'persona'` (default) | `'gestor'`.
- `gestor_keys(user_id, public_key, fingerprint, created_at)` — pública en claro; la privada vive
  cifrada con la DEK del gestor (dentro de su blob de cuenta).
- `grants(id, persona_id, gestor_id, wrapped_key, scope, created_at, revoked_at)` —
  `wrapped_key` = clave de compartición cifrada hacia la pública del gestor (opaca para el server).
  `scope` = 'todo' | 'fiscal' (facturas, gastos, modelos).

**Endpoints (~4 grupos):**
- `POST /v1/gestor/keys` (publicar pública) · `GET /v1/gestor/{code}` (resolver código → pública+huella).
- `POST /v1/grants` (persona crea) · `DELETE /v1/grants/:id` (revoca cualquiera de las dos partes).
- `PUT /v1/share/blob` — blob sombra por grant, reutilizando el patrón content-addressed de
  `blob.js` (`s/{grantId}/{sha256}` en vez de `b/{userId}/{sha256}`).
- `GET /v1/gestor/clients` (lista de grants del gestor) · `GET /v1/share/blob?grant=…`.

**Flujo de datos:** con grant activo, el sync de la persona sube DOS blobs: el suyo normal y una
copia (según scope) re-cifrada con la clave de compartición. Revocar = borrar grant + dejar de
subir la copia; la persona no tiene que rotar su contraseña porque nunca compartió su clave.

### Frontend

- **Signup:** toggle persona/gestor. Cuenta gestor genera par ECDH al crearse; privada cifrada
  en su blob; pública publicada. Muestra su código `TRK-G-xxxx` + huella para repartir a clientes.
- **Config de persona → "Mi gestor":** pegar código → confirmar identidad (nombre/email/huella) →
  elegir alcance → crear grant. Botón revocar siempre visible.
- **Vista gestor:** lista de clientes; abrir uno descifra su blob sombra y lo carga en modo
  **solo lectura** (misma mecánica que cargar los JSON de ejemplo, con flag read-only).

---

## Autoría y edición del gestor (por etapas)

Hoy NO se registra quién hace cada cambio (D.save() persiste estado, sin actor). El almacenamiento
de versiones no es el problema (~9 KB/blob, solo se sube si cambió, máx. 10 versiones); lo que
aporta un log de operaciones es **autoría, deshacer fino y fusión multi-escritor**, no ahorro.

- **Etapa A (con el read-only):** array `audit[]` dentro del JSON: cada mutación apunta
  `{ts, actor, accion, entidad}`. El actor sale de la sesión de cuenta. Historial visible con
  nombres. Snapshots se quedan como red de seguridad.
- **Etapa B (gestor con escritura):** las ediciones del gestor viajan como **operaciones**
  ("añadido gasto X"), no como blob: el blob solo lo escribe la persona; las ops del gestor se
  aplican encima. Autoría perfecta, deshacer por operación, sin guerra de merges. Como producto
  puede presentarse como "cambios de tu gestora" visibles para la persona.
- **Etapa C (solo si TRACKR se vuelve colaborativo general):** oplog como fuente de verdad,
  retirar snapshots. No antes — reescribiría el corazón de store.js/sync sin necesidad actual.

---

## Sinergia VeriFactu

Las gestorías suelen ser **colaboradoras sociales de la AEAT**. Si la gestora lo es, puede ser la
vía de remisión de los registros VeriFactu de sus clientes (con su certificado), esquivando o
complementando el acuerdo 017 propio de TRACKR (ver TODO/15). La vista de gestor es el lugar
natural para "remitir pendientes de mis clientes".

**Preguntas para la primera gestora:**
1. ¿Está dada de alta como colaboradora social y con qué alcance?
2. ¿Qué necesita ver de un cliente para serle útil — todo o el resumen fiscal trimestral?
3. ¿Lo ve como herramienta que regala a sus clientes o como servicio que cobra?

---

## Pendientes conocidos tras la revisión (2026-07-16)

Hallazgos reales de la revisión multi-agente que se dejaron para más adelante (no
bloquean la beta con Diega, que es monodispositivo):

- **Grant obsoleto en merge multidispositivo** (CONFIRMADO): `mergeData` funde
  `settings` con "local gana" y `gestorGrant` vive ahí sin reconciliación por
  tombstone. Si una persona usa dos dispositivos y revoca/vincula en uno, el otro
  con estado viejo puede resucitar el grant revocado o borrar el nuevo al hacer
  merge en un 409. Se autocura parcialmente (pushShadow recibe 404 del grant
  revocado y lo limpia), pero el caso inverso no. Es el mismo límite de "sin
  tombstones" ya documentado en account.js. Arreglo real: reconciliar `gestorGrant`
  contra el servidor (`GET /v1/grants`) tras cada pull/merge. Prioridad media.
- **Whitelist de alcance fiscal con deriva de esquema** (altitud): `buildShareData`
  lista a mano los campos fiscales; si el store gana un array top-level nuevo, ni se
  comparte ni se excluye conscientemente. Añadir un test que ligue la lista al
  esquema de `store.js`, o un guard de campos desconocidos. Prioridad media.
- **Rol por handler, no en el router** (altitud): cada endpoint de `gestor.js` llama
  a `authRole(...)` con su rol; un endpoint nuevo (Etapa B) que lo olvide queda
  abierto. Cuando se añada la escritura por operaciones, montar una tabla
  ruta→rol comprobada en el router. Prioridad: al hacer Etapa B.
- **`userSet` vs migración versionada** (altitud): el flag que fuerza
  `verifactu.habilitado=false` es un sentinel paralelo al sistema de migración por
  versión del store. Unificar cuando se toque la migración. Prioridad baja.
- **i18n de app.gestor.js inline** (reuse): mover las cadenas a `lang.js` como el
  resto de la app. Mecánico, bajo riesgo. Prioridad baja.
- Menores: `lastInvoiceHash` global engañoso con multi-emisor (solo se muestra),
  `size_bytes` sin consumidor, `verifyChain` secuencial (barato a N pequeño),
  `_cfgVerifactuSection` reordena en cada render.

## Orden de construcción (estimación ~4-6 días + backend)

1. Esquema D1 (role, gestor_keys, grants) + endpoints de grants.
2. Par de claves ECDH + código de gestor en el signup/cuenta gestor.
3. Config persona → "Mi gestor" (vincular/alcance/revocar).
4. Blob sombra en el sync push.
5. Vista de clientes del gestor (read-only) + Etapa A de autoría (`audit[]`).
6. (después) Etapa B: escritura por operaciones.
