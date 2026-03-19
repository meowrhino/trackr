/* ================================================
 * TRACKR — Temas
 * Definiciones de temas y aplicación dinámica.
 * Cada tema define las variables CSS del :root.
 * Globales: THEMES, applyTheme
 * Dependencias: ninguna
 *
 * Filosofía: cada tema cuenta una historia cromática.
 * ok/warn/bad no son verde/amarillo/rojo genéricos
 * — son colores que dan alegría, tensión y alarma
 * DENTRO de la gama del tema.
 * ================================================ */

/**
 * Catálogo de temas disponibles.
 * Variables por tema:
 *   bg, bg2, bg3, bg4  — fondos (principal → más claro)
 *   b1, b2, b3          — bordes (sutil → fuerte)
 *   t1, t2, t3          — texto (primario → terciario)
 *   ok, warn, bad       — estado (éxito, aviso, error)
 *   ac                  — acento (botones primarios, debe ser legible con #fff encima)
 *   r                   — border-radius
 *   sh                  — box-shadow para cards
 */
const THEMES = {

  /* ── Oscuro: carbón frío + destellos dorados (inspo: becasDigMeow dark) ── */
  oscuro: {
    label: 'Oscuro',
    vars: {
      bg: '#101216', bg2: '#181c22', bg3: '#20242c', bg4: '#282e36',
      b1: '#262c34', b2: '#363e48', b3: '#48505c',
      t1: '#d0d4dc', t2: '#7c8490', t3: '#586068',
      ok: '#e8b84c', warn: '#e07840', bad: '#d0486a',
      ac: '#2a7ca8', r: '3px', sh: 'none'
    }
  },

  /* ── Claro: papel viejo + tinta y terracota (inspo: fog/pottery) ── */
  claro: {
    label: 'Claro',
    vars: {
      bg: '#eee8dc', bg2: '#f6f0e4', bg3: '#e4dccf', bg4: '#d8cfc0',
      b1: '#ccc2b0', b2: '#b8ae9c', b3: '#9e9484',
      t1: '#1e1610', t2: '#584e3e', t3: '#8a8070',
      ok: '#3a8856', warn: '#c07018', bad: '#b83838',
      ac: '#a85028', r: '4px', sh: '0 1px 3px rgba(0,0,0,.06)'
    }
  },

  /* ── Medianoche: espacio profundo + estrellas eléctricas (inspo: storm) ── */
  medianoche: {
    label: 'Medianoche',
    vars: {
      bg: '#080c1c', bg2: '#0e142a', bg3: '#161e3a', bg4: '#1e284a',
      b1: '#1a2644', b2: '#283a64', b3: '#384c78',
      t1: '#c8d0e4', t2: '#6878a4', t3: '#44587c',
      ok: '#50c0e8', warn: '#ecc050', bad: '#d05880',
      ac: '#4854c8', r: '3px', sh: 'none'
    }
  },

  /* ── Sepia: mapa del tesoro + oro y cobre (inspo: vintage treasure) ── */
  sepia: {
    label: 'Sepia',
    vars: {
      bg: '#1c1610', bg2: '#261e14', bg3: '#322820', bg4: '#3c3228',
      b1: '#3c3020', b2: '#544838', b3: '#645a48',
      t1: '#e0c8a0', t2: '#a09068', t3: '#6c5e42',
      ok: '#dab050', warn: '#d88838', bad: '#c45848',
      ac: '#b07828', r: '3px', sh: 'none'
    }
  },

  /* ── Nord: aurora boreal sobre polar night (canon Nord + más vida) ── */
  nord: {
    label: 'Nord',
    vars: {
      bg: '#2e3440', bg2: '#3b4252', bg3: '#434c5e', bg4: '#4c566a',
      b1: '#434c5e', b2: '#4c566a', b3: '#5c6880',
      t1: '#eceff4', t2: '#88c0d0', t3: '#6a90ac',
      ok: '#a3be8c', warn: '#ebcb8b', bad: '#d07078',
      ac: '#5e81ac', r: '3px', sh: 'none'
    }
  },

  /* ── Monokai: paleta editor clásica, acento naranja cálido ── */
  monokai: {
    label: 'Monokai',
    vars: {
      bg: '#272822', bg2: '#2e2f28', bg3: '#383930', bg4: '#424338',
      b1: '#3e3f38', b2: '#4e4f48', b3: '#5e5f58',
      t1: '#f8f8f2', t2: '#a6a68a', t3: '#75715e',
      ok: '#e6db74', warn: '#fd971f', bad: '#f92672',
      ac: '#cc6633', r: '3px', sh: 'none'
    }
  },

  /* ── Pizarra: tormenta eléctrica + relámpagos (inspo: dark cloud) ── */
  pizarra: {
    label: 'Pizarra',
    vars: {
      bg: '#40484c', bg2: '#4c5458', bg3: '#384044', bg4: '#30383c',
      b1: '#38424a', b2: '#586068', b3: '#6c7880',
      t1: '#e4e8ec', t2: '#a4acb8', t3: '#9098a8',
      ok: '#50d0c0', warn: '#ecc040', bad: '#f88898',
      ac: '#4088b8', r: '3px', sh: 'none'
    }
  },

  /* ── Ocaso: hora mágica + cielo en llamas (inspo: heat + sunset) ── */
  ocaso: {
    label: 'Ocaso',
    vars: {
      bg: '#4c3424', bg2: '#5c4030', bg3: '#422c1c', bg4: '#382414',
      b1: '#483424', b2: '#685444', b3: '#806858',
      t1: '#f4dcc4', t2: '#c0a484', t3: '#988068',
      ok: '#ecb848', warn: '#e87840', bad: '#f06868',
      ac: '#c86028', r: '4px', sh: 'none'
    }
  },

  /* ── Arena: oasis en el desierto + cactus y arcilla ── */
  arena: {
    label: 'Arena',
    vars: {
      bg: '#ece0c8', bg2: '#f4ecd8', bg3: '#e0d4bc', bg4: '#d4c8b0',
      b1: '#c8bca4', b2: '#b0a48c', b3: '#988c74',
      t1: '#282010', t2: '#5c4c38', t3: '#887c64',
      ok: '#508840', warn: '#b07018', bad: '#b84030',
      ac: '#8c5424', r: '4px', sh: '0 1px 3px rgba(0,0,0,.06)'
    }
  },

  /* ── Hacker: fósforo verde CRT + glitch eléctrico ── */
  hacker: {
    label: 'Hacker',
    vars: {
      bg: '#040804', bg2: '#0a100a', bg3: '#101810', bg4: '#162016',
      b1: '#122012', b2: '#1c2e1c', b3: '#283c28',
      t1: '#30d030', t2: '#1c8c1c', t3: '#186818',
      ok: '#30d030', warn: '#c8d030', bad: '#d03030',
      ac: '#1a7a1a', r: '1px', sh: 'none'
    }
  },

  /* ── Lavanda: noche púrpura suave + violeta y oro (inspo: light rain) ── */
  lavanda: {
    label: 'Lavanda',
    vars: {
      bg: '#141018', bg2: '#1a1520', bg3: '#221c2a', bg4: '#2a2434',
      b1: '#261e30', b2: '#362e42', b3: '#463e52',
      t1: '#d0c8dc', t2: '#8a7ea0', t3: '#665480',
      ok: '#a088d0', warn: '#d4a84c', bad: '#c85a6a',
      ac: '#7a50b0', r: '5px', sh: 'none'
    }
  },

  /* ── Tinta: brutal b/w + neón rojo/verde (inspo: noir + neon signs) ── */
  tinta: {
    label: 'Tinta',
    vars: {
      bg: '#000000', bg2: '#080808', bg3: '#141414', bg4: '#1c1c1c',
      b1: '#1e1e1e', b2: '#303030', b3: '#484848',
      t1: '#f0f0f0', t2: '#a0a0a0', t3: '#606060',
      ok: '#00e070', warn: '#f0c000', bad: '#f02040',
      ac: '#d01830', r: '1px', sh: 'none'
    }
  },

  /* ── Bosque: selva nocturna + luciérnagas y ámbar (inspo: rain theme) ── */
  bosque: {
    label: 'Bosque',
    vars: {
      bg: '#0c1410', bg2: '#121c14', bg3: '#1a261c', bg4: '#223026',
      b1: '#1e2c20', b2: '#2c3e30', b3: '#3c5240',
      t1: '#c8dcc8', t2: '#70a478', t3: '#4c6450',
      ok: '#48d880', warn: '#e8a838', bad: '#d06040',
      ac: '#2e9858', r: '4px', sh: 'none'
    }
  },

  /* ── Cerezo: noche de hanami + sakura y farolillos dorados ── */
  cerezo: {
    label: 'Cerezo',
    vars: {
      bg: '#1a0c10', bg2: '#241418', bg3: '#301c24', bg4: '#3c242e',
      b1: '#341c26', b2: '#4c3038', b3: '#5c404c',
      t1: '#e4c8d0', t2: '#a47880', t3: '#74525e',
      ok: '#e890a8', warn: '#dcac50', bad: '#d04858',
      ac: '#b84060', r: '3px', sh: 'none'
    }
  },

  /* ── Nube: cielo lluvioso + rayos de sol entre nubes ── */
  nube: {
    label: 'Nube',
    vars: {
      bg: '#dce4f0', bg2: '#e6ecf8', bg3: '#d0d8e8', bg4: '#c4cce0',
      b1: '#b4c0d8', b2: '#9cacc4', b3: '#849cb8',
      t1: '#182030', t2: '#38506c', t3: '#6c88a0',
      ok: '#2874a4', warn: '#a87018', bad: '#b83848',
      ac: '#2860a8', r: '5px', sh: '0 1px 3px rgba(0,0,0,.05)'
    }
  },

  /* ── Melocotón: atardecer mediterráneo + coral y buganvilla ── */
  melocoton: {
    label: 'Melocotón',
    vars: {
      bg: '#f0dcd0', bg2: '#f8e8de', bg3: '#e8cec4', bg4: '#dcc0b6',
      b1: '#d0b4a8', b2: '#bca498', b3: '#a48c84',
      t1: '#2a1810', t2: '#644840', t3: '#988078',
      ok: '#b06040', warn: '#a07020', bad: '#b83038',
      ac: '#c85038', r: '6px', sh: '0 1px 3px rgba(0,0,0,.06)'
    }
  },

  /* ── Menta: agua turquesa + espuma y coral (inspo: snow theme) ── */
  menta: {
    label: 'Menta',
    vars: {
      bg: '#d4ece2', bg2: '#e0f4ec', bg3: '#c8e0d4', bg4: '#bcd8cc',
      b1: '#accabb', b2: '#94b8a8', b3: '#7ca494',
      t1: '#102820', t2: '#345848', t3: '#608878',
      ok: '#1c8060', warn: '#a07820', bad: '#b03838',
      ac: '#18786c', r: '5px', sh: '0 1px 3px rgba(0,0,0,.05)'
    }
  },

  /* ── Sol: mañana dorada + miel, ámbar y cielo cálido ── */
  sol: {
    label: 'Sol',
    vars: {
      bg: '#ece0c4', bg2: '#f6ecd6', bg3: '#e0d4b8', bg4: '#d6ccac',
      b1: '#c8bca0', b2: '#b0a484', b3: '#98906c',
      t1: '#282008', t2: '#5c4c2c', t3: '#887858',
      ok: '#907818', warn: '#a86818', bad: '#b03820',
      ac: '#98680c', r: '4px', sh: '0 1px 3px rgba(0,0,0,.06)'
    }
  }
};

/** Orden de temas en el selector */
const THEME_ORDER = ['oscuro', 'claro', 'medianoche', 'sepia', 'nord', 'monokai', 'pizarra', 'ocaso', 'arena', 'hacker', 'lavanda', 'tinta', 'bosque', 'cerezo', 'nube', 'melocoton', 'menta', 'sol'];

/**
 * Aplica un tema al documento.
 * @param {string} id — Clave del tema en THEMES
 */
function applyTheme(id) {
  const theme = THEMES[id];
  if (!theme) return;
  const root = document.documentElement.style;
  /* Reset optional vars to defaults before applying */
  root.setProperty('--r', '3px');
  root.setProperty('--sh', 'none');
  Object.entries(theme.vars).forEach(([k, v]) => {
    root.setProperty('--' + k, v);
  });
}
