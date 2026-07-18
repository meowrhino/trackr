# 16 — Microherramientas públicas /303 y /130

## Estado: ✅ HECHO (2026-07-18) — `303.html` y `130.html` en producción · pendiente solo el lanzamiento (paso 7)

> Cómo quedó: dos páginas standalone (HTML+CSS+JS inline, sin dependencias, estética TRACKR),
> con la numeración oficial VIGENTE (posterior a esta spec): 21% → 07-09, 10% → 04-06, 4% → 01-03,
> 0% → 150-152, soportado 28/29, saldo a compensar 110/78/87, resultado 46 y 71/72. El 130 es
> ACUMULATIVO como el oficial (casillas 05/13/15, 5% difícil justificación con toggle EDS) — es
> justo el ángulo SEO: "el error más común es calcularlo por trimestre aislado". Estado en query
> string (compartible), botones copiar casillas + compartir enlace, JSON-LD WebApplication,
> meta OG, mobile-first verificado, CTA suave a la app y enlaces cruzados 303↔130. Añadidas a
> build.sh y sitemap.xml. Falta: post de lanzamiento (paso 7) y, si se quiere, OG image propia.

### Concepto

Dos calculadoras públicas, sin login, sin guardar nada, accesibles desde URLs limpias:

- **`tr4ckr.com/303`** — calculadora del Modelo 303 (IVA trimestral). El usuario mete bases, IVA repercutido, IVA soportado y obtiene las casillas listas para copiar a la sede electrónica AEAT.
- **`tr4ckr.com/130`** — calculadora del Modelo 130 (IRPF trimestral en estimación directa). Ingresos – gastos – retenciones → casillas.

### Por qué hacerlo

Es el **canal SEO con mejor retorno esperado** del plan de marketing (ver `14-marketing-plan.md`):

1. **Tráfico estacional recurrente**: 4 picos al año (cierre de trimestre + plazo de 20 días para presentar).
2. **Volumen aprovechable**: 800-1.500 búsquedas/mes para "calculadora modelo 303 online gratis" y 500-1.000 para 130. Dificultad SEO Media (atacable con autoridad media).
3. **Backlinks naturales**: blogs fiscales y de autónomos enlazan herramientas útiles + gratuitas. Es contenido que se comparte.
4. **Branding**: nos posicionamos como "los que dan herramientas gratis sin cuenta". Cada visita refuerza la promesa de marca.
5. **Reciclaje del código**: la lógica de cálculo ya existe en `js/billing.js` y en el asistente trimestral de la app (TODO #13). Solo hay que exponerla con un UI más reducido.

### Especificación técnica

- **No requiere login ni persistencia.** El estado vive en el formulario.
- **Sin tracking interno** (coherente con filosofía TRACKR — Cloudflare Web Analytics global ya cuenta la pageview).
- **CTA suave al final**: "¿Quieres usar TRACKR para no tener que rellenar esto a mano cada trimestre? Entra a tr4ckr.com".
- **Compartir resultado por URL**: el estado del formulario se serializa a query string para poder compartir un cálculo concreto.
- **Mobile-first**: muchos autónomos van a llegar desde su móvil.

### UI mínimo (303)

- Trimestre + año (selector).
- Base imponible al 21%, 10%, 4%, 0% (4 inputs).
- IVA repercutido (auto-calculado pero editable).
- IVA soportado (gastos deducibles).
- Resultado: casillas 01-06 + 28-31 + 46 + 71.
- Botón "Copiar todas las casillas".

### UI mínimo (130)

- Trimestre + año.
- Ingresos del trimestre.
- Gastos deducibles del trimestre.
- Retenciones del trimestre.
- Resultado: casillas 01, 02, 03 (rendimiento), 04 (20%), 05 (retenciones), 07/19 (a ingresar).
- Botón "Copiar todas las casillas".

### Pasos

| # | Tarea | Estimación |
|---|---|---|
| 1 | Crear `/303.html` y `/130.html` standalone, reutilizando estilo y CSS de la app | 2h |
| 2 | Adaptar lógica de `app.gastos.js _rDinTrim()` para que funcione con inputs directos (sin store) | 2h |
| 3 | Botón "Copiar casillas" con feedback visual | 30 min |
| 4 | Serialización del estado a query string para compartir | 1h |
| 5 | Meta tags propios + OG image distinto (más fiscal/serio) | 1h |
| 6 | CTA al final + footer atribución meowrhino | 30 min |
| 7 | Lanzamiento: post en meowrhino blog + hilo en X + comentario en r/Autonomos | 2h |

**Total estimado**: 1 jornada completa por herramienta. Lanzar `/303` antes de S1 agosto, `/130` antes de S1 septiembre (ver calendario editorial en `14-marketing-plan.md`).
