# 08 — Resumen financiero en calendario

## Concepto
Debajo de "Proyectos en este periodo", un bloque con los números del periodo.

## Contenido
```
Resumen del mes
├── Cobrado:    2.400€  (proyectos pagados este mes)
├── Gastos:      -340€
├── Neto:       2.060€
├── Horas:       47.5h
└── €/h real:   43,4 €/h
```

## Cálculo
- **Cobrado**: proyectos con `pagado && fechaPago` en el mes
- **Gastos**: entradas de gastos con fecha en el mes (requiere feature 05)
- **Neto**: cobrado - gastos
- **Horas**: suma de horas del mes (ya se calcula en `pStats`)
- **€/h real**: neto / horas

## UI
- Mismo estilo que `_calProjStats` (cards compactas)
- Se muestra tanto en vista mes como semana
- Si no hay ingresos ni gastos en el periodo: no se muestra
