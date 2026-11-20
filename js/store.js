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

  /** Tope del anillo de auditoría: el array viaja dentro del blob cifrado (límite 256 KB). */
  AUDIT_MAX: 500,

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
      } catch (e) {
        /* No se pueden cargar: se apartan intactos antes de que create() los pise.
           Quedan en trackr_data_broken para recuperarlos a mano (o con ayuda). */
        console.error('D.init: datos ilegibles, apartados en trackr_data_broken', e);
        try { localStorage.setItem('trackr_data_broken', raw); this._broken = true; } catch (e2) { /* sin sitio: al menos el log */ }
      }
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
      audit: [],
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
    /* create() enumera solo lo básico; ensure() añade el resto del esquema
       (deducibles, fiscal, verifactu…). Sin esto, la primera sesión de una
       cuenta nueva reventaba al pintar el resumen fiscal. */
    this.ensure();
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
    this._shape();

    /* Arrays raíz */
    if (!d.clientes) d.clientes = [];
    if (!d.gastos) d.gastos = [];
    if (!d.projects) d.projects = [];
    if (!d.deducibles) d.deducibles = [];
    /* Autoría (TODO/21, Etapa A): quién tocó qué y cuándo. Anillo de AUDIT_MAX eventos. */
    if (!Array.isArray(d.audit)) d.audit = [];
    /* VeriFactu: registro inmutable de registros de facturación (altas + anulaciones,
       huella oficial AEAT encadenada por emisor). La remisión a AEAT es Fase 3 (trackr-api). */
    if (!d.facturas) d.facturas = [];
    /* Presupuestos guardados (líneas, descripción y estado). Fuera del alcance fiscal de la gestoría. */
    if (!Array.isArray(d.presupuestos)) d.presupuestos = [];
    /* Migración: las marcas antiguas p.presupuesto {num, fecha} pasan a ser un registro por número */
    const budNums = new Set(d.presupuestos.map(b => b.num));
    const porNum = {};
    (d.projects || []).forEach(p => {
      if (p.presupuesto && p.presupuesto.num != null && !budNums.has(p.presupuesto.num)) (porNum[p.presupuesto.num] = porNum[p.presupuesto.num] || []).push(p);
    });
    Object.keys(porNum).forEach(num => {
      const ps = porNum[num];
      const lineas = ps.map(p => {
        const f = p.facturacion || {};
        /* por_hora: la base sale de las horas (B.calc aún no ha pasado por aquí) */
        const base = f.modo === 'por_hora' ? (p.horas || []).reduce((s, h) => s + (h.cantidad || 0), 0) * (f.precioHora || 0) : (f.baseImponible || 0);
        return { pid: p.id, concepto: p.nombre, base: roundMoney(base) };
      });
      const aceptado = ps.some(p => (p.facturacion || {}).facturaNum || p.estado === 'activo' || p.estado === 'completado');
      const rechazado = !aceptado && ps.some(p => p.estado === 'abandonado');
      d.presupuestos.push({
        id: uid(), num: /^\d+$/.test(num) ? Number(num) : num, fecha: ps[0].presupuesto.fecha, clienteId: ps[0].clienteId, lineas, descripcion: '',
        /* Cada línea con el IVA y el IRPF de su proyecto (no los del primero) */
        total: roundMoney(ps.reduce((s, p, i) => { const f = p.facturacion || {}; return s + lineas[i].base * (1 + (f.iva == null ? 21 : f.iva) / 100 - (f.irpf == null ? 15 : f.irpf) / 100); }, 0)),
        estado: aceptado ? 'aceptado' : rechazado ? 'rechazado' : 'enviado'
      });
    });
    /* `journey` y `journeyStage` (fases de producción, hasta oct 2026) se conservan
       en el save por compatibilidad, pero ya no se leen: el Tablero usa el estado. */
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
      /* Subproyectos (opcional): solo se rellenan los ids que falten; sin lista no se toca nada */
      if (Array.isArray(p.subproyectos)) p.subproyectos.forEach(s => { if (s && !s.id) s.id = uid(); });
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
        /* Migración v3: cobros antiguos registrados como neto → escalar a totalFactura.
           Solo en datos de antes de la v4: la marca _cobrosV3 se pierde al editar el proyecto
           y, sin este tope, cada recarga inflaba un cobro parcial un 24,7 % (500 → 623,53). */
        if (!(d.version >= 4) && !p.facturacion._cobrosV3 && p.facturacion.cobros.length > 0) {
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
      if (g.tipoIrpf == null) g.tipoIrpf = 0;
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

    this._types();
    d.version = 4;
  },

  /* ══════════════════════════════════════════════
   *  FRONTERA DE DATOS: forma y tipos
   *  Lo que llega de un JSON importado, de la nube, de la copia de un cliente o de un cambio de
   *  la gestoría puede traer cualquier cosa. La app trata muchos campos como número, fecha,
   *  color o lista cerrada y los pinta tal cual (innerHTML, value="…"): un «estado» o una
   *  «categoría» con HTML dentro ejecutaba código al abrir la vista. Aquí cada campo se queda
   *  con su tipo; el texto libre (nombres, notas…) se escapa al pintar con esc().
   * ══════════════════════════════════════════════ */

  /** Forma: las listas son listas de objetos (lo demás se tira) y los objetos, objetos.
   *  Va lo primero de ensure(): el resto ya puede recorrerlas sin mirar. */
  _shape() {
    const d = this.d;
    const isObj = v => !!v && typeof v === 'object' && !Array.isArray(v);
    const list = (o, k, optional) => { if (optional && o[k] == null) return []; o[k] = Array.isArray(o[k]) ? o[k].filter(isObj) : []; return o[k]; };
    const obj = (o, k) => { if (o[k] != null && !isObj(o[k])) delete o[k]; };
    for (const k of ['clientes', 'gastos', 'projects', 'deducibles', 'facturas', 'presupuestos', 'audit']) list(d, k);
    obj(d, 'settings');
    if (d.settings) for (const k of ['emisor', 'targets', 'fiscal', 'verifactu']) obj(d.settings, k);
    d.projects.forEach(p => {
      list(p, 'horas'); list(p, 'subproyectos', true);
      obj(p, 'facturacion'); obj(p, 'fechas'); obj(p, 'presupuesto');
      if (p.facturacion) { list(p.facturacion, 'cobros', true); list(p.facturacion, 'rectificativas', true); }
    });
    d.gastos.forEach(g => { list(g, 'entradas').forEach(e => list(e, 'desglose', true)); });
    d.presupuestos.forEach(b => list(b, 'lineas'));
  },

  /** Tipos: números, fechas, colores y listas cerradas. Va lo último de ensure(), con las
   *  migraciones ya hechas. Un valor que no vale se cambia por su valor por defecto. */
  _types() {
    const d = this.d, s = d.settings;
    const num = (o, k, def = 0) => { if (o[k] == null) return; const n = parseNum(o[k]); o[k] = Number.isFinite(n) ? n : def; };
    const nums = (o, ...ks) => ks.forEach(k => num(o, k));
    const date = (o, k, def = null) => { if (o[k] != null && !/^\d{4}-\d{2}-\d{2}$/.test(o[k])) o[k] = def; };
    const oneOf = (o, k, vals, def) => { if (!vals.includes(o[k])) o[k] = def; };
    const color = (o, k, def) => { if (typeof o[k] !== 'string' || !/^([A-Za-z]{1,30}|#[0-9A-Fa-f]{3,8})$/.test(o[k])) o[k] = def; };
    const str = (o, ...ks) => ks.forEach(k => { if (o[k] != null && typeof o[k] !== 'string') o[k] = typeof o[k] === 'object' ? '' : String(o[k]); });
    /* Clave de categoría que no está en la lista (las hay en datos viejos y en los ejemplos):
       se conserva si es una clave limpia; si trae otra cosa, 'otro'. */
    const slug = (o, k, def) => { if (typeof o[k] !== 'string' || !/^[a-z0-9_]{1,40}$/.test(o[k])) o[k] = def; };
    const zona = o => { if (o.zonaFiscal != null) oneOf(o, 'zonaFiscal', Object.keys(ZONA_FISCAL), 'es'); };

    d.projects.forEach(p => {
      str(p, 'nombre', 'notas'); if (p.nombre == null) p.nombre = '';
      oneOf(p, 'estado', Object.keys(EST), 'activo');
      color(p, 'color', 'CornflowerBlue');
      p.interno = !!p.interno; p.recurrente = !!p.recurrente;
      ['inicio', 'finEstimada', 'finReal'].forEach(k => date(p.fechas, k));
      p.horas.forEach(h => {
        nums(h, 'cantidad', 'monto'); if (h.cantidad == null) h.cantidad = 0;
        date(h, 'fecha');
        if (h.horaInicio != null && !/^\d{2}:\d{2}$/.test(h.horaInicio)) h.horaInicio = null;
        oneOf(h, 'tipo', ['trabajo', 'reunion'], 'trabajo');
        str(h, 'nota');
      });
      (p.subproyectos || []).forEach(x => { num(x, 'base'); str(x, 'nombre', 'descripcion'); });
      if (p.presupuesto) {
        const n = p.presupuesto.num;
        if (!(typeof n === 'number' || (typeof n === 'string' && /^[A-Za-z]{0,2}\d{1,9}$/.test(n)))) p.presupuesto = null;
        else date(p.presupuesto, 'fecha', todayStr());
      }
      const f = p.facturacion;
      oneOf(f, 'modo', ['desde_base', 'desde_total', 'por_hora', 'gratis'], 'gratis');
      nums(f, 'baseImponible', 'total', 'precioHora', 'iva', 'irpf', 'importeIva', 'importeIrpf', 'totalFactura', 'netoRecibido', 'gastos');
      if (f.diasPago != null) { num(f, 'diasPago', NaN); if (!(f.diasPago >= 0)) delete f.diasPago; }
      if (f.facturaNum != null) f.facturaNum = parseFacNum(f.facturaNum);
      date(f, 'facturaFecha'); date(f, 'fechaPago');
      str(f, 'ivaExcepcion', 'asuntoFactura');
      if (f.idiomaFactura != null && !/^[a-z]{2}$/.test(f.idiomaFactura)) f.idiomaFactura = null;
      if (f.anulada) { f.anulada = typeof f.anulada === 'object' && !Array.isArray(f.anulada) ? f.anulada : {}; date(f.anulada, 'fecha'); }
      (f.cobros || []).forEach(c => {
        num(c, 'cantidad'); if (c.cantidad == null) c.cantidad = 0;
        date(c, 'fecha');
        if (c.metodo != null && !/^[a-z]{1,20}$/.test(c.metodo)) delete c.metodo;
      });
      (f.rectificativas || []).forEach(r => { nums(r, 'base', 'importeIva', 'importeIrpf', 'total', 'netoRecibido'); date(r, 'fecha', todayStr()); str(r, 'num', 'motivo'); });
    });

    d.clientes.forEach(c => {
      str(c, 'nombre', 'nombreCompleto', 'nif', 'direccion1', 'direccion2', 'notas'); if (c.nombre == null) c.nombre = '';
      color(c, 'color', 'CornflowerBlue');
      zona(c);
    });

    d.gastos.forEach(g => {
      str(g, 'nombre', 'notas', 'nifProveedor'); if (g.nombre == null) g.nombre = '';
      slug(g, 'categoria', 'otro');
      if (g.recurrente) oneOf(g, 'recurrente', Object.keys(RECURRENCIA), 'no');
      color(g, 'color', 'Salmon');
      g.desgravable = !!g.desgravable;
      nums(g, 'tipoIva', 'tipoIrpf', 'importeBase');
      if (g.diaRecurrente != null) { num(g, 'diaRecurrente', NaN); g.diaRecurrente = g.diaRecurrente >= 1 && g.diaRecurrente <= 31 ? Math.floor(g.diaRecurrente) : null; }
      if (g.finHasta != null && !/^\d{4}-\d{2}(-\d{2})?$/.test(g.finHasta)) g.finHasta = null;
      zona(g);
      g.entradas.forEach(e => {
        nums(e, 'base', 'iva', 'irpf', 'total', 'cantidad', 'tipoIva', 'tipoIrpf');
        date(e, 'fecha');
        str(e, 'nota', 'numFactura');
        (e.desglose || []).forEach(l => nums(l, 'tipoIva', 'base', 'iva'));
      });
    });

    d.deducibles.forEach(x => {
      slug(x, 'categoria', 'otro');
      num(x, 'cantidad'); date(x, 'fecha');
      str(x, 'nombre', 'descripcion', 'nota');
    });

    d.presupuestos.forEach(b => {
      if (typeof b.num !== 'number' && !(typeof b.num === 'string' && /^[A-Za-z]{0,2}\d{1,9}$/.test(b.num))) b.num = String(parseFacNum(b.num) || 0);
      date(b, 'fecha', todayStr()); if (b.fecha == null) b.fecha = todayStr();
      oneOf(b, 'estado', ['enviado', 'aceptado', 'rechazado'], 'enviado');
      nums(b, 'total', 'validez');
      str(b, 'descripcion');
      b.lineas.forEach(l => { num(l, 'base'); str(l, 'concepto'); });
    });

    nums(s, 'defaultIva', 'defaultIrpf', 'diasVencimiento', 'calStartHour');
    s.nextFacturaNum = parseFacNum(s.nextFacturaNum) || 1;
    if (s.nextFacturaYear != null && !/^\d{4}$/.test(s.nextFacturaYear)) delete s.nextFacturaYear;
    oneOf(s, 'idioma', ['es', 'en', 'ca'], 'es');
    if (typeof s.tema !== 'string' || !/^[\w-]{1,30}$/.test(s.tema)) s.tema = 'oscuro';
    str(s.emisor, 'nombre', 'nif', 'direccion1', 'direccion2', 'instruccionesPago', 'beneficiarioPago');
    str(s, 'conceptoDefault');
    nums(s.targets, 'horasMes', 'ingresosMes', 'horasSemana');
    nums(s.fiscal, 'rendAnterior', 'saldoIvaInicial');
  },

  /* ══════════════════════════════════════════════
   *  AUDITORÍA (TODO/21, Etapa A)
   * ══════════════════════════════════════════════ */

  /**
   * Identidad de quien hace el cambio: {email, role} si hay sesión abierta,
   * 'local' si se usa TRACKR sin cuenta (o la sesión está bloqueada).
   */
  _actor() {
    try {
      if (typeof Acc === 'undefined') return 'local';
      const st = Acc.status();
      if (st.state !== 'in' || !st.email) return 'local';
      return { email: st.email, role: st.role || 'persona' };
    } catch (e) { return 'local'; }
  },

  /**
   * Registra una mutación en el anillo `d.audit`. Llamar SIEMPRE antes de save().
   *
   * En modo visor (gestoría mirando a un cliente) no anota: save() está bloqueado, así
   * que el evento no se persistiría y encima ensuciaría los datos del cliente en pantalla.
   * Si además hay edición activa (Etapa B), la mutación sale de aquí como OPERACIÓN hacia
   * la persona — quien la anotará en SU audit[] al aplicarla, que es donde debe constar.
   * Por eso `payload`: el audit local no lo usa, la op sí (qué crear/qué cambiar).
   *
   * @param {'crear'|'editar'|'borrar'} accion
   * @param {string} entidad  'proyecto'|'cliente'|'gasto'|'deducible'|'factura'|'settings'
   * @param {string|null} entidadId  id del objeto tocado (null para settings)
   * @param {object} [payload]  objeto creado / cambios parciales; solo viaja en la op
   */
  /** Lápida de un sub-registro borrado (hora, entrada de gasto, cobro): solo para que la fusión
   *  entre dispositivos no lo recupere. Nunca sale como op hacia otra cuenta. */
  _tomb(entidad, id) {
    if (!this._readOnly && this.d && id) this._auditAs(this._actor(), 'borrar', entidad, id);
  },

  _audit(accion, entidad, entidadId, payload) {
    if (!this.d) return;
    if (this._readOnly) {
      if (typeof GOps !== 'undefined' && GOps.emitting()) GOps.emit(accion, entidad, entidadId, payload);
      return;
    }
    this._auditAs(this._actor(), accion, entidad, entidadId);
  },

  /**
   * Anota con un actor explícito. Lo usa la aplicación de ops del gestor: el evento debe
   * decir que lo hizo la gestoría, no quien tiene la sesión abierta (que es la persona).
   * @param {object} [undo]  inverso de la operación, para deshacerla desde el historial
   */
  _auditAs(actor, accion, entidad, entidadId, undo) {
    if (this._readOnly || !this.d) return;
    if (!Array.isArray(this.d.audit)) this.d.audit = [];
    const e = { ts: Date.now(), actor, accion, entidad, entidadId: entidadId || null };
    if (undo) e.undo = undo;
    this.d.audit.push(e);
    const over = this.d.audit.length - this.AUDIT_MAX;
    if (over > 0) this.d.audit.splice(0, over);
  },

  /** Últimos eventos de auditoría, del más reciente al más antiguo. */
  auditLog(limit) {
    const a = Array.isArray(this.d?.audit) ? this.d.audit : [];
    const out = [...a].reverse();
    return limit ? out.slice(0, limit) : out;
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
      try { if (typeof App !== 'undefined' && App._accNoSessionNudge) App._accNoSessionNudge(); } catch (e) { /* noop */ }
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
  /** Otro proyecto (distinto de pid) que ya usa ese nº de factura, o undefined. Una anulada sigue gastando su número. */
  /** Otro proyecto con el mismo número EN EL MISMO AÑO (se imprime N/AA: la serie vuelve a 1
   *  cada enero). Sin fecha, compara solo el número. Una anulada sigue gastando su número. */
  facturaNumTaken(num, pid, fecha) {
    const y = fecha ? String(fecha).slice(0, 4) : null;
    return this.d.projects.find(p => p.id !== pid && p.facturacion?.facturaNum != null && +p.facturacion.facturaNum === +num
      && (!y || String(p.facturacion.facturaFecha || '').slice(0, 4) === y));
  },
  /** Tras emitir (o importar) la factura `num` con esa fecha, avanza el contador si toca.
   *  Solo cuentan el año del contador (o el actual en datos viejos sin año) y los posteriores:
   *  volver a descargar o importar una factura de un año anterior no lo mueve. */
  bumpFacturaNum(num, fecha) {
    const s = this.d.settings, fy = String(fecha || todayStr()).slice(0, 4);
    const cy = s.nextFacturaYear || todayStr().slice(0, 4);
    if (fy > cy || (fy === cy && +num >= (+s.nextFacturaNum || 1))) { s.nextFacturaNum = +num + 1; s.nextFacturaYear = fy; return true; }
    return false;
  },
  /** Avisos antes de emitir la factura `num` con esa fecha (no la impiden: se confirman):
   *  { tipo: 'hueco', toca, hasta } si se salta números, y { tipo: 'fechaAntes' | 'fechaDespues', num, fecha }
   *  si deja de ir en orden de fecha respecto a la factura anterior o a la siguiente de su año. */
  facturaAvisos(num, fecha, pid) {
    const out = [], y = String(fecha || todayStr()).slice(0, 4);
    const toca = this.nextFacturaNum(fecha);
    if (+num > toca) out.push({ tipo: 'hueco', toca, hasta: +num - 1 });
    let ant = null, sig = null;
    this.d.projects.forEach(p => {
      const f = p.facturacion; if (p.id === pid || !f?.facturaNum || String(f.facturaFecha || '').slice(0, 4) !== y) return;
      const n = +f.facturaNum;
      if (n < +num && (!ant || n > +ant.facturaNum)) ant = f;
      if (n > +num && (!sig || n < +sig.facturaNum)) sig = f;
    });
    if (ant && ant.facturaFecha > fecha) out.push({ tipo: 'fechaAntes', num: +ant.facturaNum, fecha: ant.facturaFecha });
    if (sig && sig.facturaFecha < fecha) out.push({ tipo: 'fechaDespues', num: +sig.facturaNum, fecha: sig.facturaFecha });
    return out;
  },
  /** Siguiente número de rectificativa (serie R, por año): 'R1', 'R2'… */
  nextRectNum(fecha) {
    const y = String(fecha || todayStr()).slice(0, 4);
    let max = 0;
    this.d.projects.forEach(p => (p.facturacion?.rectificativas || []).forEach(r => {
      if (String(r.fecha || '').slice(0, 4) === y) max = Math.max(max, parseInt(String(r.num).replace(/\D/g, ''), 10) || 0);
    }));
    return 'R' + (max + 1);
  },
  /** Número que toca para una factura con esta fecha: el siguiente de su año. El contador de
   *  Configuración (nextFacturaNum) vale para el año en que se usó por última vez
   *  (nextFacturaYear; en datos viejos, el año de la última factura); en un año nuevo, 1. */
  nextFacturaNum(fecha) {
    const y = String(fecha || todayStr()).slice(0, 4);
    const s = this.d.settings || {};
    let max = 0, lastY = null;
    this.d.projects.forEach(p => {
      const f = p.facturacion; if (!f?.facturaNum || !f.facturaFecha) return;
      const fy = f.facturaFecha.slice(0, 4);
      if (!lastY || fy > lastY) lastY = fy;
      if (fy === y) max = Math.max(max, +f.facturaNum || 0);
    });
    const cfgY = s.nextFacturaYear || lastY || y;
    return Math.max(max + 1, cfgY === y ? (+s.nextFacturaNum || 1) : 1);
  },
  /** ¿Tiene factura emitida y no anulada? (anulada = su registro de alta lleva el evento 'anulada') */
  facturaVigente(pid) {
    const p = this.p(pid);
    if (!p?.facturacion?.facturaNum) return false;
    if (p.facturacion.anulada) return false; /* anulada sin VeriFactu (marca en el proyecto) */
    const reg = (this.d.facturas || []).filter(r => r.proyectoId === pid && r.tipoRegistro === 'alta').pop();
    return !(reg && (reg.eventos || []).some(e => e.tipo === 'anulada'));
  },
  /** ¿Se puede borrar del todo la factura de pid (como si no se hubiera emitido)? '' si sí; si no,
   *  la clave del motivo. Solo la última de su año: borrar una de en medio deja un hueco en la
   *  numeración. Nunca una ya firmada en VeriFactu (está en la cadena) ni con cobros o rectificativas. */
  facturaBorrable(pid) {
    const f = this.p(pid)?.facturacion;
    if (!f?.facturaNum || !f.facturaFecha) return 'fac.delNone';
    if ((this.d.facturas || []).some(r => r.proyectoId === pid)) return 'fac.delVerifactu';
    if ((f.rectificativas || []).length) return 'fac.delRects';
    if ((f.cobros || []).length) return 'fac.delCobros';
    const y = f.facturaFecha.slice(0, 4);
    const later = this.d.projects.some(p => p.id !== pid && String(p.facturacion?.facturaFecha || '').slice(0, 4) === y && +p.facturacion.facturaNum > +f.facturaNum);
    return later ? 'fac.delNotLast' : '';
  },
  /** Borra la factura de pid (ver facturaBorrable): el proyecto vuelve a estar sin facturar y,
   *  si el contador ya había pasado de ella, su número queda libre para la siguiente. */
  borrarFactura(pid) {
    if (this.facturaBorrable(pid)) return false;
    const f = this.p(pid).facturacion, s = this.d.settings, y = f.facturaFecha.slice(0, 4);
    if ((s.nextFacturaYear || y) === y && +s.nextFacturaNum === +f.facturaNum + 1) s.nextFacturaNum = +f.facturaNum;
    this.up(pid, { facturacion: { ...f, facturaNum: null, facturaFecha: null, anulada: null } });
    return true;
  },
  /** ¿Algún proyecto de este cliente tiene factura emitida (vigente o anulada)? */
  clienteFacturado(cid) { return this.d.projects.some(p => p.clienteId === cid && p.facturacion?.facturaNum); },

  /** Añade un proyecto */
  add(p) { this.d.projects.push(p); this._audit('crear', 'proyecto', p.id, p); this.save(); },

  /** Actualiza un proyecto por ID (merge parcial) */
  up(id, u) {
    const i = this.d.projects.findIndex(p => p.id === id);
    if (i !== -1) { Object.assign(this.d.projects[i], u); this._audit('editar', 'proyecto', id, u); this.save(); }
  },

  /** Elimina un proyecto por ID */
  del(id) {
    this.d.projects = this.d.projects.filter(p => p.id !== id);
    this._audit('borrar', 'proyecto', id);
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
  addCl(c) { this.d.clientes.push(c); this._audit('crear', 'cliente', c.id, c); this.save(); return c; },

  /** Actualiza un cliente por ID */
  upCl(id, u) {
    const i = this.d.clientes.findIndex(c => c.id === id);
    if (i !== -1) { Object.assign(this.d.clientes[i], u); this._audit('editar', 'cliente', id, u); this.save(); }
  },

  /** Elimina un cliente por ID */
  delCl(id) {
    this.d.clientes = this.d.clientes.filter(c => c.id !== id);
    this._audit('borrar', 'cliente', id);
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
  addG(g) { this.d.gastos.push(g); this._audit('crear', 'gasto', g.id, g); this.save(); },

  /** Actualiza un gasto por ID */
  upG(id, u) {
    const i = this.d.gastos.findIndex(g => g.id === id);
    if (i !== -1) { Object.assign(this.d.gastos[i], u); this._audit('editar', 'gasto', id, u); this.save(); }
  },

  /** Elimina un gasto por ID */
  delG(id) {
    this.d.gastos = this.d.gastos.filter(g => g.id !== id);
    this._audit('borrar', 'gasto', id);
    this.save();
  },

  /* ══════════════════════════════════════════════
   *  DEDUCIBLES (Renta)
   * ══════════════════════════════════════════════ */

  deds() { return this.d.deducibles; },
  ded(id) { return this.d.deducibles.find(d => d.id === id); },
  addDed(d) { this.d.deducibles.push(d); this._audit('crear', 'deducible', d.id, d); this.save(); },
  upDed(id, u) {
    const i = this.d.deducibles.findIndex(d => d.id === id);
    if (i !== -1) { Object.assign(this.d.deducibles[i], u); this._audit('editar', 'deducible', id, u); this.save(); }
  },
  delDed(id) {
    this.d.deducibles = this.d.deducibles.filter(d => d.id !== id);
    this._audit('borrar', 'deducible', id);
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
    this._audit('crear', 'factura', f.id);
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
      this._audit('editar', 'factura', factId);
      this.save();
    }
  },


  /* ── Presupuestos (sin auditoría: no los ve la gestoría) ── */
  buds() { return this.d.presupuestos; },
  bud(id) { return this.d.presupuestos.find(b => b.id === id); },
  /** Siguiente número de presupuesto (serie P, por año): 'P1', 'P2'… Los antiguos sin P
   *  (usaban el contador de facturas) no cuentan. */
  nextBudNum(fecha) {
    const y = String(fecha || todayStr()).slice(0, 4);
    let max = 0;
    this.d.presupuestos.forEach(b => {
      if (/^P\d+$/.test(b.num) && String(b.fecha || '').slice(0, 4) === y) max = Math.max(max, +String(b.num).slice(1));
    });
    return 'P' + (max + 1);
  },
  /** Otro presupuesto con el mismo número en el mismo año (se imprime N/AA) */
  budNumTaken(num, fecha, id) {
    const y = String(fecha || '').slice(0, 4);
    return this.d.presupuestos.find(b => b.id !== id && String(b.num) === String(num) && String(b.fecha || '').slice(0, 4) === y);
  },
  addBud(b) { this.d.presupuestos.push(b); this.save(); return b; },
  upBud(id, u) { const b = this.bud(id); if (b) { Object.assign(b, u); this.save(); } return b; },
  /** Borra un presupuesto. Su número queda libre (no es una factura: la serie no tiene que ser correlativa). */
  delBud(id) {
    const b = this.bud(id); if (!b) return;
    this.d.presupuestos = this.d.presupuestos.filter(x => x.id !== id);
    /* La marca del proyecto no puede seguir apuntando al borrado (ensure() lo volvería a crear):
       pasa al presupuesto más reciente que aún incluya el proyecto, o se quita. */
    this.d.projects.forEach(p => {
      if (!p.presupuesto || String(p.presupuesto.num) !== String(b.num)) return;
      const o = this.d.presupuestos.filter(x => (x.lineas || []).some(l => l.pid === p.id)).sort((x, y) => (y.fecha || '').localeCompare(x.fecha || ''))[0];
      p.presupuesto = o ? { num: o.num, fecha: o.fecha } : null;
    });
    this._tomb('presupuesto', id); /* lápida: al fusionar dispositivos no vuelve */
    this.save();
  },

  /* ══════════════════════════════════════════════
   *  IMPORT
   * ══════════════════════════════════════════════ */

  /** Carga datos importados (reemplaza todo, normaliza y persiste) */
  load(j) {
    /* Si la normalización falla, no se queda a medias en memoria (lo guardaría el siguiente cambio) */
    const prev = this.d;
    this.d = j;
    try { this.ensure(); } catch (e) { this.d = prev; throw e; }
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
