/* ================================================
 * TRACKR — Temas
 * Definiciones de temas y aplicación dinámica.
 * Cada tema define las variables CSS del :root.
 * Globales: THEMES, applyTheme
 * Dependencias: ninguna
 * ================================================ */

/**
 * Catálogo de temas disponibles.
 * Cada tema tiene: label (nombre visible), vars (CSS custom properties).
 * Las claves de vars mapean directamente a --key en :root.
 */
const THEMES = {

  oscuro: {
    label: 'Oscuro',
    vars: {
      bg: '#111', bg2: '#191919', bg3: '#222', bg4: '#2a2a2a',
      b1: '#262626', b2: '#333', b3: '#444',
      t1: '#ccc', t2: '#888', t3: '#555',
      ok: '#5a9', warn: '#c93', bad: '#c55'
    }
  },

  claro: {
    label: 'Claro',
    vars: {
      bg: '#f5f5f0', bg2: '#ffffff', bg3: '#eeeee8', bg4: '#e4e4dc',
      b1: '#ddddd5', b2: '#ccccc4', b3: '#bbbbaa',
      t1: '#222', t2: '#666', t3: '#999',
      ok: '#2a8a5a', warn: '#c07a20', bad: '#c04040'
    }
  },

  medianoche: {
    label: 'Medianoche',
    vars: {
      bg: '#0a0e1a', bg2: '#111827', bg3: '#1a2236', bg4: '#222d45',
      b1: '#1e2a44', b2: '#2a3a5c', b3: '#3a4a6c',
      t1: '#c8d0e0', t2: '#7a8aa8', t3: '#4a5a78',
      ok: '#4ade80', warn: '#fbbf24', bad: '#f87171'
    }
  },

  sepia: {
    label: 'Sepia',
    vars: {
      bg: '#1a1610', bg2: '#221e16', bg3: '#2c2720', bg4: '#36302a',
      b1: '#3a3228', b2: '#4a4238', b3: '#5a5248',
      t1: '#d4c8b0', t2: '#9a8e76', t3: '#6a5e46',
      ok: '#7aaa5a', warn: '#cca040', bad: '#c06050'
    }
  },

  nord: {
    label: 'Nord',
    vars: {
      bg: '#2e3440', bg2: '#3b4252', bg3: '#434c5e', bg4: '#4c566a',
      b1: '#434c5e', b2: '#4c566a', b3: '#5a6580',
      t1: '#d8dee9', t2: '#81a1c1', t3: '#5e81ac',
      ok: '#a3be8c', warn: '#ebcb8b', bad: '#bf616a'
    }
  },

  monokai: {
    label: 'Monokai',
    vars: {
      bg: '#272822', bg2: '#2e2f28', bg3: '#383930', bg4: '#424338',
      b1: '#3e3f38', b2: '#4e4f48', b3: '#5e5f58',
      t1: '#f8f8f2', t2: '#a6a68a', t3: '#75715e',
      ok: '#a6e22e', warn: '#e6db74', bad: '#f92672'
    }
  }
};

/** Orden de temas en el selector */
const THEME_ORDER = ['oscuro', 'claro', 'medianoche', 'sepia', 'nord', 'monokai'];

/**
 * Aplica un tema al documento.
 * @param {string} id — Clave del tema en THEMES
 */
function applyTheme(id) {
  const theme = THEMES[id];
  if (!theme) return;
  const root = document.documentElement.style;
  Object.entries(theme.vars).forEach(([k, v]) => {
    root.setProperty('--' + k, v);
  });
}
