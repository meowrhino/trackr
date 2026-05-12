# 13 — Asistente trimestral (303 + 130)

## Problema
Cada trimestre hay que calcular a mano los números del Modelo 303 y 130 cruzando facturas, gastos y retenciones. Trackr ya tiene toda la info pero no la presenta en formato "listo para declarar".

## Propuesta

### 1. Vista "Declaración trimestral"
Nuevo apartado dentro de Dineros (o botón en el resumen fiscal existente) que genera directamente las casillas del 303 y 130 con los números finales.

### 2. Modelo 303 — auto-calculado
- **Casilla 01**: Suma de bases imponibles de facturas emitidas en el trimestre (por `facturaFecha`, NO por fecha de cobro)
- **Casilla 02**: Tipo IVA (21%, o desglosar si hay varios tipos)
- **Casilla 03**: Cuota IVA repercutido
- **Casillas 28-29**: Base y cuota IVA soportado (gastos desgravables con IVA > 0%)
- **Casilla 46/71**: Resultado a ingresar

### 3. Modelo 130 — auto-calculado
- **Casilla 01**: Ingresos = bases imponibles por fecha de emisión de factura
- **Casilla 02**: Gastos deducibles = todos los gastos desgravables (con y sin IVA, ej: cuota autónomos)
- **Casilla 03**: Rendimiento neto
- **Casilla 04**: 20% del rendimiento
- **Casilla 05**: Retenciones = suma de IRPF retenido en facturas del trimestre
- **Casilla 07/19**: A ingresar

### 4. Criterio de devengo (fecha emisión factura)
**Cambio importante**: actualmente el cálculo fiscal usa la fecha de cobro. Debe usar `facturaFecha` (fecha de emisión):
- Una factura emitida el 18/03 cuenta para T1 aunque se cobre en T2
- Esto afecta al IVA repercutido (303) y a los ingresos (130)
- Mantener la vista financiera actual (por cobros) como está — es útil para cash flow
- La vista trimestral/fiscal es la que usa devengo

### 5. UI
- Tarjeta por modelo (303 y 130) con las casillas numeradas
- Formato tabla limpio que se pueda copiar fácilmente
- Selector de trimestre (T1-T4) y año
- Opcionalmente: botón "Copiar" para pegar en la sede electrónica
- Indicador visual si hay facturas sin `facturaFecha` (para avisar que falta dato)

### 6. Gastos: guardar los 3 campos reales como en una factura
**Principio clave: trackr no calcula nada. Todos los números son reales, sacados directamente de la factura. Como en una factura normal: base, IVA y total.**

Actualmente cada entrada guarda solo `cantidad` (el total con IVA) y trackr intenta calcular la base dividiendo por 1,21. Esto falla con facturas en divisas (ChatGPT en USD, Manus en USD) donde el IVA en EUR lo calcula Stripe al tipo de cambio del día.

**Nuevo schema:**
```json
"entradas": [
  { "id": "x", "fecha": "2026-01-03", "base": 17.90, "iva": 3.58, "total": 21.48, "tipoIva": 21, "nota": "" }
]
```
- `base`: subtotal / base imponible — lo que pone la factura
- `iva`: importe del IVA — lo que pone la factura
- `total`: lo que has pagado — lo que pone la factura
- `tipoIva`: tipo de IVA (21%, 10%, 4%, 0%) — lo que pone la factura
- Trackr NO calcula ninguno de estos campos. Los 3 son datos reales del usuario.

**UI del modal de entrada de gasto:**
- Campo "Base imponible (€)": subtotal sin IVA
- Campo "IVA (€)" + selector tipo (21%, 10%, 4%, 0%)
- Campo "Total (€)": lo que has pagado
- Los 3 campos son editables e independientes
- Para gastos exentos (autónomos): base = total, IVA = 0

**Migración:** Las entradas existentes que solo tienen `cantidad` se migran con:
- `total` = cantidad existente
- `iva` = cantidad * rate / (1 + rate) (aproximación)
- `base` = total - iva
- No es exacto para divisas pero es el mejor fallback. El usuario puede corregirlo editando.

## Datos necesarios
- `facturaFecha` en cada proyecto — ya existe pero no siempre se rellena
- Validación/aviso si un proyecto facturado no tiene fecha de factura
- Campos `base`, `iva`, `total` y `tipoIva` reales en entradas de gastos (sin cálculos)

## Prioridad
Alta — se usa 4 veces al año y ahorra mucho tiempo + reduce errores

## Estado: ✅ HECHO (12 may 2026, commit 587eab2)

Lo implementado:
- `_rDinTrim` reescrito para mostrar **casillas numeradas AEAT** en lugar de filas genéricas:
  - **303**: casillas 01/02/03 para IVA 21%, 04-06 para 10%, 07-09 para 4% (solo se renderiza el tipo que realmente aparece en el periodo). Casillas 28 (base IVA soportado) y 30 (cuota IVA soportado). Resultado en casilla **46** (a ingresar) o **71** (a devolver) con color según signo.
  - **130**: casillas 01 (ingresos), 02 (gastos deducibles), 03 (rendimiento neto), 04 (20%), 06 (retenciones). Resultado en casilla **07** (a ingresar) o **14** (a devolver).
- **IVA repercutido agrupado por tipo** en lugar de una sola línea — los autónomos con múltiples tipos (intracomunitario 0%, libros 4%, etc.) ven el desglose real.
- **Criterio de devengo** ya estaba: usa `facturaFecha` para el cálculo, no fecha de cobro.
- **Warning visual** cuando hay proyectos con `baseImponible > 0` pero sin `facturaFecha` → se listan los nombres y se explica que no entran en el cálculo. Evita errores silenciosos.
- Botón **"📋 Copiar casillas"** por modelo: copia al portapapeles un texto plano con las casillas formateadas, listo para pegar en la sede electrónica de Hacienda. Usa `navigator.clipboard` con fallback `execCommand`.
- Toast confirma "Casillas copiadas al portapapeles" en el idioma activo.
- i18n nuevo en ES/EN/CA: `din.toRefund`, `vatRate`, `vatChargedAmt`, `inputBase`, `inputVat`, `twentyPercent`, `copyBoxes`, `copied`, `noInvoicesThisPeriod`, `missingDateWarn`.
- Gastos con `base/iva/total` separados ya estaba (TODO #13.6, migrado en abril).

Lo pendiente / posible mejora futura:
- Exportar a XML para presentación directa (la AEAT acepta XML para 303/390). Hoy el usuario copia las casillas y las pega a mano.
- Botón "Marcar trimestre como presentado" para historizarlo en el JSON.
