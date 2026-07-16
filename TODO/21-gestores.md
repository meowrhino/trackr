# 21 — Cuentas gestor (compartir con tu gestoría)

## Estado: ✅ v1 implementada (2026-07-16) · backend + frontend en ramas `gestores`
## Primer caso real: Diega (beta del rol gestor) — pendiente solo desplegar y probar en producción

> **Implementado y verificado E2E en local** (wrangler dev + navegador): toggle en signup,
> cuenta gestora con par ECDH y código auto-publicado al entrar, activación por admin,
> vínculo persona→gestora con confirmación de huella y alcance, blob sombra cifrado en cada
> sync, cartera de la gestora con visor protegido (banner + restauración; el sync del gestor
> se pausa para no contaminar su cuenta). Alcance fiscal verificado estanco (0 horas, 0 notas,
> 0 journey). Tests: 29/29 unit + 22/22 E2E backend.
> **Pendiente:** desplegar (migrate-gestores.sql **+ migrate-ops.sql** en D1 prod + deploy +
> merge frontend), y verificar el renderizado del modal de confirmación en un navegador real
> (posible artefacto de captura).
> **Etapas A y B: ✅ hechas (2026-07-16, rama `audit-etapa-a` en los dos repos).** Verificadas
> E2E en navegador con dos cuentas reales (persona en :5501, gestora en :5502) contra wrangler
> dev: vínculo con permiso, edición desde el visor, ops aplicadas con autoría correcta,
> aislamiento intacto y deshacer funcionando.
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

- **Etapa A (con el read-only): ✅ hecha (2026-07-16).** Array `audit[]` dentro del JSON: cada
  mutación apunta `{ts, actor, accion, entidad, entidadId}`. El actor sale de la sesión de cuenta
  (`{email, role}` de `Acc.status()`, o `'local'` sin sesión). Snapshots se quedan como red de
  seguridad. Cómo quedó:
  - `D._audit(accion, entidad, entidadId)` en store.js, llamado antes de `save()` por los
    mutadores de proyectos, clientes, gastos, deducibles y facturas; los `save*` de settings en
    app.config.js lo llaman con `('editar', 'settings', null)`.
  - No audita en modo visor (`D._readOnly`): ahí `save()` está bloqueado y el evento ni se
    persistiría ni debe ensuciar los datos del cliente en pantalla.
  - Anillo de `D.AUDIT_MAX` (500) eventos. Medido: 500 eventos ≈ 79 KB sin cifrar; sobre una
    cuenta de ejemplo de 88 KB da ~167 KB, por debajo del límite de 256 KB del blob pero sin
    holgura enorme. Si una cuenta real grande se acerca al límite, bajar `AUDIT_MAX` (es una
    constante suelta).
  - Sin auditar a propósito: tema/idioma (preferencias cosméticas que inundarían el log),
    journey (arrastrar tarjetas dispararía un evento por gesto) y `D.load()` (importar o
    restaurar reemplaza todo; el evento no diría nada útil).
  - UI: `App._cfgAuditSection()` en Configuración (últimos 30, i18n inline es/en/ca como
    `_cfgHistorySection`). Resuelve el nombre de la entidad si sigue viva; en un borrado
    muestra solo el tipo.
- **Etapa B (gestor con escritura): ✅ hecha (2026-07-16).** Las ediciones del gestor viajan como
  **operaciones** (`{accion, entidad, entidadId, payload}`), no como blob: el blob lo sigue
  escribiendo solo la persona y las ops se aplican encima. Cómo quedó:
  - **Permiso opt-in** (`grants.can_edit`, 0 por defecto): vincularse sigue significando "que lo
    vea". La persona lo activa al vincular o después, y puede quitarlo; quitarlo **tira las ops
    pendientes** en el servidor, y revocar el vínculo también.
  - **Se aplican solas + deshacer**: al sincronizar, la persona baja las ops, las aplica y las
    ve en el Historial como "tu gestoría editó X", con deshacer por operación (el inverso se
    guarda en la entrada de audit; si pesa más de 4 KB se aplica igual pero sin deshacer de un
    clic — para eso están las copias).
  - **Qué puede tocar** (`GOps.WRITABLE`): proyectos (menos `horas`), clientes, gastos,
    deducibles y `settings.fiscal`. Fuera: las **horas** (es el calendario de la persona; lo
    decidió manu), las **facturas** (VeriFactu encadena huellas por emisor: firmar desde otra
    sesión rompería la cadena), el journey y el resto de settings.
  - **La frontera de seguridad es quien APLICA, no quien emite.** El cliente de la persona
    valida cada op contra la whitelist y descarta lo que no encaje; el actor que se registra
    sale del **grant local**, no de la op (una op puede decir que la firma quien quiera).
    Verificado en navegador con ops forjadas a mano saltándose la UI.
  - **La cola de ops del gestor vive solo en memoria**, a propósito: el visor promete que nada
    del cliente toca su disco, y el payload es descifrable con su shareKey. Precio: cerrar la
    pestaña con ops sin enviar las pierde (hay aviso al salir).
  - Backend: `grant_ops` (payload opaco, borrado tras el ack: lo aplicado ya consta en el
    `audit[]` de la persona) + `POST/GET/ack` de ops + `PATCH /v1/grants/:id`. Migración en
    `scripts/migrate-ops.sql`. Tests: 62/62 unit + 37/37 E2E.
  - Hecho de paso: **tabla ruta→rol** en el backend (era el pendiente "rol por handler"): vive
    en `GESTOR_ROUTES`, pegada a los handlers, y `dispatchGestor` la aplica — un endpoint sin
    fila no es alcanzable y una fila sin rol es un 500, no un endpoint abierto.
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
  (Ya picó una vez: `audit[]` cayó fuera del alcance fiscal por omisión al hacer la Etapa A;
  ahora la exclusión está comentada a propósito, pero el guard sigue sin existir.)
- ~~**Rol por handler, no en el router**~~ ✅ resuelto al hacer la Etapa B: `GESTOR_ROUTES`
  + `dispatchGestor` en `gestor.js`; los handlers ya no comprueban rol (lo reciben hecho).
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
5. ✅ Vista de clientes del gestor (read-only) + Etapa A de autoría (`audit[]`).
6. ✅ Etapa B: escritura por operaciones.

## Pendientes de la Etapa B (para cuando Diega la use de verdad)

- **La UI del visor no cambia entre mirar y editar.** Los botones de editar están siempre ahí
  (ya era así en la v1: en modo visor las mutaciones no se guardaban y punto); lo único que
  dice la verdad es el banner. Si en pruebas con Diega resulta confuso, atenuar las acciones
  de las entidades no editables mientras no haya edición activa.
- **Deshacer es "restaurar valores", no un rebobinado.** Deshacer una op vieja pisa lo que se
  haya editado encima; y una clave que no existía vuelve como `null`, no desaparece. Suficiente
  para el caso real (deshacer algo recién hecho), pero no es un undo transaccional.
- **Sin aviso a la persona fuera de la app.** Se entera cuando abre TRACKR y sincroniza. Si se
  quiere "tu gestoría te ha tocado algo" por email, es otra pieza (y otro coste).
- **Las ops no se agrupan.** Editar un gasto tres veces son tres entradas en el historial.
