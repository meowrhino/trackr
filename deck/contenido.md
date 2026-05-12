# TRACKR · Plan de captación y crecimiento

**Versión:** Verano 2026 · 23 slides en 3 actos
**Fuente renderizada:** `deck/index.html`
**Investigación de soporte:** `compass_artifact_wf-7723f534-7320-4996-8136-7b3ab59c8274_text_markdown.md`

---

## Acto 1 — Qué es TRACKR

### Slide 1: Portada
- **TRACKR**
- Subtítulo: *Plan de captación y crecimiento*
- Sub-tagline: *Tu gestor freelance en el navegador · Verano 2026*
- Tags: Proyectos · Horas · Facturas · Gastos · Impuestos
- Stats hero: 0€ para siempre · 0 cuentas necesarias · 0 datos en la nube
- Pie: tr4ckr.com · meowrhino.studio

### Slide 2: El problema
- Ser autónomo en España es un **infierno fiscal**.
- 4 declaraciones trimestrales (303 + 130), facturación compleja, gastos deducibles, cuota fija mensual 230-530€, y **Verifactu obligatorio 1 jul 2027**.
- Las herramientas existentes cuestan 18-29 €/mes, tus datos viven en su cloud, están pensadas para gestores. Todas absorbidas por grupos extranjeros → subidas anuales.

### Slide 3: La solución
- TRACKR: **todo en tu navegador**, SPA local-first, JSON portable, sin frameworks.
- Filosofía: tus datos son tuyos · gratis siempre · sin cuenta · ~6000 líneas vanilla JS.

### Slide 4: Features
10 funciones en grid: proyectos+clientes, horas, facturación inteligente, cobros parciales, dashboard financiero, calendario, facturas PDF, gastos, asistente fiscal, temas+idiomas.

### Slide 5: Competencia (vista rápida)
Tabla comparativa simple: TRACKR vs Quipu/Holded/Contasimple. Análisis a fondo en Acto 2.

### Slide 6: Diferenciación
3 pilares: privacidad por diseño · pensado para España · simple sin ser básico.

### Slide 7: Modelo
- **Hoy:** 0€ para siempre. Gratis estructural.
- **Futuro Q4 2026 — Q1 2027:** suscripción opcional ~3-5€/mes con backup cifrado client-side. Cloud UE puro.

### Slide 8: Cierre Acto 1 / transición
- 3 pilares: ✓ Producto real | ✓ Posicionamiento claro | ? Pero nadie lo conoce todavía.
- Pregunta: **¿Cómo encontramos a los autónomos correctos y se lo ponemos delante?**

---

## Acto 2 — El mercado y la batalla

### Slide 9: Portada Acto 2
Cover "02" + título "El mercado y la batalla".

### Slide 10: El momento — Verifactu como catalizador
- RDL 15/2025: 1 jul 2027 autónomos obligados a Verifactu.
- Sanciones hasta 50.000 €/ejercicio por software no homologado.
- Quipu firmada 29 jul 2025 (URL pública), Contasimple 29 jul 2025, Holded activo.
- TRACKR: homologación SIF antes del 1 jul 2027 (compromiso).
- Ventana de 14-18 meses con pico sostenido de búsquedas "verifactu autónomos".

### Slide 11: A quién le hablamos (buyer persona sintética)
- **Autónomo español en estimación directa**, sin equipo, sin (o con poca) gestoría, que ya factura pero todavía no tiene una herramienta que le funcione.
- **Hoy le duele:** Excel + memoria, herramientas a 18-29 €/mes para uso puntual, no quiere meter sus datos fiscales en la nube de nadie, le agobian los modelos 303 y 130 cada trimestre.
- **Le motivaría:** una app sin cuenta y gratis de verdad, que entienda IVA real e intracomunitario, que calcule 303 y 130 sin pasar por gestor, una factura PDF bonita que pueda enviar tal cual.
- Donde le encontramos: comunidades de autónomos en Reddit y X/Twitter, búsquedas en Google del tipo "programa facturación autónomos gratis", referidos de otros freelancers.

### Slide 12: Los 3 competidores que importan
Tabla sintética con Quipu, Holded, Contasimple. Por cada uno: precio, para quién, mayor debilidad, dónde TRACKR gana.

| Competidor | Precio | Para quién | Su mayor debilidad | Dónde TRACKR gana |
|---|---|---|---|---|
| **Quipu** (TeamSystem IT) | 17-20 €/mes · trial 15d | Autónomo que YA tiene gestoría y quiere panel propio | Sin plan gratuito real desde 2024. Sin time-tracking. Catalán limitado. | Gratis estructural · sin cuenta · time-tracking + €/h real · catalán nativo |
| **Holded** (Visma NO) | 14,50-149 €/mes | PYME en crecimiento que necesita CRM + inventario + RRHH | Sobredimensionado para autónomo solo. Precios poco transparentes. Curva. | Drásticamente más simple · cero curva · diseño cuidado indie |
| **Contasimple** (Cegid FR) | 0€ (máx 50 fact/año) hasta ~22 €/mes | Autónomo con volumen bajo que solo quiere "cumplir con Hacienda" | Interfaz anticuada. Sin time-tracking. Subidas de precio anuales agresivas. | Diseño moderno · sin límite de facturas · time-tracking + dashboard fiscal en uno |

Los tres han sido absorbidos por grupos extranjeros (2021-2024). El hueco para algo gratis-de-verdad e indie es real.

### Slide 13: Keywords atacables
Atacables ya (0-6m, dificultad baja): facturación autónomo sin cuota mensual, app autónomos sin suscripción, cobros parciales factura autónomo, tracker horas facturación autónomo, programa facturación catalán autónomo.

