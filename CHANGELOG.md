# TRACKR — Changelog

Registro de cambios. Dos repos: **`trackr`** (frontend, este) y **`trackr-api`** (backend, Cloudflare Worker).
Convención de hashes: `frontend@xxxxxxx` / `backend@xxxxxxx`.

---

## 2026-10-19 — Clientes y Facturas en el menú, ejemplos al día

### ✨ Nuevo
- **Clientes y Facturas con vista propia** en el menú, debajo de Dineros. Facturas lista cada factura emitida con número, fecha, cliente y proyecto, total y estado (pagada, pendiente, anulada), y permite volver a bajar el PDF o anularla. Configuración se queda con los ajustes y la parte técnica de VeriFactu. _frontend@c04f752_

- **Journey vive dentro de Proyectos**, como modo «Tablero» junto a «Lista» (se recuerda el último). La fase de producción se ve ahora en la ficha del proyecto y como etiqueta en cada tarjeta de la lista. Al soltar un proyecto en la fase de presupuesto sin tener uno, se ofrece generarlo (nada automático); las tarjetas del tablero muestran «Presupuesto N/AA» si existe. _frontend_
- **Vencimiento de facturas**: Configuración → «Días para pagar una factura» (30 por defecto). Facturas muestra «vence el …» o «vencida hace N días», y la alerta de pendiente de pago en Proyectos dice cuántos días lleva vencida. _frontend_
- **Dineros con pestañas**: el resumen del periodo sigue arriba y debajo se ve una sección cada vez (Ingresos, Gastos o Fiscal con 303, 130 y renta). _frontend_
- **Los presupuestos se guardan.** Hasta ahora solo quedaba el PDF y una marca «N/AA» en cada proyecto; ahora cada presupuesto guarda sus líneas, la descripción y el total, y se lista en Facturas con estado **enviado / aceptado / rechazado**, botón para volver a bajar el PDF (mismo número y fecha) y para marcarlo aceptado (los proyectos del presupuesto que estaban en Potencial pasan a Activo). Las marcas antiguas se convierten en registros al abrir la app: aceptado si el proyecto se activó o facturó, rechazado si se abandonó. No se comparten con la gestoría. _frontend_

- **Editar un presupuesto ya generado** (✎ en Facturas → Presupuestos): fecha, descripción e importes de las líneas; el número no cambia y el total se recalcula. _frontend_
- **Recordatorio de cobro** (✉ en una factura pendiente): copia al portapapeles un texto con número, importe, fecha, vencimiento y días vencida, en el idioma de la factura, listo para pegar en un email. _frontend_
- **La guía interna** cuenta ya el Tablero, los presupuestos guardados, el vencimiento y las pestañas de Dineros. _frontend_

### 🔧 Cambiado
- **El vencimiento sale impreso en el PDF de la factura**, debajo de la fecha (no en el presupuesto). _frontend_
- **En el móvil**, las filas de Clientes y Facturas ponen el nombre en su línea y el resto debajo; antes el estado y los botones se salían de la pantalla. _frontend_
- **Los ejemplos usan las funciones nuevas**: presupuestos numerados en las propuestas y los trabajos grandes, método en cada cobro, notas en algunos clientes y una factura de profesional con retención de IRPF (Marina y Ana). Son cuentas ficticias y se irán ampliando con cada función nueva. _frontend_

---

## 2026-10-14 (tarde) — Menos subidas y versiones de verdad en la nube

Cada entrada del calendario creaba una versión en el servidor (de la v100 a la v200 en una hora), y el servidor solo guardaba las 10 últimas: unos minutos de trabajo. No servía para volver atrás.

### ✨ Nuevo
- **Versiones en la nube** (Configuración → Cuenta): lista con fecha y botón **Restaurar**, desde cualquier ordenador. Se guardan las 10 últimas y, de los últimos 30 días, la última de cada día. Restaurar crea una versión nueva con ese contenido: lo de ahora sigue en la lista y además se guarda una copia en este navegador. _frontend, backend@99ac237_

- **Método de cobro** en cada cobro: transferencia, efectivo, Bizum, tarjeta u otro. Aparece junto al cobro en la ficha del proyecto. Es solo informativo: no cambia ningún cálculo. _frontend_

