/* No perder datos:
 *  - fusión entre dispositivos: gana el lado con número de factura; lo que no tiene id no se pierde
 *    ni se duplica; una factura borrada a propósito no vuelve
 *  - restaurar la copia más antigua (con el historial lleno) la restaura y no la borra
 *  - guardar con el almacenamiento lleno suelta copias viejas y reintenta
 *  - papelera de proyectos
 *  - qué facturas emitidas cambia un archivo al importar (B.facturasCambiadas)
 * Ejecutar: node test/no-perder-datos.mjs */
import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import vm from 'node:vm';

const read = f => readFileSync(new URL('../js/' + f, import.meta.url), 'utf8');
const mem = {};
let cuota = Infinity; /* tamaño máximo (caracteres) de todo el almacenamiento simulado */
const size = (extra = {}) => Object.entries({ ...mem, ...extra }).reduce((s, [k, v]) => s + k.length + v.length, 0);
const ls = {
  getItem: k => (k in mem ? mem[k] : null),
  setItem: (k, v) => { v = String(v); if (size({ [k]: v }) > cuota) { const e = new Error('lleno'); e.name = 'QuotaExceededError'; throw e; } mem[k] = v; },
  removeItem: k => { delete mem[k]; }
};
const avisos = [];
const ctx = { console: { ...console, error() {} }, localStorage: ls, sessionStorage: ls, navigator: { language: 'es' }, window: {}, document: undefined,
  LZString: { compressToUTF16: s => s, decompressFromUTF16: s => s }, setTimeout, clearTimeout, crypto: globalThis.crypto, TextEncoder,
  fetch: async () => ({ status: 500, json: async () => ({}) }), CA: { available: () => true },
  Toast: { show: (m, type) => avisos.push(type), ok() {}, warn() {}, error() {} } };
vm.createContext(ctx);
for (const f of ['utils.js', 'billing.js', 'store.js', 'history.js']) vm.runInContext(read(f), ctx, { filename: f });
vm.runInContext(read('account.js') + '\nthis.Acc = Acc;', ctx, { filename: 'account.js' });
const { D, H, B } = vm.runInContext('({ D, H, B })', ctx);
const merge = ctx.Acc._mergeData;
const base = () => ({ version: 4, clientes: [], gastos: [], deducibles: [], facturas: [], presupuestos: [], audit: [], settings: {}, projects: [] });
const proj = (id, fx = {}, extra = {}) => ({ id, nombre: id, estado: 'activo', fechas: {}, horas: [], facturacion: { modo: 'desde_base', baseImponible: 1000, iva: 21, irpf: 15, cobros: [], ...fx }, ...extra });
const ev = (ts, accion, id, entidad = 'proyecto') => ({ ts, actor: 'local', accion, entidad, entidadId: id });

