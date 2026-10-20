/* Gasto con varios tipos de IVA en una sola entrada (ticket mixto 21 % + 4 %).
 * - El 303 reparte cada línea en su casilla.
 * - Los libros sacan una fila por tipo, mismo nº de factura.
 * - Sin desglose todo sigue igual (tipo del gasto).
 * Ejecutar: node test/gastos-desglose.mjs */
import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import vm from 'node:vm';

const read = f => readFileSync(new URL('../js/' + f, import.meta.url), 'utf8');
const mem = {};
const ctx = {
  console,
  localStorage: { getItem: k => (k in mem ? mem[k] : null), setItem: (k, v) => { mem[k] = String(v); }, removeItem: k => { delete mem[k]; } },
  navigator: { language: 'es' }, window: {}, document: undefined, currentLocale: 'es'
};
vm.createContext(ctx);
for (const f of ['utils.js', 'billing.js', 'store.js', 'fiscal.js', 'libros.js']) vm.runInContext(read(f), ctx, { filename: f });
const { D, F, LR } = vm.runInContext('({ D, F, LR })', ctx);

D.load({
  version: 4, clientes: [], projects: [], deducibles: [], facturas: [],
  settings: { emisor: {}, defaultIva: 21, defaultIrpf: 15 },
  gastos: [
    /* Ticket mixto: 11,80 al 21 % + 3,10 al 4 % = base 14,90, IVA 2,60, total 17,50 */
    { id: 'g1', nombre: 'Piera', categoria: 'oficina', desgravable: true, tipoIva: 21, zonaFiscal: 'es', nifProveedor: 'B65791477',
      entradas: [{ id: 'e1', fecha: '2026-09-08', base: 14.9, iva: 2.6, irpf: 0, total: 17.5, tipoIva: 21, numFactura: 'V15F/19.153',
        desglose: [{ tipoIva: 21, base: 11.8, iva: 2.48 }, { tipoIva: 4, base: 3.1, iva: 0.12 }] }] },
    /* Sin desglose: va entero al tipo del gasto */
    { id: 'g2', nombre: 'Hosting', categoria: 'software', desgravable: true, tipoIva: 21, zonaFiscal: 'es', nifProveedor: 'B11111111',
      entradas: [{ id: 'e2', fecha: '2026-09-01', base: 100, iva: 21, irpf: 0, total: 121, tipoIva: 21, numFactura: 'H-1' }] }
  ]
});

const q = F.quarter(2026, 2);
assert.equal(q.ivaSop[21].base, 111.8);
assert.equal(+q.ivaSop[21].cuota.toFixed(2), 23.48);
assert.equal(q.ivaSop[4].base, 3.1);
assert.equal(q.ivaSop[4].cuota, 0.12);
assert.equal(+q.gastos.toFixed(2), 114.9, 'el 130 suma las bases de todas las líneas');

const { rec } = LR.buildRows(2026, 2);
const piera = rec.filter(r => r.K === 'V15F/19.153');
assert.equal(piera.length, 2, 'una fila por tipo');
assert.equal(JSON.stringify(piera.map(r => [r.AB, r.AA, r.AC, r.Z])), '[[21,11.8,2.48,17.5],[4,3.1,0.12,17.5]]');
assert.equal(rec.filter(r => r.K === 'H-1').length, 1);

console.log('gastos-desglose.mjs: ok');
