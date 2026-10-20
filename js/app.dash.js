/* ================================================
 * TRACKR — App: Vista Dashboard (Proyectos)
 * Globales: extiende App
 * Dependencias: app.js (App base), utils.js, store.js,
 *               billing.js, colors.js, lang.js
 * ================================================ */

Object.assign(App, {

  rDash() {
    const ps = D.ps();
    ps.forEach(p => B.calc(p));

    /* ── Filtros ── */
    const filters = [
      { k: 'externos', l: t('dash.external') },
      { k: 'todos', l: t('dash.all') },
      { k: 'internos', l: t('dash.internal') },
      { k: 'recurrentes', l: t('dash.recurring') }
    ];
    const board = this.dashMode() === 'board';
    document.getElementById('dFilt').innerHTML = filters.map(f =>
      `<button class="fb ${this.pf === f.k ? 'on' : ''}" onclick="App.sf('${f.k}')">${f.l}</button>`
    ).join('')
      + `<span style="flex:1"></span>`
      + `<button class="fb ${board ? '' : 'on'}" onclick="App.sm('list')">${t('dash.list')}</button>`
      + `<button class="fb ${board ? 'on' : ''}" onclick="App.sm('board')">${t('dash.board')}</button>`;

    /* ── Alertas ── */
    const als = [];
    ps.forEach(p => {
      const f = p.facturacion;
      if ((p.estado === 'completado' || p.estado === 'abandonado') && f.facturaFecha && !f.pagado) {
        const dv = B.diasVencida(f, D.d.settings.diasVencimiento, todayStr());
        als.push({ t: t('info.pendingPaymentAlert', p.nombre) + (dv > 0 ? ' · ' + t('fac.overdueDays', dv) : ''), id: p.id });
      }
    });
    document.getElementById('dAl').innerHTML = als.map(a =>
      `<div class="al" onclick="App.go('det','${a.id}')">`
      + `<span style="color:var(--warn)">!</span>`
      + `<span style="flex:1">${esc(a.t)}</span>`
      + `<span style="color:var(--t3)">&rarr;</span></div>`
    ).join('');

    /* ── Modo tablero: el journey ocupa el sitio de la lista (las alertas se quedan) ── */
    document.getElementById('dPr').style.display = board ? 'none' : '';
    document.getElementById('jrnC').style.display = board ? '' : 'none';
    if (board) { this.rJourney(); return; }

    /* ── Filtrar ── */
    let filtered = ps;
    if (this.pf === 'internos') filtered = ps.filter(p => p.interno);
    else if (this.pf === 'externos') filtered = ps.filter(p => !p.interno);
    else if (this.pf === 'recurrentes') filtered = ps.filter(p => p.recurrente);

    /* ── Agrupar por estado, subdividiendo activos ── */
    const groups = {};
    filtered.forEach(p => {
      let key = p.estado;
      /* En "Todos": activos se subdividen en externos / internos / recurrentes */
      if (key === 'activo' && (!this.pf || this.pf === 'todos')) {
        if (p.recurrente) key = '_recurrente';
        else if (p.interno) key = '_interno';
      }
      if (!groups[key]) groups[key] = [];
      groups[key].push(p);
    });

    /* Ordenar cada grupo por horas desc */
    Object.keys(groups).forEach(st => {
      groups[st].sort((a, b) => {
        const ha = B.totalHoras(a);
        const hb = B.totalHoras(b);
        return hb - ha;
      });
    });

    const c = document.getElementById('dPr');
    if (!filtered.length) {
      c.innerHTML = `<div class="es"><div class="tx">${t('dash.noProjects')}</div></div>`;
      return;
    }

    const labels = { potencial: t('est.potenciales'), activo: t('est.activos'), _interno: t('dash.flagInternal'), _recurrente: t('dash.flagRecurring'), pausado: t('est.pausados'), completado: t('est.completados'), abandonado: t('est.abandonados') };
    const collapsible = { completado: true, abandonado: true };
    /* Orden de renderizado: activos externos, internos, recurrentes, luego el resto */
    const renderOrder = (!this.pf || this.pf === 'todos')
      ? ['activo', '_interno', '_recurrente', 'potencial', 'pausado', 'completado', 'abandonado']
      : EST_ORDER;
    let html = '';
    renderOrder.forEach(st => {
      const g = groups[st] || [];
      /* Estados reales vacíos: se pintan ocultos para poder soltar en ellos al arrastrar.
         Los subgrupos _interno/_recurrente son marcas, no estados: vacíos no salen. */
      if (!g.length) {
        if (st[0] !== '_') html += `<div class="dash-group empty" data-st="${st}"><div class="dash-group-title">${labels[st] || st}</div><div class="pg"></div></div>`;
        return;
      }
      if (collapsible[st]) {
        const open = this._groupOpen?.[st] ?? false;
        html += `<div class="dash-group" data-st="${st}">`
          + `<div class="dash-group-title dash-group-toggle" onclick="App.toggleGroup('${st}')">`
          +   `<span class="dash-group-chev${open ? ' open' : ''}">\u25B8</span> ${labels[st] || st} <span class="dash-group-count">${g.length}</span>`
          + `</div>`
          + `<div class="pg${open ? '' : ' hidden'}">${g.map(p => this.card(p)).join('')}</div>`
          + `</div>`;
      } else {
        html += `<div class="dash-group" data-st="${st}">`
          + `<div class="dash-group-title">${labels[st] || st}</div>`
          + `<div class="pg">${g.map(p => this.card(p)).join('')}</div>`
          + `</div>`;
      }
    });
    c.innerHTML = html;
    this._dashDnd(c);
  },

  /**
   * Arrastrar tarjetas entre estados (HTML5 drag & drop, como el journey). Delegado en
   * el contenedor y enganchado una sola vez: rDash solo cambia su innerHTML. En móvil el
   * navegador no arrastra; el estado se sigue cambiando desde el modal del proyecto.
   */
  _dashDnd(c) {
    if (c._dnd) return;
    c._dnd = true;
    let pid = null, over = null;
    const clear = () => { if (over) over.classList.remove('drag-over'); over = null; };
    c.addEventListener('dragstart', e => {
      const card = e.target.closest && e.target.closest('.pc[data-pid]');
      if (!card) return;
      pid = card.dataset.pid;
      e.dataTransfer.setData('text/plain', pid);
      e.dataTransfer.effectAllowed = 'move';
      card.classList.add('dragging');
      c.classList.add('dnd');
    });
    c.addEventListener('dragend', e => {
      e.target.closest && e.target.closest('.pc')?.classList.remove('dragging');
      c.classList.remove('dnd'); clear(); pid = null;
    });
    c.addEventListener('dragover', e => {
      const g = pid && e.target.closest && e.target.closest('.dash-group[data-st]');
      if (!g) return;
      e.preventDefault();
      if (g !== over) { clear(); over = g; g.classList.add('drag-over'); }
    });
    c.addEventListener('drop', e => {
      const g = e.target.closest && e.target.closest('.dash-group[data-st]');
      const id = pid || e.dataTransfer.getData('text/plain');
      if (!g || !id) return;
      e.preventDefault();
      /* Limpiar aquí y no en dragend: rDash() sustituye la tarjeta arrastrada y su
         dragend ya no llega al contenedor (se quedaban visibles los estados vacíos). */
      c.classList.remove('dnd'); clear(); pid = null;
      /* Internos / Recurrentes son activos con marca: soltar ahí = activo */
      const st = g.dataset.st[0] === '_' ? 'activo' : g.dataset.st;
      const p = D.p(id);
      if (p && p.estado !== st) {
        D.up(id, { estado: st });
        Toast.ok(`${p.nombre} → ${EST[st] || st}`);
      }
      this.rDash();
    });
  },

  card(p) {
    const th = B.totalHoras(p);
    const eph = B.eph(p);
    const hex = colorHex(p.color);
    const cn = clienteName(p);
    const f = p.facturacion;

    let flags = '';
    if (p.interno) flags += `<span class="pc-flag pc-flag-int">${t('dash.flagInternal')}</span>`;
    if (p.recurrente) flags += `<span class="pc-flag pc-flag-rec">${t('dash.flagRecurring')}</span>`;
    if (f.pagado) flags += `<span class="pc-flag pc-flag-paid">${t('dash.flagPaid')}</span>`;
    else if ((f.cobros || []).length > 0) flags += `<span class="pc-flag pc-flag-partial">${t('dash.flagPartial')}</span>`;
    else if (f.facturaFecha) {
      flags += `<span class="pc-flag pc-flag-inv">${t('dash.flagInvoiced')}</span>`;
    }

    return `<div class="pc" draggable="true" data-pid="${p.id}" style="--project-color:${hex}" onclick="App.go('det','${p.id}')">
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
          : `<span style="color:var(--t3)">${t('dash.free')}</span>`}
        ${eph !== null && f.modo !== 'gratis'
          ? `<span style="color:${B.ephColor(eph)}">${eph.toFixed(2)} &euro;/h</span>`
          : ''}
      </div>
      ${!f.pagado && f.facturaFecha && f.modo !== 'gratis'
        ? `<div class="pc-qp"><button class="bt bt-add pc-qp-btn" onclick="event.stopPropagation();App.quickPay('${p.id}')">${t('dash.markPaid')}</button></div>`
        : ''}
    </div>`;
  },

  sf(f) { this.pf = f; this.rDash(); },

  /** Modo de Proyectos: 'list' (tarjetas por estado) o 'board' (tablero journey). Se recuerda por navegador. */
  dashMode() {
    if (!this.dm) { try { this.dm = localStorage.getItem('trackr_dash_mode') || 'list'; } catch (e) { this.dm = 'list'; } }
    return this.dm;
  },
  sm(m, silent) {
    this.dm = m;
    try { localStorage.setItem('trackr_dash_mode', m); } catch (e) { /* sin storage: solo esta sesión */ }
    if (!silent) this.rDash();
  },

  quickPay(pid) {
    const p = D.p(pid);
    if (!p) return;
    B.calc(p);
    const pend = B.pendiente(p);
    if (pend <= 0) { Toast.ok(t('billing.alreadyPaid')); return; }
    if (!p.facturacion.cobros) p.facturacion.cobros = [];
    p.facturacion.cobros.push({ id: uid(), fecha: todayStr(), cantidad: pend });
    B.calc(p);
    D.up(pid, { facturacion: p.facturacion });
    Toast.ok(t('dash.markPaid') + ' ✓');
    if (this.cv === 'det') this.rDet(pid); else this.rDash();
  },

  toggleGroup(st) {
    if (!this._groupOpen) this._groupOpen = {};
    this._groupOpen[st] = !this._groupOpen[st];
    this.rDash();
  }

});
