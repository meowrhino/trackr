/* ================================================
 * TRACKR — App: Tablero de proyectos (adaptador del widget kanban)
 *
 * La lógica del tablero vive en el widget reutilizable journey/journey.js
 * (global `Journey`). Este archivo lo conecta con trackr:
 *
 *  - Las columnas son los ESTADOS del proyecto (EST_ORDER), fijas: no se crean,
 *    renombran ni borran desde el tablero. Plegar sí.
 *  - Las tarjetas se construyen desde los proyectos reales (D.ps()).
 *  - Arrastrar una tarjeta cambia p.estado.
 *  - Tocar una tarjeta abre el detalle del proyecto.
 *
 * (Antes las columnas eran «fases de producción» editables, un eje aparte del
 *  estado; se quitó el 20 oct 2026 porque duplicaba el estado y nadie las usaba.
 *  Los saves viejos conservan `journey` y `journeyStage`, pero ya no se leen.)
 *
 * Extiende App. Dependencias: app.js, store.js, lang.js, utils.js (clienteName,
 * EST, EST_ORDER), toast.js, y journey/journey.js (cargado antes).
 * ================================================ */
Object.assign(App, {

  /** Color W3C de cada columna de estado (el widget solo entiende nombres de la paleta). */
  _J_EST_COLORS: { potencial: 'Goldenrod', activo: 'MediumSeaGreen', pausado: 'SandyBrown', completado: 'SteelBlue', abandonado: 'DimGray' },
  _jCollapsed: {},

  rJourney() {
    const el = document.getElementById('jrnC');
    if (!el || typeof Journey === 'undefined') return;

    const data = this._jData();
    if (this._jb) {
      this._jb.setData(data);
      this._jb.strings = Object.assign({}, Journey.DEFAULT_STRINGS, this._jStrings());
      this._jb.actions = this._jActions();
      this._jb.render();
    } else {
      this._jb = Journey.mount(el, {
        data,
        fixedStages: true,
        onChange: (d) => this._jSync(d),
        onCardClick: (id) => this.go('det', id),
        onCardRemove: (id) => this.jRemoveFromJourney(id),
        onAddCard: (estado) => this.pModal(null, estado),
        onCardMove: (id, estado) => this._jOnMove(id, estado),
        showAddCard: false,
        compact: localStorage.getItem('trackr_journey_compact') === '1',
        onCompactToggle: (v) => { try { localStorage.setItem('trackr_journey_compact', v ? '1' : '0'); } catch (e) { /* noop */ } },
        colors: Object.values(W3C_COLORS).flat(),
        strings: this._jStrings(),
        actions: this._jActions(),
        notify: (msg, level) => {
          if (typeof Toast === 'undefined') return;
          if (level === 'ok') Toast.ok(msg);
          else if (level === 'info') Toast.info(msg);
          else Toast.error(msg);
        }
      });
    }
  },

  /** ¿Se muestra este proyecto en el tablero?
   *  Por defecto solo los externos (no internos). `enJourney` (true/false) lo
   *  fuerza manualmente: incluir un interno o excluir un externo. */
  _jShown(p) {
    return p.enJourney != null ? p.enJourney : !p.interno;
  },

  /** Construye los datos del widget: una columna por estado + una tarjeta por proyecto mostrado. */
  _jData() {
    const stages = EST_ORDER.map(k => ({ id: k, nombre: EST[k] || k, color: this._J_EST_COLORS[k], collapsed: !!this._jCollapsed[k] }));
    const cards = D.ps().filter(p => this._jShown(p)).map(p => ({
      id: p.id,
      nombre: p.nombre,
      nota: clienteName(p),
      meta: this._jCardMeta(p),
      color: p.color || 'CornflowerBlue',
      stageId: EST[p.estado] ? p.estado : 'activo',
      muted: p.estado === 'pausado' || p.estado === 'abandonado',
      strike: p.estado === 'abandonado'
    }));
    return { stages, cards };
  },

  /** Meta de tarjeta: horas (· importe si es de pago). */
  _jCardMeta(p) {
    if (typeof B !== 'undefined' && B.calc) B.calc(p);
    const th = (typeof B !== 'undefined' && B.totalHoras) ? B.totalHoras(p) : 0;
    const f = p.facturacion || {};
    const parts = [th.toFixed(1) + ' h'];
    if (f.modo && f.modo !== 'gratis' && f.totalFactura > 0) parts.push(fmtMoney(f.totalFactura));
    if (p.presupuesto) parts.push(t('bud.btn') + ' ' + p.presupuesto.num + '/' + yearShort(p.presupuesto.fecha));
    return parts.join('  ·  ');
  },

  /** Soltar una tarjeta en otra columna = cambiar el estado del proyecto. */
  _jOnMove(id, estado) {
    const p = D.p(id);
    if (!p || !EST[estado]) return;
    p.estado = estado;   /* el _save del movimiento lo persiste */
    /* Al pasar a potencial sin presupuesto: ofrecer generarlo (nada automático). */
    if (estado === 'potencial' && !p.presupuesto && p.clienteId) {
      this.om(`<div class="mt">${t('journey.noBudgetTitle')}</div>`
        + `<p style="color:var(--t3);font-size:.85rem">${t('journey.noBudgetBody', esc(p.nombre))}</p>`
        + `<div class="ma"><button class="bt" onclick="App.cm()">${t('journey.later')}</button>`
        + `<button class="bt bt-p" onclick="App.cm();App.budModal('${p.clienteId}','${p.id}')">${t('bud.generate')}</button></div>`);
    }
  },

  /** Persiste lo que cambia el widget: el estado ya lo puso _jOnMove; aquí solo
   *  se guarda el plegado de columnas (en memoria) y se re-sincronizan las tarjetas. */
  _jSync(d) {
    (d.stages || []).forEach(s => { this._jCollapsed[s.id] = !!s.collapsed; });
    D.save();
    if (this._jb) this._jb.setData(this._jData());
  },

  /** Mapea las claves i18n de trackr a los textos del widget (solo las que usa en modo fijo) */
  _jStrings() {
    const k = ['subtitle', 'addCard', 'emptyColumn', 'removeCard', 'moveTo', 'compact', 'expand', 'collapse', 'expandCol'];
    const out = {};
    k.forEach(key => { out[key] = t('journey.' + key); });
    out.cancel = t('btn.cancel');
    return out;
  },

  /** Botones extra de la barra: añadir al tablero (si hay ocultos). */
  _jActions() {
    const acts = []; /* «+ Nuevo proyecto» ya está en la cabecera de Proyectos */
    const hidden = D.ps().filter(p => !this._jShown(p)).length;
    if (hidden) acts.push({ label: t('journey.addToJourney') + ' (' + hidden + ')', onClick: () => this.jAddToJourney() });
    return acts;
  },

  /** Selector para incluir manualmente un proyecto que no se muestra. */
  jAddToJourney() {
    const hidden = D.ps().filter(p => !this._jShown(p));
    if (!hidden.length) { Toast.info(t('journey.allShown')); return; }
    this.om(
      `<div class="mt">${t('journey.addToJourney')}</div>`
      + `<div class="fg"><label>${t('journey.pickProject')}</label><select id="jAddSel">`
      +   hidden.map(p => `<option value="${p.id}">${esc(p.nombre)}${p.interno ? ' · ' + t('dash.flagInternal') : ''}</option>`).join('')
      + `</select></div>`
      + `<div class="ma"><button class="bt" onclick="App.cm()">${t('btn.cancel')}</button>`
      +   `<button class="bt bt-p" onclick="App.jConfirmAdd()">${t('btn.add')}</button></div>`
    );
  },

  jConfirmAdd() {
    const id = document.getElementById('jAddSel').value;
    const p = D.p(id);
    if (p) { p.enJourney = true; D.save(); }
    this.cm();
    this.rJourney();
    Toast.ok(t('journey.added'));
  },

  /** Quita un proyecto del tablero (no lo borra; marca enJourney=false). */
  jRemoveFromJourney(id) {
    const p = D.p(id);
    if (p) { p.enJourney = false; D.save(); }
    this.rJourney();
    Toast.ok(t('journey.removed'));
  }

});