### 🔧 Cambiado
- **Sesión caducada mientras la pestaña estaba abierta** (24 h sin uso): antes salía «Error de sync» y se reintentaba cada minuto con el token muerto; ahora la copia pasa a bloqueada y el indicador pide volver a entrar. Lo editado sigue guardado en el navegador y se sube al entrar. _frontend_
- **Se sube a los 30 s del último cambio** (antes 2,5 s), y **enseguida al cambiar de pestaña o cerrar**. Cada cambio sigue guardándose al momento en el navegador; lo que no llegue a subirse lo recoge el siguiente inicio de sesión. 5 entradas seguidas = 1 versión. _frontend_
- **No se sube si nada ha cambiado** (antes, cualquier guardado sin cambios creaba una versión idéntica). _frontend_
- **Si una subida falla** (sin red, límite), se reintenta sola al minuto en vez de esperar al siguiente cambio. _frontend_
- **Indicador "Cambios por subir…"** mientras espera; navegar ya no lo tapa con "Sincronizado". _frontend_
- **Tope de 120 subidas por hora y usuario**, como freno si algo entra en bucle. Usando la app no se alcanza. _backend@99ac237_
- **"Borrar datos de este navegador" dice la verdad**: las copias de seguridad y la cuenta en la nube se conservan. El botón rojo ponía "Cerrar sesión" y ahora pone lo que hace. _frontend_

---

## 2026-10-14 — Presupuestos, proyectos que se arrastran y «hola de nuevo»

### ✨ Nuevo
- **Presupuestos por cliente.** Se crean desde el icono 📋 en la lista de clientes o desde el botón "Presupuesto" en el detalle de un proyecto. Cada proyecto marcado del cliente es una línea (concepto e importe editables) y hay una descripción libre para servicios, plazos y condiciones. El PDF tiene el mismo diseño que la factura; si los proyectos llevan tipos distintos de IVA o IRPF, sale una fila por tipo. **No es una factura:** no gasta numeración de facturas, no pasa por VeriFactu y no sale en los libros. Lleva su propio contador, y cada proyecto incluido muestra "Presupuesto N/AA · fecha" en su ficha. _frontend_
- **Arrastrar proyectos entre estados.** En Proyectos, arrastra una tarjeta a otro grupo para cambiarle el estado. Mientras arrastras aparecen también los estados vacíos, y se puede soltar sobre los grupos plegados (Completados, Abandonados). Soltar en Internos o Recurrentes la deja en Activo. Solo funciona en ordenador; en el móvil el estado se sigue cambiando desde el modal. _frontend_
- **"Hola de nuevo" al abrir TRACKR.** Si este navegador recuerda tu cuenta pero no hay sesión, te recibe con tu email y cuatro datos: cuándo se guardó aquí, cuándo se subió desde aquí y **cuándo fue la última subida a la nube desde cualquier dispositivo**, aunque no hayas puesto la contraseña. También avisa si aquí hay cambios sin subir o si la nube tiene algo más nuevo de otro ordenador. Se puede seguir sin sesión. _frontend, backend@b9a09e4_
- **El indicador de la barra ya no desaparece al recargar**: sin sesión pone "Sin sesión · solo aquí" y, al pulsarlo, abre esa pantalla. _frontend_
- **Pase de metadatos por dispositivo** (`POST /v1/device/meta`): el login entrega un pase firmado (HMAC, 180 días) que solo sirve para consultar la versión y la fecha de la última subida. No da acceso a los datos ni permite subir nada; deja de valer si la cuenta se borra o se desactiva. _backend@b9a09e4_
- **Notas libres en el cliente** (al editarlo), como las que ya tenían los proyectos. En la lista de clientes aparece un 📝 y, al pasar el ratón, se ven las notas. **No se comparten con la gestoría** en el alcance fiscal; en "Todo", sí. _frontend_

### 🧹 Por dentro
- Los textos de la cuenta (71 por idioma) pasan de un diccionario dentro de `app.account-ui.js` a `lang.js` con el prefijo `acc.`, así que `checkLangs()` ya los vigila. _frontend_

---

## 2026-10-13 — Entrar ya no pisa lo que hiciste sin sesión

Si editabas con la sesión cerrada o bloqueada (por ejemplo, tras cerrar el navegador), esos cambios se quedaban solo en ese ordenador. Al volver a entrar, la nube los sustituía sin avisar: solo quedaban en Copias de seguridad.

