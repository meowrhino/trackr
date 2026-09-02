# 05 — Gastos

## Concepto
Nueva entidad independiente de proyectos. Un gasto puede ser puntual (dominio, licencia) o tener varias entradas (mentoring, formación).

## Datos
Nuevo array `gastos` en la raíz:
```json
"gastos": [
  {
    "id": "xxx",
    "nombre": "Mentoring LinkedIn",
    "categoria": "formacion",
    "entradas": [
      { "id": "yyy", "fecha": "2026-02-01", "cantidad": 200, "nota": "sesión 1" },
      { "id": "zzz", "fecha": "2026-02-15", "cantidad": 200, "nota": "sesión 2" }
    ],
    "recurrente": "no",
    "notas": ""
  }
]
```

### Categorías
`herramientas` | `formacion` | `software` | `marketing` | `oficina` | `otro`

### Recurrencia
`no` | `mensual` | `anual`

## UI

### Vista Gastos (nueva, en sidebar)
- Lista de gastos con: nombre, categoría (badge), total calculado, nº entradas
- Click → detalle expandible con lista de entradas
- Botón "+ Nuevo gasto"
- Total del mes/año visible arriba

### Modal de gasto
- Nombre, categoría (dropdown), recurrente (toggle), notas
- Lista de entradas (fecha + cantidad€ + nota)
- Botón "+ Añadir entrada"

### Sidebar
Nuevo item: `€` Gastos (debajo de Calendario, antes del separador)
