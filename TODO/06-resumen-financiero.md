# 06 — Resumen financiero en Info

## Concepto
La vista Info/Home muestra la "salud del negocio" con gráficos CSS/SVG puros.

## Secciones

### Resumen del periodo (toggle: mes | trimestre | año)
```
Facturado    ████████████████░░░░  2.400€
Cobrado      ████████████░░░░░░░░  1.800€
Gastos       ███░░░░░░░░░░░░░░░░░   340€
                                  ─────────
Neto                               1.460€

Horas                               47.5h
€/hora real                        30.7 €/h
```

### De dónde salen los datos
- **Facturado**: suma de `totalFactura` de proyectos con `estado === 'completado'` o factura emitida en el periodo
- **Cobrado**: suma de `totalFactura` de proyectos con `pagado === true` y `fechaPago` en el periodo
- **Gastos**: suma de entradas de gastos con fecha en el periodo
- **Horas**: suma de todas las horas de todos los proyectos en el periodo
- **€/hora real**: (cobrado - gastos) / horas

### Vista trimestral (para impuestos)
Trimestres naturales (Q1: ene-mar, Q2: abr-jun, Q3: jul-sep, Q4: oct-dic).
Muestra totales de:
- Base imponible total
- IVA repercutido total
- IRPF retenido total
- Datos útiles para modelo 303 y 130

### Implementación
- Barras CSS puras (`div` con `width: X%` sobre fondo)
- Navegación: `◂ Feb 2026 ▸` con toggle `Mes | Trim | Año`
- Sin dependencias externas
