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

  rGas() {
    this._rDinFin();
    this._rDinIngresos();
    this._rDinGastos();
    this._rDinTrim();
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
      if (f.pagado && f.fechaPago && inPeriod(f.fechaPago, type, y, m)) return true;
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
    const ps = D.ps();
    const type = this.dinPeriod, y = this.dinY, m = this.dinM;

    let cobrado = 0;

    ps.forEach(p => {
      B.calc(p);
      const f = p.facturacion;
      p.horas.forEach(h => {
        if (h.fecha && inPeriod(h.fecha, type, y, m)) {
          if (h.monto) cobrado += h.monto;
        }
      });
      if (f.pagado && f.fechaPago && inPeriod(f.fechaPago, type, y, m)) {
        cobrado += f.netoRecibido || 0;
      }
    });

    /* stacked expense bar: per-gasto segments */
    const gastoSegs = [];
    D.gs().forEach(g => {
      let tot = 0;
      (g.entradas || []).forEach(e => {
        if (e.fecha && inPeriod(e.fecha, type, y, m)) tot += e.cantidad || 0;
      });
      if (tot > 0) gastoSegs.push({ nombre: g.nombre, total: tot, color: colorHex(g.color || 'Salmon') });
    });
    const gastosTotal = gastoSegs.reduce((s, seg) => s + seg.total, 0);

    const neto = cobrado - gastosTotal;
    const maxBar = Math.max(cobrado, gastosTotal, 1);

    /* stacked segments HTML */
    let segsHtml = '';
    if (gastosTotal > 0) {
      gastoSegs.forEach(seg => {
        const pct = (seg.total / gastosTotal * 100).toFixed(1);
        segsHtml += `<div class="pbar-seg" style="width:${pct}%;background:${seg.color}" title="${esc(seg.nombre)}: ${fmtMoney(seg.total)}"></div>`;
      });
    }
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
      +     (hasPrev ? `<button class="bt bt-s" onclick="App._dinPrev()">&larr;</button>` : `<span style="width:2rem"></span>`)
      +     `<div class="info-fin-toggle">`
      +       `<button class="info-fin-tb${type === 'mes' ? ' on' : ''}" onclick="App._dinType('mes')">${t('info.month')}</button>`
      +       `<button class="info-fin-tb${type === 'trim' ? ' on' : ''}" onclick="App._dinType('trim')">${t('info.quarter')}</button>`
      +       `<button class="info-fin-tb${type === 'año' ? ' on' : ''}" onclick="App._dinType('año')">${t('info.year')}</button>`
      +     `</div>`
      +     (hasNext ? `<button class="bt bt-s" onclick="App._dinNext()">&rarr;</button>` : `<span style="width:2rem"></span>`)
      +   `</div>`
      + `</div>`
      + `<div class="din-fin-body">`
      +   `<div class="fin-row">`
      +     `<span class="fin-label">${t('din.income')}</span>`
      +     `<div class="fin-bar"><div class="pbar"><div class="pbar-fill pbar-ok" style="width:${(cobrado / maxBar * 100).toFixed(1)}%"></div></div></div>`
      +     `<span class="fin-value" style="color:var(--ok)">${fmtMoney(cobrado)}</span>`
      +   `</div>`
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
      /* cobros por factura */
      if (f.pagado && f.fechaPago && inPeriod(f.fechaPago, type, y, m)) {
        ingresos.push({ fecha: f.fechaPago, monto: f.netoRecibido || 0, proyecto: p.nombre, color: hex, tipo: 'factura' });
      }
      /* cobros por hora */
      p.horas.forEach(h => {
        if (h.monto && h.fecha && inPeriod(h.fecha, type, y, m)) {
          ingresos.push({ fecha: h.fecha, monto: h.monto, proyecto: p.nombre, color: hex, tipo: 'hora' });
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
        html += `<div class="hr" style="border-left-color:${i.color}">`
          + `<span class="hr-d">${fmtDate(i.fecha)}</span>`
          + `<span style="color:var(--t1);font-size:.82rem;flex:1">${esc(i.proyecto)}</span>`
          + `<span class="hr-n" style="font-size:.62rem;text-transform:uppercase">${i.tipo === 'factura' ? t('din.invoice') : t('din.hourly')}</span>`
          + `<span style="color:var(--ok);font-family:'DM Mono',monospace;font-size:.82rem">${fmtMoney(i.monto)}</span>`
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
        const count = entries.length;
        const catLabel = GASTO_CAT[g.categoria] || g.categoria || 'Otro';
        const gHex = colorHex(g.color || 'Salmon');
        html += `<div class="gas-card" style="border-left:3px solid ${gHex}"><div class="gas-header" onclick="this.nextElementSibling.classList.toggle('open')">`
          + `<span class="gas-name">${esc(g.nombre)}</span><span class="gas-cat">${catLabel}</span>`
          + `${g.recurrente && g.recurrente !== 'no' ? `<span class="gas-rec">${RECURRENCIA[g.recurrente]}</span>` : ''}`
          + `<span class="gas-total m">${fmtMoney(total)}</span><span class="gas-count">${count} ${t('gas.entries')}</span>`
          + `<div class="gas-actions"><button class="cl-btn" onclick="event.stopPropagation();App.gModal('${g.id}')" title="${t('btn.edit')}">&#9998;</button><button class="cl-btn cl-btn-del" onclick="event.stopPropagation();App.delG('${g.id}')" title="${t('btn.delete')}">&times;</button></div>`
          + `</div><div class="gas-body">`;
        if (entries.length) {
          entries.sort((a, b) => (b.fecha || '').localeCompare(a.fecha || '')).forEach(e => {
            html += `<div class="gas-entry"><span class="gas-e-date">${fmtDate(e.fecha)}</span><span class="gas-e-amount m">${fmtMoney(e.cantidad || 0)}</span><span class="gas-e-nota">${esc(e.nota || '')}</span><button class="gas-e-del" onclick="App.delGE('${g.id}','${e.id}')" title="${t('btn.delete')}">&times;</button></div>`;
          });
        }
        html += `<button class="bt bt-add" style="margin-top:.5rem" onclick="App.geModal('${g.id}')">${t('btn.addEntry')}</button></div></div>`;
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
    const type = this.dinPeriod;

    /* solo mostrar en vista trimestral o anual */
    if (type === 'mes') { el.innerHTML = ''; return; }

    const y = this.dinY, m = this.dinM;
    const ps = D.ps();

    /* 303: IVA */
    let ivaRepercutido = 0, ivaSoportado = 0, baseFacturado = 0;
    /* 130: IRPF */
    let ingresos130 = 0, gastos130 = 0, retenciones = 0;

    ps.forEach(p => {
      B.calc(p);
      const f = p.facturacion;
      p.horas.forEach(h => {
        if (h.fecha && inPeriod(h.fecha, type, y, m)) {
          if (h.monto) ingresos130 += h.monto;
        }
      });
      if (f.pagado && f.fechaPago && inPeriod(f.fechaPago, type, y, m)) {
        ingresos130 += f.netoRecibido || 0;
        baseFacturado += f.baseImponible || 0;
        ivaRepercutido += f.importeIva || 0;
        retenciones += f.importeIrpf || 0;
      }
    });

    D.gs().forEach(g => {
      (g.entradas || []).forEach(e => {
        if (e.fecha && inPeriod(e.fecha, type, y, m)) gastos130 += e.cantidad || 0;
      });
    });

    /* rough IVA soportado estimate: ~21% of expenses */
    ivaSoportado = gastos130 * 0.21 / 1.21;

    const rNeto130 = ingresos130 - gastos130;
    const pago130 = Math.max(rNeto130 * 0.20, 0);
    const iva303 = ivaRepercutido - ivaSoportado;

    const qLabel = type === 'trim' ? `T${Math.floor(m / 3) + 1} ${y}` : `${y}`;

    el.innerHTML =
      `<div class="info-section">`
      + `<div class="info-section-title">${t('din.taxSummary')} — ${qLabel}</div>`
      + `<div class="din-trim-grid">`
      +   `<div class="din-trim-card">`
      +     `<div class="din-trim-title">${t('din.model303')}</div>`
      +     `<div class="din-tax-row"><span>${t('din.vatCharged')}</span><span class="m">${fmtMoney(ivaRepercutido)}</span></div>`
      +     `<div class="din-tax-row"><span>${t('din.vatDeductible')}</span><span class="m">${fmtMoney(ivaSoportado)}</span></div>`
      +     `<div class="din-tax-row din-tax-total"><span>${t('din.toPay')}</span><span class="m" style="color:${iva303 > 0 ? 'var(--warn)' : 'var(--ok)'}">${fmtMoney(iva303)}</span></div>`
      +   `</div>`
      +   `<div class="din-trim-card">`
      +     `<div class="din-trim-title">${t('din.model130')}</div>`
      +     `<div class="din-tax-row"><span>${t('din.income')}</span><span class="m">${fmtMoney(ingresos130)}</span></div>`
      +     `<div class="din-tax-row"><span>${t('din.deductibleExp')}</span><span class="m">${fmtMoney(gastos130)}</span></div>`
      +     `<div class="din-tax-row"><span>${t('din.netProfit')}</span><span class="m">${fmtMoney(rNeto130)}</span></div>`
      +     `<div class="din-tax-row"><span>${t('din.withholdings')}</span><span class="m">${fmtMoney(retenciones)}</span></div>`
      +     `<div class="din-tax-row din-tax-total"><span>${t('din.toPay')} (20%)</span><span class="m" style="color:${pago130 > 0 ? 'var(--warn)' : 'var(--ok)'}">${fmtMoney(Math.max(pago130 - retenciones, 0))}</span></div>`
      +   `</div>`
      + `</div></div>`;
  },

  /* ══════════════════════════════════════
   *  MODALES (sin cambios)
   * ══════════════════════════════════════ */
  gModal(gid) {
    const isE = !!gid, g = isE ? D.g(gid) : null;
    const gColor = g?.color || 'Salmon';
    this.om(`<div class="mt">${isE ? t('gas.editExpense') : t('gas.newExpense')}</div>`
      + `<div class="fg"><label>${t('field.name')}</label><input type="text" id="gN" value="${esc(g?.nombre || '')}" placeholder="${t('ph.expenseName')}"></div>`
      + `<div class="fr"><div class="fg"><label>${t('field.category')}</label><select id="gCat">${Object.entries(GASTO_CAT).map(([k, v]) => `<option value="${k}" ${g?.categoria === k ? 'selected' : ''}>${v}</option>`).join('')}</select></div>`
      + `<div class="fg"><label>${t('field.recurrence')}</label><select id="gRec">${Object.entries(RECURRENCIA).map(([k, v]) => `<option value="${k}" ${g?.recurrente === k ? 'selected' : ''}>${v}</option>`).join('')}</select></div></div>`
      + `<div class="fg"><label>${t('field.color')}</label>${this.colorSelect(gColor)}</div>`
      + `<div class="fg"><label>${t('field.notes')}</label><textarea id="gNo" placeholder="${t('ph.notes')}">${esc(g?.notas || '')}</textarea></div>`
      + `<div class="ma"><button class="bt" onclick="App.cm()">${t('btn.cancel')}</button><button class="bt bt-p" onclick="App.saveG('${gid || ''}')">${isE ? t('btn.save') : t('btn.create')}</button></div>`);
  },

  saveG(gid) {
    const nombre = document.getElementById('gN').value.trim();
    if (!nombre) { Toast.warn(t('msg.nameRequired')); return; }
    const color = document.getElementById('mpColor')?.value || 'Salmon';
    const data = { nombre, categoria: document.getElementById('gCat').value, recurrente: document.getElementById('gRec').value, color, notas: document.getElementById('gNo').value.trim() };
    if (gid) D.upG(gid, data); else { data.id = uid(); data.entradas = []; D.addG(data); }
    this.cm(); this.rGas();
  },

  delG(gid) { const g = D.g(gid); if (!g) return; if (!confirm(t('gas.deleteConfirm', g.nombre))) return; D.delG(gid); this.rGas(); },

  geModal(gid) {
    this.om(`<div class="mt">${t('gas.addEntry')}</div>`
      + `<div class="fr"><div class="fg"><label>${t('field.amountEntry')}</label><input type="number" id="geA" min="0.01" step="0.01" value="" placeholder="0,00"></div>`
      + `<div class="fg"><label>${t('field.date')}</label><input type="date" id="geD" value="${todayStr()}"></div></div>`
      + `<div class="fg"><label>${t('field.note')}</label><input type="text" id="geN" placeholder="${t('ph.detail')}"></div>`
      + `<div class="ma"><button class="bt" onclick="App.cm()">${t('btn.cancel')}</button><button class="bt bt-p" onclick="App.saveGE('${gid}')">${t('btn.add')}</button></div>`);
  },

  saveGE(gid) {
    const cant = parseFloat(document.getElementById('geA').value) || 0;
    if (cant <= 0) return;
    const g = D.g(gid); if (!g) return;
    if (!g.entradas) g.entradas = [];
    g.entradas.push({ id: uid(), fecha: document.getElementById('geD').value || null, cantidad: cant, nota: document.getElementById('geN').value.trim() });
    D.upG(gid, { entradas: g.entradas }); this.cm(); this.rGas();
  },

  delGE(gid, eid) {
    const g = D.g(gid); if (!g) return;
    g.entradas = (g.entradas || []).filter(e => e.id !== eid);
    D.upG(gid, { entradas: g.entradas }); this.rGas();
  }

});
