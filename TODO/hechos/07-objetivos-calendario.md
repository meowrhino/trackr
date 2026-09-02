# 07 — Objetivos en calendario

## Concepto
Los targets de `settings.targets` se muestran como barras de progreso en el calendario.

## Vista mensual (debajo del grid, antes de "Proyectos en este periodo")
```
Objetivos febrero
├── Horas    ████████░░░░  32.5 / 40h
└── Ingresos ██████░░░░░░  1.800 / 3.000€
```

## Vista semanal
```
Objetivo semanal
└── Horas    ██████████░░  9.5 / 10h
```

## Cálculo
- Horas: suma de `h.cantidad` de todos los proyectos en el mes/semana
- Ingresos: suma de `totalFactura` de proyectos con `fechaPago` en el mes

## UI
- Barras CSS (misma técnica que resumen financiero)
- Si no hay targets configurados: enlace "Configura tus objetivos →" que lleva a Configuración
- Color de barra: verde si >= 100%, naranja si < 50%, neutro entre medias
