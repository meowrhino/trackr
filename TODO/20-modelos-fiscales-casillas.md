# 20 — Modelos fiscales: referencia de casillas (130, 303, Renta)

> Investigación 2026-07-05 con fuentes oficiales (instrucciones AEAT vigentes 2026, BOE, Manual Renta 2025).
> Objetivo: que TRACKR calcule las casillas EXACTAS de cada modelo, no una aproximación.
> Perfil objetivo: autónomo de servicios, estimación directa **simplificada**, régimen general de IVA, sin prorrata, sin criterio de caja.

---

## MODELO 130 (pago fraccionado IRPF, trimestral)

Normativa: art. 99.7 LIRPF; arts. 109-112 RIRPF; Orden EHA/672/2007.
Instrucciones oficiales: https://sede.agenciatributaria.gob.es/Sede/impuestos-tasas/impuesto-sobre-renta-personas-fisicas/modelo-130-irpf______esionales-estimacion-directa-fraccionado_/instrucciones.html

### ⚠️ LO MÁS IMPORTANTE: es ACUMULATIVO

Las casillas 01, 02 y 06 son **acumuladas desde el 1 de enero hasta el último día del trimestre** (confirmado literal AEAT). El descuento de lo ya pagado se hace vía casilla 05. **El cálculo actual de TRACKR (trimestre aislado) es incorrecto a partir de T2.**

Criterio de imputación: **devengo** por defecto (fecha de emisión de factura). Opción de caja existe (art. 7.2 RIRPF, se opta en la Renta, permanencia 3 años) — si se implementa, que sea un toggle global.

### Casillas (apartado I, actividades no agrícolas)

| Casilla | Fórmula |
|---|---|
| **01** Ingresos | Σ ingresos íntegros acumulados 1-ene → fin trimestre (bases imponibles por fecha factura + otros ingresos) |
| **02** Gastos | Σ gastos deducibles acumulados mismo período. En EDS **incluye** el 5% de difícil justificación: `02 = gastos_reales + min(5% × max(01 − gastos_reales, 0), 2000 × trimestre/4)`... ver nota abajo |
| **03** | `01 − 02` (con signo) |
| **04** | `03 > 0 ? 0.20 × 03 : 0` |
| **05** | `Σ casillas 07 POSITIVAS de trimestres anteriores del año − Σ casillas 16 de esos trimestres` (las 07 negativas NO computan) |
| **06** Retenciones | Σ retenciones soportadas acumuladas 1-ene → fin trimestre |
| **07** | `04 − 05 − 06` (puede ser negativa) |
| 08-11 | Agrícolas — siempre 0 para nuestro perfil |
| **12** | `max(07 + 11, 0)` |
| **13** Minoración art. 110.3.c | Según rendimiento neto del **año anterior**: ≤9.000€ → 100€/trim; ≤10.000 → 75; ≤11.000 → 50; ≤12.000 → 25; >12.000 → 0. Primer año de actividad: 100€ (rendimiento anterior = 0; interpretación consolidada, no literal AEAT) |
| **14** | `12 − 13` (con signo) |
| **15** | Solo si 14 > 0: Σ resultados negativos de casilla 19 de trimestres anteriores del año aún no aplicados, `≤ 14` |
| **16** Vivienda | Régimen transitorio (compra vivienda habitual < 1-1-2013 con hipoteca): `min(2% × 03, 660.14, 14 − 15)`. No aplica si ingresos anuales previsibles ≥ 33.007,20€ |
| **17** | `14 − 15 − 16` |
| **18** | Solo complementarias (0 normalmente) |
| **19** | `17 − 18`. > 0 a ingresar; < 0 en T1-T3 "a deducir" (alimenta la 15 de siguientes trimestres); en T4 "negativa" (se pierde ahí, se recupera en Renta) |

Nota difícil justificación: el 5% se aplica sobre la diferencia positiva acumulada (ingresos − resto de gastos), tope **2.000 €/año** (el tope opera sobre el cálculo acumulado, no hace falta prorratear por trimestre: `min(5% × diff_acumulada, 2000)`). El 7% fue **solo 2023**; vigente: **5%**.

### Estado que necesita TRACKR y no tiene

