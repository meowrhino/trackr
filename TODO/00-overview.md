# TRACKR — Roadmap

Orden de implementación. Cada archivo tiene el detalle.

| # | Feature | Archivo | Estado |
|---|---------|---------|--------|
| 1 | Clientes como entidad | `hechos/01-clientes.md` | ✅ hecho |
| 2 | Nuevos estados + flags | `hechos/02-estados.md` | ✅ hecho |
| 3 | Renombrar Dashboard → Proyectos | `hechos/03-renombrar-proyectos.md` | ✅ hecho |
| 4 | Configuración (emisor + targets) | `hechos/04-configuracion.md` | ✅ hecho |
| 5 | Gastos | `hechos/05-gastos.md` | ✅ hecho |
| 6 | Resumen financiero en Info | `hechos/06-resumen-financiero.md` | ✅ hecho |
| 7 | Objetivos en calendario | `hechos/07-objetivos-calendario.md` | ✅ hecho |
| 8 | Resumen en calendario | `hechos/08-resumen-calendario.md` | ✅ hecho |
| 9 | Generación de facturas | `hechos/09-facturas.md` | ✅ hecho |
| 10 | Migración de datos (versioning) | `hechos/10-migracion.md` | ✅ hecho |
| 11 | Analytics anónimo | `11-analytics.md` | ✅ Cloudflare Web Analytics activo · Worker propio en reserva |
| 12 | Gastos recurrentes avanzados | `12-gastos-recurrentes.md` | ✅ hecho (12 may 2026) |
| 13 | Asistente trimestral (303+130) | `13-asistente-trimestral.md` | ✅ hecho (12 may 2026) · casillas oficiales exactas desde 5 jul, exterior (ISP/59/120) desde 18 jul |
| 14 | Plan de marketing v1 (deck 25 slides) | `14-marketing-plan.md` | ✅ hecho (12 may 2026) |
| 15 | Verifactu / homologación SIF | `15-verifactu.md` | 🚧 Fases 1-3 ✅ (registros firmados y encolados en el servidor con emisor, destinatario y encadenado) · email AEAT enviado 18 jul, esperando respuesta — deadline 1 jul 2027 |
| 16 | Microherramientas públicas /303 y /130 | `16-microherramientas.md` | ✅ hecho (18 jul 2026) — en producción; falta solo el post de lanzamiento |
| 17 | Cuentas + cloud (Pivot A) | `17-pivot-cloud.md` | ✅ hecho (jun 2026) — en producción, signups cerrados (`SIGNUPS_OPEN=false`) |
| 18 | Módulo inmovilizado (amortización >300 €) | `18-inmovilizado.md` | ⏳ pendiente |
| 19 | Fase 0: responsive + PWA | `19-fase0.md` | ✅ hecho (jun 2026) |
| 20 | Referencia de casillas 130/303/renta | `20-modelos-fiscales-casillas.md` | 📚 referencia — las 8 divergencias resueltas (18 jul 2026) |
| 21 | Cuentas gestor (compartir E2E con gestoría) | `21-gestores.md` | ✅ desplegado en producción (17 jul 2026) + reconciliación multidispositivo (18 jul) |
| 22 | Beta gestoría con Diego | `22-beta-diega.md` | 🚧 en curso (19 jul 2026) — cuenta activa y vínculo creado; roces del alta anotados |
| 23 | Exportar libros registro (AEAT) | `23-libros-registro.md` | ✅ hecho (19 jul 2026) — Excel oficial IVA+IRPF, beta hasta pasar el validador de la sede |
| 24 | Adjuntos: justificantes de gasto | `24-adjuntos.md` | 💡 diseñado — define el plan de pago |
| 25 | Panel de admin como página aparte (`/admin`) | — | ✅ hecho (jul 2026) — incluye abrir/cerrar el registro con un clic |
| 26 | Retención de IRPF en gastos | — | ✅ hecho (2 sep 2026) — captura, cálculo en ambos sentidos y columnas AK/AL en los libros |
| 27 | Modelo 111 (retenciones practicadas) | — | ❌ descartado por ahora — meowrhino no lo presenta; el dato se guarda por si algún día |
| 28 | Ingresos sin factura ("en B") separados en Dineros | `28-ingresos-b.md` | 💡 diseñado (17 sep 2026) |
| 29 | Historial en la nube + sync que avisa al caducar | `29-historial-nube.md` | 🚨 detectado (17 sep 2026) — parte A urgente |
| 30 | Dineros abre en trimestre vacío y parece no declarado | `30-trimestre-vacio.md` | 🐛 diagnosticado (17 sep 2026) — arreglo pequeño |
| 31 | Al iniciar sesión, comparar en vez de pisar | `31-reconciliacion-login.md` | 💡 diseñado (17 sep 2026) — etapa A urgente |

