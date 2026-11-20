/* Frontera de datos (D.ensure): lo que llega de un JSON importado, de la nube o de la gestoría
 * se queda con su tipo. Un «estado» o una «categoría» con HTML dentro ejecutaba código al pintar;
 * un importe como texto ("1200") daba totales disparatados; una lista rota rompía la app.
 * Y la gestoría no puede cambiar una factura emitida (GOps).
 * Ejecutar: node test/tipos-ensure.mjs */
import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import vm from 'node:vm';

const read = f => readFileSync(new URL('../js/' + f, import.meta.url), 'utf8');
const mem = {};
const ctx = { console, navigator: { language: 'es' }, window: {}, document: undefined,
  localStorage: { getItem: k => (k in mem ? mem[k] : null), setItem: (k, v) => { mem[k] = String(v); }, removeItem: k => { delete mem[k]; } } };
vm.createContext(ctx);
for (const f of ['utils.js', 'billing.js', 'store.js', 'gestor-ops.js']) vm.runInContext(read(f), ctx, { filename: f });
const { D, B, GOps, parseNum } = vm.runInContext('({ D, B, GOps, parseNum })', ctx);
const X = '<img src=x onerror=alert(1)>';

/* ── parseNum ── */
assert.equal(parseNum('12,50'), 12.5);
assert.equal(parseNum('12.50'), 12.5);
assert.equal(parseNum('1.250,50'), 1250.5);
assert.equal(parseNum(' 2,5 '), 2.5);
assert.equal(parseNum(7), 7);
for (const malo of ['', 'abc', '1,2,3', '12€', null, undefined, {}, true]) assert.ok(Number.isNaN(parseNum(malo)), String(malo));

/* ── Tipos: nada de HTML donde va un número, una fecha, un color o una lista cerrada ── */
D.load({
  version: 4,
  clientes: [{ id: 'c1' }, null, { id: 'c2', nombre: 'Ok', color: X, zonaFiscal: X }],
  projects: [{ id: 'p1', nombre: 'P', estado: X, color: 'red" onmouseover="x', clienteId: 'c1', fechas: { inicio: X, finReal: '2026-03-01' },
    horas: [null, 'x', { id: 'h1', cantidad: '2,5', fecha: X, horaInicio: X, tipo: X, monto: X }],
    facturacion: { modo: X, baseImponible: '1200', iva: X, irpf: '15', facturaNum: X, facturaFecha: X, diasPago: X, idiomaFactura: X,
      cobros: [{ id: 'k1', cantidad: '100,50', fecha: X, metodo: X }, 3] } },
    { id: 'p2', nombre: 'Emitida', estado: 'completado', horas: [], facturacion: { modo: 'desde_base', baseImponible: 1000, iva: 21, irpf: 15, facturaNum: '7', facturaFecha: '2026-05-15' } }],
  gastos: [{ id: 'g1', nombre: 'G', categoria: X, recurrente: X, color: X, tipoIva: X, diaRecurrente: 99, entradas: {} },
    { id: 'g2', nombre: 'Viejo', categoria: 'viaje', entradas: [{ id: 'e1', fecha: '2026-01-01', base: '10', iva: '2,10', total: 12.1 }] }],
  deducibles: [{ id: 'd1', categoria: X, cantidad: '50', fecha: X }],
  presupuestos: [{ id: 'b1', num: X, fecha: X, estado: X, total: X, lineas: 'x' }],
  facturas: {}, audit: 'x',
  settings: { defaultIva: X, tema: X, idioma: X, nextFacturaNum: X, nextFacturaYear: X, emisor: { nombre: 'Yo', nif: 123 } }
});
const d = D.d, p = d.projects[0], f = p.facturacion;
assert.ok(!JSON.stringify(d).includes('<img'), 'no queda HTML en ningún campo tipado');
assert.ok(!JSON.stringify(d).includes('onmouseover'), 'ni en el color');
assert.equal(d.clientes.length, 2, 'el cliente null se tira');
assert.equal(d.clientes[0].nombre, '', 'un cliente sin nombre no rompe la lista');
assert.equal(D.cls().length, 2);
assert.equal(p.estado, 'activo'); assert.equal(p.color, 'CornflowerBlue');
assert.equal(p.fechas.inicio, null); assert.equal(p.fechas.finReal, '2026-03-01');
assert.equal(p.horas.length, 1); assert.equal(p.horas[0].cantidad, 2.5); assert.equal(p.horas[0].tipo, 'trabajo');
assert.equal(f.modo, 'gratis'); assert.equal(f.baseImponible, 1200); assert.equal(f.iva, 0); assert.equal(f.irpf, 15);
assert.equal(f.facturaNum, null); assert.equal(f.facturaFecha, null); assert.equal(f.diasPago, undefined);
assert.equal(f.cobros.length, 1); assert.equal(f.cobros[0].cantidad, 100.5); assert.equal(f.cobros[0].metodo, undefined);
assert.equal(d.projects[1].facturacion.facturaNum, 7, 'un número de factura como texto pasa a número');
assert.equal(d.gastos[0].categoria, 'otro'); assert.equal(d.gastos[0].diaRecurrente, null); assert.equal(d.gastos[0].entradas.length, 0);
assert.equal(d.gastos[1].categoria, 'viaje', 'una categoría vieja pero limpia se conserva');
assert.equal(d.gastos[1].entradas[0].iva, 2.1);
assert.equal(d.deducibles[0].cantidad, 50); assert.equal(d.deducibles[0].fecha, null);
assert.equal(d.presupuestos[0].estado, 'enviado'); assert.equal(d.presupuestos[0].lineas.length, 0); assert.equal(d.presupuestos[0].total, 0);
assert.ok(Array.isArray(d.facturas) && Array.isArray(d.audit));
assert.equal(d.settings.defaultIva, 0); assert.equal(d.settings.tema, 'oscuro'); assert.equal(d.settings.idioma, 'es');
assert.equal(d.settings.nextFacturaNum, 1); assert.equal(d.settings.nextFacturaYear, undefined); assert.equal(d.settings.emisor.nif, '123');