- Los 130 presentados de trimestres anteriores del año (casillas 07, 16 y 19 de cada uno) → o los calcula TRACKR mismo (si todos los datos del año están dentro) o campo editable por si el usuario presentó algo distinto.
- Rendimiento neto del año anterior (para casilla 13) → editable, o derivado si hay datos del año previo.
- Flag "tengo deducción vivienda 130" (casilla 16, minoría de usuarios).

### Obligación de presentar (regla del 70%)

Profesionales con ≥70% de ingresos del año anterior con retención → **no obligados** a presentar 130. Útil como aviso en la UI ("quizá ni tienes que presentar esto").

### Plazos: 1-20 abr / 1-20 jul / 1-20 oct / 1-30 ene (domiciliación: hasta el 15, 4T hasta el 27 según calendario 2026).

---

## MODELO 303 (IVA, trimestral)

Instrucciones 2026: https://sede.agenciatributaria.gob.es/Sede/todas-gestiones/impuestos-tasas/iva/modelo-303-iva-autoliquidacion_/instrucciones-2026.html
Devengo: art. 75 LIVA — por **prestación del servicio / fecha factura**, nunca por cobro. Excepción: anticipos (devengo al cobro).

### IVA devengado — numeración vigente (¡distinta de la que usa TRACKR!)

| Tipo | Base | % | Cuota |
|---|---|---|---|
| 0% | 150 | 151 | 152 |
| **4%** | **01** | 02 | **03** |
| **10%** | **04** | 05 | **06** |
| **21%** | **07** | 08 | **09** |

⚠️ **BUG actual en TRACKR** ([js/app.gastos.js](../js/app.gastos.js) `_rDinTrim`): mapea 21% → casillas 01-03. Lo correcto es **21% → 07/08/09, 10% → 04/05/06, 4% → 01/02/03** (el orden es ascendente por tipo). Y 0% → 150-152.

| Casilla | Contenido |
|---|---|
| **10/11** | Adquisiciones intracomunitarias de bienes **y servicios** (Google/Adobe/OpenAI Irlanda…): base = importe factura, cuota = base × 21%. Requiere ROI + modelo 349 |
| **12/13** | ISP de proveedores **no UE** (SaaS facturado desde EE.UU.) |
| **14/15** | Rectificativas (con signo) |
| **27** | Total devengado = Σ cuotas (para nuestro perfil: `09 + 11 + 13 + 15`) |

### IVA deducible

| Casilla | Contenido |
|---|---|
| **28/29** | Interiores **corrientes** (base/cuota) ← aquí van los gastos normales. **La cuota de la 13 se deduce aquí también** |
| **30/31** | Interiores **bienes de inversión** (>3.005,06€ plurianual) — ⚠️ TRACKR hoy pone la cuota corriente en la 30: **bug de numeración, es la 29** |
| 32/33, 34/35 | Importaciones (corrientes / inversión) |
| **36/37** | Intracomunitarias corrientes ← **contrapartida de 10/11** (neutro) |
| 40/41 | Rectificación de deducciones |
| **45** | Total = `29+31+33+35+37+39+41+42+43+44` |

### Resultado y compensación

| Casilla | Fórmula |
|---|---|
| **46** | `27 − 45` |
| **64/66** | = 46 (perfil simple, 65 = 100%) |
| **110** | Saldo a compensar pendiente de periodos anteriores (todo lo que traes) |
| **78** | Lo que APLICAS este periodo (≤ 110, hasta absorber el positivo) |
| **87** | `110 − 78` (lo nuevo negativo de este trimestre NO entra aquí) |
| **69** | `66 + 77 − 78 + 68 + 108` → perfil simple: `66 − 78` |
| **71** | Resultado final. > 0 ingresar; < 0 → casilla **72** "a compensar" (T1-T3); devolución solo en 4T |

Estado nuevo que necesita TRACKR: **saldo a compensar arrastrado** entre trimestres (casillas 110/78/87), persistente entre años (caduca a 4 años).

### Informativas (obligatorias, no suman)

- **59**: servicios B2B a cliente **UE** con VAT (ISP en destino; también va al 349 clave S).
- **120**: servicios a cliente **no UE** (EE.UU. etc.) — no sujetos por localización.
- **60**: solo exportación de **bienes**.
- La casilla 61 **ya no existe**.

Estado nuevo: el cliente necesita campo **país/tipo** (ES / UE con VAT / fuera UE) para enrutar 59/120 y avisar del 349.

### Plazos: como el 130 (4T: 1-30 ene, domiciliación hasta el 25; coincide con el resumen anual 390).

