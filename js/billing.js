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

    /* Por horas: la base sale de las horas hasta emitir la factura. Emitida, se congela:
       las horas que se sigan apuntando son solo para el €/h, no cambian un trimestre ya presentado. */
    if(f.modo==='por_hora'){
      if(!(f.facturaNum&&f.facturaFecha)) f.baseImponible=roundMoney(this.totalHoras(p)*(f.precioHora||0));
    } else if(f.modo==='desde_total'){
      f.baseImponible=this.baseDesdeTotal(f.total||0,iv,ir,this.conIva(f));
    } else if(this.subs(p).length&&!(f.facturaNum&&f.facturaFecha)){
      /* Subproyectos: la base es su suma. Emitida la factura se congela, como en por_hora. */
      f.baseImponible=roundMoney(this.subs(p).reduce((s,x)=>s+(x.base||0),0));
    }

    const tax=this.calcTax(f.baseImponible||0,iv,ir);
    f.importeIva=tax.importeIva;
    f.importeIrpf=tax.importeIrpf;
    f.netoRecibido=tax.netoRecibido;
    if(f.modo==='desde_total'){
      /* La base sale redondeada de dividir el total: la cuota absorbe el céntimo para que
         el total tecleado cuadre exacto (base + IVA, o lo cobrado en las facturas viejas). */
      if(f.totalConIva){
        if(iv>0) f.importeIva=roundMoney((f.total||0)-f.baseImponible);
        f.totalFactura=roundMoney(f.baseImponible+f.importeIva-f.importeIrpf);
      } else {
        f.totalFactura=f.total||0;
        if(iv>0) f.importeIva=roundMoney(f.totalFactura-f.baseImponible+f.importeIrpf);
      }
    } else {
      f.totalFactura=tax.totalFactura;
      f.total=f.totalFactura;
    }

    /* ── Rectificativas: diferencias (±) sobre la factura original, que no se toca ── */
    const rs = f.rectificativas || [];
    f.totalRect = roundMoney(rs.reduce((s, r) => s + (r.total || 0), 0));
    f.totalConRect = roundMoney((f.totalFactura || 0) + f.totalRect);
    f.netoConRect = roundMoney((f.netoRecibido || 0) + rs.reduce((s, r) => s + (r.base || 0) - (r.importeIrpf || 0), 0));

    /* ── Sincronizar pagado/fechaPago desde cobros ── */
    const cobros = f.cobros || [];
    const tc = this.totalCobrado(p); /* redondeado: 100,10+200,20+300,30 suma 600,5999… */
    f.pagado = f.totalConRect > 0 && tc >= f.totalConRect;
    if (cobros.length) {
      const sorted = [...cobros].sort((a, b) => (a.fecha || '').localeCompare(b.fecha || ''));
      f.fechaPago = sorted[sorted.length - 1].fecha || null;
    } else {
      f.fechaPago = null;
    }

    return f;
  },

  /** «Desde total»: el total es el precio con IVA → base = total ÷ (1 + IVA), y el IRPF
   *  sale luego de esa base. Las facturas viejas (conIva false) dividían entre (1 + IVA − IRPF). */
  baseDesdeTotal(t,iv,ir,conIva){
    const fac=1+iv/100-(conIva?0:ir/100);
    return fac?roundMoney(t/fac):0;
  },

  /** ¿El total de este «desde total» lleva IVA? Sí, salvo en las facturas emitidas antes del
   *  arreglo (2026-11-18), que lo tomaban como lo cobrado: ya están enviadas y declaradas.
   *  Una sin emitir queda marcada aquí, así que al emitirla ya no cambia. */
  conIva(f){
    if(!f.totalConIva&&!(f.facturaNum&&f.facturaFecha)) f.totalConIva=true;
    return !!f.totalConIva;
  },

  /** Rectificativa por diferencias: de la base correcta a los importes (±) que corrigen
   *  la factura original y las rectificativas anteriores, con sus mismos tipos. */
  rectDiff(f, baseCorrecta) {
    const yaBase = (f.baseImponible || 0) + (f.rectificativas || []).reduce((s, r) => s + (r.base || 0), 0);
    const base = roundMoney(baseCorrecta - yaBase);
    const tax = this.calcTax(base, f.iva || 0, f.irpf || 0);
    return { base, importeIva: tax.importeIva, importeIrpf: tax.importeIrpf, total: tax.totalFactura };
  },

  /** Calcula importes fiscales a partir de base, IVA% e IRPF% */
  calcTax(base, ivaRate, irpfRate) {
    const importeIva = roundMoney(base * ivaRate / 100);
    const importeIrpf = roundMoney(base * irpfRate / 100);
    return { importeIva, importeIrpf, totalFactura: roundMoney(base + importeIva - importeIrpf), netoRecibido: roundMoney(base - importeIrpf) };
  },

  /**
   * Inversa de calcTax: del total de una factura a su desglose. Con retención el
   * total es base + IVA − IRPF, así que la base se despeja dividiendo por
   * (1 + iva% − irpf%). Redondeos: base+IVA−IRPF puede bailar un céntimo
   * respecto al total tecleado; el total no se toca.
   */
  desglosarTotal(total, ivaRate, irpfRate = 0) {
    const div = 1 + (ivaRate || 0) / 100 - (irpfRate || 0) / 100;
    const base = roundMoney(div > 0 ? total / div : total);
    const { importeIva, importeIrpf } = this.calcTax(base, ivaRate || 0, irpfRate || 0);
    return { base, importeIva, importeIrpf };
  },

  /** Subproyectos en uso: solo cuentan en «desde base» (en otro modo se guardan, pero no pintan nada). */
  subs(p){ return p&&p.facturacion?.modo==='desde_base'&&Array.isArray(p.subproyectos)?p.subproyectos:[]; },

  /** Texto de la línea de presupuesto de un subproyecto: «nombre: qué incluye», en una sola línea. */
  subConcepto(x){
    const d=(x.descripcion||'').split(/\n+/).map(s=>s.trim()).filter(Boolean).join('; '); /* «;» y no «,»: cada cosa puede llevar sus comas */
    return d?`${x.nombre||''}: ${d}`:(x.nombre||'');
  },

  /** Horas y €/h (neto ÷ horas) de cada subproyecto. La última fila, sin id, son las horas
   *  sin subproyecto o de uno ya borrado; solo sale si las hay. */
  subStats(p){
    const subs=this.subs(p), ir=p.facturacion.irpf||0;
    const de=id=>p.horas.filter(h=>h.subId===id).reduce((s,h)=>s+(h.cantidad||0),0);
    const rows=subs.map(x=>{ const horas=de(x.id); return { id:x.id, nombre:x.nombre, descripcion:x.descripcion||'', base:x.base||0, horas, eph:horas?roundMoney((x.base||0)*(1-ir/100)/horas):null }; });
    const sin=p.horas.filter(h=>!subs.some(x=>x.id===h.subId)).reduce((s,h)=>s+(h.cantidad||0),0);
    if(sin) rows.push({ id:null, nombre:'', base:0, horas:sin, eph:null });
    return rows;
  },

  /* Suma total de horas registradas en el proyecto */
  totalHoras(p){ return p.horas.reduce((s,h)=>s+(h.cantidad||0),0); },

  /* Suma total cobrada */
  totalCobrado(p) {
    return roundMoney((p.facturacion.cobros || []).reduce((s, c) => s + (c.cantidad || 0), 0));
  },

  /* Cantidad pendiente de cobro */
  /** Fechas de la tarjeta de proyecto: { ini, fin } en YYYY-MM-DD o null. Lo que falte se saca
   *  de las horas apuntadas y de la factura. fin solo en completados y abandonados. */
  fechasProyecto(p) {
    const hs = (p.horas || []).map(h => h.fecha).filter(Boolean).sort();
    const fe = p.fechas || {};
    const ini = fe.inicio || hs[0] || null;
    if (p.estado !== 'completado' && p.estado !== 'abandonado') return { ini, fin: null };
    return { ini, fin: fe.finReal || (p.facturacion || {}).facturaFecha || hs[hs.length - 1] || null };
  },
  /** Fecha de vencimiento: fecha de factura + días de pago. null si no hay factura.
   *  Los días guardados en la factura (f.diasPago) mandan sobre los de Configuración. */
  vencimiento(f, dias) {
    if (!f || !f.facturaFecha) return null;
    const n = Number.isFinite(f.diasPago) ? f.diasPago : Number.isFinite(dias) ? dias : 30; /* 0 = al contado, no 30 */
    const d = new Date(f.facturaFecha + 'T00:00:00');
    d.setDate(d.getDate() + n);
    return localDateStr(d); /* en local, no toISOString(): en Madrid eso resta un día */
  },
  /** Días desde el vencimiento (>0 vencida, ≤0 en plazo); null si no facturada o ya pagada. */
  diasVencida(f, dias, hoy) {
    const v = this.vencimiento(f, dias);
    if (!v || f.pagado) return null;
    return Math.round((new Date(hoy + 'T00:00:00') - new Date(v + 'T00:00:00')) / 864e5);
  },
  /** Próximo plazo de 303/130 (autónomos): T1 → 20 abr, T2 → 20 jul, T3 → 20 oct, T4 → 30 ene.
   *  Devuelve { label:'T3 2026', end:'2026-10-20', days, y, q } con el primer plazo que aún no ha pasado. */
  nextTaxDeadline(hoy) {
    const y = parseInt(hoy.slice(0, 4), 10);
    const cands = [
      { y: y - 1, q: 3, end: `${y}-01-30` }, { y, q: 0, end: `${y}-04-20` }, { y, q: 1, end: `${y}-07-20` },
      { y, q: 2, end: `${y}-10-20` }, { y, q: 3, end: `${y + 1}-01-30` }
    ];
    /* Fin de semana → el plazo pasa al lunes (30 ene 2027 es sábado: acaba el 1 feb).
       Festivos no: shortcut, revisar con el calendario oficial de la AEAT de cada año. */
    const d0 = s => new Date(s + 'T00:00:00');
    const iso = d => localDateStr(d);
    cands.forEach(x => { const d = d0(x.end); while (d.getDay() === 0 || d.getDay() === 6) d.setDate(d.getDate() + 1); x.end = iso(d); });
    const c = cands.find(x => x.end >= hoy);
    const days = Math.round((d0(c.end) - d0(hoy)) / 864e5);
    /* Se puede presentar desde el día 1 del mes siguiente al trimestre; domiciliando el
       pago, hasta 5 días antes del último día. */
    const start = c.q === 3 ? `${c.y + 1}-01-01` : `${c.y}-${String((c.q + 1) * 3 + 1).padStart(2, '0')}-01`;
    const dom = d0(c.end); dom.setDate(dom.getDate() - 5);
    return { label: `T${c.q + 1} ${c.y}`, end: c.end, days, y: c.y, q: c.q, start, open: hoy >= start, domEnd: iso(dom), domDays: days - 5 };
  },
  pendiente(p) {
    const f = p.facturacion;
    return Math.max(roundMoney((f.totalConRect ?? f.totalFactura ?? 0) - this.totalCobrado(p)), 0);
  },

  /* Calcula €/hora (rentabilidad) */
  eph(p){
    const h=this.totalHoras(p);
    if(!h) return null;
    const f=p.facturacion;
    return roundMoney((f.netoConRect ?? f.netoRecibido ?? 0)/h);
  },

  /* Color del €/h segun rentabilidad (umbrales 30 / 15) */
  ephColor(e){ return e >= 30 ? 'var(--ok)' : e >= 15 ? 'var(--warn)' : 'var(--bad)'; },

  /**
   * Calcula resumen financiero de un periodo.
   * Devuelve { bruto, ivaTotal, gastosTotal, neto, incomeSegs[], gastoSegs[] }
   * Usado por Home y Dineros para no duplicar lógica.
   */
  financialSummary(type, y, m) {
    let bruto = 0, ivaTotal = 0;
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
          const tf = f.totalConRect ?? f.totalFactura ?? 0;
          const ratio = tf > 0 ? (c.cantidad / tf) : 0;
          const ivaRect = (f.rectificativas || []).reduce((s, r) => s + (r.importeIva || 0), 0);
          ivaTotal += ((f.importeIva || 0) + ivaRect) * ratio;
        }
      });
    });

    const incomeSegs = Object.values(projTotals).filter(s => s.total > 0);
    incomeSegs.sort((a, b) => (a.firstDate || '').localeCompare(b.firstDate || ''));

    const gastoSegs = [];
    let ivaDeducible = 0;
    D.gs().forEach(g => {
      let tot = 0;
      (g.entradas || []).forEach(e => {
        if (e.fecha && inPeriod(e.fecha, type, y, m)) {
          tot += gastoCoste(e);
          /* Proveedor español y gasto desgravable: ese IVA vuelve por el 303 */
          if (g.desgravable && (g.zonaFiscal || 'es') === 'es') ivaDeducible += e.iva || 0;
        }
      });
      if (tot > 0) gastoSegs.push({ nombre: g.nombre, total: tot, color: colorHex(g.color || 'Salmon') });
    });
    const gastosTotal = gastoSegs.reduce((s, seg) => s + seg.total, 0);

    /* Neto = lo cobrado sin el IVA que se paga, menos los gastos sin el IVA que se recupera */
    const neto = bruto - ivaTotal - gastosTotal + ivaDeducible;

    return { bruto, ivaTotal, gastosTotal, ivaDeducible, neto, incomeSegs, gastoSegs };
  }
};
