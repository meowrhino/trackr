/* ================================================
 * TRACKR — App: Vista Info (Dashboard)
 * Globales: extiende App
 * Dependencias: app.js (App base), utils.js, store.js,
 *               billing.js, colors.js
 * ================================================ */

Object.assign(App, {

  rInfo() {
    const ps = D.ps();
    const gs = D.gs();
    const hasData = ps.length > 0;

    const now = new Date();
    const today = todayStr();
    const dow = (now.getDay() + 6) % 7;
    const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - dow);
    const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    /* ── Stats rápidas ── */
    const activos = ps.filter(p => p.estado === 'activo');
    let horasSemana = 0, horasMes = 0, pendienteCobro = 0, nPendiente = 0;
    const weekDates = new Set();
    for (let i = 0; i < 7; i++) {
      const d = new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate() + i);
      weekDates.add(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`);
    }

    ps.forEach(p => {
      B.calc(p);
      p.horas.forEach(h => {
        if (!h.fecha) return;
        if (weekDates.has(h.fecha)) horasSemana += h.cantidad;
        if (h.fecha.startsWith(thisMonth)) horasMes += h.cantidad;
      });
      const f = p.facturacion;
      if ((p.estado === 'completado' || p.estado === 'abandonado') && f.facturaFecha && !f.pagado) {
        pendienteCobro += f.netoRecibido || 0;
        nPendiente++;
      }
    });

    const statusEl = document.getElementById('infoStatus');
    const mainEl = document.getElementById('infoMain');

    if (!hasData) {
      statusEl.innerHTML =
        `<div class="info-cta">`
        + `<p class="info-cta-text">No tienes proyectos todavía. Crea uno nuevo o importa tus datos desde un JSON.</p>`
        + `<div class="info-cta-actions">`
        +   `<button class="bt bt-p" onclick="App.pModal()">+ Nuevo proyecto</button>`
        +   `<button class="bt" onclick="document.getElementById('impA').click()">Cargar JSON</button>`
        + `</div>`
        + `</div>`;
      mainEl.innerHTML = '';
      document.getElementById('infoFinancial').innerHTML = '';
      return;
    }

    /* ── Stats cards ── */
    statusEl.innerHTML =
      `<div class="info-stats">`
      + `<div class="info-stat-card" onclick="App.go('dash')">`
      +   `<div class="info-stat-val">${activos.length}</div>`
      +   `<div class="info-stat-lbl">proyecto${activos.length !== 1 ? 's' : ''} activo${activos.length !== 1 ? 's' : ''}</div>`
      + `</div>`
      + `<div class="info-stat-card" onclick="App.go('cal')">`
      +   `<div class="info-stat-val">${horasSemana.toFixed(1)}<small>h</small></div>`
      +   `<div class="info-stat-lbl">esta semana</div>`
      + `</div>`
      + `<div class="info-stat-card" onclick="App.go('cal')">`
      +   `<div class="info-stat-val">${horasMes.toFixed(1)}<small>h</small></div>`
      +   `<div class="info-stat-lbl">este mes</div>`
      + `</div>`
      + `<div class="info-stat-card${nPendiente ? ' info-stat-alert' : ''}">`
      +   `<div class="info-stat-val">${nPendiente > 0 ? fmtMoney(pendienteCobro) : '—'}</div>`
      +   `<div class="info-stat-lbl">${nPendiente ? `${nPendiente} pendiente${nPendiente > 1 ? 's' : ''} de cobro` : 'todo cobrado'}</div>`
      + `</div>`
      + `</div>`;

    /* ── Actividad reciente ── */
    const activity = [];

    ps.forEach(p => {
      const hex = colorHex(p.color);
      p.horas.forEach(h => {
        if (!h.fecha) return;
        activity.push({
          type: 'hora', fecha: h.fecha, sort: h.fecha + (h.horaInicio || '99:99'),
          icon: h.tipo === 'trabajo' ? '💻' : '👥',
          text: `${h.cantidad}h — ${p.nombre}`,
          note: h.nota || '', color: hex
        });
      });
    });

    gs.forEach(g => {
      const gc = colorHex(g.color || 'Salmon');
      (g.entradas || []).forEach(e => {
        if (!e.fecha) return;
        activity.push({
          type: 'gasto', fecha: e.fecha, sort: e.fecha + '99:99',
          icon: '€',
          text: `${fmtMoney(e.cantidad || 0)} — ${g.nombre}`,
          note: e.nota || '', color: gc
        });
      });
    });

    activity.sort((a, b) => b.sort.localeCompare(a.sort));
    const recent = activity.slice(0, 12);

    let actHtml = '';
    if (recent.length) {
      let lastDate = '';
      actHtml = `<div class="info-section"><div class="info-section-title">Actividad reciente</div><div class="hl">`;
      recent.forEach(a => {
        const dateLabel = a.fecha === today ? 'Hoy'
          : a.fecha === (() => { const y = new Date(now - 86400000); return `${y.getFullYear()}-${String(y.getMonth()+1).padStart(2,'0')}-${String(y.getDate()).padStart(2,'0')}`; })() ? 'Ayer'
          : fmtDate(a.fecha);
        if (a.fecha !== lastDate) {
          if (lastDate) actHtml += `<div class="info-act-sep"></div>`;
          lastDate = a.fecha;
        }
        actHtml += `<div class="hr" style="border-left-color:${a.color}">`
          + `<span class="hr-t">${a.icon}</span>`
          + `<span class="hr-d">${dateLabel}</span>`
          + `<span style="color:var(--t1);font-size:.82rem;flex:1">${esc(a.text)}</span>`
          + (a.note ? `<span class="hr-n">${esc(a.note)}</span>` : '')
          + `</div>`;
      });
      actHtml += `</div></div>`;
    }

    /* ── Deadlines próximos ── */
    const deadlines = [];
    const todayDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    activos.forEach(p => {
      const fe = p.fechas?.finEstimada;
      if (!fe) return;
      const parts = fe.split('-');
      const dDate = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
      const diffDays = Math.ceil((dDate - todayDate) / 86400000);
      if (diffDays < -30) return; /* ignore very old deadlines */
      deadlines.push({
        pn: p.nombre, pid: p.id, fecha: fe, diffDays,
        pc: colorHex(p.color), cn: clienteName(p)
      });
    });
    deadlines.sort((a, b) => a.diffDays - b.diffDays);

    let dlHtml = '';
    if (deadlines.length) {
      dlHtml = `<div class="info-section"><div class="info-section-title">Deadlines</div><div class="hl">`;
      deadlines.forEach(d => {
        const urgency = d.diffDays < 0 ? 'overdue' : d.diffDays <= 7 ? 'soon' : 'ok';
        const label = d.diffDays < 0 ? `${Math.abs(d.diffDays)}d atrasado`
          : d.diffDays === 0 ? 'Hoy'
          : d.diffDays === 1 ? 'Mañana'
          : `${d.diffDays}d`;
        dlHtml += `<div class="hr info-dl-${urgency}" style="border-left-color:${d.pc};cursor:pointer" onclick="App.go('det','${d.pid}')">`
          + `<span class="hr-d info-dl-badge">${label}</span>`
          + `<span style="color:var(--t1);font-size:.82rem;flex:1">${esc(d.pn)}</span>`
          + (d.cn ? `<span class="hr-n">${esc(d.cn)}</span>` : '')
          + `<span class="hr-d">${fmtDate(d.fecha)}</span>`
          + `</div>`;
      });
      dlHtml += `</div></div>`;
    }

    /* ── Acciones rápidas ── */
    const quickHtml = `<div class="info-quick">`
      + `<button class="bt bt-p" onclick="App.pModal()">+ Nuevo proyecto</button>`
      + `<button class="bt" onclick="document.getElementById('impA').click()">Cargar otro JSON</button>`
      + `<button class="bt" onclick="App.resetData()">Nuevo usuario</button>`
      + `</div>`
      + `<div style="text-align:center;margin-top:1.5rem;font-size:.72rem"><a href="https://meowrhino.studio" target="_blank" style="color:var(--t3);text-decoration:none">meowrhino.studio</a></div>`;

    mainEl.innerHTML = actHtml + dlHtml + quickHtml;

    /* ── Resumen financiero (reutilizamos el existente) ── */
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
          if (h.monto) cobrado += h.monto;
        }
      });
      if (f.pagado && f.fechaPago && inPeriod(f.fechaPago, type, year, month)) {
        cobrado += f.netoRecibido || 0;
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