---

## RENTA (Modelo 100, apartado D1) — campaña 2025

> Aclaración: la renta es el **Modelo 100**. El 030 es censo de particulares (un autónomo usa 036/037). Nada que ver.

Manual Renta 2025 cap. 7: https://sede.agenciatributaria.gob.es/Sede/Ayuda/25Manual/100.html
AEAT publica Excel oficial de mapeo libros→casillas: https://sede.agenciatributaria.gob.es/static_files/Sede/Tema/IVA/Fact_registro/Libros_registro/Traslado_Libros_a_Casillas_IRPF.xlsx

### Cascada (EDS)

```
[0171] Ingresos explotación (bases, sin IVA)  → [0180] Total ingresos
Gastos por casilla:
  [0186] RETA del titular          [0196/0197] regularización RETA (±)
  [0191] Manutención (dietas autónomo, topes 26,67€/día ES sin pernocta, pago electrónico)
  [0194] Suministros vivienda afecta: gasto × (m² afectos/m² totales) × 30%
  [0199] Servicios profesionales (gestoría…)   [0192] alquiler  [0200] seguros
  [0202] otros servicios exteriores  [0208] amortización material
[0218] Suma gastos
[0221] Diferencia = 0180 − 0218
[0222] Difícil justificación = min(5% × max(0221,0), 2000)   ← lo calcula Renta Web solo
[0224] Rendimiento neto = 0221 − 0222
[0234] Reducción inicio actividad: 20% (1er ejercicio positivo + siguiente, base máx 100k)
[0235] Rendimiento neto reducido total
Pagos a cuenta: [0599] retenciones de facturas · [0604] Σ ingresado en los 130 del año
```

Incompatibilidad: el 5% (0222) es **incompatible** con la reducción TRADE (0232) — elegir.

### Lo que TRACKR podría precalcular para la renta

1. 0171/0180 (ingresos año, por devengo), 0599 (retenciones), 0604 (suma de 130 a ingresar).
2. Gastos agrupados por casilla de destino → requiere **mapear categorías de gasto → casilla renta** (RETA→0186, suministros→0194 con prorrateo, gestoría→0199…).
3. Calculadora de suministros (m² afectos / m² totales × 30%) y de dietas (tope diario).
4. Avisos: reducción inicio de actividad, incompatibilidad 5%/TRADE, regularización RETA (0196/0197).

---

## Divergencias del código actual (js/app.gastos.js, revisado 2026-07-05)

> **Estado 2026-07-18: las 8 resueltas.** 1-5, 7 y 8 en `ee26cec` (2026-07-05); la 6 el
> 2026-07-18 con `zonaFiscal` en cliente y gasto (ES/UE/no UE): informativas 59/120,
> ISP 10-13 + 36-37 (deducción no UE en 28/29), aviso 349, y desglose de la renta por
> casilla de gasto (0186/0192/0194/0199/0200/0202/0208, mapeo por categoría, resto → 0202).
> Sigue pendiente (documentado arriba): casilla 16 vivienda, aviso regla 70 %, campo
> editable para 130 ya presentados, y prorrateo automático de suministros (solo hay nota).

1. **130 no acumulativo** — incorrecto desde T2 (falta 01/02/06 acumuladas + casilla 05). ✅
2. **Faltan casillas 13, 15, 16** del 130 (la 13 afecta a casi todo usuario con rendimientos bajos). ✅ (16 descartada: minoría)
3. **Falta el 5% de difícil justificación** en el 130 (sí entra, confirmado AEAT) y en la vista renta. ✅
4. **303: mapeo de casillas invertido** (21% debe ser 07-09, no 01-03) y **cuota soportada en la 30 en vez de la 29**. ✅
5. **303: sin arrastre de saldo a compensar** (110/78/87). ✅
6. **303: sin ISP/intracomunitarias** (10-13 y 36-37) ni informativas 59/120 → necesita país en cliente y flag en gasto ("proveedor UE/no UE sin IVA español"). ✅ 2026-07-18
7. **Criterios inconsistentes entre vistas**: trimestral = devengo, renta anual = caja prorrateada por cobros; gastos en 130 = base, en renta = total. Unificar: fiscal siempre devengo + base (con opción de incluir IVA no deducible como gasto). ✅
8. **Retenciones**: la vista renta no suma 0599/0604. ✅
