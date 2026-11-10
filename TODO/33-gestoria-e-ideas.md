# 33 · Preguntas para la gestoría e ideas para más adelante

Apuntado el 10 nov 2026, al cerrar la auditoría. Nada de esto bloquea: son dudas
fiscales que no conviene resolver a ojo y diseños que piden pensarlo con calma.

## Preguntas para la gestoría

1. **% de gastos de difícil justificación (estimación directa simplificada).**
   trackr usa siempre el 5 % con tope de 2.000 €/año (`js/fiscal.js`, `F.casillas130`,
   y `js/app.gastos.js` para la renta). En 2023 fue el 7 %. ¿Qué porcentaje toca cada
   año (2024, 2025, 2026…)? Si cambia por año, pasarlo a una tabla `{año: %}`.
2. **Factura española con IVA 0 %: ¿casillas de exenta o de tipo 0 %?**
   Hoy va a 150–152 (tipo 0 %, `js/fiscal.js`). Si es una operación exenta (formación,
   art. 20 LIVA) quizá debería ir a otra casilla del 303/390.
3. **Traducción literaria: ¿qué IVA?** El ejemplo de Marina factura sus novelas al 4 %
   (`examples/marina_traductora.json`). Según el caso podría ser exenta (art. 20.Uno.26º
   LIVA) o al 21 %. Corregir el ejemplo según la respuesta.
4. **Cobros sueltos sin factura** («Cobro (€)» en una hora). Hoy cuentan en el 130 pero no
   salen en los libros registro. ¿Se declaran así, o todo cobro lleva factura (aunque sea
   simplificada)? manu no los usa; si la respuesta es «siempre factura», quitarlos del 130
   y avisar en el campo.

## Ideas para más adelante

1. **Varias facturas por proyecto.** Hoy un proyecto tiene una factura (`p.facturacion`)
   más sus rectificativas. Para trabajos largos (MONICAS, PETRA) o pagos por fases haría
   falta `p.facturas = [...]`, cada una con su número, fecha, base y cobros. Toca el modelo
   de datos, 303/130/390, libros, PDF, cobros, sync y gestoría: pensarlo antes de empezar.
2. **Rectificativas en VeriFactu** (registro R). Hoy la rectificativa avisa de que no se
   envía. Va con el resto de VeriFactu (TODO/15), aparcado.
3. **VeriFactu: no duplicar registros** al volver a descargar una factura o con doble clic
   (reutilizar el registro existente y bloquear la reentrada en `genFactura`). Antes de
   activar VeriFactu en serio.
