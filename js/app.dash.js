/* ================================================
 * TRACKR — App: Vista Dashboard (Proyectos)
 * Globales: extiende App
 * Dependencias: app.js (App base), utils.js, store.js,
 *               billing.js, colors.js
 * ================================================ */

Object.assign(App, {

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

  card(p) {
    const th = p.horas.reduce((s, h) => s + h.cantidad, 0);
    const eph = B.eph(p);
    const hex = colorHex(p.color);
    const cn = clienteName(p);
    const f = p.facturacion;

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

  sf(f) { this.pf = f; this.rDash(); }

});
