/* ================================================
 * TRACKR — Temas
 * Definiciones de temas y aplicación dinámica.
 * Cada tema define las variables CSS del :root.
 * Globales: THEMES, applyTheme
 * Dependencias: ninguna
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

  /* ── Oscuro: gris neutro, acento azul acero ── */
  oscuro: {
    label: 'Oscuro',
    vars: {
      bg: '#111', bg2: '#191919', bg3: '#222', bg4: '#2a2a2a',
      b1: '#262626', b2: '#333', b3: '#444',
      t1: '#ccc', t2: '#888', t3: '#555',
      ok: '#5a9', warn: '#c93', bad: '#c55',
      ac: '#4a7fb5', r: '3px', sh: 'none'
    }
  },

  /* ── Claro: crema cálido, acento azul profundo ── */
  claro: {
    label: 'Claro',
    vars: {
      bg: '#eae8df', bg2: '#f2f0e8', bg3: '#e0ded4', bg4: '#d6d4ca',
      b1: '#cccabe', b2: '#bbb8aa', b3: '#a8a496',
      t1: '#222', t2: '#5a5848', t3: '#8a877a',
      ok: '#2a8a5a', warn: '#c07a20', bad: '#c04040',
      ac: '#2a6ab0', r: '4px', sh: '0 1px 3px rgba(0,0,0,.06)'
    }
  },

  /* ── Medianoche: azul marino profundo, acento índigo vivo ── */
  medianoche: {
    label: 'Medianoche',
    vars: {
      bg: '#0a0e1a', bg2: '#111827', bg3: '#1a2236', bg4: '#222d45',
      b1: '#1e2a44', b2: '#2a3a5c', b3: '#3a4a6c',
      t1: '#c8d0e0', t2: '#7a8aa8', t3: '#4a5a78',
      ok: '#4ade80', warn: '#fbbf24', bad: '#f87171',
      ac: '#4a6fd0', r: '3px', sh: 'none'
    }
  },

  /* ── Sepia: marrón cálido vintage, acento bronce ── */
  sepia: {
    label: 'Sepia',
    vars: {
      bg: '#1a1610', bg2: '#221e16', bg3: '#2c2720', bg4: '#36302a',
      b1: '#3a3228', b2: '#4a4238', b3: '#5a5248',
      t1: '#d8c8aa', t2: '#9a8e76', t3: '#6a5e46',
      ok: '#c4a050', warn: '#d4843a', bad: '#c06050',
      ac: '#9a7040', r: '3px', sh: 'none'
    }
  },

  /* ── Nord: paleta nórdica fría, acento frost azul ── */
  nord: {
    label: 'Nord',
    vars: {
      bg: '#2e3440', bg2: '#3b4252', bg3: '#434c5e', bg4: '#4c566a',
      b1: '#434c5e', b2: '#4c566a', b3: '#5a6580',
      t1: '#d8dee9', t2: '#81a1c1', t3: '#5e81ac',
      ok: '#a3be8c', warn: '#ebcb8b', bad: '#d06a74',
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

  /* ── Pizarra: gris azulado medio, tono pizarra ── */
  pizarra: {
    label: 'Pizarra',
    vars: {
      bg: '#48505e', bg2: '#525a6a', bg3: '#404852', bg4: '#383e4a',
      b1: '#3c4250', b2: '#5a6272', b3: '#6a7282',
      t1: '#d8dce6', t2: '#96a0b2', t3: '#727c8e',
      ok: '#78c09a', warn: '#e0b060', bad: '#f08080',
      ac: '#6080b0', r: '3px', sh: 'none'
    }
  },

  /* ── Ocaso: marrón cálido medio, hora dorada ── */
  ocaso: {
    label: 'Ocaso',
    vars: {
      bg: '#584840', bg2: '#62524a', bg3: '#4e4038', bg4: '#443830',
      b1: '#4a3e36', b2: '#6a5e52', b3: '#7a6e62',
      t1: '#e4d8cc', t2: '#b0a090', t3: '#8a7e6e',
      ok: '#d0b070', warn: '#e89858', bad: '#f08068',
      ac: '#b07840', r: '4px', sh: 'none'
    }
  },

  /* ── Arena: cálido tierra/arena, acento terracota ── */
  arena: {
    label: 'Arena',
    vars: {
      bg: '#e8e0d2', bg2: '#f0eade', bg3: '#ddd6c6', bg4: '#d2cabc',
      b1: '#c8bfae', b2: '#b8ae9a', b3: '#a09684',
      t1: '#2c2418', t2: '#6a5e4a', t3: '#9a8e76',
      ok: '#548a4a', warn: '#b88430', bad: '#b84a3a',
      ac: '#8a5a30', r: '4px', sh: '0 1px 3px rgba(0,0,0,.06)'
    }
  },

  /* ── Hacker: terminal verde CRT, acento verde terminal ── */
  hacker: {
    label: 'Hacker',
    vars: {
      bg: '#050a05', bg2: '#0a120a', bg3: '#101a10', bg4: '#182018',
      b1: '#142014', b2: '#1e2e1e', b3: '#2a3c2a',
      t1: '#33cc33', t2: '#1a8a1a', t3: '#115511',
      ok: '#33cc33', warn: '#cccc33', bad: '#cc3333',
      ac: '#1a7a1a', r: '1px', sh: 'none'
    }
  },

  /* ── Lavanda: dark suave púrpura, acento violeta medio ── */
  lavanda: {
    label: 'Lavanda',
    vars: {
      bg: '#141018', bg2: '#1a1520', bg3: '#221c2a', bg4: '#2a2434',
      b1: '#261e30', b2: '#362e42', b3: '#463e52',
      t1: '#d0c8dc', t2: '#8a7ea0', t3: '#5a4e70',
      ok: '#a088d0', warn: '#d4a84c', bad: '#c85a6a',
      ac: '#7a50b0', r: '5px', sh: 'none'
    }
  },

  /* ── Tinta: alto contraste puro, acento blanco sobre negro ── */
  tinta: {
    label: 'Tinta',
    vars: {
      bg: '#000000', bg2: '#0a0a0a', bg3: '#151515', bg4: '#1e1e1e',
      b1: '#222222', b2: '#333333', b3: '#4a4a4a',
      t1: '#ffffff', t2: '#aaaaaa', t3: '#666666',
      ok: '#00dd66', warn: '#ffbb00', bad: '#ff3344',
      ac: '#444444', r: '2px', sh: 'none'
    }
  },

  /* ── Bosque: verdes oscuros orgánicos, acento verde musgo ── */
  bosque: {
    label: 'Bosque',
    vars: {
      bg: '#0e1610', bg2: '#141e16', bg3: '#1a2620', bg4: '#222e28',
      b1: '#1e2a22', b2: '#2a3a2e', b3: '#3a4a3e',
      t1: '#c0d0c4', t2: '#7a907e', t3: '#4a6050',
      ok: '#6acc6a', warn: '#d4b44c', bad: '#cc5a4a',
      ac: '#3a7a50', r: '4px', sh: 'none'
    }
  },

  /* ── Cerezo: dark cálido rosado, acento rosa madera ── */
  cerezo: {
    label: 'Cerezo',
    vars: {
      bg: '#160e0e', bg2: '#1e1414', bg3: '#281c1c', bg4: '#322424',
      b1: '#2c2020', b2: '#3e2e2e', b3: '#503e3e',
      t1: '#d8c4c0', t2: '#9a7e78', t3: '#6a504a',
      ok: '#d4967a', warn: '#d4a050', bad: '#cc5050',
      ac: '#a04050', r: '3px', sh: 'none'
    }
  },

  /* ── Nube: azulado frío tintado, acento azul cielo ── */
  nube: {
    label: 'Nube',
    vars: {
      bg: '#e0e6f0', bg2: '#e9eef6', bg3: '#d6dce8', bg4: '#ccd4e0',
      b1: '#c0c8d6', b2: '#aeb8c8', b3: '#96a2b6',
      t1: '#1a2030', t2: '#4a5568', t3: '#7a8698',
      ok: '#4a80b8', warn: '#c07a20', bad: '#c04848',
      ac: '#3a6fa0', r: '5px', sh: '0 1px 3px rgba(0,0,0,.05)'
    }
  },

  /* ── Melocotón: rosado cálido tintado, acento coral ── */
  melocoton: {
    label: 'Melocotón',
    vars: {
      bg: '#ecdcd8', bg2: '#f4e8e4', bg3: '#e4d4ce', bg4: '#dacac4',
      b1: '#d0c0b8', b2: '#c0aea6', b3: '#a89892',
      t1: '#2a1e1a', t2: '#6a5450', t3: '#9a8a84',
      ok: '#c07a60', warn: '#c08030', bad: '#c04040',
      ac: '#b05540', r: '6px', sh: '0 1px 3px rgba(0,0,0,.06)'
    }
  },

  /* ── Menta: verdoso fresco tintado, acento verde menta ── */
  menta: {
    label: 'Menta',
    vars: {
      bg: '#dce8de', bg2: '#e6f0e8', bg3: '#d2ded4', bg4: '#c8d6ca',
      b1: '#bccebe', b2: '#a8bead', b3: '#90aa96',
      t1: '#1a2a1e', t2: '#4a5e50', t3: '#7a9080',
      ok: '#2a8a4a', warn: '#b08030', bad: '#b84040',
      ac: '#2e7a56', r: '5px', sh: '0 1px 3px rgba(0,0,0,.05)'
    }
  },

  /* ── Sol: amarillento cálido tintado, acento mostaza ── */
  sol: {
    label: 'Sol',
    vars: {
      bg: '#e6e2d0', bg2: '#f0ece0', bg3: '#dcd8c6', bg4: '#d2ccba',
      b1: '#c8c2ae', b2: '#b8b09a', b3: '#a09882',
      t1: '#2a2410', t2: '#6a5e3a', t3: '#9a9070',
      ok: '#a08020', warn: '#c07020', bad: '#b84030',
      ac: '#8a6a20', r: '4px', sh: '0 1px 3px rgba(0,0,0,.06)'
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
