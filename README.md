# TRACKR

App **gratuita y local-first** de gestión y facturación para autónomos: proyectos, horas,
clientes, facturas en PDF, gastos y fiscalidad real (modelos **130**, **303** y renta con las
casillas oficiales de la AEAT). Funciona **sin cuenta, en tu navegador** — tus datos no salen
de él salvo que tú lo pidas.

**Producción**: [trackr.meowrhino.studio](https://trackr.meowrhino.studio) · también
[tr4ckr.com](https://tr4ckr.com)
**Microherramientas públicas**: [/303](https://trackr.meowrhino.studio/303) (IVA trimestral) ·
[/130](https://trackr.meowrhino.studio/130) (IRPF trimestral)

## Filosofía

- **Local-first**: todo vive en `localStorage`, con copias de seguridad locales (hasta 10) y
  export/import JSON. Sin cuenta, sin tracking propio, sin cookies.
- **Sync opcional de conocimiento cero**: si creas cuenta, el JSON se cifra en tu navegador
  (AES-256-GCM, envelope con DEK) y el servidor solo guarda blobs opacos. Ni TRACKR puede leerlos.
- **Dos tipos de cuenta**: **persona** (el autónomo) y **gestoría** (ve — y con permiso, edita —
  los datos de sus clientes vía compartición cifrada E2E hacia su clave pública; consentimiento
  explícito por cliente y revocable).
- **Fiscalidad exacta, no aproximada**: 130 acumulativo con casillas 05/13/15, 303 con numeración
  oficial, ISP e informativas 59/120, renta desglosada por casilla. Referencia completa con
  fuentes en [TODO/20](TODO/20-modelos-fiscales-casillas.md).
- **VeriFactu**: huella oficial encadenada + QR de cotejo ya implementados (apagado por defecto);
  la remisión a AEAT está en camino — plan completo en [TODO/15](TODO/15-verifactu.md).

## Stack

Vanilla JS sin build ni dependencias de runtime (los vendors — jsPDF, qrcode — van en `vendor/`).
Módulos como globales (`D` store, `App` UI, `Acc` cuentas, `V` verifactu, `B` billing…) cargados
en orden desde `index.html`. El backend es un repo aparte:
[trackr-api](https://github.com/meowrhino/trackr-api) (Cloudflare Worker + D1 + R2).

```
js/          lógica (store, vistas, cuentas, gestor, verifactu, facturas…)
css/         estilos (variables.css primero, responsive.css último)
journey/     widget kanban de customer journey (autocontenido)
examples/    cuentas de ejemplo completas (las fechas futuras son intencionales)
TODO/        roadmap y documentos de diseño — empezar por TODO/00-overview.md
deck/        deck de marketing (25 slides)
303.html     calculadora pública del Modelo 303
130.html     calculadora pública del Modelo 130
```

## Desarrollo local

```sh
npx live-server --port=5501 --no-browser     # la app (estática, sin build)
# backend (opcional, para cuentas/sync/gestores):
cd ../trackr-api && npx wrangler dev --port 8787
```

Con backend local: `Acc.setApiBase('http://localhost:8787')` en la consola. Hay configuraciones
listas en `.claude/launch.json` (dos frontends para probar persona+gestoría a la vez, y la API).

## Deploy

Push a `main` → Cloudflare Workers Build ejecuta `bash build.sh` (genera `dist/` solo con el
sitio) y `npx wrangler deploy`. El service worker purga su caché por release (sha en el nombre).

## Documentación

- [CHANGELOG.md](CHANGELOG.md) — registro de cambios de los dos repos.
- [TODO/00-overview.md](TODO/00-overview.md) — roadmap con el estado de cada feature.
- [TODO/21-gestores.md](TODO/21-gestores.md) — diseño del rol gestoría (E2E, autoría, edición).
- [TODO/22-beta-diega.md](TODO/22-beta-diega.md) — guion de la beta del rol gestoría.
- `historial.txt` — la conversación fundacional del proyecto, para la posteridad.

Hecho por [meowrhino](https://meowrhino.studio).
