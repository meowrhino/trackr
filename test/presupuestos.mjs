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
for (const f of ['utils.js', 'billing.js', 'store.js', 'fiscal.js']) vm.runInContext(read(f), ctx, { filename: f });
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

/* Migración con IRPF distinto por proyecto: cada línea con el suyo (mary garlic: 800 sin IRPF + 480 al 7 %) */
{
  const d2 = JSON.parse(JSON.stringify(data));
  d2.projects = [
    { id: 'm1', nombre: 'Ecommerce', clienteId: 'c1', estado: 'potencial', fechas: {}, horas: [], facturacion: { modo: 'desde_base', baseImponible: 800, iva: 21, irpf: 0 }, presupuesto: { num: 11, fecha: '2026-10-19' } },
    { id: 'm2', nombre: 'Web', clienteId: 'c1', estado: 'potencial', fechas: {}, horas: [], facturacion: { modo: 'desde_base', baseImponible: 480, iva: 21, irpf: 7 }, presupuesto: { num: 11, fecha: '2026-10-19' } }
  ];
  D.load(d2);
  assert.equal(D.buds()[0].total, 1515.2, '1280 + 268,80 IVA − 33,60 IRPF');

  /* Serie P por año: el antiguo 11 no cuenta; P1, P2… y en enero vuelve a P1 */
  assert.equal(D.nextBudNum('2026-11-17'), 'P1');
  D.addBud({ id: 'b1', num: 'P1', fecha: '2026-11-17', clienteId: 'c1', lineas: [], estado: 'enviado' });
  D.addBud({ id: 'b2', num: 'P2', fecha: '2026-12-01', clienteId: 'c1', lineas: [], estado: 'enviado' });
  assert.equal(D.nextBudNum('2026-12-20'), 'P3');
  assert.equal(D.nextBudNum('2027-01-02'), 'P1');
  assert.ok(D.budNumTaken('P2', '2026-05-01'), 'P2 ya existe en 2026');
  assert.ok(!D.budNumTaken('P2', '2027-05-01'), 'en 2027 está libre');
  assert.ok(!D.budNumTaken('P2', '2026-05-01', 'b2'), 'el propio no cuenta');
  D.load(JSON.parse(JSON.stringify(data)));
}

/* Borrar un presupuesto: desaparece, su número queda libre, no vuelve al abrir la app
   y la marca del proyecto pasa al presupuesto que aún lo incluye (o se quita) */
{
  D.load(JSON.parse(JSON.stringify(data)));
  D.addBud({ id: 'bx', num: 'P1', fecha: '2026-11-19', clienteId: 'c1', lineas: [{ pid: 'p1', concepto: 'Web', base: 480 }], estado: 'enviado' });
  D.addBud({ id: 'by', num: 'P2', fecha: '2026-11-20', clienteId: 'c1', lineas: [{ pid: 'p1', concepto: 'Web', base: 500 }, { pid: 'p4', concepto: 'Nada', base: 10 }], estado: 'enviado' });
  D.up('p1', { presupuesto: { num: 'P2', fecha: '2026-11-20' } });
  D.up('p4', { presupuesto: { num: 'P2', fecha: '2026-11-20' } });
  assert.equal(D.nextBudNum('2026-11-21'), 'P3');
  D.delBud('by');
  assert.ok(!D.bud('by'));
  assert.equal(D.nextBudNum('2026-11-21'), 'P2', 'el número borrado queda libre');
  assert.equal(D.p('p1').presupuesto.num, 'P1', 'la marca pasa al más reciente que lo incluye');
  assert.equal(D.p('p4').presupuesto, null, 'sin otro presupuesto: sin marca');
  assert.equal(D.d.audit.filter(e => e.accion === 'borrar' && e.entidad === 'presupuesto' && e.entidadId === 'by').length, 1, 'lápida para la fusión');
  const n = D.buds().length;
  D.ensure();
  assert.equal(D.buds().length, n, 'la migración de marcas no lo resucita');
  D.delBud('no-existe');
  assert.equal(D.buds().length, n);
  D.load(JSON.parse(JSON.stringify(data)));
}

/* Vencimiento */
const f = { facturaFecha: '2026-10-01', pagado: false };
assert.equal(B.vencimiento(f, 30), '2026-10-31');
assert.equal(B.vencimiento(f, undefined), '2026-10-31', '30 días por defecto');
assert.equal(B.diasVencida(f, 30, '2026-11-05'), 5);
assert.equal(B.vencimiento({ ...f, diasPago: 15 }, 30), '2026-10-16', 'los días de la factura mandan sobre Configuración');
assert.equal(B.vencimiento({ ...f, diasPago: 0 }, 30), '2026-10-01', '0 días en la factura = al contado');
assert.equal(B.diasVencida(f, 30, '2026-10-20'), -11);
assert.equal(B.diasVencida({ ...f, pagado: true }, 30, '2026-11-05'), null, 'pagada: sin vencimiento');
assert.equal(B.diasVencida({}, 30, '2026-11-05'), null, 'sin factura: sin vencimiento');

