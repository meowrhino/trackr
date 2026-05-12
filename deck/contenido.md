# TRACKR · Plan de captación y crecimiento

**Versión:** Verano 2026 · 25 slides en 3 actos
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
- Lado izquierdo (problema):
  - 4 declaraciones trimestrales (Modelo 303 + 130), plazos estrictos, multas por retraso
  - Facturación compleja (IVA 21/10/4%, IRPF 15/7%, exenciones, numeración correlativa)
  - Gastos deducibles requieren base + IVA + total reales
  - Cuota fija mensual 230-530 €/mes aunque no factures
  - **Verifactu obligatorio desde 1 jul 2027** (RDL 15/2025) — todos los autónomos buscarán software adaptado
- Lado derecho (las herramientas existentes):
  - Las buenas cuestan 18-29 €/mes (Quipu, Holded)
  - Datos en su cloud, sin export real
  - Pensadas para gestores, no para freelancers técnicos
  - Overkill: CRM, inventario, RRHH innecesarios
  - **Quipu, Holded, Contasimple absorbidos** por TeamSystem/Visma/Cegid → subidas anuales

### Slide 3: La solución
- TRACKR: **todo en tu navegador**
- Qué es: SPA que corre 100% en el navegador, datos en localStorage + export JSON, abres `index.html` y funciona, pensada para autónomos españoles
- Filosofía: tus datos son tuyos · gratis siempre (sin trucos) · sin cuenta, sin login, sin cloud · ~6000 líneas vanilla JS, sin frameworks, sin build

### Slide 4: Features
Grid de 10 features con icono + descripción:
- Proyectos + clientes (con NIF y datos fiscales)
- Control de horas (trabajo vs reuniones)
- Facturación inteligente (4 modos: desde base, desde total, por hora, gratis)
- Cobros parciales (barra de progreso por proyecto)
- Dashboard financiero (facturado vs cobrado vs gastos vs neto + €/hora real)
- Calendario (vista mes/semana con horas, gastos, objetivos)
- Facturas PDF (un click)
- Gastos y recurrentes (base + IVA + total reales)
- Asistente fiscal (Modelo 303, 130, datos para la Renta)
- Temas + idiomas (8 temas, ES/EN/CA)

### Slide 5: Competencia (vista rápida)
Tabla comparativa con Quipu, Holded, Contasimple. Alineada con los 3 elegidos en la investigación.

| | TRACKR | Quipu | Holded | Contasimple |
|---|---|---|---|---|
| Precio entrada | 0 € | 17-20 €/mes | 14-29 €/mes | 0 € (límite 50 fact/año) |
| Plan gratuito real | Sí, sin límite | Trial 15 días | Trial 14 días | Limitado |
| Sin cuenta / cloud | Sí | SaaS | SaaS | SaaS |
| Datos portables | JSON nativo | No | No | No |
| Modelo 303/130 | Sí | Sí | Parcial | Sí |
| Proyectos + horas + €/h | Sí | No | Parcial | No |
| Cobros parciales nativos | Sí | Básicos | Básicos | No |
| Catalán nativo | Sí | No | Limitado | No |
| Verifactu (SIF) | Antes jul 2027 | 29 jul 2025 | Activo | 29 jul 2025 |
| Dueño | Indie | TeamSystem (IT) | Visma (NO) | Cegid (FR) |

→ Análisis a fondo en Acto 2.

### Slide 6: Diferenciación
3 pilares:
1. **Privacidad por diseño** — datos no salen de la máquina, export JSON, sin tracking
2. **Pensado para España** — IVA, IRPF, exenciones, 303/130, NIF, numeración correlativa
3. **Simple sin ser básico** — no es ERP, no tiene CRM/inventario/RRHH

Quipu/Holded: *"nosotros gestionamos tu contabilidad en la nube"*
TRACKR: *"tú gestionas tus finanzas en tu navegador, con tus datos"*

### Slide 7: Modelo
- **Hoy:** 0€ para siempre. Gratis estructural (no hay backend que mantener)
- **Futuro Q4 2026 — Q1 2027:** suscripción opcional ~3-5€/mes con backup cifrado client-side. El servidor solo guarda blobs cifrados (no podemos leerlos). Cloud UE puro (Scaleway / OVH España). Escenario A de la investigación legal: cifrado robusto = RGPD art. 34.3.a = riesgo legal mínimo.

