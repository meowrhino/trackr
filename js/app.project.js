/* ================================================
 * TRACKR — App: Modal de Proyecto (crear / editar)
 *
 * Extiende el objeto global App (definido en app.js, cargado antes).
 * Entrada externa: App.pModal(eid) via onclick. Incluye subrenderers _pm*,
 * preview de facturacion (cPrev), guardado (saveP), color picker (_cs*) y el
 * flujo pModal<->clModal (_capture/_restorePModalState, editClFromProj).
 * Globales usados: D, B, T, colorHex, t, esc, fmtMoney, todayStr, ...
 * ================================================ */
Object.assign(App, {
  colorSelect(currentName) {
    const curHex = colorHex(currentName);
    let html = `<div class="cs-wrap"><div class="cs-hd"><div id="mpColorDot" class="cs-dot" style="background:${curHex}"></div><span id="mpColorLbl" class="cs-lbl">${currentName}</span></div>`;
    html += `<input type="hidden" id="mpColor" value="${currentName}"><div class="cs-grid" onmouseleave="App._csReset()">`;
    for (const [group, colors] of Object.entries(W3C_COLORS)) { colors.forEach(([name, hex]) => { html += `<div class="cs-sw${name === currentName ? ' on' : ''}" style="background:${hex}" data-name="${name}" data-hex="${hex}" title="${name}" onmouseenter="App._csHover(this)" onclick="App._csPick(this)"></div>`; }); }
    return html + `</div></div>`;
  },
  _csHover(el) { document.getElementById('mpColorDot').style.background = el.dataset.hex; document.getElementById('mpColorLbl').textContent = el.dataset.name; },
  _csReset() { const sel = document.getElementById('mpColor'); if (!sel) return; document.getElementById('mpColorDot').style.background = colorHex(sel.value); document.getElementById('mpColorLbl').textContent = sel.value; },
  _csPick(el) { document.querySelectorAll('.cs-sw.on').forEach(s => s.classList.remove('on')); el.classList.add('on'); document.getElementById('mpColor').value = el.dataset.name; document.getElementById('mpColorDot').style.background = el.dataset.hex; document.getElementById('mpColorLbl').textContent = el.dataset.name; },

  /** Cuando cambia el cliente en el modal de proyecto, aplica su color por defecto */
  _onClientChange(val) {
    document.getElementById('mpClNew').style.display = val === '_new' ? 'block' : 'none';
    const editBtn = document.getElementById('mpClEditBtn');
    if (editBtn) editBtn.style.display = (val && val !== '_new') ? '' : 'none';
    if (val && val !== '_new') {
      const cl = D.cl(val);
      if (cl?.color) {
        const sw = document.querySelector(`.cs-sw[data-name="${cl.color}"]`);
        if (sw) this._csPick(sw);
      }
    }
  },

  /** Abre clModal del cliente seleccionado en pModal, preserva estado y retorna */
  editClFromProj() {
    const cid = document.getElementById('mpCl')?.value;
    if (!cid || cid === '_new') return;
    this._projRestore = { eid: this._editPid || null, state: this._capturePModalState() };
    this._projReturn = { eid: this._editPid || null };
    this.clModal(cid);
  },

  /** Captura todos los campos editables del modal de proyecto */
  _capturePModalState() {
    const g = id => document.getElementById(id);
    return {
      nombre: g('mpN')?.value || '',
      clienteId: g('mpCl')?.value || '',
      clienteNewName: g('mpClNewN')?.value || '',
      asunto: g('mpAsunto')?.value || '',
      color: g('mpColor')?.value || '',
      estado: g('mpSt')?.value || '',
      interno: !!g('mpInt')?.checked,
      recurrente: !!g('mpRec')?.checked,
      inicio: g('mpI')?.value || '',
      finEst: g('mpFE')?.value || '',
      finR: g('mpFR')?.value || '',
      bm: g('mpBM')?.value || '',
      base: g('mpBa')?.value || '',
      total: g('mpTo')?.value || '',
      precioHora: g('mpPH')?.value || '',
      iva: g('mpIva')?.value || '',
      irpf: g('mpIrpf')?.value || '',
      ivaExc: g('mpIvaExc')?.value || '',
      facLang: g('mpFacLang')?.value || '',
      notas: g('mpNo')?.value || ''
    };
  },

  /** Restaura el estado capturado del modal de proyecto tras volver de clModal */
  _restorePModalState(s) {
    if (!s) return;
    const set = (id, v) => { const el = document.getElementById(id); if (el && v != null) el.value = v; };
    set('mpN', s.nombre);
    set('mpCl', s.clienteId);
    set('mpClNewN', s.clienteNewName);
    set('mpAsunto', s.asunto);
    set('mpSt', s.estado);
    const mpInt = document.getElementById('mpInt'); if (mpInt) mpInt.checked = !!s.interno;
    const mpRec = document.getElementById('mpRec'); if (mpRec) mpRec.checked = !!s.recurrente;
    set('mpI', s.inicio);
    set('mpFE', s.finEst);
    set('mpFR', s.finR);
    set('mpBa', s.base);
    set('mpTo', s.total);
    set('mpPH', s.precioHora);
    set('mpIva', s.iva);
    set('mpIrpf', s.irpf);
    set('mpIvaExc', s.ivaExc);
    set('mpFacLang', s.facLang);
    set('mpNo', s.notas);
    if (s.color) {
      const sw = document.querySelector(`.cs-sw[data-name="${s.color}"]`);
      if (sw) this._csPick(sw);
    }
    if (s.bm) this.sBM(s.bm);
    this._onClientChange(s.clienteId);
    this.cPrev();
  },


  /* ══════════════════════════════════════════════
   *  MODAL PROYECTO (crear/editar)
   * ══════════════════════════════════════════════ */

  pModal(eid) {
    this._editPid = eid || null;
    const isE = !!eid, p = isE ? D.p(eid) : null, st = D.d.settings, cls = D.cls();
    const df = {
      nombre: p?.nombre || '', clienteId: p?.clienteId || '', color: p?.color || 'CornflowerBlue',
      estado: p?.estado || 'activo', interno: p?.interno || false, recurrente: p?.recurrente || false,
      inicio: p?.fechas?.inicio || '', finEst: p?.fechas?.finEstimada || '', finR: p?.fechas?.finReal || '',
      modo: p?.facturacion?.modo || 'desde_base', base: p?.facturacion?.baseImponible || '', total: p?.facturacion?.total || '', precioHora: p?.facturacion?.precioHora || '',
      iva: p?.facturacion?.iva ?? st.defaultIva, irpf: p?.facturacion?.irpf ?? st.defaultIrpf,
      ivaOn: p ? (p.facturacion.iva > 0) : true, irpfOn: p ? (p.facturacion.irpf > 0) : true,
      ivaExc: p?.facturacion?.ivaExcepcion || '', asuntoFactura: p?.facturacion?.asuntoFactura || '',
      pagado: p?.facturacion?.pagado || false, fechaPago: p?.facturacion?.fechaPago || '', notas: p?.notas || '',
      idiomaFactura: p?.facturacion?.idiomaFactura || null,
      cobros: p?.facturacion?.cobros || [], neto: p?.facturacion?.netoRecibido || 0
    };
    this.om(
      this._pmHeader(isE)
      + this._pmBasicFields(df, cls)
      + this._pmDates(df)
      + this._pmBilling(df, st)
      + this._pmFooter(eid, isE, df)
    );
    this.cPrev();
    /* Restaurar estado si venimos de clModal→pModal */
    if (this._projRestore && this._projRestore.eid === (eid || null)) {
      const s = this._projRestore.state;
      this._projRestore = null;
      this._restorePModalState(s);
    }
  },

  /* ── pModal sub-renderers ── */

  _pmHeader(isE) {
    return `<div class="mt">${isE ? t('btn.edit') : t('btn.newProject').replace('+ ', '')}</div>`;
  },

  _pmBasicFields(df, cls) {
    const clOpts = cls.map(c => `<option value="${c.id}" ${c.id === df.clienteId ? 'selected' : ''}>${esc(c.nombre)}</option>`).join('');
    const ckStyle = 'display:flex;align-items:center;gap:.4rem;cursor:pointer;text-transform:none;letter-spacing:0';
    const showEdit = df.clienteId && df.clienteId !== '_new';
    return `<div class="fg"><label>${t('field.name')}</label><input type="text" id="mpN" value="${esc(df.nombre)}" placeholder="${t('ph.projectName')}"></div>`
      + `<div class="fg"><label>${t('field.client')}</label><div style="display:flex;gap:.4rem;align-items:stretch">`
      +   `<select id="mpCl" onchange="App._onClientChange(this.value)" style="flex:1"><option value="">${t('field.noClient')}</option>${clOpts}<option value="_new">${t('btn.createNew')}</option></select>`
      +   `<button type="button" class="bt bt-s" id="mpClEditBtn" onclick="App.editClFromProj()" title="${t('btn.edit')}" style="${showEdit ? '' : 'display:none;'}padding:.15rem .55rem;font-size:.85rem">&#9998;</button>`
      + `</div></div>`
      + `<div id="mpClNew" style="display:none;margin-bottom:.85rem"><input type="text" id="mpClNewN" placeholder="${t('ph.newClient')}"></div>`
      + `<div class="fg"><label>${t('field.subject')}</label><input type="text" id="mpAsunto" value="${esc(df.asuntoFactura)}" placeholder="${esc(df.nombre)}"></div>`
      + `<div class="fg"><label>${t('field.color')}</label>${this.colorSelect(df.color)}</div>`
      + `<div class="fr"><div class="fg"><label>${t('field.status')}</label><select id="mpSt">${Object.entries(EST).map(([k, v]) => `<option value="${k}" ${k === df.estado ? 'selected' : ''}>${v}</option>`).join('')}</select></div>`
      + `<div class="fg" style="display:flex;gap:1.25rem;padding-top:1.5rem">`
      + `<label style="${ckStyle}"><input type="checkbox" id="mpInt" ${df.interno ? 'checked' : ''} style="width:auto;accent-color:var(--t2)"> ${t('field.internal')}</label>`
      + `<label style="${ckStyle}"><input type="checkbox" id="mpRec" ${df.recurrente ? 'checked' : ''} style="width:auto;accent-color:var(--t2)"> ${t('field.recurring')}</label>`
      + `</div></div>`;
  },

  _pmDates(df) {
    return `<div class="fr fr-3">`
      + `<div class="fg"><label>${t('field.start')}</label><input type="date" id="mpI" value="${df.inicio}"></div>`
      + `<div class="fg"><label>${t('field.estEnd')}</label><input type="date" id="mpFE" value="${df.finEst}"></div>`
      + `<div class="fg"><label>${t('field.actualEnd')}</label><input type="date" id="mpFR" value="${df.finR}"></div>`
      + `</div>`;
  },

  _pmBilling(df, st) {
    const m = df.modo;
    return `<div class="dst" style="margin-top:1.25rem">${t('billing.title')}</div>`
      + `<div class="bms">`
      +   `<button class="bm ${m === 'desde_base' ? 'on' : ''}" onclick="App.sBM('desde_base')">${t('billing.fromBase')}</button>`
      +   `<button class="bm ${m === 'desde_total' ? 'on' : ''}" onclick="App.sBM('desde_total')">${t('billing.fromTotal')}</button>`
      +   `<button class="bm ${m === 'por_hora' ? 'on' : ''}" onclick="App.sBM('por_hora')">${t('billing.hourly')}</button>`
      +   `<button class="bm ${m === 'gratis' ? 'on' : ''}" onclick="App.sBM('gratis')">${t('billing.free')}</button>`
      + `</div><input type="hidden" id="mpBM" value="${m}">`
      + `<div id="bF" style="${m === 'gratis' ? 'display:none' : ''}">`
      +   `<div id="bfPH" style="${m === 'por_hora' ? '' : 'display:none'}"><div class="fg"><label>${t('billing.eurPerHour')}</label><input type="number" id="mpPH" value="${df.precioHora}" step="0.01" min="0" placeholder="30.00" oninput="App.cPrev()"></div></div>`
      +   `<div class="fr">`
      +     `<div class="fg" id="bfBase" style="${m === 'desde_total' || m === 'por_hora' ? 'display:none' : ''}"><label>${t('billing.baseEur')}</label><input type="number" id="mpBa" value="${df.base}" step="0.01" placeholder="0.00" oninput="App.cPrev()"></div>`
      +     `<div class="fg" id="bfTot" style="${m === 'desde_base' || m === 'por_hora' ? 'display:none' : ''}"><label>${t('billing.totalEur')}</label><input type="number" id="mpTo" value="${df.total}" step="0.01" placeholder="0.00" oninput="App.cPrev()"></div>`
      +   `</div>`
      +   `<div class="fr">`
      +     `<div class="fg"><label>IVA %</label><input type="number" id="mpIva" value="${df.iva}" min="0" max="100" step="1" oninput="App.cPrev()"></div>`
      +     `<div class="fg"><label>IRPF %</label><input type="number" id="mpIrpf" value="${df.irpf}" min="0" max="100" step="1" oninput="App.cPrev()"></div>`
      +   `</div>`
      +   `<div class="fg" style="margin-top:.4rem"><label>${t('billing.ivaException')}</label><input type="text" id="mpIvaExc" value="${esc(df.ivaExc)}" placeholder="${t('ph.ivaException')}"></div>`
      +   `<div id="bPrev" class="bb" style="margin-top:.4rem"></div>`
      +   (df.cobros && df.cobros.length ? `<div style="margin-top:.75rem;font-size:.78rem;color:${df.pagado ? 'var(--ok)' : 'var(--warn)'}">${df.pagado ? t('billing.paid') : t('billing.progress', fmtMoney(df.cobros.reduce((s,c) => s + c.cantidad, 0)), fmtMoney(df.neto || 0))} (${df.cobros.length} ${t('billing.payments').toLowerCase()})</div>` : '')
      +   `<div class="fg" style="margin-top:.5rem"><label>${t('field.invoiceLang')}</label><select id="mpFacLang"><option value="" ${!df.idiomaFactura ? 'selected' : ''}>${_lang === 'es' ? 'Español' : 'Spanish'} (${t('cfg.defaults').toLowerCase()})</option><option value="es" ${df.idiomaFactura === 'es' ? 'selected' : ''}>Español</option><option value="en" ${df.idiomaFactura === 'en' ? 'selected' : ''}>English</option></select></div>`
      + `</div>`;
  },

  _pmFooter(eid, isE, df) {
    return `<div class="fg" style="margin-top:.75rem"><label>${t('field.notes')}</label><textarea id="mpNo" placeholder="${t('ph.notes')}">${esc(df.notas)}</textarea></div>`
      + `<div class="ma"><button class="bt" onclick="App.cm()">${t('btn.cancel')}</button><button class="bt bt-p" onclick="App.saveP('${eid || ''}')">${isE ? t('btn.save') : t('btn.create')}</button></div>`;
  },

  sBM(m) {
    document.getElementById('mpBM').value = m;
    document.querySelectorAll('.bm').forEach(b => b.classList.remove('on'));
    const idx = { desde_base: 1, desde_total: 2, por_hora: 3, gratis: 4 }[m] || 4;
    document.querySelector(`.bm:nth-child(${idx})`)?.classList.add('on');
    const f = document.getElementById('bF'), bf = document.getElementById('bfBase'), tf = document.getElementById('bfTot'), ph = document.getElementById('bfPH');
    if (m === 'gratis') { f.style.display = 'none'; }
    else {
      f.style.display = '';
      bf.style.display = (m === 'desde_total' || m === 'por_hora') ? 'none' : '';
      tf.style.display = (m === 'desde_base' || m === 'por_hora') ? 'none' : '';
      ph.style.display = m === 'por_hora' ? '' : 'none';
    }
    this.cPrev();
  },

  /** Actualiza la preview de facturación en el modal de proyecto */
  cPrev() {
    const m = document.getElementById('mpBM')?.value;
    if (!m || m === 'gratis') return;

    const ivR = parseFloat(document.getElementById('mpIva')?.value) || 0;
    const irR = parseFloat(document.getElementById('mpIrpf')?.value) || 0;

    let base, importeIva, importeIrpf, totalF, neto;

    const p = this._editPid ? D.p(this._editPid) : null;

    if (m === 'por_hora') {
      const ph = parseFloat(document.getElementById('mpPH')?.value) || 0;
      const th = p ? B.totalHoras(p) : 0;
      base = roundMoney(th * ph);
    } else if (m === 'desde_base') {
      base = parseFloat(document.getElementById('mpBa')?.value) || 0;
    } else {
      const t2 = parseFloat(document.getElementById('mpTo')?.value) || 0;
      const fac = 1 + ivR / 100 - irR / 100;
      base = fac ? roundMoney(t2 / fac) : 0;
      totalF = t2;
    }

    const tax = B.calcTax(base, ivR, irR);
    importeIva = tax.importeIva;
    importeIrpf = tax.importeIrpf;
    if (m !== 'desde_total') totalF = tax.totalFactura;
    neto = tax.netoRecibido;

    let phInfo = '';
    if (m === 'por_hora') {
      const ph = parseFloat(document.getElementById('mpPH')?.value) || 0;
      const th = p ? B.totalHoras(p) : 0;
      phInfo = `<div class="br"><span class="la" style="font-size:.75rem;color:var(--t3)">`
        + (p ? `${th.toFixed(1)}h × ${fmtNum(ph)} €/h` : t('billing.noHoursYet'))
        + `</span></div>`;
    }

    const el = document.getElementById('bPrev');
    if (el) el.innerHTML = phInfo
      + `<div class="br"><span class="la">${t('billing.base')}</span><span class="va">${fmtMoney(base)}</span></div>`
      + (ivR ? `<div class="br"><span class="la">${t('billing.plusIva', ivR)}</span><span class="va">${fmtMoney(importeIva)}</span></div>` : '')
      + (irR ? `<div class="br"><span class="la">${t('billing.minusIrpf', irR)}</span><span class="va">${fmtMoney(importeIrpf)}</span></div>` : '')
      + `<div class="br tot"><span class="la">${t('billing.total')}</span><span class="va">${fmtMoney(totalF)}</span></div>`
      + `<div class="br"><span class="la">${t('billing.net')}</span><span class="va" style="color:var(--ok)">${fmtMoney(neto)}</span></div>`;
  },

  saveP(eid) {
    const nombre = document.getElementById('mpN').value.trim();
    if (!nombre) { Toast.warn(t('msg.nameRequired')); return; }
    const prev = eid ? D.p(eid) : null;

    let clienteId = document.getElementById('mpCl').value;
    const color = document.getElementById('mpColor').value;
    if (clienteId === '_new') {
      const newName = document.getElementById('mpClNewN').value.trim();
      if (!newName) { Toast.warn(t('msg.clientNameRequired')); return; }
      const newCl = D.addCl({ id: uid(), nombre: newName, nombreCompleto: '', direccion1: '', direccion2: '', nif: '', color: color || 'CornflowerBlue' });
      clienteId = newCl.id;
    } else if (!clienteId) clienteId = null;

    const estado = document.getElementById('mpSt').value;
    const modo = document.getElementById('mpBM').value;
    const facLangVal = document.getElementById('mpFacLang')?.value || null;

    const proj = {
      id: eid || uid(), nombre, clienteId: clienteId || null, color, estado,
      interno: document.getElementById('mpInt')?.checked || false,
      recurrente: document.getElementById('mpRec')?.checked || false,
      fechas: { inicio: document.getElementById('mpI').value || null, finEstimada: document.getElementById('mpFE').value || null, finReal: document.getElementById('mpFR').value || null },
      facturacion: {
        modo, baseImponible: parseFloat(document.getElementById('mpBa')?.value) || 0, total: parseFloat(document.getElementById('mpTo')?.value) || 0,
        precioHora: parseFloat(document.getElementById('mpPH')?.value) || 0,
        iva: parseFloat(document.getElementById('mpIva')?.value) || 0, irpf: parseFloat(document.getElementById('mpIrpf')?.value) || 0,
        ivaExcepcion: document.getElementById('mpIvaExc')?.value?.trim() || '',
        asuntoFactura: document.getElementById('mpAsunto')?.value?.trim() || '',
        importeIva: 0, importeIrpf: 0, totalFactura: 0, netoRecibido: 0,
        cobros: prev?.facturacion?.cobros || [],
        pagado: false, fechaPago: null,
        gastos: 0,
        facturaNum: prev?.facturacion?.facturaNum || null,
        facturaFecha: prev?.facturacion?.facturaFecha || null,
        idiomaFactura: facLangVal || null
      },
      horas: prev?.horas || [], notas: document.getElementById('mpNo').value.trim()
    };
    B.calc(proj);
    if (eid) { D.up(eid, proj); T.ev('action', 'project_edit'); } else { D.add(proj); T.ev('action', 'project_create'); }
    this.cm();
    if (this.cv === 'det') this.rDet(proj.id); else this.go(this.cv);
  },
});