/* Datos normales: ensure no los toca */
const bueno = { version: 4, clientes: [{ id: 'c', nombre: 'A', color: 'Teal', zonaFiscal: 'ue', nombreCompleto: '' }],
  projects: [{ id: 'p', nombre: 'P', estado: 'pausado', color: '#ff0000', interno: false, recurrente: true, fechas: { inicio: '2026-01-02', finEstimada: null, finReal: null },
    horas: [{ id: 'h', cantidad: 1.25, fecha: null, horaInicio: '09:30', tipo: 'reunion', monto: 20 }],
    facturacion: { modo: 'desde_total', total: 121, iva: 21, irpf: 0, facturaNum: 3, facturaFecha: '2026-02-01', diasPago: 0, idiomaFactura: 'en',
      cobros: [{ id: 'k', cantidad: 50, fecha: '2026-02-10', metodo: 'bizum' }], anulada: { fecha: '2026-03-01' } } }],
  gastos: [], deducibles: [], facturas: [], presupuestos: [{ id: 'b', num: 'P2', fecha: '2026-01-05', estado: 'aceptado', total: 10, lineas: [{ pid: 'p', concepto: 'x', base: 10 }] }], audit: [], settings: {} };
D.load(structuredClone(bueno));
for (const k of ['clientes', 'presupuestos']) assert.equal(JSON.stringify(D.d[k]), JSON.stringify(bueno[k]), k);
const q = D.d.projects[0];
assert.equal(q.estado, 'pausado'); assert.equal(q.color, '#ff0000'); assert.equal(q.recurrente, true);
assert.equal(JSON.stringify(q.horas), JSON.stringify(bueno.projects[0].horas));
for (const k of ['modo', 'total', 'iva', 'irpf', 'facturaNum', 'facturaFecha', 'diasPago', 'idiomaFactura']) assert.equal(q.facturacion[k], bueno.projects[0].facturacion[k], k);
assert.equal(JSON.stringify(q.facturacion.cobros), JSON.stringify(bueno.projects[0].facturacion.cobros));
assert.equal(q.facturacion.anulada.fecha, '2026-03-01');