### 🐛 Arreglado
- **Al entrar, TRACKR mira quién tiene lo último.** Si solo cambió la nube, la baja. Si solo cambió este navegador, lo sube. Si cambiaron los dos, pregunta: **fusionar**, **usar la nube** o **usar este navegador**, con la fecha de cada uno. Pase lo que pase, la copia local queda en Copias de seguridad. _frontend_
- "Sincronizar ahora" con conflicto irresoluble ya guarda una copia antes de bajar la nube. _frontend_
- **Dos pestañas abiertas ya no se pisan.** Cada una guardaba su copia en memoria entera y la última en guardar borraba lo hecho en la otra. Ahora, cuando una pestaña guarda, las demás adoptan sus datos. _frontend_
- **Fusionar ya no pierde el journey ni el historial de cambios.** Antes la nube sustituía las tarjetas del journey y la auditoría enteras. Ahora se juntan las de los dos lados. _frontend_

### 🧹 Por dentro
- Cada navegador recuerda en qué versión de la nube se basa su copia y cuándo coincidieron por última vez (`trackr_acct.syncedAt`). _frontend_
- Login, desbloqueo y recuperación comparten un único `_accAfterAuth()` en vez de tres copias. La recuperación ahora también recoge los cambios de la gestoría. _frontend_
- Cerrar sesión dejaba el estado sin `role`. Arreglado. _frontend_
- Check sin red: `node test/sync-resume.mjs`. _frontend_

---

## 2026-09-02 — Gastos con retención de IRPF: por fin se pueden meter

Si tu proveedor te factura con retención (un profesional, el alquiler de la oficina…), hasta ahora no había dónde apuntarla: los números del gasto nunca cuadraban con el papel.

### ✨ Nuevo
- **Retención IRPF % en el gasto** (junto al tipo de IVA) e **IRPF (€) en cada entrada**. El cálculo automático va en las dos direcciones: desde la base salen IVA, retención y total; y si escribes el total de la factura, se desglosa hacia atrás. 265 € + 21% − 15% = **280,90 €**, igual que en tu factura. _frontend_
- **El gasto sigue costando lo que cuesta.** En tarjetas, barras y calendario se cuenta base + IVA: la retención no te la ahorras, la ingresas tú. La entrada lleva una etiqueta `IRPF 39,75 €` con el total real de la factura en el tooltip. _frontend_
- **Libros registro AEAT**: las facturas recibidas ya rellenan "Tipo Retención del IRPF" (AK) e "Importe Retenido" (AL), y el Total Factura descuenta la retención. _frontend_

### 🧹 Por dentro
- **El motor fiscal sale de la vista**: los cálculos del 303 y el 130 pasan de `app.gastos.js` (826 líneas, mitad pintar mitad calcular) a `js/fiscal.js` — objeto `F`, sin DOM, al lado de `billing.js` y `libros.js`. Los mismos números exactos en los tres ejemplos, comparados uno a uno. _frontend_
- **Tres criterios duplicados, ahora uno**: `gastoImporteFiscal()` (base en España, base+IVA con proveedor extranjero) estaba copiado en el trimestral, en la renta y en los libros; `B.desglosarTotal()` recoge el desglose desde el total que estaba escrito tres veces en los modales. _frontend_
- Una versión intermedia avisaba en el resumen fiscal de las retenciones practicadas y del **modelo 111**. Retirado: no aplica a quien no lo presenta. El importe retenido se sigue guardando en cada entrada. _frontend_
- Roadmap y guía interna al día; las specs de las diez primeras features, ya construidas, archivadas en `TODO/hechos/`. _docs_

---

## 2026-07-29 — "network": nadie podía entrar desde tr4ckr.com

Diega intentó iniciar sesión y solo vio un toast que decía `network`.

### 🐛 Arreglado
- **CORS: `tr4ckr.com` faltaba en el allowlist del backend.** El sitio se sirve desde dos dominios pero el servidor solo reconocía `trackr.meowrhino.studio`; desde el alias corto el navegador bloqueaba **todas** las llamadas a la API — login, sync, todo. _backend@3581d05_
- **Los errores de cuenta ya dicen qué pasa.** Se separan el fallo de red real (conexión caída o CORS), el `429` del límite de intentos y el error del servidor, con texto traducido (es/en/ca) en login, desbloqueo, alta, recuperación y cambio de contraseña. _frontend_
- Si se caía la llamada a `/v1/login`, la app decía **"contraseña incorrecta"** aunque la contraseña fuese buena: mandaba a resetear credenciales que estaban bien. _frontend_

---

## 2026-07-19 — Libros registro AEAT: exporta el Excel oficial para tu gestoría (y para Hacienda)

