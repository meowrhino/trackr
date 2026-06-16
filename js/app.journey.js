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
        showAddCard: false,
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

  /** Construye los datos del widget: estadios + una tarjeta por proyecto. */
  _jData() {
    const stages = D.jStages();
    const first = stages.length ? stages[0].id : null;
    const valid = new Set(stages.map(s => s.id));
    const cards = D.ps().map(p => ({
      id: p.id,
      nombre: p.nombre,
      nota: this._jCardNota(p),
      color: p.color || 'CornflowerBlue',
      stageId: (p.journeyStage && valid.has(p.journeyStage)) ? p.journeyStage : first
    }));
    return { stages, cards };
  },

  /** Subtítulo de tarjeta: cliente · estado (los dos ejes de un vistazo). */
  _jCardNota(p) {
    const cn = clienteName(p);
    const est = (typeof EST !== 'undefined' && EST[p.estado]) ? EST[p.estado] : (p.estado || '');
    return cn ? (cn + (est ? ' · ' + est : '')) : est;
  },

  /** Persiste lo que cambia el widget: definiciones de columna + fase de cada proyecto. */
  _jSync(d) {
    D.d.journey.stages = d.stages;
    (d.cards || []).forEach(c => {
      const p = D.p(c.id);
      if (p && p.journeyStage !== c.stageId) p.journeyStage = c.stageId;
    });
    D.save();
  },

  /** Mapea las claves i18n de trackr a los textos del widget */
  _jStrings() {
    const k = [
      'subtitle', 'addStage', 'addCard', 'empty', 'emptyColumn', 'color', 'stage',
      'newStage', 'editStage', 'stageName', 'stageNamePh', 'stageNameRequired',
      'moveLeft', 'moveRight', 'minOneStage', 'deleteStage', 'deleteStageBody',
      'moveCardsTo', 'deleteCardsToo', 'needStageFirst', 'newCard', 'editCard',
      'cardName', 'cardNamePh', 'cardNameRequired', 'cardNote', 'cardNotePh', 'deleteCardConfirm'
    ];
    const out = {};
    k.forEach(key => { out[key] = t('journey.' + key); });
    out.save = t('btn.save'); out.create = t('btn.create');
    out.cancel = t('btn.cancel'); out.delete = t('btn.delete'); out.edit = t('btn.edit');
    return out;
  },

  /** Botón extra de la barra: crear proyecto (aparece en "Primer contacto"). */
  _jActions() {
    return [{ label: t('btn.newProject'), onClick: () => this.pModal() }];
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
