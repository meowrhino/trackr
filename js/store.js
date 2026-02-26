/* ================================================
 * TRACKR — Store (capa de datos)
 * Persistencia en localStorage, CRUD de proyectos,
 * clientes y gastos. Migración ligera de formato.
 * Globales: D
 * Dependencias: uid() de utils.js
 * ================================================ */

const D = {
  d: null,

  /* ── Inicialización ── */

  /** Carga datos de localStorage. Devuelve true si había datos. */
  init() {
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

  /** Crea estructura de datos vacía (formato v2) */
  create() {
    this.d = {
      version: 2,
      clientes: [],
      projects: [],
      gastos: [],
      settings: {
        emisor: { nombre: '', direccion1: '', direccion2: '', nif: '' },
        defaultIva: 21,
        defaultIrpf: 15,
        targets: { horasMes: null, ingresosMes: null, horasSemana: null },
        nextFacturaNum: 1,
        tema: 'oscuro'
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

    /* Settings */
    if (!d.settings) d.settings = {};
    const s = d.settings;
    if (!s.emisor) s.emisor = { nombre: '', direccion1: '', direccion2: '', nif: '' };
    if (s.defaultIva == null) s.defaultIva = 21;
    if (s.defaultIrpf == null) s.defaultIrpf = 15;
    if (!s.targets) s.targets = { horasMes: null, ingresosMes: null, horasSemana: null };
    if (s.nextFacturaNum == null) s.nextFacturaNum = 1;
    if (!s.tema) s.tema = 'oscuro';

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

      /* Campos de facturación v2 */
      if (p.facturacion) {
        if (p.facturacion.ivaExcepcion == null) p.facturacion.ivaExcepcion = '';
        if (p.facturacion.facturaNum == null) p.facturacion.facturaNum = null;
        if (p.facturacion.facturaFecha == null) p.facturacion.facturaFecha = null;
      }
    });

    /* Garantizar campo color en clientes y gastos */
    d.clientes.forEach(c => { if (!c.color) c.color = 'CornflowerBlue'; });
    d.gastos.forEach(g => { if (!g.color) g.color = 'Salmon'; });

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

    d.version = 2;
  },

  /** Persiste en localStorage */
  save() {
    localStorage.setItem('trackr_data', JSON.stringify(this.d));
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
   *  IMPORT
   * ══════════════════════════════════════════════ */

  /** Carga datos importados (reemplaza todo, normaliza y persiste) */
  load(j) {
    this.d = j;
    this.ensure();
    this.save();
  }
};