### ✨ Nuevo
- **Exportar → "Libros registro (AEAT)"**: genera el Excel del formato oficial (llevanza conjunta IVA+IRPF, V.18.02.2026) con las pestañas EXPEDIDAS_INGRESOS y RECIBIDAS_GASTOS — el mismo fichero que se importa en **Renta Web, Pre303 y el modelo 130**, y lo que una gestoría pide cada trimestre. Cabeceras y catálogos copiados de la plantilla oficial de la AEAT; conceptos mapeados por categoría (RETA→G45, suministros→GY4, gestoría→G19…), exterior con calificación N2 e ISP marcada, retenciones incluidas. Generado en tu navegador sin librerías ni red. _frontend_
- **Config → Fiscal**: tipo/subtipo de actividad y epígrafe del IAE (van en cada fila de los libros).
- El botón Exportar ahora abre un modal: copia JSON de siempre + libros por ejercicio y trimestre ("hasta 2T", año completo…), siempre acumulado desde el 1 de enero como exige el formato.
- ⚠️ Beta hasta pasar el primer fichero por el validador oficial de la sede (TODO/23).

---

## 2026-07-19 — El registro se abre y cierra desde /admin (sin deploys)

### ✨ Nuevo
- **Interruptor "Registro de cuentas nuevas"** en el panel /admin: un clic para abrir (las cuentas nuevas quedan pendientes de tu activación, como siempre) y otro para cerrar. Sustituye el baile de `wrangler deploy --var` que mordió tres veces en el alta de la beta. El valor vive en D1 (`app_config`) con la variable de deploy como valor por defecto; cada cambio queda en el audit del servidor. _frontend + backend_

---

## 2026-07-19 — Panel de administración como página aparte (/admin)

Salido de la beta con Diego: la gestión de usuarios no pintaba nada dentro de la Configuración personal de manu.

### ✨ Nuevo
- **`/admin`** — página standalone (noindex, fuera del sitemap) con la lista de usuarios: activar/desactivar, pago y borrado, **badge de rol visible** (persona/gestoría — hoy se echó de menos), fechas de alta y último acceso, y pendientes ordenados arriba. Reutiliza la sesión de la app al navegar en la misma pestaña; si no hay sesión, login propio. Cada acción la re-autoriza el servidor (`is_admin`): la página no custodia nada. _frontend_
- En la app queda solo un enlace "Panel de administración →" (visible únicamente para el admin); el bloque de usuarios embebido en Configuración desaparece.
- El toast de activar recuerda el truco descubierto hoy: "que cierre sesión y vuelva a entrar".

---

## 2026-07-19 — Gastos: NIF del proveedor y nº de factura (preparando los libros registro)

### ✨ Nuevo
- **NIF del proveedor** (por gasto) y **nº de factura** (por entrada), opcionales, en los tres modales de gasto. Son los dos datos que le faltaban al futuro export de **libros registro** (TODO/23) — capturarlos desde ya evita rellenar un año hacia atrás cuando llegue. La gestoría con permiso de edición también puede completarlos. _frontend_

---

## 2026-07-19 — Limpieza a fondo: vendors locales, código muerto e i18n huérfano

Pasada de revisión sobre todo el frontend (sin cambios de comportamiento salvo el primero).

### ✨ Mejora real
- **jsPDF y LZ-String vendorizados** (`vendor/jspdf`, `vendor/lz-string`, con SRI como qrcode y argon2): venían de CDN y el service worker solo cachea el propio origen — offline podían fallar los PDFs de factura y las copias comprimidas, contra la promesa PWA. Contenido verificado byte a byte contra dos CDNs independientes. Ya no hay ningún script externo (solo las fuentes de Google, que degradan bien).

### 🧹 Limpieza
- **29 claves i18n huérfanas eliminadas** (×3 idiomas, −87 líneas de lang.js): restos de la vista fiscal antigua (`din.toRefund`, `renta.deductions`…), de la vista Info previa a las tarjetas y de textos de ejemplo sustituidos. Verificado que ninguna se usaba ni dinámicamente (las familias `guide.*`, `theme.*`, `journey.*`, plurales `.one/.other`… se construyen en runtime y se conservan).
- **API CRUD de journey del store eliminada** (10 métodos muertos): desde el refactor al widget, journey muta `D.d.journey` directo; solo `jStages`/`jStage` se usan y se quedan.
- **Tabla de casillas del 303 unificada** en `App._CODES303` (estaba duplicada en el render y en el copiar).
- **`analytics/` fuera del build**: el Worker propio en reserva es código interno; se publicaba entero en el sitio sin motivo.
- MDs: TODO/18 con cabecera de estado, TODO/22 al día (todo desplegado; solo queda el toggle de signups el día de la beta).

