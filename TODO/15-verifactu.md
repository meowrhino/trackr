# 15 — Verifactu / homologación SIF

## Estado: ⏳ pendiente · deadline 1 jul 2027

### Contexto normativo

- **Real Decreto 1007/2023** establece el reglamento del Sistema Informático de Facturación (SIF) "Verifactu".
- **Orden HAC/1177/2024** desarrolla los requisitos técnicos.
- **Real Decreto-ley 15/2025** (BOE 03/12/2025) aplaza las fechas:
  - **1 enero 2027** → sociedades obligadas.
  - **1 julio 2027** → autónomos en estimación directa.
- La AEAT **no homologa** software; los fabricantes auto-certifican mediante **declaración responsable** firmada y publicada en URL abierta del dominio.
- Sanciones: hasta **50.000 €/ejercicio** por uso de software no homologado.

### Estado de la competencia

- **Quipu**: declaración firmada 29 jul 2025, publicada en URL pública (`getquipu.com/es/verifactu-declaracion-responsable.html`). Código SIF `1Q`. El más transparente — referencia para nuestra implementación.
- **Holded**: activo, accesible solo dentro del producto.
- **Contasimple**: declaración firmada 29 jul 2025, accesible solo dentro del producto.

---

## Las dos modalidades de SIF

> ⚠️ **CORRECCIÓN (revisión 2026-07-05, FAQs oficiales AEAT):** la premisa de este doc estaba mal.
> La modalidad **no verificable** es la EXIGENTE, no la fácil:
> - Exige **firma XAdES (Enveloped) con certificado electrónico de CADA registro** (alta, anulación y eventos) — el hash encadenado solo NO basta.
> - Exige **registro de eventos** firmado y encadenado (arranque/cierre como NO VERI*FACTU, detección de anomalías, exportaciones, resumen cada 6h de operación).
> - Exige **conservación inalterable 4+ años** de los registros — localStorage (borrable/editable por el usuario) no puede sostener eso ante una inspección.
> - La modalidad **Verifactu (remisión continua)** es la que encaja con local-first: remitir a AEAT **exime de firmar y de conservar** los registros (quedan en AEAT). Es justo por esto que la app gratuita de la propia AEAT es modalidad Verifactu.
> - QR: en no verificable la URL de cotejo es **distinta** (`ValidarQRNoVerifactu`) y NO lleva la leyenda "VERI*FACTU"; encima del QR siempre va "QR tributario:". Tamaño 30×30–40×40 mm, ISO 18004, corrección M.
> - Fuentes: FAQ firma AEAT, FAQ eventos, FAQ declaración responsable, spec QR v0.5.0 (URLs en TODO/20).
>
> **Consecuencia:** el WIP de `verifactu-wip` (hash SHA-256 + QR, sin firma XAdES ni eventos) NO cumpliría la modalidad no verificable tal cual. Opciones reales: (a) modalidad Verifactu con remisión vía Worker (requiere certificado del obligado o colaborador social — investigar), (b) quedar fuera del ámbito SIF (difícil: TRACKR calcula y emite facturas → es un SIF según el criterio AEAT sobre Excel "listos"), o (c) esperar; deadline autónomos 1-jul-2027, y como *fabricante* la obligación de comercializar solo SIF conformes rige desde 29-jul-2025 (sanción art. 201 bis: 150.000 €/ejercicio fabricante, 50.000 €/ejercicio usuario) — mientras sea beta no comercializada como software de facturación el riesgo es bajo, pero es decisión de producto antes del lanzamiento startup.

- **SIF "no verificable"** — el software cumple integridad/trazabilidad/hash pero **no envía** facturas en tiempo real a la AEAT. ~~Esta es nuestra opción: coherente con el ADN local-first, sigue funcionando offline, no requiere certificado del usuario.~~ ← incorrecto, ver corrección arriba.
- **SIF "Veri*Factu" (verificable)** — además envía cada factura a la AEAT vía API en cuanto se emite. Requiere certificado digital del autónomo + integración con la API de la AEAT.

