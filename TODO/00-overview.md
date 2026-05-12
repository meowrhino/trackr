# TRACKR — Roadmap

Orden de implementación. Cada archivo tiene el detalle.

| # | Feature | Archivo | Estado |
|---|---------|---------|--------|
| 1 | Clientes como entidad | `01-clientes.md` | ✅ hecho |
| 2 | Nuevos estados + flags | `02-estados.md` | ✅ hecho |
| 3 | Renombrar Dashboard → Proyectos | `03-renombrar-proyectos.md` | ✅ hecho |
| 4 | Configuración (emisor + targets) | `04-configuracion.md` | ✅ hecho |
| 5 | Gastos | `05-gastos.md` | ✅ hecho |
| 6 | Resumen financiero en Info | `06-resumen-financiero.md` | ✅ hecho |
| 7 | Objetivos en calendario | `07-objetivos-calendario.md` | ✅ hecho |
| 8 | Resumen en calendario | `08-resumen-calendario.md` | ✅ hecho |
| 9 | Generación de facturas | `09-facturas.md` | ✅ hecho |
| 10 | Migración de datos (versioning) | `10-migracion.md` | ✅ hecho |
| 11 | Analytics anónimo | `11-analytics.md` | ✅ Cloudflare Web Analytics activo · Worker propio en reserva |
| 12 | Gastos recurrentes avanzados | `12-gastos-recurrentes.md` | 🟡 parcial |
| 13 | Asistente trimestral (303+130) | `13-asistente-trimestral.md` | 🟡 parcial |
| 14 | Plan de marketing v1 (deck 25 slides) | `14-marketing-plan.md` | ✅ hecho (12 may 2026) |
| 15 | Verifactu / homologación SIF | `15-verifactu.md` | ⏳ pendiente — antes 1 jul 2027 |
| 16 | Microherramientas públicas /303 y /130 | `16-microherramientas.md` | ⏳ pendiente — Q2/Q3 2026 |
| 17 | Cuentas + cloud (Pivot A) | `17-pivot-cloud.md` | ⏳ pendiente — Q4 2026 / Q1 2027 |

---

## Sprint del 12 de mayo de 2026 (resumen)

Día completo de pulido producto + plan de marketing.

**Código (Sonnet sprint + Opus sprint):**
- Cloudflare Web Analytics activado en tr4ckr.com (sin cookies, GDPR-compliant)
- Botón "Marcar pagado" en dashboard + detail (beta feedback #6)
- Sección "qué es TRACKR" como modal de bienvenida primera visita (ES/EN/CA)
- Atribución meowrhino.studio en sidebar footer
- Meta tags Open Graph + Twitter Card + sitemap + robots
- Imagen OG (1200×630) v1 minimal — diseñada y commiteada
- Cliente inline editable desde modal de factura (warning ⚠ falta NIF/dirección)
- Cliente inline editable desde modal de proyecto (✎ junto al dropdown)
- Cerrar sesión movido al sidebar (separador + nav item con i18n)
- Fixes latentes en `_updateNav`: traducción de "Guía" y export/import
- Limpieza UI: feedback beta button retirado de Config (sigue mailto en el repo si lo necesita)
- Ejemplos JSON migrados a schema v4 (entradas con base/iva/total/tipoIva)
- Guía interna actualizada con quick-pay + base/iva/total en gastos

**Plan de marketing (deck):**
- `deck/index.html` reescrito de 8 slides a 25 slides en 3 actos
- `deck/contenido.md` reescrito como fuente markdown del deck
- Acto 1: qué es TRACKR (8 slides pulidos, con Verifactu y Escenario A integrados)
- Acto 2: el mercado y la batalla (cover + Verifactu momento + buyer persona + Quipu/Holded/Contasimple en detalle + keywords atacables + hueco de mercado)
- Acto 3: plan de captación (cover + objetivos SMART + canales + calendario editorial 90 días + microherramientas SEO + métricas + riesgos + roadmap alineado + cierre)

**Datos clave que ahora viven en el repo (investigación absorbida):**
- Verifactu obligatorio para autónomos desde 1 jul 2027 (RDL 15/2025, BOE 03/12/2025)
- Quipu/Holded/Contasimple firmaron SIF en jul 2025 → TRACKR debe firmar antes jul 2027
- Quipu desde 17-20 €/mes (TeamSystem), Holded 14-149 €/mes (Visma), Contasimple 0€ con tope 50 fact/año (Cegid)
- Plan de monetización futuro: Escenario A (backup cifrado client-side, RGPD art. 34.3.a), ~3-5 €/mes opcional

**Estado público:**
- 16 commits pusheados a `origin/main` durante la jornada
- tr4ckr.com sirve la versión actualizada
- Cloudflare Web Analytics empezará a reportar pageviews en 4-6 horas