---

## Sprint del 19 de octubre de 2026 (resumen)

Revisión de UX a raíz de un presupuesto que manu no encontraba. Todo desplegado en producción el mismo día.

1. **Clientes y Facturas con vista propia** en el menú, bajo Dineros (`c04f752`); Configuración se queda con los ajustes. Filas de lista apiladas en móvil.
2. **Journey pasa a ser el modo «Tablero» de Proyectos** (`e3e957d`): conmutador Lista/Tablero, fase visible en ficha y tarjeta, aviso al soltar en la fase de presupuesto sin tener uno.
3. **Presupuestos guardados** (`568483b`, `28d7467`): líneas, descripción, total y estado enviado/aceptado/rechazado en Facturas → Presupuestos; PDF de nuevo; editar; aceptar activa los proyectos potenciales. Migración de las marcas antiguas, idempotente, con test (`test/presupuestos.mjs`). Fuera del alcance fiscal de la gestoría.
4. **Vencimientos** (`068285e`, `5ff0c05`): días de pago en Configuración, «vence el…» / «vencida hace N días» en Facturas y en la alerta de Proyectos, impreso en el PDF, y botón ✉ que copia un recordatorio de cobro. **Dineros con pestañas** Ingresos/Gastos/Fiscal.
5. **Arranque y vuelta** (`14add4d`): lista «Para empezar» en Info, banda honesta al cargar un ejemplo, aviso del próximo 303/130, pantalla de primera factura, aviso de copia a los 30 días. Los ejemplos usan todo lo nuevo.
6. **303/130 verificados** con un recálculo independiente desde el JSON crudo (T3 2026 y 130 acumulado): coinciden casilla por casilla.

**Decisiones**: la competencia (Holded, Quipu) gana en portal de cliente, aceptación online de presupuestos y recordatorios automáticos; se descartan porque exigen servidor público por documento y rompen el «sin cuenta». El registro de cuentas sigue cerrado hasta que manu lo abra desde `/admin`.

---

## Sprint del 2 de septiembre de 2026 (resumen)

Sesión corta a raíz de una factura de proveedor con retención que no se podía meter.

1. **Retención de IRPF en gastos** (`f28cb35`): tipo de retención en el gasto e importe por
   entrada, cálculo en ambos sentidos (desde la base y desde el total de la factura), etiqueta
   `IRPF x €` en la entrada y columnas AK/AL en el libro de recibidas. El coste que cuentan
   barras y tarjetas sigue siendo base + IVA: la retención no abarata el gasto.
2. **Nada de modelo 111** (`dfa179b`): el primer intento avisaba de la obligación del 111 en el
   campo y en el resumen fiscal. Fuera: no aplica a este usuario.
3. **Refactor fiscal** (`f7bc128`): el motor de 303/130 sale de `app.gastos.js` a `js/fiscal.js`
   (objeto `F`); `gastoImporteFiscal()` y `B.desglosarTotal()` acaban con tres criterios
   duplicados. Verificado dando exactamente los mismos números en los tres ejemplos.
4. **Docs**: specs 01-10 (todas ✅ desde mayo) a `TODO/hechos/`, `historial.txt` a
   `docs/historial-origen.txt`, roadmap puesto al día y guía interna corregida.

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
