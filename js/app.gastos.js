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
    let incAmtColor = 'var(--ok)';
    if (incomeSegs.length === 1) {
      incAmtColor = incomeSegs[0].color;
    } else if (incomeSegs.length > 1) {
      incAmtColor = colorBlendOklab(incomeSegs.map(s => ({ color: s.color, weight: s.total })));
    }

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
        const total = entries.reduce((s, e) => s + (e.cantidad || 0), 0);
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
            + `<span class="gas-total m">${fmtMoney(e0?.cantidad || 0)}</span>`
            + `<span class="gas-date-info">${fmtDate(e0.fecha)}</span>`
            + `<div class="gas-actions"><button class="cl-btn" onclick="App.gModal('${g.id}')" title="${t('btn.edit')}">&#9998;</button><button class="cl-btn cl-btn-del" onclick="App.delG('${g.id}')" title="${t('btn.delete')}">&times;</button></div>`
            + `</div></div>`;
        } else {
          const count = entries.length;
          html += `<div class="gas-card" style="border-left:3px solid ${gHex}"><div class="gas-header gas-expandable" onclick="this.classList.toggle('expanded');this.nextElementSibling.classList.toggle('open')">`
            + `<span class="gas-chevron">&#9656;</span><span class="gas-name">${esc(g.nombre)}</span>${badges}`
            + `<span class="gas-total m">${fmtMoney(total)}</span><span class="gas-count">${count} ${t('gas.entries')}</span>`
            + `<div class="gas-actions"><button class="cl-btn" onclick="event.stopPropagation();App.gModal('${g.id}')" title="${t('btn.edit')}">&#9998;</button><button class="cl-btn cl-btn-del" onclick="event.stopPropagation();App.delG('${g.id}')" title="${t('btn.delete')}">&times;</button></div>`
            + `</div><div class="gas-body">`;
          if (entries.length) {
            entries.sort((a, b) => (b.fecha || '').localeCompare(a.fecha || '')).forEach(e => {
              html += `<div class="gas-entry"><span class="gas-e-date">${fmtDate(e.fecha)}</span><span class="gas-e-amount m">${fmtMoney(e.cantidad || 0)}</span><span class="gas-e-nota">${esc(e.nota || '')}</span><button class="gas-e-edit" onclick="App.geModal('${g.id}','${e.id}')" title="${t('btn.edit')}">&#9998;</button><button class="gas-e-del" onclick="App.delGE('${g.id}','${e.id}')" title="${t('btn.delete')}">&times;</button></div>`;
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
   * ══════════════════════════════════════ */
  _rDinTrim() {
    const el = document.getElementById('dinTrim');
    const y = this.dinY, m = this.dinM;
    const type = this.dinPeriod;

    /* En vista mes usamos trimestre actual para 303/130 */
    const trimType = type === 'mes' ? 'trim' : type;
    const ps = D.ps();

    /* 303: IVA */
    let ivaRepercutido = 0, ivaSoportado = 0;
    /* 130: IRPF */
    let ingresos130 = 0, gastos130 = 0, retenciones = 0;

    ps.forEach(p => {
      B.calc(p);
      const f = p.facturacion;
      p.horas.forEach(h => {
        if (h.fecha && inPeriod(h.fecha, trimType, y, m)) {
          if (h.monto) ingresos130 += h.monto;
        }
      });
      (f.cobros || []).forEach(c => {
        if (c.fecha && inPeriod(c.fecha, trimType, y, m)) {
          const tf = f.totalFactura || 0;
          const ratio = tf > 0 ? (c.cantidad / tf) : 0;
          ingresos130 += (f.baseImponible || 0) * ratio;
          ivaRepercutido += (f.importeIva || 0) * ratio;
          retenciones += (f.importeIrpf || 0) * ratio;
        }
      });
    });

    D.gs().forEach(g => {
      let gastoSum = 0;
      (g.entradas || []).forEach(e => {
        if (e.fecha && inPeriod(e.fecha, trimType, y, m)) gastoSum += e.cantidad || 0;
      });
      if (g.desgravable && gastoSum > 0) {
        gastos130 += gastoSum;
        const rate = (g.tipoIva || 0) / 100;
        ivaSoportado += gastoSum * rate / (1 + rate);
      }
    });

    /* Deducciones del periodo */
    const trimDeds = D.deds().filter(d => d.fecha && inPeriod(d.fecha, trimType, y, m));
    const totalTrimDeds = trimDeds.reduce((s, d) => s + (d.cantidad || 0), 0);
    gastos130 += totalTrimDeds;

    const rNeto130 = ingresos130 - gastos130;
    const pago130 = Math.max(rNeto130 * 0.20, 0);
    const iva303 = ivaRepercutido - ivaSoportado;

    const qLabel = trimType === 'trim' ? `T${Math.floor(m / 3) + 1} ${y}` : `${y}`;

    const dedsHtml = this._renderDedList(trimDeds);

    el.innerHTML =
      `<div class="info-section">`
      + `<div class="din-gastos-header">`
      +   `<span class="info-section-title" style="margin-bottom:0">${t('din.taxSummary')} — ${qLabel}</span>`
      +   `<button class="bt bt-s" onclick="App.dedModal()">+ ${t('renta.addDeduction')}</button>`
      + `</div>`
      + `<div class="din-trim-grid">`
      +   `<div class="din-trim-card">`
      +     `<div class="din-trim-title">${t('din.model303')}</div>`
      +     `<div class="din-tax-row"><span>${t('din.vatCharged')}</span><span class="m">${fmtMoney(ivaRepercutido)}</span></div>`
      +     `<div class="din-tax-row"><span>${t('din.vatDeductible')}</span><span class="m">${fmtMoney(ivaSoportado)}</span></div>`
      +     `<div class="din-tax-row din-tax-total"><span>${t('din.toPay')}</span><span class="m" style="color:${iva303 > 0 ? 'var(--warn)' : 'var(--ok)'}">${fmtMoney(Math.max(iva303, 0))}</span></div>`
      +   `</div>`
      +   `<div class="din-trim-card">`
      +     `<div class="din-trim-title">${t('din.model130')}</div>`
      +     `<div class="din-tax-row"><span>${t('din.income')}</span><span class="m">${fmtMoney(ingresos130)}</span></div>`
      +     `<div class="din-tax-row"><span>${t('din.deductibleExp')}</span><span class="m">${fmtMoney(gastos130)}</span></div>`
      +     `<div class="din-tax-row"><span>${t('din.netProfit')}</span><span class="m">${fmtMoney(rNeto130)}</span></div>`
      +     `<div class="din-tax-row"><span>${t('din.withholdings')}</span><span class="m">${fmtMoney(retenciones)}</span></div>`
      +     `<div class="din-tax-row din-tax-total"><span>${t('din.toPay')} (20%)</span><span class="m" style="color:${pago130 - retenciones > 0 ? 'var(--warn)' : 'var(--ok)'}">${fmtMoney(Math.max(pago130 - retenciones, 0))}</span></div>`
      +   `</div>`
      + `</div>`
      + dedsHtml
      + `</div>`;
  },

  /* ══════════════════════════════════════
   *  RENTA (Modelo 100)
   * ══════════════════════════════════════ */
  _rDinRenta() {
    const el = document.getElementById('dinRenta');
    const y = this.dinY;

    /* Annual income */
    let ingresosAnual = 0;
    D.ps().forEach(p => {
      B.calc(p);
      const f = p.facturacion;
      p.horas.forEach(h => {
        if (h.fecha && h.fecha.startsWith(String(y)) && h.monto) ingresosAnual += h.monto;
      });
      (f.cobros || []).forEach(c => {
        if (c.fecha && c.fecha.startsWith(String(y))) {
          const tf = f.totalFactura || 0;
          const ratio = tf > 0 ? (c.cantidad / tf) : 0;
          ingresosAnual += (f.baseImponible || 0) * ratio;
        }
      });
    });

    /* Annual business expenses (only desgravable) */
    let gastosAnual = 0;
    D.gs().forEach(g => {
      if (!g.desgravable) return;
      (g.entradas || []).forEach(e => {
        if (e.fecha && e.fecha.startsWith(String(y))) gastosAnual += e.cantidad || 0;
      });
    });

    const rendimiento = ingresosAnual - gastosAnual;

    /* Deducibles for this year */
    const yStr = String(y);
    const deds = D.deds().filter(d => d.fecha && d.fecha.startsWith(yStr));
    const totalDeds = deds.reduce((s, d) => s + (d.cantidad || 0), 0);
    const baseImponible = rendimiento - totalDeds;

    let html = `<div class="info-section">`
      + `<div class="din-gastos-header">`
      +   `<span class="info-section-title" style="margin-bottom:0">${t('renta.title')} — ${y}</span>`
      +   `<button class="bt bt-s" onclick="App.dedModal()">+ ${t('renta.addDeduction')}</button>`
      + `</div>`
      + `<div class="din-trim-card" style="margin-top:.75rem">`
      +   `<div class="din-tax-row"><span>${t('renta.annualIncome')}</span><span class="m">${fmtMoney(ingresosAnual)}</span></div>`
      +   `<div class="din-tax-row"><span>${t('renta.businessExpenses')}</span><span class="m">${fmtMoney(gastosAnual)}</span></div>`
      +   `<div class="din-tax-row din-tax-total"><span>${t('renta.activityProfit')}</span><span class="m">${fmtMoney(rendimiento)}</span></div>`
      + `</div>`;

    const dedListHtml = this._renderDedList(deds);
    html += dedListHtml || `<div class="din-empty" style="margin-top:.5rem">${t('renta.noDeductions')}</div>`;

    html += `<div class="din-trim-card" style="margin-top:.75rem">`
      + `<div class="din-tax-row"><span>${t('renta.totalDeductions')}</span><span class="m">${fmtMoney(totalDeds)}</span></div>`
      + `<div class="din-tax-row din-tax-total"><span>${t('renta.taxableIncome')}</span><span class="m" style="color:${baseImponible >= 0 ? 'var(--ok)' : 'var(--warn)'}">${fmtMoney(baseImponible)}</span></div>`
      + `</div></div>`;

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

  /* ══════════════════════════════════════
   *  MODALES GASTOS
   * ══════════════════════════════════════ */
  gModal(gid) {
    const isE = !!gid, g = isE ? D.g(gid) : null;
    const gColor = g?.color || 'Salmon';
    const isPuntual = !isE || !g?.recurrente || g.recurrente === 'no';
    const e0 = isPuntual && isE ? (g.entradas || [])[0] : null;
    const entryFields = `<div class="fr" id="gEntryRow"${isPuntual ? '' : ' style="display:none"'}><div class="fg"><label>${t('field.amountEntry')}</label><input type="number" id="gEA" min="0.01" step="0.01" value="${e0?.cantidad || ''}" placeholder="0,00"></div>`
      + `<div class="fg"><label>${t('field.date')}</label><input type="date" id="gED" value="${e0?.fecha || todayStr()}"></div></div>`;
    this.om(`<div class="mt">${isE ? t('gas.editExpense') : t('gas.newExpense')}</div>`
      + `<div class="fg"><label>${t('field.name')}</label><input type="text" id="gN" value="${esc(g?.nombre || '')}" placeholder="${t('ph.expenseName')}"></div>`
      + `<div class="fr"><div class="fg"><label>${t('field.category')}</label><select id="gCat">${Object.entries(GASTO_CAT).map(([k, v]) => `<option value="${k}" ${g?.categoria === k ? 'selected' : ''}>${v}</option>`).join('')}</select></div>`
      + `<div class="fg"><label>${t('field.recurrence')}</label><select id="gRec" onchange="document.getElementById('gEntryRow').style.display=this.value==='no'?'':'none'">${Object.entries(RECURRENCIA).map(([k, v]) => `<option value="${k}" ${g?.recurrente === k ? 'selected' : ''}>${v}</option>`).join('')}</select></div></div>`
      + `<div class="fr"><div class="fg"><label>${t('field.deductible')}</label><label style="display:flex;align-items:center;gap:.5rem;cursor:pointer"><input type="checkbox" id="gDes" ${g?.desgravable ? 'checked' : ''}> ${t('gas.deductibleBadge')}</label></div>`
      + `<div class="fg"><label>${t('field.ivaRate')}</label><select id="gIva">${Object.entries(TIPOS_IVA).map(([k, v]) => `<option value="${k}" ${(g?.tipoIva ?? 21) == k ? 'selected' : ''}>${v}</option>`).join('')}</select></div></div>`
      + entryFields
      + (isE && g?.finHasta ? `<div class="fg"><label style="display:flex;align-items:center;gap:.5rem;cursor:pointer"><input type="checkbox" id="gReact"> ${t('gas.reactivate')}</label></div>` : '')
      + `<div class="fg"><label>${t('field.color')}</label>${this.colorSelect(gColor)}</div>`
      + `<div class="fg"><label>${t('field.notes')}</label><textarea id="gNo" placeholder="${t('ph.notes')}">${esc(g?.notas || '')}</textarea></div>`
      + `<div class="ma"><button class="bt" onclick="App.cm()">${t('btn.cancel')}</button><button class="bt bt-p" onclick="App.saveG('${gid || ''}')">${isE ? t('btn.save') : t('btn.create')}</button></div>`);
  },

  saveG(gid) {
    const nombre = document.getElementById('gN').value.trim();
    if (!nombre) { Toast.warn(t('msg.nameRequired')); return; }
    const color = document.getElementById('mpColor')?.value || 'Salmon';
    const data = { nombre, categoria: document.getElementById('gCat').value, recurrente: document.getElementById('gRec').value, color, notas: document.getElementById('gNo').value.trim(), desgravable: document.getElementById('gDes').checked, tipoIva: ((v) => isNaN(v) ? 21 : v)(parseInt(document.getElementById('gIva').value)) };
    if (gid) {
      const g = D.g(gid);
      const wasPuntual = !g?.recurrente || g.recurrente === 'no';
      if (data.recurrente === 'no' && wasPuntual) {
        const amt = parseFloat(document.getElementById('gEA')?.value) || 0;
        const fecha = document.getElementById('gED')?.value || todayStr();
        const entradas = g?.entradas ? [...g.entradas] : [];
        if (amt > 0) {
          if (entradas[0]) { entradas[0].cantidad = amt; entradas[0].fecha = fecha; }
          else entradas.push({ id: uid(), fecha, cantidad: amt, nota: '' });
        }
        data.entradas = entradas;
      }
      if (document.getElementById('gReact')?.checked) data.finHasta = null;
      D.upG(gid, data);
    } else {
      data.id = uid(); data.entradas = [];
      const initAmt = parseFloat(document.getElementById('gEA')?.value) || 0;
      if (initAmt > 0) data.entradas.push({ id: uid(), fecha: document.getElementById('gED')?.value || todayStr(), cantidad: initAmt, nota: '' });
      D.addG(data);
    }
    this.cm(); this.rGas();
  },

  delG(gid) { const g = D.g(gid); if (!g) return; if (!confirm(t('gas.deleteConfirm', g.nombre))) return; D.delG(gid); this.rGas(); },

  geModal(gid, eid) {
    const isE = !!eid;
    const e = isE ? (D.g(gid)?.entradas || []).find(x => x.id === eid) : null;
    const gasto = D.g(gid);
    const isRecurrente = gasto && gasto.recurrente && gasto.recurrente !== 'no';
    this.om(`<div class="mt">${isE ? t('gas.editEntry') : t('gas.addEntry')}</div>`
      + `<div class="fr"><div class="fg"><label>${t('field.amountEntry')}</label><input type="number" id="geA" min="0.01" step="0.01" value="${e?.cantidad || ''}" placeholder="0,00"></div>`
      + `<div class="fg"><label>${t('field.date')}</label><input type="date" id="geD" value="${e?.fecha || todayStr()}"></div></div>`
      + `<div class="fg"><label>${t('field.note')}</label><input type="text" id="geN" value="${esc(e?.nota || '')}" placeholder="${t('ph.detail')}"></div>`
      + (isRecurrente && !isE ? `<div class="fg"><label style="display:flex;align-items:center;gap:.5rem;cursor:pointer"><input type="checkbox" id="geUlt"> ${t('gas.lastMonth')}</label></div>` : '')
      + `<div class="ma"><button class="bt" onclick="App.cm()">${t('btn.cancel')}</button><button class="bt bt-p" onclick="App.saveGE('${gid}','${eid || ''}')">${isE ? t('btn.save') : t('btn.add')}</button></div>`);
  },

  saveGE(gid, eid) {
    const cant = parseFloat(document.getElementById('geA').value) || 0;
    if (cant <= 0) return;
    const g = D.g(gid); if (!g) return;
    if (!g.entradas) g.entradas = [];
    const fecha = document.getElementById('geD').value || todayStr();
    const nota = document.getElementById('geN').value.trim();
    if (eid) {
      const e = g.entradas.find(x => x.id === eid);
      if (e) { e.fecha = fecha; e.cantidad = cant; e.nota = nota; }
    } else {
      g.entradas.push({ id: uid(), fecha, cantidad: cant, nota });
    }
    const update = { entradas: g.entradas };
    const ultCheck = document.getElementById('geUlt');
    if (ultCheck?.checked) update.finHasta = fecha.substring(0, 7);
    D.upG(gid, update); this.cm(); this.rGas();
  },

  delGE(gid, eid) {
    const g = D.g(gid); if (!g) return;
    g.entradas = (g.entradas || []).filter(e => e.id !== eid);
    D.upG(gid, { entradas: g.entradas }); this.rGas();
  }

});