Verificado en navegador: 3 idiomas × 7 vistas sin claves crudas filtradas, consola limpia, PDF generado con el vendor local, self-test VeriFactu OK, snapshot de copias OK, build sin `analytics/`.

---

## 2026-07-18 — Gestores: reconciliación del vínculo multidispositivo + guard de esquema

Dos pendientes medios de la revisión de la Etapa B (TODO/21), cerrados antes de la beta.

### 🔴 Fixes
- **El vínculo con la gestoría ya no puede "resucitar" tras un merge multidispositivo**: `reconcileGrant()` valida el grant local contra el servidor tras cada sync (y tras cada pull). Si se revocó desde otro dispositivo se descarta; si el permiso de edición cambió, manda el servidor. Verificado E2E contra el worker real (wrangler dev). _frontend_
- **Guard de deriva de esquema en el alcance fiscal**: si el store gana un campo raíz nuevo, NO se comparte con la gestoría (privado por defecto) y se avisa por consola — quedar fuera de la whitelist pasa a ser una decisión, no una omisión (como le pasó a `audit[]` en su día). _frontend_

### 🧹 Limpieza
- `fmtTs` de Configuración usa `currentLocale()` de lang.js (estaba duplicado el mapeo de locales en dos sitios).
- El traslado del i18n inline de app.gestor.js a lang.js queda aplazado a propósito (víspera de beta; mismo patrón que app.account-ui.js).

---

## 2026-07-18 — Microherramientas públicas: calculadoras /303 y /130 (SEO)

El canal SEO del plan de marketing (TODO/16): dos calculadoras gratuitas sin registro.

### ✨ Nuevo
- **`/303`** — calculadora del Modelo 303 con casillas oficiales: bases por tipo (21/10/4/0 %) con cuota autocalculada editable, soportado 28/29, saldo a compensar 110/78/87 y resultado 46 → 71/72. _frontend_
- **`/130`** — calculadora del Modelo 130 **acumulativa** como el modelo real (casillas 01-19 con la 05, el 5 % de difícil justificación con toggle EDS, minoración 13 y negativos 15). El ángulo diferencial: casi todas las calculadoras online lo hacen mal por trimestre aislado.
- Estado serializado a la URL (cálculos compartibles), copiar casillas, JSON-LD, meta OG, mobile-first, CTA suave a la app y bloque SEO con plazos y preguntas frecuentes. Standalone (una petición, cero JS externo). Añadidas a `build.sh` y `sitemap.xml`.

---

## 2026-07-18 — Fiscalidad exterior: zona fiscal en cliente y gasto, 303 completo y renta desglosada

Cierra la última divergencia de `TODO/20` (la n.º 6): operaciones con la UE y fuera de la UE.

### ✨ Nuevo
- **Zona fiscal** en cliente y en gasto (España / UE con NIF-IVA / fuera de la UE), con ayuda contextual en los modales. _frontend_
- **303 — informativas**: los servicios facturados a clientes UE sin IVA van a la casilla **59** y a los de fuera de la UE a la **120** (obligatorias, no suman al resultado). Solo si la factura no lleva IVA español: una venta B2C con IVA sigue la vía normal.
- **303 — inversión del sujeto pasivo**: los gastos de proveedores extranjeros sin IVA español autoliquidan la cuota — intracomunitarios en **10/11** con deducción en **36/37**, no UE en **12/13** con deducción en **28/29**. Neutro en el resultado (46), como manda el modelo. Un impuesto extranjero tecleado en el campo IVA no se deduce en el 303: cuenta como coste en IRPF.
- **Aviso del modelo 349** cuando el periodo tiene operaciones intracomunitarias (requiere NIF-IVA/ROI).
- **Renta desglosada por casilla**: los gastos se agrupan por su casilla de destino del D1 — 0186 (RETA), 0192 (arrendamientos), 0194 (suministros, con nota del prorrateo de vivienda afecta), 0199 (gestoría), 0200 (seguros), 0208 (amortización) y 0202 (resto) — sumando exacto al 0218.
- "Copiar casillas" incluye todas las casillas nuevas.
- i18n completo ES/EN/CA. Ejemplo `marina_traductora` actualizado: TechBridge (Berlín) como cliente UE, Nordic Health (Oslo) como no UE con el texto legal corregido (art. 69, no art. 25).

---

