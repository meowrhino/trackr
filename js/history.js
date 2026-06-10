/* ================================================
 * TRACKR — Historial de versiones (saves locales)
 *
 * Ring buffer de hasta 10 snapshots del JSON completo,
 * comprimidos con LZString, en localStorage (clave aparte
 * `trackr_history`). NO toca `trackr_data`. 100% local, sin
 * servidor. Es el "save file" de toda la vida: si la lías,
 * restauras un estado anterior.
 *
 * Globales: H
 * Dependencias: LZString (CDN), D (store.js)
 * ================================================ */

const H = {
  KEY: 'trackr_history',
  MAX: 10,

  /** Lee el array de snapshots (metadatos + blob comprimido). */
  _read() {
    try {
      const raw = localStorage.getItem(this.KEY);
      return raw ? JSON.parse(raw) : [];
    } catch { return []; }
  },

  /** Persiste el array. Devuelve true/false según éxito. */
  _write(arr) {
    try {
      localStorage.setItem(this.KEY, JSON.stringify(arr));
      return true;
    } catch (e) {
      console.error('H._write failed:', e);
      if (typeof Toast !== 'undefined') {
        Toast.error('No se pudo guardar la copia (almacenamiento lleno)');
      }
      return false;
    }
  },

  /** Metadatos de los snapshots (sin descomprimir), más reciente primero. */
  list() {
    return this._read().map(s => ({
      id: s.id,
      ts: s.ts,
      auto: !!s.auto,
      sizeKB: s.data ? Math.max(1, Math.round((s.data.length * 2) / 1024)) : 0 // UTF-16 ≈ 2 bytes/char
    }));
  },

  /**
   * Crea un snapshot del estado actual de D.d.
   * @param {Object} opts { auto } — marca si es automático
   * @returns {string|null} id del snapshot, o null si no se pudo
   */
  snapshot(opts = {}) {
    if (typeof LZString === 'undefined' || !D || !D.d) return null;
    const compressed = LZString.compressToUTF16(JSON.stringify(D.d));
    const entry = {
      id: 'sv_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      ts: new Date().toISOString(),
      auto: !!opts.auto,
      data: compressed
    };
    const arr = this._read();
    arr.unshift(entry);                       // el nuevo se pone el primero
    while (arr.length > this.MAX) arr.pop();   // el más viejo se descarta para siempre
    return this._write(arr) ? entry.id : null;
  },

  /**
   * Snapshot automático: como mucho uno por día (el primero del día).
   * No guarda si no hay datos reales todavía. Se llama al arrancar la app.
   */
  maybeAutoSnapshot() {
    if (!D || !D.d) return;
    const empty = !(D.d.projects || []).length
      && !(D.d.gastos || []).length
      && !(D.d.clientes || []).length;
    if (empty) return;
    /* Día LOCAL (coherente con la fecha/hora local que se muestra), no UTC */
    const dayOf = iso => {
      const n = iso ? new Date(iso) : new Date();
      return localDateStr(n);
    };
    const today = dayOf();
    const arr = this._read();
    if (!arr.some(s => dayOf(s.ts) === today)) {
      this.snapshot({ auto: true });
    }
  },

  /** Descomprime y parsea el contenido de un snapshot. @returns {Object|null} */
  _data(id) {
    const s = this._read().find(x => x.id === id);
    if (!s || !s.data || typeof LZString === 'undefined') return null;
    try { return JSON.parse(LZString.decompressFromUTF16(s.data)); }
    catch { return null; }
  },

  /** Restaura un snapshot en D (reemplaza los datos actuales). @returns {boolean} */
  restore(id) {
    const data = this._data(id);
    if (!data) return false;
    D.load(data);
    return true;
  },

  /** Descarga un snapshot como archivo JSON (el navegador deja renombrarlo). */
  download(id) {
    const data = this._data(id);
    if (!data) return false;
    const s = this._read().find(x => x.id === id);
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const ts = (s.ts || '').slice(0, 16).replace(/[:T]/g, '-');
    a.href = url;
    a.download = `trackr_${ts}.json`;
    a.click();
    URL.revokeObjectURL(url);
    return true;
  },

  /** Borra un snapshot del historial. */
  remove(id) {
    this._write(this._read().filter(x => x.id !== id));
  }
};
