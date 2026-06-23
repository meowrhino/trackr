/* ================================================
 * TRACKR — App: Customer Journey (adaptador del widget)
 *
 * La lógica del tablero vive en el widget reutilizable journey/journey.js
 * (global `Journey`). Este archivo lo conecta con trackr en MODO PROYECTO:
 *
 *  - Las tarjetas se construyen desde los proyectos reales (D.ps()).
 *  - La columna donde está cada tarjeta = p.journeyStage (fase de producción),
 *    un eje aparte del `estado` (Activo/Completado…), que no se toca aquí.
 *  - Arrastrar una tarjeta sincroniza p.journeyStage.
 *  - Tocar una tarjeta abre el detalle del proyecto.
 *  - Los estadios (columnas) siguen siendo editables y viven en D.d.journey.stages.
 *
 * El widget sigue siendo genérico/reutilizable; el cruce con proyectos se hace
 * aquí vía hooks (onCardClick, onChange, showAddCard:false).
 *
 * Extiende App. Dependencias: app.js, store.js, lang.js, colors.js (W3C_COLORS),
 * utils.js (clienteName, EST), toast.js, y journey/journey.js (cargado antes).
 * ================================================ */
Object.assign(App, {

  rJourney() {
    const el = document.getElementById('jrnC');
    if (!el || typeof Journey === 'undefined') return;

    const data = this._jData();
    if (this._jb) {
      this._jb.setData(data);
      this._jb.strings = Object.assign({}, Journey.DEFAULT_STRINGS, this._jStrings());
      this._jb.actions = this._jActions();
      this._jb.emptyActions = this._jEmptyActions();
      this._jb.render();
    } else {
      this._jb = Journey.mount(el, {
        data,
        onChange: (d) => this._jSync(d),
        onCardClick: (id) => this.go('det', id),
        onCardRemove: (id) => this.jRemoveFromJourney(id),
        onAddCard: (stageId) => this.pModal(null, stageId),
        onCardMove: (id, toStageId) => this._jAutoEstado(id, toStageId),
        showAddCard: false,
        compact: localStorage.getItem('trackr_journey_compact') === '1',
        onCompactToggle: (v) => { try { localStorage.setItem('trackr_journey_compact', v ? '1' : '0'); } catch (e) { /* noop */ } },
        colors: Object.values(W3C_COLORS).flat(),
        strings: this._jStrings(),
        actions: this._jActions(),
        emptyActions: this._jEmptyActions(),
        notify: (msg, level) => {
          if (typeof Toast === 'undefined') return;
          if (level === 'ok') Toast.ok(msg);
          else if (level === 'info') Toast.info(msg);
          else Toast.error(msg);
        }
      });
    }
  },

  /** ¿Se muestra este proyecto en el journey?
   *  Por defecto solo los externos (no internos). `enJourney` (true/false) lo
   *  fuerza manualmente: incluir un interno o excluir un externo. */
  _jShown(p) {
    return p.enJourney != null ? p.enJourney : !p.interno;
  },

  /** Construye los datos del widget: estadios + una tarjeta por proyecto mostrado. */
  _jData() {
    const stages = D.jStages();
    const first = stages.length ? stages[0].id : null;
    const valid = new Set(stages.map(s => s.id));
    const cards = D.ps().filter(p => this._jShown(p)).map(p => ({
      id: p.id,
      nombre: p.nombre,
      nota: this._jCardNota(p),
      meta: this._jCardMeta(p),
      color: p.color || 'CornflowerBlue',
      stageId: (p.journeyStage && valid.has(p.journeyStage)) ? p.journeyStage : first,
      // Estado del proyecto reflejado en la tarjeta (sin moverla de fase):
      // pausado → atenuada · abandonado → atenuada + tachada.
      muted: p.estado === 'pausado' || p.estado === 'abandonado',
      strike: p.estado === 'abandonado'
    }));
    return { stages, cards };
  },

  /** Subtítulo de tarjeta: cliente · estado (los dos ejes de un vistazo). */
  _jCardNota(p) {
    const cn = clienteName(p);
    const est = (typeof EST !== 'undefined' && EST[p.estado]) ? EST[p.estado] : (p.estado || '');
    return cn ? (cn + (est ? ' · ' + est : '')) : est;
  },

  /** Meta de tarjeta: horas (· importe si es de pago). */
  _jCardMeta(p) {
    if (typeof B !== 'undefined' && B.calc) B.calc(p);
    const th = (typeof B !== 'undefined' && B.totalHoras) ? B.totalHoras(p) : 0;
    const f = p.facturacion || {};
    const parts = [th.toFixed(1) + ' h'];
    if (f.modo && f.modo !== 'gratis' && f.totalFactura > 0) parts.push(fmtMoney(f.totalFactura));
    return parts.join('  ·  ');
  },

  /** Auto-estado: al mover un proyecto a la última fase, marcarlo Completado. */
  _jAutoEstado(id, toStageId) {
    const stages = D.jStages();
    const last = stages.length ? stages[stages.length - 1].id : null;
    if (!last || toStageId !== last) return;
    const p = D.p(id);
    if (p && p.estado !== 'completado') {
      p.estado = 'completado';   /* el _save del movimiento lo persiste */
      if (typeof Toast !== 'undefined') Toast.ok(t('journey.autoCompleted', p.nombre));
    }
  },

  /** Persiste lo que cambia el widget: definiciones de columna + fase de cada proyecto. */
  _jSync(d) {
    D.d.journey.stages = d.stages;
    (d.cards || []).forEach(c => {
      const p = D.p(c.id);
      if (p && p.journeyStage !== c.stageId) p.journeyStage = c.stageId;
    });
    /* Reconciliar proyectos huérfanos (su fase fue borrada) → primera fase,
       para que ninguno desaparezca del tablero (los proyectos nunca se borran aquí). */
    const stages = D.jStages();
    if (stages.length) {
      const valid = new Set(stages.map(s => s.id));
      const first = stages[0].id;
      D.ps().forEach(p => { if (!p.journeyStage || !valid.has(p.journeyStage)) p.journeyStage = first; });
    }
    D.save();
    /* Re-sincroniza las tarjetas del widget desde la fuente real (D.ps()), para que
       el render que el widget hace tras onChange refleje reasignaciones (p.ej. al borrar
       un estadio con proyectos) y ninguna tarjeta desaparezca del tablero. */
    if (this._jb) this._jb.setData(this._jData());
  },

  /** Mapea las claves i18n de trackr a los textos del widget */
  _jStrings() {
    const k = [
      'subtitle', 'addStage', 'addCard', 'empty', 'emptyColumn', 'color', 'stage',
      'newStage', 'editStage', 'stageName', 'stageNamePh', 'stageNameRequired',
      'moveLeft', 'moveRight', 'minOneStage', 'deleteStage', 'deleteStageBody',
      'moveCardsTo', 'deleteCardsToo', 'needStageFirst', 'newCard', 'editCard',
      'cardName', 'cardNamePh', 'cardNameRequired', 'cardNote', 'cardNotePh', 'deleteCardConfirm', 'removeCard',
      'moveTo', 'compact', 'expand', 'collapse', 'expandCol'
    ];
    const out = {};
    k.forEach(key => { out[key] = t('journey.' + key); });
    out.save = t('btn.save'); out.create = t('btn.create');
    out.cancel = t('btn.cancel'); out.delete = t('btn.delete'); out.edit = t('btn.edit');
    return out;
  },

  /** Botones extra de la barra: crear proyecto + añadir al journey (si hay ocultos). */
  _jActions() {
    const acts = [{ label: t('btn.newProject'), onClick: () => this.pModal() }];
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
    if (p) {
      p.enJourney = true;
      if (!p.journeyStage || !D.jStage(p.journeyStage)) p.journeyStage = D.jStages()[0] ? D.jStages()[0].id : null;
      D.save();
    }
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
  },

  /** Botón del estado vacío: restaurar los estadios por defecto. */
  _jEmptyActions() {
    return [{ label: t('journey.restoreDefaults'), onClick: () => this.jRestoreDefaults() }];
  },

  /** Restaura los estadios (columnas) por defecto y recoloca proyectos huérfanos. */
  jRestoreDefaults() {
    D.d.journey.stages = D._seedJourney().stages;
    const stages = D.jStages();
    const valid = new Set(stages.map(s => s.id));
    const first = stages.length ? stages[0].id : null;
    const last = stages.length ? stages[stages.length - 1].id : null;
    D.ps().forEach(p => {
      if (first && (!p.journeyStage || !valid.has(p.journeyStage))) {
        p.journeyStage = (p.estado === 'completado') ? last : first;
      }
    });
    D.save();
    this.rJourney();
    Toast.ok(t('journey.restored'));
  }

});
