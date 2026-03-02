/* ================================================
 * TRACKR — App: Vista Calendario
 * Globales: extiende App
 * Dependencias: app.js (App base), utils.js, store.js,
 *               billing.js, colors.js
 * ================================================ */

Object.assign(App, {

  rCal() {
    if (this.calView === 'week') this.rCalWeek();
    else this.rCalMonth();
  },

  rCalMonth() {
    if (this.calY === null) { const n = new Date(); this.calY = n.getFullYear(); this.calM = n.getMonth(); }
    const year = this.calY, month = this.calM;
    const first = new Date(year, month, 1);
    const daysIn = new Date(year, month + 1, 0).getDate();
    const startDow = (first.getDay() + 6) % 7;
    const totalCells = Math.ceil((startDow + daysIn) / 7) * 7;
    const today = todayStr();
    const mKey = `${year}-${String(month + 1).padStart(2, '0')}`;

    const ps = D.ps();
    const hm = {}; let mt = 0;
    const pStats = {};

    ps.forEach(p => {
      const hex = colorHex(p.color);
      p.horas.forEach(h => {
        if (!h.fecha) return;
        if (!hm[h.fecha]) hm[h.fecha] = [];
        hm[h.fecha].push({ pid: p.id, pn: p.nombre, pc: hex, tipo: h.tipo, cant: h.cantidad, nota: h.nota });
        if (h.fecha.startsWith(mKey)) {
          mt += h.cantidad;
          if (!pStats[p.id]) pStats[p.id] = { pn: p.nombre, pc: hex, h: 0 };
          pStats[p.id].h += h.cantidad;
        }
      });
    });

    const gm = {};
    D.gs().forEach(g => {
      const gc = colorHex(g.color || 'Salmon');
      (g.entradas || []).forEach(e => {
        if (!e.fecha) return;
        if (!gm[e.fecha]) gm[e.fecha] = [];
        gm[e.fecha].push({ gn: g.nombre, gc, cant: e.cantidad || 0 });
      });
    });

    const cells = [];
    for (let i = 0; i < totalCells; i++) {
      const d = new Date(year, month, 1 + (i - startDow));
      const ds = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      cells.push({ date: ds, num: d.getDate(), in: d.getMonth() === month && d.getFullYear() === year, today: ds === today });
    }

    let g = DIAS_SEM.map(d => `<div class="cal-dow">${d}</div>`).join('');
    cells.forEach(c => {
      const cl = ['cal-day'];
      if (!c.in) cl.push('out');
      if (c.today) cl.push('today');
      const es = (hm[c.date] || []).map(e =>
        `<div class="cal-entry" style="border-left-color:${e.pc}"><span class="cal-e-ico">${e.tipo === 'trabajo' ? '💻' : '👥'}</span><span class="cal-e-h m">${e.cant}h</span><span class="cal-e-p">${esc(e.pn)}</span></div>`
      ).join('');
      const ge = (gm[c.date] || []).map(e =>
        `<div class="cal-entry cal-entry-gasto" style="border-left-color:${e.gc}"><span class="cal-e-ico">€</span><span class="cal-e-h m">${fmtMoney(e.cant)}</span><span class="cal-e-p">${esc(e.gn)}</span></div>`
      ).join('');
      g += `<div class="${cl.join(' ')}" onclick="App.calDetail('${c.date}')"><div class="cal-num">${c.num}</div>${es}${ge}</div>`;
    });

    /* ── Lista de gastos del mes ── */
    const monthGastos = [];
    D.gs().forEach(gasto => {
      const gc = colorHex(gasto.color || 'Salmon');
      (gasto.entradas || []).forEach(e => {
        if (e.fecha && e.fecha.startsWith(mKey)) {
          monthGastos.push({ gn: gasto.nombre, gc, cant: e.cantidad || 0, fecha: e.fecha, nota: e.nota || '' });
        }
      });
    });
    monthGastos.sort((a, b) => a.fecha.localeCompare(b.fecha));
    let mgHtml = '';
    if (monthGastos.length) {
      const mgTotal = monthGastos.reduce((s, e) => s + e.cant, 0);
      mgHtml = `<div class="cal-nt"><div class="cal-nt-title">Gastos del mes <span class="m" style="font-weight:400;font-size:.78rem;color:var(--warn)">${fmtMoney(mgTotal)}</span></div><div class="hl">${monthGastos.map(e =>
        `<div class="hr" style="border-left-color:${e.gc}"><span class="hr-t">€</span><span class="hr-d">${fmtDate(e.fecha)}</span><span class="hr-a m">${fmtMoney(e.cant)}</span><span style="color:var(--t1);font-size:.82rem;flex:1">${esc(e.gn)}</span>${e.nota ? `<span class="hr-n">${esc(e.nota)}</span>` : ''}</div>`
      ).join('')}</div></div>`;
    }

    /* ── Lista de cobros del mes ── */
    const monthCobros = [];
    ps.forEach(p => {
      B.calc(p);
      const f = p.facturacion;
      const hex = colorHex(p.color);
      if (f.pagado && f.fechaPago && f.fechaPago.startsWith(mKey)) {
        monthCobros.push({ pn: p.nombre, pc: hex, total: f.netoRecibido || 0, fecha: f.fechaPago });
      }
      p.horas.forEach(h => {
        if (h.monto && h.fecha && h.fecha.startsWith(mKey)) {
          monthCobros.push({ pn: p.nombre, pc: hex, total: h.monto, fecha: h.fecha });
        }
      });
    });
    monthCobros.sort((a, b) => a.fecha.localeCompare(b.fecha));
    let mcHtml = '';
    if (monthCobros.length) {
      const mcTotal = monthCobros.reduce((s, e) => s + e.total, 0);
      mcHtml = `<div class="cal-nt"><div class="cal-nt-title">Cobros del mes <span class="m" style="font-weight:400;font-size:.78rem;color:var(--ok)">${fmtMoney(mcTotal)}</span></div><div class="hl">${monthCobros.map(e =>
        `<div class="hr" style="border-left-color:${e.pc}"><span class="hr-t">✓</span><span class="hr-d">${fmtDate(e.fecha)}</span><span class="hr-a m" style="color:var(--ok)">${fmtMoney(e.total)}</span><span style="color:var(--t1);font-size:.82rem;flex:1">${esc(e.pn)}</span></div>`
      ).join('')}</div></div>`;
    }

    document.getElementById('calC').innerHTML =
      this._calHeader(`${MESES[month]} ${year}`, `Total mes: <span class="m">${mt.toFixed(1)}h</span>`)
      + `<div class="cal-grid">${g}</div>`
      + mgHtml + mcHtml
      + this._calGoals('month', mt, year, month)
      + this._calProjStats(pStats)
      + this._calFinancial(year, month);
  },

  rCalWeek() {
    if (!this.calWeekStart) {
      const n = new Date(); const dow = (n.getDay() + 6) % 7;
      this.calWeekStart = new Date(n.getFullYear(), n.getMonth(), n.getDate() - dow);
    }
    const ws = this.calWeekStart;
    const today = todayStr();

    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(ws.getFullYear(), ws.getMonth(), ws.getDate() + i);
      const ds = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      days.push({ date: ds, num: d.getDate(), dow: DIAS_SEM[i], today: ds === today, d });
    }

    const d0 = days[0].d, d6 = days[6].d;
    const title = d0.getMonth() === d6.getMonth()
      ? `${days[0].num}–${days[6].num} ${MESES[d0.getMonth()]} ${d0.getFullYear()}`
      : `${days[0].num} ${MESES[d0.getMonth()]} – ${days[6].num} ${MESES[d6.getMonth()]} ${d6.getFullYear()}`;

    const ps = D.ps();
    const hm = {}; let wt = 0;
    const pStats = {};
    const dateSet = new Set(days.map(d => d.date));
    ps.forEach(p => {
      const hex = colorHex(p.color);
      p.horas.forEach(h => {
        if (!h.fecha || !dateSet.has(h.fecha)) return;
        if (!hm[h.fecha]) hm[h.fecha] = [];
        hm[h.fecha].push({ pid: p.id, hid: h.id, pn: p.nombre, pc: hex, tipo: h.tipo, cant: h.cantidad, nota: h.nota, hi: h.horaInicio });
        wt += h.cantidad;
        if (!pStats[p.id]) pStats[p.id] = { pn: p.nombre, pc: hex, h: 0 };
        pStats[p.id].h += h.cantidad;
      });
    });

    const weekGastos = [];
    D.gs().forEach(gasto => {
      const gc = colorHex(gasto.color || 'Salmon');
      (gasto.entradas || []).forEach(e => {
        if (e.fecha && dateSet.has(e.fecha)) {
          weekGastos.push({ gn: gasto.nombre, gc, cant: e.cantidad || 0, fecha: e.fecha });
        }
      });
    });

    const hStart = 0, hEnd = 24, slotH = 60;
    let hdr = '<div class="cal-wc"></div>';
    days.forEach(d => { hdr += `<div class="cal-wh${d.today ? ' today' : ''}"><span class="cal-wh-dow">${d.dow}</span><span class="cal-wh-num">${d.num}</span></div>`; });

    const noTimeEntries = [];
    const colEvts = days.map(d => {
      const es = hm[d.date] || [];
      const timed = [];
      es.forEach(e => { if (!e.hi) { noTimeEntries.push({ ...e, fecha: d.date }); return; } timed.push(e); });
      return timed;
    });

    let timeLbl = '';
    for (let hr = hStart; hr < hEnd; hr++) timeLbl += `<div class="cal-tl">${String(hr).padStart(2, '0')}:00</div>`;

    let cols = '';
    days.forEach((d, di) => {
      let slots = '';
      for (let hr = hStart; hr < hEnd; hr++) {
        slots += `<div class="cal-slot" data-date="${d.date}" data-hr="${hr}" data-min="0" data-col="${di}"></div>`;
        slots += `<div class="cal-slot" data-date="${d.date}" data-hr="${hr}" data-min="30" data-col="${di}"></div>`;
      }
      let evts = '';
      colEvts[di].forEach(e => {
        const parts = e.hi.split(':');
        const mins = parseInt(parts[0]) * 60 + parseInt(parts[1]);
        const top = ((mins - hStart * 60) / 60) * slotH;
        const height = e.cant * slotH;
        evts += `<div class="cal-evt" style="top:${top}px;height:${Math.max(height, 20)}px;--ec:${e.pc}" onclick="event.stopPropagation();App.eHour('${e.pid}','${e.hid}')"><span class="cal-evt-t">${e.tipo === 'trabajo' ? '💻' : '👥'} ${e.cant}h</span><span class="cal-evt-n">${esc(e.pn)}</span></div>`;
      });
      cols += `<div class="cal-wcol" data-col="${di}">${slots}${evts}</div>`;
    });

    let ntHtml = '';
    if (noTimeEntries.length) {
      ntHtml = `<div class="cal-nt"><div class="cal-nt-title">Sin hora asignada</div><div class="hl">${noTimeEntries.map(e =>
        `<div class="hr" style="border-left-color:${e.pc}"><span class="hr-t">${e.tipo === 'trabajo' ? '💻' : '👥'}</span><span class="hr-a m">${e.cant}h</span><span style="color:var(--t1);font-size:.82rem;flex:1">${esc(e.pn)}</span><span class="hr-n">${esc(e.nota || '')}</span><span class="hr-e" onclick="App.eHour('${e.pid}','${e.hid}')" title="Editar">&#9998;</span></div>`
      ).join('')}</div></div>`;
    }

    let wgHtml = '';
    if (weekGastos.length) {
      const wgTotal = weekGastos.reduce((s, e) => s + e.cant, 0);
      wgHtml = `<div class="cal-nt"><div class="cal-nt-title">Gastos de la semana <span class="m" style="font-weight:400;font-size:.78rem;color:var(--warn)">${fmtMoney(wgTotal)}</span></div><div class="hl">${weekGastos.map(e =>
        `<div class="hr" style="border-left-color:${e.gc}"><span class="hr-t">€</span><span class="hr-d">${fmtDate(e.fecha)}</span><span class="hr-a m">${fmtMoney(e.cant)}</span><span style="color:var(--t1);font-size:.82rem;flex:1">${esc(e.gn)}</span></div>`
      ).join('')}</div></div>`;
    }

    /* ── Cobros de la semana ── */
    const weekCobros = [];
    ps.forEach(p => {
      B.calc(p);
      const f = p.facturacion;
      const hex = colorHex(p.color);
      if (f.pagado && f.fechaPago && dateSet.has(f.fechaPago)) {
        weekCobros.push({ pn: p.nombre, pc: hex, total: f.netoRecibido || 0, fecha: f.fechaPago });
      }
      p.horas.forEach(h => {
        if (h.monto && h.fecha && dateSet.has(h.fecha)) {
          weekCobros.push({ pn: p.nombre, pc: hex, total: h.monto, fecha: h.fecha });
        }
      });
    });
    let wcHtml = '';
    if (weekCobros.length) {
      const wcTotal = weekCobros.reduce((s, e) => s + e.total, 0);
      wcHtml = `<div class="cal-nt"><div class="cal-nt-title">Cobros de la semana <span class="m" style="font-weight:400;font-size:.78rem;color:var(--ok)">${fmtMoney(wcTotal)}</span></div><div class="hl">${weekCobros.map(e =>
        `<div class="hr" style="border-left-color:${e.pc}"><span class="hr-t">✓</span><span class="hr-d">${fmtDate(e.fecha)}</span><span class="hr-a m" style="color:var(--ok)">${fmtMoney(e.total)}</span><span style="color:var(--t1);font-size:.82rem;flex:1">${esc(e.pn)}</span></div>`
      ).join('')}</div></div>`;
    }

    document.getElementById('calC').innerHTML =
      this._calHeader(title, `Total semana: <span class="m">${wt.toFixed(1)}h</span>`)
      + `<div class="cal-week" style="--slot-h:${slotH}px"><div class="cal-week-hdr">${hdr}</div><div class="cal-week-body"><div class="cal-week-tl">${timeLbl}</div>${cols}</div></div>`
      + ntHtml + wgHtml + wcHtml
      + this._calGoals('week', wt, ws.getFullYear(), ws.getMonth())
      + this._calProjStats(pStats)
      + this._calFinancial(ws.getFullYear(), ws.getMonth());

    this._calWeekDrag(hStart, hEnd, slotH);
  },

  _calHeader(title, stat) {
    const isM = this.calView === 'month';
    return `<div class="cal-hd"><button class="bt bt-s" onclick="App.calPrev()">&larr;</button>`
      + `<span class="cal-title">${title}</span>`
      + `<button class="bt bt-s" onclick="App.calNext()">&rarr;</button>`
      + `<button class="bt bt-s" onclick="App.calToday()">Hoy</button>`
      + `<div class="cal-vt"><button class="cal-vb${isM ? ' on' : ''}" onclick="App.calSetView('month')">Mes</button><button class="cal-vb${!isM ? ' on' : ''}" onclick="App.calSetView('week')">Semana</button></div></div>`
      + `<div class="cal-stat"><span class="cal-stat-l">${stat}</span></div>`;
  },

  _calGoals(view, actual, year, month) {
    const t = D.d.settings.targets;
    if (!t) return '';
    const goals = [];
    let weeklyHtml = '';

    if (view === 'month') {
      if (t.horasMes) goals.push({ label: 'Horas/mes', actual, target: t.horasMes, unit: 'h' });
      else if (t.horasSemana) goals.push({ label: 'Horas/mes', actual, target: Math.round(t.horasSemana * 4.33), unit: 'h', derived: `${t.horasSemana}h/sem × 4.33` });

      /* ── Mini-barras semanales ── */
      if (t.horasSemana) {
        const daysIn = new Date(year, month + 1, 0).getDate();
        const weeks = [];
        let ws = 1;
        while (ws <= daysIn) {
          const d = new Date(year, month, ws);
          const dow = (d.getDay() + 6) % 7; /* 0=lun */
          const we = Math.min(ws + (6 - dow), daysIn);
          const nDays = we - ws + 1;
          weeks.push({ from: ws, to: we, nDays, h: 0 });
          ws = we + 1;
        }
        /* Sum hours per week */
        const mKey = `${year}-${String(month + 1).padStart(2, '0')}`;
        D.ps().forEach(p => {
          p.horas.forEach(h => {
            if (!h.fecha || !h.fecha.startsWith(mKey)) return;
            const day = parseInt(h.fecha.split('-')[2]);
            const w = weeks.find(w => day >= w.from && day <= w.to);
            if (w) w.h += h.cantidad;
          });
        });

        const target = t.horasSemana;
        weeklyHtml = `<div style="margin-bottom:.6rem"><div style="display:flex;justify-content:space-between;font-size:.78rem;margin-bottom:.25rem"><span style="color:var(--t2)">Horas/semana</span><span style="color:var(--t3);font-size:.7rem">obj: ${target}h</span></div><div class="cal-wseg">`;
        weeks.forEach(w => {
          const adjTarget = target * w.nDays / 7;
          const pct = Math.min(adjTarget > 0 ? (w.h / adjTarget * 100) : 0, 100).toFixed(1);
          const widthPct = (w.nDays / daysIn * 100).toFixed(1);
          weeklyHtml += `<div class="cal-wseg-item" style="width:${widthPct}%"><div class="cal-wseg-bar" title="${w.h.toFixed(1)}h (${w.from}–${w.to})"><div class="cal-wseg-fill" style="width:${pct}%"></div></div><span class="cal-wseg-lbl">${w.from}–${w.to}</span></div>`;
        });
        weeklyHtml += `</div></div>`;
      }

      if (t.ingresosMes) {
        let income = 0;
        D.ps().forEach(p => {
          B.calc(p); const f = p.facturacion;
          if (f.pagado && f.fechaPago && inPeriod(f.fechaPago, 'mes', year, month)) income += f.netoRecibido || 0;
          p.horas.forEach(h => { if (h.monto && h.fecha && inPeriod(h.fecha, 'mes', year, month)) income += h.monto; });
        });
        goals.push({ label: 'Ingresos', actual: income, target: t.ingresosMes, unit: '€' });
      }
    } else {
      if (t.horasSemana) goals.push({ label: 'Horas', actual, target: t.horasSemana, unit: 'h' });
    }
    if (!goals.length && !weeklyHtml) return `<div class="cal-ps" style="margin-top:1rem"><span style="font-size:.78rem;color:var(--t3)">Sin objetivos. <a href="#" onclick="event.preventDefault();App.go('cfg')" style="color:var(--t2)">Configurar &rarr;</a></span></div>`;

    let html = `<div class="cal-ps" style="margin-top:1.25rem"><div class="cal-ps-title">Objetivos</div>`;
    goals.forEach(g => {
      const pct = g.target > 0 ? (g.actual / g.target * 100) : 0;
      const barColor = pct >= 100 ? 'pbar-ok' : pct >= 50 ? 'pbar-neutral' : 'pbar-warn';
      const valStr = g.unit === '€' ? fmtMoney(g.actual) : `${g.actual.toFixed(1)}${g.unit}`;
      const tgtStr = g.unit === '€' ? fmtMoney(g.target) : `${g.target}${g.unit}`;
      html += `<div style="margin-bottom:.6rem"><div style="display:flex;justify-content:space-between;font-size:.78rem;margin-bottom:.25rem"><span style="color:var(--t2)">${g.label}${g.derived ? ` <span style="color:var(--t3);font-size:.7rem">(${g.derived})</span>` : ''}</span><span class="m" style="color:var(--t1)">${valStr} / ${tgtStr}</span></div><div class="pbar"><div class="pbar-fill ${barColor}" style="width:${Math.min(pct, 100).toFixed(1)}%"></div></div></div>`;
    });
    html += weeklyHtml;
    return html + '</div>';
  },

  _calProjStats(pStats) {
    const list = Object.entries(pStats).map(([id, v]) => ({ id, ...v })).sort((a, b) => b.h - a.h);
    if (!list.length) return '';
    return `<div class="cal-ps"><div class="cal-ps-title">Proyectos en este periodo</div><div class="cal-ps-list">${
      list.map(p => `<div class="cal-ps-item cal-ps-click" onclick="App.go('det','${p.id}')"><span class="cal-ps-dot" style="background:${p.pc}"></span><span class="cal-ps-name">${esc(p.pn)}</span><span class="cal-ps-h m">${p.h.toFixed(1)}h</span></div>`).join('')
    }</div></div>`;
  },

  _calFinancial(year, month) {
    let cobrado = 0, horas = 0, gastosTotal = 0;
    D.ps().forEach(p => {
      B.calc(p);
      if (p.facturacion.pagado && p.facturacion.fechaPago && inPeriod(p.facturacion.fechaPago, 'mes', year, month)) cobrado += p.facturacion.netoRecibido || 0;
      p.horas.forEach(h => {
        if (h.fecha && inPeriod(h.fecha, 'mes', year, month)) { horas += h.cantidad; if (h.monto) cobrado += h.monto; }
      });
    });
    D.gs().forEach(g => { (g.entradas || []).forEach(e => { if (e.fecha && inPeriod(e.fecha, 'mes', year, month)) gastosTotal += e.cantidad || 0; }); });
    if (cobrado === 0 && gastosTotal === 0) return '';
    const neto = cobrado - gastosTotal;
    const eurH = horas > 0 ? neto / horas : 0;
    return `<div class="cal-ps" style="margin-top:1.25rem"><div class="cal-ps-title">Resumen del mes</div>`
      + `<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(100px,1fr));gap:.5rem;font-size:.82rem">`
      + `<div><span style="color:var(--t3)">Cobrado</span><div class="m" style="color:var(--ok)">${fmtMoney(cobrado)}</div></div>`
      + `<div><span style="color:var(--t3)">Gastos</span><div class="m" style="color:var(--warn)">-${fmtMoney(gastosTotal)}</div></div>`
      + `<div><span style="color:var(--t3)">Neto</span><div class="m" style="color:${neto >= 0 ? 'var(--ok)' : 'var(--bad)'}">${fmtMoney(neto)}</div></div>`
      + `<div><span style="color:var(--t3)">&euro;/h real</span><div class="m">${fmtNum(eurH)} &euro;/h</div></div>`
      + `</div></div>`;
  },

  _calWeekDrag(hStart, hEnd, slotH) {
    const wkBody = document.querySelector('.cal-week-body');
    if (!wkBody) return;

    let drag = null;

    const minFromY = (y, wcol) => {
      const rect = wcol.getBoundingClientRect();
      return hStart * 60 + Math.floor(Math.max(0, y - rect.top) / slotH * 60);
    };

    const snap30 = m => Math.floor(m / 30) * 30;

    const updatePreview = endMin => {
      if (!drag) return;
      const st = drag.startHr * 60 + drag.startMin;
      let et = snap30(endMin) + 30;
      if (et <= st) et = st + 30;
      if (et > hEnd * 60) et = hEnd * 60;
      drag.preview.style.top = ((st - hStart * 60) / 60) * slotH + 'px';
      drag.preview.style.height = Math.max(((et - st) / 60) * slotH, 15) + 'px';
      drag.endMin = et;
    };

    const finishDrag = () => {
      if (!drag) return;
      const d = drag; drag = null;
      document.removeEventListener('mousemove', onDocMove);
      document.removeEventListener('mouseup', onDocUp);
      if (d.preview.parentNode) d.preview.remove();
      const st = d.startHr * 60 + d.startMin;
      const dur = (d.endMin - st) / 60;
      App.calAddHour(d.date, `${String(d.startHr).padStart(2, '0')}:${String(d.startMin).padStart(2, '0')}`, dur > 0 ? dur : 0.5);
    };

    const onDocMove = ev => {
      if (!drag) return;
      ev.preventDefault();
      updatePreview(minFromY(ev.clientY, drag.wcol));
    };
    const onDocUp = () => finishDrag();

    wkBody.addEventListener('mousedown', ev => {
      const slot = ev.target.closest('.cal-slot');
      if (!slot) return;
      ev.preventDefault();
      const wcol = slot.closest('.cal-wcol');
      const pv = document.createElement('div');
      pv.className = 'cal-drag-pv';
      wcol.appendChild(pv);
      drag = {
        startHr: parseInt(slot.dataset.hr),
        startMin: parseInt(slot.dataset.min),
        date: slot.dataset.date,
        preview: pv,
        wcol,
        endMin: parseInt(slot.dataset.hr) * 60 + parseInt(slot.dataset.min) + 30
      };
      updatePreview(drag.startHr * 60 + drag.startMin);
      document.addEventListener('mousemove', onDocMove);
      document.addEventListener('mouseup', onDocUp);
    });
  },

  calSetView(v) { T.ev('nav', 'cal_view', v); this.calView = v; this.rCal(); },
  calPrev() {
    if (this.calView === 'week') { const ws = this.calWeekStart; this.calWeekStart = new Date(ws.getFullYear(), ws.getMonth(), ws.getDate() - 7); }
    else { this.calM--; if (this.calM < 0) { this.calM = 11; this.calY--; } }
    this.rCal();
  },
  calNext() {
    if (this.calView === 'week') { const ws = this.calWeekStart; this.calWeekStart = new Date(ws.getFullYear(), ws.getMonth(), ws.getDate() + 7); }
    else { this.calM++; if (this.calM > 11) { this.calM = 0; this.calY++; } }
    this.rCal();
  },
  calToday() {
    const n = new Date(); this.calY = n.getFullYear(); this.calM = n.getMonth();
    const dow = (n.getDay() + 6) % 7;
    this.calWeekStart = new Date(n.getFullYear(), n.getMonth(), n.getDate() - dow);
    this.rCal();
  },

  calDetail(ds) {
    const ps = D.ps(), es = [];
    ps.forEach(p => { const hex = colorHex(p.color); p.horas.forEach(h => { if (h.fecha === ds) es.push({ ...h, pn: p.nombre, pc: hex, pid: p.id }); }); });
    const tot = es.reduce((s, e) => s + e.cantidad, 0);
    const withTime = es.filter(e => e.horaInicio).sort((a, b) => a.horaInicio.localeCompare(b.horaInicio));
    const noTime = es.filter(e => !e.horaInicio);

    let body = '';
    if (withTime.length) {
      body += `<div class="hl">${withTime.map(e =>
        `<div class="hr" style="border-left-color:${e.pc}"><span class="hr-d m" style="min-width:45px">${e.horaInicio}</span><span class="hr-t">${e.tipo === 'trabajo' ? '💻' : '👥'}</span><span class="hr-a m">${e.cantidad}h</span><span style="color:var(--t1);font-size:.82rem;flex:1">${esc(e.pn)}</span><span class="hr-n">${esc(e.nota || '')}</span><span class="hr-e" onclick="App.cm();App.eHour('${e.pid}','${e.id}')" title="Editar">&#9998;</span><span class="hr-e" onclick="App.cm();App.go('det','${e.pid}')" title="Ver proyecto">&rarr;</span></div>`
      ).join('')}</div>`;
    }
    if (noTime.length) {
      body += `<div style="margin-top:.75rem;font-size:.72rem;color:var(--t3);text-transform:uppercase;letter-spacing:.04em;margin-bottom:.4rem">Sin hora asignada</div>`
        + `<div class="hl">${noTime.map(e =>
          `<div class="hr" style="border-left-color:${e.pc}"><span class="hr-t">${e.tipo === 'trabajo' ? '💻' : '👥'}</span><span class="hr-a m">${e.cantidad}h</span><span style="color:var(--t1);font-size:.82rem;flex:1">${esc(e.pn)}</span><span class="hr-n">${esc(e.nota || '')}</span><span class="hr-e" onclick="App.cm();App.eHour('${e.pid}','${e.id}')" title="Editar">&#9998;</span><span class="hr-e" onclick="App.cm();App.go('det','${e.pid}')" title="Ver proyecto">&rarr;</span></div>`
        ).join('')}</div>`;
    }
    if (!es.length) body += '<div class="es"><div class="tx">Sin horas este día</div></div>';

    const dayGastos = [];
    D.gs().forEach(gasto => {
      const gc = colorHex(gasto.color || 'Salmon');
      (gasto.entradas || []).forEach(e => {
        if (e.fecha === ds) dayGastos.push({ gn: gasto.nombre, gc, cant: e.cantidad || 0, nota: e.nota || '' });
      });
    });
    if (dayGastos.length) {
      body += `<div style="margin-top:.75rem;font-size:.72rem;color:var(--t3);text-transform:uppercase;letter-spacing:.04em;margin-bottom:.4rem">Gastos</div>`
        + `<div class="hl">${dayGastos.map(e =>
          `<div class="hr" style="border-left-color:${e.gc}"><span class="hr-t">€</span><span class="hr-a m">${fmtMoney(e.cant)}</span><span style="color:var(--t1);font-size:.82rem;flex:1">${esc(e.gn)}</span><span class="hr-n">${esc(e.nota)}</span></div>`
        ).join('')}</div>`;
    }

    this.om(`<div class="mt">${fmtDate(ds)}</div><div style="margin-bottom:.75rem;font-size:.82rem;color:var(--t3)">Total: <span class="m">${tot.toFixed(1)}h</span></div>${body}<div class="ma"><button class="bt bt-p" onclick="App.cm();App.calAddHour('${ds}','')">+ Añadir hora</button><button class="bt" onclick="App.cm()">Cerrar</button></div>`);
  },

  _projOptions(selectedId) {
    const ps = D.ps();
    const groups = {};
    ps.forEach(p => { if (!groups[p.estado]) groups[p.estado] = []; groups[p.estado].push(p); });
    const labels = { activo: 'Activos', pausado: 'Pausados', completado: 'Completados', abandonado: 'Abandonados' };
    let html = '';
    EST_ORDER.forEach(st => {
      const g = groups[st];
      if (!g || !g.length) return;
      html += `<optgroup label="${labels[st]}">`;
      g.forEach(p => {
        const cn = clienteName(p);
        html += `<option value="${p.id}" ${p.id === selectedId ? 'selected' : ''}>${esc(p.nombre)}${cn ? ' — ' + esc(cn) : ''}</option>`;
      });
      html += `</optgroup>`;
    });
    return html;
  },

  calAddHour(fecha, hora, duracion) {
    const ps = D.ps();
    const dur = duracion || 1;
    const projOpts = this._projOptions();
    this.om(`<div class="mt">Añadir hora</div>`
      + `<div class="fg"><label>Proyecto</label><select id="chP" onchange="App._onCalProjChange(this.value)">${projOpts}<option value="_new">+ Crear nuevo proyecto...</option></select></div>`
      + `<div id="chPNew" style="display:none;background:var(--bg3);border:1px solid var(--b1);border-radius:var(--r);padding:.75rem;margin-bottom:.85rem">`
      +   `<div class="fg"><label>Nombre proyecto</label><input type="text" id="chPN" placeholder="Nombre del proyecto"></div>`
      +   `<div class="fg"><label>Cliente</label><select id="chPCl" onchange="document.getElementById('chPClNew').style.display=this.value==='_new'?'block':'none'"><option value="">— Sin cliente —</option>${D.cls().map(c => `<option value="${c.id}">${esc(c.nombre)}</option>`).join('')}<option value="_new">+ Nuevo cliente...</option></select></div>`
      +   `<div id="chPClNew" style="display:none"><div class="fg"><label>Nombre cliente</label><input type="text" id="chPClN" placeholder="Nombre del cliente"></div></div>`
      + `</div>`
      + `<label>Tipo</label><div class="ts2"><div class="to on" data-type="trabajo" onclick="App.selT(this)"><span class="ic">💻</span><span class="la">Trabajo</span></div><div class="to" data-type="reunion" onclick="App.selT(this)"><span class="ic">👥</span><span class="la">Reunión</span></div></div>`
      + `<div class="fr"><div class="fg"><label>Horas</label><input type="number" id="chA" min="0.25" step="0.25" value="${dur}"></div><div class="fg"><label>Fecha</label><input type="date" id="chD" value="${fecha || todayStr()}"></div></div>`
      + `<div class="fr"><div class="fg"><label>Hora inicio</label><input type="time" id="chHI" value="${hora || ''}"></div><div class="fg"><label>Cobro (€)</label><input type="number" id="chMo" min="0" step="0.01" placeholder="0"></div></div>`
      + `<div class="fg"><label>Nota</label><input type="text" id="chN" placeholder="¿Qué hiciste?"></div>`
      + `<div class="ma"><button class="bt" onclick="App.cm()">Cancelar</button><button class="bt bt-p" onclick="App.saveCalH()">Guardar</button></div>`);
  },

  _onCalProjChange(val) {
    document.getElementById('chPNew').style.display = val === '_new' ? 'block' : 'none';
  },

  saveCalH() {
    let pid = document.getElementById('chP').value;
    const tipo = document.querySelector('#mC .to.on')?.dataset.type || 'trabajo';
    const cant = parseFloat(document.getElementById('chA').value) || 0;
    const fecha = document.getElementById('chD').value || null;
    const horaInicio = document.getElementById('chHI').value || null;
    const nota = document.getElementById('chN').value.trim();
    const monto = parseFloat(document.getElementById('chMo').value) || 0;
    if (cant <= 0) return;

    if (pid === '_new') {
      const pName = document.getElementById('chPN')?.value?.trim();
      if (!pName) { Toast.warn('Nombre de proyecto obligatorio'); return; }
      let clienteId = document.getElementById('chPCl')?.value || null;
      let projColor = 'CornflowerBlue';
      if (clienteId === '_new') {
        const clName = document.getElementById('chPClN')?.value?.trim();
        if (!clName) { Toast.warn('Nombre de cliente obligatorio'); return; }
        const newCl = D.addCl({ id: uid(), nombre: clName, direccion1: '', direccion2: '', nif: '', color: projColor });
        clienteId = newCl.id;
      } else if (clienteId) {
        const cl = D.cl(clienteId);
        if (cl?.color) projColor = cl.color;
      } else { clienteId = null; }
      const newP = {
        id: uid(), nombre: pName, clienteId, color: projColor,
        estado: 'activo', interno: false, recurrente: false,
        fechas: { inicio: fecha, finEstimada: null, finReal: null },
        facturacion: { modo: 'gratis', baseImponible: 0, total: 0, iva: 0, irpf: 0, importeIva: 0, importeIrpf: 0, totalFactura: 0, netoRecibido: 0, ivaExcepcion: '', pagado: false, fechaPago: null, gastos: 0, facturaNum: null, facturaFecha: null },
        horas: [], notas: ''
      };
      D.add(newP);
      pid = newP.id;
    }
    if (!pid) return;
    const p = D.p(pid); if (!p) return;
    p.horas.push({ id: uid(), fecha, tipo, cantidad: cant, nota, horaInicio, monto });
    T.ev('action', 'hours_add', 'calendar');
    sortHoras(p.horas); D.up(pid, { horas: p.horas }); this.cm(); this.rCal();
  }

});
