# 12 — Gastos recurrentes: gestión avanzada

## Problema actual
Los gastos recurrentes (mensual/anual) requieren añadir cada entrada manualmente. No hay forma de:
- Generar entradas automáticamente cada mes/año
- Pausar/reanudar la recurrencia
- Cambiar el importe base sin afectar entradas anteriores
- Ver de un vistazo si un gasto recurrente está al día o atrasado

## Casos de uso reales
- **Cuota autónomos**: siempre la misma cifra, pero puede subir de un mes a otro (cambio de tramo)
- **Claude/ChatGPT**: cobro en dólares, el importe exacto en euros varía cada mes
- **Dominio/hosting anual**: mismo importe cada año, se renueva automáticamente

## Propuesta

### 1. Importe base configurable
- Nuevo campo `importeBase` en el gasto recurrente
- Al añadir nueva entrada, se pre-rellena con el importe base
- El usuario puede modificarlo antes de guardar (ej: Claude varía cada mes)

### 2. Recordatorio / entrada pendiente
- Si un gasto mensual no tiene entrada este mes, mostrar aviso visual (badge o color)
- Botón rápido "Registrar este mes" que crea la entrada con el importe base y fecha de hoy
- Para anuales, lo mismo pero con el mes de renovación

### 3. Pausar / reanudar
- Ya existe `finHasta` para marcar fin de recurrencia
- Añadir UI clara: botón "Pausar" que pone `finHasta` al mes actual
- Botón "Reactivar" (ya implementado con checkbox en modal de edición)
- Mostrar badge "Pausado" en la tarjeta del gasto

### 4. Historial de cambios de importe
- Al cambiar `importeBase`, las entradas anteriores no se tocan
- Las nuevas entradas usan el nuevo importe base
- En la vista expandida se ve claramente cuándo cambió el importe

## Datos
Cambios al schema de `gastos`:
```json
{
  "importeBase": 88.56,
  "diaRecurrente": 27,
  "finHasta": "2026-03" | null
}
```
- `importeBase`: cantidad por defecto para nuevas entradas
- `diaRecurrente`: día del mes en que se genera/espera el cobro (para anuales: día del año)
- `finHasta`: ya existe, mes en que se pausó

## UI

### Tarjeta de gasto recurrente
- Mostrar importe base junto al nombre
- Badge "Pausado" si `finHasta` está definido
- Indicador si falta entrada del mes/año actual (punto naranja o similar)
- Botón rápido "+ Este mes" visible directamente en la tarjeta (sin abrir modal)

### Modal de edición
- Campo "Importe base" visible solo para recurrentes
- Campo "Día de cobro" (1-31)
- Toggle pausar/reactivar más visible que el checkbox actual

## Prioridad
Media — mejora calidad de vida para el seguimiento mensual de gastos fijos

## Estado: ✅ HECHO (12 may 2026, commit 587eab2)

Lo implementado:
- Campo `importeBase` editable en `gModal` (solo cuando recurrencia ≠ "no").
- Campo `diaRecurrente` (1-31) editable en `gModal`.
- `geModal` pre-rellena base/iva/total desde `importeBase` + `tipoIva` cuando se añade entrada nueva a un gasto recurrente.
- Card del gasto recurrente: detecta si falta entrada del mes actual (solo en vista "mes" del mes actual, gasto mensual, no pausado) → marca la card con fondo cálido + ⚠ junto al nombre + botón "+ Este mes".
- `quickAddRecurring(gid)` añade la entrada con fecha de hoy reutilizando `importeBase` (calcula base/iva desde `tipoIva`). Si no hay `importeBase`, abre `geModal` normal.

Lo pendiente / posible mejora futura:
- Aviso visual para gastos **anuales** que no tengan entrada en el año actual (hoy solo se detecta el mensual).
- Historial de cambios de `importeBase` (idea original del brief): no implementado. Por ahora, los `importeBase` antiguos quedan implícitos en los `total` de las entradas históricas — basta para el caso real.
