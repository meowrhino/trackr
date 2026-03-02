/* ================================================
 * TRACKR — App core
 * Estado, navegación, modales compartidos,
 * modal de proyecto, facturas, export/import
 * Globales: App
 * Dependencias: colors.js, utils.js, store.js,
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
  pf: 'todos',        /* filtro de proyectos */
  calY: null,         /* año del calendario */
  calM: null,         /* mes del calendario 0-11 */
  calView: 'month',   /* 'month' | 'week' */
  calWeekStart: null,  /* Date del lunes de la semana */
  infoPeriod: 'mes',  /* periodo del resumen: 'mes' | 'trim' | 'año' */
  infoY: null,        /* año del resumen financiero */
  infoM: null,        /* mes del resumen financiero 0-11 */
  _editPid: null,     /* ID del proyecto siendo editado (para preview facturación) */

  /* ══════════════════════════════════════════════
   *  INICIALIZACIÓN Y NAVEGACIÓN
   * ══════════════════════════════════════════════ */

  init() {
    /* Analytics desactivado — configurar URL real para activar:
       T.init('https://trackr-analytics.tu-dominio.workers.dev/event'); */
    T.init(null);

    if (!D.init()) D.create();

    /* Aplicar tema guardado */
    applyTheme(D.d.settings.tema || 'oscuro');

    /* Inicializar periodo del resumen al mes actual */
    const now = new Date();
    this.infoY = now.getFullYear();
    this.infoM = now.getMonth();

    /* Cerrar modal con Escape */
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') this.cm();
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
      gas: 'vGas', cfg: 'vCfg', det: 'vDet'
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
      ivaExc: p?.facturacion?.ivaExcepcion || '',
      pagado: p?.facturacion?.pagado || false, fechaPago: p?.facturacion?.fechaPago || '', gastos: p?.facturacion?.gastos || '', notas: p?.notas || ''
    };
    const clOpts = cls.map(c => `<option value="${c.id}" ${c.id === df.clienteId ? 'selected' : ''}>${esc(c.nombre)}</option>`).join('');

    this.om(`<div class="mt">${isE ? 'Editar' : 'Nuevo proyecto'}</div>`
      + `<div class="fg"><label>Nombre</label><input type="text" id="mpN" value="${esc(df.nombre)}" placeholder="Web Conor"></div>`
      + `<div class="fg"><label>Cliente</label><select id="mpCl" onchange="App._onClientChange(this.value)"><option value="">— Sin cliente —</option>${clOpts}<option value="_new">+ Crear nuevo...</option></select></div>`
      + `<div id="mpClNew" style="display:none;margin-bottom:.85rem"><input type="text" id="mpClNewN" placeholder="Nombre del nuevo cliente"></div>`
      + `<div class="fg"><label>Color</label>${this.colorSelect(df.color)}</div>`
      + `<div class="fr"><div class="fg"><label>Estado</label><select id="mpSt">${Object.entries(EST).map(([k, v]) => `<option value="${k}" ${k === df.estado ? 'selected' : ''}>${v}</option>`).join('')}</select></div>`
      + `<div class="fg" style="display:flex;gap:1.25rem;padding-top:1.5rem">`
      + `<label style="display:flex;align-items:center;gap:.4rem;cursor:pointer;text-transform:none;letter-spacing:0"><input type="checkbox" id="mpInt" ${df.interno ? 'checked' : ''} style="width:auto;accent-color:var(--t2)"> Interno</label>`
      + `<label style="display:flex;align-items:center;gap:.4rem;cursor:pointer;text-transform:none;letter-spacing:0"><input type="checkbox" id="mpRec" ${df.recurrente ? 'checked' : ''} style="width:auto;accent-color:var(--t2)"> Recurrente</label>`
      + `</div></div>`
      + `<div class="fr fr-3"><div class="fg"><label>Inicio</label><input type="date" id="mpI" value="${df.inicio}"></div><div class="fg"><label>Fin estimada</label><input type="date" id="mpFE" value="${df.finEst}"></div><div class="fg"><label>Fin real</label><input type="date" id="mpFR" value="${df.finR}"></div></div>`
      + `<div class="dst" style="margin-top:1.25rem">Facturación</div>`
      + `<div class="bms"><button class="bm ${df.modo === 'desde_base' ? 'on' : ''}" onclick="App.sBM('desde_base')">Desde base</button><button class="bm ${df.modo === 'desde_total' ? 'on' : ''}" onclick="App.sBM('desde_total')">Desde total</button><button class="bm ${df.modo === 'por_hora' ? 'on' : ''}" onclick="App.sBM('por_hora')">Por hora</button><button class="bm ${df.modo === 'gratis' ? 'on' : ''}" onclick="App.sBM('gratis')">Gratis</button></div><input type="hidden" id="mpBM" value="${df.modo}">`
      + `<div id="bF" style="${df.modo === 'gratis' ? 'display:none' : ''}">`
      + `<div id="bfPH" style="${df.modo === 'por_hora' ? '' : 'display:none'}"><div class="fg"><label>&euro; / hora</label><input type="number" id="mpPH" value="${df.precioHora}" step="0.01" min="0" placeholder="30.00" oninput="App.cPrev()"></div></div>`
      + `<div class="fr"><div class="fg" id="bfBase" style="${df.modo === 'desde_total' || df.modo === 'por_hora' ? 'display:none' : ''}"><label>Base (&euro;)</label><input type="number" id="mpBa" value="${df.base}" step="0.01" placeholder="0.00" oninput="App.cPrev()"></div><div class="fg" id="bfTot" style="${df.modo === 'desde_base' || df.modo === 'por_hora' ? 'display:none' : ''}"><label>Total (&euro;)</label><input type="number" id="mpTo" value="${df.total}" step="0.01" placeholder="0.00" oninput="App.cPrev()"></div><div class="fg"><label>Gastos (&euro;)</label><input type="number" id="mpGa" value="${df.gastos}" step="0.01" placeholder="0.00"></div></div>`
      + `<div class="tr"><span class="tl">IVA (${df.iva}%)</span><label class="tg"><input type="checkbox" id="mpIva" ${df.ivaOn ? 'checked' : ''} onchange="App.cPrev()"><span class="ts"></span></label></div>`
      + `<div class="tr"><span class="tl">IRPF (${df.irpf}%)</span><label class="tg"><input type="checkbox" id="mpIrpf" ${df.irpfOn ? 'checked' : ''} onchange="App.cPrev()"><span class="ts"></span></label></div>`
      + `<div class="fg" style="margin-top:.4rem"><label>Excepción IVA</label><input type="text" id="mpIvaExc" value="${esc(df.ivaExc)}" placeholder="Ej: Art. 20 LIVA"></div>`
      + `<div id="bPrev" class="bb" style="margin-top:.4rem"></div>`
      + `<div class="tr" style="margin-top:.75rem"><span class="tl">Pagado</span><label class="tg"><input type="checkbox" id="mpPg" ${df.pagado ? 'checked' : ''} onchange="document.getElementById('mpFPw').style.display=this.checked?'block':'none'"><span class="ts"></span></label></div>`
      + `<div id="mpFPw" style="${df.pagado ? '' : 'display:none'}"><div class="fg"><label>Fecha pago</label><input type="date" id="mpFP" value="${df.fechaPago}"></div></div></div>`
      + `<div class="fg" style="margin-top:.75rem"><label>Notas</label><textarea id="mpNo" placeholder="...">${esc(df.notas)}</textarea></div>`
      + `<div class="ma"><button class="bt" onclick="App.cm()">Cancelar</button><button class="bt bt-p" onclick="App.saveP('${eid || ''}')">${isE ? 'Guardar' : 'Crear'}</button></div>`);
    this.cPrev();
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

    const ivaOn = document.getElementById('mpIva')?.checked;
    const irpfOn = document.getElementById('mpIrpf')?.checked;
    const ivR = ivaOn ? (D.d.settings.defaultIva || 21) : 0;
    const irR = irpfOn ? (D.d.settings.defaultIrpf || 15) : 0;

    let base, importeIva, importeIrpf, totalF, neto;

    const p = this._editPid ? D.p(this._editPid) : null;

    if (m === 'por_hora') {
      const ph = parseFloat(document.getElementById('mpPH')?.value) || 0;
      const th = p ? p.horas.reduce((s, h) => s + h.cantidad, 0) : 0;
      base = Math.round(th * ph * 100) / 100;
    } else if (m === 'desde_base') {
      base = parseFloat(document.getElementById('mpBa')?.value) || 0;
    } else {
      const t = parseFloat(document.getElementById('mpTo')?.value) || 0;
      const fac = 1 + ivR / 100 - irR / 100;
      base = fac ? Math.round(t / fac * 100) / 100 : 0;
      totalF = t;
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
        + (p ? `${th.toFixed(1)}h × ${fmtNum(ph)} €/h` : 'Sin horas aún')
        + `</span></div>`;
    }

    const el = document.getElementById('bPrev');
    if (el) el.innerHTML = phInfo
      + `<div class="br"><span class="la">Base</span><span class="va">${fmtMoney(base)}</span></div>`
      + (ivR ? `<div class="br"><span class="la">+ IVA ${ivR}%</span><span class="va">${fmtMoney(importeIva)}</span></div>` : '')
      + (irR ? `<div class="br"><span class="la">- IRPF ${irR}%</span><span class="va">${fmtMoney(importeIrpf)}</span></div>` : '')
      + `<div class="br tot"><span class="la">Total</span><span class="va">${fmtMoney(totalF)}</span></div>`
      + `<div class="br"><span class="la">Neto</span><span class="va" style="color:var(--ok)">${fmtMoney(neto)}</span></div>`;
  },

  saveP(eid) {
    const nombre = document.getElementById('mpN').value.trim();
    if (!nombre) { Toast.warn('Nombre obligatorio'); return; }

    let clienteId = document.getElementById('mpCl').value;
    const color = document.getElementById('mpColor').value;
    if (clienteId === '_new') {
      const newName = document.getElementById('mpClNewN').value.trim();
      if (!newName) { Toast.warn('Nombre de cliente obligatorio'); return; }
      const newCl = D.addCl({ id: uid(), nombre: newName, direccion1: '', direccion2: '', nif: '', color: color || 'CornflowerBlue' });
      clienteId = newCl.id;
    } else if (!clienteId) clienteId = null;

    const estado = document.getElementById('mpSt').value;
    const modo = document.getElementById('mpBM').value;
    const ivaOn = document.getElementById('mpIva')?.checked;
    const irpfOn = document.getElementById('mpIrpf')?.checked;

    const proj = {
      id: eid || uid(), nombre, clienteId: clienteId || null, color, estado,
      interno: document.getElementById('mpInt')?.checked || false,
      recurrente: document.getElementById('mpRec')?.checked || false,
      fechas: { inicio: document.getElementById('mpI').value || null, finEstimada: document.getElementById('mpFE').value || null, finReal: document.getElementById('mpFR').value || null },
      facturacion: {
        modo, baseImponible: parseFloat(document.getElementById('mpBa')?.value) || 0, total: parseFloat(document.getElementById('mpTo')?.value) || 0,
        precioHora: parseFloat(document.getElementById('mpPH')?.value) || 0,
        iva: ivaOn ? (D.d.settings.defaultIva || 21) : 0, irpf: irpfOn ? (D.d.settings.defaultIrpf || 15) : 0,
        ivaExcepcion: document.getElementById('mpIvaExc')?.value?.trim() || '',
        importeIva: 0, importeIrpf: 0, totalFactura: 0, netoRecibido: 0,
        pagado: document.getElementById('mpPg')?.checked || false, fechaPago: document.getElementById('mpFP')?.value || null,
        gastos: parseFloat(document.getElementById('mpGa')?.value) || 0,
        facturaNum: eid ? (D.p(eid)?.facturacion?.facturaNum || null) : null,
        facturaFecha: eid ? (D.p(eid)?.facturacion?.facturaFecha || null) : null
      },
      horas: eid ? (D.p(eid)?.horas || []) : [], notas: document.getElementById('mpNo').value.trim()
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
    const numStr = String(num).padStart(4, '0');
    this.om(`<div class="mt">Generar factura</div>`
      + `<div class="fr"><div class="fg"><label>N.º factura</label><input type="text" id="facNum" value="${numStr}" style="font-family:'DM Mono',monospace"></div>`
      + `<div class="fg"><label>Fecha</label><input type="date" id="facDate" value="${f.facturaFecha || todayStr()}"></div></div>`
      + `<div class="fg"><label>Asunto</label><input type="text" id="facAsunto" value="${esc(p.nombre)}"></div>`
      + `<div class="bb" style="margin-top:.75rem">`
      + `<div class="br"><span class="la">Emisor</span><span class="va">${esc(s.emisor.nombre || '(configurar)')}</span></div>`
      + `<div class="br"><span class="la">Cliente</span><span class="va">${esc(clienteName(p))}</span></div>`
      + `<div class="br"><span class="la">Base</span><span class="va">${fmtMoney(f.baseImponible || 0)}</span></div>`
      + `${f.iva ? `<div class="br"><span class="la">+ IVA ${f.iva}%</span><span class="va">${fmtMoney(f.importeIva || 0)}</span></div>` : ''}`
      + `${f.irpf ? `<div class="br"><span class="la">- IRPF ${f.irpf}%</span><span class="va">${fmtMoney(f.importeIrpf || 0)}</span></div>` : ''}`
      + `<div class="br tot"><span class="la">Total</span><span class="va">${fmtMoney(f.totalFactura || 0)}</span></div></div>`
      + `<div class="ma"><button class="bt" onclick="App.cm()">Cancelar</button><button class="bt bt-p" onclick="App.genFactura('${pid}')">Descargar PDF</button></div>`);
  },

  genFactura(pid) {
    const fecha = document.getElementById('facDate').value;
    const asunto = document.getElementById('facAsunto').value.trim();
    Fac.download(pid, { fecha, asunto });
    T.ev('action', 'invoice_generate');
    this.cm(); this.rDet(pid);
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
    if (f.size > 5 * 1024 * 1024) {
      Toast.error(`Archivo demasiado grande (${(f.size / 1024 / 1024).toFixed(1)}MB). Máximo: 5MB`);
      ev.target.value = '';
      return;
    }
    const r = new FileReader();
    r.onload = e => {
      try {
        const d = JSON.parse(e.target.result);
        if (!d.projects || !Array.isArray(d.projects)) { Toast.error('JSON no válido: falta "projects"'); return; }
        for (const p of d.projects) {
          if (!p.id || !p.nombre) { Toast.error('JSON no válido: proyecto sin id o nombre'); return; }
          if (p.horas && !Array.isArray(p.horas)) { Toast.error('JSON no válido: "horas" no es un array'); return; }
        }
        if (d.clientes && !Array.isArray(d.clientes)) { Toast.error('JSON no válido: "clientes" no es un array'); return; }
        if (d.gastos && !Array.isArray(d.gastos)) { Toast.error('JSON no válido: "gastos" no es un array'); return; }
        if (!d.settings) d.settings = { defaultIva: 21, defaultIrpf: 15 };
        D.load(d); T.ev('action', 'import');
        Toast.ok('Datos importados correctamente');
        this.go(this.cv);
      } catch (err) { Toast.error('Error al importar: ' + err.message); }
    };
    r.readAsText(f); ev.target.value = '';
  }
};

/* ── Arranque ── */
document.addEventListener('DOMContentLoaded', () => App.init());