---

## Requisitos técnicos a implementar (SIF no verificable)

### 1. Hash encadenado por emisor

Cada factura emitida lleva un **SHA-256** que se calcula sobre:
- Datos canónicos de la factura (NIF emisor, número, fecha, importe total, NIF cliente).
- Más el **hash de la factura anterior** del mismo emisor (encadenamiento tipo blockchain mini).

Si cualquier factura se modifica a posteriori, la cadena se rompe y se detecta.

**Cómo lo implementamos:**
- Nuevo objeto top-level en el JSON: `D.d.facturas[]`, lista inmutable de facturas firmadas.
- Cada entrada: `{ id, numero, fecha, emisorNif, clienteNif, totalFactura, hash, hashPrev, timestamp, qrPayload, eventos: [] }`.
- Función `signInvoice(data, hashPrev)` en `js/verifactu.js` que devuelve el hash.
- Usamos `crypto.subtle.digest('SHA-256', ...)` (nativo del navegador, async).
- Al emitir factura: buscar el último hash del mismo emisor, calcular el nuevo, persistir.

### 2. Código QR en el PDF

Cada PDF de factura debe llevar un QR con el payload exacto definido por la AEAT:

```
NIF_EMISOR | NUMERO_SERIE | FECHA_EMISION | IMPORTE_TOTAL | HASH
```

(Formato real lo confirmamos contra la Orden HAC/1177/2024 al implementar.)

**Cómo lo implementamos:**
- Librería: `qrcode-generator` (small, ~10 KB, sin dependencias, soporta UTF-8). La metemos en el repo vía `js/lib/qrcode.js` o CDN.
- En `Fac.download`, generar el QR antes del jsPDF render, añadirlo como imagen en una esquina inferior derecha (estándar AEAT).

### 3. Sello de tiempo

ISO 8601 local del momento de la firma. Para SIF **no verificable** basta con `new Date().toISOString()`. No requiere TSA externa.

### 4. Registro de eventos (modificaciones)

Si una factura se anula o rectifica, queda en un log inalterable. Nunca borramos una factura del array `facturas[]`.

**Estructura del evento:**
```js
{ tipo: 'anulada' | 'rectificada', fecha: '2027-...', motivo: '...', refFactura: 'fact-2026-0042' }
```

Se añade al array `eventos[]` de la factura original. Si es rectificación, se crea una nueva factura con `tipoFactura: 'rectificativa'` y `refOriginal: 'fact-2026-0042'`.

### 5. Identificador SIF en el PDF

En el pie de cada factura PDF:
```
SIF: 1T · TRACKR v0.4.x · Cumple RD 1007/2023, Orden HAC/1177/2024
URL: https://tr4ckr.com/verifactu
```

- **Identificador SIF**: a decidir. Sugerencia: `1T` (Quipu usa `1Q`).
- **Versión del software**: a fijar el día de la firma de la declaración.

### 6. Declaración responsable pública

Documento (PDF firmado + página HTML) en `tr4ckr.com/verifactu` con:
- Identidad del fabricante (TÚ: nombre, NIF, domicilio fiscal, contacto).
- Producto: TRACKR, versión X.Y.Z, fecha de la versión.
- Declaración explícita de que cumple RD 1007/2023, Orden HAC/1177/2024.
- Firma digital o manuscrita escaneada.
- Sin requerir login.

Modelo a copiar (textualmente): `getquipu.com/es/verifactu-declaracion-responsable.html`.

---

## Schema del JSON tras la implementación

