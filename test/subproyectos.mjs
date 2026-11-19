/* Subproyectos: partes de un proyecto, cada una con nombre e importe.
 * - En «desde base» la base del proyecto es la suma; emitida la factura, se congela.
 * - El presupuesto lleva una línea por subproyecto ({ pid, subId, concepto, base }).
 * - Un presupuesto antiguo con varias líneas del mismo proyecto y sin subId sigue igual.
 * - Horas y €/h por subproyecto.
 * Ejecutar: node test/subproyectos.mjs */
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
vm.runInContext('var App = {};', ctx); /* las vistas cuelgan de App; aquí solo se usa _budRows (texto, sin DOM) */
for (const f of ['utils.js', 'billing.js', 'store.js', 'facturas.js', 'app.facturas-ui.js']) vm.runInContext(read(f), ctx, { filename: f });
const { D, B, Fac, App } = vm.runInContext('({ D, B, Fac, App })', ctx);

const fac = (o = {}) => ({ modo: 'desde_base', baseImponible: 0, iva: 21, irpf: 15, ...o });
const subs = () => [{ id: 's1', nombre: 'Diseño', base: 1000.1 }, { id: 's2', nombre: 'Tienda', base: 2000.2 }, { nombre: 'Formación', base: 640 }];
const viejas = [1, 2, 3, 4, 5].map(i => ({ pid: 'esc', concepto: 'Bloque ' + i, base: 928 }));
const data = {
  version: 4,
  clientes: [{ id: 'c1', nombre: 'Cliente' }],
  gastos: [], deducibles: [], facturas: [],
  settings: { emisor: {}, defaultIva: 21, defaultIrpf: 15 },
  projects: [
    { id: 'web', nombre: 'Web', clienteId: 'c1', estado: 'potencial', fechas: {}, facturacion: fac({ baseImponible: 5 }), subproyectos: subs(),
      horas: [{ id: 'h1', cantidad: 10, subId: 's1' }, { id: 'h2', cantidad: 2.5, subId: 's1' }, { id: 'h3', cantidad: 4 }, { id: 'h4', cantidad: 1, subId: 'borrado' }] },
    { id: 'solo', nombre: 'Logo', clienteId: 'c1', estado: 'potencial', fechas: {}, horas: [], facturacion: fac({ baseImponible: 300 }) },
    /* La Escocesa: desglose hecho a mano antes de existir los subproyectos */
    { id: 'esc', nombre: 'La Escocesa', clienteId: 'c1', estado: 'activo', fechas: {}, horas: [], facturacion: fac({ baseImponible: 4640 }) }
  ],
  presupuestos: [{ id: 'b1', num: 'P1', fecha: '2026-11-10', clienteId: 'c1', lineas: viejas, descripcion: '', total: 4918.4, estado: 'enviado' }]
};
D.load(JSON.parse(JSON.stringify(data)));

/* ── Datos: ids que faltan se rellenan; un proyecto sin subproyectos no se toca ── */
const web = D.p('web');
assert.match(web.subproyectos[2].id, /^[A-Za-z0-9_-]{1,64}$/, 'el subproyecto sin id recibe uno');
assert.ok(!('subproyectos' in D.p('solo')) && !('subproyectos' in D.p('esc')), 'sin subproyectos: no se inventa la lista');

/* ── La base es la suma (al céntimo), y de ahí salen IVA, IRPF y total ── */
B.calc(web);
assert.equal(web.facturacion.baseImponible, 3640.3, '1000,10 + 2000,20 + 640');
assert.equal(web.facturacion.totalFactura, 3858.72, '3640,30 + 764,46 − 546,05 (cada cuota redondeada)');
B.calc(D.p('solo'));
assert.equal(D.p('solo').facturacion.baseImponible, 300, 'sin subproyectos manda la base tecleada');

/* En otro modo los subproyectos se guardan pero no cuentan */
{
  const p = { horas: [], subproyectos: subs(), facturacion: fac({ modo: 'desde_total', total: 1210 }) };
  B.calc(p);
  assert.equal(p.facturacion.baseImponible, 1000);
  assert.equal(B.subs(p).length, 0);
  assert.equal(B.subs(null).length, 0);
}
/* Factura emitida: la base ya no sigue a los subproyectos */
{
  const p = { horas: [], subproyectos: subs(), facturacion: fac({ baseImponible: 3000, facturaNum: 7, facturaFecha: '2026-11-01' }) };
  B.calc(p);
  assert.equal(p.facturacion.baseImponible, 3000);
}