## 2026-07-05 — Modelos fiscales reales: 130 acumulativo, 303 con numeración oficial y arrastre, renta D1

Investigación previa con fuentes oficiales AEAT/BOE (referencia casilla por casilla en `TODO/20-modelos-fiscales-casillas.md`). El resumen fiscal pasa de aproximación a casillas exactas del formulario.

### 🔴 Fixes (los números que copiabas estaban mal)
- **Modelo 130 ahora es ACUMULATIVO** como el oficial: casillas 01/02/06 desde el 1 de enero, casilla 05 descuenta los pagos de trimestres anteriores (Σ07 positivas), y los negativos se arrastran vía 19→15 dentro del año. Antes cada trimestre se calculaba aislado → mal desde T2. _frontend_
- **Numeración del 303 corregida**: el 21% va en las casillas **07/08/09** (antes 01-03, que son del 4%), y la cuota de IVA soportado corriente en la **29** (antes 30, que es bienes de inversión). _frontend_

### ✨ Nuevo
- **130**: 5% de gastos de difícil justificación (EDS, tope 2.000 €/año) y casilla 13 (minoración 100/75/50/25 € si el rendimiento del año anterior fue ≤ 12.000 €; configurable). El 130 sale ahora más BAJO para casi todo el mundo — antes TRACKR te hacía pagar de más.
- **303**: arrastre de saldo a compensar entre trimestres y años (casillas 110/78/87, resultado 71/72), con saldo inicial pre-TRACKR configurable.
- **Renta (Modelo 100, apartado D1)**: casillas reales 0171/0218/0221/0222/0224 + pagos a cuenta 0599 (retenciones) y 0604 (suma de los 130 del año).
- **Configuración → Fiscal**: rendimiento neto del año anterior, saldo IVA previo, toggle EDS.
- **Criterio unificado**: todo lo fiscal por devengo (fecha factura) y bases sin IVA — antes la renta anual iba por caja y con totales, y no cuadraba con la trimestral.

### 📚 Docs
- `TODO/20-modelos-fiscales-casillas.md` — referencia completa 130/303/renta con fórmulas y fuentes.
- `TODO/15-verifactu.md` — corrección importante: la modalidad "no verificable" exige firma XAdES por registro + log de eventos (el hash encadenado solo no basta); la ruta realista para local-first es la modalidad Verifactu con remisión vía Worker. Deadline autónomos confirmado: 1-jul-2027 (RDL 15/2025).

---

## 2026-06-11 — Repaso a fondo: fixes críticos + accesibilidad

Revisión en profundidad (6 agentes de código en paralelo + recorrido UX/UI en vivo, desktop y móvil). Esta tanda implementa los quick wins críticos y la primera tanda de accesibilidad; el resto queda como backlog priorizado (ver memoria del proyecto).

### 🔴 Fixes
- **Clic muerto en el dashboard** — la tarjeta "€/h real" navegaba a una vista inexistente (`go('din')`) → pantalla en blanco. Ahora abre Dineros. _frontend_
- **XSS por atributo (hardening)** — `esc()` no escapaba comillas, así que `value="${esc(...)}"` permitía romper el atributo (vector realista: importar un JSON ajeno). `esc()` ahora escapa `"` y `'`, cerrando el vector en todos los campos de golpe. _frontend_
- **Tope de cobros** — los cobros parciales no podían superar el total de la factura (antes inflaba el IVA y el bruto del período); avisa al capar. _frontend_
- **Toast "Copiado" honesto** — el código de recuperación solo confirma "Copiado" si el portapapeles tuvo éxito real (antes mentía → riesgo de creer guardado un código irrecuperable). _frontend_

### ♿ Accesibilidad (primera tanda)
- **Barra lateral navegable por teclado** (`role`/`tabindex` + Enter/Espacio) y con `aria-label` traducido es/en/ca — clave en móvil, donde el texto se oculta y solo quedan los iconos.
- **Foco visible** (`:focus-visible`) en inputs, botones y navegación (antes `outline:none` sin alternativa).
- **Toasts con `aria-live="polite"`** → los lectores de pantalla anuncian errores/éxitos (sync, login, import).
- **`<label>` asociados a sus controles** (for/id) en runtime, sin tocar decenas de plantillas.

### ⏳ Backlog del repaso (no implementado)
Modelo 130 no acumulativo (pendiente de decisión: bug vs. simplificación), merge sin tombstones, `H.snapshot()` que falla en silencio antes de un merge, estado de modales disperso, i18n inline triplicado, Verifactu muerto en el árbol, contraste de `--t3`, resto de a11y de teclado (tarjetas/calendario).

