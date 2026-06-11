# TRACKR — Changelog

Registro de cambios. Dos repos: **`trackr`** (frontend, este) y **`trackr-api`** (backend, Cloudflare Worker).
Convención de hashes: `frontend@xxxxxxx` / `backend@xxxxxxx`.

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
