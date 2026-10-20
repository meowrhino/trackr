# 31 — Al iniciar sesión, comparar en vez de pisar

## Estado: ✅ A el 19 oct 2026 (`cc04e3c`) · C el 20 oct 2026 (mergeData usa la auditoría como reloj por registro: borrados que se propagan y edición más reciente gana; límite: 500 eventos de auditoría)

## El caso

17 sep 2026. El portátil llevaba desde el 29 de julio sin sesión: 43 proyectos, datos
hasta el 31 de agosto y **119 cambios registrados en `audit[]` el 2 de septiembre entre
las 16:10 y las 17:30**, todos con actor `local`. La nube seguía en la v93 del 29 de julio:
35 proyectos, último dato del 29 de junio.

Iniciar sesión ahí habría ejecutado `pull()` → `_applyRemote` → `D.load()` → **reemplazo
total**, sin preguntar y sin enseñar lo que se iba. Se salvó porque exportamos antes.

## Por qué pasa

- `pull()` ([account.js:161](../js/account.js:161)) no compara: descarga, descifra y carga.
- `mergeData()` existe pero solo se usa en el 409 de `push()`, nunca al entrar.
- El auto-sync no se persiste: `_enabled` vuelve a `false` en cada recarga y la casilla de
  Ajustes se pinta siempre desmarcada. Basta una recarga para quedarse sin sync y no notarlo.

## Etapa A — nunca pisar sin enseñar (lo urgente)

`pull()` pasa a tener dos fases: descargar+descifrar, y **decidir**.

1. Si no hay datos locales, o local y nube son idénticos (comparar hash del JSON
   normalizado): aplicar, como ahora. Silencioso.
2. Si difieren, `compareData(local, cloud)` devuelve el resumen y se pinta un modal:

```
        En este dispositivo        En la nube
        43 proyectos               35
        24 clientes                21
        10 gastos                   8
        hasta el 31 ago 2026       hasta el 29 jun 2026
        119 cambios sin subir      v93 · 29 jul 13:33

   [Combinar (recomendado)]  [Quedarme con este]  [Traer la nube]  [Exportar antes]
```

- "cambios sin subir" sale de `audit[]` filtrando por `ts` posterior al último push
  conocido (`meta.version` / `last_upload_at`): el anillo ya guarda 500 eventos con hora.
- `H.snapshot()` antes de aplicar cualquiera de las tres, como ahora.
- El botón de exportar escribe el JSON sin cerrar el modal.

## Etapa B — que "combinar" combine de verdad

`mergeData()` hoy hace unión por id **solo en el nivel raíz**: si un proyecto existe en
los dos lados, se queda entero el local y se tiran las horas que solo estaban en la nube.
En el caso real, `misc` tenía 63 horas en el portátil y 52 en la nube.

- Unión por id también en los arrays anidados: `horas[]`, `facturacion.cobros[]`,
  `gastos[].entradas[]`, `journey.cards[]`. Todos tienen `id` ya.
- Contadores monótonos (`nextFacturaNum`) al máximo — ya se hace.
- En empate de un mismo id, gana el local (sin reloj no hay nada mejor). Eso ya no duele
  cuando lo anidado se une en vez de perderse.

## Etapa C — reloj por registro y borrados que se propagan

Sin esto, "combinar" resucita lo borrado y no sabe resolver ediciones cruzadas.

- `u` (timestamp) por registro, escrito en los mutadores de `store.js` — están todos
  centralizados (`add`/`up`/`del`, `addCl`/`upCl`/`delCl`, `addG`/`upG`/`delG`…).
- Los borrados dejan **lápida** en vez de desaparecer del array (`{id, u, del:true}`),
  con purga a los ~90 días.
- `mergeData` resuelve por `u` mayor; una lápida más nueva que el registro lo mantiene
  borrado.
- Desfase de reloj: tomar la hora del servidor de la cabecera `Date` de la API y guardar
  el offset, en vez de fiarse del reloj del dispositivo.
- Migración: sellar todo lo existente con la fecha del primer arranque de esta versión.

## Suelto pero del mismo saco

- Persistir la preferencia de auto-sync y que la casilla refleje el estado real
  ([app.account-ui.js:150](../js/app.account-ui.js:150) la pinta siempre vacía).
- Avisar cuando la última copia en la nube tenga más de X días (ver `29-historial-nube.md`).
