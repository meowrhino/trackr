/* ================================================
 * TRACKR — App: Vista Info (Home)
 * Globales: extiende App
 * Dependencias: app.js (App base), utils.js, store.js,
 *               billing.js
 * ================================================ */

Object.assign(App, {

  rInfo() {
    const ps = D.ps();
    const hasProjects = ps.length > 0;
    const statusEl = document.getElementById('infoStatus');

    if (hasProjects) {
      const activos = ps.filter(p => p.estado === 'activo').length;
      statusEl.innerHTML =
        `<div class="info-status">`
        + `<div class="info-status-text">`
        +   `<span class="info-status-num">${ps.length}</span> proyecto${ps.length !== 1 ? 's' : ''}`
        +   `${activos ? ` · <strong>${activos} activo${activos !== 1 ? 's' : ''}</strong>` : ''}`
        + `</div>`
        + `<div class="info-status-actions">`
        +   `<button class="bt bt-p" onclick="App.go('dash')">Ir a Proyectos</button>`
        +   `<button class="bt" onclick="App.pModal()">+ Nuevo</button>`
        + `</div>`
        + `</div>`;
    } else {
      statusEl.innerHTML =
        `<div class="info-cta">`
        + `<p class="info-cta-text">No tienes proyectos todavía. Crea uno nuevo o importa tus datos desde un JSON.</p>`
        + `<div class="info-cta-actions">`
        +   `<button class="bt bt-p" onclick="App.pModal()">+ Nuevo proyecto</button>`
        +   `<button class="bt" onclick="document.getElementById('impA').click()">Cargar JSON</button>`
        + `</div>`
        + `</div>`;
    }

    this._rInfoFinancial();
  },

  _hasPeriodData(type, year, month) {
    const ps = D.ps();
    for (const p of ps) {
      for (const h of p.horas) {
        if (h.fecha && inPeriod(h.fecha, type, year, month)) return true;
      }
      const f = p.facturacion;
      if (f.pagado && f.fechaPago && inPeriod(f.fechaPago, type, year, month)) return true;
    }
    for (const g of D.gs()) {
      for (const e of (g.entradas || [])) {
        if (e.fecha && inPeriod(e.fecha, type, year, month)) return true;
      }
    }
    return false;
  },

  _rInfoFinancial() {
    const el = document.getElementById('infoFinancial');
    const ps = D.ps();
    if (!ps.length) { el.innerHTML = ''; return; }

    const type = this.infoPeriod;
    const year = this.infoY;
    const month = this.infoM;

    let cobrado = 0, horas = 0;
    let baseTotal = 0, ivaTotal = 0, irpfTotal = 0;

    ps.forEach(p => {
      B.calc(p);
      const f = p.facturacion;
      p.horas.forEach(h => {
        if (h.fecha && inPeriod(h.fecha, type, year, month)) {
          horas += h.cantidad;
        }
      });
      if (f.pagado && f.fechaPago && inPeriod(f.fechaPago, type, year, month)) {
        cobrado += f.totalFactura || 0;
        baseTotal += f.baseImponible || 0;
        ivaTotal += f.importeIva || 0;
        irpfTotal += f.importeIrpf || 0;
      }
    });

    let gastosTotal = 0;
    D.gs().forEach(g => {
      (g.entradas || []).forEach(e => {
        if (e.fecha && inPeriod(e.fecha, type, year, month)) {
          gastosTotal += e.cantidad || 0;
        }
      });
    });

    const neto = cobrado - gastosTotal;
    const eurH = horas > 0 ? neto / horas : 0;

    const isEmpty = cobrado === 0 && gastosTotal === 0 && horas === 0;
    if (isEmpty && !this._hasPeriodData(type, year, month)) {
      el.innerHTML = ''; return;
    }

    let periodLabel;
    if (type === 'mes') periodLabel = `${MESES[month]} ${year}`;
    else if (type === 'trim') {
      const q = Math.floor(month / 3) + 1;
      periodLabel = `T${q} ${year}`;
    } else periodLabel = `${year}`;

    const maxBar = Math.max(cobrado, gastosTotal, 1);

    let prevY = year, prevM = month, nextY = year, nextM = month;
    if (type === 'mes') {
      prevM--; if (prevM < 0) { prevM = 11; prevY--; }
      nextM++; if (nextM > 11) { nextM = 0; nextY++; }
    } else if (type === 'trim') {
      prevM -= 3; if (prevM < 0) { prevM += 12; prevY--; }
      nextM += 3; if (nextM > 11) { nextM -= 12; nextY++; }
    } else { prevY--; nextY++; }
    const hasPrev = this._hasPeriodData(type, prevY, prevM);
    const hasNext = this._hasPeriodData(type, nextY, nextM);

    el.innerHTML =
      `<div class="info-fin">`
      + `<div class="info-fin-header">`
      +   `<span class="info-fin-title">Resumen financiero</span>`
      +   `<div class="info-fin-nav">`
      +     (hasPrev ? `<button class="bt bt-s" onclick="App._infoFinPrev()">&larr;</button>` : `<span style="width:2rem"></span>`)
      +     `<span style="min-width:120px;text-align:center;font-size:.85rem">${periodLabel}</span>`
      +     (hasNext ? `<button class="bt bt-s" onclick="App._infoFinNext()">&rarr;</button>` : `<span style="width:2rem"></span>`)
      +     `<div class="info-fin-toggle">`
      +       `<button class="info-fin-tb${type === 'mes' ? ' on' : ''}" onclick="App._infoFinType('mes')">Mes</button>`
      +       `<button class="info-fin-tb${type === 'trim' ? ' on' : ''}" onclick="App._infoFinType('trim')">Trim</button>`
      +       `<button class="info-fin-tb${type === 'año' ? ' on' : ''}" onclick="App._infoFinType('año')">Año</button>`
      +     `</div>`
      +   `</div>`
      + `</div>`
      + (isEmpty
        ? `<div class="es"><div class="tx">Sin actividad en este periodo</div></div>`
        : `<div class="fin-row">`
        +   `<span class="fin-label">Cobrado</span>`
        +   `<div class="fin-bar"><div class="pbar"><div class="pbar-fill pbar-ok" style="width:${(cobrado / maxBar * 100).toFixed(1)}%"></div></div></div>`
        +   `<span class="fin-value" style="color:var(--ok)">${fmtMoney(cobrado)}</span>`
        + `</div>`
        + `<div class="fin-row">`
        +   `<span class="fin-label">Gastos</span>`
        +   `<div class="fin-bar"><div class="pbar"><div class="pbar-fill pbar-warn" style="width:${(gastosTotal / maxBar * 100).toFixed(1)}%"></div></div></div>`
        +   `<span class="fin-value" style="color:var(--warn)">${fmtMoney(gastosTotal)}</span>`
        + `</div>`
        + `<div class="fin-sep"></div>`
        + `<div class="fin-row fin-total">`
        +   `<span class="fin-label">Neto</span>`
        +   `<span class="fin-value" style="color:${neto >= 0 ? 'var(--ok)' : 'var(--bad)'}">${fmtMoney(neto)}</span>`
        + `</div>`
        + `<div class="info-fin-stats">`
        +   `<div class="sc"><div class="sc-l">Horas</div><div class="sc-v m">${horas.toFixed(1)}h</div></div>`
        +   `<div class="sc"><div class="sc-l">&euro;/hora real</div><div class="sc-v m">${fmtNum(eurH)} &euro;/h</div></div>`
        + (type === 'trim'
          ? `<div class="sc"><div class="sc-l">Base imponible</div><div class="sc-v m">${fmtMoney(baseTotal)}</div></div>`
          + `<div class="sc"><div class="sc-l">IVA repercutido</div><div class="sc-v m">${fmtMoney(ivaTotal)}</div></div>`
          + `<div class="sc"><div class="sc-l">IRPF retenido</div><div class="sc-v m">${fmtMoney(irpfTotal)}</div></div>`
          : '')
        + `</div>`
      )
      + `</div>`;
  },

  _infoFinPrev() {
    if (this.infoPeriod === 'mes') {
      this.infoM--;
      if (this.infoM < 0) { this.infoM = 11; this.infoY--; }
    } else if (this.infoPeriod === 'trim') {
      this.infoM -= 3;
      if (this.infoM < 0) { this.infoM += 12; this.infoY--; }
    } else { this.infoY--; }
    this._rInfoFinancial();
  },
  _infoFinNext() {
    if (this.infoPeriod === 'mes') {
      this.infoM++;
      if (this.infoM > 11) { this.infoM = 0; this.infoY++; }
    } else if (this.infoPeriod === 'trim') {
      this.infoM += 3;
      if (this.infoM > 11) { this.infoM -= 12; this.infoY++; }
    } else { this.infoY++; }
    this._rInfoFinancial();
  },
  _infoFinType(t) {
    this.infoPeriod = t;
    this._rInfoFinancial();
  }

});
