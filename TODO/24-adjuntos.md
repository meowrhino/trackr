# 24 — Adjuntos: justificantes de gasto (PDFs/fotos)

## Estado: 💡 diseñado (2026-07-19) · define el plan de pago — no empezar sin decidir precios

## Contexto y principios

Lo que pide una gestoría además de los números: el justificante de cada gasto.
Dos restricciones fundacionales que NO se tocan:

- **El JSON es el save file** (export/copias/sync, tope 256 KB): los binarios nunca
  van dentro, comprimidos o no. Un solo PDF lo reventaría.
- **Zero-knowledge**: ningún archivo viaja ni se guarda en claro.

Nota: las facturas EMITIDAS por TRACKR no se almacenan — se regeneran idénticas desde
los datos. Esto es solo para las recibidas.

## Diseño

- Cada archivo = **objeto cifrado aparte en R2** (`a/{userId}/{sha256}`), cifrado
  client-side (gzip → AES-GCM, misma cripto existente). Clave por archivo.
- El gasto/entrada guarda solo la referencia `{attachId, key, nombre, bytes}` — viaja
  dentro del blob principal cifrado, como todo.
- **Compartición con gestoría**: re-envolver la clave del archivo hacia la shareKey del
  grant (mismo patrón que el blob sombra). El visor descarga y descifra bajo demanda.
- Compresión: gzip antes de cifrar (en PDFs de texto rasca un 10-20%; en fotos nada —
  no prometer milagros). Límite por archivo ~5 MB; aviso de "haz foto en calidad media".
- Borrado: al borrar gasto/entrada → delete del objeto (best-effort) + huérfanos por cron.

## Coste y plan de pago

R2 cobra por GB almacenado. Facturas de proveedor típicas: 30-200 KB → en 50 MB caben
cientos. Propuesta: **gratis con tope (p.ej. 50 MB)**, plan de pago (Escenario A,
~3-5 €/mes) para más. Es LA feature que justifica el plan — decidir precio antes de
construir. Cuota visible en Configuración.

## Alcance v1

Subir desde el modal de gasto/entrada, ver/descargar desde la app y desde el visor de
gestoría, tope por archivo y por cuenta. Fuera de v1: OCR, foto-a-gasto automático,
adjuntos en facturas emitidas.
