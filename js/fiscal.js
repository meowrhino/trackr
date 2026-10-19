/* ================================================
 * TRACKR — Motor fiscal (cálculo puro, sin DOM)
 * Modelos 303 y 130 a partir de los datos del store:
 * agregados por trimestre, arrastre de saldo a compensar
 * y acumulado del año. La vista (app.gastos.js) solo pinta.
 * Referencia de casillas: TODO/20-modelos-fiscales-casillas.md
 * Globales: F
 * Dependencias: store.js (D), billing.js (B), utils.js
 * ================================================ */

const F = {

  /** Casillas del 303 por tipo de IVA: [base, tipo, cuota] — numeración oficial vigente */
  CODES303: { 4: ['01', '02', '03'], 10: ['04', '05', '06'], 21: ['07', '08', '09'], 0: ['150', '151', '152'] },

  /** Config fiscal del usuario con defaults (schema en store.ensure) */
  cfg() {
    const f = D.d.settings.fiscal || {};
    return {
      eds: f.eds !== false,
      rendAnterior: (f.rendAnterior == null || f.rendAnterior === '') ? null : +f.rendAnterior,
      saldoIvaInicial: +f.saldoIvaInicial || 0
    };
  },

  /**
   * Datos fiscales brutos de un trimestre (q: 0-3).
   * Criterio de devengo: fecha de emisión de factura, bases sin IVA.
   * Las "deducciones" (cuota autónomos, etc.) cuentan como gasto.
   */
  quarter(y, q) {
    const m = q * 3;
    const ivaRep = {}, ivaSop = {};
    let ingresos = 0, gastos = 0, retenciones = 0;
    /* Operaciones exteriores (según zonaFiscal de cliente/gasto):
       extUE/extNoUE = bases de servicios a clientes fuera de España sin IVA español
       (informativas 59/120); ispUE/ispNoUE = inversión del sujeto pasivo de gastos
       con proveedor extranjero (devengado 10-13, deducible 36-37 o 28-29). */
    let extUE = 0, extNoUE = 0;
    const ispUE = { base: 0, cuota: 0 }, ispNoUE = { base: 0, cuota: 0 };
    const sinFecha = [];
    D.ps().forEach(p => {
      B.calc(p);
      const f = p.facturacion;
      p.horas.forEach(h => {
        if (h.fecha && inPeriod(h.fecha, 'trim', y, m) && h.monto) ingresos += h.monto;
      });
      if (f.facturaFecha && inPeriod(f.facturaFecha, 'trim', y, m) && f.baseImponible) {
        ingresos += f.baseImponible || 0;
        retenciones += f.importeIrpf || 0;
        const zona = (p.clienteId && D.cl(p.clienteId)?.zonaFiscal) || 'es';
        if (zona !== 'es' && !(f.importeIva > 0)) {
          /* B2B exterior sin IVA español: no devenga IVA aquí; solo informativa.
             Si la factura SÍ lleva IVA español (B2C exterior) sigue la vía normal. */
          if (zona === 'ue') extUE += f.baseImponible || 0;
          else extNoUE += f.baseImponible || 0;
        } else {
          const tipo = f.iva || 0;
          if (!ivaRep[tipo]) ivaRep[tipo] = { base: 0, cuota: 0 };
          ivaRep[tipo].base += f.baseImponible || 0;
          ivaRep[tipo].cuota += f.importeIva || 0;
        }
      }
      /* Facturas con importe pero sin fecha: no entran en ningún periodo */
      if (!f.facturaFecha && (f.baseImponible || 0) > 0 && f.modo !== 'gratis' && p.estado !== 'potencial') {
        sinFecha.push(p.nombre);
      }
    });
    D.gs().forEach(g => {
      if (!g.desgravable) return;
      const tipo = g.tipoIva || 21;
      let baseSum = 0, ivaSum = 0;
      (g.entradas || []).forEach(e => {
        if (e.fecha && inPeriod(e.fecha, 'trim', y, m)) {
          baseSum += e.base || 0;
          ivaSum += e.iva || 0;
        }
      });
      if (baseSum > 0 || ivaSum > 0) {
        const zona = g.zonaFiscal || 'es';
        if (zona === 'es') {
          /* Sin IVA (cuota de autónomos, recibos, exentos): es gasto para el 130 pero no
             va al 303. Antes su base engordaba la casilla 28 sin cuota que deducir. */
          if (ivaSum > 0) {
            if (!ivaSop[tipo]) ivaSop[tipo] = { base: 0, cuota: 0 };
            ivaSop[tipo].base += baseSum;
            ivaSop[tipo].cuota += ivaSum;
          }
        } else {
          /* Proveedor extranjero, factura sin IVA español → ISP: se autoliquida la
             cuota al tipo del gasto (general si el usuario dejó 0%). */
          const rate = [21, 10, 4].includes(tipo) ? tipo : 21;
          const isp = zona === 'ue' ? ispUE : ispNoUE;
          isp.base += baseSum;
          isp.cuota += roundMoney(baseSum * rate / 100);
        }
        gastos += gastoImporteFiscal(zona, baseSum, ivaSum);
      }
    });
    const deds = D.deds().filter(d => d.fecha && inPeriod(d.fecha, 'trim', y, m));
    gastos += deds.reduce((s, d) => s + (d.cantidad || 0), 0);
    return { ivaRep, ivaSop, ingresos, gastos, retenciones, deds, sinFecha, extUE, extNoUE, ispUE, ispNoUE };
  },

  /** Primer año con datos fiscales (para el arrastre de saldo IVA) */
  firstYear() {
    let min = null;
    D.ps().forEach(p => {
      const f = p.facturacion?.facturaFecha;
      if (f) { const yy = +f.slice(0, 4); if (!min || yy < min) min = yy; }
    });
    D.gs().forEach(g => (g.entradas || []).forEach(e => {
      if (e.fecha) { const yy = +e.fecha.slice(0, 4); if (!min || yy < min) min = yy; }
    }));
    return min;
  },

  /**
   * Modelo 130 del año y, trimestres 0..uptoQ — ACUMULATIVO como el modelo real:
   * casillas 01/02/06 acumuladas desde el 1 de enero; 05 = Σ07 positivas anteriores;
   * negativos de 19 se arrastran vía 15 dentro del año.
   * No soportadas (= 0): 08-11 agrícolas, 16 vivienda pre-2013, 18 complementarias.
   */
  calc130Year(y, uptoQ, qData) {
    const cfg = this.cfg();
    /* Casilla 13: minoración art. 110.3.c RIRPF según rendimiento neto del año anterior */
    const rn = cfg.rendAnterior;
    const minor = rn == null ? 0 : rn <= 9000 ? 100 : rn <= 10000 ? 75 : rn <= 11000 ? 50 : rn <= 12000 ? 25 : 0;
    const out = [];
    let acumIng = 0, acumGas = 0, acumRet = 0, pendNeg = 0;
    for (let q = 0; q <= uptoQ; q++) {
      const d = (qData && qData[q]) || this.quarter(y, q);
      acumIng += d.ingresos; acumGas += d.gastos; acumRet += d.retenciones;
      const c01 = acumIng;
      /* EDS: 5% de difícil justificación sobre la diferencia positiva, tope 2.000 €/año */
      const dj = cfg.eds ? Math.min(0.05 * Math.max(c01 - acumGas, 0), 2000) : 0;
      const c02 = acumGas + dj;
      const c03 = c01 - c02;
      const c04 = c03 > 0 ? c03 * 0.20 : 0;
      const c05 = out.reduce((s, prev) => s + Math.max(prev.c07, 0), 0);
      const c06 = acumRet;
      const c07 = c04 - c05 - c06;
      const c12 = Math.max(c07, 0);
      const c13 = minor;
      const c14 = c12 - c13;
      let c15 = 0;
      if (c14 > 0 && pendNeg > 0) { c15 = Math.min(pendNeg, c14); pendNeg -= c15; }
      const c17 = c14 - c15;
      const c19 = c17;
      if (c19 < 0 && q < 3) pendNeg += -c19;
      out.push({ q, c01, c02, dj, c03, c04, c05, c06, c07, c12, c13, c14, c15, c17, c19 });
    }
    return out;
  },

  /**
   * Modelo 303 de (y, q) con arrastre de saldo a compensar (casillas 110/78/87)
   * desde el primer dato registrado + saldo inicial configurable.
   * Asume "a compensar" siempre (no modela solicitar devolución en 4T) ni caducidad (4 años).
   */
  calc303(y, q, qDataOfY) {
    const cfg = this.cfg();
    let carry = cfg.saldoIvaInicial;
    const first = this.firstYear() ?? y;
    let res = null;
    for (let yy = Math.min(first, y); yy <= y; yy++) {
      const lastQ = yy === y ? q : 3;
      for (let qq = 0; qq <= lastQ; qq++) {
        const d = (yy === y && qDataOfY && qDataOfY[qq]) || this.quarter(yy, qq);
        const repCuota = Object.values(d.ivaRep).reduce((s, x) => s + x.cuota, 0);
        const sopCuota = Object.values(d.ivaSop).reduce((s, x) => s + x.cuota, 0);
        /* Las cuotas ISP (10-13) no entran: se devengan y deducen por el mismo
           importe (36-37 / 28-29), así que el 46 no cambia. Se muestran aparte. */
        const c46 = repCuota - sopCuota;
        const c110 = carry;
        const c78 = c46 > 0 ? Math.min(carry, c46) : 0;   /* compensación aplicada */
        const c87 = c110 - c78;                            /* saldo viejo que sigue pendiente */
        const c69 = c46 - c78;                             /* resultado (= c71 en nuestro perfil) */
        carry = c87 + (c46 < 0 ? -c46 : 0);                /* el negativo nuevo alimenta el 110 siguiente */
        res = { c46, c110, c78, c87, c69, c71: c69, carryNext: carry };
      }
    }
    return res;
  }
};
