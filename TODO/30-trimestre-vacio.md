# 30 — Dineros abre en un trimestre vacío y parece que no hay nada declarado

## Estado: 🐛 diagnosticado (17 sep 2026) · arreglo pequeño

## El caso real

17 sep 2026: "yo tenía declarado a jordi bretcha y ahora me sale como que no".

No se había perdido nada. La factura estaba, y está: **nº10, 23-jun-2026, 485 € + 21% IVA
= 586,85 €, cobrada el 29-jun**. Comprobado contra 104 backups (feb→jun) y contra el export
del 17-sep: ni un registro desaparecido, ninguna versión de la nube encoge.

Lo que pasa es que la vista Dinero arranca en **el mes de hoy** (`App.dinM = new Date().getMonth()`,
`js/app.gastos.js:11`) y el resumen trimestral pinta el trimestre de ese mes
(`q = Math.floor(m / 3)`). En septiembre eso es el **T3**, y con los datos reales el T3 está
a cero: última factura de junio. Ejecutando el motor sobre el export:

```
T1 → ingresos 2.410,00   303 T1: c71 = 351,02
T2 → ingresos 1.820,00   303 T2: c71 = 378,41   ← aquí está Jordi
T3 → ingresos     0,00   303 T3: {}             ← lo que ve el usuario al abrir
```

Un 303 en blanco y un 130 con casilla 07 a cero se leen como "no está declarado".

## Arreglo

- Si el trimestre visible está vacío pero hay datos antes en el año, decirlo en vez de
  pintar ceros: "sin facturas en el T3 · el T2 tiene 1.820 €", con un salto al T2.
- Que se vea SIEMPRE qué trimestre se está mirando (hoy hay que deducirlo del selector de mes).
- El 130 ya es acumulativo y muestra el año entero: no confundir ese bloque con el del 303.