Medio plazo (6-18m, dificultad media): calculadora modelo 303 online gratis, calculadora modelo 130 online gratis, alternativa a Quipu, alternativa a Holded autónomos, verifactu autónomos estimación directa.

Evitar a corto plazo: "programa facturación autónomos", "modelo 303 cómo rellenar", "gastos deducibles autónomo" — SERPs saturados.

### Slide 14: El hueco de mercado
**Definición de nicho:** *suite indie todo-en-uno, gratis y sin cuenta, para el autónomo español que cobra por proyectos u horas, valora estética y control sobre sus datos, y desconfía de programas con suscripción mensual.*

3 razones del hueco:
1. **Cansancio de suscripciones** — 3 grandes absorbidos, subidas anuales.
2. **El plan free de la competencia es feo** — Contasimple limita a 50 fact/año.
3. **Nadie combina lo que combinamos** — time-tracking + 4 modos facturación + cobros parciales + 303/130 + CA nativo + local-first.

---

## Acto 3 — Plan de captación

### Slide 15: Portada Acto 3
Cover "03" + título "Plan de captación".

### Slide 16: Objetivos del verano 2026 (asumibles)
- **20 usuarios beta que vuelvan al menos una vez** tras la primera visita — a 30 sep 2026
- **100 visitas/mes** a meowrhino.studio vía tr4ckr.com — a 31 oct 2026
- **3 posts** publicados en meowrhino.studio/blog/ (uno al mes) — a 30 sep 2026
- **1 microherramienta** pública (calculadora 303) lanzada — a 30 sep 2026

Lo que NO nos exigimos aún: top de Google, partnerships cerrados, app móvil, calculadora 130. Si llegan, bonus. Si no, sigue siendo éxito.

### Slide 17: Canales — 2, de verdad
1. **Posts en meowrhino.studio/blog/** — uno al mes (~1 día/mes). Cada post enlaza a tr4ckr.com.
2. **Presencia útil en 2 comunidades** — r/Autonomos + un canal próximo (Twitter/X autónomos). Leer, responder con utilidad. Mencionar TRACKR cuando encaje. ~30 min/día.

NO hacemos: Google Ads, LinkedIn Ads, influencers, ferias, partnerships con asesorías, app móvil. 0€ presupuesto, todo orgánico.

### Slide 18: 3 posts en 3 meses
| Mes | Post | Objetivo | Canal |
|---|---|---|---|
| Junio | Verifactu para autónomos que no quieren pagar gestor | Enseñar — lo que cambia el 1 jul 2027 | meowrhino blog |
| Julio | TRACKR vs Quipu · comparativa honesta | Contrastar — dónde gana cada uno | meowrhino blog |
| Agosto | Construir una app indie de facturación: el viaje | Conectar — el proceso real + lanzamiento calc 303 | meowrhino blog |

Cada post se trocea en hilo en X y comentario en r/Autonomos. Un post = 3 piezas de presencia. **Si publicas 3 posts en 90 días, el plan funciona.**

### Slide 19: Una microherramienta pública
- **tr4ckr.com/303** — calculadora del Modelo 303 sin cuenta. Esfuerzo: ~1 jornada de desarrollo (reutilizamos lógica que ya tiene TRACKR dentro).
- La calculadora 130 queda **para 2027** si la 303 funciona.
- Por qué vale la pena: tráfico recurrente (4 picos/año), enlaces naturales, marca "los que dan herramientas gratis sin cuenta", 800-1.500 búsquedas/mes para "calculadora modelo 303 online gratis".

### Slide 20: Métricas
**Ya activo — Cloudflare Web Analytics:**
- Pageviews, visitantes únicos, referrers, país, dispositivo, tiempo en página.
- Sin cookies, sin banner. Coste: 0€.

**Pendiente — eventos custom (Worker propio implementado):** activar cuando lleguemos a 50+ usuarios.

**KPIs mensuales:** visitantes únicos tr4ckr.com, click-through a meowrhino.studio, conversiones blog → tr4ckr.com, posición SERP de las keywords prioritarias.

Revisión al final de cada mes.

### Slide 21: Riesgos y mitigación
| Riesgo | Mitigación |
|---|---|
| Verifactu llega antes de la homologación SIF | Sprint técnico Q1 2027 + declaración responsable firmada en URL pública antes del 1 jul 2027 |
| Fundador solo + tiempo limitado | Plan acotado a 90 días, no más. Reciclar cada pieza en 3 canales. |
| Dependencia narrativa de meowrhino.studio | tr4ckr.com tiene identidad/copy/OG propios |
| Competidores grandes copan el SERP | Atacar solo long-tail diferencial. Dejar SERPs saturados para 2027+ |

### Slide 22: Roadmap producto alineado al plan
**Q2-Q3 2026:** microherramienta /303, cierre del asistente trimestral 303/130, categorías de gasto extra.
**Q3 2026 — verano:** refinamientos UX con feedback beta, posible PWA, inicio estudio técnico para SIF.
**Q4 2026 — Q1 2027:** Pivot A opcional (cuentas + backup cifrado client-side, suscripción 3-5€/mes solo hosting).
**Antes 1 jul 2027:** declaración responsable Verifactu firmada y publicada en URL abierta de tr4ckr.com.

### Slide 23: Cierre / CTA
- TRACKR · Tu gestor freelance en el navegador.
- **TRACKR no compite por precio — ya está en el suelo. Compite por filosofía y producto integrado.**
- *Hecho indie. Para los autónomos que entienden que sus datos no son un producto.*
- CTAs: tr4ckr.com · meowrhino.studio · manuellatourf@gmail.com
- Plan vigente: mayo – septiembre 2026 · Revisión: fin de cada mes.
