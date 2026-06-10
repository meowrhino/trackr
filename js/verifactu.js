/* ================================================
 * TRACKR — Verifactu (firma SIF y QR AEAT)
 *
 * Implementa los requisitos del Sistema Informático de Facturación
 * "no verificable" según RD 1007/2023 + Orden HAC/1177/2024:
 *   - SHA-256 encadenado por emisor (integridad + trazabilidad).
 *   - Payload URL del QR conforme al endpoint de cotejo de AEAT.
 *   - Verificación de cadena (auditoría).
 *
 * No envía facturas a la AEAT — es modo "no verificable" (offline).
 * Globales: V
 * Dependencias: crypto.subtle (nativo del navegador)
 * ================================================ */

const V = {

  /* Identificadores del fabricante — fijos para todos los usuarios del software.
     Solo manu (mantenedor del repo) los modifica al hacer release. Los usuarios
     beta NUNCA deben poder cambiarlos desde la UI. */
  SIF_ID: 'MR1',
  SOFTWARE_VERSION: '0.4.0',

  /* URL base de cotejo AEAT */
  QR_URL_PROD: 'https://www2.agenciatributaria.gob.es/wlpl/TIKE-CONT/ValidarQR',
  QR_URL_TEST: 'https://prewww2.aeat.es/wlpl/TIKE-CONT/ValidarQR',

  /**
   * Construye la URL del QR según la spec AEAT.
   * Formato: <BASE>?nif=<NIF>&numserie=<NUMSERIE>&fecha=<DD-MM-AAAA>&importe=<X.YY>
   * - nif: 9 caracteres, sin espacios ni guiones
   * - numserie: hasta 60 caracteres, URL-encoded UTF-8
   * - fecha: DD-MM-AAAA con guiones
   * - importe: separador decimal punto, hasta 12 enteros + 2 decimales
   *
   * @param {string} nif Emisor (sin espacios)
   * @param {string} numSerie Número/serie de la factura (puede llevar caracteres especiales)
   * @param {string} fechaISO Fecha en formato YYYY-MM-DD
   * @param {number} importe Total de la factura (€, hasta 2 decimales)
   * @param {boolean} test Si true, usa el endpoint de pruebas
   * @returns {string} URL completa para el QR
   */
  buildQRPayload(nif, numSerie, fechaISO, importe, test = false) {
    const base = test ? this.QR_URL_TEST : this.QR_URL_PROD;
    const [y, m, d] = (fechaISO || '').split('-');
    const fechaQR = (y && m && d) ? `${d}-${m}-${y}` : '';
    const params = new URLSearchParams();
    params.set('nif', (nif || '').replace(/[\s-]/g, '').toUpperCase());
    params.set('numserie', String(numSerie || ''));
    params.set('fecha', fechaQR);
    params.set('importe', Number(importe || 0).toFixed(2));
    return `${base}?${params.toString()}`;
  },

  /**
   * Calcula el SHA-256 de una factura encadenado al hash anterior del mismo emisor.
   * Canonicalización (sin ambigüedad, pipe-separated, fields en orden fijo):
   *   nifEmisor | numSerie | fechaISO | baseImponible | totalFactura | hashPrev
   *
   * Importes con 2 decimales fijos, punto como separador, sin separador de miles.
   * hashPrev: string base64 del hash anterior, o cadena vacía si es la primera.
   *
   * @param {Object} data { nifEmisor, numSerie, fechaISO, baseImponible, totalFactura }
   * @param {string|null} hashPrev Hash de la factura anterior del mismo emisor (base64)
   * @returns {Promise<string>} Hash SHA-256 en base64
   */
  async signInvoice(data, hashPrev) {
    const money = n => Number(n || 0).toFixed(2);
    const canonical = [
      String(data.nifEmisor || '').replace(/[\s-]/g, '').toUpperCase(),
      String(data.numSerie || ''),
      String(data.fechaISO || ''),
      money(data.baseImponible),
      money(data.totalFactura),
      hashPrev || ''
    ].join('|');
    const bytes = new TextEncoder().encode(canonical);
    const digest = await crypto.subtle.digest('SHA-256', bytes);
    return this._toBase64(digest);
  },

  /**
   * Verifica que la cadena de facturas de un emisor sea íntegra.
   * Re-calcula cada hash y comprueba el encadenamiento.
   *
   * @param {Array} facturas Array de facturas del emisor (ordenadas por timestamp ASC)
   * @returns {Promise<{ok: boolean, broken: Array<{id, expected, found}>}>}
   */
  async verifyChain(facturas) {
    const broken = [];
    let prevHash = null;
    for (const f of facturas) {
      const expected = await this.signInvoice({
        nifEmisor: f.emisorNif,
        numSerie: f.numero,
        fechaISO: f.fecha,
        baseImponible: f.baseImponible,
        totalFactura: f.totalFactura
      }, prevHash);
      if (expected !== f.hash) {
        broken.push({ id: f.id, numero: f.numero, expected, found: f.hash });
      }
      prevHash = f.hash;
    }
    return { ok: broken.length === 0, broken, total: facturas.length };
  },

  /**
   * Convierte un ArrayBuffer a base64 (compatible navegador).
   * @private
   */
  _toBase64(buf) {
    const bytes = new Uint8Array(buf);
    let bin = '';
    for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
    return btoa(bin);
  }
};
