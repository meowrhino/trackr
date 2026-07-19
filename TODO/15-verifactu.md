# 15 — VeriFactu / SIF

## Estado: 🚧 en ejecución — Fase 1 ✅ (código local, commit `48ab47a`) · Fase 2 en marcha (email a AEAT **enviado el 2026-07-18**, esperando respuesta)
## Deadline: 1 ene 2027 (sociedades) · **1 jul 2027 (autónomos)** — RDL 15/2025 (BOE 03/12/2025)

> Historia: el plan original (mayo 2026) apostaba por la modalidad "no verificable" creyendo que era
> la fácil. La revisión de 2026-07-05 contra las FAQs oficiales AEAT demostró lo contrario: la no
> verificable exige firma XAdES por registro + log de eventos firmado + conservación inalterable 4+
> años (inviable con localStorage). La investigación de 2026-07-16 cierra el diseño por la otra vía.

---

## Decisión de arquitectura: modalidad VERI*FACTU (remisión continua)

**Por qué es la buena para TRACKR:**

- Remitir a AEAT **exime de firmar (XAdES) y de conservar** los registros — quedan en AEAT. Es la
  modalidad de la propia app gratuita de la AEAT.
- **Compatible con local-first** (confirmado en FAQ oficial): si no hay conexión, luz, o la sede AEAT
  está caída, **se sigue facturando sin interrupción**. Los registros pendientes se reenvían
  periódicamente con flag de **incidencia** en la cabecera, y **no hay plazo máximo fijado** para
  esos reintentos. Emitir offline + cola de remisión = legal.
- El inicio es **tácito** (empezar a remitir; no hay que presentar 036). Una vez dentro, permanencia
  mínima **hasta fin del año natural** (solo se puede salir en enero del año siguiente).
- Multi-emisor: cada lote de remisión debe contener registros de **un solo obligado** — los envíos
  se separan por usuario.