### Slide 8: Cierre Acto 1 / transición
- Hasta aquí, el **qué es** TRACKR.
- 3 pilares: ✓ Producto real | ✓ Posicionamiento claro | ? Pero nadie lo conoce todavía
- Pregunta: **¿Cómo encontramos a los autónomos correctos y se lo ponemos delante?**
- Acto 2: el mercado y la batalla. Acto 3: cómo lo movemos.

---

## Acto 2 — El mercado y la batalla

### Slide 9: Portada Acto 2
- Número "02", label ACTO 2
- **El mercado y la batalla**
- Subtítulo: Verifactu como catalizador · los 3 competidores que importan · keywords atacables · el hueco real de mercado.

### Slide 10: El momento — Verifactu como catalizador
Lado izquierdo (qué cambia):
- RDL 15/2025 (BOE 03/12/2025): 1 ene 2027 sociedades, 1 jul 2027 autónomos
- Todos los autónomos en estimación directa deberán migrar o actualizar
- Sanciones hasta 50.000 €/ejercicio por software no homologado
- AEAT no homologa — los fabricantes auto-certifican

Lado derecho (estado de los grandes):
- Quipu: firmada 29 jul 2025, declaración en URL abierta (más transparente)
- Contasimple: firmada 29 jul 2025, dentro del producto
- Holded: activo, "Colaborador Social AEAT", dentro del producto
- **TRACKR:** homologación SIF antes del 1 jul 2027 (compromiso roadmap)

Conclusión: ventana de 14-18 meses con pico sostenido de búsquedas "verifactu autónomos".

### Slide 11: Buyer persona — La fatiga SaaS con NIF
**Principal — Marta · 32 · traductora freelance · Barcelona**
- ~25k €/año, 8-12 clientes (ES + intracomunitario), estimación directa simplificada
- **Hoy le duele:** Excel + plantilla Word + memoria; se le pasó el 303 en abril; Quipu/Holded le piden 18-29€/mes para uso esporádico; desconfía del cloud
- **Le motivaría:** app sin cuenta gratis estable, IVA intracomunitario real, catalán nativo, PDF bonito, calcula 303/130
- **Dónde está:** Twitter/X freelance, r/Autonomos (lector), newsletters indie, GitHub

**Secundarias:**
- Dani · 38 · tech trainer · Madrid — facturas EN+ES, cobros parciales por curso
- Ana · 28 · música/productora · València — volumen bajo, catalán, exenta IVA en formación

### Slide 12: Quipu en profundidad
- **getquipu.com** · desde 17-20 €/mes · TeamSystem (IT) desde 2024
- **Qué hace bien:** marca consolidada, Verifactu firmada en URL pública, conexión bancaria BBVA/Santander, OCR de tickets, blog SEO fuerte, partnerships con asesorías
- **Dónde flaquea:** sin plan gratuito real, sin 2FA reportado, inestabilidad en picos, pensado para gestores, sin time-tracking, catalán limitado
- **Dónde TRACKR gana:** gratis estructural, sin cuenta, cobros parciales mejor, time-tracking + €/h real, catalán nativo, JSON portable
- *Quipu captura: autónomo con gestoría que quiere panel propio. Nuestro público es el que NO quiere gestoría.*

### Slide 13: Holded en profundidad
- **holded.com** · 14,50-149 €/mes · Visma (NO) desde 2021 (~190 M€)
- **Qué hace bien:** ERP completo, UI moderna, Verifactu activo, SII integrado, 50+ integraciones, 80.000 clientes
- **Dónde flaquea:** sobredimensionado para autónomo solo, precios poco transparentes, módulos extra suben rápido, curva de aprendizaje, soporte lento
- **Dónde TRACKR gana:** drásticamente más simple, gratis, cero curva, local-first, multi-idioma nativo, diseño cuidado
- *Holded es ERP para PYME en crecimiento. No es competencia directa: heredamos público antes de que escale a ahí.*

### Slide 14: Contasimple en profundidad
- **contasimple.com** · 0 € (50 fact/año) hasta ~22 €/mes · Cegid (FR)
- **Qué hace bien:** plan gratuito real, Verifactu firmada, precio de entrada bajo, app móvil con OCR, backup diario
- **Dónde flaquea:** interfaz percibida como anticuada, sin balance de sumas y saldos, subidas agresivas (27€/T 2017 → 65€/T 2023), bugs en transición Verifactu, sin time-tracking
- **Dónde TRACKR gana:** diseño moderno, time-tracking + proyectos + dashboard fiscal en uno, cobros parciales, sin límite 50 fact/año, multi-idioma, indie
- *Contasimple captura al autónomo "cumple con Hacienda y nada más". Nosotros ofrecemos eso + diseño + time-tracking sin pedir nada a cambio.*

