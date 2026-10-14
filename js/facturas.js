/* ================================================
 * TRACKR — Facturas (generacion de PDF)
 * Genera facturas PDF usando jsPDF.
 * Globales: Fac
 * Dependencias: jsPDF (CDN), store.js, billing.js, utils.js, lang.js
 * ================================================ */

/* PDF layout constants */
const PDF_MARGIN = 20;       /* mm */
const PDF_LINE_H = 6;        /* mm entre filas de totales */
const PDF_TOTALS_W = 70;     /* mm ancho de bloque totales */

/** Extrae los dos últimos dígitos del año de una fecha YYYY-MM-DD */
function yearShort(fecha) {
  const parts = fecha.split('-');
  return parts.length >= 1 ? parts[0].slice(-2) : '';
}

const Fac = {

  /**
   * Genera un PDF de factura (o de presupuesto) para uno o varios proyectos.
   * @param {Object} data - Datos de la factura:
   *   { emisor, cliente, factura: {numero, fecha, asunto},
   *     calculos: {base, iva, ivaRate, irpf, irpfRate, total, ivaExcepcion} }
   *   Presupuesto: kind:'presupuesto', lineas:[{concepto, base}] y, si mezcla tipos,
   *   calculos.ivas/irpfs:[{rate, amount}] (una fila de totales por tipo).
   * @param {string} lang - Codigo de idioma para la factura ('es' o 'en')
   * @returns {jsPDF} instancia del PDF generado
   */
  genPDF(data, lang) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    const pageW = doc.internal.pageSize.getWidth();   /* 210 */
    const pageH = doc.internal.pageSize.getHeight();   /* 297 */
    const mg = PDF_MARGIN;
    let y = mg;

    /* ── Helpers ── */
    const fmt = n => n.toLocaleString('es-ES', {
      minimumFractionDigits: 2, maximumFractionDigits: 2
    });

    /* Format date dd/mm/yyyy from yyyy-mm-dd */
    const fmtDate = (fecha) => {
      const parts = fecha.split('-');
      if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
      return fecha;
    };

    /* Number with year: NNNN/YY */
    const ys = yearShort(data.factura.fecha);
    const numYY = `${data.factura.numero}/${ys}`;
    const isBud = data.kind === 'presupuesto';

    /* Column positions */
    const leftX = mg;
    const rightX = pageW / 2 + 5;

    /* ── Title: "Factura NNNN/YY" top-left ── */
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(40);
    doc.text(`${tf(isBud ? 'fac.budget' : 'fac.invoice', lang)} ${numYY}`, leftX, y);
    y += 8;

    /* ── 2-column header: Emisor (left) | Datos de factura (right) ── */
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(60);
    doc.text(tf('fac.issuerLabel', lang), leftX, y);
    doc.text(tf(isBud ? 'fac.budgetData' : 'fac.invoiceData', lang), rightX, y);
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

    /* ── Concepto (en presupuesto: descripción libre, se omite si va vacía) ── */
    const section = (label) => {
      y += 3;
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(60);
      doc.text(label, leftX, y);
      y += 5;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(60);
    };
    if (!isBud || data.factura.asunto) {
      section(tf(isBud ? 'fac.description' : 'fac.concept', lang));
      const concepto = data.factura.asunto || '\u2014';
      const conceptoLines = doc.splitTextToSize(concepto, pageW - mg * 2);
      doc.text(conceptoLines, leftX, y);
      y += conceptoLines.length * 5 + 6;
    }

    /* ── Líneas (una por proyecto): concepto a la izquierda, base a la derecha ── */
    if (data.lineas && data.lineas.length) {
      section(tf('fac.breakdown', lang));
      data.lineas.forEach(l => {
        const ls = doc.splitTextToSize(l.concepto || '\u2014', pageW - mg * 2 - 40);
        doc.text(ls, leftX, y);
        doc.text(fmt(l.base) + ' \u20AC', pageW - mg, y, { align: 'right' });
        y += ls.length * 5 + 1.5;
      });
      y += 4;
    }

    /* ── Totals (positioned at bottom of page when possible) ── */
    const labelX = pageW - mg - PDF_TOTALS_W;
    const valueX = pageW - mg;
    const lineH = PDF_LINE_H;

    /* Build totals rows */
    const rows = [];
    rows.push({ label: tf('fac.taxableBase', lang), value: fmt(data.calculos.base) + ' \u20AC' });

    /* Una fila por tipo. La factura trae un solo tipo; el presupuesto puede mezclar. */
    const c = data.calculos;
    const irpfs = c.irpfs || [{ rate: c.irpfRate, amount: c.irpf }];
    const ivas = c.ivas || [{ rate: c.ivaRate, amount: c.iva }];
    irpfs.filter(r => r.rate > 0).forEach(r => rows.push({
      label: tf('fac.retention', lang, r.rate),
      value: '- ' + fmt(Math.abs(r.amount)) + ' \u20AC'
    }));
    /* IVA 0 también sale como fila (con la nota de exención debajo si la hay) */
    ivas.forEach(r => rows.push({
      label: tf('fac.iva', lang, r.rate || 0),
      value: fmt(r.rate > 0 ? r.amount : 0) + ' \u20AC'
    }));

    rows.push({
      label: tf('fac.total', lang),
      value: fmt(data.calculos.total) + ' \u20AC',
      bold: true
    });

    /* IVA exception note (if IVA is 0 and there is exception text) */
    const noteLines = (data.calculos.ivaRate === 0 && data.calculos.ivaExcepcion)
      ? doc.splitTextToSize(tf('fac.ivaException', lang, data.calculos.ivaExcepcion), PDF_TOTALS_W)
      : [];
    const noteH = noteLines.length ? noteLines.length * 4 + 2 : 0;

    /* Payment section height (label + gap + text lines) */
    let pagoFullParts = [];
    if (data.beneficiarioPago) pagoFullParts.push(tf('fac.beneficiary', lang) + ' ' + data.beneficiarioPago);
    if (data.instruccionesPago) pagoFullParts.push(tf('fac.bankTransferText', lang), data.instruccionesPago);
    const pagoFullText = pagoFullParts.join('\n');
    const pagoEstLines = pagoFullText ? doc.splitTextToSize(pagoFullText, PDF_TOTALS_W) : [];
    const pagoH = pagoEstLines.length ? 4 + 5 + pagoEstLines.length * 4 : 0;

    /* Calculate totals Y: push to bottom, but never overlap content */
    const totalsH = rows.length * lineH;
    let totalsY = pageH - mg - totalsH - noteH - pagoH;
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

    /* ── Payment / bank account ── */
    if (data.instruccionesPago || data.beneficiarioPago) {
      totalsY += 4;
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(60);
      doc.text(tf('fac.paymentMethod', lang) + ':', labelX, totalsY);
      totalsY += 5;
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      let payLines = [];
      if (data.beneficiarioPago) payLines.push(tf('fac.beneficiary', lang) + ' ' + data.beneficiarioPago);
      if (data.instruccionesPago) payLines.push(tf('fac.bankTransferText', lang), data.instruccionesPago);
      const lines = doc.splitTextToSize(payLines.join('\n'), PDF_TOTALS_W);
      doc.text(lines, labelX, totalsY);
    }

    /* ── Bloque VeriFactu (esquina inferior izquierda): QR tributario + leyenda ── */
    if (data.verifactu && data.verifactu.qrPayload && typeof V !== 'undefined' && typeof qrcode === 'function') {
      try {
        const qrSize = 30;              /* mm — spec AEAT: 30×30 a 40×40 */
        const qrX = mg;
        const qrY = pageH - mg - qrSize;

        doc.setFontSize(7);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(60);
        doc.text(V.QR_LABEL, qrX, qrY - 1.5);

        /* QR vectorial: jsPDF no soporta GIF (formato de qrcode-generator),
           asi que pintamos los modulos como rects. Correccion de errores M. */
        const qr = qrcode(0, 'M');
        qr.addData(data.verifactu.qrPayload);
        qr.make();
        const n = qr.getModuleCount();
        const cell = qrSize / n;
        doc.setFillColor(0, 0, 0);
        for (let r = 0; r < n; r++) {
          for (let c = 0; c < n; c++) {
            if (qr.isDark(r, c)) doc.rect(qrX + c * cell, qrY + r * cell, cell, cell, 'F');
          }
        }

        /* Leyenda oficial + identificacion SIF a la derecha del QR */
        const txX = qrX + qrSize + 4;
        doc.setFontSize(8);
        doc.setTextColor(60);
        doc.text(doc.splitTextToSize(V.LEGEND, 60), txX, qrY + qrSize / 2 - 3);
        doc.setFontSize(6.5);
        doc.setTextColor(120);
        doc.text(`SIF ${data.verifactu.sifId} · TRACKR v${data.verifactu.softwareVersion} · ${data.verifactu.publicUrl}`, txX, qrY + qrSize / 2 + 4);
      } catch (e) { console.warn('Verifactu QR render failed:', e); }
    }

    return doc;
  },

  /**
   * Genera y descarga la factura de un proyecto.
   * @param {string} pid - ID del proyecto
   * @param {Object} opts - { fecha, asunto } (opcionales, para override)
   */
  /** Bloque CLIENTE del PDF (factura y presupuesto) */
  clienteData(cl, fallbackName) {
    return cl
      ? { nombre: cl.nombreCompleto || cl.nombre, direccion1: cl.direccion1 || '', direccion2: cl.direccion2 || '', nif: cl.nif || '' }
      : { nombre: fallbackName || '', direccion1: '', direccion2: '', nif: '' };
  },

  /**
   * Presupuesto de varios proyectos de un cliente. NO es factura: no consume numeración
   * de facturas, no firma VeriFactu y no sale en los libros. Contador propio.
   * @param {string} cid  cliente
   * @param {Array} lineas  [{pid, concepto, base}]
   * @param {Object} opts  { num, fecha, descripcion }
   */
  presupuesto(cid, lineas, opts) {
    const s = D.d.settings;
    const cl = D.cl(cid);
    const first = D.p(lineas[0].pid);
    const lang = first?.facturacion?.idiomaFactura || s.idioma || 'es';
    /* Tipos de cada línea: los del proyecto (o los de Configuración si es gratis) */
    const ivaG = {}, irpfG = {};
    let base = 0;
    lineas.forEach(l => {
      const f = D.p(l.pid)?.facturacion || {};
      const iva = f.modo === 'gratis' || f.iva == null ? s.defaultIva : f.iva;
      const irpf = f.modo === 'gratis' || f.irpf == null ? s.defaultIrpf : f.irpf;
      base += l.base;
      ivaG[iva] = (ivaG[iva] || 0) + l.base * iva / 100;
      irpfG[irpf] = (irpfG[irpf] || 0) + l.base * irpf / 100;
    });
    const group = g => Object.keys(g).map(Number).sort((a, b) => b - a).map(rate => ({ rate, amount: roundMoney(g[rate]) }));
    const ivas = group(ivaG), irpfs = group(irpfG);
    const total = roundMoney(base + ivas.reduce((a, r) => a + r.amount, 0) - irpfs.reduce((a, r) => a + r.amount, 0));
    const data = {
      kind: 'presupuesto',
      emisor: s.emisor,
      cliente: this.clienteData(cl, ''),
      factura: { numero: String(opts.num), fecha: opts.fecha, asunto: opts.descripcion || '' },
      lineas,
      calculos: { base: roundMoney(base), ivas, irpfs, total },
      beneficiarioPago: s.emisor.beneficiarioPago || '',
      instruccionesPago: s.emisor.instruccionesPago || ''
    };
    const doc = this.genPDF(data, lang);
    doc.save(`presupuesto_${opts.num}_${yearShort(opts.fecha)}_${(cl?.nombre || '').replace(/\s+/g, '_')}.pdf`);

    lineas.forEach(l => D.up(l.pid, { presupuesto: { num: opts.num, fecha: opts.fecha } }));
    if (opts.num >= (s.nextPresupuestoNum || 1)) { s.nextPresupuestoNum = opts.num + 1; D.save(); }
    return { total };
  },

  download(pid, opts = {}) {
    const p = D.p(pid);
    if (!p) return;

    const s = D.d.settings;
    const cl = p.clienteId ? D.cl(p.clienteId) : null;
    const f = p.facturacion;

    /* Idioma de la factura */
    const facLang = f.idiomaFactura || D.d.settings.idioma || 'es';

    /* Numero de factura */
    const num = opts.num || f.facturaNum || s.nextFacturaNum || 1;
    const numStr = String(num);

    /* Fecha y year short */
    const fecha = opts.fecha || todayStr();
    const ys = yearShort(fecha);

    /* Construir datos */
    const data = {
      emisor: s.emisor,
      cliente: this.clienteData(cl, clienteName(p)),
      factura: {
        numero: numStr,
        fecha: fecha,
        asunto: opts.asunto || defaultAsunto(p)
      },
      calculos: {
        base: f.baseImponible || 0,
        iva: f.importeIva || 0,
        ivaRate: f.iva || 0,
        irpf: f.importeIrpf || 0,
        irpfRate: f.irpf || 0,
        total: f.totalFactura || 0,
        ivaExcepcion: f.ivaExcepcion || ''
      },
      beneficiarioPago: s.emisor.beneficiarioPago || '',
      instruccionesPago: s.emisor.instruccionesPago || '',
      verifactu: opts.verifactu || null
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
