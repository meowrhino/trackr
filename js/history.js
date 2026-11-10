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
      auto: !!(s.auto || s.safety),
      sizeKB: s.data ? Math.max(1, Math.round((s.data.length * 2) / 1024)) : 0 // UTF-16 ≈ 2 bytes/char
    }));
  },

  /** Minutos durante los que una red de seguridad nueva sustituye a la anterior. */
  SAFETY_MIN: 10,

  /**
   * Crea un snapshot del estado actual de D.d.
   * @param {Object} opts { auto } — la del día al arrancar; { safety } — red de seguridad que
   *   pone el sistema (fusión entre dispositivos, ops de la gestoría, entrar con la cuenta)
   * @returns {string|null} id del snapshot, o null si no se pudo
   */
  snapshot(opts = {}) {
    if (typeof LZString === 'undefined' || !D || !D.d) return null;
    const compressed = LZString.compressToUTF16(JSON.stringify(D.d));
    const entry = {
      id: 'sv_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      ts: new Date().toISOString(),
      auto: !!opts.auto,
      safety: !!opts.safety,
      data: compressed
    };
    const arr = this._read();
    /* Las redes de seguridad seguidas (dos pestañas abiertas, varias fusiones) llenaban las 10
       plazas en minutos con copias casi iguales: si la última también lo es y es reciente,
       se sustituye en vez de añadir otra. */
    if (entry.safety && arr[0] && arr[0].safety && Date.now() - new Date(arr[0].ts).getTime() < this.SAFETY_MIN * 60000) arr.shift();
    arr.unshift(entry);                       // el nuevo se pone el primero
    /* Sobran: se va primero la red de seguridad más vieja; la del día y las manuales, al final */
    while (arr.length > this.MAX) {
      let i = -1;
      for (let k = arr.length - 1; k > 0; k--) if (arr[k].safety) { i = k; break; }
      arr.splice(i > 0 ? i : arr.length - 1, 1);
    }
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
    const ts = (s.ts || '').slice(0, 16).replace(/[:T]/g, '-');
    downloadFile(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }), `trackr_${ts}.json`);
    return true;
  },

  /** Borra un snapshot del historial. */
  remove(id) {
    this._write(this._read().filter(x => x.id !== id));
  }
};