/* ── Fusión: factura en el portátil, una hora después en el móvil ── */
{
  const portatil = { ...base(), projects: [proj('p1', { facturaNum: 7, facturaFecha: '2026-05-15', diasPago: 0 })], audit: [ev(100, 'editar', 'p1')] };
  const movil = { ...base(), projects: [proj('p1', {}, { nombre: 'Renombrado', horas: [{ id: 'h1', fecha: '2026-05-16', cantidad: 1 }] })], audit: [ev(200, 'editar', 'p1')] };
  for (const m of [merge(movil, portatil), merge(portatil, movil)]) {
    const p = m.projects[0];
    assert.equal(p.facturacion.facturaNum, 7, 'la factura no se pierde');
    assert.equal(p.facturacion.facturaFecha, '2026-05-15'); assert.equal(p.facturacion.diasPago, 0);
    assert.equal(p.horas.length, 1, 'y la hora del móvil tampoco');
    assert.equal(p.nombre, 'Renombrado', 'el resto del proyecto es el del lado tocado más tarde');
  }
  /* Borrada a propósito (D.borrarFactura deja lápida): no vuelve */
  const borrada = { ...base(), projects: [proj('p1')], audit: [ev(300, 'editar', 'p1'), ev(300, 'borrar', 'fac-p1-7', 'facturaEmitida')] };
  assert.equal(merge(borrada, portatil).projects[0].facturacion.facturaNum, undefined, 'una factura borrada no resucita');
  D.load({ ...base(), settings: { nextFacturaNum: 8, nextFacturaYear: '2026' }, projects: [proj('p1', { facturaNum: 7, facturaFecha: '2026-05-15' })] });
  assert.equal(D.borrarFactura('p1'), true);
  assert.ok(D.d.audit.some(e => e.accion === 'borrar' && e.entidadId === 'fac-p1-7'), 'borrarFactura deja la lápida');
  /* Números repetidos tras fusionar */
  D.load({ ...base(), projects: [proj('a', { facturaNum: 7, facturaFecha: '2026-05-15' }), proj('b', { facturaNum: 7, facturaFecha: '2026-06-01' }), proj('c', { facturaNum: 7, facturaFecha: '2027-01-10' })] });
  assert.equal(D.facturasRepetidas().join(), '7/26', 'la 7 de 2027 es otra serie');
}

/* ── Sin id: ni se pierde ni se duplica ── */
{
  const ej = () => JSON.parse(readFileSync(new URL('../examples/dani_formador.json', import.meta.url), 'utf8'));
  const n = d => d.gastos.reduce((s, g) => s + (g.entradas || []).length, 0);
  const total = n(ej());
  assert.ok(total > 100 && ej().gastos.some(g => g.entradas.some(e => !e.id)), 'el ejemplo trae entradas sin id');
  const m = merge(ej(), ej());
  assert.equal(n(m), total, 'tras fusionar siguen todas las entradas de gasto');
  D.load(ej());
  assert.equal(D.d.gastos.every(g => g.entradas.every(e => e.id)), true, 'ensure pone id a todo');
  const ids = D.d.gastos.flatMap(g => g.entradas.map(e => e.id));
  assert.equal(new Set(ids).size, ids.length, 'ids distintos, también para dos entradas iguales');
  /* Un dispositivo ya cargó (tiene ids), el otro viene crudo de la nube: mismos ids, no se duplica */
  assert.equal(n(merge(JSON.parse(JSON.stringify(D.d)), ej())), total);
  const dos = { ...base(), gastos: [{ id: 'g', nombre: 'G', entradas: [{ fecha: '2026-01-01', total: 5 }, { fecha: '2026-01-01', total: 5 }] }] };
  assert.equal(merge(structuredClone(dos), structuredClone(dos)).gastos[0].entradas.length, 2, 'dos entradas idénticas siguen siendo dos');
}

/* ── Restaurar la copia más antigua con el historial lleno ── */
{
  for (const k in mem) delete mem[k];
  D.load({ ...base(), projects: [proj('viejo')] });
  const antigua = H.snapshot();
  const arr = JSON.parse(mem.trackr_history);
  for (let i = 0; i < 9; i++) arr.unshift({ id: 'm' + i, ts: new Date().toISOString(), data: JSON.stringify(base()) });
  mem.trackr_history = JSON.stringify(arr);
  D.load({ ...base(), projects: [proj('nuevo')] });
  assert.equal(H.restore(antigua, true), true);
  assert.equal(D.d.projects[0].id, 'viejo', 'restaura la copia');
  const h = JSON.parse(mem.trackr_history);
  assert.ok(h.some(s => s.id === antigua), 'la copia restaurada sigue en el historial');
  assert.equal(h.length, 10);
  assert.ok(JSON.parse(h[0].data).projects[0].id === 'nuevo', 'y antes guardó el estado que había');
  /* Si no cabe la copia previa, no restaura */
  D.load({ ...base(), projects: [proj('actual')] });
  cuota = size() + 10;
  assert.equal(H.restore(antigua, true), 'nobackup');
  assert.equal(D.d.projects[0].id, 'actual', 'sin copia previa no se toca nada');
  cuota = Infinity;
}

