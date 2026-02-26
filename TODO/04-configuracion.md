# 04 — Configuración

## Problema
No hay sección de configuración. Los datos del emisor (nombre, dirección, NIF) son necesarios para facturación. Los targets para objetivos.

## Nueva vista: Configuración

Accesible desde sidebar (icono ⚙ debajo del separador, junto a export/import).

### Secciones

**Datos del emisor** (para facturas)
- Nombre / empresa
- Dirección línea 1
- Dirección línea 2
- NIF
- Se guarda en `settings.emisor`

**Valores por defecto**
- IVA % (ya existe: `settings.defaultIva`)
- IRPF % (ya existe: `settings.defaultIrpf`)

**Objetivos**
- Horas / mes
- Ingresos / mes (€)
- Horas / semana
- Se guarda en `settings.targets`

**Gestión de clientes**
- Lista de clientes con nombre + color
- Editar / eliminar (con modal de confirmación)
- Añadir nuevo cliente

### Datos
```json
"settings": {
  "version": 2,
  "emisor": { "nombre": "", "direccion1": "", "direccion2": "", "nif": "" },
  "defaultIva": 21,
  "defaultIrpf": 15,
  "targets": { "horasMes": null, "ingresosMes": null, "horasSemana": null },
  "nextFacturaNum": 1
}
```
