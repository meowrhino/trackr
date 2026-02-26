# 09 — Generación de facturas

## Concepto
Integrar el generadorFacturas directamente en trackr. Desde el detalle de un proyecto: "Generar factura" → abre modal con preview → descarga PDF.

## Dependencia
- jsPDF (CDN, como en generadorFacturas)
- Requiere: clientes con datos fiscales (01), configuración con emisor (04)

## Datos adicionales en proyecto
```json
"facturacion": {
  ... (existentes),
  "ivaExcepcion": "",
  "facturaNum": null,
  "facturaFecha": null
}
```

## Datos necesarios para generar
| Campo | Fuente |
|-------|--------|
| Emisor (nombre, dir, NIF) | `settings.emisor` |
| Cliente (nombre, dir, NIF) | `clientes[clienteId]` |
| Nº factura | `settings.nextFacturaNum` (auto-increment) |
| Fecha | Hoy o manual |
| Asunto | Nombre del proyecto |
| Base imponible | `facturacion.baseImponible` o `.total` según modo |
| IVA/IRPF | `facturacion.iva`, `facturacion.irpf` |
| Excepción IVA | `facturacion.ivaExcepcion` |

## Flujo
1. Detalle del proyecto → botón "Generar factura"
2. Modal con preview (como en generadorFacturas)
3. Se puede ajustar asunto/fecha antes de descargar
4. "Descargar" → genera PDF + JSON, marca proyecto como facturado
5. `settings.nextFacturaNum++`

## Añadir a index.html
```html
<script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
```