### Slide 15: Keywords atacables
Atacables ya (0-6m, dificultad baja):
- facturación autónomo sin cuota mensual (100-300 vol)
- app autónomos sin suscripción (80-250)
- cobros parciales factura autónomo (100-300)
- tracker horas facturación autónomo (80-200)
- programa facturación catalán autónomo (100-300, baja-media)

Medio plazo (6-18m, dificultad media):
- calculadora modelo 303 online gratis (800-1.500)
- calculadora modelo 130 online gratis (500-1.000)
- alternativa a Quipu (600-1.200)
- alternativa a Holded autónomos (400-900)
- verifactu autónomos estimación directa (300-700, baja-media)

Evitar a corto plazo: "programa facturación autónomos", "modelo 303 cómo rellenar", "gastos deducibles autónomo" — SERPs saturados DA 70+.

### Slide 16: El hueco de mercado
**Definición de nicho:** *suite indie todo-en-uno, gratis y sin cuenta, para el autónomo español que cobra por proyectos u horas, valora estética y control sobre sus datos, y desconfía de SaaS de pago recurrente.*

3 razones por las que existe el hueco:
1. **SaaS fatigue real** — los 3 grandes absorbidos por TeamSystem/Visma/Cegid, subidas anuales consistentes
2. **El plan free de la competencia es feo** — Contasimple limita a 50 fact/año y UI anticuada
3. **Nadie combina lo que combinamos** — time-tracking + 4 modos facturación + cobros parciales + 303/130 + CA nativo + local-first

Nuevos entrantes (renn, BeeL.es, Conteo, Verifacturamos, FactuChat) son freemium con suelo. TRACKR es el único que se mantiene gratis estructuralmente.

---

## Acto 3 — Plan de captación

### Slide 17: Portada Acto 3
- Número "03", label ACTO 3
- **Plan de captación**
- Subtítulo: Objetivos verano 2026 · canales · 90 días de contenido · métricas · riesgos · roadmap producto alineado.

### Slide 18: Objetivos SMART verano 2026
- **50 usuarios beta activos** (≥1 sesión/semana, ≥1 factura generada) — a 30 sep 2026
- **200 visitas/mes** a meowrhino.studio vía tr4ckr.com — a 31 oct 2026
- **5 piezas de contenido** publicadas en meowrhino.studio/blog/ — a 31 ago 2026
- **Top 20 SERP** Google ES para "facturación autónomo sin cuota mensual" — a 31 dic 2026
- **1 partnership** cerrado con asesoría o influencer fiscal español — a 31 oct 2026
- **2 microherramientas** públicas (calc 303 + calc 130 sin login) — a 30 sep 2026

