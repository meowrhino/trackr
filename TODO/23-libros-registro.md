# 23 — Exportar libros registro (AEAT)

## Estado: ✅ v1 HECHA (2026-07-19) — `js/libros.js` + Exportar → "Libros registro (AEAT)"

> Cómo quedó: XLSX de llevanza conjunta tipo "T" generado sin dependencias (ZIP STORE +
> XML con inline strings, ~45 KB para una cuenta llena), cabeceras oficiales byte a byte,
> datos desde la fila 4, nombre de fichero oficial `{Ejercicio}{NIF}T{Nombre}.xlsx`.
> Campos de actividad (tipo/código/epígrafe IAE) en Config → Fiscal. Verificado: ZIP
> íntegro, XML bien formado y el fichero abre con openpyxl con tipos correctos.
> **Pendiente**: pasar el primer fichero real por el validador oficial de la sede
> ("Servicio de validación de ficheros de LLR") — hasta entonces, tratarlo como beta.
> Después: botón equivalente en el visor de gestoría (punto 4 del plan).

## Investigación (2026-07-19) — formato oficial clavado contra fuentes AEAT

Fuentes: [Formato electrónico común de los Libros Registro IVA/IRPF, V.18.02.2026 (PDF)](https://sede.agenciatributaria.gob.es/static_files/Sede/Tema/IVA/Fact_registro/Libros_registro/Formato_Electronico_Comun_Libros_Registro_IVA_IRPF.pdf)
y `PLANTILLA_LIBROS_UNIFICADOS.xlsx` (08-06-2026), de la que se extrajeron cabeceras y catálogos.

- **Formato**: XLSX obligatorio para importar (máx. 4 MB). **Llevanza conjunta tipo "T"**
  (IVA+IRPF unificados): un solo fichero sirve para Renta Web (D1), Pre303 **y modelo 130**.
- **Nombre del fichero**: `{Ejercicio}{NIF}T{Nombre}.xlsx` (concatenados, en ese orden).
- **Pestañas**: `EXPEDIDAS_INGRESOS` y `RECIBIDAS_GASTOS` (y `BIENES-INVERSIÓN`, fuera de
  nuestra v1). Cada libro cubre **del 1 de enero al fin del trimestre elegido** (SIN
  fraccionar por trimestre) — igual que nuestro 130 acumulativo.
- **Cabeceras**: 3 filas (grupo / subcampo / tipo de dato); datos desde la fila 4.
  EXPEDIDAS_INGRESOS: 36 columnas (A-AJ). RECIBIDAS_GASTOS: 42 (A-AP).
- **Validador oficial**: "Servicio de validación de ficheros de LLR" en la sede — probar
  ahí el primer fichero generado antes de darlo por bueno.

### Mapeo TRACKR → columnas (perfil TODO/20: servicios, EDS, régimen general)

**EXPEDIDAS_INGRESOS** (una fila por factura emitida, fuente `projects[].facturacion`):
Ejercicio/Periodo (1T-4T por fecha factura) · Actividad (tipo/código/IAE — nuevos campos en
Config→Fiscal) · Tipo factura F1 (cliente con NIF) / F2 · Concepto **I01** · Ingreso
computable = base · Fecha expedición dd/mm/yyyy · Serie+Número · NIF destinatario (tipo
01 ES / 02 UE NIF-IVA / 06 resto, según zonaFiscal) · Clave operación 01 · Calificación
**S1** (ES con IVA) / **N2** (exterior sin IVA español, no sujeta por localización) ·
Total/Base/Tipo/Cuota · Retención IRPF (tipo + importe).

**RECIBIDAS_GASTOS** (una fila por entrada de gasto desgravable + una por deducible):
Tipo factura F1 (con NIF proveedor) / F2 (ticket) / SF (deducibles sin factura, p.ej. RETA) ·
Concepto por categoría: cotizacion→**G45**, suministros→**GY4**, gestoria/asesoria→**G19**,
seguros→**G20**, amortizacion→**GY8**, alquiler→**G12**, material→**G03**, resto→**G22**,
otro→**G37** · Gasto deducible = base (ES) o base+IVA (extranjero, criterio TODO/20) ·
Identificación factura = numFactura · NIF expedidor = nifProveedor · Clave operación gasto
01 / **09** (adquisiciones intracomunitarias, zonaFiscal ue) · **ISP = S** para ue/noue ·
Total/Base/Tipo/Cuota soportada/Cuota deducible.

### Notas de implementación

- XLSX generado sin librerías: ZIP con entradas **STORE** (sin comprimir, CRC32 propio) +
  XML mínimo con **inline strings**. Cabe de sobra en 4 MB.
- Catálogos completos (conceptos, claves, tipos NIF/factura, calificaciones) extraídos de
  la pestaña CODIGO-LITERAL de la plantilla — copiados en js/libros.js como constantes.

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
