# 32 — Perfil fiscal: cada autónomo con sus modelos

## Estado: 💡 idea de manu (20 oct 2026) · para verla con calma

## La idea

Hay muchos tipos de autónomo y Trackr solo representa el nuestro (servicios, régimen
general, 303 + 130 + 390 + renta). Que en Configuración (o al crear el perfil) marques
**qué modelos te corresponden**, y que la app abra o cierre opciones según eso.

Modelos que nosotras no presentamos pero otra gente sí, a investigar:

- **111 / 190** — retenciones practicadas a terceros (quien paga a profesionales con
  retención o tiene nómina). Trackr ya guarda la retención de cada gasto (ficha 26); el
  111 trimestral y el 190 anual saldrían de ahí. El 111 se descartó en la ficha 27 «por
  ahora» precisamente porque meowrhino no lo presenta.
- **347** — operaciones con terceros > 3.005,06 €/año. Sale de facturas emitidas y
  gastos agrupados por NIF; en nuestro caso casi nunca aplica pero para otros sí.
- **349** — intracomunitarias (ya avisamos cuando hay 59 o 10/11).
- **115 / 180** — alquiler de local con retención.
- Recargo de equivalencia, módulos (131), prorrata…: fuera, son otro mundo.

## Qué habría que decidir

1. Dónde vive el perfil: `settings.fiscal.modelos = { '303': true, '130': true, '111': false … }`
   con defaults = los de hoy, para que nadie note el cambio.
2. Qué enciende cada modelo: pestañas en Dineros → Fiscal, campos extra en gastos/clientes
   (p. ej. «retención practicada» solo con 111), avisos de plazos en Info.
3. Si se pregunta en el arranque («¿qué modelos presentas?») o solo en Configuración.
   Primero Configuración; el onboarding, cuando haya más de un perfil que valga la pena.
4. Casillas y plazos de cada modelo nuevo: investigar como se hizo en TODO/20 antes de
   tocar cálculo.
