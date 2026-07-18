# TODO #18 — Módulo Inmovilizado (amortización de bienes >300€)

## Estado: ⏳ pendiente (sin fecha) — mientras tanto existe la categoría de gasto "amortización" para apuntarlo a mano

## Por qué

Hoy todos los gastos en TRACKR se tratan como **gasto corriente** (deducible íntegro el año de la compra). Eso es incorrecto para compras de cierta entidad — ordenadores, cámaras, mobiliario… — que la AEAT obliga a **amortizar a lo largo de varios años** según tablas oficiales. Si un autónomo se desgrava un MacBook de 2.000€ entero en el trimestre que lo compra, su modelo 130 trimestral / IRPF anual estará mal.

Este TODO documenta la base normativa y el diseño aproximado del módulo para cuando lo abordemos.

## Marco legal (autónomo en estimación directa simplificada)

### IVA (Modelo 303)
- Deducible al 100% en el trimestre de adquisición.
- Si el bien es de uso mixto (personal + profesional), prorrateo del porcentaje.
- Sin cambios respecto al tratamiento actual de TRACKR. **No requiere módulo nuevo**.

### Base imponible IRPF (modelo 130 / declaración anual)

Hay dos regímenes:

**Gasto corriente** — bienes consumibles o con vida útil < 1 año:
- Deducible íntegro el año de la compra.
- Ejemplos: material de oficina, suscripciones, dominios, hosting, formación puntual.

**Inmovilizado material** — bienes con vida útil > 1 año:
- Hay que **amortizar**: deducir un porcentaje cada año según tablas oficiales.
- Tablas relevantes (Reglamento IRPF Art. 30, simplificada para autónomos):

| Tipo de bien | Coeficiente máximo anual | Periodo máximo |
|---|---|---|
| Equipos para procesos de información (ordenadores) | 26% | 10 años |
| Equipos electrónicos (móvil pro, cámaras, monitores) | 20% | 10 años |
| Útiles y herramientas | 25% | 8 años |
| Mobiliario | 10% | 20 años |
| Instalaciones | 10% | 20 años |
| Maquinaria | 12% | 18 años |
| Elementos de transporte (no turismos) | 16% | 14 años |

Referencia oficial: tabla simplificada en el **Anexo del Reglamento del IRPF (RD 439/2007)** y disposiciones de la **Orden HFP/1532/2018** (modelos 130/131).

### Excepción importante: bienes de escaso valor
- Bienes con coste unitario **< 300 €** → **libertad de amortización**: deducibles íntegros el primer año, sin necesidad de tabla.
- Tope conjunto: **25.000 €/año** entre todos los bienes acogidos.

### Otros regímenes (fuera de scope inicial)
- Libertad de amortización con creación/mantenimiento de empleo (PYME): condiciones complejas, suelen requerir gestor.
- Amortización degresiva: poco usada por autónomos.

## Diseño propuesto del módulo

### Nuevo tipo de entidad: `inmovilizado`

Sería un array nuevo en `D.d.inmovilizados[]` (paralelo a `gastos[]`). Cada entrada:

```js
{
  id: 'imv-...',
  nombre: 'MacBook Pro 14" M3',
  fechaAdquisicion: '2026-05-10',
  valorBase: 2000,            // base imponible (sin IVA)
  iva: 21,                    // % IVA deducido el trimestre de compra
  tipoAmort: 'equipos_info',  // clave de la tabla AEAT
  porcentajeAnual: 26,        // editable, default según tabla
  añosMax: 10,                // tope normativo
  notas: '...',
  usoMixto: false,            // si true, aplicar % adicional
  porcentajeAfectacion: 100,  // % afecto a la actividad (default 100)
  /* derivado en runtime, no se guarda */
  // amortizadoAcumulado: ...
  // pendienteAmortizar: ...
  // cuotaAnual: valorBase * porcentajeAnual / 100 * (porcentajeAfectacion/100)
}
```

### Cálculo

Para un periodo (trimestre, año):
- Cuota proporcional = `valorBase * (porcentajeAnual/100) * (porcentajeAfectacion/100) * (díasEnPeriodoDesdeFechaAdquisicion / 365)`.
- Si el bien lleva amortizándose menos de un año completo, prorratear por días desde `fechaAdquisicion`.
- Cuando `amortizadoAcumulado >= valorBase`, dejar de amortizar.

### Integración con modelo 130/IRPF
- En la sección de gastos del trimestre, sumar la cuota de amortización proporcional a la fracción del trimestre transcurrida desde la fecha de adquisición.
- Hace falta tocar el asistente trimestral ([TODO/13-asistente-trimestral.md](13-asistente-trimestral.md)) para que incluya esta categoría.

### UX

1. En la pantalla de gastos, al crear un gasto con `cantidad > 300 €`, mostrar un toast/wizard: **"¿Es esto una compra duradera? Ordenadores, mobiliario, cámaras… se amortizan a lo largo de varios años. [Convertir a inmovilizado]"**.
2. Nueva sección "Inmovilizado" en la app (paralela a Gastos) con lista de bienes en amortización, % completado de cada uno, cuota anual estimada.
3. En la vista anual / asistente trimestral: mostrar la cuota de amortización del periodo desglosada por bien.

## Antes de empezar a programar

- Confirmar con un gestor que el diseño cubre los casos típicos del autónomo medio.
- Decidir si soportar también bienes adquiridos antes de empezar a usar TRACKR (importar histórico).
- Revisar Reglamento IRPF actualizado (algunos coeficientes pueden haber cambiado en revisiones recientes).
