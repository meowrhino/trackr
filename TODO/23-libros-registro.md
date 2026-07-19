# 23 — Exportar libros registro (AEAT)

## Estado: 💡 diseñado (2026-07-19) · pendiente de investigación del formato oficial

## La idea

Exportar los **libros registro** que un autónomo en estimación directa debe llevar:
facturas expedidas y recibidas (IVA) + ingresos/gastos (IRPF). Es la entrega natural
a una gestoría — hoy Diego los montaría a mano desde el visor; con esto se los descarga.

La AEAT publica un **formato tipo en Excel** con columnas normalizadas, y el servicio
**Pre303** importa libros en ese formato para precargar el modelo. Referencia ya usada
en TODO/20: el Excel oficial de traslado libros→casillas IRPF.

## Plan (método TODO/20: primero el formato oficial, no de memoria)

1. **Investigar**: descargar la plantilla oficial de la AEAT y clavar columnas exactas
   de cada libro (expedidas / recibidas / ingresos-gastos). Confirmar si Pre303 exige
   XLSX estricto o admite CSV.
2. ~~**Datos que faltan**~~ ✅ hecho (2026-07-19): `nifProveedor` en el gasto y
   `numFactura` en cada entrada, opcionales, en los tres modales (gasto puntual,
   editar gasto y entrada). Los datos empiezan a acumularse desde ya.
   - Pendiente de revisar al investigar el formato: si la fecha de operación ≠
     fecha de expedición importa para nuestro perfil.
3. **Generación**: en Exportar, junto al JSON — "Libros registro (año X)". Empezar por
   CSV por libro (abre en cualquier Excel); XLSX solo si Pre303 lo exige (evaluar coste
   de una lib mínima vs. generar SpreadsheetML a mano; nada pesado tipo SheetJS entero).
4. **Gestoría**: botón equivalente en el visor de cartera (los datos ya los tiene
   descifrados; es solo render).

## Fuentes de datos (ya existen)

- Expedidas: `facturas[]` (número, fecha, cliente+NIF, base, tipo, cuota, IRPF) +
  proyectos facturados.
- Recibidas: `gastos[]` con entradas (base/iva/total/tipoIva por fecha) — falta NIF/nº.
- Ingresos/gastos IRPF: mismas fuentes con criterio de devengo (ya unificado).
