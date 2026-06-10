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
    /* Analytics: usamos Cloudflare Web Analytics (sin cookies, sin código aquí).
       T.init() queda dormido por si en el futuro queremos eventos custom via Worker. */
    T.init(null);

    if (!D.init()) D.create();

    /* Aplicar tema e idioma guardados */
    applyTheme(D.d.settings.theme || D.d.settings.tema || 'oscuro');
    setLang(D.d.settings.lang || D.d.settings.idioma || 'es');

    /* Cerrar modal con Escape / Enter para submit */
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') this.cm();
      if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA' && document.getElementById('mO').classList.contains('on')) {
        e.preventDefault();
        document.getElementById('mC').querySelector('.bt-p')?.click();
      }
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
    this._maybeWelcome();

    /* Línea "ahora" del calendario: reposicionar cada minuto sin re-renderizar */
    setInterval(() => this._tickNow(), 60000);
  },

  /** Reposiciona la línea horizontal "ahora" si el calendario está visible */
  _tickNow() {
    const el = document.querySelector('.cal-now-line');
    if (!el) return;
    const startHour = (D.d.settings && D.d.settings.calStartHour) || 0;
    const slotH = 60;
    const n = new Date();
    const mins = n.getHours() * 60 + n.getMinutes();
    el.style.top = (((mins - startHour * 60 + 24 * 60) % (24 * 60)) / 60 * slotH) + 'px';
  },

  enter() { this.go('info'); },

  /** Muestra modal de bienvenida solo en la primera visita (sin datos previos) */
  _maybeWelcome() {
    if (localStorage.getItem('trackr_welcomed') === '1') return;
    if (D.d.projects.length > 0) { localStorage.setItem('trackr_welcomed', '1'); return; }
    this.om(`<div class="mt">${t('welcome.title')}</div>`
      + `<p style="line-height:1.55;color:var(--t1);margin-bottom:.75rem">${t('welcome.claim')}</p>`
      + `<ul style="line-height:1.55;color:var(--t2);margin:0 0 1rem 1.1rem;padding:0;font-size:.9rem">`
      +   `<li style="margin-bottom:.35rem">${t('welcome.bullet1')}</li>`
      +   `<li style="margin-bottom:.35rem">${t('welcome.bullet2')}</li>`
      +   `<li>${t('welcome.bullet3')}</li>`
      + `</ul>`
      + `<div class="ma" style="gap:.5rem">`
      +   `<button class="bt" onclick="App._welcomeGuide()">${t('welcome.seeGuide')}</button>`
      +   `<button class="bt bt-p" onclick="App._welcomeDone()">${t('welcome.start')}</button>`
      + `</div>`);
    T.ev('action', 'welcome_show');
  },

  _welcomeDone() {
    localStorage.setItem('trackr_welcomed', '1');
    T.ev('action', 'welcome_dismiss', 'start');
    this.cm();
  },

  _welcomeGuide() {
    localStorage.setItem('trackr_welcomed', '1');
    T.ev('action', 'welcome_dismiss', 'guide');
    this.cm();
    this.go('guide');
  },

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
  cm() {
    /* Si venimos del flujo facModal→clModal, volver a facModal en lugar de cerrar */
    if (this._facReturn) {
      const r = this._facReturn;
      this._facReturn = null;
      this.facModal(r.pid);
      return;
    }
    /* Si venimos del flujo pModal→clModal, volver a pModal preservando estado */
    if (this._projReturn) {
      const r = this._projReturn;
      this._projReturn = null;
      this.pModal(r.eid || undefined);
      return;
    }
    document.getElementById('mO').classList.remove('on');
    this._editPid = null;
  },
  selT(el) { el.parentElement.querySelectorAll('.to').forEach(o => o.classList.remove('on')); el.classList.add('on'); },



  /* ══════════════════════════════════════════════
   *  FACTURAS
   * ══════════════════════════════════════════════ */

  facModal(pid) {
    const p = D.p(pid); if (!p) return;
    B.calc(p);
    const f = p.facturacion, s = D.d.settings;
    const cl = p.clienteId ? D.cl(p.clienteId) : null;

    /* Si venimos de clModal con valores tecleados, restaurarlos */
    const r = (this._facRestore && this._facRestore.pid === pid) ? this._facRestore : null;
    this._facRestore = null;

    const num = r?.num || f.facturaNum || s.nextFacturaNum || 1;
    const date = r?.date || f.facturaFecha || todayStr();
    const asunto = r?.asunto != null ? r.asunto : defaultAsunto(p);

    const editBtn = `<button class="bt bt-s" style="padding:.15rem .45rem;font-size:.72rem;margin-left:.4rem" title="${t('btn.edit')}" onclick="App.editClFromFac('${pid}')">&#9998;</button>`;
    const addBtn = `<button class="bt bt-s bt-add" style="padding:.15rem .45rem;font-size:.72rem;margin-left:.4rem" onclick="App.editClFromFac('${pid}')">+ ${t('btn.newClient').replace('+ ','')}</button>`;
    const clRow = cl
      ? `<div class="br"><span class="la">${t('fac.client')}</span><span class="va" style="display:flex;align-items:center;justify-content:flex-end;gap:.2rem">${esc(cl.nombre)}${editBtn}</span></div>`
      : `<div class="br"><span class="la">${t('fac.client')}</span><span class="va" style="display:flex;align-items:center;justify-content:flex-end;gap:.2rem"><span style="color:var(--t3)">${t('fac.noClient')}</span>${addBtn}</span></div>`;

    const missing = [];
    if (cl) {
      if (!cl.nif) missing.push(t('fac.missingNif'));
      if (!cl.direccion1 && !cl.direccion2) missing.push(t('fac.missingAddress'));
    }
    const warnRow = missing.length
      ? `<div style="margin:-.35rem .25rem .5rem;font-size:.72rem;color:var(--warn);text-align:right">&#9888; ${missing.join(' &middot; ')}</div>`
      : '';

    const summary = `<div class="bb" style="margin-top:.75rem">`
      + `<div class="br"><span class="la">${t('fac.issuer')}</span><span class="va">${esc(s.emisor.nombre || t('fac.configure'))}</span></div>`
      + clRow
      + `<div class="br"><span class="la">${t('billing.base')}</span><span class="va">${fmtMoney(f.baseImponible || 0)}</span></div>`
      + (f.iva ? `<div class="br"><span class="la">${t('billing.plusIva', f.iva)}</span><span class="va">${fmtMoney(f.importeIva || 0)}</span></div>` : '')
      + (f.irpf ? `<div class="br"><span class="la">${t('billing.minusIrpf', f.irpf)}</span><span class="va">${fmtMoney(f.importeIrpf || 0)}</span></div>` : '')
      + `<div class="br tot"><span class="la">${t('billing.total')}</span><span class="va">${fmtMoney(f.totalFactura || 0)}</span></div></div>`;

    this.om(`<div class="mt">${t('fac.generate')}</div>`
      + `<div class="fr"><div class="fg"><label>${t('field.invoiceNum')}</label><input type="text" id="facNum" value="${String(num)}" style="font-family:'DM Mono',monospace"></div>`
      + `<div class="fg"><label>${t('field.date')}</label><input type="date" id="facDate" value="${date}"></div></div>`
      + `<div class="fg"><label>${t('field.subject')}</label><input type="text" id="facAsunto" value="${esc(asunto)}"></div>`
      + summary
      + warnRow
      + `<div class="ma"><button class="bt" onclick="App.cm()">${t('btn.cancel')}</button><button class="bt bt-p" onclick="App.genFactura('${pid}')">${t('btn.downloadPdf')}</button></div>`);
  },

  /** Abre clModal del cliente del proyecto desde el flujo de generar factura */
  editClFromFac(pid) {
    const p = D.p(pid); if (!p) return;
    /* Preservar valores tecleados en facModal y marcar para retorno */
    this._facRestore = {
      pid,
      num: document.getElementById('facNum')?.value,
      date: document.getElementById('facDate')?.value,
      asunto: document.getElementById('facAsunto')?.value
    };
    this._facReturn = { pid };
    this.clModal(p.clienteId || null);
  },

  async genFactura(pid) {
    const fecha = document.getElementById('facDate').value;
    const asunto = document.getElementById('facAsunto').value.trim();
    const num = parseInt(document.getElementById('facNum').value) || null;
    const p = D.p(pid);
    if (!p) return;

    /* Guardar asunto en el proyecto si difiere del default; borrar si vacío o igual al default */
    const def = defaultAsunto(Object.assign({}, p, { facturacion: Object.assign({}, p.facturacion, { asuntoFactura: '' }) }));
    if (!asunto || asunto === def) {
      p.facturacion.asuntoFactura = '';
    } else {
      p.facturacion.asuntoFactura = asunto;
    }

    const s = D.d.settings;
    const f = p.facturacion;
    const vCfg = s.verifactu || {};
    // Guard: la rama Verifactu solo corre si verifactu.js (global V) esta cargado. En main NO
    // lo esta (Verifactu aparcado), asi se evita el warning "no se pudo firmar" en cada factura.
    const verifactuOn = typeof V !== 'undefined' && vCfg.habilitado !== false && s.emisor?.nif;

    let verifactu = null;
    if (verifactuOn) {
      const numStr = String(num || f.facturaNum || s.nextFacturaNum || 1);
      const cl = p.clienteId ? D.cl(p.clienteId) : null;
      const hashPrev = D.lastHashFor(s.emisor.nif);
      try {
        const hash = await V.signInvoice({
          nifEmisor: s.emisor.nif,
          numSerie: numStr,
          fechaISO: fecha,
          baseImponible: f.baseImponible || 0,
          totalFactura: f.totalFactura || 0
        }, hashPrev);
        const qrPayload = V.buildQRPayload(
          s.emisor.nif, numStr, fecha, f.totalFactura || 0, vCfg.env === 'test'
        );
        verifactu = {
          sifId: V.SIF_ID,
          softwareVersion: V.SOFTWARE_VERSION,
          qrPayload,
          hash,
          publicUrl: 'tr4ckr.com/verifactu'
        };
        /* Persistir factura firmada en el registro inmutable */
        D.addFact({
          id: uid(),
          numero: numStr,
          fecha,
          emisorNif: s.emisor.nif,
          emisorNombre: s.emisor.nombre || '',
          clienteNif: cl?.nif || '',
          clienteNombre: cl?.nombreCompleto || cl?.nombre || '',
          baseImponible: f.baseImponible || 0,
          iva: f.iva || 0,
          importeIva: f.importeIva || 0,
          irpf: f.irpf || 0,
          importeIrpf: f.importeIrpf || 0,
          totalFactura: f.totalFactura || 0,
          proyectoId: pid,
          hash,
          hashPrev: hashPrev || null,
          timestamp: new Date().toISOString(),
          qrPayload,
          sifId: V.SIF_ID,
          softwareVersion: V.SOFTWARE_VERSION,
          tipoFactura: 'ordinaria',
          eventos: []
        });
      } catch (err) {
        console.warn('Verifactu signing failed:', err);
        Toast.warn('Verifactu: no se pudo firmar (PDF sin QR)');
      }
    }

    Fac.download(pid, { fecha, asunto: asunto || defaultAsunto(p), num, verifactu });
    T.ev('action', 'invoice_generate');
    this.cm(); this.rDet(pid);
  },


  /* ══════════════════════════════════════════════
   *  COBROS PARCIALES (Partial Payments)
   * ══════════════════════════════════════════════ */

  cobroModal(pid, cid) {
    const p = D.p(pid); if (!p) return;
    B.calc(p);
    const isEdit = !!cid;
    const existing = isEdit ? (p.facturacion.cobros || []).find(c => c.id === cid) : null;
    if (isEdit && !existing) return;
    const pend = B.pendiente(p);
    if (!isEdit && pend <= 0) { Toast.ok(t('billing.alreadyPaid')); return; }
    const defAmount = isEdit ? existing.cantidad : pend.toFixed(2);
    const defDate = isEdit ? (existing.fecha || todayStr()) : todayStr();
    const title = isEdit ? t('billing.editPayment') : t('billing.addPayment');
    this.om(
      `<div class="mt">${title}</div>`
      + `<div class="fr"><div class="fg"><label>${t('billing.paymentAmount')}</label><input type="number" id="mcA" min="0.01" step="0.01" value="${defAmount}"></div>`
      + `<div class="fg"><label>${t('field.date')}</label><input type="date" id="mcD" value="${defDate}"></div></div>`
      + (isEdit ? '' : `<div style="font-size:.78rem;color:var(--t3);margin-bottom:.75rem">${t('billing.remaining', fmtMoney(pend))}</div>`)
      + `<div class="ma"><button class="bt" onclick="App.cm()">${t('btn.cancel')}</button><button class="bt bt-p" onclick="App.saveCobro('${pid}'${isEdit ? `,'${cid}'` : ''})">${t('btn.save')}</button></div>`
    );
  },

  saveCobro(pid, cid) {
    const cant = parseFloat(document.getElementById('mcA').value) || 0;
    const fecha = document.getElementById('mcD').value || todayStr();
    if (cant <= 0) return;
    const p = D.p(pid); if (!p) return;
    if (!p.facturacion.cobros) p.facturacion.cobros = [];
    if (cid) {
      const c = p.facturacion.cobros.find(x => x.id === cid);
      if (c) { c.fecha = fecha; c.cantidad = roundMoney(cant); }
    } else {
      p.facturacion.cobros.push({ id: uid(), fecha, cantidad: roundMoney(cant) });
    }
    B.calc(p);
    D.up(pid, { facturacion: p.facturacion });
    Toast.ok((cid ? t('billing.editPayment') : t('billing.addPayment')) + ' ✓');
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
document.addEventListener('DOMContentLoaded', () => { App.init(); if (typeof H !== 'undefined') H.maybeAutoSnapshot(); });

/* ── Tooltip flotante para segmentos de barras ── */
(function(){
  const tip = document.createElement('div');
  tip.id = 'barTip';
  document.body.appendChild(tip);
  document.addEventListener('pointerenter', e => {
    if (!(e.target instanceof Element)) return;
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
    if (!(e.target instanceof Element)) return;
    if (e.target.closest('.pbar-seg[data-tip]')) tip.style.opacity = '0';
  }, true);
})();
