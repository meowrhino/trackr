# Trackr - Contenido del Deck

## Slide 1: Portada

**Titulo:** TRACKR
**Subtitulo:** Tu gestor freelance en el navegador
**Detalle:** Proyectos, horas, facturas, gastos e impuestos. Gratis. Sin cuenta. Sin cloud.

---

## Slide 2: El problema

**Titulo:** Ser autonomo en Espana es un infierno fiscal

**Puntos clave:**
- 4 declaraciones trimestrales (Modelo 303 + 130) con plazos estrictos
- Facturacion con IVA (21%) e IRPF (15%) que debes calcular tu
- Gastos deducibles que hay que registrar con base, IVA y total reales
- Cuota de autonomos fija aunque no factures (230-530 euros/mes)

**Dato:** El autonomo medio dedica 1.5-2h al mes solo a meter datos en su herramienta de contabilidad

**Y las herramientas?**
- Las buenas cuestan 18-29 euros/mes
- Tus datos viven en su cloud
- Estan pensadas para gestores, no para ti

**Notas presentador:** Conectar con la audiencia. "Quien es autonomo aqui?" Enfatizar que el problema no es solo fiscal, sino que las herramientas existentes no estan pensadas para el freelancer tecnico que quiere control.

---

## Slide 3: La solucion

**Titulo:** Trackr: todo en tu navegador

**Que es:**
- App web que corre 100% en tu navegador
- Datos guardados en localStorage + export a JSON
- Zero dependencias de backend: abres index.html y funciona
- Pensada especificamente para autonomos espanoles

**Principios:**
- Tus datos son tuyos (JSON portable)
- Gratis siempre (el core, sin trucos)
- Sin cuenta, sin login, sin cloud
- Vanilla JS: ~6000 lineas, sin frameworks, sin build step

**Notas presentador:** Enfatizar la filosofia "tus datos, tu control". Esto resuena especialmente con desarrolladores.

---

## Slide 4: Features principales

**Titulo:** Que puedes hacer con Trackr

**Grid de funciones (iconos + texto corto):**

| Funcion | Detalle |
|---------|---------|
| Proyectos | Crea, organiza y sigue el estado de tus proyectos con clientes |
| Control de horas | Registra horas de trabajo vs reuniones por separado |
| Facturacion inteligente | Calcula IVA/IRPF automaticamente. 4 modos: desde base, desde total, por hora, gratis |
| Cobros parciales | Trackea pagos parciales con barra de progreso |
| Gastos y recurrentes | Registra gastos puntuales y recurrentes con base+IVA+total reales |
| Calendario | Vista mes/semana con horas, gastos y objetivos |
| Dashboard financiero | Facturado vs cobrado vs gastos vs neto, con euros/hora real |
| Facturas PDF | Genera facturas profesionales con un click |
| Asistente fiscal | Calcula Modelo 303, 130 y datos para la Renta |
| Multi-idioma y temas | Espanol, English, Catala + 8 temas visuales |

**Notas presentador:** No leer todo. Destacar 3-4 features que mas impactan: facturacion inteligente, dashboard financiero, y facturas PDF. El resto mencionarlas de pasada.

---

## Slide 5: Competencia

**Titulo:** El mercado actual

**Tabla:**
(ver competencia.md para detalle)

| | Trackr | Quipu | Holded | Billin | Invoice Ninja |
|---|---|---|---|---|---|
| Precio | Gratis | 18 euros/mes | 29 euros/mes | 10 euros/mes | Gratis (self-host) |
| Cloud obligatorio | No | Si | Si | Si | Si (self-host) |
| IVA/IRPF espanol | Si, nativo | Si | Si | Si | No |
| Modelo 303/130 | Si | Si | Parcial | No | No |
| Datos portables | JSON | No | No | No | API |
| Sin cuenta | Si | No | No | No | No |
| Offline | Si | No | No | No | Parcial |

**Notas presentador:** El punto clave no es que Trackr sea "mejor" que Quipu, sino que es una alternativa viable, gratuita y con filosofia distinta. Quipu es para quien quiere delegar al gestor. Trackr es para quien quiere control.

---

## Slide 6: Diferenciacion

**Titulo:** Por que Trackr es diferente

**3 pilares:**

1. **Privacidad por diseno**
   - Tus datos nunca salen de tu maquina
   - Export JSON: un archivo que puedes leer, versionar con git, o meter en un USB
   - Sin tracking, sin cookies, sin analytics obligatorio

2. **Pensado para Espana**
   - IVA (21/10/4/0%), IRPF, exenciones
   - Modelo 303 y 130 integrados
   - Clientes con NIF, facturacion con numero correlativo

3. **Simplificado sin ser simple**
   - No es un ERP: no tiene inventario, nominas, ni CRM
   - Si tiene todo lo que un freelancer necesita y nada mas
   - 6000 lineas de JS vanilla, sin build, sin framework

**Notas presentador:** Aqui es donde vendes la vision. No competimos con Holded en features, competimos en filosofia.

---

## Slide 7: Modelo y vision

**Titulo:** Modelo: gratis de verdad

**Ahora:**
- 100% gratuito, sin limitaciones
- Uso local con JSON

**Futuro posible:**
- Tier de pago solo para hosting/sync de datos (tu cuenta, tus datos en la nube)
- Gestion de cuentas y backup automatico
- El core siempre gratis: si no guardas datos en nuestro server, no pagas

**Horizonte:**
- Integracion VeriFactu cuando sea obligatorio (julio 2026 para autonomos)
- Posible version PWA para movil

**Notas presentador:** Enfatizar que no es un modelo "freemium" clasico donde te limitan features. Aqui pagas por infraestructura, no por funcionalidad.

---

## Slide 8: Next steps

**Titulo:** Roadmap

**Q2 2026:**
- Asistente fiscal trimestral completo (303 + 130)
- Gastos recurrentes avanzados (pausa, base, indicadores)

**Q3 2026:**
- Resolver feedback de beta testers (6 issues reportados)
- Quick UX wins: boton "marcar pagado", entrada de gastos mas rapida

**Futuro:**
- VeriFactu (si aplica obligatoriedad)
- PWA / version movil
- Tier de hosting con sync

**CTA:** github.com/[repo] | Probalo: abre index.html

**Notas presentador:** Cerrar con energia. "Trackr esta en beta, funciona, y lo uso yo cada dia. Si eres autonomo y quieres probarlo, es abrir un HTML."
