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

### 6. Gastos: guardar total e IVA reales (sin cálculos inversos)
**Principio clave: trackr no calcula IVAs ni bases. Todos los números son reales, sacados de la factura.**

Actualmente cada entrada guarda solo `cantidad` (el total con IVA) y trackr intenta calcular la base diviendo por 1,21. Esto falla con facturas en divisas (ChatGPT en USD, Manus en USD) donde el IVA en EUR lo calcula Stripe al tipo de cambio del día.

**Nuevo schema:**
```json
"entradas": [
  { "id": "x", "fecha": "2026-01-03", "cantidad": 21.48, "iva": 3.58, "nota": "" }
]
```
- `cantidad`: lo que pagaste (total factura) — el usuario lo pone
- `iva`: el IVA real de la factura — el usuario lo pone
- La base la calcula trackr como `cantidad - iva` (esto sí es una resta exacta, no una aproximación)

**UI del modal de entrada de gasto:**
- Campo "Total (€)": lo que has pagado (obligatorio)
- Campo "IVA (€)": el IVA de la factura (opcional, default 0)
- Se muestra debajo en gris: "Base: X,XX €" calculado como total - IVA
- NO hay auto-cálculo del IVA desde el tipo %. El usuario pone el número real
- Para gastos exentos (autónomos) simplemente se deja IVA en 0

**¿Por qué total + IVA y no base + IVA?**
- El total es lo que ves en el banco / lo que pagas — es el número más natural
- El IVA aparece claro en todas las facturas
- La base es el número que menos gente tiene a mano

**Migración:** Las entradas existentes que solo tienen `cantidad` se migran con `iva = cantidad * rate / (1 + rate)`. No es exacto para divisas pero es el mejor fallback. El usuario puede corregirlo editando la entrada.

## Datos necesarios
- `facturaFecha` en cada proyecto — ya existe pero no siempre se rellena
- Validación/aviso si un proyecto facturado no tiene fecha de factura
- Campo `iva` real en entradas de gastos (base = cantidad - iva)

## Prioridad
Alta — se usa 4 veces al año y ahorra mucho tiempo + reduce errores
