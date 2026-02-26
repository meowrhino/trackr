/* ================================================
 * TRACKR — Facturas (generación de PDF)
 * Genera facturas PDF usando jsPDF.
 * Globales: Fac
 * Dependencias: jsPDF (CDN), store.js, billing.js, utils.js
 * ================================================ */

const Fac = {

  /**
   * Genera un PDF de factura para un proyecto.
   * @param {Object} data - Datos de la factura:
   *   { emisor, cliente, factura: {numero, fecha, asunto},
   *     calculos: {base, iva, ivaRate, irpf, irpfRate, total, ivaExcepcion} }
   * @returns {jsPDF} instancia del PDF generado
   */
  genPDF(data) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    const W = 210, mg = 20;
    const cw = W - mg * 2; /* ancho útil */
    let y = mg;

    /* ── Helpers ── */
    const line = (x1, y1, x2, y2) => {
      doc.setDrawColor(200);
      doc.setLineWidth(0.3);
      doc.line(x1, y1, x2, y2);
    };
    const fmt = n => {
      return n.toLocaleString('es-ES', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      });
    };

    /* ── Header: Emisor ── */
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(60);
    doc.text(data.emisor.nombre || 'Sin nombre', mg, y);
    y += 5;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(120);
    if (data.emisor.direccion1) { doc.text(data.emisor.direccion1, mg, y); y += 3.5; }
    if (data.emisor.direccion2) { doc.text(data.emisor.direccion2, mg, y); y += 3.5; }
    if (data.emisor.nif) { doc.text('NIF: ' + data.emisor.nif, mg, y); y += 3.5; }

    /* ── Título FACTURA ── */
    y += 4;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.setTextColor(40);
    doc.text('FACTURA', W - mg, y, { align: 'right' });

    /* Número y fecha a la derecha */
    y += 7;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100);
    doc.text('N\u00ba ' + data.factura.numero, W - mg, y, { align: 'right' });
    y += 4;
    doc.text(data.factura.fecha, W - mg, y, { align: 'right' });

    /* ── Cliente ── */
    y += 8;
    line(mg, y, W - mg, y);
    y += 6;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text('FACTURAR A:', mg, y);
    y += 5;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(60);
    doc.text(data.cliente.nombre || 'Sin cliente', mg, y);
    y += 4.5;

    doc.setFontSize(8);
    doc.setTextColor(120);
    if (data.cliente.direccion1) { doc.text(data.cliente.direccion1, mg, y); y += 3.5; }
    if (data.cliente.direccion2) { doc.text(data.cliente.direccion2, mg, y); y += 3.5; }
    if (data.cliente.nif) { doc.text('NIF: ' + data.cliente.nif, mg, y); y += 3.5; }

    /* ── Concepto ── */
    y += 8;
    line(mg, y, W - mg, y);
    y += 6;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text('CONCEPTO', mg, y);
    doc.text('IMPORTE', W - mg, y, { align: 'right' });
    y += 6;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(60);
    doc.text(data.factura.asunto, mg, y);
    doc.text(fmt(data.calculos.base) + ' \u20AC', W - mg, y, { align: 'right' });

    /* ── Desglose ── */
    y += 10;
    line(mg, y, W - mg, y);
    y += 8;

    const rightCol = W - mg;
    const labelX = rightCol - 60;

    /* Base imponible */
    doc.setFontSize(9);
    doc.setTextColor(100);
    doc.text('Base imponible', labelX, y);
    doc.setTextColor(60);
    doc.text(fmt(data.calculos.base) + ' \u20AC', rightCol, y, { align: 'right' });
    y += 5;

    /* IVA */
    if (data.calculos.ivaRate > 0) {
      doc.setTextColor(100);
      doc.text('IVA (' + data.calculos.ivaRate + '%)', labelX, y);
      doc.setTextColor(60);
      doc.text(fmt(data.calculos.iva) + ' \u20AC', rightCol, y, { align: 'right' });
      y += 5;
    } else if (data.calculos.ivaExcepcion) {
      doc.setTextColor(150);
      doc.setFontSize(7);
      doc.text('IVA: ' + data.calculos.ivaExcepcion, labelX, y);
      y += 5;
      doc.setFontSize(9);
    }

    /* IRPF */
    if (data.calculos.irpfRate > 0) {
      doc.setTextColor(100);
      doc.text('IRPF (' + data.calculos.irpfRate + '%)', labelX, y);
      doc.setTextColor(60);
      doc.text('-' + fmt(data.calculos.irpf) + ' \u20AC', rightCol, y, { align: 'right' });
      y += 5;
    }

    /* Total */
    y += 2;
    line(labelX, y, rightCol, y);
    y += 7;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(40);
    doc.text('TOTAL', labelX, y);
    doc.text(fmt(data.calculos.total) + ' \u20AC', rightCol, y, { align: 'right' });

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

    /* Número de factura */
    const num = f.facturaNum || s.nextFacturaNum || 1;
    const numStr = String(num).padStart(4, '0');

    /* Construir datos */
    const data = {
      emisor: s.emisor,
      cliente: cl || { nombre: clienteName(p), direccion1: '', direccion2: '', nif: '' },
      factura: {
        numero: numStr,
        fecha: opts.fecha || todayStr(),
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
    const doc = this.genPDF(data);
    const filename = `factura_${numStr}_${p.nombre.replace(/\s+/g, '_')}.pdf`;
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
