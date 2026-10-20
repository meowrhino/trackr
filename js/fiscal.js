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
    const ispUE = { base: 0, cuota: 0, tipos: {} }, ispNoUE = { base: 0, cuota: 0, tipos: {} };
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
      const zona = g.zonaFiscal || 'es';
      /* Una línea por tipo de IVA (ticket mixto → varias líneas de la misma entrada) */
      (g.entradas || []).forEach(e => {
        if (!e.fecha || !inPeriod(e.fecha, 'trim', y, m)) return;
        gastoLineasIva(g, e).forEach(l => {
          const base = l.base || 0, iva = l.iva || 0;
          if (!(base > 0 || iva > 0)) return;
          const tipo = l.tipoIva || 21;
          if (zona === 'es') {
            /* Sin IVA (cuota de autónomos, recibos, exentos): es gasto para el 130 pero no
               va al 303. Antes su base engordaba la casilla 28 sin cuota que deducir. */
            if (iva > 0) {
              if (!ivaSop[tipo]) ivaSop[tipo] = { base: 0, cuota: 0 };
              ivaSop[tipo].base += base;
              ivaSop[tipo].cuota += iva;
            }
          } else {
            /* Proveedor extranjero, factura sin IVA español → ISP: se autoliquida la
               cuota al tipo del gasto (general si el usuario dejó 0%). */
            const rate = [21, 10, 4].includes(tipo) ? tipo : 21;
            const isp = zona === 'ue' ? ispUE : ispNoUE;
            const cuota = roundMoney(base * rate / 100);
            isp.base += base;
            isp.cuota += cuota;
            if (!isp.tipos[rate]) isp.tipos[rate] = { base: 0, cuota: 0 };
            isp.tipos[rate].base += base; isp.tipos[rate].cuota += cuota;   /* el 390 lo pide por tipo */
          }
          gastos += gastoImporteFiscal(zona, base, iva);
        });
      });
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
      const dj = cfg.eds ? roundMoney(Math.min(0.05 * Math.max(c01 - acumGas, 0), 2000)) : 0;
      const c02 = roundMoney(acumGas + dj);
      const c03 = roundMoney(c01 - c02);
      /* Cada casilla se redondea a céntimos antes de seguir, como en el modelo oficial:
         si no, 04 = 321,024 daba un 07 de 40,00 donde el presentado decía 39,99. */
      const c04 = c03 > 0 ? roundMoney(c03 * 0.20) : 0;
      const c05 = roundMoney(out.reduce((s, prev) => s + Math.max(prev.c07, 0), 0));
      const c06 = roundMoney(acumRet);
      const c07 = roundMoney(c04 - c05 - c06);
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
    /* El saldo pendiente se lleva en dos bolsas: lo generado en años anteriores y lo
       del año en curso. Al 303 le da igual; el 390 lo separa (85 y 662). Se consume
       primero lo más viejo (caduca a los 4 años). */
    let carryPrev = cfg.saldoIvaInicial, carryCur = 0;
    const first = this.firstYear() ?? y;
    let res = null;
    for (let yy = Math.min(first, y); yy <= y; yy++) {
      carryPrev += carryCur; carryCur = 0;
      const lastQ = yy === y ? q : 3;
      for (let qq = 0; qq <= lastQ; qq++) {
        const d = (yy === y && qDataOfY && qDataOfY[qq]) || this.quarter(yy, qq);
        const repCuota = Object.values(d.ivaRep).reduce((s, x) => s + x.cuota, 0);
        const sopCuota = Object.values(d.ivaSop).reduce((s, x) => s + x.cuota, 0);
        /* Las cuotas ISP (10-13) no entran: se devengan y deducen por el mismo
           importe (36-37 / 28-29), así que el 46 no cambia. Se muestran aparte. */
        const c46 = repCuota - sopCuota;
        const c110 = carryPrev + carryCur;
        const c78 = c46 > 0 ? Math.min(c110, c46) : 0;    /* compensación aplicada */
        const c78Prev = Math.min(c78, carryPrev);          /* …de la que viene de años anteriores */
        carryPrev -= c78Prev; carryCur -= c78 - c78Prev;
        const c87 = c110 - c78;                            /* saldo viejo que sigue pendiente */
        const c69 = c46 - c78;                             /* resultado (= c71 en nuestro perfil) */
        if (c46 < 0) carryCur += -c46;                     /* el negativo nuevo alimenta el 110 siguiente */
        res = { c46, c110, c78, c78Prev, c87, c69, c71: c69, pendCur: carryCur, carryNext: carryPrev + carryCur };
      }
    }
    return res;
  },

  /** Casillas del 390 (resumen anual) por tipo: régimen general devengado, adquisiciones
   *  intracomunitarias de servicios, deducible interior y deducible intracomunitario. */
  CODES390: {
    rep:    { 4: ['01', '02'], 10: ['03', '04'], 21: ['05', '06'], 0: ['700', '701'], 5: ['702', '703'] },
    ispUE:  { 4: ['545', '546'], 10: ['547', '548'], 21: ['551', '552'] },
    sop:    { 4: ['190', '191'], 10: ['603', '604'], 21: ['605', '606'], 5: ['724', '725'] },
    ispDed: { 4: ['587', '588'], 10: ['635', '636'], 21: ['637', '638'] }
  },

  /**
   * Modelo 390 del año y (perfil: régimen general, servicios, territorio común, sin
   * bienes de inversión ni prorrata). Devuelve importes por tipo y las casillas de
   * totales; la vista pone números y etiquetas. Lo que no se modela queda a 0 y a mano:
   * datos estadísticos (IAE), modificaciones de bases, bienes de inversión, prorrata.
   */
  calc390(y) {
    const qData = [0, 1, 2, 3].map(i => this.quarter(y, i));
    const add = (acc, src) => Object.entries(src).forEach(([tp, v]) => {
      if (!acc[tp]) acc[tp] = { base: 0, cuota: 0 };
      acc[tp].base += v.base; acc[tp].cuota += v.cuota;
    });
    const rep = {}, sop = {}, ispUE = {};
    let noUEBase = 0, noUECuota = 0, extUE = 0, extNoUE = 0;
    qData.forEach(d => {
      add(rep, d.ivaRep); add(sop, d.ivaSop); add(ispUE, d.ispUE.tipos);
      add(sop, d.ispNoUE.tipos);                 /* ISP no UE se deduce como interior (28/29 del 303) */
      noUEBase += d.ispNoUE.base; noUECuota += d.ispNoUE.cuota;
      extUE += d.extUE; extNoUE += d.extNoUE;
    });
    const sum = (o, k) => roundMoney(Object.values(o).reduce((s, x) => s + x[k], 0));
    const c33 = roundMoney(sum(rep, 'base') + sum(ispUE, 'base') + noUEBase);
    const c47 = roundMoney(sum(rep, 'cuota') + sum(ispUE, 'cuota') + noUECuota);   /* = 34: sin recargo de equivalencia */
    const c48 = sum(sop, 'base'), c49 = sum(sop, 'cuota');
    const c597 = sum(ispUE, 'base'), c598 = sum(ispUE, 'cuota');
    const c64 = roundMoney(c49 + c598);
    const c65 = roundMoney(c47 - c64);
    /* Resultado de las liquidaciones: lo que dijeron los cuatro 303 */
    let c85 = 0, c95 = 0, last = null;
    for (let q = 0; q < 4; q++) {
      last = this.calc303(y, q, qData);
      c85 += last.c78Prev;
      if (last.c71 > 0) c95 += last.c71;
    }
    c85 = roundMoney(c85); c95 = roundMoney(c95);
    const c86 = roundMoney(c65 - c85);
    const c97 = last.c71 < 0 ? roundMoney(-last.c71) : 0;        /* a compensar en el último periodo */
    const c662 = roundMoney(Math.max(0, last.pendCur - c97));   /* pendiente del año fuera del 97 */
    const c99 = sum(rep, 'base');
    const c108 = roundMoney(c99 + extUE + extNoUE);
    return { rep, ispUE, sop, noUE: { base: roundMoney(noUEBase), cuota: roundMoney(noUECuota) },
      c33, c47, c48, c49, c597, c598, c64, c65, c84: c65, c85, c86, c95, c97, c662,
      c99, c103: roundMoney(extUE), c110: roundMoney(extNoUE), c108,
      empty: c33 === 0 && c48 === 0 && c597 === 0 && c108 === 0 };
  }
};