---

## 2026-06-11 — Pulido móvil + invitación a instalar la PWA

Tras probar en iPhone (Brave): retoques de la barra lateral en móvil y descubrimiento de la instalación.

### 🐛 UX móvil
- **Footer "Hecho con cariño…" oculto en móvil** — en la barra colapsada de 52px el texto se partía en una columna ilegible; se oculta `.sb-foot` en móvil (se mantiene en desktop). _frontend_
- **Iconos que iOS pintaba como emoji** — la rueda dentada (⚙) de la barra y la rueda/flecha (⚙, ↕) de la Guía salían en color y descompensadas en iOS; render monocromo forzado con el selector de variación de texto `U+FE0E`. _frontend_

### 🟠 Producto
- **Invitación a instalar la PWA** — nuevo `js/pwa.js`: banner descartable arriba del contenido + sección en Configuración + modal de instrucciones para iOS (Safari no dispara `beforeinstallprompt`). Captura el prompt nativo en Android/desktop, detecta si ya está instalada (standalone) y se oculta. _frontend_

---

## 2026-06-11 — UX: login en modal, indicador de sync y copy honesto sobre la nube

Repaso UX/UI tras cerrar la Fase 1. Todo verificado en navegador (desktop + móvil), sin errores de consola.

### 🐛 UX
- **Modal de inicio de sesión dedicado** — "Iniciar sesión" abría toda la pantalla de Configuración con el formulario incrustado; ahora abre un modal propio (entrar / crear cuenta / recuperar / desbloquear), con botón a ancho completo, autofocus y cierre con Escape. Pasa a ser la única superficie de login (el formulario incrustado de Configuración se sustituye por un CTA), lo que además elimina el riesgo de IDs duplicados. _frontend_
- **Indicador de sincronización en la barra lateral** — punto + estado ("Sincronizando…" / "✓ Sincronizado · vN" / "Pendiente" / "Error"), visible en todas las vistas y no solo en Configuración; oculto sin sesión y reducido a un punto en móvil. Hook nuevo `Acc.setSyncListener` + wrapper `syncPush`, sin tocar la lógica endurecida de `push`. _frontend_
- **Icono del botón de cuenta coherente con el estado** — `↺` (recargar, confuso) → `→` entrar / `⊘` bloqueado / `←` salir. _frontend_

### 📝 Copy
- **Mensajería honesta sobre la nube** — el copy seguía diciendo "sin cuenta, sin servidor, sin nube" cuando ya hay sync cifrado opcional (la guía afirmaba algo ya falso). Reescrito en es/en/ca: meta/título (`index.html`) + `welcome.claim` y guía intro/evolución/cómo-funciona/datos (`lang.js`). Nuevo encuadre: local-first y sin cuenta obligatoria; sincronización cifrada de conocimiento cero, opcional. _frontend_

### ⏸ Aparcado
Invitación a instalar la PWA (ya es instalable, falta el botón + instrucciones iOS), i18n del panel admin, aria-labels en la barra, validación en vivo del código de recuperación.

---

## 2026-06-11 — Etapa 2 "redonda", revisión profunda y arranque en producción

Cierre de la **Fase 1** (cuentas + sincronización cifrada en la nube). Todo desplegado y validado en producción con datos reales.

### 🟡 Para abrir a más gente
- **Panel de administración** — listar usuarios (solo metadatos), activar/desactivar, marcar pagado, soft-delete, revocar sesiones. Solo `is_admin` (reverificado en el servidor), con `audit_log` y guardas anti-auto-lockout. _backend@2a625c8, frontend@d7b8a7a_
- **Rate-limiting con Durable Object** (`new_sqlite_classes`, va en plan free) — anti-fuerza-bruta por IP: signup 5/h, prelogin 30/10min, login 15/10min, recover y cambio de contraseña. fail-open. _backend@5164fc0_
- **Merge de conflictos en el auto-sync** — ante un 409, baja la nube y fusiona (union por id, local gana en colisiones; contadores de factura no retroceden; snapshot de seguridad). _frontend@516c104_

### 🟠 Producto
- **PWA** — instalable + offline (manifest, service worker network-first con fallback, iconos 192/512; `build.sh` inyecta el sha de git en el nombre de cache para purgar lo viejo). _frontend@e608ac7_
- **Más categorías de gasto** — de 6 a 12 (cotización, amortización, suministros, gestoría, seguros, transporte) en es/en/ca. Cierra el feedback del primer beta tester. _frontend@0365345_

