/* ================================================
 * TRACKR — Libros registro AEAT (llevanza conjunta IVA+IRPF, tipo "T")
 *
 * Genera el XLSX del formato oficial (V.18.02.2026) con las pestañas
 * EXPEDIDAS_INGRESOS y RECIBIDAS_GASTOS: cabeceras EXACTAS de la plantilla
 * oficial (PLANTILLA_LIBROS_UNIFICADOS.xlsx, 3 filas; datos desde la fila 4)
 * y códigos del catálogo CODIGO-LITERAL. Un solo fichero sirve para importar
 * en Renta Web (D1), Pre303 y modelo 130. Referencia: TODO/23.
 *
 * Los libros cubren SIEMPRE del 1 de enero al fin del trimestre elegido
 * (la AEAT exige presentarlos sin fraccionar por trimestre).
 *
 * El XLSX se construye a mano (ZIP con entradas sin comprimir + XML con
 * inline strings): cero dependencias, y muy por debajo del tope de 4 MB.
 * Globales: LR · Dependencias: D, currentLocale (solo formato), TextEncoder
 * ================================================ */

const LR = {

  /* ── catálogo (CODIGO-LITERAL de la plantilla oficial) ── */

  /** Concepto de gasto por categoría de gasto TRACKR */
  GASTO_G: {
    cotizacion: 'G45', suministros: 'GY4', gestoria: 'G19', seguros: 'G20',
    amortizacion: 'GY8', oficina: 'G22', herramientas: 'G22', software: 'G22',
    marketing: 'G22', formacion: 'G22', transporte: 'G22', otro: 'G37',
  },
  /** Concepto de gasto por categoría de deducible TRACKR */
  DED_G: {
    autonomos: 'G45', alquiler: 'G12', suministros: 'GY4', asesoria: 'G19',
    seguros: 'G20', amortizacion: 'GY8', material: 'G03', software: 'G22',
    formacion: 'G22', transporte: 'G22', otro: 'G37',
  },

  /* Cabeceras oficiales, tal cual (incluidas las erratas "Refrencia"/"RefErencia":
     se copian byte a byte para ser indistinguibles de la plantilla). */
  _HDR_EXP: [
    { A: 'Autoliquidación', C: 'Actividad', F: 'Tipo de Factura', G: 'Concepto de\nIngreso', H: 'Ingreso Computable', I: 'Fecha\nExpedición', J: 'Fecha\nOperación', K: 'Identificación de la Factura', N: 'NIF Destinatario', Q: 'Nombre\nDestinatario', R: 'Clave de Operación', S: 'Calificación de la Operación', T: 'Operación\nExenta', U: 'Total\nFactura', V: 'Base\nImponible', W: 'Tipo\nde IVA', X: 'Cuota IVA\nRepercutida', Y: 'Tipo de\nRecargo Eq.', Z: 'Cuota Recargo Eq.', AA: 'Cobro (Operación Criterio de Caja de IVA y/o artículo 7.2.1º de Reglamento del IRPF)', AE: 'Tipo Retención\ndel IRPF', AF: 'Importe Retenido\ndel IRPF', AG: 'Registro Acuerdo Facturación', AH: 'Inmueble', AJ: 'Refrencia Externa' },
    { A: 'Ejercicio', B: 'Periodo', C: 'Código', D: 'Tipo', E: 'Grupo o Epígrafe del IAE', K: 'Serie', L: 'Número', M: 'Número-Final', N: 'Tipo', O: 'Código País', P: 'Identificación', AA: 'Fecha', AB: 'Importe', AC: 'Medio Utilizado', AD: 'Identificación Medio Utilizado', AH: 'Situación', AI: 'Referencia Catastral' },
    { A: 'Decimal (4,0)', B: 'Alfanumérico (2)', C: 'Alfanumérico (1)', D: 'Alfanumérico (2)', E: 'Alfanumérico (4)', F: 'Alfanumérico (2)', G: 'Alfanumérico (3)', H: 'Decimal(12,2)', I: 'Fecha(dd/mm/yyyy)', J: 'Fecha(dd/mm/yyyy)', K: 'Alfanumérico (20)', L: 'Alfanumérico (20)', M: 'Alfanumérico (20)', N: 'Alfanumérico (2)', O: 'Alfanumérico (2)', P: 'Alfanumérico (20)', Q: 'Alfanumérico (40)', R: 'Alfanumérico (2)', S: 'Alfanumérico (2)', T: 'Alfanumérico (2)', U: 'Decimal(12,2)', V: 'Decimal(12,2)', W: 'Decimal(4,2)', X: 'Decimal(12,2)', Y: 'Decimal(4,2)', Z: 'Decimal(12,2)', AA: 'Fecha(dd/mm/yyyy)', AB: 'Decimal(12,2)', AC: 'Alfanumérico (2)', AD: 'Alfanumérico (34)', AE: 'Decimal(4,2)', AF: 'Decimal(12,2)', AG: 'Alfanumérico (15)', AH: 'Alfanumérico (1)', AI: 'Alfanumérico (20)', AJ: 'Alfanumérico (40)' },
  ],
  _HDR_REC: [
    { A: 'Autoliquidación', C: 'Actividad', F: 'Tipo de Factura', G: 'Concepto de\nGasto', H: 'Gasto Deducible', I: 'Fecha\nExpedición', J: 'Fecha\nOperación', K: 'Identificación Factura del Expedidor', M: 'Fecha\nRecepción', N: 'Número\nRecepción', O: 'Número\nRecepción Final', P: 'NIF Expedidor', S: 'Nombre\nExpedidor', T: 'Clave de\nOperación', U: 'Bien de Inversión', V: 'Inversión del Sujeto Pasivo', W: 'Deducible en Periodo Posterior', X: 'Periodo Deducción', Z: 'Total\nFactura', AA: 'Base\nImponible', AB: 'Tipo\nde IVA', AC: 'Cuota IVA\nSoportado', AD: 'Cuota Deducible', AE: 'Tipo de\nRecargo Eq.', AF: 'Cuota\nRecargo Eq.', AG: 'Pago (Operación Criterio de Caja de IVA y/o artículo 7.2.1º de Reglamento del IRPF)', AK: 'Tipo Retención\ndel IRPF', AL: 'Importe Retenido\ndel IRPF', AM: 'Registro Acuerdo Facturación', AN: 'Inmueble', AP: 'RefErencia Externa' },
    { A: 'Ejercicio', B: 'Periodo', C: 'Código', D: 'Tipo', E: 'Grupo o Epígrafe del IAE', K: '(Serie-Número)', L: 'Número-Final', P: 'Tipo', Q: 'Código País', R: 'Identificación', X: 'Ejercicio', Y: 'Periodo', AG: 'Fecha', AH: 'Importe', AI: 'Medio Utilizado', AJ: 'Identificación Medio Utilizado', AN: 'Situación', AO: 'Referencia Catastral' },
    { A: 'Decimal (4,0)', B: 'Alfanumérico (2)', C: 'Alfanumérico (1)', D: 'Alfanumérico (2)', E: 'Alfanumérico (4)', F: 'Alfanumérico (2)', G: 'Alfanumérico (3)', H: 'Decimal(12,2)', I: 'Fecha(dd/mm/yyyy)', J: 'Fecha(dd/mm/yyyy)', K: 'Alfanumérico (40)', L: 'Alfanumérico (20)', M: 'Fecha(dd/mm/yyyy)', N: 'Alfanumérico (20)', O: 'Alfanumérico (20)', P: 'Alfanumérico (2)', Q: 'Alfanumérico (2)', R: 'Alfanumérico (20)', S: 'Alfanumérico (40)', T: 'Alfanumérico (2)', U: 'Alfanumérico (1)', V: 'Alfanumérico (1)', W: 'Alfanumérico (1)', X: 'Decimal (4,0)', Y: 'Alfanumérico (2)', Z: 'Decimal(12,2)', AA: 'Decimal(12,2)', AB: 'Decimal(4,2)', AC: 'Decimal(12,2)', AD: 'Decimal(12,2)', AE: 'Decimal(4,2)', AF: 'Decimal(12,2)', AG: 'Fecha(dd/mm/yyyy)', AH: 'Decimal(12,2)', AI: 'Alfanumérico (2)', AJ: 'Alfanumérico (34)', AK: 'Decimal(4,2)', AL: 'Decimal(12,2)', AM: 'Alfanumérico (15)', AN: 'Alfanumérico (1)', AO: 'Alfanumérico (20)', AP: 'Alfanumérico (40)' },
  ],

  /* ── datos ── */

  _fmtFecha(iso) { const [y, m, d] = String(iso || '').split('-'); return (y && m && d) ? `${d}/${m}/${y}` : ''; },
  _trim(iso) { return `${Math.floor((+String(iso).slice(5, 7) - 1) / 3) + 1}T`; },
  _r2(v) { return Math.round(v * 100) / 100; },

  /** Tipo de NIF + código de país + identificación según zonaFiscal */
  _nif3(zona, nif) {
    if (!nif) return { t: '', pais: '', id: '' };
    if (zona === 'ue') {
      const pais = /^[A-Z]{2}/i.test(nif) ? nif.slice(0, 2).toUpperCase() : '';
      return { t: '02', pais, id: nif };
    }
    if (zona === 'noue') return { t: '06', pais: '', id: nif };
    return { t: '01', pais: '', id: nif };
  },

  /**
   * Filas de datos de ambos libros para el ejercicio y (1-ene → fin del trimestre q).
   * @returns {{exp: Array<Object>, rec: Array<Object>, avisos: string[]}}
   */
  buildRows(y, q) {
    const fis = D.d.settings.fiscal || {};
    const act = { C: fis.actCodigo || '05', D: fis.actTipo || 'A', E: fis.actIAE || '' };
    const desde = `${y}-01-01`, hasta = `${y}-${String((q + 1) * 3).padStart(2, '0')}-31`;
    const enRango = (f) => f && f >= desde && f <= hasta;
    const avisos = [];
    const ys = String(y).slice(2);

    const exp = [];
    D.ps().forEach((p) => {
      if (typeof B !== 'undefined') B.calc(p);
      const f = p.facturacion || {};
      if (!enRango(f.facturaFecha) || !(f.baseImponible > 0)) return;
      const cl = p.clienteId ? D.cl(p.clienteId) : null;
      const zona = (cl && cl.zonaFiscal) || 'es';
      const n3 = this._nif3(zona, cl && cl.nif);
      const exterior = zona !== 'es' && !(f.importeIva > 0);   /* mismo criterio que _fiscalQ */
      if (!cl || !cl.nif) avisos.push(`Factura ${f.facturaNum || '?'} (${p.nombre}): cliente sin NIF → F2`);
      if (zona === 'noue' && cl && cl.nif) avisos.push(`${cl.nombre}: fuera de UE — revisa el "Código País" en el fichero (la AEAT lo pide y TRACKR no lo conoce)`);
      exp.push({
        A: y, B: this._trim(f.facturaFecha), C: act.C, D: act.D, E: act.E,
        F: n3.id ? 'F1' : 'F2', G: 'I01', H: this._r2(f.baseImponible),
        I: this._fmtFecha(f.facturaFecha),
        L: f.facturaNum ? `${f.facturaNum}/${ys}` : '',
        N: n3.t, O: n3.pais, P: n3.id,
        Q: (cl && (cl.nombreCompleto || cl.nombre) || '').slice(0, 40),
        R: '01', S: exterior ? 'N2' : 'S1',
        U: this._r2(f.totalFactura || f.baseImponible + (f.importeIva || 0) - (f.importeIrpf || 0)),
        V: this._r2(f.baseImponible),
        W: exterior ? '' : (f.iva || 0), X: exterior ? '' : this._r2(f.importeIva || 0),
        AE: f.importeIrpf > 0 ? (f.irpf || 0) : '', AF: f.importeIrpf > 0 ? this._r2(f.importeIrpf) : '',
      });
    });
    exp.sort((a, b) => (a.I.slice(6) + a.I.slice(3, 5) + a.I.slice(0, 2)).localeCompare(b.I.slice(6) + b.I.slice(3, 5) + b.I.slice(0, 2)));

    const rec = [];
    D.gs().forEach((g) => {
      if (!g.desgravable) return;
      const zona = g.zonaFiscal || 'es';
      const tipo = [21, 10, 4].includes(g.tipoIva) ? g.tipoIva : (zona === 'es' ? (g.tipoIva || 0) : 21);
      const n3 = this._nif3(zona, g.nifProveedor);
      (g.entradas || []).forEach((e) => {
        if (!enRango(e.fecha)) return;
        const base = e.base || 0, iva = e.iva || 0;
        if (!(base > 0 || iva > 0)) return;
        const ext = zona !== 'es';
        const cuotaISP = ext ? this._r2(base * tipo / 100) : 0;
        if (!g.nifProveedor) avisos.push(`Gasto "${g.nombre}": sin NIF del proveedor → F2`);
        rec.push({
          A: y, B: this._trim(e.fecha), C: act.C, D: act.D, E: act.E,
          F: n3.id ? 'F1' : 'F2', G: this.GASTO_G[g.categoria] || 'G22',
          H: this._r2(ext ? base + iva : base),                 /* IRPF: criterio TODO/20 */
          I: this._fmtFecha(e.fecha), K: e.numFactura || '',
          P: n3.t, Q: n3.pais, R: n3.id, S: String(g.nombre || '').slice(0, 40),
          T: zona === 'ue' ? '09' : '01',
          V: ext ? 'S' : '',                                    /* inversión del sujeto pasivo */
          Z: this._r2(e.total || base + iva), AA: this._r2(base),
          AB: ext ? tipo : (g.tipoIva || 0),
          AC: ext ? cuotaISP : this._r2(iva), AD: ext ? cuotaISP : this._r2(iva),
        });
      });
    });
    D.deds().forEach((dd) => {
      if (!enRango(dd.fecha) || !(dd.cantidad > 0)) return;
      rec.push({
        A: y, B: this._trim(dd.fecha), C: act.C, D: act.D, E: act.E,
        F: 'SF', G: this.DED_G[dd.categoria] || 'G37',
        H: this._r2(dd.cantidad), I: this._fmtFecha(dd.fecha),
        S: String(dd.descripcion || (typeof DEDUCIBLE_CAT !== 'undefined' && DEDUCIBLE_CAT[dd.categoria]) || '').slice(0, 40),
        T: '01',
      });
    });
    rec.sort((a, b) => (a.I.slice(6) + a.I.slice(3, 5) + a.I.slice(0, 2)).localeCompare(b.I.slice(6) + b.I.slice(3, 5) + b.I.slice(0, 2)));

    return { exp, rec, avisos: [...new Set(avisos)] };
  },

  /* ── XLSX (ZIP sin comprimir + XML con inline strings) ── */

  _xml(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); },

  /** Hoja de cálculo: 3 filas de cabecera + datos desde la fila 4. cols = ['A'...ultima] */
  _sheetXML(cols, headerRows, dataRows) {
    const cell = (ref, v) => {
      if (v === '' || v === null || v === undefined) return '';
      if (typeof v === 'number') return `<c r="${ref}"><v>${v}</v></c>`;
      return `<c r="${ref}" t="inlineStr"><is><t xml:space="preserve">${this._xml(v)}</t></is></c>`;
    };
    let rows = '';
    headerRows.concat(dataRows).forEach((r, i) => {
      const n = i + 1;
      let cs = '';
      cols.forEach((col) => { if (r[col] !== undefined) cs += cell(col + n, r[col]); });
      rows += `<row r="${n}">${cs}</row>`;
    });
    return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>${rows}</sheetData></worksheet>`;
  },

  _cols(last) {
    const out = [];
    for (let i = 0; ; i++) {
      const c = i < 26 ? String.fromCharCode(65 + i) : 'A' + String.fromCharCode(65 + i - 26);
      out.push(c);
      if (c === last) return out;
    }
  },

  _CRC_TABLE: null,
  _crc32(bytes) {
    if (!this._CRC_TABLE) {
      this._CRC_TABLE = new Uint32Array(256);
      for (let n = 0; n < 256; n++) {
        let c = n;
        for (let k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
        this._CRC_TABLE[n] = c >>> 0;
      }
    }
    let crc = 0xFFFFFFFF;
    for (let i = 0; i < bytes.length; i++) crc = this._CRC_TABLE[(crc ^ bytes[i]) & 0xFF] ^ (crc >>> 8);
    return (crc ^ 0xFFFFFFFF) >>> 0;
  },

  /** ZIP con método STORE (sin comprimir): suficiente y sin dependencias. */
  _zip(files) {
    const te = new TextEncoder();
    const parts = [], central = [];
    let offset = 0;
    const u16 = (v) => new Uint8Array([v & 255, (v >> 8) & 255]);
    const u32 = (v) => new Uint8Array([v & 255, (v >> 8) & 255, (v >> 16) & 255, (v >>> 24) & 255]);
    files.forEach(({ name, text }) => {
      const nameB = te.encode(name), data = te.encode(text);
      const crc = this._crc32(data);
      const head = [u32(0x04034b50), u16(20), u16(0), u16(0), u16(0), u16(0), u32(crc), u32(data.length), u32(data.length), u16(nameB.length), u16(0)];
      parts.push(...head, nameB, data);
      central.push([u32(0x02014b50), u16(20), u16(20), u16(0), u16(0), u16(0), u16(0), u32(crc), u32(data.length), u32(data.length), u16(nameB.length), u16(0), u16(0), u16(0), u16(0), u32(0), u32(offset), nameB]);
      offset += head.reduce((s, a) => s + a.length, 0) + nameB.length + data.length;
    });
    let cdSize = 0;
    central.forEach((entry) => entry.forEach((a) => { parts.push(a); cdSize += a.length; }));
    parts.push(u32(0x06054b50), u16(0), u16(0), u16(files.length), u16(files.length), u32(cdSize), u32(offset), u16(0));
    return new Blob(parts, { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  },

  _xlsx(expRows, recRows) {
    const sheet1 = this._sheetXML(this._cols('AJ'), this._HDR_EXP, expRows);
    const sheet2 = this._sheetXML(this._cols('AP'), this._HDR_REC, recRows);
    return this._zip([
      { name: '[Content_Types].xml', text: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/worksheets/sheet2.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/></Types>' },
      { name: '_rels/.rels', text: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>' },
      { name: 'xl/workbook.xml', text: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="EXPEDIDAS_INGRESOS" sheetId="1" r:id="rId1"/><sheet name="RECIBIDAS_GASTOS" sheetId="2" r:id="rId2"/></sheets></workbook>' },
      { name: 'xl/_rels/workbook.xml.rels', text: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet2.xml"/></Relationships>' },
      { name: 'xl/worksheets/sheet1.xml', text: sheet1 },
      { name: 'xl/worksheets/sheet2.xml', text: sheet2 },
    ]);
  },

  /**
   * Genera y descarga el fichero. Nombre oficial: {Ejercicio}{NIF}T{Nombre}.xlsx
   * @returns {{ok: boolean, avisos?: string[], error?: string, filas?: {exp: number, rec: number}}}
   */
  download(y, q) {
    const em = D.d.settings.emisor || {};
    const nif = (em.nif || '').replace(/[\s-]/g, '').toUpperCase();
    if (!nif) return { ok: false, error: 'sin_nif' };
    const { exp, rec, avisos } = this.buildRows(y, q);
    if (!exp.length && !rec.length) return { ok: false, error: 'sin_datos' };
    const blob = this._xlsx(exp, rec);
    const nombre = (em.nombre || 'TRACKR').replace(/[^\wÁÉÍÓÚÑÜáéíóúñü .-]/g, '').trim();
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${y}${nif}T${nombre}.xlsx`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    return { ok: true, avisos, filas: { exp: exp.length, rec: rec.length } };
  },
};
