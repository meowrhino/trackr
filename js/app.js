/* ================================================
 * TRACKR — App core
 * Estado, navegación, modales compartidos,
 * modal de proyecto, facturas, export/import
 * Globales: App
 * Dependencias: colors.js, utils.js, lang.js, store.js,
 *               billing.js, tracking.js, facturas.js,
 *               toast.js
 *
 * Los módulos de vista (app.info.js, app.dash.js,
 * app.detail.js, app.calendar.js, app.config.js,
 * app.gastos.js) extienden App con Object.assign.
 * ================================================ */

const App = {

  /* ── Estado de la app ── */
  cv: 'info',         /* vista actual */
  cp: null,           /* proyecto en detalle */
  pf: 'externos',     /* filtro de proyectos */
  calY: null,         /* año del calendario */
  calM: null,         /* mes del calendario 0-11 */
  calView: 'week',   /* 'month' | 'week' */
  calWeekStart: null,  /* Date del lunes de la semana */
  infoPeriod: 'mes',  /* periodo del resumen Info: 'mes' | 'trim' | 'año' (solo actual) */
  _editPid: null,     /* ID del proyecto siendo editado (para preview facturación) */

  /* ══════════════════════════════════════════════
   *  INICIALIZACIÓN Y NAVEGACIÓN
   * ══════════════════════════════════════════════ */

  init() {
    /* Analytics desactivado — configurar URL real para activar:
       T.init('https://trackr-analytics.tu-dominio.workers.dev/event'); */
    T.init(null);

    if (!D.init()) D.create();

    /* Aplicar tema e idioma guardados */
    applyTheme(D.d.settings.theme || D.d.settings.tema || 'oscuro');
    setLang(D.d.settings.lang || D.d.settings.idioma || 'es');

    /* Cerrar modal con Escape */
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') this.cm();
    });

    /* Cerrar modal solo con click limpio en backdrop (no drag) */
    const mo = document.getElementById('mO');
    let mdTarget = null;
    mo.addEventListener('mousedown', e => { mdTarget = e.target; });
    mo.addEventListener('mouseup', e => {
      if (e.target === mo && mdTarget === mo) this.cm();
      mdTarget = null;
    });

    this.enter();
  },

  enter() { this.go('info'); },

  /** Navega a una vista */
  go(v, d) {
    T.ev('nav', 'view', v);
    this.cv = v;

    /* Toggle clases .on en vistas y nav */
    document.querySelectorAll('.vw').forEach(el => el.classList.remove('on'));
    document.querySelectorAll('.ni').forEach(el => el.classList.remove('on'));

    const viewMap = {
      info: 'vInfo', dash: 'vDash', cal: 'vCal',
      gas: 'vGas', cfg: 'vCfg', guide: 'vGuide', det: 'vDet'
    };
    const viewEl = document.getElementById(viewMap[v]);
    if (viewEl) viewEl.classList.add('on');
    const navEl = document.querySelector(`.ni[data-v="${v}"]`);
    if (navEl) navEl.classList.add('on');

    /* Renderizar vista */
    if (v === 'info') this.rInfo();
    else if (v === 'dash') this.rDash();
    else if (v === 'cal') this.rCal();
    else if (v === 'gas') this.rGas();
    else if (v === 'cfg') this.rCfg();
    else if (v === 'guide') this.rGuide();
    else if (v === 'det') this.rDet(d);
  },


  /* ══════════════════════════════════════════════
   *  MODALES COMPARTIDOS
   * ══════════════════════════════════════════════ */

  om(h) { document.getElementById('mC').innerHTML = h; document.getElementById('mO').classList.add('on'); },
  cm() { document.getElementById('mO').classList.remove('on'); this._editPid = null; },
  selT(el) { el.parentElement.querySelectorAll('.to').forEach(o => o.classList.remove('on')); el.classList.add('on'); },

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
    if (val && val !== '_new') {
      const cl = D.cl(val);
      if (cl?.color) {
        const sw = document.querySelector(`.cs-sw[data-name="${cl.color}"]`);
        if (sw) this._csPick(sw);
      }
    }
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
  },

  /* ── pModal sub-renderers ── */

  _pmHeader(isE) {
    return `<div class="mt">${isE ? t('btn.edit') : t('btn.newProject').replace('+ ', '')}</div>`;
  },

  _pmBasicFields(df, cls) {
    const clOpts = cls.map(c => `<option value="${c.id}" ${c.id === df.clienteId ? 'selected' : ''}>${esc(c.nombre)}</option>`).join('');
    const ckStyle = 'display:flex;align-items:center;gap:.4rem;cursor:pointer;text-transform:none;letter-spacing:0';
    return `<div class="fg"><label>${t('field.name')}</label><input type="text" id="mpN" value="${esc(df.nombre)}" placeholder="${t('ph.projectName')}"></div>`
      + `<div class="fg"><label>${t('field.client')}</label><select id="mpCl" onchange="App._onClientChange(this.value)"><option value="">${t('field.noClient')}</option>${clOpts}<option value="_new">${t('btn.createNew')}</option></select></div>`
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
      const th = p ? p.horas.reduce((s, h) => s + h.cantidad, 0) : 0;
      base = Math.round(th * ph * 100) / 100;
    } else if (m === 'desde_base') {
      base = parseFloat(document.getElementById('mpBa')?.value) || 0;
    } else {
      const t2 = parseFloat(document.getElementById('mpTo')?.value) || 0;
      const fac = 1 + ivR / 100 - irR / 100;
      base = fac ? Math.round(t2 / fac * 100) / 100 : 0;
      totalF = t2;
    }

    importeIva = Math.round(base * ivR / 100 * 100) / 100;
    importeIrpf = Math.round(base * irR / 100 * 100) / 100;
    if (m !== 'desde_total') totalF = Math.round((base + importeIva - importeIrpf) * 100) / 100;
    neto = Math.round((base - importeIrpf) * 100) / 100;

    let phInfo = '';
    if (m === 'por_hora') {
      const ph = parseFloat(document.getElementById('mpPH')?.value) || 0;
      const th = p ? p.horas.reduce((s, h) => s + h.cantidad, 0) : 0;
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


  /* ══════════════════════════════════════════════
   *  FACTURAS
   * ══════════════════════════════════════════════ */

  facModal(pid) {
    const p = D.p(pid); if (!p) return;
    B.calc(p);
    const f = p.facturacion, s = D.d.settings;
    const num = f.facturaNum || s.nextFacturaNum || 1;

    const summary = `<div class="bb" style="margin-top:.75rem">`
      + `<div class="br"><span class="la">${t('fac.issuer')}</span><span class="va">${esc(s.emisor.nombre || t('fac.configure'))}</span></div>`
      + `<div class="br"><span class="la">${t('fac.client')}</span><span class="va">${esc(clienteName(p))}</span></div>`
      + `<div class="br"><span class="la">${t('billing.base')}</span><span class="va">${fmtMoney(f.baseImponible || 0)}</span></div>`
      + (f.iva ? `<div class="br"><span class="la">${t('billing.plusIva', f.iva)}</span><span class="va">${fmtMoney(f.importeIva || 0)}</span></div>` : '')
      + (f.irpf ? `<div class="br"><span class="la">${t('billing.minusIrpf', f.irpf)}</span><span class="va">${fmtMoney(f.importeIrpf || 0)}</span></div>` : '')
      + `<div class="br tot"><span class="la">${t('billing.total')}</span><span class="va">${fmtMoney(f.totalFactura || 0)}</span></div></div>`;

    this.om(`<div class="mt">${t('fac.generate')}</div>`
      + `<div class="fr"><div class="fg"><label>${t('field.invoiceNum')}</label><input type="text" id="facNum" value="${String(num)}" style="font-family:'DM Mono',monospace"></div>`
      + `<div class="fg"><label>${t('field.date')}</label><input type="date" id="facDate" value="${f.facturaFecha || todayStr()}"></div></div>`
      + `<div class="fg"><label>${t('field.subject')}</label><input type="text" id="facAsunto" value="${esc(defaultAsunto(p))}"></div>`
      + summary
      + `<div class="ma"><button class="bt" onclick="App.cm()">${t('btn.cancel')}</button><button class="bt bt-p" onclick="App.genFactura('${pid}')">${t('btn.downloadPdf')}</button></div>`);
  },

  genFactura(pid) {
    const fecha = document.getElementById('facDate').value;
    const asunto = document.getElementById('facAsunto').value.trim();
    const num = parseInt(document.getElementById('facNum').value) || null;
    /* Guardar asunto en el proyecto si difiere del default; borrar si vacío o igual al default */
    const p = D.p(pid);
    if (p) {
      const def = defaultAsunto(Object.assign({}, p, { facturacion: Object.assign({}, p.facturacion, { asuntoFactura: '' }) }));
      if (!asunto || asunto === def) {
        p.facturacion.asuntoFactura = '';
      } else {
        p.facturacion.asuntoFactura = asunto;
      }
    }
    Fac.download(pid, { fecha, asunto: asunto || defaultAsunto(p), num });
    T.ev('action', 'invoice_generate');
    this.cm(); this.rDet(pid);
  },


  /* ══════════════════════════════════════════════
   *  COBROS PARCIALES (Partial Payments)
   * ══════════════════════════════════════════════ */

  cobroModal(pid) {
    const p = D.p(pid); if (!p) return;
    B.calc(p);
    const pend = B.pendiente(p);
    if (pend <= 0) { Toast.ok(t('billing.alreadyPaid')); return; }
    this.om(
      `<div class="mt">${t('billing.addPayment')}</div>`
      + `<div class="fr"><div class="fg"><label>${t('billing.paymentAmount')}</label><input type="number" id="mcA" min="0.01" step="0.01" value="${pend.toFixed(2)}"></div>`
      + `<div class="fg"><label>${t('field.date')}</label><input type="date" id="mcD" value="${todayStr()}"></div></div>`
      + `<div style="font-size:.78rem;color:var(--t3);margin-bottom:.75rem">${t('billing.remaining', fmtMoney(pend))}</div>`
      + `<div class="ma"><button class="bt" onclick="App.cm()">${t('btn.cancel')}</button><button class="bt bt-p" onclick="App.saveCobro('${pid}')">${t('btn.save')}</button></div>`
    );
  },

  saveCobro(pid) {
    const cant = parseFloat(document.getElementById('mcA').value) || 0;
    const fecha = document.getElementById('mcD').value || todayStr();
    if (cant <= 0) return;
    const p = D.p(pid); if (!p) return;
    if (!p.facturacion.cobros) p.facturacion.cobros = [];
    p.facturacion.cobros.push({ id: uid(), fecha, cantidad: Math.round(cant * 100) / 100 });
    B.calc(p);
    D.up(pid, { facturacion: p.facturacion });
    Toast.ok(t('billing.addPayment') + ' ✓');
    this.cm();
    if (this.cv === 'det') this.rDet(pid); else this.rDash();
  },

  delCobro(pid, cid) {
    const p = D.p(pid); if (!p) return;
    const c = (p.facturacion.cobros || []).find(x => x.id === cid);
    if (!c) return;
    if (!confirm(t('billing.deletePayment', fmtMoney(c.cantidad)))) return;
    p.facturacion.cobros = p.facturacion.cobros.filter(x => x.id !== cid);
    B.calc(p);
    D.up(pid, { facturacion: p.facturacion });
    if (this.cv === 'det') this.rDet(pid); else this.rDash();
  },


  /* ══════════════════════════════════════════════
   *  EXPORT / IMPORT
   * ══════════════════════════════════════════════ */

  exp() {
    T.ev('action', 'export');
    const d = JSON.stringify(D.d, null, 2), b = new Blob([d], { type: 'application/json' }), u = URL.createObjectURL(b), a = document.createElement('a');
    const now = new Date();
    const ts = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}-${String(now.getMinutes()).padStart(2, '0')}`;
    a.href = u; a.download = `trackr_backup_${ts}.json`; a.click(); URL.revokeObjectURL(u);
  },

  imp(ev) {
    const f = ev.target.files[0]; if (!f) return;
    /* Validar tamaño (máx 5MB) */
    if (f.size > MAX_IMPORT_BYTES) {
      Toast.error(t('msg.fileTooLarge', (f.size / 1024 / 1024).toFixed(1)));
      ev.target.value = '';
      return;
    }
    const r = new FileReader();
    r.onload = e => {
      try {
        const d = JSON.parse(e.target.result);
        if (!d.projects || !Array.isArray(d.projects)) { Toast.error(t('msg.invalidJsonProjects')); return; }
        for (const p of d.projects) {
          if (!p.id || !p.nombre) { Toast.error(t('msg.invalidJsonProjectId')); return; }
          if (p.horas && !Array.isArray(p.horas)) { Toast.error(t('msg.invalidJsonHoras')); return; }
        }
        if (d.clientes && !Array.isArray(d.clientes)) { Toast.error(t('msg.invalidJsonClientes')); return; }
        if (d.gastos && !Array.isArray(d.gastos)) { Toast.error(t('msg.invalidJsonGastos')); return; }
        if (!d.settings) d.settings = { defaultIva: 21, defaultIrpf: 15 };
        D.load(d); T.ev('action', 'import');
        applyTheme(D.d.settings.theme || D.d.settings.tema || 'oscuro');
        setLang(D.d.settings.lang || D.d.settings.idioma || 'es');
        Toast.ok(t('msg.importSuccess'));
        this.go(this.cv);
      } catch (err) { Toast.error(t('msg.importError') + err.message); }
    };
    r.readAsText(f); ev.target.value = '';
  },

  resetData() {
    if (!confirm(t('msg.resetConfirm'))) return;
    localStorage.removeItem('trackr_data');
    location.reload();
  },

  logoutModal() {
    this.om(`<div class="mt">${t('msg.logoutTitle')}</div>`
      + `<p style="font-size:.88rem;color:var(--t2);line-height:1.5;margin-bottom:1rem">${t('msg.logoutBody')}</p>`
      + `<div style="display:flex;gap:.5rem;margin-bottom:.5rem">`
      + `<button class="bt" onclick="App.exp()" style="flex:1">${t('nav.export')} JSON</button>`
      + `</div>`
      + `<div class="ma"><button class="bt" onclick="App.cm()">${t('btn.cancel')}</button><button class="bt bt-d" onclick="App.resetData()">${t('btn.logout')}</button></div>`);
  },

  /* ══════════════════════════════════════════════
   *  CARGAR EJEMPLOS
   * ══════════════════════════════════════════════ */

  async loadExample(name) {
    try {
      const res = await fetch(`examples/${name}.json`);
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const data = await res.json();
      D.load(data);
      applyTheme(D.d.settings.theme || D.d.settings.tema || 'oscuro');
      setLang(D.d.settings.lang || D.d.settings.idioma || 'es');
      Toast.ok(t('msg.exampleLoaded'));
      this.go('info');
    } catch (err) {
      Toast.error(t('msg.importError') + err.message);
    }
  }
};

/* ── Arranque ── */
document.addEventListener('DOMContentLoaded', () => App.init());

/* ── Tooltip flotante para segmentos de barras ── */
(function(){
  const tip = document.createElement('div');
  tip.id = 'barTip';
  document.body.appendChild(tip);
  document.addEventListener('pointerenter', e => {
    const seg = e.target.closest('.pbar-seg[data-tip]');
    if (!seg) return;
    tip.textContent = seg.getAttribute('data-tip');
    const r = seg.getBoundingClientRect();
    tip.style.opacity = '1';
    tip.style.left = (r.left + r.width / 2) + 'px';
    tip.style.top = (r.top - 8) + 'px';
    tip.style.transform = 'translate(-50%,-100%)';
  }, true);
  document.addEventListener('pointerleave', e => {
    if (e.target.closest('.pbar-seg[data-tip]')) tip.style.opacity = '0';
  }, true);
})();
