/* ================================================
 * Journey — widget kanban de customer journey (standalone)
 *
 * Reutilizable en cualquier web, sin dependencias. Uso:
 *
 *   const board = Journey.mount(el, {
 *     data: { stages:[{id,nombre,color}], cards:[{id,nombre,nota,color,stageId,muted?,strike?}] },
 *       // muted: tarjeta atenuada · strike: nombre tachado (flags visuales opcionales)
 *     onChange(data) { ...persiste... },   // se llama tras cada cambio
 *     colors: [['SkyBlue','#87CEEB'], ...],// paleta del picker (opcional)
 *     strings: { addStage:'…', … },        // textos (opcional, por defecto ES)
 *     actions:      [{label, onClick}],     // botones extra en la barra
 *     emptyActions: [{label, onClick}],     // botones extra cuando no hay estadios
 *     notify(msg, level) { … }              // feedback (opcional; def. alert)
 *   });
 *   board.setData(d); board.render();        // refresco externo
 *
 * Los datos son tuyos: el widget muta `data` in-place y llama onChange(data).
 * Persiste donde quieras (localStorage, fetch, el store de tu app…).
 * ================================================ */
(function (global) {
  'use strict';

  /* ── Helpers propios (sin depender de utils externos) ── */
  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
  function uid() {
    return 'jxxxx-xxxx-xxxx'.replace(/x/g, function () { return ((Math.random() * 16) | 0).toString(16); });
  }

  /* ── Paleta por defecto (si no se pasan colores) ── */
  var DEFAULT_COLORS = [
    ['SkyBlue', '#87CEEB'], ['CornflowerBlue', '#6495ED'], ['DodgerBlue', '#1E90FF'], ['SteelBlue', '#4682B4'],
    ['MediumSeaGreen', '#3CB371'], ['LightSeaGreen', '#20B2AA'], ['SeaGreen', '#2E8B57'], ['ForestGreen', '#228B22'],
    ['Goldenrod', '#DAA520'], ['SandyBrown', '#F4A460'], ['Orange', '#FFA500'], ['Gold', '#FFD700'],
    ['MediumPurple', '#9370DB'], ['Orchid', '#DA70D6'], ['MediumVioletRed', '#C71585'], ['DeepPink', '#FF1493'],
    ['Crimson', '#DC143C'], ['IndianRed', '#CD5C5C'], ['Tomato', '#FF6347'],
    ['SlateGray', '#708090'], ['Gray', '#808080'], ['DimGray', '#696969']
  ];

  /* ── Textos por defecto (ES) ── */
  var DEFAULT_STRINGS = {
    subtitle: 'Coloca cada tarjeta en su fase. Arrastra entre columnas para moverla, o toca una para editarla.',
    addStage: 'Añadir estadio', addCard: 'Añadir',
    empty: 'Aún no hay estadios. Crea el primero.', emptyColumn: 'Sin tarjetas',
    color: 'Color', stage: 'Estadio',
    newStage: 'Nuevo estadio', editStage: 'Editar estadio',
    stageName: 'Nombre del estadio', stageNamePh: 'Ej. Propuesta enviada', stageNameRequired: 'Ponle un nombre al estadio',
    moveLeft: 'Mover a la izquierda', moveRight: 'Mover a la derecha', minOneStage: 'Debe quedar al menos un estadio',
    deleteStage: 'Eliminar estadio', deleteStageBody: 'Este estadio tiene {0} tarjeta(s). Elige a dónde moverlas (o bórralas).',
    moveCardsTo: 'Mover las tarjetas a', deleteCardsToo: 'Borrar también las tarjetas', needStageFirst: 'Crea primero un estadio',
    newCard: 'Nueva tarjeta', editCard: 'Editar tarjeta',
    cardName: 'Nombre', cardNamePh: 'Cliente o persona', cardNameRequired: 'Ponle un nombre a la tarjeta',
    cardNote: 'Nota (opcional)', cardNotePh: 'Contexto, siguiente paso, recordatorio…',
    deleteCardConfirm: '¿Eliminar esta tarjeta?', removeCard: 'Quitar del tablero',
    moveTo: 'Mover a…', compact: 'Compactar', expand: 'Expandir', collapse: 'Plegar', expandCol: 'Desplegar',
    save: 'Guardar', create: 'Crear', cancel: 'Cancelar', delete: 'Eliminar', edit: 'Editar'
  };

  /* ════════════════════════════════════════════════
   *  JourneyBoard — instancia montada sobre un elemento
   * ════════════════════════════════════════════════ */
  function JourneyBoard(el, opts) {
    opts = opts || {};
    this.el = el;
    this.data = opts.data || { stages: [], cards: [] };
    if (!Array.isArray(this.data.stages)) this.data.stages = [];
    if (!Array.isArray(this.data.cards)) this.data.cards = [];
    this.onChange = typeof opts.onChange === 'function' ? opts.onChange : function () {};
    this.colors = (opts.colors && opts.colors.length) ? opts.colors : DEFAULT_COLORS;
    this.strings = Object.assign({}, DEFAULT_STRINGS, opts.strings || {});
    this.actions = opts.actions || [];
    this.emptyActions = opts.emptyActions || [];
    this.notify = typeof opts.notify === 'function' ? opts.notify : function (m) { try { alert(m); } catch (e) {} };
    /* Hooks opcionales para integrar tarjetas gestionadas por fuera (p.ej. proyectos):
       - onCardClick(id): al tocar una tarjeta (en vez de abrir el modal de edición)
       - showAddCard=false: oculta el botón "+ Añadir" de cada columna */
    this.onCardClick = typeof opts.onCardClick === 'function' ? opts.onCardClick : null;
    /* onCardRemove(id): si se define, cada tarjeta muestra una × (al hover) que
       la llama — para "quitar del tablero" sin borrar el elemento subyacente. */
    this.onCardRemove = typeof opts.onCardRemove === 'function' ? opts.onCardRemove : null;
    /* onAddCard(stageId): si se define, el "+ Añadir" de cada columna lo llama
       (en vez del modal de tarjeta propio) — para crear el elemento donde toque. */
    this.onAddCard = typeof opts.onAddCard === 'function' ? opts.onAddCard : null;
    /* onCardMove(id, toStageId): se llama cuando una tarjeta cambia de fase
       (arrastrando o por el menú "mover a"). */
    this.onCardMove = typeof opts.onCardMove === 'function' ? opts.onCardMove : null;
    this.showAddCard = opts.showAddCard !== false;
    /* Vista compacta (columnas/tarjetas más estrechas). onCompactToggle(bool) para persistir fuera. */
    this.compact = !!opts.compact;
    this.onCompactToggle = typeof opts.onCompactToggle === 'function' ? opts.onCompactToggle : null;
    this._dragId = null;
    this._overCol = null;
    this._overlay = null;
    this._modalColor = null;
    this._bindBoard();
  }

  var P = JourneyBoard.prototype;

  /* ── Util ── */
  P.t = function (key, n) {
    var s = this.strings[key] != null ? this.strings[key] : key;
    return n != null ? String(s).replace('{0}', n) : s;
  };
  P.colorHex = function (name) {
    for (var i = 0; i < this.colors.length; i++) if (this.colors[i][0] === name) return this.colors[i][1];
    if (typeof name === 'string' && /^#[0-9a-fA-F]{3,8}$/.test(name)) return name;
    return '#808080';
  };
  P._save = function () { this.onChange(this.data); };
  P.setData = function (d) {
    this.data = d || { stages: [], cards: [] };
    if (!Array.isArray(this.data.stages)) this.data.stages = [];
    if (!Array.isArray(this.data.cards)) this.data.cards = [];
    return this;
  };
  P.getData = function () { return this.data; };

  /* ── CRUD ── */
  P.stage = function (id) { return this.data.stages.find(function (s) { return s.id === id; }); };
  P.card = function (id) { return this.data.cards.find(function (c) { return c.id === id; }); };
  P.cardsIn = function (id) { return this.data.cards.filter(function (c) { return c.stageId === id; }); };

  P.addCardData = function (c) { this.data.cards.push(c); this._save(); return c; };

  /* ════════════════════════════════════════════════
   *  RENDER
   * ════════════════════════════════════════════════ */
  P.render = function () {
    if (!this.el) return this;
    if (!this.el.classList.contains('jrn-root')) this.el.classList.add('jrn-root');
    this.el.classList.toggle('compact', !!this.compact);
    var stages = this.data.stages;
    var html = '';
    if (this.strings.subtitle) html += '<div class="jrn-sub">' + esc(this.t('subtitle')) + '</div>';

    /* Barra: añadir estadio + acciones extra + toggle compacto */
    html += '<div class="jrn-bar">'
      + '<button class="jrn-bt jrn-bt-p" data-act="add-stage">+ ' + esc(this.t('addStage')) + '</button>'
      + this.actions.map(function (a, i) { return '<button class="jrn-bt" data-act="action" data-idx="' + i + '">' + esc(a.label) + '</button>'; }).join('')
      + (stages.length ? '<button class="jrn-bt" data-act="toggle-compact">' + esc(this.t(this.compact ? 'expand' : 'compact')) + '</button>' : '')
      + '</div>';

    if (!stages.length) {
      html += '<div class="jrn-es"><div class="jrn-es-ic">◫</div><div class="jrn-es-tx">' + esc(this.t('empty')) + '</div>';
      if (this.emptyActions.length) {
        html += '<div style="margin-top:1rem;display:flex;gap:.5rem;justify-content:center;flex-wrap:wrap">'
          + this.emptyActions.map(function (a, i) { return '<button class="jrn-bt" data-act="empty-action" data-idx="' + i + '">' + esc(a.label) + '</button>'; }).join('')
          + '</div>';
      }
      html += '</div>';
      this.el.innerHTML = html;
      return this;
    }

    var self = this;
    var cols = stages.map(function (s, i) { return self._column(s, i, stages.length); }).join('');
    var ghost = '<div class="jrn-col-ghost" role="button" tabindex="0" data-act="add-stage">+ ' + esc(this.t('addStage')) + '</div>';
    html += '<div class="jrn-board">' + cols + ghost + '</div>';
    this.el.innerHTML = html;
    return this;
  };

  P._column = function (stage, idx, total) {
    var hex = this.colorHex(stage.color);
    var cards = this.cardsIn(stage.id);
    var self = this;
    if (stage.collapsed) {
      return '<div class="jrn-col collapsed" style="--stage-color:' + hex + '" data-stage-drop="' + esc(stage.id) + '">'
        + '<button class="jrn-col-collapsed" data-act="toggle-collapse" data-id="' + esc(stage.id) + '" title="' + esc(this.t('expandCol')) + '">'
        +   '<span class="jrn-dot"></span>'
        +   '<span class="jrn-col-count">' + cards.length + '</span>'
        +   '<span class="jrn-col-vname">' + esc(stage.nombre) + '</span>'
        + '</button>'
        + '</div>';
    }
    return '<div class="jrn-col" style="--stage-color:' + hex + '" data-stage-drop="' + esc(stage.id) + '">'
      + '<div class="jrn-col-hd">'
      +   '<span class="jrn-dot"></span>'
      +   '<span class="jrn-col-name" title="' + esc(stage.nombre) + '">' + esc(stage.nombre) + '</span>'
      +   '<span class="jrn-col-count">' + cards.length + '</span>'
      +   '<span class="jrn-col-actions">'
      +     '<button class="jrn-ica" title="' + esc(this.t('collapse')) + '" data-act="toggle-collapse" data-id="' + esc(stage.id) + '">–</button>'
      +     '<button class="jrn-ica" title="' + esc(this.t('moveLeft')) + '" data-act="move-stage" data-id="' + esc(stage.id) + '" data-dir="-1"' + (idx === 0 ? ' disabled' : '') + '>◂</button>'
      +     '<button class="jrn-ica" title="' + esc(this.t('moveRight')) + '" data-act="move-stage" data-id="' + esc(stage.id) + '" data-dir="1"' + (idx === total - 1 ? ' disabled' : '') + '>▸</button>'
      +     '<button class="jrn-ica" title="' + esc(this.t('edit')) + '" data-act="edit-stage" data-id="' + esc(stage.id) + '">✎</button>'
      +     '<button class="jrn-ica jrn-ica-d" title="' + esc(this.t('delete')) + '" data-act="del-stage" data-id="' + esc(stage.id) + '">✕</button>'
      +   '</span>'
      + '</div>'
      + '<div class="jrn-col-body">'
      +   (cards.length ? cards.map(function (c) { return self._card(c); }).join('') : '<div class="jrn-col-empty">' + esc(this.t('emptyColumn')) + '</div>')
      + '</div>'
      + ((this.showAddCard || this.onAddCard) ? '<button class="jrn-add" data-act="add-card" data-stage="' + esc(stage.id) + '">+ ' + esc(this.t('addCard')) + '</button>' : '')
      + '</div>';
  };

  P._card = function (c) {
    var hex = this.colorHex(c.color);
    var acts = '<span class="jrn-card-acts">'
      + '<button class="jrn-card-x" data-act="move-card" data-id="' + esc(c.id) + '" title="' + esc(this.t('moveTo')) + '">⇄</button>'
      + (this.onCardRemove ? '<button class="jrn-card-x" data-act="remove-card" data-id="' + esc(c.id) + '" title="' + esc(this.t('removeCard')) + '">×</button>' : '')
      + '</span>';
    // Flags de presentación genéricos (opcionales): muted = atenuada, strike = nombre tachado.
    var cls = 'jrn-card' + (c.muted ? ' jrn-card-muted' : '') + (c.strike ? ' jrn-card-strike' : '');
    return '<div class="' + cls + '" style="--card-color:' + hex + '" draggable="true" data-card-id="' + esc(c.id) + '" data-act="edit-card" data-id="' + esc(c.id) + '">'
      + acts
      + '<div class="jrn-card-n">' + esc(c.nombre) + '</div>'
      + (c.nota ? '<div class="jrn-card-note">' + esc(c.nota) + '</div>' : '')
      + (c.meta ? '<div class="jrn-card-meta">' + esc(c.meta) + '</div>' : '')
      + '</div>';
  };

  /* ════════════════════════════════════════════════
   *  EVENTOS (delegación sobre el contenedor)
   * ════════════════════════════════════════════════ */
  P._bindBoard = function () {
    var self = this;
    this.el.addEventListener('click', function (e) {
      var t = e.target.closest('[data-act]');
      if (!t || !self.el.contains(t)) return;
      var act = t.getAttribute('data-act');
      if (act === 'add-stage') self.stageModal();
      else if (act === 'edit-stage') self.stageModal(t.getAttribute('data-id'));
      else if (act === 'del-stage') self.deleteStage(t.getAttribute('data-id'));
      else if (act === 'move-stage') self.moveStage(t.getAttribute('data-id'), parseInt(t.getAttribute('data-dir'), 10));
      else if (act === 'toggle-collapse') { var stc = self.stage(t.getAttribute('data-id')); if (stc) { stc.collapsed = !stc.collapsed; self._save(); self.render(); } }
      else if (act === 'toggle-compact') { self.compact = !self.compact; if (self.onCompactToggle) self.onCompactToggle(self.compact); self.render(); }
      else if (act === 'move-card') self.cardMoveMenu(t.getAttribute('data-id'));
      else if (act === 'add-card') { var asid = t.getAttribute('data-stage'); if (self.onAddCard) self.onAddCard(asid); else self.cardModal(null, asid); }
      else if (act === 'remove-card') { if (self.onCardRemove) self.onCardRemove(t.getAttribute('data-id')); }
      else if (act === 'edit-card') { if (self.onCardClick) self.onCardClick(t.getAttribute('data-id')); else self.cardModal(t.getAttribute('data-id')); }
      else if (act === 'action') { var a = self.actions[+t.getAttribute('data-idx')]; if (a && a.onClick) a.onClick(); }
      else if (act === 'empty-action') { var ea = self.emptyActions[+t.getAttribute('data-idx')]; if (ea && ea.onClick) ea.onClick(); }
    });

    /* Drag & drop de tarjetas entre columnas */
    this.el.addEventListener('dragstart', function (e) {
      var card = e.target.closest('[data-card-id]');
      if (!card) return;
      self._dragId = card.getAttribute('data-card-id');
      if (e.dataTransfer) { e.dataTransfer.setData('text/plain', self._dragId); e.dataTransfer.effectAllowed = 'move'; }
      card.classList.add('dragging');
    });
    this.el.addEventListener('dragend', function (e) {
      var card = e.target.closest('[data-card-id]');
      if (card) card.classList.remove('dragging');
      self._clearOver();
      self._dragId = null;
    });
    this.el.addEventListener('dragover', function (e) {
      var col = e.target.closest('[data-stage-drop]');
      if (!col) return;
      e.preventDefault();
      if (e.dataTransfer) e.dataTransfer.dropEffect = 'move';
      if (col !== self._overCol) { self._clearOver(); self._overCol = col; col.classList.add('drag-over'); }
    });
    this.el.addEventListener('drop', function (e) {
      var col = e.target.closest('[data-stage-drop]');
      if (!col) return;
      e.preventDefault();
      var id = (e.dataTransfer && e.dataTransfer.getData('text/plain')) || self._dragId;
      self._clearOver();
      self._dragId = null;
      if (!id) return;
      var c = self.card(id), stageId = col.getAttribute('data-stage-drop');
      if (c && c.stageId !== stageId) { c.stageId = stageId; if (self.onCardMove) self.onCardMove(id, stageId); self._save(); self.render(); }
    });
  };
  P._clearOver = function () { if (this._overCol) { this._overCol.classList.remove('drag-over'); this._overCol = null; } };

  /* ── Mover tarjeta a otra fase sin arrastrar (menú) ── */
  P.moveCardTo = function (id, stageId) {
    var c = this.card(id);
    if (c && c.stageId !== stageId) { c.stageId = stageId; if (this.onCardMove) this.onCardMove(id, stageId); this._save(); }
    this.closeModal();
    this.render();
  };
  P.cardMoveMenu = function (id) {
    var c = this.card(id); if (!c) return;
    var self = this;
    var btns = this.data.stages.map(function (s) {
      var on = s.id === c.stageId;
      return '<button class="jrn-movebtn' + (on ? ' on' : '') + '" style="--stage-color:' + self.colorHex(s.color) + '" data-act="pick-stage" data-id="' + esc(id) + '" data-stage="' + esc(s.id) + '">'
        + '<span class="jrn-dot"></span><span class="jrn-movebtn-nm">' + esc(s.nombre) + '</span>' + (on ? '<span class="jrn-movebtn-on">✓</span>' : '')
        + '</button>';
    }).join('');
    this._openModal('<div class="jrn-mt">' + esc(this.t('moveTo')) + '</div>'
      + '<div class="jrn-p" style="margin-bottom:.6rem">' + esc(c.nombre) + '</div>'
      + '<div class="jrn-movelist">' + btns + '</div>'
      + '<div class="jrn-ma"><button class="jrn-bt" data-act="close">' + esc(this.t('cancel')) + '</button></div>');
  };

  /* ════════════════════════════════════════════════
   *  MODAL propio
   * ════════════════════════════════════════════════ */
  P._ensureOverlay = function () {
    if (this._overlay) return this._overlay;
    var self = this;
    var bg = document.createElement('div');
    bg.className = 'jrn-modal-bg';
    bg.innerHTML = '<div class="jrn-modal"></div>';
    document.body.appendChild(bg);
    var mdDown = null;
    bg.addEventListener('mousedown', function (e) { mdDown = e.target; });
    bg.addEventListener('mouseup', function (e) { if (e.target === bg && mdDown === bg) self.closeModal(); mdDown = null; });
    bg.addEventListener('click', function (e) {
      var t = e.target.closest('[data-act]');
      if (!t) return;
      var act = t.getAttribute('data-act');
      if (act === 'close') self.closeModal();
      else if (act === 'save-stage') self._saveStage();
      else if (act === 'del-stage-modal') self.deleteStage(t.getAttribute('data-id'));
      else if (act === 'confirm-del-stage') self._confirmDeleteStage(t.getAttribute('data-id'));
      else if (act === 'save-card') self._saveCard();
      else if (act === 'del-card') self._deleteCard(t.getAttribute('data-id'));
      else if (act === 'pick-stage') self.moveCardTo(t.getAttribute('data-id'), t.getAttribute('data-stage'));
      else if (act === 'pick-color') self._pickColor(t);
    });
    document.addEventListener('keydown', function (e) {
      if (!bg.classList.contains('on')) return;
      if (e.key === 'Escape') self.closeModal();
      else if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA') {
        var primary = bg.querySelector('.jrn-bt-p'); if (primary) { e.preventDefault(); primary.click(); }
      }
    });
    this._overlay = bg;
    return bg;
  };
  P._openModal = function (html) {
    var bg = this._ensureOverlay();
    bg.querySelector('.jrn-modal').innerHTML = html;
    bg.classList.add('on');
  };
  P.closeModal = function () { if (this._overlay) this._overlay.classList.remove('on'); this._editStage = null; this._editCard = null; this._modalColor = null; };

  /* Color picker (dentro del modal) */
  P._colorPicker = function (current) {
    this._modalColor = current;
    var hex = this.colorHex(current);
    var sw = this.colors.map(function (c) {
      return '<div class="jrn-cs-sw' + (c[0] === current ? ' on' : '') + '" style="background:' + esc(c[1]) + '" title="' + esc(c[0]) + '" data-act="pick-color" data-name="' + esc(c[0]) + '" data-hex="' + esc(c[1]) + '"></div>';
    }).join('');
    return '<div class="jrn-cs">'
      + '<div class="jrn-cs-hd"><div class="jrn-cs-dot" data-cs-dot style="background:' + hex + '"></div><span class="jrn-cs-lbl" data-cs-lbl>' + esc(current) + '</span></div>'
      + '<div class="jrn-cs-grid">' + sw + '</div></div>';
  };
  P._pickColor = function (el) {
    this._modalColor = el.getAttribute('data-name');
    var grid = el.parentNode;
    grid.querySelectorAll('.jrn-cs-sw.on').forEach(function (s) { s.classList.remove('on'); });
    el.classList.add('on');
    var wrap = this._overlay.querySelector('.jrn-cs');
    wrap.querySelector('[data-cs-dot]').style.background = el.getAttribute('data-hex');
    wrap.querySelector('[data-cs-lbl]').textContent = el.getAttribute('data-name');
  };

  /* ── Modal estadio ── */
  P.stageModal = function (eid) {
    this._editStage = eid || null;
    var s = eid ? this.stage(eid) : null;
    var name = s ? s.nombre : '';
    var color = s ? s.color : (this.colors[0] ? this.colors[0][0] : 'Gray');
    this._openModal(
      '<div class="jrn-mt">' + esc(this.t(eid ? 'editStage' : 'newStage')) + '</div>'
      + '<div class="jrn-fg"><label class="jrn-label">' + esc(this.t('stageName')) + '</label>'
      +   '<input class="jrn-input" id="jrnStageName" value="' + esc(name) + '" placeholder="' + esc(this.t('stageNamePh')) + '"></div>'
      + '<div class="jrn-fg"><label class="jrn-label">' + esc(this.t('color')) + '</label>' + this._colorPicker(color) + '</div>'
      + '<div class="jrn-ma">'
      +   (eid ? '<button class="jrn-bt jrn-bt-d" data-act="del-stage-modal" data-id="' + esc(eid) + '">' + esc(this.t('delete')) + '</button>' : '')
      +   '<button class="jrn-bt" data-act="close">' + esc(this.t('cancel')) + '</button>'
      +   '<button class="jrn-bt jrn-bt-p" data-act="save-stage">' + esc(this.t(eid ? 'save' : 'create')) + '</button>'
      + '</div>'
    );
    var inp = this._overlay.querySelector('#jrnStageName');
    if (inp) setTimeout(function () { inp.focus(); }, 30);
  };
  P._saveStage = function () {
    var name = (this._overlay.querySelector('#jrnStageName').value || '').trim();
    if (!name) { this.notify(this.t('stageNameRequired'), 'error'); return; }
    var color = this._modalColor;
    if (this._editStage) { var s = this.stage(this._editStage); if (s) { s.nombre = name; s.color = color; } }
    else this.data.stages.push({ id: uid(), nombre: name, color: color });
    this._editStage = null;
    this._save();
    this.closeModal();
    this.render();
  };
  P.moveStage = function (id, dir) {
    var a = this.data.stages;
    var i = a.findIndex(function (s) { return s.id === id; }), j = i + dir;
    if (i === -1 || j < 0 || j >= a.length) return;
    var tmp = a[i]; a[i] = a[j]; a[j] = tmp;
    this._save();
    this.render();
  };
  P.deleteStage = function (id) {
    if (this.data.stages.length <= 1) { this.notify(this.t('minOneStage'), 'error'); return; }
    var cards = this.cardsIn(id);
    if (!cards.length) { this._removeStage(id, null); this.closeModal(); this.render(); return; }
    /* Tiene tarjetas → diálogo de reasignación */
    var others = this.data.stages.filter(function (s) { return s.id !== id; });
    this._openModal(
      '<div class="jrn-mt">' + esc(this.t('deleteStage')) + '</div>'
      + '<p class="jrn-p">' + esc(this.t('deleteStageBody', cards.length)) + '</p>'
      + '<div class="jrn-fg"><label class="jrn-label">' + esc(this.t('moveCardsTo')) + '</label><select class="jrn-select" id="jrnReassign">'
      +   others.map(function (s) { return '<option value="' + esc(s.id) + '">' + esc(s.nombre) + '</option>'; }).join('')
      +   '<option value="__del">' + esc(this.t('deleteCardsToo')) + '</option>'
      + '</select></div>'
      + '<div class="jrn-ma"><button class="jrn-bt" data-act="close">' + esc(this.t('cancel')) + '</button>'
      +   '<button class="jrn-bt jrn-bt-d" data-act="confirm-del-stage" data-id="' + esc(id) + '">' + esc(this.t('delete')) + '</button></div>'
    );
  };
  P._confirmDeleteStage = function (id) {
    var val = this._overlay.querySelector('#jrnReassign').value;
    this._removeStage(id, val === '__del' ? null : val);
    this.closeModal();
    this.render();
  };
  P._removeStage = function (id, toStageId) {
    if (toStageId) this.data.cards.forEach(function (c) { if (c.stageId === id) c.stageId = toStageId; });
    else this.data.cards = this.data.cards.filter(function (c) { return c.stageId !== id; });
    this.data.stages = this.data.stages.filter(function (s) { return s.id !== id; });
    this._save();
  };

  /* ── Modal tarjeta ── */
  P.cardModal = function (eid, stageId) {
    if (!this.data.stages.length) { this.notify(this.t('needStageFirst'), 'error'); return; }
    this._editCard = eid || null;
    var c = eid ? this.card(eid) : null;
    var name = c ? c.nombre : '', nota = c ? c.nota : '';
    var color = c ? c.color : (this.colors[0] ? this.colors[0][0] : 'Gray');
    var curStage = (c && c.stageId) || stageId || this.data.stages[0].id;
    this._openModal(
      '<div class="jrn-mt">' + esc(this.t(eid ? 'editCard' : 'newCard')) + '</div>'
      + '<div class="jrn-fg"><label class="jrn-label">' + esc(this.t('cardName')) + '</label>'
      +   '<input class="jrn-input" id="jrnCardName" value="' + esc(name) + '" placeholder="' + esc(this.t('cardNamePh')) + '"></div>'
      + '<div class="jrn-fg"><label class="jrn-label">' + esc(this.t('stage')) + '</label><select class="jrn-select" id="jrnCardStage">'
      +   this.data.stages.map(function (s) { return '<option value="' + esc(s.id) + '"' + (s.id === curStage ? ' selected' : '') + '>' + esc(s.nombre) + '</option>'; }).join('')
      + '</select></div>'
      + '<div class="jrn-fg"><label class="jrn-label">' + esc(this.t('cardNote')) + '</label>'
      +   '<textarea class="jrn-textarea" id="jrnCardNote" placeholder="' + esc(this.t('cardNotePh')) + '">' + esc(nota) + '</textarea></div>'
      + '<div class="jrn-fg"><label class="jrn-label">' + esc(this.t('color')) + '</label>' + this._colorPicker(color) + '</div>'
      + '<div class="jrn-ma">'
      +   (eid ? '<button class="jrn-bt jrn-bt-d" data-act="del-card" data-id="' + esc(eid) + '">' + esc(this.t('delete')) + '</button>' : '')
      +   '<button class="jrn-bt" data-act="close">' + esc(this.t('cancel')) + '</button>'
      +   '<button class="jrn-bt jrn-bt-p" data-act="save-card">' + esc(this.t(eid ? 'save' : 'create')) + '</button>'
      + '</div>'
    );
    var inp = this._overlay.querySelector('#jrnCardName');
    if (inp) setTimeout(function () { inp.focus(); }, 30);
  };
  P._saveCard = function () {
    var name = (this._overlay.querySelector('#jrnCardName').value || '').trim();
    if (!name) { this.notify(this.t('cardNameRequired'), 'error'); return; }
    var stageId = this._overlay.querySelector('#jrnCardStage').value;
    var nota = (this._overlay.querySelector('#jrnCardNote').value || '').trim();
    var color = this._modalColor;
    if (this._editCard) { var c = this.card(this._editCard); if (c) { c.nombre = name; c.nota = nota; c.color = color; c.stageId = stageId; } }
    else this.data.cards.push({ id: uid(), nombre: name, nota: nota, color: color, stageId: stageId });
    this._editCard = null;
    this._save();
    this.closeModal();
    this.render();
  };
  P._deleteCard = function (id) {
    if (!global.confirm(this.t('deleteCardConfirm'))) return;
    this.data.cards = this.data.cards.filter(function (c) { return c.id !== id; });
    this._editCard = null;
    this._save();
    this.closeModal();
    this.render();
  };

  /* ── API pública ── */
  global.Journey = {
    mount: function (el, opts) { var b = new JourneyBoard(el, opts); b.render(); return b; },
    Board: JourneyBoard,
    DEFAULT_COLORS: DEFAULT_COLORS,
    DEFAULT_STRINGS: DEFAULT_STRINGS
  };

})(typeof window !== 'undefined' ? window : this);
