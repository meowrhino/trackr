/* Presupuestos guardados y vencimiento de facturas.
 * - La migración convierte las marcas p.presupuesto {num, fecha} en un registro por número,
 *   con la base correcta en modo por_hora, y no duplica si se vuelve a pasar.
 * - B.vencimiento / B.diasVencida.
 * Ejecutar: node test/presupuestos.mjs */
import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import vm from 'node:vm';

const read = f => readFileSync(new URL('../js/' + f, import.meta.url), 'utf8');
const mem = {};
const ctx = {
  console,
  localStorage: { getItem: k => (k in mem ? mem[k] : null), setItem: (k, v) => { mem[k] = String(v); }, removeItem: k => { delete mem[k]; } },
  navigator: { language: 'es' }, window: {}, document: undefined
};
vm.createContext(ctx);
for (const f of ['utils.js', 'billing.js', 'store.js']) vm.runInContext(read(f), ctx, { filename: f });
/* const/let de los scripts no cuelgan del objeto contexto: se leen desde dentro */
const { D, B } = vm.runInContext('({ D, B })', ctx);

const data = {
  version: 4,
  clientes: [{ id: 'c1', nombre: 'Cliente' }],
  gastos: [], deducibles: [], facturas: [],
  settings: { emisor: {}, defaultIva: 21, defaultIrpf: 15 },
  projects: [
    /* Presupuesto 1: dos proyectos, uno activo → aceptado */
    { id: 'p1', nombre: 'Web', clienteId: 'c1', estado: 'activo', fechas: { inicio: '2026-01-10' }, horas: [],
      facturacion: { modo: 'desde_base', baseImponible: 480, iva: 21, irpf: 15 }, presupuesto: { num: 1, fecha: '2025-12-20' } },
    { id: 'p2', nombre: 'Web grande', clienteId: 'c1', estado: 'potencial', fechas: { inicio: '2026-01-10' }, horas: [],
      facturacion: { modo: 'desde_base', baseImponible: 800, iva: 21, irpf: 15 }, presupuesto: { num: 1, fecha: '2025-12-20' } },
    /* Presupuesto 2: por horas y abandonado → rechazado, base = horas × precio */
    { id: 'p3', nombre: 'Horas', clienteId: 'c1', estado: 'abandonado', fechas: { inicio: '2026-03-01' }, horas: [{ id: 'h1', fecha: '2026-03-02', cantidad: 2.5 }],
      facturacion: { modo: 'por_hora', precioHora: 40, iva: 21, irpf: 15 }, presupuesto: { num: 2, fecha: '2026-02-10' } },
    /* Sin presupuesto: no genera nada */
    { id: 'p4', nombre: 'Nada', clienteId: 'c1', estado: 'activo', fechas: { inicio: '2026-04-01' }, horas: [], facturacion: { modo: 'gratis' } }
  ]
};

D.load(JSON.parse(JSON.stringify(data)));
const buds = D.buds();
assert.equal(buds.length, 2, 'un registro por número de presupuesto');
const b1 = buds.find(b => b.num === 1), b2 = buds.find(b => b.num === 2);
assert.equal(b1.estado, 'aceptado');
assert.equal(b1.lineas.map(l => l.base).join(','), '480,800'); /* (arrays de otro realm: no deepEqual) */
assert.equal(b1.total, roundMoney((480 + 800) * 1.06));
assert.equal(b1.clienteId, 'c1');
assert.equal(b2.estado, 'rechazado');
assert.equal(b2.lineas[0].base, 100, 'por_hora: 2,5 h × 40');

/* Idempotente: volver a pasar ensure (p.ej. al abrir la app otra vez) no duplica */
D.ensure();
assert.equal(D.buds().length, 2);

/* Vencimiento */
const f = { facturaFecha: '2026-10-01', pagado: false };
assert.equal(B.vencimiento(f, 30), '2026-10-31');
assert.equal(B.vencimiento(f, undefined), '2026-10-31', '30 días por defecto');
assert.equal(B.diasVencida(f, 30, '2026-11-05'), 5);
assert.equal(B.diasVencida(f, 30, '2026-10-20'), -11);
assert.equal(B.diasVencida({ ...f, pagado: true }, 30, '2026-11-05'), null, 'pagada: sin vencimiento');
assert.equal(B.diasVencida({}, 30, '2026-11-05'), null, 'sin factura: sin vencimiento');

/* Próximo plazo fiscal */
assert.deepEqual(JSON.parse(JSON.stringify(B.nextTaxDeadline('2026-10-19'))), { label: 'T3 2026', end: '2026-10-20', days: 1, y: 2026, q: 2 });
assert.equal(B.nextTaxDeadline('2026-10-21').label, 'T4 2026');
assert.equal(B.nextTaxDeadline('2026-10-21').end, '2027-01-30');
assert.equal(B.nextTaxDeadline('2027-01-30').days, 0, 'último día cuenta como plazo abierto');
assert.equal(B.nextTaxDeadline('2027-02-01').label, 'T1 2027');

function roundMoney(v) { return Math.round(v * 100) / 100; }
console.log('presupuestos.mjs: ok');
