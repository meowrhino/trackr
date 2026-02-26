# 01 — Clientes como entidad

## Problema
Ahora `cliente` es un string suelto en cada proyecto. Para facturación necesitamos dirección y NIF. Además hay clientes repetidos (ej: "meowrhino" aparece en 2 proyectos).

## Cambios

### Datos
Nuevo array `clientes` en la raíz del JSON:
```json
"clientes": [
  { "id": "xxx", "nombre": "meowrhino", "direccion1": "", "direccion2": "", "nif": "", "color": "Gold" }
]
```

Cada proyecto pasa de `cliente: "meowrhino"` a `clienteId: "xxx"` (referencia).

### store.js
- `D.cls()` — todos los clientes
- `D.cl(id)` — cliente por ID
- `D.addCl(c)`, `D.upCl(id, u)`, `D.delCl(id)` — CRUD

### UI
- Modal de cliente (nombre, dirección1, dirección2, NIF, color)
- En el modal de proyecto: dropdown de clientes (en vez de input text)
- Opción de crear cliente nuevo desde el modal de proyecto
- Sección de gestión de clientes en Configuración (lista, editar, eliminar con confirmación)

### Compatibilidad
- Al migrar (tarea 10): extraer clientes únicos de los proyectos existentes, crear entidades, reemplazar strings por IDs
