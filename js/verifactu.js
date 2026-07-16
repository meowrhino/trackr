/* ================================================
 * TRACKR — VeriFactu (huella oficial AEAT + QR de cotejo)
 *
 * Implementa el registro de facturación del RD 1007/2023 + Orden HAC/1177/2024
 * con el algoritmo oficial de huella:
 *   "Detalle de las especificaciones técnicas para generación de la huella o
 *    hash de los registros de facturación" (AEAT, v0.1.2, 27/08/2024).
 *
 * Cadena de entrada: campo1=valor1&campo2=valor2&… (valores con trim, campo
 * vacío = "campo="), UTF-8 → SHA-256 → 64 hex MAYÚSCULAS. La cadena es por
 * emisor (obligado) e intercala registros de alta y de anulación.
 *
 * Este módulo solo firma y verifica en local; la remisión a AEAT vive en
 * trackr-api (Fase 3). Globales: V
 * Dependencias: crypto.subtle (nativo del navegador)
 * ================================================ */

const V = {

  /* Identificadores del fabricante — fijos para todos los usuarios del software.
     IdSistemaInformatico admite máx. 2 caracteres en el XSD de AEAT.
     Solo manu (mantenedor del repo) los modifica al hacer release; se fijan
     definitivamente el día de la firma de la declaración responsable. */
  SIF_ID: '1T',
  SOFTWARE_VERSION: '0.5.0',
  PUBLIC_URL: 'tr4ckr.com/verifactu',

  /* URL de cotejo AEAT (spec QR): 4 parámetros nif, numserie, fecha, importe */
  QR_URL_PROD: 'https://www2.agenciatributaria.gob.es/wlpl/TIKE-CONT/ValidarQR',
  QR_URL_TEST: 'https://prewww2.aeat.es/wlpl/TIKE-CONT/ValidarQR',

  /* Leyendas obligatorias del PDF (literales oficiales, no se traducen) */
  QR_LABEL: 'QR tributario:',
  LEGEND: 'Factura verificable en la sede electrónica de la AEAT',

  /* ── helpers de canonicalización (spec huella §3) ── */

  /** Valor de campo para la cadena de huella: trim, resto tal cual. */
  _tv(v) { return v === undefined || v === null ? '' : String(v).trim(); },

  /** Importes: 2 decimales con punto (123.1 y 123.10 son equivalentes para AEAT). */
  _money(n) { return Number(n || 0).toFixed(2); },

  /** YYYY-MM-DD → DD-MM-YYYY (formato FechaExpedicionFactura de AEAT). */
  fechaAEAT(fechaISO) {
    const [y, m, d] = String(fechaISO || '').split('-');
    return (y && m && d) ? `${d}-${m}-${y}` : '';
  },

  /** Fecha-hora local con huso, formato FechaHoraHusoGenRegistro: 2026-07-16T12:34:56+02:00 */
  nowHuso(date) {
    const d = date || new Date();
    const p = n => String(n).padStart(2, '0');
    const off = -d.getTimezoneOffset(); /* min; CET invierno +60, verano +120 */
    const sign = off >= 0 ? '+' : '-';
    const abs = Math.abs(off);
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
      + `T${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`
      + `${sign}${p(Math.floor(abs / 60))}:${p(abs % 60)}`;
  },

  /** SHA-256 → hex de 64 caracteres en MAYÚSCULAS (formato de salida oficial). */
  async _sha256Hex(str) {
    const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str));
    return Array.from(new Uint8Array(digest))
      .map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();
  },

  /* ── huellas oficiales ── */

  /**
   * Cadena de entrada del registro de ALTA (orden oficial de campos).
   * @param {Object} r { emisorNif, numSerie, fecha (YYYY-MM-DD), tipoFactura,
   *                     cuotaTotal, importeTotal, huellaPrev, fechaHoraHuso }
   */
  _cadenaAlta(r) {
    return 'IDEmisorFactura=' + this._tv(r.emisorNif)
      + '&NumSerieFactura=' + this._tv(r.numSerie)
      + '&FechaExpedicionFactura=' + this.fechaAEAT(r.fecha)
      + '&TipoFactura=' + this._tv(r.tipoFactura)
      + '&CuotaTotal=' + this._money(r.cuotaTotal)
      + '&ImporteTotal=' + this._money(r.importeTotal)
      + '&Huella=' + this._tv(r.huellaPrev)
      + '&FechaHoraHusoGenRegistro=' + this._tv(r.fechaHoraHuso);
  },

  /** Cadena de entrada del registro de ANULACIÓN (orden oficial de campos). */
  _cadenaAnulacion(r) {
    return 'IDEmisorFacturaAnulada=' + this._tv(r.emisorNif)
      + '&NumSerieFacturaAnulada=' + this._tv(r.numSerie)
      + '&FechaExpedicionFacturaAnulada=' + this.fechaAEAT(r.fecha)
      + '&Huella=' + this._tv(r.huellaPrev)
      + '&FechaHoraHusoGenRegistro=' + this._tv(r.fechaHoraHuso);
  },

  /** Huella oficial de un registro de alta. @returns {Promise<string>} hex64 mayúsculas */
  huellaAlta(r) { return this._sha256Hex(this._cadenaAlta(r)); },

  /** Huella oficial de un registro de anulación. @returns {Promise<string>} hex64 mayúsculas */
  huellaAnulacion(r) { return this._sha256Hex(this._cadenaAnulacion(r)); },

  /* ── QR de cotejo ── */

  /**
   * URL del QR según la spec AEAT: nif, numserie, fecha (DD-MM-YYYY), importe.
   * OJO: importe = ImporteTotal del registro (base + cuota IVA, sin restar IRPF).
   * @param {boolean} test endpoint de pruebas (prewww2.aeat.es)
   */
  buildQRPayload(nif, numSerie, fechaISO, importe, test = false) {
    const base = test ? this.QR_URL_TEST : this.QR_URL_PROD;
    return base
      + '?nif=' + encodeURIComponent(this._tv(nif))
      + '&numserie=' + encodeURIComponent(this._tv(numSerie))
      + '&fecha=' + encodeURIComponent(this.fechaAEAT(fechaISO))
      + '&importe=' + encodeURIComponent(this._money(importe));
  },

  /* ── verificación de cadena ── */

  /**
   * Verifica la integridad de la cadena de registros de un emisor (altas y
   * anulaciones intercaladas, ordenadas por timestamp ASC). Re-calcula cada
   * huella con los datos persistidos y comprueba el encadenamiento.
   * @param {Array} registros entradas de D.d.facturas[] de un mismo emisor
   * @returns {Promise<{ok, total, broken: [{id, numero, motivo}]}>}
   */
  async verifyChain(registros) {
    const broken = [];
    let prevHuella = '';
    for (const f of registros) {
      const r = {
        emisorNif: f.emisorNif,
        numSerie: f.numero,
        fecha: f.fecha,
        tipoFactura: f.tipoFactura,
        cuotaTotal: f.cuotaTotal,
        importeTotal: f.importeTotal,
        huellaPrev: f.hashPrev || '',
        fechaHoraHuso: f.timestamp
      };
      const esperado = f.tipoRegistro === 'anulacion'
        ? await this.huellaAnulacion(r)
        : await this.huellaAlta(r);
      if (esperado !== f.hash) {
        broken.push({ id: f.id, numero: f.numero, motivo: 'hash', expected: esperado, found: f.hash });
      } else if ((f.hashPrev || '') !== prevHuella) {
        broken.push({ id: f.id, numero: f.numero, motivo: 'encadenamiento', expected: prevHuella, found: f.hashPrev || '' });
      }
      prevHuella = f.hash;
    }
    return { ok: broken.length === 0, broken, total: registros.length };
  },

  /* ── self-test con los vectores oficiales del documento AEAT v0.1.2 §6 ── */

  async selfTest() {
    const casos = [
      { /* Caso 1: primer registro de alta */
        fn: 'huellaAlta',
        r: { emisorNif: '89890001K', numSerie: '12345678/G33', fecha: '2024-01-01',
             tipoFactura: 'F1', cuotaTotal: 12.35, importeTotal: 123.45,
             huellaPrev: '', fechaHoraHuso: '2024-01-01T19:20:30+01:00' },
        esperado: '3C464DAF61ACB827C65FDA19F352A4E3BDC2C640E9E9FC4CC058073F38F12F60'
      },
      { /* Caso 2: alta encadenada al anterior */
        fn: 'huellaAlta',
        r: { emisorNif: '89890001K', numSerie: '12345679/G34', fecha: '2024-01-01',
             tipoFactura: 'F1', cuotaTotal: 12.35, importeTotal: 123.45,
             huellaPrev: '3C464DAF61ACB827C65FDA19F352A4E3BDC2C640E9E9FC4CC058073F38F12F60',
             fechaHoraHuso: '2024-01-01T19:20:35+01:00' },
        esperado: 'F7B94CFD8924EDFF273501B01EE5153E4CE8F259766F88CF6ACB8935802A2B97'
      },
      { /* Caso 3: anulación encadenada */
        fn: 'huellaAnulacion',
        r: { emisorNif: '89890001K', numSerie: '12345679/G34', fecha: '2024-01-01',
             huellaPrev: 'F7B94CFD8924EDFF273501B01EE5153E4CE8F259766F88CF6ACB8935802A2B97',
             fechaHoraHuso: '2024-01-01T19:20:40+01:00' },
        esperado: '177547C0D57AC74748561D054A9CEC14B4C4EA23D1BEFD6F2E69E3A388F90C68'
      }
    ];
    for (const c of casos) {
      const got = await this[c.fn](c.r);
      if (got !== c.esperado) return { ok: false, caso: c, got };
    }
    return { ok: true, casos: casos.length };
  }
};
