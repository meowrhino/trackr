/* Modelo 130 acumulativo: 05 (pagos anteriores), 13 (minoración) y 15 (negativos del año).
 * Año con rendimiento anterior de 11.500 € (minoración 25 €/trimestre):
 *  1T: 1.000 base (ret. 150) y 200 de gastos → 07 = 2, 19 = −23
 *  2T: solo 500 de gastos → 07 negativo, 19 = −25 (pendiente 48)
 *  3T: 5.000 base (ret. 750) → 07 = 105, 05 = 2, 15 = 48, 19 = 32
 * Ejecutar: node test/modelo-130.mjs */
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
const { D, F } = vm.runInContext('({ D, F })', ctx);

const fac = (id, fecha, base) => ({ id, nombre: id, clienteId: 'c1', estado: 'completado', fechas: { inicio: fecha }, horas: [],
  facturacion: { modo: 'desde_base', baseImponible: base, iva: 21, irpf: 15, facturaFecha: fecha, facturaNum: 1 } });
const gasto = (id, fecha, base) => ({ id, nombre: id, categoria: 'otro', desgravable: true, tipoIva: 21, zonaFiscal: 'es',
  entradas: [{ id: id + 'e', fecha, base, iva: base * 0.21, irpf: 0, total: base * 1.21, tipoIva: 21 }] });
D.load({
  version: 4, clientes: [{ id: 'c1', nombre: 'Cliente' }], deducibles: [], facturas: [],
  settings: { emisor: {}, defaultIva: 21, defaultIrpf: 15, fiscal: { eds: true, rendAnterior: 11500 } },
  projects: [fac('p1', '2026-02-10', 1000), fac('p2', '2026-08-10', 5000)],
  gastos: [gasto('g1', '2026-01-15', 200), gasto('g2', '2026-05-15', 500)]
});

const r = F.calc130Year(2026, 2);
const [q1, q2, q3] = r;
assert.equal(q1.c01, 1000); assert.equal(q1.c02, 240); assert.equal(q1.c04, 152); assert.equal(q1.c06, 150);
assert.equal(q1.c07, 2); assert.equal(q1.c13, 25); assert.equal(q1.c19, -23);
assert.equal(q2.c01, 1000); assert.equal(q2.c02, 715); assert.equal(q2.c07, -95); assert.equal(q2.c12, 0); assert.equal(q2.c19, -25);
assert.equal(q3.c01, 6000); assert.equal(q3.c02, 965); assert.equal(q3.c04, 1007);
assert.equal(q3.c05, 2, 'solo los 07 positivos anteriores');
assert.equal(q3.c06, 900); assert.equal(q3.c07, 105);
assert.equal(q3.c15, 48, 'los negativos del año se descuentan');
assert.equal(q3.c19, 32);
/* Sin minoración ni EDS: la 02 es el gasto tal cual y la 19 = 07 */
D.d.settings.fiscal = { eds: false, rendAnterior: null };
const s = F.calc130Year(2026, 0)[0];
assert.equal(s.c02, 200); assert.equal(s.c13, 0); assert.equal(s.c19, s.c07);
console.log('modelo-130.mjs: ok');
