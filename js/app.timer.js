/* ================================================
 * TRACKR — App: Temporizador
 *
 * Empezar y parar sobre un proyecto; al parar se crea la entrada de horas.
 * Extiende el objeto global App (definido en app.js, cargado antes).
 *
 * Lo único que se guarda mientras corre es CUÁNDO empezó ({ pid, subId, inicio } en
 * localStorage, clave trackr_timer): recargar o cerrar la pestaña no lo para, y no hay
 * nada que se pueda desincronizar. Es de este navegador: no viaja a la nube ni a otros
 * dispositivos (solo la entrada de horas, al parar, como cualquier otra).
 *
 * Se ve siempre: #navTimer en el menú lateral (en el móvil, el icono con el tiempo debajo).
 * La cuenta de inicio/fin → entrada es B.timerEntry (billing.js, con test).
 * Deps globales: D, B, T, Toast, t, esc, uid, sortHoras, fmtH, clienteName, colorHex.
 * ================================================ */
Object.assign(App, {
  TIMER_KEY: 'trackr_timer',

  /** Temporizador en marcha: { pid, subId?, inicio } o null */
  _timerGet() {
    try {
      const x = JSON.parse(localStorage.getItem(this.TIMER_KEY) || 'null');
      return x && typeof x.pid === 'string' && x.inicio > 0 ? x : null;
    } catch (e) { return null; }
  },

  /** 4325000 ms → «1:12:05»; corto (para el móvil) → «1:12» */
  _timerFmt(ms, corto) {
    const s = Math.max(0, Math.floor(ms / 1000)), h = Math.floor(s / 3600), m = String(Math.floor(s % 3600 / 60)).padStart(2, '0');
    return corto ? `${h}:${m}` : `${h}:${m}:${String(s % 60).padStart(2, '0')}`;
  },

  /** Pinta el botón del menú y los botones de la ficha y del calendario; arranca o para el tic. */
  timerRender() {
    const el = document.getElementById('navTimer'); if (!el) return;
    const tm = this._timerGet(), p = tm ? D.p(tm.pid) : null;
    el.style.display = D._readOnly ? 'none' : ''; /* modo visor: las horas son de la persona */
    el.classList.toggle('run', !!tm);
    const label = tm ? `${t('timer.stop')} · ${p ? p.nombre : '—'}` : t('timer.title');
    el.setAttribute('aria-label', label); el.title = label;
    el.innerHTML = `<span class="ic">${tm ? '&#9632;' : '&#9654;'}</span>`
      + `<span class="nt">${tm ? `<span class="m" data-timer="largo"></span> · ${esc(p ? p.nombre : '—')}` : t('timer.title')}</span>`
      + (tm ? `<span class="timer-m m" data-timer="corto"></span>` : '');
    this._timerTick();
    clearInterval(this._timerInt);
    this._timerInt = tm ? setInterval(() => this._timerTick(), 1000) : null;
  },

  /** Cada segundo: solo cambia el texto del tiempo (en el menú y donde haya un [data-timer]) */
  _timerTick() {
    const tm = this._timerGet(); if (!tm) return;
    const ms = Date.now() - tm.inicio;
    document.querySelectorAll('[data-timer]').forEach(e => { e.textContent = this._timerFmt(ms, e.dataset.timer === 'corto'); });
  },

  /** Toque en el botón del menú: si corre, para; si no, deja elegir proyecto */
  timerTap() { if (this._timerGet()) this.timerStop(); else this.timerPick(); },

  /** Lista de proyectos para empezar con un toque: activos primero, el último usado arriba;
   *  debajo de cada uno, sus subproyectos. */
  timerPick() {
    const ult = p => p.horas.reduce((m, h) => (h.fecha && h.fecha > m ? h.fecha : m), '');
    const ps = D.ps().filter(p => p.estado === 'activo' || p.estado === 'potencial' || p.estado === 'pausado')
      .sort((a, b) => (a.estado === 'activo' ? 0 : 1) - (b.estado === 'activo' ? 0 : 1) || ult(b).localeCompare(ult(a)) || a.nombre.localeCompare(b.nombre));
    const fila = (p, x) => `<button type="button" class="cl-item timer-row" style="${x ? 'padding-left:1.9rem;' : ''}" onclick="App.timerStart('${p.id}'${x ? `,'${x.id}'` : ''})">`
      + (x ? '' : `<span class="cal-ps-dot" style="background:${colorHex(p.color)}"></span>`)
      + `<span class="cl-name">${x ? esc(x.nombre || '—') : esc(p.nombre)}${!x && clienteName(p) ? ` <span style="color:var(--t3)">· ${esc(clienteName(p))}</span>` : ''}</span>`
      + `<span class="timer-go">&#9654;</span></button>`;
    this.om(`<div class="mt">${t('timer.pick')}</div>`
      + (ps.length ? `<div class="cl-list">${ps.map(p => fila(p) + B.subs(p).map(x => fila(p, x)).join('')).join('')}</div>`
        : `<div style="color:var(--t3);font-size:.85rem">${t('timer.none')}</div>`)
      + `<div class="ma"><button class="bt" onclick="App.cm()">${t('btn.cancel')}</button></div>`);
  },

  /** Empieza a contar en un proyecto (y, si se dice, en uno de sus subproyectos). Si ya corría
   *  otro, antes lo para y apunta sus horas. */
  timerStart(pid, subId) {
    if (D._readOnly || !D.p(pid)) return;
    if (this._timerGet()) this.timerStop(true);
    try { localStorage.setItem(this.TIMER_KEY, JSON.stringify({ pid, inicio: Date.now(), ...(subId && { subId }) })); }
    catch (e) { Toast.error(t('msg.saveFailed')); return; }
    if (document.getElementById('mO').classList.contains('on')) this.cm();
    Toast.ok(t('timer.started', D.p(pid).nombre));
    this._timerRefresh();
  },

  /** Para y apunta la entrada de horas (con su fecha y hora de inicio). */
  timerStop(silencio) {
    const tm = this._timerGet(); if (!tm) return;
    try { localStorage.removeItem(this.TIMER_KEY); } catch (e) { /* noop */ }
    const p = D.p(tm.pid), e = B.timerEntry(tm.inicio, Date.now());
    if (!p) Toast.warn(t('timer.gone'));
    else if (!e) Toast.warn(t('timer.tooShort'));
    else {
      const subId = tm.subId && B.subs(p).some(x => x.id === tm.subId) ? tm.subId : null;
      const h = { id: uid(), tipo: 'trabajo', nota: '', monto: 0, ...e, ...(subId && { subId }) };
      p.horas.push(h);
      sortHoras(p.horas);
      D.up(p.id, { horas: p.horas });
      T.ev('action', 'hours_add', 'timer');
      /* Muchas horas seguidas suele ser un olvido: se apunta igual (no se pierde nada) y el aviso
         se queda en pantalla con «Editar» a mano */
      const largo = e.cantidad > 12;
      Toast.show(t(largo ? 'timer.savedLong' : 'timer.saved', fmtH(e.cantidad), p.nombre), largo ? 'warn' : 'ok', largo ? 0 : 8000,
        [{ label: t('btn.edit'), fn: () => this.eHour(p.id, h.id) }]);
    }
    if (!silencio) this._timerRefresh();
  },

  /** Tras empezar o parar: el menú y la vista que enseñe horas o el botón */
  _timerRefresh() {
    this.timerRender();
    if (this.cv === 'det' && this.cp && D.p(this.cp)) this.rDet(this.cp);
    else if (this.cv === 'cal') this.rCal();
    else if (this.cv === 'info') this.rInfo();
  },

  /** Botón «▶ Empezar» / «■ Parar 0:12:05» para la ficha (pid) y para el calendario (sin pid) */
  timerBtn(pid) {
    if (D._readOnly) return '';
    const tm = this._timerGet();
    if (tm && (!pid || tm.pid === pid)) {
      return `<button class="bt bt-s timer-btn run" onclick="App.timerStop()">&#9632; ${t('timer.stop')} <span class="m" data-timer="largo">${this._timerFmt(Date.now() - tm.inicio)}</span></button>`;
    }
    return `<button class="bt bt-s timer-btn" onclick="${pid ? `App.timerStart('${pid}')` : 'App.timerPick()'}">&#9654; ${t('timer.start')}</button>`;
  }
});

if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => App.timerRender());
  /* Empezado o parado en otra pestaña */
  window.addEventListener('storage', e => { if (e.key === App.TIMER_KEY) App._timerRefresh(); });
}
