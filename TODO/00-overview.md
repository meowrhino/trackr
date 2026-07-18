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
| 12 | Gastos recurrentes avanzados | `12-gastos-recurrentes.md` | ✅ hecho (12 may 2026) |
| 13 | Asistente trimestral (303+130) | `13-asistente-trimestral.md` | ✅ hecho (12 may 2026) · casillas oficiales exactas desde 5 jul, exterior (ISP/59/120) desde 18 jul |
| 14 | Plan de marketing v1 (deck 25 slides) | `14-marketing-plan.md` | ✅ hecho (12 may 2026) |
| 15 | Verifactu / homologación SIF | `15-verifactu.md` | 🚧 Fase 1 (código local) ✅ · email AEAT enviado 18 jul, esperando respuesta — deadline 1 jul 2027 |
| 16 | Microherramientas públicas /303 y /130 | `16-microherramientas.md` | ✅ hecho (18 jul 2026) — en producción; falta solo el post de lanzamiento |
| 17 | Cuentas + cloud (Pivot A) | `17-pivot-cloud.md` | ✅ hecho (jun 2026) — en producción, signups cerrados (`SIGNUPS_OPEN=false`) |
| 18 | Módulo inmovilizado (amortización >300 €) | `18-inmovilizado.md` | ⏳ pendiente |
| 19 | Fase 0: responsive + PWA | `19-fase0.md` | ✅ hecho (jun 2026) |
| 20 | Referencia de casillas 130/303/renta | `20-modelos-fiscales-casillas.md` | 📚 referencia — las 8 divergencias resueltas (18 jul 2026) |
| 21 | Cuentas gestor (compartir E2E con gestoría) | `21-gestores.md` | ✅ desplegado en producción (17 jul 2026) + reconciliación multidispositivo (18 jul) |
| 22 | Beta gestoría con Diega | `22-beta-diega.md` | 📋 guion listo — quedada prevista 19 jul 2026 |

---

## Sprint del 18 de julio de 2026 (resumen)

Sesión larga de código con tres tandas, todas desplegadas a producción, la víspera de la beta
con Diega. El email del acuerdo 017 a la AEAT salió el mismo día (Fase 2 de VeriFactu en marcha).

1. **Fiscalidad exterior** (`9d38899`): zona fiscal en cliente y gasto (ES/UE/no UE) →
   informativas 59/120, inversión del sujeto pasivo (10-13, 36-37, deducción no UE en 28/29),
   aviso del 349 y renta desglosada por casilla del D1. Cierra la última divergencia de TODO/20.
2. **Microherramientas SEO** (`e5d4ed8`): calculadoras públicas `/303` y `/130` — standalone,
   casillas oficiales, 130 acumulativo, estado compartible por URL. TODO/16 hecho.
3. **Gestores** (`744d451`): reconciliación del vínculo contra el servidor (el grant revocado
   desde otro dispositivo ya no resucita en un merge) + guard de deriva de esquema en el
   alcance fiscal. Verificado E2E contra wrangler dev.
4. **Docs**: README.md nuevo del repo, estados de TODO/15/16/17/19/20/21 puestos al día.

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
