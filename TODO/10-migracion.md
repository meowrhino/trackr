# 10 — Migración de datos (versioning)

## Se hace AL FINAL, cuando la estructura esté estable

## Concepto
Función `migrate(data)` en `store.js` que transforma un JSON antiguo (v1) al formato nuevo (v2+).

## JSON v1 (actual)
```json
{
  "projects": [...],
  "settings": { "defaultIva": 21, "defaultIrpf": 15, "usuario": "meowrhino" }
}
```

## JSON v2 (objetivo)
```json
{
  "version": 2,
  "clientes": [...],
  "projects": [...],
  "gastos": [...],
  "settings": {
    "emisor": { "nombre": "", "direccion1": "", "direccion2": "", "nif": "" },
    "defaultIva": 21,
    "defaultIrpf": 15,
    "targets": { "horasMes": null, "ingresosMes": null, "horasSemana": null },
    "nextFacturaNum": 1
  }
}
```

## Migración v1 → v2
1. Añadir `version: 2`
2. Extraer clientes únicos de `projects[].cliente` → crear array `clientes`
3. En cada proyecto: reemplazar `cliente` (string) por `clienteId` (referencia)
4. Mapear estados: `en_progreso` → `activo`, `pendiente` → `pausado`, `completado` → `completado`
5. Añadir flags: `interno: false`, `recurrente: false` a cada proyecto
6. Añadir campos facturación: `ivaExcepcion`, `facturaNum`, `facturaFecha`
7. Crear `gastos: []`
8. Ampliar settings con `emisor`, `targets`, `nextFacturaNum`
9. Eliminar `settings.usuario` (reemplazado por `settings.emisor.nombre`)

## Implementación
- `D.init()`: al cargar, si no hay `version` o es < CURRENT, ejecuta `migrate()`
- `D.load()` (import): igual, migra antes de guardar
- Botón "Importar" existente funciona transparentemente
- No hace falta botón separado "Update JSON"

## JSON de prueba
El backup del usuario (`trackr_backup_2026-02-17_17-19.json`) con 11 proyectos y 3 estados usados.
