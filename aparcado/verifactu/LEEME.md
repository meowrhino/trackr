# VeriFactu (aparcado)

Aquí está todo lo que trackr tenía de VeriFactu, **desconectado de la app**. Nada de esta carpeta
se carga ni se publica (`build.sh` no la copia a `dist/`).

## Qué hacía
- `verifactu.js`: huella oficial de la AEAT (SHA-256 encadenada por emisor), el QR de cotejo y un
  autotest contra los 3 vectores oficiales.
- `qrcode/`: la librería que pintaba el QR en el PDF.
- En la app: una sección en Configuración, la firma al emitir cada factura, el QR con la leyenda
  «Factura verificable en la sede electrónica de la AEAT» y una cola en el servidor para una
  remisión a la AEAT que nunca llegó a existir.

## Por qué se desconectó (noviembre de 2026)
- La factura decía «verificable en la sede electrónica de la AEAT» y llevaba el QR, pero no se
  remitía nada: quien escaneara el QR no la encontraba.
- Con VeriFactu activado, las facturas subían legibles al servidor (NIF, nombres, importes), en
  contra de «ni nosotros podemos leer tus datos».
- La rectificativa no entraba en la cadena, y la cadena se rompía al importar o con dos dispositivos.
- Decisión: trackr no hace VeriFactu ni remisión a la AEAT. Mejor que no exista a que mienta.

## Qué queda en la app
- `settings.verifactu.habilitado` se fuerza a `false` al cargar (`js/store.js`).
- `d.facturas` (los registros que firmó quien lo tuvo activo) se conserva y solo se lee: una
  factura que se anuló entonces sigue anulada (`D.facturaVigente`), y una ya firmada no se puede
  borrar (`D.facturaBorrable`).
- En el servidor (`trackr-api`), lo mismo: `aparcado/verifactu/` y las rutas quitadas.

## Si algún día se retoma
El plan original está en `TODO/15-verifactu.md`. Habría que resolver antes: remisión real (acuerdo
de colaboración social), registros que solo se añaden, rectificativas y anulaciones en la cadena,
y decir bien claro al activarlo qué datos salen del navegador.