/* ── La gestoría y las facturas ── */
const pr = (id, fx) => ({ id, nombre: id, estado: 'activo', fechas: {}, horas: [], facturacion: { modo: 'desde_base', baseImponible: 1000, iva: 21, irpf: 15, cobros: [], ...fx } });
D.load({ version: 4, clientes: [], gastos: [], deducibles: [], facturas: [], settings: {}, projects: [pr('emitida', { facturaNum: 7, facturaFecha: '2026-05-15', diasPago: 30 }), pr('libre')] });
const op = (id, fac, extra = {}) => GOps.apply({ v: 1, accion: 'editar', entidad: 'proyecto', entidadId: id, payload: { ...extra, facturacion: { ...D.p(id).facturacion, ...fac } } });
const emi = () => D.p('emitida').facturacion;
assert.equal(op('emitida', { baseImponible: '1200' }).ok, false, 'no cambia la base de una factura emitida');
assert.equal(op('emitida', { baseImponible: 1200 }).ok, false);
assert.equal(op('emitida', { facturaNum: 99 }).ok, false, 'ni el número');
assert.equal(op('emitida', { facturaFecha: '2026-11-19' }).ok, false, 'ni la fecha');
assert.equal(op('emitida', { iva: 0 }).ok, false);
assert.equal(op('emitida', { anulada: { fecha: '2026-06-01' } }).ok, false, 'ni la anula');
assert.equal(op('emitida', { rectificativas: [{ id: 'r', num: 'R1', base: -100 }] }).ok, false, 'ni la rectifica');
assert.equal(emi().baseImponible, 1000); assert.equal(emi().facturaNum, 7); assert.equal(emi().facturaFecha, '2026-05-15');
/* Sí puede: apuntar un cobro, cambiar el asunto o el nombre (lo que hace saveP al guardar) */
B.calc(D.p('emitida'));
assert.equal(op('emitida', { cobros: [{ id: 'k', fecha: '2026-06-01', cantidad: 500 }], asuntoFactura: 'Otro asunto' }, { nombre: 'Nuevo nombre' }).ok, true);
assert.equal(emi().cobros.length, 1); assert.equal(D.p('emitida').nombre, 'Nuevo nombre');
/* Proyecto sin factura: cambia importes, pero no puede emitirla él */
assert.equal(op('libre', { baseImponible: 1500 }).ok, true);
assert.equal(op('libre', { facturaNum: 8, facturaFecha: '2026-06-01' }).ok, false, 'las facturas las emite la persona');
assert.equal(GOps.apply({ v: 1, accion: 'crear', entidad: 'proyecto', entidadId: 'nuevo', payload: { nombre: 'N', facturacion: { modo: 'desde_base', baseImponible: 10, facturaNum: 9, facturaFecha: '2026-06-01' } } }).ok, false);
assert.equal(GOps.apply({ v: 1, accion: 'crear', entidad: 'proyecto', entidadId: 'nuevo', payload: { nombre: 'N', facturacion: { modo: 'desde_base', baseImponible: '10' } } }).ok, true);
D.ensure(); /* lo que hace account.js tras aplicar las ops */
assert.equal(D.p('nuevo').facturacion.baseImponible, 10, 'un importe como texto pasa a número');
/* Deshacer (la persona, sobre lo suyo) no pasa por esta frontera */
assert.equal(GOps.apply({ v: 1, accion: 'editar', entidad: 'proyecto', entidadId: 'emitida', payload: { facturacion: { ...emi(), baseImponible: 900 } } }, true).ok, true);

console.log('tipos-ensure: ok');
