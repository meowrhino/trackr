# 29 — Historial en la nube + sync que no se muere en silencio

## Estado: ✅ hecho — parte B el 14 oct 2026 (`e76337f`, versiones en la nube con Restaurar), parte A el 19 oct (`df3dd81`, el 401 bloquea la sesión y lo dice)

## Hallazgo (17 sep 2026)

Revisando D1 por un dato que parecía perdido (resultó no estarlo — ver `30-trimestre-vacio.md`):

- Cuenta `manuellatourf@gmail.com`: **último push a la nube el 29 jul 2026 11:33 (v93)**.
  El login de hoy (17 sep 12:57) bajó ese blob y no subió nada.
- Las 10 versiones guardadas (v84 23-jun → v93 29-jul) **solo crecen** de tamaño
  (11 844 → 12 172 bytes), y v92 y v93 pesan exactamente igual: en la nube no se borró
  nada y desde el 19 de julio no hay cambios reales de datos.
- Sesiones: 23 filas, todas caducadas (idle 29-jul 12:33, tope duro 5-ago). El cron de
  purga no las está limpiando.

No hubo pérdida esta vez porque el local y la nube coincidían. Pero el mecanismo está ahí:
un `pull()` sustituye el local entero (`D.load` → `save`), y entre el 29 de julio y hoy
pasaron siete semanas en las que cualquier cambio local habría muerto en ese login.

## Parte A — el sync se muere sin avisar (urgente)

La sesión dura 7 días (tope duro). Al caducar, `detectLocked()` deja el estado en
`locked`, el auto-sync no se reactiva y **no pasa nada más**: ni aviso, ni insistencia.
El único rastro es el icono de la barra y un botón "Desbloquear" enterrado en Ajustes.
El usuario sigue trabajando creyendo que tiene copia en la nube.

- Aviso visible y persistente cuando `state === 'locked'` y el último push pasa de X días
  ("tu última copia en la nube es del 29 de julio").
- Usar `last_upload_at` / `version` de la meta local para calcular la antigüedad sin red.
- Purgar sesiones caducadas de verdad (revisar el cron).

## Parte B — el historial de la nube existe y la app no lo usa

El backend guarda las **últimas 10 versiones** (`blob_versions`, `MAX_VERSIONS = 10`) y
las sirve: `GET /v1/versions` (versión, hash, tamaño, fecha) y `GET /v1/blob?version=N`.
`js/account.js` **no llama a ninguno de los dos** — cero referencias. Hay un historial
en la nube al que no se llega desde la interfaz.

- `Acc.listVersions()` y `Acc.previewVersion(n)`: descarga, descifra en el navegador y
  carga en memoria **sin guardar** (patrón `D.loadView` del modo visor).
- Bloque en Ajustes junto al historial local (`H`, 10 snapshots LZString): lista de
  versiones con fecha y tamaño, "ver" y "restaurar" (restaurar = `H.snapshot()` antes).
- Ojo: son 10 versiones, no 10 días. Con auto-sync activo se consumen rápido.
