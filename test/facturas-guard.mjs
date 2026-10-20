/* Guardas de facturación: nº de factura único, y proyecto/cliente facturados no se borran.
 * Ejecutar: node test/facturas-guard.mjs */
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
const { D } = vm.runInContext('({ D })', ctx);

D.d = { version: 4, clientes: [], gastos: [], deducibles: [], facturas: [], settings: {}, projects: [] };
D.d.projects = [
  { id: 'a', nombre: 'A', clienteId: 'c1', facturacion: { facturaNum: 5 } },
  { id: 'b', nombre: 'B', clienteId: 'c1', facturacion: {} },
  { id: 'c', nombre: 'C', clienteId: 'c2', facturacion: { facturaNum: 6 } }
];
D.d.facturas = [{ id: 'f6', tipoRegistro: 'alta', proyectoId: 'c', eventos: [{ tipo: 'anulada' }] }];

/* número único: otro proyecto lo usa → lo devuelve; el propio proyecto (re-generar) no cuenta */
assert.equal(D.facturaNumTaken(5, 'b').id, 'a');
assert.equal(D.facturaNumTaken(5, 'a'), undefined);
assert.equal(D.facturaNumTaken(7, 'b'), undefined);
assert.equal(D.facturaNumTaken(6, 'b').id, 'c', 'una anulada sigue gastando su número');

/* proyecto: vigente solo si tiene número y no está anulada */
assert.equal(D.facturaVigente('a'), true);
assert.equal(D.facturaVigente('b'), false, 'sin factura');
assert.equal(D.facturaVigente('c'), false, 'anulada');

/* cliente: facturado si algún proyecto suyo tiene número (aunque esté anulada) */
assert.equal(D.clienteFacturado('c1'), true);
assert.equal(D.clienteFacturado('c2'), true);
assert.equal(D.clienteFacturado('c3'), false);
D.d.projects.splice(0, 1);
assert.equal(D.clienteFacturado('c1'), false);

console.log('facturas-guard: ok');