/* ── Guardar con el almacenamiento lleno ── */
{
  for (const k in mem) delete mem[k];
  D.load({ ...base(), projects: [proj('p')] });
  for (let i = 0; i < 6; i++) H.snapshot();
  const copias = () => JSON.parse(mem.trackr_history).length;
  assert.equal(copias(), 6);
  D.d.projects.push(proj('grande', {}, { notas: 'x'.repeat(3000) }));
  cuota = size() + 2500; /* el cambio no cabe si no se suelta alguna copia */
  avisos.length = 0;
  D.save();
  assert.ok(JSON.parse(mem.trackr_data).projects.some(p => p.id === 'grande'), 'el cambio queda guardado');
  assert.ok(copias() < 6 && copias() >= 1, 'a costa de copias viejas, nunca de la última');
  assert.equal(avisos.join(), 'warn', 'y avisa una vez');
  /* Sin copias que soltar: avisa del fallo (y no revienta) */
  mem.trackr_history = '[]'; cuota = size() - 100; avisos.length = 0;
  D.d.projects.push(proj('otra', {}, { notas: 'y'.repeat(5000) }));
  D.save();
  assert.equal(avisos.join(), 'error');
  cuota = Infinity;
}

/* ── Papelera ── */
{
  D.load({ ...base(), projects: [proj('p1', {}, { horas: [{ id: 'h', cantidad: 2, fecha: '2026-01-01' }] }), proj('p2')] });
  D.del('p1');
  assert.equal(D.p('p1'), undefined);
  assert.equal(D.trash().length, 1);
  D.ensure();
  assert.equal(D.trash()[0].proyecto.horas.length, 1, 'en la papelera está entero y sobrevive a una recarga');
  assert.equal(D.restoreP('p1'), true);
  assert.equal(D.p('p1').horas.length, 1); assert.equal(D.trash().length, 0);
  const a = D.d.audit.filter(e => e.entidadId === 'p1').map(e => e.accion).join();
  assert.equal(a, 'borrar,crear', 'para la fusión, recuperado = vivo');
  /* Caduca a los 30 días */
  D.del('p2'); D.d.papelera[0].ts = Date.now() - 31 * 864e5; D.ensure();
  assert.equal(D.trash().length, 0);
}

/* ── Importar: facturas emitidas que el archivo cambia ── */
{
  const a = { ...base(), projects: [proj('f1', { facturaNum: 1, facturaFecha: '2026-11-01', totalFactura: 1060 }), proj('f2', { facturaNum: 2, facturaFecha: '2026-11-02' }), proj('sin')] };
  assert.equal(B.facturasCambiadas(a, structuredClone(a)).length, 0, 'el mismo archivo: nada');
  const b = structuredClone(a);
  b.projects[0].facturacion.baseImponible = 100; /* el total del JSON sigue diciendo 1060: se recalcula */
  b.projects.splice(1, 1);
  b.projects[1].facturacion.baseImponible = 5;   /* proyecto sin factura: no es asunto de este aviso */
  const ch = B.facturasCambiadas(a, b);
  assert.equal(ch.length, 2);
  assert.equal(ch[0].num, '1/26');
  assert.equal(JSON.stringify(ch[0].cambios.map(c => c.campo)), '["baseImponible","totalFactura"]');
  assert.equal(ch[0].cambios[1].antes, 1060); assert.equal(ch[0].cambios[1].despues, 106);
  assert.equal(ch[1].num, '2/26'); assert.equal(ch[1].gone, true);
  const c = structuredClone(a); c.projects[0].facturacion.facturaNum = 9; c.projects[0].facturacion.facturaFecha = '2026-12-01';
  assert.equal(JSON.stringify(B.facturasCambiadas(a, c)[0].cambios.map(x => x.campo)), '["num","fecha"]');
}

console.log('no-perder-datos: ok');
