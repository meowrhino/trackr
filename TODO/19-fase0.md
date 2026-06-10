# 19 — Fase 0: Responsive/PWA + quick wins (sin backend)

## Estado: ⏳ en curso · arrancada 2026-06-10

Parte del **Pivot A** (ver `17-pivot-cloud.md`). La Fase 0 es **todo lo que da valor en móvil sin backend ni riesgo legal**. La Fase 1 (cuentas + cloud cifrado) viene después y depende de tracción.

---

## Decisiones cerradas (2026-06-10)

- **Seguridad de cuentas (Fase 1): Opción 1 — zero-knowledge estricto.** El servidor guarda blobs cifrados que no puede leer. El panel de admin (manu) ve **metadatos** de los usuarios (cuántos saves, fechas, si pagan) pero **nunca el contenido**. La restauración de un save la hace **cada usuario** sobre sus propios datos, con su clave. Es lo más sencillo *y* lo óptimo.
- **Hosting: Vía B — Cloudflare Pages.** Migrar desde GitHub Pages. `trackr.meowrhino.studio` = nuevo canónico (DNS automático en Cloudflare). `tr4ckr.com` se deja en GitHub Pages hasta que expire (no se mueve: va a morir). Pendiente: método de deploy (i conectar repo↔CF Pages para auto-deploy [recomendado] / ii wrangler manual).
- **Fotos de tickets: opción (a) — sin fotos por ahora.** Nunca binarios en el JSON (es el "save file"). Opciones futuras documentadas abajo.
- **Historial de versiones: localStorage `trackr_history` + LZ-String** (NO IndexedDB — innecesario: 10 JSON comprimidos ≈ 200 KB, caben de sobra en localStorage).

---

## Tareas (orden propuesto)

### 1. Subdominio + hosting en Cloudflare Pages
- Crear proyecto Pages conectado al repo (o `wrangler pages deploy`).
- `trackr.meowrhino.studio` como custom domain (DNS auto en Cloudflare).
- `tr4ckr.com` intacto en GitHub Pages hasta expirar.
- Actualizar referencias hardcoded (index.html og:url/og:image, robots.txt, sitemap.xml, verifactu.html ×3, js/facturas.js:263, js/app.js:574) + `<link rel="canonical">` a la URL nueva.

### 2. Botón "+ Añadir hora" en la barra del calendario (quick win)
- Hoy el botón solo está dentro del modal de un día (`js/app.calendar.js:596`). La barra principal (`js/app.calendar.js:358`) solo tiene ← → Hoy | Mes/Semana.
- Añadir botón en esa barra, `margin-left:auto` (a la derecha), `flex-wrap` para que en móvil caiga a una línea nueva.
- Pendiente: ¿texto "Añadir hora" (término actual de la app) o "Añadir franja"?

### 3. Historial de versiones del JSON (10 saves, local)
- Ring buffer de **10 snapshots** en localStorage `trackr_history`, cada uno **comprimido con LZ-String**.
- Al guardar uno nuevo: entra de primero, los demás bajan, el 11.º se descarta.
- Cada save: **fecha + hora exacta fija** + **etiqueta libre editable** por el usuario. El más reciente marcado **"ACTUAL"**. (No nombres relativos automáticos — "ayer" caduca.)
- UI: lista con **Descargar** (export JSON) / **Cargar** (import) por save. Al cargar, aviso: *"esto sobreescribe tus datos — ¿guardo el actual primero?"*.

### 4. Responsive
- Revisar todas las vistas para móvil. Jerarquía por dispositivo: móvil = consulta + captura rápida; desktop = trabajo pesado.
- **Solo desktop:** Configuración y Asistente trimestral 303/130. **Ambos:** el resto.

### 5. PWA
- `manifest.json` + service worker + icono → instalable en pantalla de inicio + offline. Encaja con el ADN local-first.

---

## Opciones de fotos de tickets (aparcadas — para el futuro)

- **(b)** Fotos comprimidas a webp **fuera del JSON**, en IndexedDB (cientos de MB), exportadas aparte (zip) si se quieren.
- **(c)** Foto como **enlace externo** (Drive/nube del usuario) — nunca las guarda TRACKR.
- Detonante para retomar: que beta testers reales lo pidan.

---

## Lo que NO es Fase 0 (queda para Fase 1)

Backend Worker + R2 + D1, sistema de cuentas, cifrado client-side (envelope: DEK + clave-contraseña + código de recuperación), panel de admin de manu, gating de pago manual, textos legales (privacidad, condiciones, DPA art. 28), checkbox de consentimiento al subir. Todo en `17-pivot-cloud.md`.

---

## Progreso — sesión 2026-06-10 (en local, SIN commitear ni push)

- ✅ **Tarea 2 (botón calendario):** hecho y verificado (desktop a la derecha + móvil a nueva línea + click abre modal con fecha=hoy). Archivos: `js/app.calendar.js`, `css/calendar.css`.
- ✅ **Tarea 3 (historial de versiones):** hecho y verificado. Nuevo `js/history.js` (objeto `H`: ring buffer 10, LZString ~3,3×, snapshot/restore/download/maybeAutoSnapshot). Auto-snapshot 1/día al arrancar. UI en Configuración → "Copias de seguridad" (i18n inline es/en/ca — pendiente migrar a lang.js). Archivos: `js/history.js` (nuevo), `index.html` (LZString CDN + script), `js/app.js` (hook arranque), `js/app.config.js` (sección + métodos histSnapshot/histRestore/histDownload). Verificado en preview: compresión 93→28 KB, tope de 10 respetado, 0 errores en consola.
- ⏸ **Tarea 1 (hosting/subdominio):** INTENTADA por navegador (Brave elegido por manu). El dashboard de Cloudflare NO cargó (spinner infinito ~50s incl. recarga, sin errores en consola — probable lentitud/problema temporal de CF SPA). No se forzó deploy por `wrangler` para no publicar el working tree sin commitear. PENDIENTE: (a) manu reintenta el dashboard en su sesión normal [flujo **Pages** → Connect to Git → repo trackr → Framework None, build vacío, output `/`], o (b) Claude lo monta por `wrangler pages` con OK de manu sobre qué desplegar (origin/main limpio vs commitear antes botón+historial).
- ⏳ **Tareas 4 (responsive) y 5 (PWA):** sin empezar — para hacer con manu (decisiones de UX; service worker delicado).
- **Git:** nada commiteado ni pusheado. Pendiente decisión de manu sobre commit + qué hacer con los archivos de Verifactu que siguen colgando.
