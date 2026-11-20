/* Numeración de facturas y NIF:
 *  - «2026/033» ya no se convierte en la factura 2026 (parseFacNum), y el contador no salta a 2027
 *  - avisos de huecos y de fechas fuera de orden (D.facturaAvisos)
 *  - volver a bajar una factura emitida no cambia su número, su fecha ni el contador
 *  - carácter de control de DNI, NIE y CIF (nifCheck)
 * Ejecutar: node test/facturas-numeracion.mjs */
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
const { D, parseFacNum, nifCheck } = vm.runInContext('({ D, parseFacNum, nifCheck })', ctx);

/* ── Número tecleado ── */
assert.equal(parseFacNum('33'), 33);
assert.equal(parseFacNum(' 047 '), 47, 'los ceros de delante no cuentan');
for (const malo of ['2026/033', '2026-031', '33/26', 'A12', '0', '-3', '1.5', '']) assert.equal(parseFacNum(malo), null, malo);

/* ── Avisos ── */
const fac = (id, num, fecha, extra = {}) => ({ id, nombre: id, estado: 'completado', fechas: {}, horas: [],
  facturacion: { modo: 'desde_base', baseImponible: 100, iva: 21, irpf: 15, facturaNum: num, facturaFecha: fecha, ...extra } });
D.load({ version: 4, clientes: [], gastos: [], deducibles: [], facturas: [], settings: { nextFacturaNum: 10, nextFacturaYear: '2026' },
  projects: [fac('a', 8, '2026-05-10'), fac('b', 9, '2026-06-20'), fac('nuevo', null, null)] });
const tipos = (num, fecha) => D.facturaAvisos(num, fecha, 'nuevo').map(a => a.tipo).join();
assert.equal(tipos(10, '2026-07-01'), '', 'la que toca, con fecha posterior: sin avisos');
assert.equal(JSON.stringify(D.facturaAvisos(2026, '2026-07-01', 'nuevo')), '[{"tipo":"hueco","toca":10,"hasta":2025}]', 'saltar de la 10 a la 2026 avisa');
assert.equal(tipos(10, '2026-06-01'), 'fechaAntes', 'la 10 con fecha anterior a la 9');
assert.equal(JSON.stringify(D.facturaAvisos(10, '2026-06-01', 'nuevo')[0]), '{"tipo":"fechaAntes","num":9,"fecha":"2026-06-20"}');
D.d.projects.push(fac('c', 11, '2026-07-05'));
assert.equal(tipos(10, '2026-08-01'), 'fechaDespues', 'la 10 con fecha posterior a la 11');
assert.equal(tipos(1, '2027-01-03'), '', 'año nuevo: vuelve a empezar en 1 y no mira las de 2026');

/* ── El contador: emitir la que toca lo avanza; volver a bajar una ya emitida no lo mueve ── */
D.d.projects.pop();
assert.equal(D.nextFacturaNum('2026-07-01'), 10);
D.bumpFacturaNum(10, '2026-07-01');
assert.equal(D.d.settings.nextFacturaNum, 11);
D.bumpFacturaNum(8, '2026-05-10'); /* re-descarga de la 8 */
assert.equal(D.d.settings.nextFacturaNum, 11, 'volver a bajar la 8 no mueve el contador');

/* ── NIF ── */
const ok = s => nifCheck(s).ok;
assert.equal(ok('12345678Z'), true);
assert.equal(ok('12345678X'), false);
assert.equal(nifCheck('24398712K').esperado, 'J', 'dice qué letra sería');
assert.equal(ok('43123456-c'), true, 'guion y minúscula no importan');
assert.equal(ok('X1234567L'), true, 'NIE');
assert.equal(ok('Y1234567L'), false);
assert.equal(ok('B12345674'), true, 'CIF de S.L.: control en cifra');
assert.equal(ok('B12345678'), false);
assert.equal(nifCheck('B12345678').esperado, '4');
assert.equal(ok('Q2826000H'), true, 'CIF de organismo público: control en letra');
assert.equal(ok('P0801900B'), true, 'ayuntamiento');
assert.equal(ok('DE123456789'), null, 'NIF-IVA de otro país: no se opina');
assert.equal(ok(''), null);

console.log('facturas-numeracion: ok');