/* 303: un gasto sin IVA (cuota de autónomos) cuenta en el 130 pero no en la casilla 28 */
{
  const { F } = vm.runInContext('({ F })', ctx);
  D.d.gastos = [
    { id: 'g1', nombre: 'Cuota autónomos', desgravable: true, tipoIva: 0, entradas: [{ id: 'e1', fecha: '2026-05-31', base: 88.56, iva: 0, total: 88.56 }] },
    { id: 'g2', nombre: 'Software', desgravable: true, tipoIva: 21, entradas: [{ id: 'e2', fecha: '2026-05-01', base: 100, iva: 21, total: 121 }] }
  ];
  D.d.deducibles = [];
  const q = F.quarter(2026, 1);
  assert.equal(Math.round(q.gastos * 100) / 100, 188.56, '130: los dos gastos');
  assert.equal(q.ivaSop[21].base, 100, '303 casilla 28: solo la base con IVA');
  assert.equal(q.ivaSop[21].cuota, 21);
  assert.equal(Object.keys(q.ivaSop).length, 1, 'sin fila para el gasto sin IVA');
}

/* 130: cada casilla redondeada a céntimos antes de seguir (como el modelo presentado) */
{
  const { F } = vm.runInContext('({ F })', ctx);
  D.d.settings.fiscal = { eds: false };
  D.d.projects = [
    /* B.calc recalcula los importes: la retención sale del tipo (7 % de 1500 = 105) */
    { id: 'p1', nombre: 'A', estado: 'completado', fechas: {}, horas: [], facturacion: { modo: 'desde_base', baseImponible: 1500, iva: 21, irpf: 7, facturaNum: 1, facturaFecha: '2026-02-10' } },
    { id: 'p1b', nombre: 'A2', estado: 'completado', fechas: {}, horas: [], facturacion: { modo: 'desde_base', baseImponible: 850, iva: 21, irpf: 0, facturaNum: 3, facturaFecha: '2026-03-10' } },
    { id: 'p2', nombre: 'B', estado: 'completado', fechas: {}, horas: [], facturacion: { modo: 'desde_base', baseImponible: 1820, iva: 21, irpf: 0, importeIrpf: 0, facturaNum: 2, facturaFecha: '2026-05-10' } }
  ];
  D.d.gastos = [
    { id: 'g1', nombre: 'T1', desgravable: true, tipoIva: 21, entradas: [{ id: 'e1', fecha: '2026-02-01', base: 944.86, iva: 198.42, total: 1143.28 }] },
    { id: 'g2', nombre: 'T2', desgravable: true, tipoIva: 21, entradas: [{ id: 'e2', fecha: '2026-05-01', base: 1620.02, iva: 340.20, total: 1960.22 }] }
  ];
  const r = F.calc130Year(2026, 1);
  assert.equal(r[0].c04, 281.03, '04 T1 = 20 % de 1405,14 redondeado');
  assert.equal(r[0].c07, 176.03);
  assert.equal(r[1].c04, 321.02, '04 T2 = 20 % de 1605,12 → 321,024 → 321,02');
  assert.equal(r[1].c07, 39.99, '07 T2 = 321,02 − 176,03 − 105 (no 40,00)');
}

/* Próximo plazo fiscal */
assert.deepEqual(JSON.parse(JSON.stringify(B.nextTaxDeadline('2026-10-19'))), { label: 'T3 2026', end: '2026-10-20', days: 1, y: 2026, q: 2, start: '2026-10-01', open: true, domEnd: '2026-10-15', domDays: -4 });
assert.equal(B.nextTaxDeadline('2026-10-21').label, 'T4 2026');
assert.equal(B.nextTaxDeadline('2026-10-21').end, '2027-02-01', '30 ene 2027 es sábado: pasa al lunes');
assert.equal(B.nextTaxDeadline('2026-11-10').open, false, 'en noviembre el T4 aún no se puede presentar');
assert.equal(B.nextTaxDeadline('2027-01-05').open, true);
assert.equal(B.nextTaxDeadline('2027-01-05').domEnd, '2027-01-27');
assert.equal(B.nextTaxDeadline('2027-02-01').days, 0, 'último día cuenta como plazo abierto');
assert.equal(B.nextTaxDeadline('2027-02-02').label, 'T1 2027');

function roundMoney(v) { return Math.round(v * 100) / 100; }
console.log('presupuestos.mjs: ok');
