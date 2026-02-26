/* ================================================
 * TRACKR — Utilidades
 * Constantes, helpers, formatos
 * Globales: EST, EST_ORDER, GASTO_CAT, RECURRENCIA,
 *           MESES, DIAS_SEM, uid(), esc(), fmtDate(),
 *           fmtMoney(), fmtNum(), sortHoras(),
 *           clienteName(), inPeriod(), todayStr()
 * Dependencias: ninguna
 * ================================================ */

/* ══════════════════════════════════════════════
 *  CONSTANTES
 * ══════════════════════════════════════════════ */

/** Estados de proyecto: clave interna → etiqueta visible */
const EST = {
  activo:     'Activo',
  pausado:    'Pausado',
  completado: 'Completado'
};

/** Orden de agrupación en la vista de proyectos */
const EST_ORDER = ['activo', 'pausado', 'completado'];

/** Categorías de gastos */
const GASTO_CAT = {
  herramientas: 'Herramientas',
  formacion:    'Formación',
  software:     'Software',
  marketing:    'Marketing',
  oficina:      'Oficina',
  otro:         'Otro'
};

/** Tipos de recurrencia de gastos */
const RECURRENCIA = {
  no:      'Puntual',
  mensual: 'Mensual',
  anual:   'Anual'
};

/** Meses y días de la semana en español */
const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];
const DIAS_SEM = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

/* ══════════════════════════════════════════════
 *  GENERADORES Y ESCAPE
 * ══════════════════════════════════════════════ */

/** Genera un ID único tipo xxxx-xxxx-xxxx */
function uid() {
  return 'xxxx-xxxx-xxxx'.replace(/x/g, () =>
    ((Math.random() * 16) | 0).toString(16)
  );
}

/** Escapa HTML para prevenir XSS */
function esc(s) {
  const d = document.createElement('div');
  d.textContent = s;
  return d.innerHTML;
}

/* ══════════════════════════════════════════════
 *  FORMATOS
 * ══════════════════════════════════════════════ */

/** Formatea fecha YYYY-MM-DD → DD-MM-YYYY */
function fmtDate(s) {
  if (!s) return '—';
  const p = s.split('-');
  return p.length === 3 ? `${p[2]}-${p[1]}-${p[0]}` : s;
}

/** Formatea cantidad monetaria: 1234.5 → "1.234,50 €" */
function fmtMoney(n) {
  if (n == null || isNaN(n)) return '0,00 €';
  return n.toLocaleString('es-ES', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }) + ' €';
}

/** Formatea número decimal: 1234.5 → "1.234,50" */
function fmtNum(n) {
  if (n == null || isNaN(n)) return '0,00';
  return n.toLocaleString('es-ES', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

/* ══════════════════════════════════════════════
 *  HELPERS DE DATOS
 * ══════════════════════════════════════════════ */

/**
 * Ordena array de horas por fecha (antiguas→recientes) y luego por horaInicio.
 * Sin fecha van al final. Modifica el array in-place.
 */
function sortHoras(arr) {
  return arr.sort((a, b) => {
    if (!a.fecha && !b.fecha) return 0;
    if (!a.fecha) return 1;
    if (!b.fecha) return -1;
    const cf = a.fecha.localeCompare(b.fecha);
    if (cf !== 0) return cf;
    if (!a.horaInicio && !b.horaInicio) return 0;
    if (!a.horaInicio) return 1;
    if (!b.horaInicio) return -1;
    return a.horaInicio.localeCompare(b.horaInicio);
  });
}

/**
 * Obtiene el nombre del cliente de un proyecto.
 * Soporta formato nuevo (clienteId → entidad) y legacy (cliente string).
 */
function clienteName(p) {
  if (p.clienteId) {
    const cl = D.cl(p.clienteId);
    return cl ? cl.nombre : '';
  }
  return p.cliente || '';
}

/**
 * Comprueba si una fecha YYYY-MM-DD cae dentro de un periodo.
 * @param {string} date  - Fecha YYYY-MM-DD
 * @param {string} type  - 'mes' | 'trim' | 'año'
 * @param {number} year  - Año del periodo
 * @param {number} month - Mes 0-11 (para 'mes' y 'trim')
 */
function inPeriod(date, type, year, month) {
  if (!date) return false;
  const parts = date.split('-');
  const y = parseInt(parts[0]);
  const m = parseInt(parts[1]); /* 1-12 */

  if (type === 'mes') {
    return y === year && m === month + 1;
  }
  if (type === 'trim') {
    const q = Math.floor(month / 3);
    const m1 = q * 3 + 1;
    const m2 = m1 + 2;
    return y === year && m >= m1 && m <= m2;
  }
  return y === year;
}

/** Devuelve la fecha de hoy como string YYYY-MM-DD */
function todayStr() {
  const n = new Date();
  return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}-${String(n.getDate()).padStart(2, '0')}`;
}
