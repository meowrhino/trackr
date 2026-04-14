# Analisis de Competencia - Trackr

## Competidores directos (SaaS espanol)

### Quipu
- **Web:** getquipu.com
- **Precio:** Desde 18 euros/mes (plan con impuestos)
- **Target:** Autonomos y pymes en Espana
- **Fortalezas:**
  - Generacion automatica de Modelo 303, 130, 347, 349, 390
  - Exportacion XML directa para AEAT
  - Compatibilidad confirmada con VeriFactu
  - OCR para escanear facturas
  - Conexion bancaria
- **Debilidades:**
  - Requiere cuenta y suscripcion mensual
  - Datos en su cloud (no portables)
  - Orientado a gestores mas que a freelancers tecnicos

### Holded
- **Web:** holded.com
- **Precio:** Desde 29 euros/mes
- **Target:** Pymes y startups que necesitan ERP completo
- **Fortalezas:**
  - All-in-one: facturacion, contabilidad, CRM, RRHH, proyectos
  - Interfaz moderna y bien disenada
  - Integraciones con bancos y pasarelas de pago
- **Debilidades:**
  - Overkill para un freelancer individual
  - Precio alto para quien solo necesita facturas y gastos
  - Cloud obligatorio
  - Curva de aprendizaje por exceso de funciones

### Billin
- **Web:** billin.net
- **Precio:** Desde 10 euros/mes
- **Target:** Freelancers y consultores
- **Fortalezas:**
  - Precio mas accesible
  - Plantillas de factura personalizables
  - CRM basico incluido
- **Debilidades:**
  - Sin asistente fiscal completo (no genera 303/130)
  - Cloud obligatorio
  - Funcionalidades limitadas vs Quipu/Holded

### Contasimple
- **Web:** contasimple.com
- **Precio:** Desde 11 euros/mes
- **Target:** Autonomos con contabilidad basica
- **Fortalezas:**
  - Modelos fiscales listos para presentar
  - Buen precio
- **Debilidades:**
  - Interfaz anticuada
  - Menos integraciones

---

## Competidores open source

### Invoice Ninja
- **Web:** invoiceninja.com
- **Precio:** Gratis (self-hosted) / desde 10 USD/mes (cloud)
- **Target:** Freelancers globales
- **Fortalezas:**
  - Open source, self-hosteable
  - 40+ pasarelas de pago
  - Time tracking integrado
  - API completa
- **Debilidades:**
  - Requiere servidor para self-host (PHP + MySQL)
  - Sin soporte fiscal espanol (no IVA/IRPF nativos)
  - Configuracion compleja

### InvoicePlane
- **Web:** invoiceplane.com
- **Precio:** Gratis (self-hosted)
- **Target:** Pequenos negocios
- **Fortalezas:**
  - Completamente gratuito
  - Simple de usar
- **Debilidades:**
  - Solo facturacion (no gastos, no horas, no impuestos)
  - Requiere servidor PHP
  - Proyecto con desarrollo lento

### Akaunting
- **Web:** akaunting.com
- **Precio:** Gratis (self-hosted) / desde 39 USD/mes (cloud)
- **Target:** Pymes
- **Fortalezas:**
  - Contabilidad completa (Laravel + Vue)
  - Interfaz moderna
  - Marketplace de plugins
- **Debilidades:**
  - Requiere servidor
  - Version gratuita muy limitada
  - Sin foco espanol

---

## Matriz comparativa resumen

| Caracteristica | Trackr | Quipu | Holded | Billin | Invoice Ninja |
|---|---|---|---|---|---|
| Precio mensual | 0 euros | 18 euros | 29 euros | 10 euros | 0-10 USD |
| Necesita servidor | No | N/A (SaaS) | N/A (SaaS) | N/A (SaaS) | Si (PHP+MySQL) |
| Funciona offline | Si | No | No | No | Parcial |
| Datos portables (JSON) | Si | No | No | No | Via API |
| Sin crear cuenta | Si | No | No | No | No |
| Proyectos + horas | Si | No | Si | No | Si |
| Facturacion IVA/IRPF | Si, nativo | Si | Si | Si | Manual |
| Modelo 303/130 | Si | Si | Parcial | No | No |
| Gastos deducibles | Si | Si | Si | Basico | No |
| Facturas PDF | Si | Si | Si | Si | Si |
| Calendario financiero | Si | No | No | No | No |
| euros/hora real | Si | No | No | No | No |
| Multi-idioma | 3 idiomas | Si | Si | Si | 30+ |
| Temas visuales | 8 temas | No | No | No | Si |

---

## Posicionamiento de Trackr

**Trackr no compite frontalmente con Quipu o Holded.** Su propuesta de valor es diferente:

- **Quipu/Holded:** "Nosotros gestionamos tu contabilidad en la nube"
- **Trackr:** "Tu gestionas tus finanzas en tu navegador, con tus datos"

**Publico ideal de Trackr:**
- Freelancers tecnicos que valoran privacidad y control
- Autonomos que no quieren pagar 18-29 euros/mes por algo que pueden hacer ellos
- Desarrolladores que aprecian JSON exportable y versionable con git
- Profesionales que trabajan offline o quieren portabilidad total