### Slide 19: Canales
1. **SEO long-tail en meowrhino.studio/blog/** — posts pilares + comparativas (esfuerzo alto, retorno lento)
2. **Comunidades: r/Autonomos, Indie Hackers, Twitter/X freelance** — presencia útil no promocional + anuncio honesto (esfuerzo bajo, retorno rápido)
3. **Microherramientas abiertas (tr4ckr.com/303 y /130)** — calculadoras sin login + tráfico estacional + backlinks (esfuerzo medio, retorno alto)
4. **Partnership con 1-2 asesorías o influencers fiscales** — validación externa (esfuerzo medio, retorno alto)

NO hacemos: Google Ads, LinkedIn Ads, influencers de pago, ferias. 0€ presupuesto, todo orgánico.

### Slide 20: Calendario editorial 90 días
| Fecha | Pieza | Keyword / canal extra | Destino |
|---|---|---|---|
| Jun S1 | Verifactu para autónomos que no quieren pagar gestor (2027) | verifactu autónomos estimación directa | meowrhino blog |
| Jun S3 | Construir una app indie de facturación: el viaje | indie hacking + IH/HN | meowrhino blog |
| Jul S1 | TRACKR vs Quipu: comparativa honesta | alternativa a Quipu | meowrhino blog |
| Jul S3 | Cómo facturar cobros parciales (con plantilla) | cobros parciales factura autónomo | meowrhino blog |
| Ago S1 | Calculadora Modelo 303 sin cuenta — lanzamiento | microherramienta + calculadora 303 | tr4ckr.com/303 |
| Ago S3 | TRACKR vs Holded para autónomos solos | alternativa a Holded autónomos | meowrhino blog |
| Sep S1 | Calculadora Modelo 130 sin cuenta — lanzamiento | microherramienta + calculadora 130 | tr4ckr.com/130 |

Cadencia: 1 pieza cada 2 semanas. Reciclar cada post como hilo en X y comentario en r/Autonomos.

### Slide 21: Microherramientas como caballo de Troya SEO
- **tr4ckr.com/303** — calculadora Modelo 303 sin login. Introduces los números, te da las casillas listas para sede AEAT.
- **tr4ckr.com/130** — calculadora Modelo 130 sin login. Mismo principio.
- Ambas funcionan sin guardar nada. El usuario puede abrir TRACKR completo si quiere persistencia.

Por qué funciona:
- Tráfico estacional recurrente (4 picos/año cuando los autónomos rellenan trimestres)
- Backlinks naturales de blogs fiscales — contenido útil + gratuito se comparte
- Branding: "los que dan herramientas gratis sin cuenta"
- SERP volumen: 800-1.500 (303) + 500-1.000 (130) búsquedas/mes con dificultad Media
- Ética: sin tracking dentro, coherente con la filosofía TRACKR

### Slide 22: Métricas
**Ya activo — Cloudflare Web Analytics:**
- Pageviews / visitantes únicos por página
- Referrers (de qué comunidad/blog viene el tráfico)
- País, dispositivo, navegador
- Tiempo en página, bounce rate
- Sin cookies, sin banner, GDPR-compliant. Coste: 0€.

**Pendiente / opcional — eventos custom (Worker propio implementado en `analytics/worker/`):**
- factura PDF generada, export/import JSON, cambio de idioma, click outbound a meowrhino, welcome dismiss
- Decisión: esperar a tener 50+ usuarios antes de activar.

**KPIs operativos por mes:**
- Visitantes únicos tr4ckr.com
- Click-through a meowrhino.studio
- Conversiones blog → tr4ckr.com
- Posición SERP de las 5 keywords prioritarias

Revisión al final de cada mes. Si un canal no aporta, podarlo. Si una keyword sube, doblar la apuesta.

### Slide 23: Riesgos y mitigación
| Riesgo | Mitigación |
|---|---|
| Verifactu llega antes de la homologación SIF | Sprint técnico Q1 2027 + declaración responsable firmada en URL pública antes del 1 jul 2027 |
| Fundador solo + tiempo limitado | Plan acotado a 90 días, no más. Reciclar cada pieza en 3 canales. IA como copiloto. |
| Dependencia narrativa de meowrhino.studio | tr4ckr.com tiene identidad/copy/OG propios. meowrhino aparece como "hecho con cariño por", no propietario operativo. |
| Competidores grandes copan el SERP (DA 70+) | Atacar solo long-tail diferencial (sin-cuota, sin-cuenta, catalán, cobros parciales). Dejar SERPs saturados para 2027+. |

### Slide 24: Roadmap producto alineado al plan
**Q2 2026 — lo inmediato:**
- Categorías de gastos extra (cotización, amortización) (feedback beta)
- Microherramientas /303 y /130 públicas (canal SEO)
- Imagen OG pulida + meta tags optimizados
- Cierre del asistente trimestral 303/130 dentro de la app

**Q3 2026 — verano, fase de captación:**
- Refinamientos UX según feedback de los primeros 50 beta testers
- Posible PWA / app móvil offline-capable
- Inicio de estudio técnico para homologación SIF

**Q4 2026 — Q1 2027 — pivot opcional:**
- Pivot A: cuentas + backup cifrado client-side (Cloud UE puro)
- Textos legales completos (aviso, privacidad, cookies, T&C)
- Modelo de suscripción opcional 3-5€/mes (solo hosting, el core sigue gratis)

**Antes del 1 jul 2027 — compromiso fiscal:**
- Declaración responsable Verifactu firmada y publicada en URL abierta de tr4ckr.com
- Comunicación del cumplimiento como nota de blog + actualización de landing

### Slide 25: Cierre / CTA
- TRACKR
- *Tu gestor freelance en el navegador*
- **TRACKR no compite por precio — ya está en el suelo. Compite por filosofía y producto integrado.**
- *Hecho indie. Para los autónomos que entienden que sus datos no son un producto.*
- CTAs: tr4ckr.com · meowrhino.studio · manuellatourf@gmail.com
- Plan vigente: mayo – septiembre 2026 · Revisión: fin de cada mes
