/* ================================================
 * TRACKR — App: Customer Journey (adaptador del widget)
 *
 * La lógica del tablero vive en el widget reutilizable journey/journey.js
 * (global `Journey`). Este archivo solo lo conecta con trackr:
 *  - le pasa los datos (D.d.journey) y el guardado (D.save)
 *  - traduce sus textos con t() y le da la paleta W3C
 *  - añade acciones propias de trackr (traer clientes, restaurar por defecto)
 *
 * Extiende el objeto global App. Dependencias: app.js, store.js, lang.js,
 * colors.js (W3C_COLORS), toast.js, y journey/journey.js (cargado antes).
 * ================================================ */
Object.assign(App, {

  rJourney() {
    const el = document.getElementById('jrnC');
    if (!el || typeof Journey === 'undefined') return;
    if (this._jb) {
      this._jb.setData(D.d.journey);
      this._jb.strings = Object.assign({}, Journey.DEFAULT_STRINGS, this._jStrings());
      this._jb.actions = this._jActions();
      this._jb.emptyActions = this._jEmptyActions();
      this._jb.render();
    } else {
      this._jb = Journey.mount(el, {
        data: D.d.journey,
        onChange: (d) => { D.d.journey = d; D.save(); },
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

  /** Botones extra de la barra (visibles siempre) */
  _jActions() {
    const n = D.cls().length;
    return n ? [{ label: t('journey.importClients', n), onClick: () => this.jImportClients() }] : [];
  },

  /** Botones extra del estado vacío */
  _jEmptyActions() {
    return [{ label: t('journey.restoreDefaults'), onClick: () => this.jRestoreDefaults() }];
  },

  /** Crea una tarjeta por cada cliente de trackr (snapshot, no enlazado). */
  jImportClients() {
    const stages = D.jStages();
    if (!stages.length) { Toast.error(t('journey.needStageFirst')); return; }
    const firstStage = stages[0].id;
    const existing = new Set(D.jCards().map(c => c.nombre.trim().toLowerCase()));
    let added = 0;
    D.cls().forEach(cl => {
      const key = cl.nombre.trim().toLowerCase();
      if (existing.has(key)) return;
      existing.add(key);
      D.addJCard({ id: uid(), nombre: cl.nombre, nota: '', color: cl.color || 'CornflowerBlue', stageId: firstStage });
      added++;
    });
    this._jb.setData(D.d.journey).render();
    added ? Toast.ok(t('journey.importedClients', added)) : Toast.info(t('journey.importedNone'));
  },

  /** Restaura el journey por defecto (reemplaza estadios y tarjetas). */
  jRestoreDefaults() {
    if (D.jCards().length && !confirm(t('journey.restoreConfirm'))) return;
    D.d.journey = D._seedJourney();
    D.save();
    this._jb.setData(D.d.journey).render();
    Toast.ok(t('journey.restored'));
  }

});