### 🔍 Revisión adversarial (35 agentes, 6 dimensiones)
29 hallazgos brutos → 21 reales (8 falsos positivos filtrados). Arreglados los claros de alto valor:
- **XSS (high)** — el email de usuario se interpolaba en un `onclick` del panel admin; ahora solo va el `userId`.
- Guard de concurrencia en `push()`, flag anti-reentrada del auto-sync, settings monótonos, self-guard en revoke, body defensivo del DO, rate-limit en cambio de contraseña. _backend@3c4dd30, frontend@5911a84_
- **Documentado como pendiente:** tombstones (borrado fiable multi-dispositivo), fail-open del rate-limit, etc.

### 🐛 UX
- **Login descubrible desde cero/incógnito** — el botón de la barra ahora refleja el estado de cuenta: "Iniciar sesión" / "Desbloquear" / "Cerrar sesión", y lleva al formulario. El "borrar datos de este navegador" se movió a Configuración. _frontend@1ad9562_

---

## 2026-06-10 — Hosting, modularización, y Etapa 1 + Etapa 2 (A/B)

### Hosting
- Migración a **trackr.meowrhino.studio** (Cloudflare Worker con static assets + auto-deploy desde GitHub; `build.sh` genera `dist/`). _frontend@3a963fb, @873f48a_

### Fase 0 (sin backend)
- **Historial de versiones local** (10 copias, anillo, LZString) + botón "+ Añadir hora" en el calendario. _frontend@96aa756_

### Modularización / refactor
- **Backend** de monolito a 5 módulos: `crypto.js`, `http.js`, `sessions.js`, `auth.js` + `index.js` (router). _backend@8304bc5_
- **`app.js` 770 → 269 líneas**: modal de Proyecto → `app.project.js`; Facturas/Verifactu/Cobros → `app.facturas-ui.js`; modales de Gasto → `app.gastos.modals.js`. _frontend@c5539fe, @1ba5bc0, @b188936_
- 5 dedups de helpers (`localDateStr`, `B.totalHoras`, `B.ephColor`, `App._applyPrefs`, `App._segsColor`). _frontend@ddd1093_
- Limpieza: bug del calendario (sumaba `e.cantidad` en vez de `e.total`), código muerto `irpfTotal`, merge de `reports.css`. _frontend@b3d10ca_

### Responsive + hardening previo
- Arreglos responsive en móvil (lista de gastos, texto de Info), guard de Verifactu en `genFactura` (quitaba un warning en cada factura), snapshot de seguridad antes de restaurar el historial. _frontend@15cebd3, @b5edb23_

### Etapa 1 — Auth zero-knowledge (backend)
- Esqueleto (Worker + D1 + KV) → endpoints signup/prelogin/login/account/logout, schema D1, sesiones opacas. Endurecido tras auditoría adversarial (anti-enumeración, validación KDF, nonce↔email, etc.). _backend@f057565, @962fa9d, @7eb9cb9_

### Etapa 2 A/B — Sync + cripto cliente
- **Servidor:** endpoints de sync de blobs (`GET/PUT /v1/blob`, versiones), cambio de contraseña y recuperación 2-fases. _backend@22c728c, @979ebe7, @aa01e0c_
- **Cliente cripto** (`crypto-account.js`): Argon2id (hash-wasm auto-alojado con SRI), HKDF, envelope AES-GCM, código de recuperación. Auditado: **fix crítico** — el email se canonicaliza en el cliente igual que en el servidor antes del AAD (si no, lockout/pérdida de datos). _frontend@83fc2f7, @b6e2f54_

---

## Antes (contexto, mayo 2026)
Gastos recurrentes y asistente modelo 303/130 (#12, #13), split visual del cruce de noche en el calendario, cobros editables, y el material de marketing/deck. Verifactu/SIF quedó **aparcado** (deadline 1 jul 2027).

---

## Aparcado / pendiente
- **Tombstones** para borrado/edición fiables multi-dispositivo (el merge actual puede resucitar borrados; con 1 dispositivo no aplica).
- Refactor "RECOMENDADO": carpetas `js/lib|core|views/`, split de la vista semana del calendario, migración de i18n inline → `lang.js`.
- zxcvbn (medidor de contraseña real), desbloqueo tras recargar sin re-login.
- **Verifactu/SIF**, rotación real de claves, OPAQUE.
