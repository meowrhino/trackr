/* ================================================
 * TRACKR — Facturas (generacion de PDF)
 * Genera facturas PDF usando jsPDF.
 * Globales: Fac
 * Dependencias: jsPDF (CDN), store.js, billing.js, utils.js, lang.js
 * ================================================ */

const Fac = {

  /**
   * Genera un PDF de factura para un proyecto.
   * @param {Object} data - Datos de la factura:
   *   { emisor, cliente, factura: {numero, fecha, asunto},
   *     calculos: {base, iva, ivaRate, irpf, irpfRate, total, ivaExcepcion} }
   * @param {string} lang - Codigo de idioma para la factura ('es' o 'en')
   * @returns {jsPDF} instancia del PDF generado
   */
  genPDF(data, lang) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    const pageW = doc.internal.pageSize.getWidth();   /* 210 */
    const pageH = doc.internal.pageSize.getHeight();   /* 297 */
    const mg = 20;
    let y = mg;

    /* ── Helpers ── */
    const fmt = n => n.toLocaleString('es-ES', {
      minimumFractionDigits: 2, maximumFractionDigits: 2
    });

    /* Year short from fecha (yyyy-mm-dd) */
    const yearShort = (fecha) => {
      const parts = fecha.split('-');
      return parts.length >= 1 ? parts[0].slice(-2) : '';
    };

    /* Format date dd/mm/yyyy from yyyy-mm-dd */
    const fmtDate = (fecha) => {
      const parts = fecha.split('-');
      if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
      return fecha;
    };

    /* Number with year: NNNN/YY */
    const ys = yearShort(data.factura.fecha);
    const numYY = `${data.factura.numero}/${ys}`;

    /* Column positions */
    const leftX = mg;
    const rightX = pageW / 2 + 5;

    /* ── Title: "Factura NNNN/YY" top-left ── */
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(40);
    doc.text(`${tf('fac.invoice', lang)} ${numYY}`, leftX, y);
    y += 8;

    /* ── 2-column header: Emisor (left) | Datos de factura (right) ── */
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(60);
    doc.text(tf('fac.issuerLabel', lang), leftX, y);
    doc.text(tf('fac.invoiceData', lang), rightX, y);
    y += 5;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(60);

    /* Row 1: Emisor nombre | N.o NNNN/YY */
    doc.text(data.emisor.nombre || tf('fac.noName', lang), leftX, y);
    doc.text(`N.\u00BA ${numYY}`, rightX, y);
    y += 5;

    /* Row 2: Emisor direccion1 | Fecha */
    if (data.emisor.direccion1) doc.text(data.emisor.direccion1, leftX, y);
    doc.text(fmtDate(data.factura.fecha), rightX, y);
    y += 5;

    /* Row 3: Emisor direccion2 */
    if (data.emisor.direccion2) { doc.text(data.emisor.direccion2, leftX, y); y += 5; }

    /* Row 4: Emisor NIF */
    if (data.emisor.nif) {
      doc.text(tf('fac.nif', lang) + data.emisor.nif, leftX, y);
      y += 5;
    }

    /* ── Cliente ── */
    y += 3;
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(60);
    doc.text(tf('fac.clientLabel', lang), leftX, y);
    y += 5;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(60);
    doc.text(data.cliente.nombre || tf('fac.noClient', lang), leftX, y);
    y += 5;
    if (data.cliente.direccion1) { doc.text(data.cliente.direccion1, leftX, y); y += 5; }
    if (data.cliente.direccion2) { doc.text(data.cliente.direccion2, leftX, y); y += 5; }
    if (data.cliente.nif) {
      doc.text(tf('fac.nif', lang) + data.cliente.nif, leftX, y);
      y += 5;
    }

    /* ── Concepto ── */
    y += 3;
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(60);
    doc.text(tf('fac.concept', lang), leftX, y);
    y += 5;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(60);
    const concepto = data.factura.asunto || '\u2014';
    const conceptoLines = doc.splitTextToSize(concepto, pageW - mg * 2);
    doc.text(conceptoLines, leftX, y);
    y += conceptoLines.length * 5 + 6;

    /* ── Totals (positioned at bottom of page when possible) ── */
    const labelX = pageW - mg - 70;
    const valueX = pageW - mg;
    const lineH = 6;

    /* Build totals rows */
    const rows = [];
    rows.push({ label: tf('fac.taxableBase', lang), value: fmt(data.calculos.base) + ' \u20AC' });

    if (data.calculos.irpfRate > 0) {
      rows.push({
        label: tf('fac.retention', lang, data.calculos.irpfRate),
        value: '- ' + fmt(Math.abs(data.calculos.irpf)) + ' \u20AC'
      });
    }

    if (data.calculos.ivaRate > 0) {
      rows.push({
        label: tf('fac.iva', lang, data.calculos.ivaRate),
        value: fmt(data.calculos.iva) + ' \u20AC'
      });
    } else {
      /* IVA 0 — show row but mark as exempt if exception text */
      rows.push({
        label: tf('fac.iva', lang, 0),
        value: fmt(0) + ' \u20AC'
      });
    }

    rows.push({
      label: tf('fac.total', lang),
      value: fmt(data.calculos.total) + ' \u20AC',
      bold: true
    });

    /* IVA exception note (if IVA is 0 and there is exception text) */
    const noteLines = (data.calculos.ivaRate === 0 && data.calculos.ivaExcepcion)
      ? doc.splitTextToSize(tf('fac.ivaException', lang, data.calculos.ivaExcepcion), 70)
      : [];
    const noteH = noteLines.length ? noteLines.length * 4 + 2 : 0;

    /* Calculate totals Y: push to bottom, but never overlap content */
    const totalsH = rows.length * lineH;
    let totalsY = pageH - mg - totalsH - noteH;
    if (totalsY < y + 4) totalsY = y + 4;

    /* Draw IVA exception note above totals if present */
    if (noteLines.length) {
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(120);
      doc.text(noteLines, labelX, totalsY);
      totalsY += noteLines.length * 4 + 2;
    }

    /* Draw each totals row */
    rows.forEach(row => {
      if (row.bold) {
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(40);
      } else {
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(60);
      }
      doc.text(row.label, labelX, totalsY);
      doc.text(row.value, valueX, totalsY, { align: 'right' });
      totalsY += lineH;
    });

    return doc;
  },

  /**
   * Genera y descarga la factura de un proyecto.
   * @param {string} pid - ID del proyecto
   * @param {Object} opts - { fecha, asunto } (opcionales, para override)
   */
  download(pid, opts = {}) {
    const p = D.p(pid);
    if (!p) return;

    const s = D.d.settings;
    const cl = p.clienteId ? D.cl(p.clienteId) : null;
    const f = p.facturacion;

    /* Idioma de la factura */
    const facLang = f.idiomaFactura || D.d.settings.idioma || 'es';

    /* Numero de factura */
    const num = f.facturaNum || s.nextFacturaNum || 1;
    const numStr = String(num).padStart(4, '0');

    /* Fecha y year short */
    const fecha = opts.fecha || todayStr();
    const ys = fecha.split('-').length >= 1 ? fecha.split('-')[0].slice(-2) : '';

    /* Construir datos */
    const data = {
      emisor: s.emisor,
      cliente: cl
        ? { nombre: cl.nombreCompleto || cl.nombre, direccion1: cl.direccion1 || '', direccion2: cl.direccion2 || '', nif: cl.nif || '' }
        : { nombre: clienteName(p), direccion1: '', direccion2: '', nif: '' },
      factura: {
        numero: numStr,
        fecha: fecha,
        asunto: opts.asunto || p.nombre
      },
      calculos: {
        base: f.baseImponible || 0,
        iva: f.importeIva || 0,
        ivaRate: f.iva || 0,
        irpf: f.importeIrpf || 0,
        irpfRate: f.irpf || 0,
        total: f.totalFactura || 0,
        ivaExcepcion: f.ivaExcepcion || ''
      }
    };

    /* Generar y descargar */
    const doc = this.genPDF(data, facLang);
    const safeName = p.nombre.replace(/\s+/g, '_');
    const filename = `factura_${numStr}_${ys}_${safeName}.pdf`;
    doc.save(filename);

    /* Actualizar proyecto: marcar facturado */
    f.facturaNum = num;
    f.facturaFecha = data.factura.fecha;
    D.up(pid, { facturacion: f });

    /* Incrementar contador */
    if (!p.facturacion.facturaNum || num >= s.nextFacturaNum) {
      s.nextFacturaNum = num + 1;
      D.save();
    }

    return { num: numStr, fecha: data.factura.fecha };
  }
};
