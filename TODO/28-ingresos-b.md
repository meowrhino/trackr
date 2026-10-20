# 28 — Ingresos sin factura ("en B"): trackearlos sin declararlos

## Estado: 💡 diseñado (17 sep 2026) · pendiente de construir

## Contexto

Hay trabajos que se cobran sin factura. Hoy la única forma de meterlos en TRACKR es
falsearlos: o los declaras (y te salen en el 303/130 que no tocan), o los pones en
`modo: 'gratis'` y pierdes el importe — porque `B.calc()` con `gratis` pone a cero
`baseImponible`, `total`, `totalFactura`, `pagado` y `fechaPago`, y eso corre en cada
render seguido de `D.save()`. Es decir: hoy no hay ningún sitio donde apuntar ese dinero.

Lo que se quiere: que se trackeen igual (horas, calendario, cobros, rentabilidad) y que
**en Dineros salgan aparte** de los facturados, sin tocar ni un modelo fiscal.

## Diseño

**Dato**: modo de facturación nuevo `sin_factura` en `p.facturacion.modo`.
Se comporta como `desde_base` (guarda importe, cobros, pagado/fechaPago) con IVA e IRPF
forzados a 0. **No hereda el borrado de `gratis`** — ese es el punto entero.

**Exclusión** (los tres únicos sitios por donde el dinero entra a lo fiscal):
- `js/fiscal.js` — `F.quarter()` y `F.renta()` saltan el proyecto entero (también sus
  `horas[].monto`, que hoy suman a ingresos sin pasar por `facturacion`).
- `js/libros.js` — fuera del libro de expedidas.
- Sin botón de factura/PDF ni cola verifactu para esos proyectos.

**Dineros**:
- `B.financialSummary()` devuelve el bruto partido: `brutoFacturado` / `brutoSinFactura`,
  con los segmentos de ingreso marcados.
- Dos bloques: *Con factura* (base, IVA, retenciones, cobrado/pendiente) y *Sin factura*
  (importe y cobros; no hay IVA ni IRPF que mostrar). Total real sumando los dos.
- Barras: mismo color del proyecto, tramo sin factura en trama rayada. Interruptor
  "ver solo declarado".
- **Los gastos NO se parten**: no hay "gastos en B". Un solo bloque, como ahora.

**Decisión pendiente**: el neto. Propuesta — el neto "de bolsillo" resta los gastos al
total (facturado + sin factura), porque los gastos se pagan igual; el resultado fiscal
se calcula solo con lo facturado.

## Riesgo a vigilar

Que lo sin factura se cuele por descuido en una exportación (libros registro, JSON para
la gestoría, blob sombra del grant). Cada salida hacia fuera necesita su filtro explícito
y un test que lo fije.
