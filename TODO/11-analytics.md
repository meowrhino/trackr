# 11 — Analytics

## Estado actual (12 may 2026): ✅ Cloudflare Web Analytics activo · Worker propio en reserva

### Cloudflare Web Analytics (activo)

- Activado desde el panel de Cloudflare para `tr4ckr.com` el 12 may 2026.
- Configuración: **Enable** (sin excluir tráfico EU).
- Sin cookies, sin fingerprinting persistente, GDPR-compliant.
- **No requiere banner de cookies** en `tr4ckr.com`.
- Snippet inyectado automáticamente por Cloudflare (no hay código en `index.html` que mantener).
- Dashboard: dash.cloudflare.com → Analytics & Logs → Web Analytics.

**Lo que mide:**
- Pageviews y visitantes únicos por página.
- Referrers (de dónde viene el tráfico).
- País, dispositivo, navegador.
- Tiempo en página y bounce rate.

**Lo que NO mide:**
- Eventos custom (factura generada, export JSON, click outbound, etc.). Para eso → Worker propio (en reserva, abajo).

### Worker propio de analytics (en reserva)

Implementación ya hecha hace meses, **NO desplegada**:
- Cliente JS: `js/tracking.js` (objeto `T` con `init`/`ev`/`flush`, sendBeacon).
- Worker Cloudflare: `analytics/worker/index.js` + `analytics/worker/wrangler.toml`.
- Eventos custom ya disparados en código (no-ops mientras `T.init(null)`):
  - `nav:view:*` (cada cambio de vista)
  - `action:project_create`, `action:project_edit`, `action:invoice_generate`, `action:export`, `action:import`, `action:hours_add`
  - `action:lang_change:*`
  - `action:feedback_click:*`
  - `action:welcome_show`, `action:welcome_dismiss:start|guide`
  - `outbound:click:meowrhino-out`
- Lógica del Worker: agrega contadores por día en KV (`day:YYYY-MM-DD`), sessions únicas en `sessions:YYYY-MM-DD`, commitea resumen diario a GitHub vía cron (`analytics/data.json` en el repo).
- Endpoint `/dump` protegido con `DUMP_TOKEN` para volcar todos los datos.

### Decisión: cuándo retomarlo

Esperar a **50+ usuarios beta activos** antes de desplegar el Worker. Hasta entonces:
- Cloudflare Web Analytics cubre pageviews + referrers, que es lo que necesitamos para validar canales de captación.
- Custom events solo aportan valor cuando hay cohort suficiente para sacar señal.

Si llega el momento:
1. `wrangler login` (cuenta Cloudflare del usuario)
2. `wrangler kv namespace create ANALYTICS` + pegar ID en `wrangler.toml`
3. `wrangler secret put GITHUB_TOKEN` (fine-grained PAT con `contents:write` sobre el repo trackr)
4. `wrangler secret put GITHUB_REPO` (ej: `meowrhino/trackr`)
5. (Opcional) `wrangler secret put DUMP_TOKEN`
6. `wrangler deploy` → obtener URL del Worker
7. Editar `js/app.js` `init()` y cambiar `T.init(null)` por `T.init('https://...workers.dev/')`
8. Commit + push

**Si se activa**: añadir checkbox de opt-out de eventos custom en Configuración (ahora no tiene sentido porque CF Web Analytics no se puede opt-outar desde la app).
