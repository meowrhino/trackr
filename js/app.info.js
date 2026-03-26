/* ================================================
 * TRACKR — App: Vista Info (Dashboard)
 * Globales: extiende App
 * Dependencias: app.js (App base), utils.js, store.js,
 *               billing.js, colors.js, lang.js
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
    let horasSemana = 0, horasMes = 0, cobradoMes = 0, gastosMes = 0, pendienteCobro = 0, nPendiente = 0;
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
      (f.cobros || []).forEach(c => { if (c.fecha && c.fecha.startsWith(thisMonth)) cobradoMes += c.cantidad || 0; });
      p.horas.forEach(h => { if (h.monto && h.fecha && h.fecha.startsWith(thisMonth)) cobradoMes += h.monto; });
      if ((p.estado === 'completado' || p.estado === 'abandonado') && f.facturaFecha && !f.pagado) {
        pendienteCobro += B.pendiente(p);
        nPendiente++;
      }
    });
    D.gs().forEach(g => { (g.entradas || []).forEach(e => { if (e.fecha && e.fecha.startsWith(thisMonth)) gastosMes += e.cantidad || 0; }); });

    const statusEl = document.getElementById('infoStatus');
    const mainEl = document.getElementById('infoMain');

    if (!hasData) {
      statusEl.innerHTML =
        `<div class="info-cta">`
        + `<p class="info-cta-text">${t('info.noProjects')}</p>`
        + `<div class="info-cta-actions">`
        +   `<button class="bt bt-p" onclick="App.pModal()">${t('btn.newProject')}</button>`
        +   `<button class="bt" onclick="document.getElementById('impA').click()">${t('btn.loadJson')}</button>`
        + `</div>`
        + `<div class="info-examples">`
        + `<div class="info-examples-title">${t('examples.title')}</div>`
        + `<div class="info-examples-grid">`
        + `<div class="info-example-card" onclick="App.loadExample('marina_traductora')"><span class="info-example-icon">🌍</span><span class="info-example-name">Marina</span><span class="info-example-desc">Traductora freelance</span><span class="info-example-lang">ES</span></div>`
        + `<div class="info-example-card" onclick="App.loadExample('ana_musica')"><span class="info-example-icon">🎵</span><span class="info-example-name">Ana</span><span class="info-example-desc">Música i productora</span><span class="info-example-lang">CA</span></div>`
        + `<div class="info-example-card" onclick="App.loadExample('dani_formador')"><span class="info-example-icon">🎓</span><span class="info-example-name">Dani</span><span class="info-example-desc">Tech trainer</span><span class="info-example-lang">EN</span></div>`
        + `</div></div>`
        + `</div>`;
      mainEl.innerHTML = '';
      document.getElementById('infoFinancial').innerHTML = '';
      return;
    }

    /* ── Stats cards ── */
    statusEl.innerHTML =
      `<div class="info-stats">`
      + `<div class="info-stat-card" style="--stat-accent:var(--t2)" onclick="App.go('dash')">`
      +   `<div class="info-stat-val">${activos.length}</div>`
      +   `<div class="info-stat-lbl">${tp('info.activeProjects', activos.length)}</div>`
      + `</div>`
      + `<div class="info-stat-card" style="--stat-accent:var(--b2)" onclick="App.calView='week';App.go('cal')">`
      +   `<div class="info-stat-val">${horasSemana.toFixed(1)}<small>h</small></div>`
      +   `<div class="info-stat-lbl">${t('info.thisWeek')}</div>`
      + `</div>`
      + `<div class="info-stat-card" style="--stat-accent:var(--b2)" onclick="App.calView='month';App.go('cal')">`
      +   `<div class="info-stat-val">${horasMes.toFixed(1)}<small>h</small></div>`
      +   `<div class="info-stat-lbl">${t('info.thisMonth')}</div>`
      + `</div>`
      + `<div class="info-stat-card" style="--stat-accent:${horasMes > 0 && (cobradoMes - gastosMes) < 0 ? 'var(--bad)' : 'var(--ok)'}" onclick="App.go('din')">`
      +   `<div class="info-stat-val"${horasMes > 0 && (cobradoMes - gastosMes) < 0 ? ' style="color:var(--bad)"' : ''}>${horasMes > 0 ? fmtNum((cobradoMes - gastosMes) / horasMes) : '—'}<small>${horasMes > 0 ? '€/h' : ''}</small></div>`
      +   `<div class="info-stat-lbl">${t('info.realEurH')}</div>`
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
          note: h.nota || '', color: hex,
          pid: p.id, hid: h.id
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
      actHtml = `<div class="info-section"><div class="info-section-title">${t('info.recentActivity')}</div><div class="hl">`;
      recent.forEach(a => {
        const dateLabel = a.fecha === today ? t('info.today')
          : a.fecha === (() => { const y = new Date(now - 86400000); return `${y.getFullYear()}-${String(y.getMonth()+1).padStart(2,'0')}-${String(y.getDate()).padStart(2,'0')}`; })() ? t('info.yesterday')
          : fmtDate(a.fecha);
        if (a.fecha !== lastDate) {
          if (lastDate) actHtml += `<div class="info-act-sep"></div>`;
          lastDate = a.fecha;
        }
        const click = a.pid ? ` onclick="App.eHour('${a.pid}','${a.hid}')" style="border-left-color:${a.color};cursor:pointer"`
          : ` style="border-left-color:${a.color}"`;
        actHtml += `<div class="hr"${click}>`
          + `<span class="hr-t">${a.icon}</span>`
          + `<span class="hr-d">${dateLabel}</span>`
          + `<span style="color:var(--t1);font-size:.82rem;flex:0 0 auto;white-space:nowrap">${esc(a.text)}</span>`
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
      dlHtml = `<div class="info-section"><div class="info-section-title">${t('info.deadlines')}</div><div class="hl">`;
      deadlines.forEach(d => {
        const urgency = d.diffDays < 0 ? 'overdue' : d.diffDays <= 7 ? 'soon' : 'ok';
        const label = d.diffDays < 0 ? t('info.dOverdue', Math.abs(d.diffDays))
          : d.diffDays === 0 ? t('info.today')
          : d.diffDays === 1 ? t('info.tomorrow')
          : t('info.dLeft', d.diffDays);
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
      + `<button class="bt" onclick="App.logoutModal()">${t('btn.logout')}</button>`
      + `</div>`
      + `<div style="text-align:center;margin-top:1.5rem;font-size:.72rem"><a href="https://meowrhino.studio" target="_blank" style="color:var(--t3);text-decoration:none">meowrhino.studio</a></div>`;

    mainEl.innerHTML = actHtml + dlHtml + quickHtml;

    /* ── Resumen financiero (reutilizamos el existente) ── */
    this._rInfoFinancial();
  },

  _rInfoFinancial() {
    const el = document.getElementById('infoFinancial');
    const ps = D.ps();
    if (!ps.length) { el.innerHTML = ''; return; }

    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const type = this.infoPeriod || 'mes';

    const periodLabel = type === 'mes' ? `${MESES[month]} ${year}`
      : type === 'trim' ? `T${Math.floor(month / 3) + 1} ${year}`
      : `${year}`;

    let cobrado = 0;
    const projTotals = {};

    ps.forEach(p => {
      B.calc(p);
      const f = p.facturacion;
      const hex = colorHex(p.color);
      const key = p.id;
      const touch = (fecha) => {
        if (!projTotals[key]) projTotals[key] = { nombre: p.nombre, total: 0, color: hex, firstDate: fecha };
        else if (fecha < projTotals[key].firstDate) projTotals[key].firstDate = fecha;
      };
      p.horas.forEach(h => {
        if (h.fecha && inPeriod(h.fecha, type, year, month)) {
          if (h.monto) {
            cobrado += h.monto;
            touch(h.fecha);
            projTotals[key].total += h.monto;
          }
        }
      });
      (f.cobros || []).forEach(c => {
        if (c.fecha && inPeriod(c.fecha, type, year, month)) {
          cobrado += c.cantidad || 0;
          touch(c.fecha);
          projTotals[key].total += c.cantidad || 0;
        }
      });
    });
    const incomeSegs = Object.values(projTotals).filter(s => s.total > 0);
    incomeSegs.sort((a, b) => (a.firstDate || '').localeCompare(b.firstDate || ''));

    let gastosTotal = 0;
    D.gs().forEach(g => {
      (g.entradas || []).forEach(e => {
        if (e.fecha && inPeriod(e.fecha, type, year, month)) {
          gastosTotal += e.cantidad || 0;
        }
      });
    });

    const neto = cobrado - gastosTotal;
    const isEmpty = cobrado === 0 && gastosTotal === 0;
    if (isEmpty) { el.innerHTML = ''; return; }

    const maxBar = Math.max(cobrado, gastosTotal, 1);

    /* stacked income bar segments */
    let incSegsHtml = '';
    if (cobrado > 0) {
      incomeSegs.forEach(seg => {
        const pct = (seg.total / cobrado * 100).toFixed(1);
        incSegsHtml += `<div class="pbar-seg" style="width:${pct}%;background:${seg.color}" title="${esc(seg.nombre)}: ${fmtMoney(seg.total)}"></div>`;
      });
    }
    const incBarWidth = (cobrado / maxBar * 100).toFixed(1);

    /* OKLAB blended color */
    let incAmtColor = 'var(--ok)';
    if (incomeSegs.length === 1) incAmtColor = incomeSegs[0].color;
    else if (incomeSegs.length > 1) incAmtColor = colorBlendOklab(incomeSegs.map(s => ({ color: s.color, weight: s.total })));

    el.innerHTML =
      `<div class="info-fin">`
      + `<div class="info-fin-header">`
      +   `<span class="info-fin-title">${t('info.financialSummary')} — ${periodLabel}</span>`
      +   `<div class="info-fin-toggle">`
      +     `<button class="info-fin-tb${type === 'mes' ? ' on' : ''}" onclick="App._infoType('mes')">${t('info.month')}</button>`
      +     `<button class="info-fin-tb${type === 'trim' ? ' on' : ''}" onclick="App._infoType('trim')">${t('info.quarter')}</button>`
      +     `<button class="info-fin-tb${type === 'año' ? ' on' : ''}" onclick="App._infoType('año')">${t('info.year')}</button>`
      +   `</div>`
      + `</div>`
      + `<div class="fin-row">`
      +   `<span class="fin-label">${t('info.collected')}</span>`
      +   `<div class="fin-bar"><div class="pbar"><div class="pbar-fill pbar-stacked" style="width:${incBarWidth}%">${incSegsHtml}</div></div></div>`
      +   `<span class="fin-value" style="color:${incAmtColor}">${fmtMoney(cobrado)}</span>`
      + `</div>`
      + (gastosTotal > 0
        ? `<div class="fin-row">`
        +   `<span class="fin-label">${t('info.expensesLabel')}</span>`
        +   `<div class="fin-bar"><div class="pbar"><div class="pbar-fill pbar-warn" style="width:${(gastosTotal / maxBar * 100).toFixed(1)}%"></div></div></div>`
        +   `<span class="fin-value" style="color:var(--warn)">${fmtMoney(gastosTotal)}</span>`
        + `</div>`
        : '')
      + `<div class="fin-sep"></div>`
      + `<div class="fin-row fin-total">`
      +   `<span class="fin-label">${t('info.netLabel')}</span>`
      +   `<div class="fin-bar"></div>`
      +   `<span class="fin-value" style="color:${neto >= 0 ? 'var(--ok)' : 'var(--bad)'}">${fmtMoney(neto)}</span>`
      + `</div>`
      + `</div>`;
  },

  _infoType(tp) {
    this.infoPeriod = tp;
    this._rInfoFinancial();
  }

});
