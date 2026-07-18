/* ================================================
 * TRACKR — App: Vista Dinero (ex-Gastos)
 * Ingresos, gastos, resumen financiero, trimestral
 * Globales: extiende App
 * Dependencias: app.js, utils.js, store.js, billing.js, lang.js
 * ================================================ */

Object.assign(App, {

  dinY: new Date().getFullYear(),
  dinM: new Date().getMonth(),
  dinPeriod: 'mes',

  _buildBarSegments(segs, total) {
    if (total <= 0) return '';
    return segs.map(seg => {
      const pct = (seg.total / total * 100).toFixed(1);
      return `<div class="pbar-seg" style="width:${pct}%;background:${seg.color}" data-tip="${esc(seg.nombre)}: ${fmtMoney(seg.total)}"></div>`;
    }).join('');
  },

  _segsColor(segs, fallback = 'var(--ok)') {
    if (segs.length === 1) return segs[0].color;
    if (segs.length > 1) return colorBlendOklab(segs.map(s => ({ color: s.color, weight: s.total })));
    return fallback;
  },

  _renderDedList(deds) {
    if (!deds.length) return '';
    let html = `<div class="din-ded-list" style="margin-top:.5rem">`;
    deds.forEach(d => {
      const catLabel = DEDUCIBLE_CAT[d.categoria] || d.categoria || 'Otro';
      html += `<div class="din-ded-item">`
        + `<span class="din-ded-cat">${catLabel}</span>`
        + `<span class="gas-e-date">${fmtDate(d.fecha)}</span>`
        + `<span class="din-ded-desc">${esc(d.descripcion || '')}</span>`
        + `<span class="din-ded-amount m">${fmtMoney(d.cantidad || 0)}</span>`
        + `<div class="gas-actions">`
        +   `<button class="cl-btn" onclick="App.dedModal('${d.id}')" title="${t('btn.edit')}">&#9998;</button>`
        +   `<button class="cl-btn cl-btn-del" onclick="App.delDed('${d.id}')" title="${t('btn.delete')}">&times;</button>`
        + `</div></div>`;
    });
    return html + `</div>`;
  },

  rGas() {
    this._rDinFin();
    this._rDinIngresos();
    this._rDinGastos();
    this._rDinTrim();
    this._rDinRenta();
  },

  /* ── Helpers periodo ── */
  _dinPeriodLabel() {
    const { dinPeriod: tp, dinY: y, dinM: m } = this;
    if (tp === 'mes') return `${MESES[m]} ${y}`;
    if (tp === 'trim') return `T${Math.floor(m / 3) + 1} ${y}`;
    return `${y}`;
  },
  _dinHasData(type, y, m) {
    for (const p of D.ps()) {
      for (const h of p.horas) if (h.fecha && inPeriod(h.fecha, type, y, m)) return true;
      const f = p.facturacion;
      if ((f.cobros || []).some(c => c.fecha && inPeriod(c.fecha, type, y, m))) return true;
    }
    for (const g of D.gs()) {
      for (const e of (g.entradas || [])) if (e.fecha && inPeriod(e.fecha, type, y, m)) return true;
    }
    return false;
  },
  _dinPrev() {
    if (this.dinPeriod === 'mes') { this.dinM--; if (this.dinM < 0) { this.dinM = 11; this.dinY--; } }
    else if (this.dinPeriod === 'trim') { this.dinM -= 3; if (this.dinM < 0) { this.dinM += 12; this.dinY--; } }
    else this.dinY--;
    this.rGas();
  },
  _dinNext() {
    if (this.dinPeriod === 'mes') { this.dinM++; if (this.dinM > 11) { this.dinM = 0; this.dinY++; } }
    else if (this.dinPeriod === 'trim') { this.dinM += 3; if (this.dinM > 11) { this.dinM -= 12; this.dinY++; } }
    else this.dinY++;
    this.rGas();
  },
  _dinType(t) { this.dinPeriod = t; this.rGas(); },

  /* ══════════════════════════════════════
   *  RESUMEN FINANCIERO (con navegación)
   * ══════════════════════════════════════ */
  _rDinFin() {
    const el = document.getElementById('dinFin');
    const type = this.dinPeriod, y = this.dinY, m = this.dinM;

    const { bruto, ivaTotal, gastosTotal, neto, incomeSegs, gastoSegs } = B.financialSummary(type, y, m);
    const maxBar = Math.max(bruto, gastosTotal, 1);

    const incSegsHtml = this._buildBarSegments(incomeSegs, bruto);
    const incBarWidth = (bruto / maxBar * 100).toFixed(1);

    /* OKLAB blended color for income amount text */
    let incAmtColor = this._segsColor(incomeSegs);

    const segsHtml = this._buildBarSegments(gastoSegs, gastosTotal);
    const expBarWidth = (gastosTotal / maxBar * 100).toFixed(1);

    /* nav */
    let prevY = y, prevM = m, nextY = y, nextM = m;
    if (type === 'mes') { prevM--; if (prevM < 0) { prevM = 11; prevY--; } nextM++; if (nextM > 11) { nextM = 0; nextY++; } }
    else if (type === 'trim') { prevM -= 3; if (prevM < 0) { prevM += 12; prevY--; } nextM += 3; if (nextM > 11) { nextM -= 12; nextY++; } }
    else { prevY--; nextY++; }
    const hasPrev = this._dinHasData(type, prevY, prevM);
    const hasNext = this._dinHasData(type, nextY, nextM);

    el.innerHTML =
      `<div class="din-fin">`
      + `<div class="din-fin-header">`
      +   `<span class="din-fin-period">${this._dinPeriodLabel()}</span>`
      +   `<div class="din-fin-nav">`
      +     `<button class="bt bt-s" onclick="App._dinPrev()" ${hasPrev ? '' : 'disabled'}>&larr;</button>`
      +     `<div class="info-fin-toggle">`
      +       `<button class="info-fin-tb${type === 'mes' ? ' on' : ''}" onclick="App._dinType('mes')">${t('info.month')}</button>`
      +       `<button class="info-fin-tb${type === 'trim' ? ' on' : ''}" onclick="App._dinType('trim')">${t('info.quarter')}</button>`
      +       `<button class="info-fin-tb${type === 'año' ? ' on' : ''}" onclick="App._dinType('año')">${t('info.year')}</button>`
      +     `</div>`
      +     `<button class="bt bt-s" onclick="App._dinNext()" ${hasNext ? '' : 'disabled'}>&rarr;</button>`
      +   `</div>`
      + `</div>`
      + `<div class="din-fin-body">`
      +   `<div class="fin-row">`
      +     `<span class="fin-label">${t('din.gross')}</span>`
      +     `<div class="fin-bar"><div class="pbar"><div class="pbar-fill pbar-stacked" style="width:${incBarWidth}%">${incSegsHtml}</div></div></div>`
      +     `<span class="fin-value" style="color:${incAmtColor}">${fmtMoney(bruto)}</span>`
      +   `</div>`
      + (ivaTotal > 0 ? `<div class="fin-row">`
      +     `<span class="fin-label">${t('din.vatReturn')}</span>`
      +     `<div class="fin-bar"><div class="pbar"><div class="pbar-fill" style="width:${(ivaTotal / maxBar * 100).toFixed(1)}%;background:var(--t3);opacity:.5"></div></div></div>`
      +     `<span class="fin-value" style="color:var(--t3)">-${fmtMoney(ivaTotal)}</span>`
      +   `</div>` : '')
      +   `<div class="fin-row">`
      +     `<span class="fin-label">${t('din.expenses')}</span>`
      +     `<div class="fin-bar"><div class="pbar"><div class="pbar-fill pbar-stacked" style="width:${expBarWidth}%">${segsHtml}</div></div></div>`
      +     `<span class="fin-value" style="color:var(--warn)">${fmtMoney(gastosTotal)}</span>`
      +   `</div>`
      +   `<div class="fin-sep"></div>`
      +   `<div class="fin-row fin-total">`
      +     `<span class="fin-label">${t('din.net')}</span>`
      +     `<div class="fin-bar"></div>`
      +     `<span class="fin-value" style="color:${neto >= 0 ? 'var(--ok)' : 'var(--bad)'};">${fmtMoney(neto)}</span>`
      +   `</div>`
      + `</div></div>`;
  },

  /* ══════════════════════════════════════
   *  INGRESOS DEL PERIODO
   * ══════════════════════════════════════ */
  _rDinIngresos() {
    const el = document.getElementById('dinIngresos');
    const type = this.dinPeriod, y = this.dinY, m = this.dinM;
    const ingresos = [];

    D.ps().forEach(p => {
      B.calc(p);
      const hex = colorHex(p.color);
      const f = p.facturacion;
      /* cobros por factura (parciales) */
      (f.cobros || []).forEach(c => {
        if (c.fecha && inPeriod(c.fecha, type, y, m)) {
          const tf = f.totalFactura || 0;
          const ratio = tf > 0 ? (c.cantidad / tf) : 0;
          const ivaP = (f.importeIva || 0) * ratio;
          const neto = roundMoney(c.cantidad - ivaP);
          ingresos.push({ fecha: c.fecha, monto: c.cantidad || 0, neto, proyecto: p.nombre, color: hex, tipo: 'factura' });
        }
      });
      /* cobros por hora */
      p.horas.forEach(h => {
        if (h.monto && h.fecha && inPeriod(h.fecha, type, y, m)) {
          ingresos.push({ fecha: h.fecha, monto: h.monto, neto: h.monto, proyecto: p.nombre, color: hex, tipo: 'hora' });
        }
      });
    });

    ingresos.sort((a, b) => b.fecha.localeCompare(a.fecha));

    let html = `<div class="info-section">`
      + `<div class="info-section-title">${t('din.incomeTitle')}</div>`;
    if (!ingresos.length) {
      html += `<div class="din-empty">${t('din.noIncome')}</div>`;
    } else {
      html += `<div class="hl">`;
      ingresos.forEach(i => {
        const showBoth = i.monto !== i.neto;
        html += `<div class="hr" style="border-left-color:${i.color}">`
          + `<span class="hr-d">${fmtDate(i.fecha)}</span>`
          + `<span style="color:var(--t1);font-size:.82rem;flex:1">${esc(i.proyecto)}</span>`
          + (showBoth ? `<span style="color:var(--t3);font-family:'DM Mono',monospace;font-size:.72rem;text-decoration:line-through;margin-right:.3rem">${fmtMoney(i.monto)}</span>` : '')
          + `<span style="color:var(--ok);font-family:'DM Mono',monospace;font-size:.82rem">${fmtMoney(showBoth ? i.neto : i.monto)}</span>`
          + `</div>`;
      });
      html += `</div>`;
    }
    html += `</div>`;
    el.innerHTML = html;
  },

  /* ══════════════════════════════════════
   *  GASTOS DEL PERIODO (tarjetas existentes)
   * ══════════════════════════════════════ */
  _rDinGastos() {
    const el = document.getElementById('dinGastos');
    const gastos = D.gs();
    const type = this.dinPeriod, y = this.dinY, m = this.dinM;

    let html = `<div class="info-section">`
      + `<div class="din-gastos-header">`
      +   `<span class="info-section-title" style="margin-bottom:0">${t('din.expensesTitle')}</span>`
      +   `<button class="bt bt-s" onclick="App.gModal()">+ ${t('gas.newExpense')}</button>`
      + `</div>`;

    if (!gastos.length) {
      html += `<div class="din-empty">${t('gas.noExpenses')}</div>`;
    } else {
      html += '<div class="gas-list">';
      gastos.forEach(g => {
        const entries = (g.entradas || []).filter(e => e.fecha && inPeriod(e.fecha, type, y, m));
        const total = entries.reduce((s, e) => s + (e.total || e.cantidad || 0), 0);
        const catLabel = GASTO_CAT[g.categoria] || g.categoria || 'Otro';
        const gHex = colorHex(g.color || 'Salmon');
        const isPuntual = !g.recurrente || g.recurrente === 'no';
        /* Ocultar puntuales sin entradas en este periodo */
        if (isPuntual && !entries.length) return;
        /* Ocultar recurrentes finalizados en periodos posteriores */
        if (g.finHasta && !isPuntual && !entries.length) {
          const [fy, fm] = g.finHasta.split('-').map(Number);
          const periodStart = type === 'mes' ? (y * 12 + m) : type === 'trim' ? (y * 12 + Math.floor(m / 3) * 3) : (y * 12);
          const finMonth = (fy * 12 + (fm - 1));
          if (periodStart > finMonth) return;
        }
        const badges = `<div class="gas-badges"><span class="gas-cat">${catLabel}</span>`
          + (isPuntual ? '' : `<span class="gas-rec">${RECURRENCIA[g.recurrente]}</span>`)
          + `${g.desgravable ? `<span class="gas-ded">${t('gas.deductibleBadge')}</span>` : ''}`
          + `${g.finHasta ? `<span class="gas-fin">FIN ${g.finHasta.substring(5)}/${g.finHasta.substring(0, 4)}</span>` : ''}</div>`;
        if (isPuntual) {
          const e0 = entries[0];
          html += `<div class="gas-card" style="border-left:3px solid ${gHex}"><div class="gas-header">`
            + `<span class="gas-name">${esc(g.nombre)}</span>${badges}`
            + `<span class="gas-total m">${fmtMoney(e0?.total ?? e0?.cantidad ?? 0)}</span>`
            + `<span class="gas-date-info">${fmtDate(e0.fecha)}</span>`
            + `<div class="gas-actions"><button class="cl-btn" onclick="App.gModal('${g.id}')" title="${t('btn.edit')}">&#9998;</button><button class="cl-btn cl-btn-del" onclick="App.delG('${g.id}')" title="${t('btn.delete')}">&times;</button></div>`
            + `</div></div>`;
        } else {
          const count = entries.length;
          /* Detectar si falta entrada en el mes actual (solo para recurrente mensual, periodo mes, mes actual) */
          const now = new Date();
          const isMonthly = g.recurrente === 'mensual';
          const isCurrentMonth = type === 'mes' && y === now.getFullYear() && m === now.getMonth();
          const isPaused = g.finHasta && (() => { const [fy, fm] = g.finHasta.split('-').map(Number); return (y * 12 + m) >= (fy * 12 + (fm - 1)); })();
          const needsThisMonth = isMonthly && isCurrentMonth && !isPaused && !entries.length;
          const cardCls = needsThisMonth ? 'gas-card gas-card-pending' : 'gas-card';
          const pendBadge = needsThisMonth ? ` <span class="gas-pend" title="${t('gas.missingThisMonth')}">&#9888;</span>` : '';
          const quickBtn = needsThisMonth
            ? `<button class="cl-btn gas-quick" onclick="event.stopPropagation();App.quickAddRecurring('${g.id}')" title="${t('gas.thisMonth')}">+ ${t('gas.thisMonthShort')}</button>`
            : '';
          html += `<div class="${cardCls}" style="border-left:3px solid ${gHex}"><div class="gas-header gas-expandable" onclick="this.classList.toggle('expanded');this.nextElementSibling.classList.toggle('open')">`
            + `<span class="gas-chevron">&#9656;</span><span class="gas-name">${esc(g.nombre)}${pendBadge}</span>${badges}`
            + `<span class="gas-total m">${fmtMoney(total)}</span><span class="gas-count">${count} ${t('gas.entries')}</span>`
            + `<div class="gas-actions">${quickBtn}<button class="cl-btn" onclick="event.stopPropagation();App.gModal('${g.id}')" title="${t('btn.edit')}">&#9998;</button><button class="cl-btn cl-btn-del" onclick="event.stopPropagation();App.delG('${g.id}')" title="${t('btn.delete')}">&times;</button></div>`
            + `</div><div class="gas-body">`;
          if (entries.length) {
            entries.sort((a, b) => (b.fecha || '').localeCompare(a.fecha || '')).forEach(e => {
              html += `<div class="gas-entry"><span class="gas-e-date">${fmtDate(e.fecha)}</span><span class="gas-e-amount m">${fmtMoney(e.total || e.cantidad || 0)}</span><span class="gas-e-nota">${esc(e.nota || '')}</span><button class="gas-e-edit" onclick="App.geModal('${g.id}','${e.id}')" title="${t('btn.edit')}">&#9998;</button><button class="gas-e-del" onclick="App.delGE('${g.id}','${e.id}')" title="${t('btn.delete')}">&times;</button></div>`;
            });
          }
          html += `<button class="bt bt-add" style="margin-top:.5rem" onclick="App.geModal('${g.id}')">${t('btn.addEntry')}</button></div></div>`;
        }
      });
      html += '</div>';
    }
    html += `</div>`;
    el.innerHTML = html;
  },

  /* ══════════════════════════════════════
   *  RESUMEN TRIMESTRAL (Modelo 303/130)
   *  Referencia de casillas: TODO/20-modelos-fiscales-casillas.md
   * ══════════════════════════════════════ */

  /** Config fiscal del usuario con defaults (schema en store.ensure) */
  _fiscalCfg() {
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
  _fiscalQ(y, q) {
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
          if (!ivaSop[tipo]) ivaSop[tipo] = { base: 0, cuota: 0 };
          ivaSop[tipo].base += baseSum;
          ivaSop[tipo].cuota += ivaSum;
          gastos += baseSum;
        } else {
          /* Proveedor extranjero, factura sin IVA español → ISP: se autoliquida la
             cuota al tipo del gasto (general si el usuario dejó 0%). Un impuesto
             extranjero tecleado en `iva` no es deducible en el 303 → cuenta como
             coste en IRPF junto con la base. */
          const rate = [21, 10, 4].includes(tipo) ? tipo : 21;
          const isp = zona === 'ue' ? ispUE : ispNoUE;
          isp.base += baseSum;
          isp.cuota += roundMoney(baseSum * rate / 100);
          gastos += baseSum + ivaSum;
        }
      }
    });
    const deds = D.deds().filter(d => d.fecha && inPeriod(d.fecha, 'trim', y, m));
    gastos += deds.reduce((s, d) => s + (d.cantidad || 0), 0);
    return { ivaRep, ivaSop, ingresos, gastos, retenciones, deds, sinFecha, extUE, extNoUE, ispUE, ispNoUE };
  },

  /** Primer año con datos fiscales (para el arrastre de saldo IVA) */
  _fiscalFirstYear() {
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
  _calc130Year(y, uptoQ, qData) {
    const cfg = this._fiscalCfg();
    /* Casilla 13: minoración art. 110.3.c RIRPF según rendimiento neto del año anterior */
    const rn = cfg.rendAnterior;
    const minor = rn == null ? 0 : rn <= 9000 ? 100 : rn <= 10000 ? 75 : rn <= 11000 ? 50 : rn <= 12000 ? 25 : 0;
    const out = [];
    let acumIng = 0, acumGas = 0, acumRet = 0, pendNeg = 0;
    for (let q = 0; q <= uptoQ; q++) {
      const d = (qData && qData[q]) || this._fiscalQ(y, q);
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
  _calc303(y, q, qDataOfY) {
    const cfg = this._fiscalCfg();
    let carry = cfg.saldoIvaInicial;
    const first = this._fiscalFirstYear() ?? y;
    let res = null;
    for (let yy = Math.min(first, y); yy <= y; yy++) {
      const lastQ = yy === y ? q : 3;
      for (let qq = 0; qq <= lastQ; qq++) {
        const d = (yy === y && qDataOfY && qDataOfY[qq]) || this._fiscalQ(yy, qq);
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
  },

  _rDinTrim() {
    const el = document.getElementById('dinTrim');
    const y = this.dinY, m = this.dinM;
    const isYear = this.dinPeriod === 'año';
    const q = isYear ? 3 : Math.floor(m / 3);

    /* Trimestres del año hasta el visible (el 130 es acumulativo) */
    const qData = [];
    for (let i = 0; i <= q; i++) qData.push(this._fiscalQ(y, i));
    const dQ = qData[q];
    const sinFecha = [...new Set(dQ.sinFecha)];

    const r130 = this._calc130Year(y, q, qData);
    const t130 = r130[q];
    const t303 = this._calc303(y, q, qData);

    /* Vista año: devengado/soportado agregados (informativo, estilo 390) */
    let ivaRep, ivaSop, extUE, extNoUE, ispUE, ispNoUE;
    if (isYear) {
      ivaRep = {}; ivaSop = {};
      extUE = 0; extNoUE = 0;
      ispUE = { base: 0, cuota: 0 }; ispNoUE = { base: 0, cuota: 0 };
      qData.forEach(d => {
        Object.entries(d.ivaRep).forEach(([tp, v]) => {
          if (!ivaRep[tp]) ivaRep[tp] = { base: 0, cuota: 0 };
          ivaRep[tp].base += v.base; ivaRep[tp].cuota += v.cuota;
        });
        Object.entries(d.ivaSop).forEach(([tp, v]) => {
          if (!ivaSop[tp]) ivaSop[tp] = { base: 0, cuota: 0 };
          ivaSop[tp].base += v.base; ivaSop[tp].cuota += v.cuota;
        });
        extUE += d.extUE; extNoUE += d.extNoUE;
        ispUE.base += d.ispUE.base; ispUE.cuota += d.ispUE.cuota;
        ispNoUE.base += d.ispNoUE.base; ispNoUE.cuota += d.ispNoUE.cuota;
      });
    } else {
      ivaRep = dQ.ivaRep; ivaSop = dQ.ivaSop;
      extUE = dQ.extUE; extNoUE = dQ.extNoUE;
      ispUE = dQ.ispUE; ispNoUE = dQ.ispNoUE;
    }
    const iva303Year = isYear ? qData.reduce((s, d) =>
      s + Object.values(d.ivaRep).reduce((a, x) => a + x.cuota, 0)
        - Object.values(d.ivaSop).reduce((a, x) => a + x.cuota, 0), 0) : 0;

    const qLabel = isYear ? `${y}` : `T${q + 1} ${y}`;
    const dedsShown = isYear ? qData.flatMap(d => d.deds) : dQ.deds;
    const dedsHtml = this._renderDedList(dedsShown);

    /* Stash datos para botones copiar */
    this._lastTrimData = { label: qLabel, isYear, q, ivaRep, ivaSop, iva303Year, t303, t130, extUE, extNoUE, ispUE, ispNoUE };

    /* Render casillas 303 — numeración oficial: 4% → 01-03, 10% → 04-06, 21% → 07-09, 0% → 150-152 */
    const codes303 = { 4: ['01', '02', '03'], 10: ['04', '05', '06'], 21: ['07', '08', '09'], 0: ['150', '151', '152'] };
    const tiposRep = Object.keys(ivaRep).map(Number).sort((a, b) => b - a);
    const hayISP = ispUE.base > 0 || ispNoUE.base > 0;
    const hayExt = extUE > 0 || extNoUE > 0;
    let html303 = '';
    if (!tiposRep.length && !Object.keys(ivaSop).length && !(t303.c110 > 0) && !hayISP && !hayExt) {
      html303 = `<div style="font-size:.78rem;color:var(--t3);padding:.5rem 0">${t('din.noInvoicesThisPeriod')}</div>`;
    } else {
      tiposRep.forEach(tipo => {
        const c = codes303[tipo] || ['—', '—', '—'];
        const d = ivaRep[tipo];
        html303 += `<div class="casilla-row"><span class="casilla-num">${c[0]}</span><span class="casilla-label">${t('din.taxBase')} ${tipo}%</span><span class="casilla-val">${fmtMoney(d.base)}</span></div>`;
        html303 += `<div class="casilla-row"><span class="casilla-num">${c[1]}</span><span class="casilla-label">${t('din.vatRate')}</span><span class="casilla-val">${tipo} %</span></div>`;
        html303 += `<div class="casilla-row"><span class="casilla-num">${c[2]}</span><span class="casilla-label">${t('din.vatChargedAmt')}</span><span class="casilla-val">${fmtMoney(d.cuota)}</span></div>`;
      });
      /* ISP devengado: intracomunitarias 10/11, proveedores no UE 12/13 */
      if (ispUE.base > 0) {
        html303 += `<div class="casilla-row"><span class="casilla-num">10</span><span class="casilla-label">${t('din.intraBase')}</span><span class="casilla-val">${fmtMoney(ispUE.base)}</span></div>`;
        html303 += `<div class="casilla-row"><span class="casilla-num">11</span><span class="casilla-label">${t('din.intraCuota')}</span><span class="casilla-val">${fmtMoney(ispUE.cuota)}</span></div>`;
      }
      if (ispNoUE.base > 0) {
        html303 += `<div class="casilla-row"><span class="casilla-num">12</span><span class="casilla-label">${t('din.ispNoUEBase')}</span><span class="casilla-val">${fmtMoney(ispNoUE.base)}</span></div>`;
        html303 += `<div class="casilla-row"><span class="casilla-num">13</span><span class="casilla-label">${t('din.ispNoUECuota')}</span><span class="casilla-val">${fmtMoney(ispNoUE.cuota)}</span></div>`;
      }
      /* IVA soportado corriente: base 28, cuota 29 — la ISP de proveedores no UE
         (12/13) se deduce aquí; la intracomunitaria (10/11) en 36/37 */
      const baseSopTot = Object.values(ivaSop).reduce((s, x) => s + x.base, 0) + ispNoUE.base;
      const cuotaSopTot = Object.values(ivaSop).reduce((s, x) => s + x.cuota, 0) + ispNoUE.cuota;
      if (baseSopTot > 0) {
        html303 += `<div class="casilla-row casilla-sep"><span class="casilla-num">28</span><span class="casilla-label">${t('din.inputBase')}</span><span class="casilla-val">${fmtMoney(baseSopTot)}</span></div>`;
        html303 += `<div class="casilla-row"><span class="casilla-num">29</span><span class="casilla-label">${t('din.inputVat')}</span><span class="casilla-val">${fmtMoney(cuotaSopTot)}</span></div>`;
      }
      if (ispUE.base > 0) {
        html303 += `<div class="casilla-row"><span class="casilla-num">36</span><span class="casilla-label">${t('din.intraDedBase')}</span><span class="casilla-val">${fmtMoney(ispUE.base)}</span></div>`;
        html303 += `<div class="casilla-row"><span class="casilla-num">37</span><span class="casilla-label">${t('din.intraDedCuota')}</span><span class="casilla-val">${fmtMoney(ispUE.cuota)}</span></div>`;
      }
      if (isYear) {
        html303 += `<div class="casilla-row casilla-result"><span class="casilla-num">&Sigma;46</span><span class="casilla-label">${t('din.result46')}</span><span class="casilla-val" style="color:${iva303Year > 0 ? 'var(--warn)' : 'var(--ok)'}">${fmtMoney(iva303Year)}</span></div>`;
      } else {
        html303 += `<div class="casilla-row casilla-sep"><span class="casilla-num">46</span><span class="casilla-label">${t('din.result46')}</span><span class="casilla-val">${fmtMoney(t303.c46)}</span></div>`;
        if (t303.c110 > 0) {
          html303 += `<div class="casilla-row"><span class="casilla-num">110</span><span class="casilla-label">${t('din.prevBalance')}</span><span class="casilla-val">${fmtMoney(t303.c110)}</span></div>`;
          if (t303.c78 > 0) html303 += `<div class="casilla-row"><span class="casilla-num">78</span><span class="casilla-label">${t('din.compApplied')}</span><span class="casilla-val">&minus;${fmtMoney(t303.c78)}</span></div>`;
          if (t303.c87 > 0) html303 += `<div class="casilla-row"><span class="casilla-num">87</span><span class="casilla-label">${t('din.compPending')}</span><span class="casilla-val">${fmtMoney(t303.c87)}</span></div>`;
        }
        if (t303.c71 >= 0) {
          html303 += `<div class="casilla-row casilla-result"><span class="casilla-num">71</span><span class="casilla-label">${t('din.toPay')}</span><span class="casilla-val" style="color:${t303.c71 > 0 ? 'var(--warn)' : 'var(--ok)'}">${fmtMoney(t303.c71)}</span></div>`;
        } else {
          html303 += `<div class="casilla-row casilla-result"><span class="casilla-num">72</span><span class="casilla-label">${t('din.toCompensate')}</span><span class="casilla-val" style="color:var(--ok)">${fmtMoney(-t303.c71)}</span></div>`;
        }
      }
      /* Informativas (no suman al resultado) */
      if (hayExt) {
        html303 += `<div style="font-size:.7rem;color:var(--t3);margin:.4rem 0 .1rem">${t('din.infoTitle')}</div>`;
        if (extUE > 0) html303 += `<div class="casilla-row"><span class="casilla-num">59</span><span class="casilla-label">${t('din.box59')}</span><span class="casilla-val">${fmtMoney(extUE)}</span></div>`;
        if (extNoUE > 0) html303 += `<div class="casilla-row"><span class="casilla-num">120</span><span class="casilla-label">${t('din.box120')}</span><span class="casilla-val">${fmtMoney(extNoUE)}</span></div>`;
      }
      /* Operaciones intracomunitarias (ventas 59 o compras 10/11) → también van al 349 */
      if (extUE > 0 || ispUE.base > 0) {
        html303 += `<div style="font-size:.7rem;color:var(--warn);margin-top:.4rem">&#9888; ${t('din.aviso349')}</div>`;
      }
    }

    /* Render casillas 130 — acumulativo del año */
    let html130 = '';
    if (t130.c01 === 0 && t130.c02 === 0) {
      html130 = `<div style="font-size:.78rem;color:var(--t3);padding:.5rem 0">${t('din.noInvoicesThisPeriod')}</div>`;
    } else {
      const row130 = (num, label, val, extra = '', style = '') =>
        `<div class="casilla-row${extra}"><span class="casilla-num">${num}</span><span class="casilla-label">${label}</span><span class="casilla-val"${style}>${val}</span></div>`;
      html130 += `<div style="font-size:.7rem;color:var(--t3);margin-bottom:.35rem">${t('din.cumulativeNote')}</div>`;
      html130 += row130('01', t('din.income'), fmtMoney(t130.c01));
      html130 += row130('02', t('din.deductibleExp'), fmtMoney(t130.c02));
      if (t130.dj > 0) html130 += `<div style="font-size:.7rem;color:var(--t3);margin:-.15rem 0 .2rem">${t('din.hardToJustify', fmtMoney(t130.dj))}</div>`;
      html130 += row130('03', t('din.netProfit'), fmtMoney(t130.c03));
      html130 += row130('04', t('din.twentyPercent'), fmtMoney(t130.c04));
      if (t130.c05 > 0) html130 += row130('05', t('din.prevPayments'), '&minus;' + fmtMoney(t130.c05));
      html130 += row130('06', t('din.withholdings'), '&minus;' + fmtMoney(t130.c06));
      if (t130.c13 > 0) html130 += row130('13', t('din.minoracion'), '&minus;' + fmtMoney(t130.c13));
      if (t130.c15 > 0) html130 += row130('15', t('din.prevNegatives'), '&minus;' + fmtMoney(t130.c15));
      const label19 = t130.c19 >= 0 ? t('din.toPay') : (q < 3 ? t('din.toDeduct') : t('din.negativeQ4'));
      const color19 = t130.c19 > 0 ? 'var(--warn)' : 'var(--ok)';
      html130 += row130('19', label19, fmtMoney(Math.abs(t130.c19)), ' casilla-result', ` style="color:${color19}"`);
    }

    const warnHtml = sinFecha.length
      ? `<div class="din-trim-warn">&#9888; ${t('din.missingDateWarn', sinFecha.length)} <span class="small" style="color:var(--t3);margin-left:.3rem">${sinFecha.slice(0, 3).map(esc).join(', ')}${sinFecha.length > 3 ? '…' : ''}</span></div>`
      : '';

    el.innerHTML =
      `<div class="info-section">`
      + `<div class="din-gastos-header">`
      +   `<span class="info-section-title" style="margin-bottom:0">${t('din.taxSummary')} — ${qLabel}</span>`
      +   `<button class="bt bt-s" onclick="App.dedModal()">+ ${t('renta.addDeduction')}</button>`
      + `</div>`
      + warnHtml
      + `<div class="din-trim-grid">`
      +   `<div class="din-trim-card">`
      +     `<div class="din-trim-title">${t('din.model303')}</div>`
      +     html303
      +     `<div class="din-trim-actions"><button class="bt bt-s" onclick="App.copyTrim303()" title="${t('din.copyBoxes')}">&#128203; ${t('din.copyBoxes')}</button></div>`
      +   `</div>`
      +   `<div class="din-trim-card">`
      +     `<div class="din-trim-title">${t('din.model130')}</div>`
      +     html130
      +     `<div class="din-trim-actions"><button class="bt bt-s" onclick="App.copyTrim130()" title="${t('din.copyBoxes')}">&#128203; ${t('din.copyBoxes')}</button></div>`
      +   `</div>`
      + `</div>`
      + dedsHtml
      + `</div>`;
  },

  /** Copia las casillas del 303 al portapapeles en formato leíble */
  copyTrim303() {
    const d = this._lastTrimData;
    if (!d) return;
    const lines = [`Modelo 303 — ${d.label}`];
    const codes = { 4: ['01','02','03'], 10: ['04','05','06'], 21: ['07','08','09'], 0: ['150','151','152'] };
    const tipos = Object.keys(d.ivaRep).map(Number).sort((a,b)=>b-a);
    tipos.forEach(tipo => {
      const c = codes[tipo] || ['—','—','—'];
      const r = d.ivaRep[tipo];
      lines.push(`${c[0]}  Base ${tipo}%: ${fmtMoney(r.base)}`);
      lines.push(`${c[1]}  Tipo: ${tipo} %`);
      lines.push(`${c[2]}  Cuota: ${fmtMoney(r.cuota)}`);
    });
    if (d.ispUE.base > 0) {
      lines.push(`10  Adquis. intracomunitarias (base): ${fmtMoney(d.ispUE.base)}`);
      lines.push(`11  Adquis. intracomunitarias (cuota): ${fmtMoney(d.ispUE.cuota)}`);
    }
    if (d.ispNoUE.base > 0) {
      lines.push(`12  ISP proveedores no UE (base): ${fmtMoney(d.ispNoUE.base)}`);
      lines.push(`13  ISP proveedores no UE (cuota): ${fmtMoney(d.ispNoUE.cuota)}`);
    }
    const baseSop = Object.values(d.ivaSop).reduce((s,x)=>s+x.base,0) + d.ispNoUE.base;
    const cuoSop = Object.values(d.ivaSop).reduce((s,x)=>s+x.cuota,0) + d.ispNoUE.cuota;
    if (baseSop > 0) {
      lines.push(`28  Base IVA soportado: ${fmtMoney(baseSop)}`);
      lines.push(`29  Cuota IVA soportado: ${fmtMoney(cuoSop)}`);
    }
    if (d.ispUE.base > 0) {
      lines.push(`36  Adquis. intracomunitarias deducibles (base): ${fmtMoney(d.ispUE.base)}`);
      lines.push(`37  Adquis. intracomunitarias deducibles (cuota): ${fmtMoney(d.ispUE.cuota)}`);
    }
    if (d.isYear) {
      lines.push(`Σ46 Resultado del año: ${fmtMoney(d.iva303Year)}`);
    } else {
      const t3 = d.t303;
      lines.push(`46  Resultado régimen general: ${fmtMoney(t3.c46)}`);
      if (t3.c110 > 0) {
        lines.push(`110 Saldo de periodos anteriores: ${fmtMoney(t3.c110)}`);
        if (t3.c78 > 0) lines.push(`78  Compensado este periodo: ${fmtMoney(t3.c78)}`);
        if (t3.c87 > 0) lines.push(`87  Pendiente para periodos siguientes: ${fmtMoney(t3.c87)}`);
      }
      lines.push(t3.c71 >= 0 ? `71  A ingresar: ${fmtMoney(t3.c71)}` : `72  A compensar: ${fmtMoney(-t3.c71)}`);
    }
    if (d.extUE > 0) lines.push(`59  Servicios a clientes UE (informativa): ${fmtMoney(d.extUE)}`);
    if (d.extNoUE > 0) lines.push(`120 Servicios fuera de la UE (informativa): ${fmtMoney(d.extNoUE)}`);
    if (d.extUE > 0 || d.ispUE.base > 0) lines.push(`⚠ Operaciones intracomunitarias: recuerda el modelo 349 (requiere NIF-IVA/ROI)`);
    this._copyToClipboard(lines.join('\n'));
  },

  /** Copia las casillas del 130 al portapapeles */
  copyTrim130() {
    const d = this._lastTrimData;
    if (!d) return;
    const c = d.t130;
    const lines = [`Modelo 130 — ${d.label} (acumulado desde el 1 de enero)`,
      `01  Ingresos: ${fmtMoney(c.c01)}`,
      `02  Gastos deducibles: ${fmtMoney(c.c02)}` + (c.dj > 0 ? ` (incluye ${fmtMoney(c.dj)} del 5% de difícil justificación)` : ''),
      `03  Rendimiento neto: ${fmtMoney(c.c03)}`,
      `04  20%: ${fmtMoney(c.c04)}`,
      `05  Pagos fraccionados anteriores: ${fmtMoney(c.c05)}`,
      `06  Retenciones: ${fmtMoney(c.c06)}`,
      `07  Pago fraccionado previo: ${fmtMoney(c.c07)}`
    ];
    if (c.c13 > 0) lines.push(`13  Minoración rendimientos bajos: ${fmtMoney(c.c13)}`);
    if (c.c15 > 0) lines.push(`15  Negativos de trimestres anteriores: ${fmtMoney(c.c15)}`);
    lines.push(`19  ${c.c19 >= 0 ? 'A ingresar' : (d.q < 3 ? 'A deducir en próximos trimestres' : 'Negativa (se recupera en la Renta)')}: ${fmtMoney(Math.abs(c.c19))}`);
    this._copyToClipboard(lines.join('\n'));
  },

  /** Helper de portapapeles con fallback */
  _copyToClipboard(text) {
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(text).then(() => Toast.ok(t('din.copied')));
    } else {
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand('copy'); Toast.ok(t('din.copied')); } catch { Toast.warn('Copy failed'); }
      document.body.removeChild(ta);
    }
  },

  /* ══════════════════════════════════════
   *  RENTA (Modelo 100, apartado D1 — estimación directa)
   *  Mismo criterio que el trimestral: devengo, bases sin IVA.
   * ══════════════════════════════════════ */
  _rDinRenta() {
    const el = document.getElementById('dinRenta');
    const y = this.dinY;
    const cfg = this._fiscalCfg();

    const qData = [0, 1, 2, 3].map(q => this._fiscalQ(y, q));
    const ingresos = qData.reduce((s, d) => s + d.ingresos, 0);          /* → 0171/0180 */
    const gastos = qData.reduce((s, d) => s + d.gastos, 0);              /* → 0218 (deducciones incluidas) */
    const dif = ingresos - gastos;                                       /* 0221 */
    const dj = cfg.eds ? Math.min(0.05 * Math.max(dif, 0), 2000) : 0;    /* 0222 */
    const rendimiento = dif - dj;                                        /* 0224 */
    const ret599 = qData.reduce((s, d) => s + d.retenciones, 0);         /* 0599 */
    const pf604 = this._calc130Year(y, 3, qData)
      .reduce((s, c) => s + Math.max(c.c19, 0), 0);                      /* 0604 */
    const deds = qData.flatMap(d => d.deds);

    /* Desglose del 0218 por casilla de destino del D1 (Renta Web pide los gastos
       repartidos, no un total). Mapeo por categoría; lo no mapeado → 0202 "otros
       servicios exteriores". Mismo criterio de importe que _fiscalQ: base para
       proveedores ES, base+iva para extranjeros (su impuesto no es deducible en 303). */
    const GASTO_R = { cotizacion: '0186', suministros: '0194', gestoria: '0199', seguros: '0200', amortizacion: '0208' };
    const DED_R = { autonomos: '0186', alquiler: '0192', suministros: '0194', asesoria: '0199', seguros: '0200', amortizacion: '0208' };
    const porCasilla = {};
    const addC = (cas, amt) => { if (amt > 0) porCasilla[cas] = (porCasilla[cas] || 0) + amt; };
    D.gs().forEach(g => {
      if (!g.desgravable) return;
      let base = 0, iva = 0;
      (g.entradas || []).forEach(e => {
        if (e.fecha && +e.fecha.slice(0, 4) === y) { base += e.base || 0; iva += e.iva || 0; }
      });
      addC(GASTO_R[g.categoria] || '0202', (g.zonaFiscal || 'es') === 'es' ? base : base + iva);
    });
    deds.forEach(dd => addC(DED_R[dd.categoria] || '0202', dd.cantidad || 0));

    const rowR = (num, label, val, total = false) =>
      `<div class="din-tax-row${total ? ' din-tax-total' : ''}"><span><span class="casilla-num" style="margin-right:.4rem">${num}</span>${label}</span><span class="m">${val}</span></div>`;

    let html = `<div class="info-section">`
      + `<div class="din-gastos-header">`
      +   `<span class="info-section-title" style="margin-bottom:0">${t('renta.title')} — ${y}</span>`
      +   `<button class="bt bt-s" onclick="App.dedModal()">+ ${t('renta.addDeduction')}</button>`
      + `</div>`
      + `<div class="din-trim-card" style="margin-top:.75rem">`
      +   `<div style="font-size:.7rem;color:var(--t3);margin-bottom:.35rem">${t('renta.devengoNote')}</div>`
      +   rowR('0171', t('renta.annualIncome'), fmtMoney(ingresos))
      +   ['0186', '0192', '0194', '0199', '0200', '0202', '0208']
            .filter(cas => porCasilla[cas])
            .map(cas => rowR(cas, t('renta.c' + cas), fmtMoney(porCasilla[cas])))
            .join('')
      +   (porCasilla['0194'] ? `<div style="font-size:.7rem;color:var(--t3);margin:-.15rem 0 .2rem">${t('renta.suministrosNote')}</div>` : '')
      +   rowR('0218', t('renta.businessExpenses'), fmtMoney(gastos))
      +   rowR('0221', t('renta.diff'), fmtMoney(dif))
      +   (dj > 0 ? rowR('0222', t('renta.dj'), '&minus;' + fmtMoney(dj)) : '')
      +   rowR('0224', t('renta.activityProfit'), fmtMoney(rendimiento), true)
      + `</div>`
      + `<div class="din-trim-card" style="margin-top:.75rem">`
      +   rowR('0599', t('renta.withhold599'), fmtMoney(ret599))
      +   rowR('0604', t('renta.pf604'), fmtMoney(pf604))
      + `</div>`;

    const dedListHtml = this._renderDedList(deds);
    if (dedListHtml) {
      html += `<div style="font-size:.72rem;color:var(--t3);margin-top:.75rem">${t('renta.dedsIncluded')}</div>` + dedListHtml;
    } else {
      html += `<div class="din-empty" style="margin-top:.5rem">${t('renta.noDeductions')}</div>`;
    }
    html += `</div>`;

    el.innerHTML = html;
  },

  dedModal(dedId) {
    const isE = !!dedId, d = isE ? D.ded(dedId) : null;
    this.om(`<div class="mt">${isE ? t('renta.editDeduction') : t('renta.addDeduction')}</div>`
      + `<div class="fr"><div class="fg"><label>${t('field.category')}</label><select id="dedCat">${Object.entries(DEDUCIBLE_CAT).map(([k, v]) => `<option value="${k}" ${d?.categoria === k ? 'selected' : ''}>${v}</option>`).join('')}</select></div>`
      + `<div class="fg"><label>${t('field.amountEntry')}</label><input type="number" id="dedA" min="0.01" step="0.01" value="${d?.cantidad || ''}" placeholder="0,00"></div></div>`
      + `<div class="fr"><div class="fg"><label>${t('field.date')}</label><input type="date" id="dedF" value="${d?.fecha || todayStr()}"></div>`
      + `<div class="fg"><label>${t('field.note')}</label><input type="text" id="dedD" value="${esc(d?.descripcion || '')}" placeholder="${t('ph.detail')}"></div></div>`
      + `<div class="ma"><button class="bt" onclick="App.cm()">${t('btn.cancel')}</button><button class="bt bt-p" onclick="App.saveDed('${dedId || ''}')">${isE ? t('btn.save') : t('btn.add')}</button></div>`);
  },

  saveDed(dedId) {
    const cant = parseFloat(document.getElementById('dedA').value) || 0;
    if (cant <= 0) return;
    const data = {
      categoria: document.getElementById('dedCat').value,
      descripcion: document.getElementById('dedD').value.trim(),
      cantidad: cant,
      fecha: document.getElementById('dedF').value || todayStr()
    };
    if (dedId) D.upDed(dedId, data);
    else { data.id = uid(); D.addDed(data); }
    this.cm(); this.rGas();
  },

  delDed(dedId) {
    const d = D.ded(dedId);
    if (!d) return;
    const label = d.descripcion || DEDUCIBLE_CAT[d.categoria] || d.categoria;
    if (!confirm(t('renta.deleteConfirm', label))) return;
    D.delDed(dedId);
    this.rGas();
  },


});
