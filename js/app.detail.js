/* ================================================
 * TRACKR — App: Vista Detalle de Proyecto + Horas
 * Globales: extiende App
 * Dependencias: app.js (App base), utils.js, store.js,
 *               billing.js, colors.js, lang.js
 * ================================================ */

Object.assign(App, {

  rDet(idOr) {
    const id = typeof idOr === 'string' ? idOr : this.cp;
    this.cp = id;
    const p = D.p(id);
    if (!p) { this.go('dash'); return; }
    B.calc(p);

    const hex = colorHex(p.color);
    const cn = clienteName(p);
    const f = p.facturacion;
    const th = p.horas.reduce((s, h) => s + h.cantidad, 0);
    const wh = p.horas.filter(h => h.tipo === 'trabajo').reduce((s, h) => s + h.cantidad, 0);
    const mh = p.horas.filter(h => h.tipo === 'reunion').reduce((s, h) => s + h.cantidad, 0);
    const eph = B.eph(p);

    document.getElementById('detC').innerHTML =
      this._detHeader(p, hex, cn, f)
      + this._detInfo(p, th, wh, mh)
      + this._detHours(p, hex)
      + this._detBilling(p, f, eph)
      + `<div style="display:flex;justify-content:flex-end;margin-top:1.5rem;padding-bottom:1rem"><button class="bt bt-s bt-d" onclick="App.xProj('${p.id}')">${t('btn.delete')}</button></div>`;
  },

  /* ── rDet sub-renderers ── */

  _detHeader(p, hex, cn, f) {
    let flags = '';
    if (p.interno) flags += ` <span class="pc-flag pc-flag-int">${t('dash.flagInternal')}</span>`;
    if (p.recurrente) flags += ` <span class="pc-flag pc-flag-rec">${t('dash.flagRecurring')}</span>`;

    let payBtn = '';
    if (f.modo !== 'gratis' && f.totalFactura > 0 && !f.pagado) {
      payBtn = `<button class="bt bt-s" onclick="App.cobroModal('${p.id}')" title="${t('billing.addPayment')}">💰 ${t('billing.addPayment')}</button>`;
    }

    return `<div class="db" onclick="App.go('dash')">${t('det.backProjects')}</div>`
      + `<div class="dh"><div><div class="dt" style="color:${hex}">${esc(p.nombre)}</div><div class="dc">${esc(cn)}${flags}</div></div>`
      + `<div class="bg"><span class="bd bd-${p.estado}">${EST[p.estado] || p.estado}</span>`
      +   `<button class="bt bt-s" onclick="App.pModal('${p.id}')">${t('btn.edit')}</button>`
      +   `${f.modo !== 'gratis' ? `<button class="bt bt-s" onclick="App.facModal('${p.id}')">${t('det.invoice')}</button>` : ''}`
      +   payBtn
      + `</div></div>`;
  },

  _detInfo(p, th, wh, mh) {
    return `<div class="ds"><div class="dst">${t('det.info')}</div><div class="dg">`
      + `<div><div class="dfl">${t('field.start')}</div><div class="dfv">${fmtDate(p.fechas.inicio)}</div></div>`
      + `<div><div class="dfl">${t('field.estEnd')}</div><div class="dfv">${fmtDate(p.fechas.finEstimada)}</div></div>`
      + `<div><div class="dfl">${t('field.actualEnd')}</div><div class="dfv">${fmtDate(p.fechas.finReal)}</div></div>`
      + `<div><div class="dfl">${t('field.hours')}</div><div class="dfv">${th.toFixed(1)}h <span style="color:var(--t3);font-size:.72rem">💻${wh.toFixed(1)} 👥${mh.toFixed(1)}</span></div></div>`
      + `</div>${p.notas ? `<div style="margin-top:.75rem"><div class="dfl">${t('field.notes')}</div><div style="color:var(--t3);font-size:.85rem">${esc(p.notas)}</div></div>` : ''}</div>`;
  },

  _detHours(p, hex) {
    const list = !p.horas.length
      ? `<div class="es"><div class="tx">${t('det.noHours')}</div></div>`
      : `<div class="hl">${p.horas.map(h =>
          `<div class="hr hr-click" style="border-left-color:${hex}" onclick="App.eHour('${p.id}','${h.id}')">
            <span class="hr-t">${h.tipo === 'trabajo' ? '💻' : '👥'}</span>
            <span class="hr-d">${fmtDate(h.fecha)}${h.horaInicio ? ' ' + h.horaInicio : ''}</span>
            <span class="hr-a m">${h.cantidad}h</span>${h.monto ? `<span class="hr-a m" style="color:var(--ok)">${fmtMoney(h.monto)}</span>` : ''}
            <span class="hr-n">${esc(h.nota || '')}</span>
            <span class="hr-x" onclick="event.stopPropagation();App.xHour('${p.id}','${h.id}')" title="${t('btn.delete')}">&times;</span>
          </div>`).join('')}</div>`;

    return `<div class="ds"><div style="display:flex;justify-content:space-between;align-items:center"><div class="dst" style="border:none;margin:0;padding:0">${t('det.hours')}</div><button class="bt bt-add" onclick="App.hModal('${p.id}')">${t('btn.addHour')}</button></div>${list}</div>`;
  },

  _detBilling(p, f, eph) {
    const breakdown = f.modo === 'gratis'
      ? `<div style="color:var(--t3);font-size:.85rem">${t('billing.freeProject')}</div>`
      : `<div class="bb">`
        + `<div class="br"><span class="la">${t('billing.taxableBase')}</span><span class="va">${fmtMoney(f.baseImponible || 0)}</span></div>`
        + (f.iva ? `<div class="br"><span class="la">${t('billing.plusIvaAmt', f.iva)}</span><span class="va">${fmtMoney(f.importeIva || 0)}</span></div>` : '')
        + (f.irpf ? `<div class="br"><span class="la">${t('billing.minusIrpfAmt', f.irpf)}</span><span class="va">${fmtMoney(f.importeIrpf || 0)}</span></div>` : '')
        + `<div class="br tot"><span class="la">${t('billing.invoiceTotal')}</span><span class="va">${fmtMoney(f.totalFactura || 0)}</span></div>`
        + `<div class="br"><span class="la">${t('billing.netToReceive')}</span><span class="va" style="color:var(--ok)">${fmtMoney(f.netoRecibido || 0)}</span></div>`
        + (eph !== null ? `<div class="br"><span class="la">${t('billing.profitability')}</span><span class="va" style="color:${eph >= 30 ? 'var(--ok)' : eph >= 15 ? 'var(--warn)' : 'var(--bad)'}">${eph.toFixed(2)} &euro;/h</span></div>` : '')
        + `</div>`;

    /* ── Cobros parciales ── */
    let cobrosHtml = '';
    if (f.modo !== 'gratis' && f.totalFactura > 0) {
      const cobros = f.cobros || [];
      const tc = B.totalCobrado(p);
      const pend = B.pendiente(p);
      const pct = Math.min(tc / f.totalFactura * 100, 100).toFixed(1);

      let listHtml = '';
      if (cobros.length) {
        listHtml = `<div class="hl" style="margin-top:.5rem">${cobros.map(c =>
          `<div class="hr"><span class="hr-d">${fmtDate(c.fecha)}</span><span class="hr-a m" style="color:var(--ok)">${fmtMoney(c.cantidad)}</span><span class="hr-x" onclick="App.delCobro('${p.id}','${c.id}')" title="${t('btn.delete')}">&times;</span></div>`
        ).join('')}</div>`;
      }

      const statusColor = f.pagado ? 'var(--ok)' : tc > 0 ? 'var(--warn)' : 'var(--t3)';
      const statusText = f.pagado
        ? t('billing.paid')
        : tc > 0
          ? t('billing.progress', fmtMoney(tc), fmtMoney(f.totalFactura))
          : t('billing.remaining', fmtMoney(pend));

      cobrosHtml = `<div style="margin-top:.75rem">`
        + `<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:.4rem">`
        +   `<span class="dst" style="border:none;margin:0;padding:0">${t('billing.payments')}</span>`
        +   (!f.pagado ? `<button class="bt bt-add" onclick="App.cobroModal('${p.id}')">${t('billing.addPayment')}</button>` : '')
        + `</div>`
        + `<div class="pbar" style="margin-bottom:.4rem"><div class="pbar-fill ${f.pagado ? 'pbar-ok' : 'pbar-neutral'}" style="width:${pct}%"></div></div>`
        + `<div style="font-size:.78rem;color:${statusColor}">${statusText}</div>`
        + listHtml
        + `</div>`;
    }

    return `<div class="ds"><div class="dst">${t('billing.title')}</div>${breakdown}`
      + (f.facturaFecha ? `<div style="margin-top:.3rem;font-size:.78rem;color:var(--t3)">${t('billing.invoiceNo', String(f.facturaNum), fmtDate(f.facturaFecha))}</div>` : '')
      + cobrosHtml
      + `</div>`;
  },

  eHour(pid, hid) {
    const p = D.p(pid); if (!p) return;
    const h = p.horas.find(x => x.id === hid); if (!h) return;
    const noDate = !h.fecha;

    this.om(
      `<div class="mt">${t('det.editHour')}</div>`
      + `<label>Tipo</label>`
      + `<div class="ts2">`
      +   `<div class="to ${h.tipo === 'trabajo' ? 'on' : ''}" data-type="trabajo" onclick="App.selT(this)"><span class="ic">💻</span><span class="la">${t('det.work')}</span></div>`
      +   `<div class="to ${h.tipo === 'reunion' ? 'on' : ''}" data-type="reunion" onclick="App.selT(this)"><span class="ic">👥</span><span class="la">${t('det.meeting')}</span></div>`
      + `</div>`
      + `<div class="fr"><div class="fg"><label>${t('field.hours')}</label><input type="number" id="ehA" min="0.25" step="0.25" value="${h.cantidad}"></div>`
      +   `<div class="fg"><label>${t('field.date')}</label><input type="date" id="ehD" value="${h.fecha || ''}" ${noDate ? 'disabled' : ''}>`
      +   `<label style="margin-top:.35rem;display:flex;align-items:center;gap:.4rem;cursor:pointer;text-transform:none;letter-spacing:0"><input type="checkbox" id="ehNd" ${noDate ? 'checked' : ''} onchange="document.getElementById('ehD').disabled=this.checked;if(this.checked)document.getElementById('ehD').value=''" style="width:auto;accent-color:var(--t2)"> ${t('field.noDate')}</label></div></div>`
      + `<div class="fr"><div class="fg"><label>${t('field.startTime')}</label><input type="time" id="ehHI" value="${h.horaInicio || ''}"></div><div class="fg"><label>${t('field.amount')}</label><input type="number" id="ehMo" min="0" step="0.01" value="${h.monto || ''}"></div></div>`
      + `<div class="fg"><label>${t('field.note')}</label><input type="text" id="ehN" value="${esc(h.nota || '')}"></div>`
      + `<div class="ma"><button class="bt" onclick="App.cm()">${t('btn.cancel')}</button><button class="bt bt-p" onclick="App.saveEH('${pid}','${hid}')">${t('btn.save')}</button></div>`
    );
  },

  saveEH(pid, hid) {
    const p = D.p(pid); if (!p) return;
    const h = p.horas.find(x => x.id === hid); if (!h) return;
    h.tipo = document.querySelector('#mC .to.on')?.dataset.type || h.tipo;
    h.cantidad = parseFloat(document.getElementById('ehA').value) || h.cantidad;
    const sinFecha = document.getElementById('ehNd')?.checked;
    h.fecha = sinFecha ? null : (document.getElementById('ehD').value || null);
    h.horaInicio = document.getElementById('ehHI').value || null;
    h.nota = document.getElementById('ehN').value.trim();
    h.monto = parseFloat(document.getElementById('ehMo').value) || 0;
    sortHoras(p.horas);
    D.up(pid, { horas: p.horas });
    this.cm();
    if (this.cv === 'cal') this.rCal(); else this.rDet(pid);
  },

  xHour(pid, hid) {
    const p = D.p(pid); if (!p) return;
    if (!confirm(t('det.deleteHourConfirm'))) return;
    p.horas = p.horas.filter(h => h.id !== hid);
    D.up(pid, { horas: p.horas });
    this.rDet(pid);
  },

  xProj(id) {
    const p = D.p(id); if (!p) return;
    if (confirm(t('det.deleteProjectConfirm', p.nombre))) { D.del(id); this.go('dash'); }
  },

  hModal(pid) {
    this.om(`<div class="mt">${t('det.addHours')}</div><label>Tipo</label>`
      + `<div class="ts2"><div class="to on" data-type="trabajo" onclick="App.selT(this)"><span class="ic">💻</span><span class="la">${t('det.work')}</span></div><div class="to" data-type="reunion" onclick="App.selT(this)"><span class="ic">👥</span><span class="la">${t('det.meeting')}</span></div></div>`
      + `<div class="fr"><div class="fg"><label>${t('field.hours')}</label><input type="number" id="mhA" min="0.25" step="0.25" value="1"></div>`
      + `<div class="fg"><label>${t('field.date')}</label><input type="date" id="mhD" value="${todayStr()}"><label style="margin-top:.35rem;display:flex;align-items:center;gap:.4rem;cursor:pointer;text-transform:none;letter-spacing:0"><input type="checkbox" id="mhNd" onchange="document.getElementById('mhD').disabled=this.checked;if(this.checked)document.getElementById('mhD').value=''" style="width:auto;accent-color:var(--t2)"> ${t('field.noDate')}</label></div></div>`
      + `<div class="fr"><div class="fg"><label>${t('field.startTime')}</label><input type="time" id="mhHI" value=""></div><div class="fg"><label>${t('field.amount')}</label><input type="number" id="mhMo" min="0" step="0.01" placeholder="0"></div></div>`
      + `<div class="fg"><label>${t('field.note')}</label><input type="text" id="mhN" placeholder="${t('ph.whatDidYouDo')}"></div>`
      + `<div class="ma"><button class="bt" onclick="App.cm()">${t('btn.cancel')}</button><button class="bt bt-p" onclick="App.saveHM('${pid}')">${t('btn.save')}</button></div>`);
  },

  saveHM(pid) {
    const tipo = document.querySelector('#mC .to.on')?.dataset.type || 'trabajo';
    const cant = parseFloat(document.getElementById('mhA').value) || 0;
    const sinF = document.getElementById('mhNd')?.checked;
    const fecha = sinF ? null : (document.getElementById('mhD').value || null);
    const horaInicio = document.getElementById('mhHI').value || null;
    const nota = document.getElementById('mhN').value.trim();
    const monto = parseFloat(document.getElementById('mhMo').value) || 0;
    if (cant <= 0) return;
    const p = D.p(pid); if (!p) return;
    p.horas.push({ id: uid(), fecha, tipo, cantidad: cant, nota, horaInicio, monto });
    T.ev('action', 'hours_add', 'modal');
    sortHoras(p.horas); D.up(pid, { horas: p.horas }); this.cm(); this.rDet(pid);
  }

});