Fuente: [FAQ Sistemas VERI*FACTU (AEAT)](https://sede.agenciatributaria.gob.es/Sede/iva/sistemas-informaticos-facturacion-verifactu/preguntas-frecuentes/sistemas-verifactu.html)

---

## La vía de remisión: colaboración social (acuerdo tipo 017)

Confirmado en [FAQ Colaboración social (AEAT)](https://sede.agenciatributaria.gob.es/Sede/iva/sistemas-informaticos-facturacion-verifactu/preguntas-frecuentes/colaboracion-social.html):

- Las **empresas desarrolladoras de software** pueden suscribir el **acuerdo de colaboración social
  tipo 017** para remitir registros de facturación en nombre de sus usuarios.
  Contacto AEAT: `comunicacion.sepri@correo.aeat.es`.
- La remisión se hace con el **certificado del colaborador social** (no hace falta certificado de
  cada usuario). Alternativas admitidas: certificado del propio obligado, o apoderamiento.
- ⚠️ **Cada usuario debe otorgar representación mediante documento normalizado** (Resolución de 18
  de diciembre de 2024), firmado **a mano + copia de DNI** o con **firma electrónica**
  (cualificada o avanzada eIDAS). La AEAT **rechaza explícitamente** que "aceptar las condiciones
  del servicio" valga como apoderamiento. → Esto es fricción de onboarding: hay que diseñar el
  flujo (plantilla del documento + subida firmada, o firma electrónica).

**Preguntas abiertas para el email a la AEAT (sepri):**
1. ¿Puede un **autónomo persona física** (fabricante de software) suscribir el acuerdo 017, o exige
   persona jurídica?
2. Detalle del alta: plazos, documentación, y si el acuerdo cubre también la consulta de registros.
3. ¿Vale el certificado FNMT de persona física para la remisión como colaborador, o piden sello?

**Plan B si el 017 no es viable como persona física:** cada usuario aporta su propio certificado
(peor UX; el certificado tendría que usarse desde el navegador del usuario o custodiarse — ambas
opciones malas) o TRACKR se constituye como SL antes del lanzamiento (decisión de negocio).

---

## Especificaciones técnicas confirmadas

### Huella SHA-256 (encadenada)

Cadena `campo1=valor1&campo2=valor2&…` → SHA-256 sobre UTF-8 → **64 hex MAYÚSCULAS**.
Valores sin espacios; campo vacío = `campo=`; decimales normalizados (123.1 ≡ 123.10).

**Registro de alta**, campos en este orden:
`IDEmisorFactura`, `NumSerieFactura`, `FechaExpedicionFactura`, `TipoFactura`, `CuotaTotal`,
`ImporteTotal`, `Huella` (la del registro anterior; vacía en el primero), `FechaHoraHusoGenRegistro`.

**Registro de anulación**: `IDEmisorFacturaAnulada`, `NumSerieFacturaAnulada`,
`FechaExpedicionFacturaAnulada`, `Huella`, `FechaHoraHusoGenRegistro`.

⚠️ Al implementar, validar contra el PDF oficial **"Detalle de las especificaciones técnicas para
la generación de la huella o hash de los registros"** (web de desarrolladores AEAT) — lo de arriba
viene de fuentes secundarias solventes, pero el byte a byte se confirma contra el oficial.

### QR de cotejo

- **Producción**: `https://www2.agenciatributaria.es/wlpl/TIKE-CONT/ValidarQR?nif=…&numserie=…&fecha=DD-MM-YYYY&importe=N.NN`
- **Pruebas**: `https://prewww2.aeat.es/wlpl/TIKE-CONT/ValidarQR?…` (mismos parámetros)
- 4 parámetros: `nif`, `numserie` (admite barras y alfanuméricos), `fecha` (DD-MM-YYYY),
  `importe` (punto decimal).
- Formato: ISO/IEC 18004, corrección de errores **M**, tamaño **30×30–40×40 mm** en el PDF.
- Leyendas: encima del QR siempre `QR tributario:`; en modalidad VERI*FACTU además la leyenda
  `Factura verificable en la sede electrónica de la AEAT` o `VERI*FACTU`.

### Servicio de remisión (SOAP)

- WSDL `SistemaFacturacion.wsdl`; esquemas `SuministroLR.xsd`, `SuministroInformacion.xsd`,
  `RespuestaSuministro.xsd`. Mirror cómodo: [hectorsipe/aeat-verifactu](https://github.com/hectorsipe/aeat-verifactu)
  (también [mdiago/VeriFactu](https://github.com/mdiago/VeriFactu) y
  [JoseRGWeb/Veri-factuSender](https://github.com/JoseRGWeb/Veri-factuSender) como referencia de implementación).
- **Entorno de pruebas**: `https://prewww1.aeat.es/wlpl/TIKE-CONT/ws/SistemaFacturacion/VerifactuSOAP`
  (certificado persona física/representante) · `prewww10.aeat.es` (certificado de sello).
- Autenticación: **mTLS con certificado electrónico** (no Cl@ve para procesos automatizados).
- **Control de flujo**: la respuesta de cada envío fija el tiempo de espera mínimo antes del
  siguiente lote (típicamente 60 s). Los registros se agrupan por obligado.
- Registro de alta XML: `TipoFactura` (**F1** completa / **F2** simplificada), desglose de IVA por
  tipo impositivo, encadenamiento (huella anterior), `FechaHoraHusoGenRegistro` con huso.
- La respuesta AEAT devuelve estado por registro (aceptado / aceptado con errores / rechazado) —
  hay que persistir el resultado y gestionar reintentos idempotentes.

---

## Arquitectura TRACKR

```
[navegador]                            [trackr-api]                    [AEAT]
emitir factura                         POST /v1/verifactu/registros    SOAP VerifactuSOAP
 ├─ calcular huella oficial      ──►    ├─ valida + encola (D1)   ──►   ├─ mTLS cert colaborador
 ├─ persistir en D.d.facturas[]         ├─ agrupa por obligado          ├─ control de flujo 60s
 ├─ pintar QR en el PDF                 ├─ cron/alarm remite            └─ respuesta por registro
 └─ cola local si no hay red            └─ guarda estado/CSV
```

- **Frontend** (funciona 100% offline): huella + QR se calculan al emitir; el registro se persiste
  en `D.d.facturas[]` (ya existe en main: `addFact`/`addFactEvent`/`lastHashFor` en `store.js`).
  Cola local de registros pendientes de remitir.
- **Canal en claro**: los registros VeriFactu viajan a `trackr-api` **fuera del blob cifrado**
  (van a AEAT igualmente). ⚠️ Matiz de copy: el zero-knowledge sigue siendo cierto para todo lo
  demás; hay que decirlo honesto — "tus registros de facturación se remiten a la AEAT si activas
  VERI*FACTU".
- **Backend**: tabla `verifactu_queue` en D1, remisión agrupada por obligado desde un cron (o
  Durable Object alarm), certificado en Secrets Store, respeto del control de flujo, persistencia
  de respuestas y reintentos con `Incidencia=S`.
- Requiere cuenta TRACKR **activa** para VeriFactu (el modo sin cuenta sigue existiendo, pero sin
  remisión → esas facturas no serían VERI*FACTU).

---

## Plan de ejecución

| Fase | Quién | Qué | Estimación |
|------|-------|-----|-----------|
| **1. Código local** ✅ | Claude | Hecho (commit `48ab47a`, 2026-07-16): huella oficial (pasa los 3 vectores de test AEAT v0.1.2 §6), QR con URL oficial de cotejo, bloque en el PDF (leyenda + SIF), verificación de cadena con guard de esquema legacy. Apagado por defecto. | ~~3-4 días~~ |
| **2. Gestiones** 🚧 | Manu | **Email a `comunicacion.sepri@correo.aeat.es` enviado el 2026-07-18** — esperando respuesta (camino crítico). Pendiente: localizar certificado FNMT · acceso al portal de pruebas AEAT. | espera de respuesta |
| **3. Backend remisión** 🚧 | Claude | **Partes 1-3 hechas (18-19 jul)**: cola D1 + endpoints (`trackr-api@9be6a71`), frontend que encola al sincronizar con estado en Configuración (`trackr@5e85621`), y **XML RegFactuSistemaFacturacion validado contra los XSD oficiales** con xmllint en tests (`trackr-api@d47c4f1`; XSD en `docs/xsd/`). Ciclo verificado: factura firmada → cola → XML válido. Queda SOLO el transporte: cliente SOAP mTLS + cron por obligado con control de flujo — bloqueado por Fase 2 (certificado/017). | 1-2 días restantes |
| **4. Legal/producto** | Manu (+textos de Claude) | Flujo de representación normalizada por usuario · declaración responsable pública (base en `verifactu.html` de la rama) · elegir ID SIF (propuesta: `1T`) · ajustar copy zero-knowledge. | 2-3 días |
| **5. Ensayo general** | ambos | Cadena de 10+ facturas contra preproducción, anulación, corte de red simulado, verificación QR. | 1-2 días |

**Cuándo:** Fase 1 hecha y el email de la Fase 2 salió el 2026-07-18 — el reloj de la AEAT ya
corre. Mientras llega respuesta se puede adelantar la Fase 3 en lo que no necesita certificado
(cola D1, XML de registros, validación) y la Fase 4 (textos legales). Objetivo: remisión
funcionando en preproducción antes de fin de 2026, margen de 6 meses sobre el deadline.

---

## Identificador SIF y declaración responsable

- **ID SIF propuesto**: `1T` (Quipu usa `1Q`). Se fija el día de la firma.
- Declaración responsable: PDF firmado + HTML público sin login en el dominio de producción
  (`trackr.meowrhino.studio/verifactu` — decidir si tr4ckr.com es el canónico). Identidad del
  fabricante, producto+versión, declaración de conformidad RD 1007/2023 + Orden HAC/1177/2024.
  Modelo de referencia: Quipu (`getquipu.com/es/verifactu-declaracion-responsable.html`); la AEAT
  publica ejemplos en la web de desarrolladores.
- Como **fabricante**, la obligación de comercializar solo SIF conformes rige desde 29-jul-2025
  (art. 201 bis: 150.000 €/ejercicio fabricante). Mientras TRACKR sea beta no comercializada como
  software de facturación el riesgo es bajo, pero **hay que estar conforme antes de cobrar a nadie**.

---

## Fuera de alcance

- **TicketBAI** (País Vasco/Navarra): specs forales distintas; solo si un beta tester lo pide.
- **Modalidad no verificable**: descartada (XAdES por registro + eventos + conservación 4 años).

## Riesgos

- **Respuesta lenta/negativa de AEAT al 017 como persona física** → camino crítico; plan B arriba.
- **Bug en la huella en producción**: cadena rota = contabilidad del usuario en duda. Mitigación:
  validar contra el documento oficial + vectores de test + "Verificar integridad" visible.
- **Fricción del apoderamiento por usuario**: puede frenar la adopción; diseñar el flujo con mimo.
- Cambios normativos: revisar BOE/FAQs AEAT cada 3 meses hasta jul 2027.
