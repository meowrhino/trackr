/* ================================================
 * TRACKR — Store (capa de datos)
 * Persistencia en localStorage, CRUD de proyectos,
 * clientes y gastos. Migración ligera de formato.
 * Globales: D
 * Dependencias: uid() de utils.js
 * ================================================ */

const D = {
  d: null,
  lastSaved: null,   /* timestamp (ms) del último guardado; persiste en trackr_saved_at */

  /* ── Inicialización ── */

  /** Carga datos de localStorage. Devuelve true si había datos. */
  init() {
    this.lastSaved = parseInt(localStorage.getItem('trackr_saved_at'), 10) || null;
    const raw = localStorage.getItem('trackr_data');
    if (raw) {
      try {
        this.d = JSON.parse(raw);
        this.ensure();
        return true;
      } catch { /* JSON corrupto, se ignora */ }
    }
    return false;
  },

  /**
   * Customer journey por defecto (tablero kanban).
   * Plantilla genérica reutilizable: estadios editables + tarjetas libres
   * (no atadas a las entidades `clientes`). Se siembra una sola vez.
   */
  _seedJourney() {
    return {
      stages: [
        { id: 'jst-contacto',    nombre: 'Primer contacto',      color: 'SkyBlue' },
        { id: 'jst-presupuesto', nombre: 'Presupuesto',          color: 'Goldenrod' },
        { id: 'jst-diseno',      nombre: 'Reunión de diseño',    color: 'MediumPurple' },
        { id: 'jst-disenook',    nombre: 'Diseño verificado',    color: 'Orchid' },
        { id: 'jst-materiales',  nombre: 'Me envían las cosas',  color: 'SandyBrown' },
        { id: 'jst-programando', nombre: 'Programando',          color: 'LightSeaGreen' },
        { id: 'jst-entrega',     nombre: 'Reunión de entrega',   color: 'MediumSeaGreen' },
        { id: 'jst-publicado',   nombre: 'Post de Instagram',    color: 'DeepPink' }
      ],
      cards: []
    };
  },

  /** Crea estructura de datos vacía (formato v2) */
  create() {
    this.d = {
      version: 2,
      clientes: [],
      projects: [],
      gastos: [],
      journey: this._seedJourney(),
      settings: {
        emisor: { nombre: '', direccion1: '', direccion2: '', nif: '' },
        defaultIva: 21,
        defaultIrpf: 15,
        targets: { horasMes: null, ingresosMes: null, horasSemana: null },
        nextFacturaNum: 1,
        tema: 'oscuro',
        idioma: 'es',
        calStartHour: 0
      }
    };
    this.save();
  },

  /**
   * Garantiza que todos los campos v2 existen en los datos cargados.
   * - Añade arrays/objetos que falten con valores por defecto
   * - Normaliza estados legacy (en_progreso→activo, pendiente→pausado)
   * - Extrae clientes de proyectos legacy si no hay entidades
   * - Añade flags (interno, recurrente) si no existen
   * Llamar siempre después de init() o load().
   */
  ensure() {
    const d = this.d;

    /* Arrays raíz */
    if (!d.clientes) d.clientes = [];
    if (!d.gastos) d.gastos = [];
    if (!d.projects) d.projects = [];
    if (!d.deducibles) d.deducibles = [];
    /* VeriFactu: registro inmutable de registros de facturación (altas + anulaciones,
       huella oficial AEAT encadenada por emisor). La remisión a AEAT es Fase 3 (trackr-api). */
    if (!d.facturas) d.facturas = [];
    /* Customer journey (tablero kanban). Se siembra una sola vez; editable. */
    if (!d.journey || typeof d.journey !== 'object') d.journey = this._seedJourney();
    if (!Array.isArray(d.journey.stages)) d.journey.stages = [];
    if (!Array.isArray(d.journey.cards)) d.journey.cards = [];
    /* Tarjetas huérfanas (su estadio fue borrado) → al primer estadio existente */
    if (d.journey.stages.length) {
      const validStage = new Set(d.journey.stages.map(s => s.id));
      d.journey.cards.forEach(c => {
        if (!validStage.has(c.stageId)) c.stageId = d.journey.stages[0].id;
      });
    }
    /* Refs de estadios para asignar la fase de journey a cada proyecto (abajo) */
    const _jStages = d.journey.stages;
    const _jFirst = _jStages.length ? _jStages[0].id : null;
    const _jLast = _jStages.length ? _jStages[_jStages.length - 1].id : null;
    const _jValid = new Set(_jStages.map(s => s.id));
    /* Migrar deducibles: año → fecha */
    d.deducibles.forEach(dd => {
      if (dd.año && !dd.fecha) dd.fecha = `${dd.año}-01-01`;
    });

    /* Settings */
    if (!d.settings) d.settings = {};
    const s = d.settings;
    if (!s.emisor) s.emisor = { nombre: '', direccion1: '', direccion2: '', nif: '', instruccionesPago: '' };
    if (s.emisor.instruccionesPago == null) s.emisor.instruccionesPago = '';
    if (s.emisor.beneficiarioPago == null) s.emisor.beneficiarioPago = '';
    if (s.defaultIva == null) s.defaultIva = 21;
    if (s.defaultIrpf == null) s.defaultIrpf = 15;
    if (!s.targets) s.targets = { horasMes: null, ingresosMes: null, horasSemana: null };
    if (s.nextFacturaNum == null) s.nextFacturaNum = 1;
    if (s.conceptoDefault == null) s.conceptoDefault = '';
    if (s.conceptoAppendCliente == null) s.conceptoAppendCliente = false;
    if (!s.tema) s.tema = 'oscuro';
    if (!s.idioma) s.idioma = 'es';
    if (s.calStartHour == null) s.calStartHour = 0;

    /* Fiscal (modelos 130/303/renta — ver TODO/20-modelos-fiscales-casillas.md) */
    if (!s.fiscal) s.fiscal = {
      eds: true,             /* estimación directa simplificada → 5% difícil justificación */
      rendAnterior: null,    /* rendimiento neto del año anterior (casilla 13 del 130) */
      saldoIvaInicial: 0     /* IVA a compensar pendiente anterior al primer dato en TRACKR */
    };

    /* Verifactu / SIF — solo opciones de usuario. SIF_ID y SOFTWARE_VERSION
       viven en js/verifactu.js como constantes del fabricante, no aquí. */
    if (!s.verifactu) s.verifactu = {
      habilitado: false,           /* Apagado por defecto hasta que la remisión a AEAT (Fase 3)
                                      esté viva: el QR promete cotejo en la sede y aún no remitimos. */
      lastInvoiceHash: null,       /* Hash de la última factura firmada (cadena por emisor) */
      env: 'prod'                  /* 'prod' o 'test' — endpoint AEAT en el QR */
    };
    /* Migración: settings antiguos traían habilitado:true de fábrica, pero ningún usuario pudo
       elegirlo (la sección estaba oculta sin verifactu.js). Forzar off salvo elección explícita. */
    if (!s.verifactu.userSet) s.verifactu.habilitado = false;
    /* Limpieza: si quedan campos legacy del fabricante en el settings de un user, descartarlos */
    if (s.verifactu) {
      delete s.verifactu.sifId;
      delete s.verifactu.softwareVersion;
    }

    /* Migrar usuario legacy → emisor.nombre */
    if (s.usuario && !s.emisor.nombre) {
      s.emisor.nombre = s.usuario;
    }

    /* Mapa de estados legacy → nuevos */
    const stateMap = {
      en_progreso: 'activo',
      pendiente: 'pausado',
      facturado: 'completado',
      pagado: 'completado'
    };

    d.projects.forEach(p => {
      /* Garantizar campos estructurales */
      if (!p.horas) p.horas = [];
      if (!p.facturacion) p.facturacion = { modo: 'gratis' };
      if (!p.fechas) p.fechas = { inicio: null, finEstimada: null, finReal: null };

      /* Convertir estado "recurrente" a flag + estado activo */
      if (p.estado === 'recurrente') {
        p.recurrente = true;
        p.estado = 'activo';
      }
      /* Si estaba como "pagado", asegurar facturacion.pagado */
      if (p.estado === 'pagado') {
        p.facturacion = p.facturacion || {};
        p.facturacion.pagado = true;
      }
      /* Mapear estado legacy */
      if (stateMap[p.estado]) {
        p.estado = stateMap[p.estado];
      }

      /* Flags por defecto */
      if (p.interno == null) p.interno = false;
      if (p.recurrente == null) p.recurrente = false;

      /* Customer journey: fase de producción (eje aparte del estado).
         Completados → última fase; el resto → primera. Reasigna si apunta
         a un estadio borrado. */
      if (_jFirst) {
        if (p.journeyStage == null) p.journeyStage = (p.estado === 'completado') ? _jLast : _jFirst;
        else if (!_jValid.has(p.journeyStage)) p.journeyStage = _jFirst;
      }

      /* Campos de facturación v2 */
      if (p.facturacion) {
        if (p.facturacion.ivaExcepcion == null) p.facturacion.ivaExcepcion = '';
        if (p.facturacion.facturaNum == null) p.facturacion.facturaNum = null;
        if (p.facturacion.facturaFecha == null) p.facturacion.facturaFecha = null;
        if (p.facturacion.precioHora == null) p.facturacion.precioHora = 0;
        if (p.facturacion.idiomaFactura == null) p.facturacion.idiomaFactura = null;

        /* Cobros parciales — migración */
        if (!p.facturacion.cobros) p.facturacion.cobros = [];
        if (p.facturacion.pagado && p.facturacion.cobros.length === 0) {
          const tf = p.facturacion.totalFactura || p.facturacion.netoRecibido || 0;
          if (tf > 0) {
            p.facturacion.cobros = [{ id: uid(), fecha: p.facturacion.fechaPago || todayStr(), cantidad: tf }];
          }
        }
        /* Migración v3: cobros antiguos registrados como neto → escalar a totalFactura */
        if (!p.facturacion._cobrosV3 && p.facturacion.cobros.length > 0) {
          const nr = p.facturacion.netoRecibido || 0;
          const tf = p.facturacion.totalFactura || 0;
          if (nr > 0 && tf > 0 && tf !== nr) {
            const tc = p.facturacion.cobros.reduce((s, c) => s + (c.cantidad || 0), 0);
            if (Math.abs(tc - nr) < 0.02 || (tc > 0 && tc <= nr)) {
              const ratio = tf / nr;
              p.facturacion.cobros.forEach(c => { c.cantidad = roundMoney(c.cantidad * ratio); });
            }
          }
          p.facturacion._cobrosV3 = true;
        }
      }
    });

    /* Garantizar campo color en clientes y gastos */
    d.clientes.forEach(c => {
      if (!c.color || c.color === 'CornflowerBlue') {
        const linked = d.projects.find(p => p.clienteId === c.id && p.color);
        c.color = linked ? linked.color : 'CornflowerBlue';
      }
    });
    d.gastos.forEach(g => {
      if (!g.entradas) g.entradas = [];
      if (!g.color) g.color = 'Salmon';
      if (g.desgravable == null) g.desgravable = false;
      if (g.tipoIva == null) g.tipoIva = 21;
      /* v4: migrar entradas cantidad → base/iva/total */
      g.entradas.forEach(e => {
        if (e.cantidad != null && e.total == null) {
          const rate = (g.tipoIva || 0) / 100;
          e.total = e.cantidad;
          e.iva = roundMoney(e.total * rate / (1 + rate));
          e.base = roundMoney(e.total - e.iva);
          e.tipoIva = g.tipoIva || 0;
        }
      });
    });

    /* Extraer clientes únicos de proyectos legacy (campo string) */
    const hasLegacy = d.projects.some(p => p.cliente && !p.clienteId);
    if (hasLegacy && d.clientes.length === 0) {
      const seen = {}; /* nombre_lowercase → clienteId */
      d.projects.forEach(p => {
        if (!p.cliente || p.clienteId) return;
        const name = p.cliente.trim();
        const key = name.toLowerCase();
        if (!seen[key]) {
          const cid = uid();
          seen[key] = cid;
          d.clientes.push({
            id: cid, nombre: name,
            direccion1: '', direccion2: '', nif: ''
          });
        }
        p.clienteId = seen[key];
      });
    }

    /* Marcar proyectos internos basándose en usuario legacy */
    if (s.usuario) {
      const usr = s.usuario.toLowerCase();
      d.projects.forEach(p => {
        const cn = clienteName(p).toLowerCase();
        if (cn === usr && !p.interno) p.interno = true;
      });
    }

    /* Garantizar nombreCompleto en clientes (tras extracción legacy) */
    d.clientes.forEach(c => {
      if (c.nombreCompleto == null) c.nombreCompleto = '';
    });

    /* Sincronizar IVA/IRPF de proyectos con defaults (v2 → v3) */
    if (d.version < 3) {
      d.projects.forEach(p => {
        const f = p.facturacion;
        if (!f || f.modo === 'gratis') return;
        let changed = false;
        if (f.iva === 21 && s.defaultIva !== 21) { f.iva = s.defaultIva; changed = true; }
        if (f.irpf === 15 && s.defaultIrpf !== 15) { f.irpf = s.defaultIrpf; changed = true; }
        if (changed) {
          /* Recalcular importes inline (B no disponible aún) */
          const b = f.baseImponible || 0, iv = f.iva || 0, ir = f.irpf || 0;
          f.importeIva = roundMoney(b * iv / 100);
          f.importeIrpf = roundMoney(b * ir / 100);
          f.totalFactura = roundMoney(b + f.importeIva - f.importeIrpf);
          f.netoRecibido = roundMoney(b - f.importeIrpf);
          f.total = f.totalFactura;
        }
      });
    }

    d.version = 4;
  },

  /** Persiste en localStorage */
  save() {
    /* Modo visor (gestoría viendo datos de un cliente): NADA se persiste ni se
       sincroniza. Todos los mutadores pasan por save(), así que este guard es la
       barrera única que impide que los datos del cliente contaminen la cuenta del
       gestor (localStorage propio, historial, blob en la nube). Ver App.gstOpenClient. */
    if (this._readOnly) return;
    try {
      localStorage.setItem('trackr_data', JSON.stringify(this.d));
      this.lastSaved = Date.now();
      try { localStorage.setItem('trackr_saved_at', String(this.lastSaved)); } catch (e) { /* cuota: el timestamp es prescindible */ }
      /* El refresco del indicador es UI no crítica: si falla, el guardado YA fue OK. */
      try { if (typeof App !== 'undefined' && App._renderSaved) App._renderSaved(); } catch (e) { /* noop */ }
    } catch (e) {
      if (typeof Toast !== 'undefined') Toast.error('Error al guardar: ' + (e.name === 'QuotaExceededError' ? 'almacenamiento lleno' : e.message));
      console.error('D.save() failed:', e);
    }
  },

  /* ══════════════════════════════════════════════
   *  PROYECTOS
   * ══════════════════════════════════════════════ */

  /** Todos los proyectos */
  ps() { return this.d.projects; },

  /** Proyecto por ID */
  p(id) { return this.d.projects.find(p => p.id === id); },

  /** Añade un proyecto */
  add(p) { this.d.projects.push(p); this.save(); },

  /** Actualiza un proyecto por ID (merge parcial) */
  up(id, u) {
    const i = this.d.projects.findIndex(p => p.id === id);
    if (i !== -1) { Object.assign(this.d.projects[i], u); this.save(); }
  },

  /** Elimina un proyecto por ID */
  del(id) {
    this.d.projects = this.d.projects.filter(p => p.id !== id);
    this.save();
  },

  /* ══════════════════════════════════════════════
   *  CLIENTES
   * ══════════════════════════════════════════════ */

  /** Todos los clientes, ordenados por nombre */
  cls() { return [...this.d.clientes].sort((a, b) => a.nombre.localeCompare(b.nombre)); },

  /** Cliente por ID */
  cl(id) { return this.d.clientes.find(c => c.id === id); },

  /** Añade un cliente. Devuelve el cliente creado. */
  addCl(c) { this.d.clientes.push(c); this.save(); return c; },

  /** Actualiza un cliente por ID */
  upCl(id, u) {
    const i = this.d.clientes.findIndex(c => c.id === id);
    if (i !== -1) { Object.assign(this.d.clientes[i], u); this.save(); }
  },

  /** Elimina un cliente por ID */
  delCl(id) {
    this.d.clientes = this.d.clientes.filter(c => c.id !== id);
    this.save();
  },

  /* ══════════════════════════════════════════════
   *  GASTOS
   * ══════════════════════════════════════════════ */

  /** Todos los gastos */
  gs() { return this.d.gastos; },

  /** Gasto por ID */
  g(id) { return this.d.gastos.find(g => g.id === id); },

  /** Añade un gasto */
  addG(g) { this.d.gastos.push(g); this.save(); },

  /** Actualiza un gasto por ID */
  upG(id, u) {
    const i = this.d.gastos.findIndex(g => g.id === id);
    if (i !== -1) { Object.assign(this.d.gastos[i], u); this.save(); }
  },

  /** Elimina un gasto por ID */
  delG(id) {
    this.d.gastos = this.d.gastos.filter(g => g.id !== id);
    this.save();
  },

  /* ══════════════════════════════════════════════
   *  DEDUCIBLES (Renta)
   * ══════════════════════════════════════════════ */

  deds() { return this.d.deducibles; },
  ded(id) { return this.d.deducibles.find(d => d.id === id); },
  addDed(d) { this.d.deducibles.push(d); this.save(); },
  upDed(id, u) {
    const i = this.d.deducibles.findIndex(d => d.id === id);
    if (i !== -1) { Object.assign(this.d.deducibles[i], u); this.save(); }
  },
  delDed(id) {
    this.d.deducibles = this.d.deducibles.filter(d => d.id !== id);
    this.save();
  },

  /* ══════════════════════════════════════════════
   *  FACTURAS (Verifactu — registro inmutable)
   * ══════════════════════════════════════════════ */

  /** Todas las facturas firmadas (registro Verifactu) */
  fs() { return this.d.facturas; },

  /** Facturas de un emisor (filtradas por NIF) en orden de la cadena.
   *  Ordena por `seq` (epoch ms monótono guardado al firmar), NO por el string
   *  del timestamp con huso: en el cambio de hora de otoño dos registros a la misma
   *  hora local llevan offsets +02:00 y +01:00 y el orden lexicográfico los invertía,
   *  rompiendo la cadena en falso. El epoch ms es monótono y sin ambigüedad. */
  fsBy(nif) {
    const n = (nif || '').replace(/[\s-]/g, '').toUpperCase();
    const key = f => (f.seq != null ? f.seq : Date.parse(f.timestamp) || 0);
    return this.d.facturas
      .filter(f => (f.emisorNif || '').toUpperCase() === n)
      .sort((a, b) => key(a) - key(b));
  },

  /** Hash de la última factura del emisor (para encadenar la siguiente) */
  lastHashFor(nif) {
    const arr = this.fsBy(nif);
    return arr.length ? arr[arr.length - 1].hash : null;
  },

  /**
   * Persiste una factura firmada en el registro Verifactu.
   * No permite modificar facturas ya firmadas (registro inmutable).
   */
  addFact(f) {
    this.d.facturas.push(f);
    /* Actualizar lastInvoiceHash en settings.verifactu */
    if (!this.d.settings.verifactu) this.d.settings.verifactu = {};
    this.d.settings.verifactu.lastInvoiceHash = f.hash;
    this.save();
  },

  /**
   * Añade un evento (anulación, rectificación) a una factura existente.
   * No modifica los datos originales; solo añade al array eventos[].
   */
  addFactEvent(factId, evento) {
    const i = this.d.facturas.findIndex(f => f.id === factId);
    if (i !== -1) {
      if (!this.d.facturas[i].eventos) this.d.facturas[i].eventos = [];
      this.d.facturas[i].eventos.push(evento);
      this.save();
    }
  },

  /* ══════════════════════════════════════════════
   *  CUSTOMER JOURNEY (tablero kanban)
   *  Estadios (columnas) + tarjetas (clientes/personas).
   *  Plantilla genérica, independiente de `clientes`.
   * ══════════════════════════════════════════════ */

  /* ── Estadios (columnas) ── */
  jStages() { return this.d.journey.stages; },
  jStage(id) { return this.d.journey.stages.find(s => s.id === id); },
  addJStage(s) { this.d.journey.stages.push(s); this.save(); return s; },
  upJStage(id, u) {
    const i = this.d.journey.stages.findIndex(s => s.id === id);
    if (i !== -1) { Object.assign(this.d.journey.stages[i], u); this.save(); }
  },
  /** Elimina un estadio. Sus tarjetas se reasignan a `toStageId` (o se borran si null). */
  delJStage(id, toStageId) {
    if (toStageId) this.d.journey.cards.forEach(c => { if (c.stageId === id) c.stageId = toStageId; });
    else this.d.journey.cards = this.d.journey.cards.filter(c => c.stageId !== id);
    this.d.journey.stages = this.d.journey.stages.filter(s => s.id !== id);
    this.save();
  },
  /** Reordena un estadio una posición (dir: -1 izquierda, +1 derecha) */
  moveJStage(id, dir) {
    const a = this.d.journey.stages;
    const i = a.findIndex(s => s.id === id), j = i + dir;
    if (i === -1 || j < 0 || j >= a.length) return;
    [a[i], a[j]] = [a[j], a[i]];
    this.save();
  },

  /* ── Tarjetas ── */
  jCards() { return this.d.journey.cards; },
  jCard(id) { return this.d.journey.cards.find(c => c.id === id); },
  jCardsIn(stageId) { return this.d.journey.cards.filter(c => c.stageId === stageId); },
  addJCard(c) { this.d.journey.cards.push(c); this.save(); return c; },
  upJCard(id, u) {
    const i = this.d.journey.cards.findIndex(c => c.id === id);
    if (i !== -1) { Object.assign(this.d.journey.cards[i], u); this.save(); }
  },
  delJCard(id) {
    this.d.journey.cards = this.d.journey.cards.filter(c => c.id !== id);
    this.save();
  },

  /* ══════════════════════════════════════════════
   *  IMPORT
   * ══════════════════════════════════════════════ */

  /** Carga datos importados (reemplaza todo, normaliza y persiste) */
  load(j) {
    this.d = j;
    this.ensure();
    this.save();
  },

  /** Carga efímera para el modo visor: normaliza y muestra en memoria, SIN persistir
   *  ni sincronizar (this._readOnly bloquea save()). El localStorage y la nube del
   *  gestor quedan intactos con SUS datos. exitView() lo revierte. */
  loadView(j) {
    this._readOnly = true;
    this.d = j;
    this.ensure();
  },

  /** Sale del modo visor: recupera los datos propios (que nunca se sobrescribieron
   *  en localStorage porque save() estaba bloqueado) y reanuda la persistencia. */
  exitView() {
    this._readOnly = false;
    try { this.d = JSON.parse(localStorage.getItem('trackr_data') || 'null') || this.d; } catch (e) { /* conserva lo que haya */ }
    this.ensure();
  }
};
