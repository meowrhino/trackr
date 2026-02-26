# 02 — Nuevos estados + flags

## Problema
Los estados actuales mezclan estado de trabajo, tipo de proyecto y estado de facturación:
`pendiente | en_progreso | completado | recurrente | facturado | pagado`

## Cambios

### Estado del trabajo (dropdown en modal)
| Antes | Después |
|-------|---------|
| pendiente | **pausado** |
| en_progreso | **activo** |
| completado | **completado** |
| recurrente | eliminado (pasa a flag) |
| facturado | eliminado (ya existe en facturación) |
| pagado | eliminado (ya existe en facturación) |

### Nuevos flags (checkboxes en modal de proyecto)
- `interno` (bool) — proyecto propio, sin cliente externo
- `recurrente` (bool) — bolsa de horas, mantenimiento, servicio continuo

### utils.js
Actualizar `EST` a los 3 estados nuevos con labels y colores.

### Dashboard
- Agrupar por: activo → pausado → completado
- Filtrar por: todos | internos | externos | recurrentes
- Indicador visual de facturado/pagado en cada card (icono o badge)

### Datos actuales del JSON del usuario
Estados en uso: `en_progreso` (8), `completado` (2), `pendiente` (1)
No hay `recurrente`, `facturado` ni `pagado` usados como estado.
Mapeo limpio: en_progreso→activo, pendiente→pausado, completado→completado.