```js
// Top-level nuevo (al lado de projects, clientes, gastos, settings):
"facturas": [
  {
    "id": "fact-2026-0042",                  // ID interno (uid)
    "numero": "0042/26",                      // Número serie tal cual aparece en PDF
    "fecha": "2026-12-15",                    // Fecha de emisión (devengo)
    "emisorNif": "12345678A",
    "clienteNif": "B11111111",
    "clienteNombre": "Acme SL",
    "baseImponible": 1000.00,
    "iva": 21,
    "importeIva": 210.00,
    "irpf": 15,
    "importeIrpf": 150.00,
    "totalFactura": 1060.00,
    "proyectoId": "pj-...",                   // Ref al proyecto que la generó
    "hash": "abc123...",                      // SHA-256 base64
    "hashPrev": "def456..." | null,           // Hash de la anterior del mismo emisor
    "timestamp": "2026-12-15T18:34:22.123Z",
    "qrPayload": "12345678A|0042/26|2026-12-15|1060.00|abc123...",
    "tipoFactura": "ordinaria" | "rectificativa",
    "refOriginal": "fact-2026-0040" | null,   // Solo si rectificativa
    "eventos": []                              // [{ tipo, fecha, motivo, ... }]
  }
]

// settings nuevo:
"settings": {
  ...
  "verifactu": {
    "sifId": "1T",
    "softwareVersion": "0.4.0",
    "habilitado": true,                      // Toggle por si alguien quiere PDFs sin Verifactu
    "lastInvoiceHash": "abc123..."           // Para encadenar la próxima
  }
}
```

---

## Plan de ejecución concreto

| Fase | Tiempo | Acción |
|------|--------|--------|
| 1. Estudio | 4-6 h | Leer Orden HAC/1177/2024 + inspeccionar la página pública de Quipu. Confirmar el formato exacto del payload del QR y los campos canónicos del hash. |
| 2. Módulo `js/verifactu.js` | 4-6 h | Funciones `signInvoice`, `buildQRPayload`, `verifyChain`. Tests manuales. |
| 3. Schema + migración | 2-3 h | Añadir `D.d.facturas[]` y `settings.verifactu` al store, migrar facturas existentes (sin hash, marcadas como pre-Verifactu). |
| 4. Integración `Fac.download` y `App.genFactura` | 4-6 h | Calcular hash + QR antes de generar PDF. Insertar QR + identificador SIF en el PDF. Persistir factura firmada. |
| 5. Librería QR | 1 h | Añadir `js/lib/qrcode.js` (qrcode-generator). |
| 6. Vista de auditoría | 2-3 h | Sección en Configuración con lista de facturas firmadas + verificación de cadena (botón "Verificar integridad"). |
| 7. Landing `tr4ckr.com/verifactu` | 2-3 h | HTML estático con la declaración responsable + identificador + versión. |
| 8. Redactar y firmar la declaración | 1-2 h | Texto legal + firma manuscrita escaneada o e-firma. |
| 9. Tests E2E + ensayos en preview | 3-4 h | Generar 5-10 facturas en cadena, verificar integridad, modificar una a mano y comprobar que se detecta. |
| **Total** | **23-34 h** | **~3-4 jornadas a tiempo completo** o **6-8 semanas a ratos sueltos**. |

---

## Decisión cuándo empezar

- Plan oficial: **Q1 2027**.
- Recomendación: arrancar **a más tardar en diciembre 2026** para tener 4-5 meses de margen.
- Si TRACKR coge tracción este verano (≥20 beta testers reales) → adelantar a **octubre 2026**.

---

## Decisión sobre TicketBAI (País Vasco, Navarra)

**No entrar** a corto plazo. Las especificaciones forales (Bizkaia, Gipuzkoa, Araba, Navarra) son distintas y requieren análisis específico. Si un beta tester del PV/NV lo pide, evaluar entonces.

---

## Riesgos

- **Si TRACKR no se homologa antes del 1 jul 2027**: los usuarios autónomos no pueden emitir facturas legales con la app → pérdida total del mercado principal. Mitigación: este TODO es prioridad alta en Q1 2027.
- **Bug en el hash encadenado en producción**: si un usuario tiene la cadena rota por un bug nuestro, su contabilidad queda en duda ante una inspección. Mitigación: tests exhaustivos antes de release + función "Verificar integridad" visible al usuario.
- **Cambios normativos antes del 1 jul 2027**: improbable, pero posible. Mitigación: revisar BOE cada 3 meses durante 2026-27.
