/* ================================================
 * TRACKR — Billing (cálculos de facturación)
 * IVA, IRPF, neto, rentabilidad por hora
 * Globales: B
 * Dependencias: ninguna
 * ================================================ */

const B={
  /**
   * Calcula todos los importes de facturación de un proyecto.
   * Modos: 'gratis', 'desde_base', 'desde_total', 'por_hora'.
   * En modo 'por_hora', base = horas × precioHora.
   */
  calc(p){
    const f=p.facturacion;

    /* Proyecto gratuito: todo a cero */
    if(f.modo==='gratis'){
      f.importeIva=0;f.importeIrpf=0;f.totalFactura=0;f.netoRecibido=0;f.baseImponible=0;f.total=0;
      f.pagado=false;f.fechaPago=null;
      return f;
    }

    const iv=f.iva||0, ir=f.irpf||0;

    if(f.modo==='por_hora'){
      const th=p.horas.reduce((s,h)=>s+h.cantidad,0);
      f.baseImponible=roundMoney(th*(f.precioHora||0));
    } else if(f.modo==='desde_total'){
      const t=f.total||0, fac=1+iv/100-ir/100;
      f.baseImponible=fac?roundMoney(t/fac):0;
    }

    const tax=this.calcTax(f.baseImponible||0,iv,ir);
    f.importeIva=tax.importeIva;
    f.importeIrpf=tax.importeIrpf;
    f.netoRecibido=tax.netoRecibido;
    if(f.modo==='desde_total'){
      f.totalFactura=f.total||0;
    } else {
      f.totalFactura=tax.totalFactura;
      f.total=f.totalFactura;
    }

    /* ── Sincronizar pagado/fechaPago desde cobros ── */
    const cobros = f.cobros || [];
    const tc = cobros.reduce((s, c) => s + (c.cantidad || 0), 0);
    f.pagado = f.totalFactura > 0 && tc >= f.totalFactura;
    if (cobros.length) {
      const sorted = [...cobros].sort((a, b) => (a.fecha || '').localeCompare(b.fecha || ''));
      f.fechaPago = sorted[sorted.length - 1].fecha || null;
    } else {
      f.fechaPago = null;
    }

    return f;
  },

  /** Calcula importes fiscales a partir de base, IVA% e IRPF% */
  calcTax(base, ivaRate, irpfRate) {
    const importeIva = roundMoney(base * ivaRate / 100);
    const importeIrpf = roundMoney(base * irpfRate / 100);
    return { importeIva, importeIrpf, totalFactura: roundMoney(base + importeIva - importeIrpf), netoRecibido: roundMoney(base - importeIrpf) };
  },

  /* Suma total cobrada */
  totalCobrado(p) {
    return (p.facturacion.cobros || []).reduce((s, c) => s + (c.cantidad || 0), 0);
  },

  /* Cantidad pendiente de cobro */
  pendiente(p) {
    return Math.max((p.facturacion.totalFactura || 0) - this.totalCobrado(p), 0);
  },

  /* Calcula €/hora (rentabilidad) */
  eph(p){
    const h=p.horas.reduce((s,x)=>s+x.cantidad,0);
    if(!h) return null;
    return roundMoney((p.facturacion.netoRecibido||0)/h);
  },

  /**
   * Calcula resumen financiero de un periodo.
   * Devuelve { bruto, ivaTotal, irpfTotal, gastosTotal, neto,
   *            incomeSegs[], gastoSegs[] }
   * Usado por Home y Dineros para no duplicar lógica.
   */
  financialSummary(type, y, m) {
    let bruto = 0, ivaTotal = 0, irpfTotal = 0;
    const projTotals = {};

    D.ps().forEach(p => {
      this.calc(p);
      const f = p.facturacion;
      const hex = colorHex(p.color);
      const key = p.id;
      const touch = (fecha) => {
        if (!projTotals[key]) projTotals[key] = { nombre: p.nombre, total: 0, color: hex, firstDate: fecha };
        else if (fecha < projTotals[key].firstDate) projTotals[key].firstDate = fecha;
      };
      p.horas.forEach(h => {
        if (h.fecha && inPeriod(h.fecha, type, y, m)) {
          if (h.monto) {
            bruto += h.monto;
            touch(h.fecha);
            projTotals[key].total += h.monto;
          }
        }
      });
      (f.cobros || []).forEach(c => {
        if (c.fecha && inPeriod(c.fecha, type, y, m)) {
          bruto += c.cantidad || 0;
          touch(c.fecha);
          projTotals[key].total += c.cantidad || 0;
          const tf = f.totalFactura || 0;
          const ratio = tf > 0 ? (c.cantidad / tf) : 0;
          ivaTotal += (f.importeIva || 0) * ratio;
          irpfTotal += (f.importeIrpf || 0) * ratio;
        }
      });
    });

    const incomeSegs = Object.values(projTotals).filter(s => s.total > 0);
    incomeSegs.sort((a, b) => (a.firstDate || '').localeCompare(b.firstDate || ''));

    const gastoSegs = [];
    D.gs().forEach(g => {
      let tot = 0;
      (g.entradas || []).forEach(e => {
        if (e.fecha && inPeriod(e.fecha, type, y, m)) tot += e.total || e.cantidad || 0;
      });
      if (tot > 0) gastoSegs.push({ nombre: g.nombre, total: tot, color: colorHex(g.color || 'Salmon') });
    });
    const gastosTotal = gastoSegs.reduce((s, seg) => s + seg.total, 0);

    const neto = bruto - ivaTotal - gastosTotal;

    return { bruto, ivaTotal, irpfTotal, gastosTotal, neto, incomeSegs, gastoSegs };
  }
};
