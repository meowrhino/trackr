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

### 6. Gastos: guardar base e IVA por separado
**Cambio importante en el schema de gastos.** Actualmente cada entrada guarda solo `cantidad` (el total con IVA). Para que el cálculo trimestral sea exacto hay que guardar base e IVA por separado:
```json
"entradas": [
  { "id": "x", "fecha": "2026-01-03", "base": 17.90, "iva": 3.58, "nota": "" }
]
```
- `base`: importe sin IVA (lo que va a casilla 28 del 303 y casilla 02 del 130)
- `iva`: importe del IVA (lo que va a casilla 29 del 303)
- `cantidad` se puede mantener como campo calculado (base + iva) para compatibilidad

**¿Por qué?** Facturas en dólares (ChatGPT, Manus) calculan el IVA en euros al tipo de cambio del día. Dividir el total entre 1,21 da un resultado distinto al IVA real de la factura. La diferencia es pequeña (~0,15 € por factura) pero se acumula y no es correcto fiscalmente.

**UI del modal de gasto:** Dos campos (base + IVA) en vez de uno (cantidad). El IVA se puede auto-calcular al escribir la base (base × tipoIva%), pero debe ser editable para poder poner el IVA real de la factura.

**Migración:** Las entradas existentes que solo tienen `cantidad` se migran calculando base = cantidad / (1 + rate) e iva = cantidad - base. No es exacto para las de divisa extranjera, pero es el mejor fallback.

## Datos necesarios
- `facturaFecha` en cada proyecto — ya existe pero no siempre se rellena
- Validación/aviso si un proyecto facturado no tiene fecha de factura
- Campos `base` e `iva` separados en entradas de gastos

## Prioridad
Alta — se usa 4 veces al año y ahorra mucho tiempo + reduce errores