/* ── Horas y €/h por subproyecto (neto = base − 15 % de IRPF) ── */
const st = B.subStats(web);
assert.equal(st.length, 4, 'tres subproyectos + sin asignar');
assert.equal(st[0].horas, 12.5);
assert.equal(st[0].eph, 68.01, '1000,10 × 0,85 ÷ 12,5');
assert.equal(st[1].horas, 0);
assert.equal(st[1].eph, null);
assert.equal(st[3].id, null);
assert.equal(st[3].horas, 5, 'sin subproyecto (4) + de uno borrado (1)');
assert.equal(B.totalHoras(web), 17.5, 'el total del proyecto no cambia');
assert.equal(B.subStats(D.p('solo')).length, 0);

/* ── Presupuesto nuevo: una línea por subproyecto, una por proyecto sin ellos ── */
const filas = html => [...html.matchAll(/<div class="cl-item bud-line" data-pid="([^"]*)"(?: data-sub="([^"]*)")?[^>]*><input type="checkbox" (checked)?[^>]*><input type="text" class="bud-c" value="([^"]*)"[^>]*><input type="number" class="bud-b"[^>]* value="([^"]*)"/g)]
  .map(m => ({ pid: m[1], sub: m[2], on: !!m[3], concepto: m[4], base: m[5] }));
D.d.presupuestos = [];
let rs = filas(App._budRows('c1', [], p => p.id === 'web'));
assert.equal(rs.length, 5, 'web × 3 subproyectos + logo + escocesa');
assert.equal(rs.filter(r => r.pid === 'web').map(r => `${r.sub}|${r.concepto}|${r.base}|${r.on}`).join(' '),
  `s1|Diseño|1000.1|true s2|Tienda|2000.2|true ${web.subproyectos[2].id}|Formación|640|true`);
assert.equal(rs.find(r => r.pid === 'solo').sub, undefined);
assert.equal(rs.find(r => r.pid === 'solo').base, '300');

/* Lo que se guarda al generar: { pid, subId, concepto, base }; el PDF suma las tres */
const lineas = web.subproyectos.map(x => ({ pid: 'web', subId: x.id, concepto: x.nombre, base: x.base }));
const pdf = Fac._budData('c1', lineas, { num: 'P2', fecha: '2026-11-19', validez: 30 }).data;
assert.equal(pdf.lineas.length, 3);
assert.equal(pdf.calculos.base, 3640.3);
assert.equal(pdf.calculos.total, 3858.72);

/* Al editarlo: las guardadas primero y marcadas; un subproyecto nuevo se ofrece sin marcar y no se repite ninguno */
web.subproyectos.push({ id: 's4', nombre: 'Extra', base: 100 });
rs = filas(App._budRows('c1', lineas.slice(0, 2), () => false));
assert.equal(rs.filter(r => r.pid === 'web').map(r => `${r.sub}|${r.on}`).join(' '), `s1|true s2|true ${web.subproyectos[2].id}|false s4|false`);

/* ── Presupuesto antiguo: cinco líneas del mismo proyecto, sin subId ── */
rs = filas(App._budRows('c1', viejas, () => false));
assert.equal(rs.filter(r => r.pid === 'esc').length, 5, 'las cinco siguen, ni una más');
assert.ok(rs.filter(r => r.pid === 'esc').every(r => r.on && r.sub === undefined && r.base === '928'));
assert.equal(Fac._budData('c1', viejas, { num: 'P1', fecha: '2026-11-10' }).data.calculos.total, 4918.4, '4640 + 974,40 − 696');
/* …y sigue igual aunque luego el proyecto gane subproyectos: no se ofrecen, saldrían repetidos */
D.p('esc').subproyectos = [{ id: 'e1', nombre: 'Bloque 1', base: 928 }, { id: 'e2', nombre: 'Bloque 2', base: 3712 }];
rs = filas(App._budRows('c1', viejas, () => false));
assert.equal(rs.filter(r => r.pid === 'esc').length, 5);
assert.ok(rs.every(r => r.pid !== 'esc' || r.sub === undefined));

console.log('subproyectos.mjs: ok');
