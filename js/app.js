/* ================================================
 * TRACKR — App principal
 * Navegación, vistas, modals, export/import
 * Globales: App
 * Dependencias: colors.js, utils.js, store.js,
 *               billing.js, tracking.js, facturas.js
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
   *  INFO (Home)
   * ══════════════════════════════════════════════ */

  rInfo() {
    const ps = D.ps();
    const hasProjects = ps.length > 0;
    const statusEl = document.getElementById('infoStatus');

    /* ── Bloque de estado / CTA ── */
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

    /* ── Resumen financiero ── */
    this._rInfoFinancial();
  },

  /**
   * Comprueba si un periodo tiene datos (horas, cobros o gastos).
   * Usado para ocultar flechas de navegación si no hay datos.
   */
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

  /** Renderiza el resumen financiero en la vista Info */
  _rInfoFinancial() {
    const el = document.getElementById('infoFinancial');
    const ps = D.ps();
    if (!ps.length) { el.innerHTML = ''; return; }

    const type = this.infoPeriod;
    const year = this.infoY;
    const month = this.infoM;

    /* Calcular métricas del periodo */
    let cobrado = 0, horas = 0;
    let baseTotal = 0, ivaTotal = 0, irpfTotal = 0;

    ps.forEach(p => {
      B.calc(p);
      const f = p.facturacion;

      /* Horas del periodo */
      p.horas.forEach(h => {
        if (h.fecha && inPeriod(h.fecha, type, year, month)) {
          horas += h.cantidad;
        }
      });

      /* Cobrado: pagado con fechaPago en el periodo */
      if (f.pagado && f.fechaPago && inPeriod(f.fechaPago, type, year, month)) {
        cobrado += f.totalFactura || 0;
        baseTotal += f.baseImponible || 0;
        ivaTotal += f.importeIva || 0;
        irpfTotal += f.importeIrpf || 0;
      }
    });

    /* Gastos del periodo */
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

    /* Sin actividad en el periodo → mostrar solo nav si hay datos en otros periodos */
    const isEmpty = cobrado === 0 && gastosTotal === 0 && horas === 0;
    if (isEmpty && !this._hasPeriodData(type, year, month)) {
      el.innerHTML = ''; return;
    }

    /* Título del periodo */
    let periodLabel;
    if (type === 'mes') periodLabel = `${MESES[month]} ${year}`;
    else if (type === 'trim') {
      const q = Math.floor(month / 3) + 1;
      periodLabel = `T${q} ${year}`;
    } else periodLabel = `${year}`;

    /* Max para barras proporcionales */
    const maxBar = Math.max(cobrado, gastosTotal, 1);

    /* Comprobar si periodos adyacentes tienen datos (para flechas) */
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

    /* HTML */
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
  },


  /* ══════════════════════════════════════════════
   *  PROYECTOS (ex-Dashboard)
   * ══════════════════════════════════════════════ */

  rDash() {
    const ps = D.ps();
    ps.forEach(p => B.calc(p));

    /* ── Filtros ── */
    const filters = [
      { k: 'todos', l: 'Todos' },
      { k: 'internos', l: 'Internos' },
      { k: 'externos', l: 'Externos' },
      { k: 'recurrentes', l: 'Recurrentes' }
    ];
    document.getElementById('dFilt').innerHTML = filters.map(f =>
      `<button class="fb ${this.pf === f.k ? 'on' : ''}" onclick="App.sf('${f.k}')">${f.l}</button>`
    ).join('');

    /* ── Alertas ── */
    const als = [];
    ps.forEach(p => {
      const f = p.facturacion;
      if (p.estado === 'completado' && f.facturaFecha && !f.pagado) {
        als.push({ t: `${p.nombre} — pendiente de pago`, id: p.id });
      }
    });
    document.getElementById('dAl').innerHTML = als.map(a =>
      `<div class="al" onclick="App.go('det','${a.id}')">`
      + `<span style="color:var(--warn)">!</span>`
      + `<span style="flex:1">${esc(a.t)}</span>`
      + `<span style="color:var(--t3)">&rarr;</span></div>`
    ).join('');

    /* ── Filtrar ── */
    let filtered = ps;
    if (this.pf === 'internos') filtered = ps.filter(p => p.interno);
    else if (this.pf === 'externos') filtered = ps.filter(p => !p.interno);
    else if (this.pf === 'recurrentes') filtered = ps.filter(p => p.recurrente);

    /* ── Agrupar por estado ── */
    const groups = {};
    filtered.forEach(p => {
      if (!groups[p.estado]) groups[p.estado] = [];
      groups[p.estado].push(p);
    });

    /* Ordenar cada grupo: internos primero, luego por horas desc */
    Object.keys(groups).forEach(st => {
      groups[st].sort((a, b) => {
        if (a.interno !== b.interno) return a.interno ? -1 : 1;
        const ha = a.horas.reduce((s, h) => s + h.cantidad, 0);
        const hb = b.horas.reduce((s, h) => s + h.cantidad, 0);
        return hb - ha;
      });
    });

    const c = document.getElementById('dPr');
    if (!filtered.length) {
      c.innerHTML = '<div class="es"><div class="tx">Sin proyectos</div></div>';
      return;
    }

    const labels = { activo: 'Activos', pausado: 'Pausados', completado: 'Completados' };
    let html = '';
    EST_ORDER.forEach(st => {
      const g = groups[st];
      if (!g || !g.length) return;
      html += `<div class="dash-group">`
        + `<div class="dash-group-title">${labels[st] || st}</div>`
        + `<div class="pg">${g.map(p => this.card(p)).join('')}</div>`
        + `</div>`;
    });
    c.innerHTML = html;
  },

  /** Genera HTML de card de proyecto */
  card(p) {
    const th = p.horas.reduce((s, h) => s + h.cantidad, 0);
    const eph = B.eph(p);
    const hex = colorHex(p.color);
    const cn = clienteName(p);
    const f = p.facturacion;

    /* Flags */
    let flags = '';
    if (p.interno) flags += '<span class="pc-flag pc-flag-int">interno</span>';
    if (p.recurrente) flags += '<span class="pc-flag pc-flag-rec">recurrente</span>';
    if (f.pagado) flags += '<span class="pc-flag pc-flag-paid">pagado</span>';
    else if (f.facturaFecha) flags += '<span class="pc-flag pc-flag-inv">facturado</span>';

    return `<div class="pc${p.interno ? ' pc-mr' : ''}" style="--project-color:${hex}" onclick="App.go('det','${p.id}')">
      <div class="pc-h">
        <div>
          <div class="pc-n">${esc(p.nombre)}</div>
          <div class="pc-c">${esc(cn)}</div>
        </div>
        <div class="pc-flags">${flags}</div>
      </div>
      <div class="pc-s">
        <span><span class="m">${th.toFixed(1)}h</span></span>
        ${f.modo !== 'gratis'
          ? `<span><span class="m">${fmtMoney(f.totalFactura || 0)}</span></span>`
          : '<span style="color:var(--t3)">gratis</span>'}
        ${eph !== null && f.modo !== 'gratis'
          ? `<span style="color:${eph >= 30 ? 'var(--ok)' : eph >= 15 ? 'var(--warn)' : 'var(--bad)'}">${eph.toFixed(2)} &euro;/h</span>`
          : ''}
      </div>
    </div>`;
  },

  sf(f) { this.pf = f; this.rDash(); },


  /* ══════════════════════════════════════════════
   *  DETALLE DE PROYECTO
   * ══════════════════════════════════════════════ */

  rDet(idOr) {
    const id = typeof idOr === 'string' ? idOr : this.cp;
    this.cp = id;
    const p = D.p(id);
    if (!p) { this.go('dash'); return; }
    B.calc(p);

    const th = p.horas.reduce((s, h) => s + h.cantidad, 0);
    const wh = p.horas.filter(h => h.tipo === 'trabajo').reduce((s, h) => s + h.cantidad, 0);
    const mh = p.horas.filter(h => h.tipo === 'reunion').reduce((s, h) => s + h.cantidad, 0);
    const eph = B.eph(p);
    const hex = colorHex(p.color);
    const cn = clienteName(p);
    const f = p.facturacion;

    /* Lista de horas */
    const hHtml = !p.horas.length
      ? '<div class="es"><div class="tx">Sin horas</div></div>'
      : `<div class="hl">${p.horas.map(h =>
          `<div class="hr hr-click" style="border-left-color:${hex}" onclick="App.eHour('${p.id}','${h.id}')">
            <span class="hr-t">${h.tipo === 'trabajo' ? '💻' : '👥'}</span>
            <span class="hr-d">${fmtDate(h.fecha)}${h.horaInicio ? ' ' + h.horaInicio : ''}</span>
            <span class="hr-a m">${h.cantidad}h</span>
            <span class="hr-n">${esc(h.nota || '')}</span>
            <span class="hr-x" onclick="event.stopPropagation();App.xHour('${p.id}','${h.id}')" title="Eliminar">&times;</span>
          </div>`).join('')}</div>`;

    /* Facturación */
    const bHtml = f.modo === 'gratis'
      ? '<div style="color:var(--t3);font-size:.85rem">Proyecto gratuito</div>'
      : `<div class="bb">
          <div class="br"><span class="la">Base imponible</span><span class="va">${fmtMoney(f.baseImponible || 0)}</span></div>
          ${f.iva ? `<div class="br"><span class="la">+ IVA (${f.iva}%)</span><span class="va">${fmtMoney(f.importeIva || 0)}</span></div>` : ''}
          ${f.irpf ? `<div class="br"><span class="la">- IRPF (${f.irpf}%)</span><span class="va">${fmtMoney(f.importeIrpf || 0)}</span></div>` : ''}
          <div class="br tot"><span class="la">Total factura</span><span class="va">${fmtMoney(f.totalFactura || 0)}</span></div>
          <div class="br"><span class="la">Neto a recibir</span><span class="va" style="color:var(--ok)">${fmtMoney(f.netoRecibido || 0)}</span></div>
          ${f.gastos ? `<div class="br"><span class="la">Gastos</span><span class="va" style="color:var(--bad)">-${fmtMoney(f.gastos)}</span></div>` : ''}
          ${eph !== null ? `<div class="br"><span class="la">Rentabilidad</span><span class="va" style="color:${eph >= 30 ? 'var(--ok)' : eph >= 15 ? 'var(--warn)' : 'var(--bad)'}">${eph.toFixed(2)} &euro;/h</span></div>` : ''}
        </div>`;

    /* Flags */
    let flagsHtml = '';
    if (p.interno) flagsHtml += ' <span class="pc-flag pc-flag-int">interno</span>';
    if (p.recurrente) flagsHtml += ' <span class="pc-flag pc-flag-rec">recurrente</span>';

    document.getElementById('detC').innerHTML =
      `<div class="db" onclick="App.go('dash')">&larr; proyectos</div>`
      + `<div class="dh"><div><div class="dt" style="color:${hex}">${esc(p.nombre)}</div><div class="dc">${esc(cn)}${flagsHtml}</div></div>`
      + `<div class="bg"><span class="bd bd-${p.estado}">${EST[p.estado] || p.estado}</span>`
      +   `<button class="bt bt-s" onclick="App.pModal('${p.id}')">Editar</button>`
      +   `${f.modo !== 'gratis' ? `<button class="bt bt-s" onclick="App.facModal('${p.id}')">Factura</button>` : ''}`
      +   `<button class="bt bt-s bt-d" onclick="App.xProj('${p.id}')">Eliminar</button></div></div>`
      + `<div class="ds"><div class="dst">Info</div><div class="dg">`
      +   `<div><div class="dfl">Inicio</div><div class="dfv">${fmtDate(p.fechas.inicio)}</div></div>`
      +   `<div><div class="dfl">Fin estimada</div><div class="dfv">${fmtDate(p.fechas.finEstimada)}</div></div>`
      +   `<div><div class="dfl">Fin real</div><div class="dfv">${fmtDate(p.fechas.finReal)}</div></div>`
      +   `<div><div class="dfl">Horas</div><div class="dfv">${th.toFixed(1)}h <span style="color:var(--t3);font-size:.72rem">💻${wh.toFixed(1)} 👥${mh.toFixed(1)}</span></div></div>`
      + `</div>${p.notas ? `<div style="margin-top:.75rem"><div class="dfl">Notas</div><div style="color:var(--t3);font-size:.85rem">${esc(p.notas)}</div></div>` : ''}</div>`
      + `<div class="ds"><div style="display:flex;justify-content:space-between;align-items:center"><div class="dst" style="border:none;margin:0;padding:0">Horas</div><button class="bt bt-add" onclick="App.hModal('${p.id}')">+ Añadir</button></div>${hHtml}</div>`
      + `<div class="ds"><div class="dst">Facturación</div>${bHtml}`
      + `${f.pagado ? `<div style="margin-top:.5rem;font-size:.82rem;color:var(--ok)">Pagado${f.fechaPago ? ' el ' + fmtDate(f.fechaPago) : ''}</div>` : ''}`
      + `${f.facturaFecha ? `<div style="margin-top:.3rem;font-size:.78rem;color:var(--t3)">Factura n.º ${String(f.facturaNum).padStart(4, '0')} — ${fmtDate(f.facturaFecha)}</div>` : ''}`
      + `</div>`;
  },


  /* ══════════════════════════════════════════════
   *  EDITAR / ELIMINAR HORAS
   * ══════════════════════════════════════════════ */

  eHour(pid, hid) {
    const p = D.p(pid); if (!p) return;
    const h = p.horas.find(x => x.id === hid); if (!h) return;
    const noDate = !h.fecha;

    this.om(
      `<div class="mt">Editar hora</div>`
      + `<label>Tipo</label>`
      + `<div class="ts2">`
      +   `<div class="to ${h.tipo === 'trabajo' ? 'on' : ''}" data-type="trabajo" onclick="App.selT(this)"><span class="ic">💻</span><span class="la">Trabajo</span></div>`
      +   `<div class="to ${h.tipo === 'reunion' ? 'on' : ''}" data-type="reunion" onclick="App.selT(this)"><span class="ic">👥</span><span class="la">Reunión</span></div>`
      + `</div>`
      + `<div class="fr"><div class="fg"><label>Horas</label><input type="number" id="ehA" min="0.25" step="0.25" value="${h.cantidad}"></div>`
      +   `<div class="fg"><label>Fecha</label><input type="date" id="ehD" value="${h.fecha || ''}" ${noDate ? 'disabled' : ''}>`
      +   `<label style="margin-top:.35rem;display:flex;align-items:center;gap:.4rem;cursor:pointer;text-transform:none;letter-spacing:0"><input type="checkbox" id="ehNd" ${noDate ? 'checked' : ''} onchange="document.getElementById('ehD').disabled=this.checked;if(this.checked)document.getElementById('ehD').value=''" style="width:auto;accent-color:var(--t2)"> Sin fecha</label></div></div>`
      + `<div class="fr"><div class="fg"><label>Hora inicio</label><input type="time" id="ehHI" value="${h.horaInicio || ''}"></div><div class="fg"></div></div>`
      + `<div class="fg"><label>Nota</label><input type="text" id="ehN" value="${esc(h.nota || '')}"></div>`
      + `<div class="ma"><button class="bt" onclick="App.cm()">Cancelar</button><button class="bt bt-p" onclick="App.saveEH('${pid}','${hid}')">Guardar</button></div>`
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
    sortHoras(p.horas);
    D.up(pid, { horas: p.horas });
    this.cm();
    if (this.cv === 'cal') this.rCal(); else this.rDet(pid);
  },

  xHour(pid, hid) {
    const p = D.p(pid); if (!p) return;
    if (!confirm('¿Eliminar esta entrada de horas?')) return;
    p.horas = p.horas.filter(h => h.id !== hid);
    D.up(pid, { horas: p.horas });
    this.rDet(pid);
  },

  xProj(id) {
    const p = D.p(id); if (!p) return;
    if (confirm(`¿Eliminar "${p.nombre}"?`)) { D.del(id); this.go('dash'); }
  },


  /* ══════════════════════════════════════════════
   *  CALENDARIO
   * ══════════════════════════════════════════════ */

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

    /* Gastos por fecha para el calendario */
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

    document.getElementById('calC').innerHTML =
      this._calHeader(`${MESES[month]} ${year}`, `Total mes: <span class="m">${mt.toFixed(1)}h</span>`)
      + `<div class="cal-grid">${g}</div>`
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

    /* Gastos de la semana */
    const weekGastos = [];
    D.gs().forEach(gasto => {
      const gc = colorHex(gasto.color || 'Salmon');
      (gasto.entradas || []).forEach(e => {
        if (e.fecha && dateSet.has(e.fecha)) {
          weekGastos.push({ gn: gasto.nombre, gc, cant: e.cantidad || 0, fecha: e.fecha });
        }
      });
    });

    const hStart = 7, hEnd = 22, slotH = 60;
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

    /* Gastos de la semana */
    let wgHtml = '';
    if (weekGastos.length) {
      wgHtml = `<div class="cal-nt"><div class="cal-nt-title">Gastos de la semana</div><div class="hl">${weekGastos.map(e =>
        `<div class="hr" style="border-left-color:${e.gc}"><span class="hr-t">€</span><span class="hr-d">${fmtDate(e.fecha)}</span><span class="hr-a m">${fmtMoney(e.cant)}</span><span style="color:var(--t1);font-size:.82rem;flex:1">${esc(e.gn)}</span></div>`
      ).join('')}</div></div>`;
    }

    document.getElementById('calC').innerHTML =
      this._calHeader(title, `Total semana: <span class="m">${wt.toFixed(1)}h</span>`)
      + `<div class="cal-week" style="--slot-h:${slotH}px"><div class="cal-week-hdr">${hdr}</div><div class="cal-week-body"><div class="cal-week-tl">${timeLbl}</div>${cols}</div></div>`
      + ntHtml + wgHtml
      + this._calGoals('week', wt, ws.getFullYear(), ws.getMonth())
      + this._calProjStats(pStats)
      + this._calFinancial(ws.getFullYear(), ws.getMonth());

    /* Drag-to-create */
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
    if (view === 'month') {
      if (t.horasMes) goals.push({ label: 'Horas', actual, target: t.horasMes, unit: 'h' });
      if (t.ingresosMes) {
        let income = 0;
        D.ps().forEach(p => { const f = p.facturacion; if (f.pagado && f.fechaPago && inPeriod(f.fechaPago, 'mes', year, month)) income += f.totalFactura || 0; });
        goals.push({ label: 'Ingresos', actual: income, target: t.ingresosMes, unit: '€' });
      }
    } else {
      if (t.horasSemana) goals.push({ label: 'Horas', actual, target: t.horasSemana, unit: 'h' });
    }
    if (!goals.length) return `<div class="cal-ps" style="margin-top:1rem"><span style="font-size:.78rem;color:var(--t3)">Sin objetivos. <a href="#" onclick="event.preventDefault();App.go('cfg')" style="color:var(--t2)">Configurar &rarr;</a></span></div>`;

    let html = `<div class="cal-ps" style="margin-top:1.25rem"><div class="cal-ps-title">Objetivos</div>`;
    goals.forEach(g => {
      const pct = g.target > 0 ? (g.actual / g.target * 100) : 0;
      const barColor = pct >= 100 ? 'pbar-ok' : pct >= 50 ? 'pbar-neutral' : 'pbar-warn';
      const valStr = g.unit === '€' ? fmtMoney(g.actual) : `${g.actual.toFixed(1)}${g.unit}`;
      const tgtStr = g.unit === '€' ? fmtMoney(g.target) : `${g.target}${g.unit}`;
      html += `<div style="margin-bottom:.6rem"><div style="display:flex;justify-content:space-between;font-size:.78rem;margin-bottom:.25rem"><span style="color:var(--t2)">${g.label}</span><span class="m" style="color:var(--t1)">${valStr} / ${tgtStr}</span></div><div class="pbar"><div class="pbar-fill ${barColor}" style="width:${Math.min(pct, 100).toFixed(1)}%"></div></div></div>`;
    });
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
      if (p.facturacion.pagado && p.facturacion.fechaPago && inPeriod(p.facturacion.fechaPago, 'mes', year, month)) cobrado += p.facturacion.totalFactura || 0;
      p.horas.forEach(h => { if (h.fecha && inPeriod(h.fecha, 'mes', year, month)) horas += h.cantidad; });
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
      /* Limpiar listeners globales */
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
      /* Capturar movimiento y fin del drag en todo el documento */
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

    /* Gastos del día */
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

  /**
   * Genera opciones de proyecto agrupadas por estado para un <select>.
   * Incluye todos los proyectos (también completados).
   */
  _projOptions(selectedId) {
    const ps = D.ps();
    const groups = {};
    ps.forEach(p => { if (!groups[p.estado]) groups[p.estado] = []; groups[p.estado].push(p); });
    const labels = { activo: 'Activos', pausado: 'Pausados', completado: 'Completados' };
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
      + `<div class="fr"><div class="fg"><label>Hora inicio</label><input type="time" id="chHI" value="${hora || ''}"></div><div class="fg"></div></div>`
      + `<div class="fg"><label>Nota</label><input type="text" id="chN" placeholder="¿Qué hiciste?"></div>`
      + `<div class="ma"><button class="bt" onclick="App.cm()">Cancelar</button><button class="bt bt-p" onclick="App.saveCalH()">Guardar</button></div>`);
  },

  /** Muestra/oculta panel de creación inline de proyecto en modal de horas */
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
    if (cant <= 0) return;

    /* Crear proyecto inline si se eligió "_new" */
    if (pid === '_new') {
      const pName = document.getElementById('chPN')?.value?.trim();
      if (!pName) { alert('Nombre de proyecto obligatorio'); return; }
      let clienteId = document.getElementById('chPCl')?.value || null;
      let projColor = 'CornflowerBlue';
      if (clienteId === '_new') {
        const clName = document.getElementById('chPClN')?.value?.trim();
        if (!clName) { alert('Nombre de cliente obligatorio'); return; }
        const newCl = D.addCl({ id: uid(), nombre: clName, direccion1: '', direccion2: '', nif: '', color: projColor });
        clienteId = newCl.id;
      } else if (clienteId) {
        /* Heredar color del cliente seleccionado */
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
    p.horas.push({ id: uid(), fecha, tipo, cantidad: cant, nota, horaInicio });
    T.ev('action', 'hours_add', 'calendar');
    sortHoras(p.horas); D.up(pid, { horas: p.horas }); this.cm(); this.rCal();
  },


  /* ══════════════════════════════════════════════
   *  CONFIGURACIÓN
   * ══════════════════════════════════════════════ */

  rCfg() {
    const s = D.d.settings, em = s.emisor, t = s.targets, cls = D.cls();

    document.getElementById('cfgC').innerHTML =
      `<div class="cfg-section"><div class="cfg-section-title">Datos del emisor (para facturas)</div><div class="cfg-grid">`
      + `<div class="cfg-full fg"><label>Nombre / Empresa</label><input type="text" id="cfgEN" value="${esc(em.nombre)}" placeholder="Tu nombre o empresa"></div>`
      + `<div class="fg"><label>Dirección línea 1</label><input type="text" id="cfgED1" value="${esc(em.direccion1)}" placeholder="Calle, número"></div>`
      + `<div class="fg"><label>Dirección línea 2</label><input type="text" id="cfgED2" value="${esc(em.direccion2)}" placeholder="CP, Ciudad, País"></div>`
      + `<div class="fg"><label>NIF / CIF</label><input type="text" id="cfgENif" value="${esc(em.nif)}" placeholder="12345678A"></div>`
      + `</div></div>`
      + `<div class="cfg-section"><div class="cfg-section-title">Valores por defecto</div><div class="cfg-grid">`
      + `<div class="fg"><label>IVA %</label><input type="number" id="cfgIva" value="${s.defaultIva}" min="0" max="100" step="1"></div>`
      + `<div class="fg"><label>IRPF %</label><input type="number" id="cfgIrpf" value="${s.defaultIrpf}" min="0" max="100" step="1"></div>`
      + `</div></div>`
      + `<div class="cfg-section"><div class="cfg-section-title">Objetivos</div><div class="cfg-grid">`
      + `<div class="fg"><label>Horas / mes</label><input type="number" id="cfgTHm" value="${t.horasMes || ''}" min="0" step="1" placeholder="Ej: 160"></div>`
      + `<div class="fg"><label>Ingresos / mes (&euro;)</label><input type="number" id="cfgTIm" value="${t.ingresosMes || ''}" min="0" step="100" placeholder="Ej: 3000"></div>`
      + `<div class="fg"><label>Horas / semana</label><input type="number" id="cfgTHs" value="${t.horasSemana || ''}" min="0" step="1" placeholder="Ej: 40"></div>`
      + `</div></div>`
      + `<div class="cfg-section"><div class="cfg-section-title">Tema</div>`
      + `<div class="theme-grid">${THEME_ORDER.map(id => {
          const th = THEMES[id];
          return `<button class="theme-btn${s.tema === id ? ' on' : ''}" onclick="App.setTheme('${id}')">`
            + `<div class="theme-preview" style="background:${th.vars.bg};border-color:${th.vars.b2}">`
            + `<div style="background:${th.vars.bg2};border:1px solid ${th.vars.b1};border-radius:2px;padding:3px 5px;margin-bottom:2px"><span style="color:${th.vars.t1};font-size:8px">Aa</span></div>`
            + `<div style="display:flex;gap:2px"><span style="width:8px;height:4px;border-radius:1px;background:${th.vars.ok}"></span><span style="width:8px;height:4px;border-radius:1px;background:${th.vars.warn}"></span><span style="width:8px;height:4px;border-radius:1px;background:${th.vars.bad}"></span></div>`
            + `</div><span class="theme-name">${th.label}</span></button>`;
        }).join('')}</div></div>`
      + `<div class="cfg-save"><button class="bt bt-p" onclick="App.saveCfg()">Guardar configuración</button><span class="cfg-saved" id="cfgOk">Guardado</span></div>`
      + `<div class="cfg-section" style="margin-top:2.5rem"><div class="cfg-section-title">Clientes</div>`
      + (cls.length
        ? `<div class="cl-list">${cls.map(c => `<div class="cl-item"><span class="cl-dot" style="background:${colorHex(c.color || 'CornflowerBlue')}"></span><span class="cl-name">${esc(c.nombre)}</span>${c.nif ? `<span class="cl-nif">${esc(c.nif)}</span>` : ''}<div class="cl-actions"><button class="cl-btn" onclick="App.clModal('${c.id}')" title="Editar">&#9998;</button><button class="cl-btn cl-btn-del" onclick="App.delCl('${c.id}')" title="Eliminar">&times;</button></div></div>`).join('')}</div>`
        : '<div style="color:var(--t3);font-size:.82rem">Sin clientes. Se crearán al añadir proyectos.</div>')
      + `<button class="bt bt-add" style="margin-top:.75rem" onclick="App.clModal()">+ Nuevo cliente</button></div>`;
  },

  /** Cambia el tema, lo aplica y persiste */
  setTheme(id) {
    if (!THEMES[id]) return;
    applyTheme(id);
    D.d.settings.tema = id;
    D.save();
    this.rCfg(); /* re-renderizar para actualizar el selector */
  },

  saveCfg() {
    const s = D.d.settings;
    s.emisor.nombre = document.getElementById('cfgEN').value.trim();
    s.emisor.direccion1 = document.getElementById('cfgED1').value.trim();
    s.emisor.direccion2 = document.getElementById('cfgED2').value.trim();
    s.emisor.nif = document.getElementById('cfgENif').value.trim();
    s.defaultIva = parseInt(document.getElementById('cfgIva').value) || 0;
    s.defaultIrpf = parseInt(document.getElementById('cfgIrpf').value) || 0;
    s.targets.horasMes = parseFloat(document.getElementById('cfgTHm').value) || null;
    s.targets.ingresosMes = parseFloat(document.getElementById('cfgTIm').value) || null;
    s.targets.horasSemana = parseFloat(document.getElementById('cfgTHs').value) || null;
    D.save();
    const ok = document.getElementById('cfgOk'); ok.style.display = 'flex';
    setTimeout(() => ok.style.display = 'none', 2500);
  },

  clModal(cid) {
    const isE = !!cid, c = isE ? D.cl(cid) : null;
    const clColor = c?.color || 'CornflowerBlue';
    this.om(`<div class="mt">${isE ? 'Editar' : 'Nuevo'} cliente</div>`
      + `<div class="fg"><label>Nombre</label><input type="text" id="clN" value="${esc(c?.nombre || '')}" placeholder="Nombre o empresa"></div>`
      + `<div class="fr"><div class="fg"><label>Dirección línea 1</label><input type="text" id="clD1" value="${esc(c?.direccion1 || '')}" placeholder="Calle, número"></div><div class="fg"><label>Dirección línea 2</label><input type="text" id="clD2" value="${esc(c?.direccion2 || '')}" placeholder="CP, Ciudad"></div></div>`
      + `<div class="fr"><div class="fg"><label>NIF / CIF</label><input type="text" id="clNif" value="${esc(c?.nif || '')}" placeholder="12345678A"></div><div class="fg"><label>Color</label>${this.colorSelect(clColor)}</div></div>`
      + `<div class="ma"><button class="bt" onclick="App.cm()">Cancelar</button><button class="bt bt-p" onclick="App.saveCl('${cid || ''}')">${isE ? 'Guardar' : 'Crear'}</button></div>`);
  },

  saveCl(cid) {
    const nombre = document.getElementById('clN').value.trim();
    if (!nombre) { alert('Nombre obligatorio'); return; }
    const color = document.getElementById('mpColor')?.value || 'CornflowerBlue';
    const data = { nombre, direccion1: document.getElementById('clD1').value.trim(), direccion2: document.getElementById('clD2').value.trim(), nif: document.getElementById('clNif').value.trim(), color };
    if (cid) D.upCl(cid, data); else { data.id = uid(); D.addCl(data); }
    this.cm(); this.rCfg();
  },

  delCl(cid) {
    const c = D.cl(cid); if (!c) return;
    if (!confirm(`¿Eliminar cliente "${c.nombre}"?`)) return;
    D.delCl(cid); this.rCfg();
  },


  /* ══════════════════════════════════════════════
   *  GASTOS
   * ══════════════════════════════════════════════ */

  rGas() {
    const gastos = D.gs();
    const c = document.getElementById('gasC');
    if (!gastos.length) { c.innerHTML = '<div class="es"><div class="tx">Sin gastos registrados</div></div>'; return; }

    const now = new Date();
    const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const thisYear = now.getFullYear();
    let totalMes = 0, totalAnio = 0;
    gastos.forEach(g => { (g.entradas || []).forEach(e => { if (!e.fecha) return; if (e.fecha.startsWith(thisMonth)) totalMes += e.cantidad || 0; if (e.fecha.startsWith(String(thisYear))) totalAnio += e.cantidad || 0; }); });

    let html = `<div class="gas-summary"><div class="sc"><div class="sc-l">Este mes</div><div class="sc-v m">${fmtMoney(totalMes)}</div></div><div class="sc"><div class="sc-l">Este año</div><div class="sc-v m">${fmtMoney(totalAnio)}</div></div></div>`;
    html += '<div class="gas-list">';
    gastos.forEach(g => {
      const total = (g.entradas || []).reduce((s, e) => s + (e.cantidad || 0), 0);
      const count = (g.entradas || []).length;
      const catLabel = GASTO_CAT[g.categoria] || g.categoria || 'Otro';
      const gHex = colorHex(g.color || 'Salmon');
      html += `<div class="gas-card" style="border-left:3px solid ${gHex}"><div class="gas-header" onclick="this.nextElementSibling.classList.toggle('open')">`
        + `<span class="gas-name">${esc(g.nombre)}</span><span class="gas-cat">${catLabel}</span>`
        + `${g.recurrente && g.recurrente !== 'no' ? `<span class="gas-rec">${RECURRENCIA[g.recurrente]}</span>` : ''}`
        + `<span class="gas-total m">${fmtMoney(total)}</span><span class="gas-count">${count} entr.</span>`
        + `<div class="gas-actions"><button class="cl-btn" onclick="event.stopPropagation();App.gModal('${g.id}')" title="Editar">&#9998;</button><button class="cl-btn cl-btn-del" onclick="event.stopPropagation();App.delG('${g.id}')" title="Eliminar">&times;</button></div>`
        + `</div><div class="gas-body">`;
      if (count) {
        (g.entradas || []).sort((a, b) => (b.fecha || '').localeCompare(a.fecha || '')).forEach(e => {
          html += `<div class="gas-entry"><span class="gas-e-date">${fmtDate(e.fecha)}</span><span class="gas-e-amount m">${fmtMoney(e.cantidad || 0)}</span><span class="gas-e-nota">${esc(e.nota || '')}</span><button class="gas-e-del" onclick="App.delGE('${g.id}','${e.id}')" title="Eliminar">&times;</button></div>`;
        });
      }
      html += `<button class="bt bt-add" style="margin-top:.5rem" onclick="App.geModal('${g.id}')">+ Añadir entrada</button></div></div>`;
    });
    html += '</div>';
    c.innerHTML = html;
  },

  gModal(gid) {
    const isE = !!gid, g = isE ? D.g(gid) : null;
    const gColor = g?.color || 'Salmon';
    this.om(`<div class="mt">${isE ? 'Editar' : 'Nuevo'} gasto</div>`
      + `<div class="fg"><label>Nombre</label><input type="text" id="gN" value="${esc(g?.nombre || '')}" placeholder="Ej: Mentoring, Dominio..."></div>`
      + `<div class="fr"><div class="fg"><label>Categoría</label><select id="gCat">${Object.entries(GASTO_CAT).map(([k, v]) => `<option value="${k}" ${g?.categoria === k ? 'selected' : ''}>${v}</option>`).join('')}</select></div>`
      + `<div class="fg"><label>Recurrencia</label><select id="gRec">${Object.entries(RECURRENCIA).map(([k, v]) => `<option value="${k}" ${g?.recurrente === k ? 'selected' : ''}>${v}</option>`).join('')}</select></div></div>`
      + `<div class="fg"><label>Color</label>${this.colorSelect(gColor)}</div>`
      + `<div class="fg"><label>Notas</label><textarea id="gNo" placeholder="...">${esc(g?.notas || '')}</textarea></div>`
      + `<div class="ma"><button class="bt" onclick="App.cm()">Cancelar</button><button class="bt bt-p" onclick="App.saveG('${gid || ''}')">${isE ? 'Guardar' : 'Crear'}</button></div>`);
  },

  saveG(gid) {
    const nombre = document.getElementById('gN').value.trim();
    if (!nombre) { alert('Nombre obligatorio'); return; }
    const color = document.getElementById('mpColor')?.value || 'Salmon';
    const data = { nombre, categoria: document.getElementById('gCat').value, recurrente: document.getElementById('gRec').value, color, notas: document.getElementById('gNo').value.trim() };
    if (gid) D.upG(gid, data); else { data.id = uid(); data.entradas = []; D.addG(data); }
    this.cm(); this.rGas();
  },

  delG(gid) { const g = D.g(gid); if (!g) return; if (!confirm(`¿Eliminar gasto "${g.nombre}"?`)) return; D.delG(gid); this.rGas(); },

  geModal(gid) {
    this.om(`<div class="mt">Añadir entrada</div>`
      + `<div class="fr"><div class="fg"><label>Cantidad (&euro;)</label><input type="number" id="geA" min="0.01" step="0.01" value="" placeholder="0,00"></div>`
      + `<div class="fg"><label>Fecha</label><input type="date" id="geD" value="${todayStr()}"></div></div>`
      + `<div class="fg"><label>Nota</label><input type="text" id="geN" placeholder="Detalle"></div>`
      + `<div class="ma"><button class="bt" onclick="App.cm()">Cancelar</button><button class="bt bt-p" onclick="App.saveGE('${gid}')">Añadir</button></div>`);
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
        const hex = colorHex(cl.color);
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

    /* Proyecto siendo editado (si existe) */
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
      totalF = t; /* en desde_total, el total es el input */
    }

    /* Cálculos comunes */
    importeIva = Math.round(base * ivR / 100 * 100) / 100;
    importeIrpf = Math.round(base * irR / 100 * 100) / 100;
    if (m !== 'desde_total') totalF = Math.round((base + importeIva - importeIrpf) * 100) / 100;
    neto = Math.round((base - importeIrpf) * 100) / 100;

    /* Línea informativa para modo por_hora */
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
    if (!nombre) { alert('Nombre obligatorio'); return; }

    /* Resolver cliente */
    let clienteId = document.getElementById('mpCl').value;
    const color = document.getElementById('mpColor').value;
    if (clienteId === '_new') {
      const newName = document.getElementById('mpClNewN').value.trim();
      if (!newName) { alert('Nombre de cliente obligatorio'); return; }
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
   *  MODAL HORAS (desde detalle)
   * ══════════════════════════════════════════════ */

  hModal(pid) {
    this.om(`<div class="mt">Añadir horas</div><label>Tipo</label>`
      + `<div class="ts2"><div class="to on" data-type="trabajo" onclick="App.selT(this)"><span class="ic">💻</span><span class="la">Trabajo</span></div><div class="to" data-type="reunion" onclick="App.selT(this)"><span class="ic">👥</span><span class="la">Reunión</span></div></div>`
      + `<div class="fr"><div class="fg"><label>Horas</label><input type="number" id="mhA" min="0.25" step="0.25" value="1"></div>`
      + `<div class="fg"><label>Fecha</label><input type="date" id="mhD" value="${todayStr()}"><label style="margin-top:.35rem;display:flex;align-items:center;gap:.4rem;cursor:pointer;text-transform:none;letter-spacing:0"><input type="checkbox" id="mhNd" onchange="document.getElementById('mhD').disabled=this.checked;if(this.checked)document.getElementById('mhD').value=''" style="width:auto;accent-color:var(--t2)"> Sin fecha</label></div></div>`
      + `<div class="fr"><div class="fg"><label>Hora inicio</label><input type="time" id="mhHI" value=""></div><div class="fg"></div></div>`
      + `<div class="fg"><label>Nota</label><input type="text" id="mhN" placeholder="¿Qué hiciste?"></div>`
      + `<div class="ma"><button class="bt" onclick="App.cm()">Cancelar</button><button class="bt bt-p" onclick="App.saveHM('${pid}')">Guardar</button></div>`);
  },

  saveHM(pid) {
    const tipo = document.querySelector('#mC .to.on')?.dataset.type || 'trabajo';
    const cant = parseFloat(document.getElementById('mhA').value) || 0;
    const sinF = document.getElementById('mhNd')?.checked;
    const fecha = sinF ? null : (document.getElementById('mhD').value || null);
    const horaInicio = document.getElementById('mhHI').value || null;
    const nota = document.getElementById('mhN').value.trim();
    if (cant <= 0) return;
    const p = D.p(pid); if (!p) return;
    p.horas.push({ id: uid(), fecha, tipo, cantidad: cant, nota, horaInicio });
    T.ev('action', 'hours_add', 'modal');
    sortHoras(p.horas); D.up(pid, { horas: p.horas }); this.cm(); this.rDet(pid);
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
    const r = new FileReader();
    r.onload = e => {
      try {
        const d = JSON.parse(e.target.result);
        if (!d.projects || !Array.isArray(d.projects)) { alert('JSON no válido: falta "projects"'); return; }
        /* Validar estructura mínima de cada proyecto */
        for (const p of d.projects) {
          if (!p.id || !p.nombre) { alert('JSON no válido: proyecto sin id o nombre'); return; }
          if (p.horas && !Array.isArray(p.horas)) { alert('JSON no válido: "horas" no es un array'); return; }
        }
        if (d.clientes && !Array.isArray(d.clientes)) { alert('JSON no válido: "clientes" no es un array'); return; }
        if (d.gastos && !Array.isArray(d.gastos)) { alert('JSON no válido: "gastos" no es un array'); return; }
        if (!d.settings) d.settings = { defaultIva: 21, defaultIrpf: 15 };
        D.load(d); T.ev('action', 'import'); this.go(this.cv);
      } catch (err) { alert('Error al importar: ' + err.message); }
    };
    r.readAsText(f); ev.target.value = '';
  }
};

/* ── Arranque ── */
document.addEventListener('DOMContentLoaded', () => App.init());
