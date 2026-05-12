# 15 — Verifactu / homologación SIF

## Estado: ⏳ pendiente · deadline 1 jul 2027

### Contexto normativo

- **Real Decreto 1007/2023** establece el reglamento del Sistema Informático de Facturación (SIF) "Verifactu".
- **Orden HAC/1177/2024** desarrolla los requisitos técnicos.
- **Real Decreto-ley 15/2025** (BOE 03/12/2025) aplaza las fechas:
  - **1 enero 2027** → sociedades obligadas.
  - **1 julio 2027** → autónomos en estimación directa.
- La AEAT **no homologa** software; los fabricantes auto-certifican mediante **declaración responsable** firmada y, en buenas prácticas, publicada en URL abierta del dominio.
- Sanciones: hasta **50.000 €/ejercicio** por uso de software no homologado.

### Estado de la competencia

- **Quipu**: declaración firmada 29 jul 2025, publicada en URL pública (`getquipu.com/es/verifactu-declaracion-responsable.html`). Código SIF `1Q`. El más transparente.
- **Holded**: activo, accesible solo dentro del producto.
- **Contasimple**: declaración firmada 29 jul 2025, accesible solo dentro del producto.

### Requisitos técnicos SIF (resumen)

Lo que TRACKR debe garantizar en la generación de facturas:
1. **Integridad e inalterabilidad** del registro de facturación.
2. **Trazabilidad** mediante encadenamiento de hash (cada factura referencia el hash de la anterior).
3. **Código QR** en cada factura con datos verificables.
4. **Sello de tiempo** que confirma cuándo se emitió.
5. **Registro de eventos** auditable (creación, anulación, rectificación).
6. Opcionalmente, **modo "Veri*Factu activo"** que envía el registro a la AEAT en tiempo real (requiere credenciales/certificado del usuario).

### Plan

| Fase | Cuándo | Acción |
|---|---|---|
| Estudio técnico | Q3 2026 | Leer Orden HAC/1177/2024 + observar implementación de Quipu (URL pública) |
| Diseño | Q4 2026 | Diseñar generación de hash encadenado + QR + sello tiempo en `js/billing.js` y `js/facturas.js` |
| Implementación | Q1 2027 | Build dentro de la app + test con facturas reales del propio fundador |
| Declaración responsable | Antes 1 jul 2027 | Firmar y publicar en `tr4ckr.com/verifactu` (modelo Quipu) |
| Comunicación | jul 2027 | Post en meowrhino.studio/blog/ + actualización de landing + nota a beta testers |

### Decisión sobre TicketBAI (País Vasco, Navarra)

**No entrar** a corto plazo. Las especificaciones forales (Bizkaia, Gipuzkoa, Araba, Navarra) son distintas y requieren análisis legal/técnico específico. Si en algún momento un beta tester del PV/NV lo pide, evaluar entonces.

### Riesgos

- **Si TRACKR no se homologa antes del 1 jul 2027**: los usuarios autónomos no podrán emitir facturas legales con la app. Pérdida total de mercado.
- **Mitigación**: este TODO es prioridad alta en Q1 2027. Sprint dedicado.
