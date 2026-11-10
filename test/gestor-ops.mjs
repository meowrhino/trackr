/* Frontera de las ops del gestor (lado persona): ids raros o tipos rotos se rechazan
 * y no dejan rastro en los datos. Ejecutar: node test/gestor-ops.mjs */
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
for (const f of ['utils.js', 'billing.js', 'store.js', 'gestor-ops.js']) vm.runInContext(read(f), ctx, { filename: f });
const { D, GOps } = vm.runInContext('({ D, GOps })', ctx);
D.load({ version: 4, clientes: [{ id: 'c1', nombre: 'Cliente' }], projects: [], gastos: [], deducibles: [], facturas: [], settings: { fiscal: {} } });
const bad = "x');alert(1);('";

let r = GOps.apply({ v: 1, accion: 'crear', entidad: 'cliente', entidadId: bad, payload: { nombre: 'Acme' } });
assert.equal(r.ok, false, 'entidadId con comillas');
assert.equal(D.d.clientes.length, 1);

r = GOps.apply({ v: 1, accion: 'editar', entidad: 'cliente', entidadId: 'c1', payload: { id: bad, nombre: 'Nuevo' } });
assert.equal(r.ok, true, 'el id del payload se ignora, el resto se aplica');
assert.equal(D.d.clientes[0].id, 'c1');
assert.equal(D.d.clientes[0].nombre, 'Nuevo');

r = GOps.apply({ v: 1, accion: 'crear', entidad: 'gasto', entidadId: 'g1', payload: { nombre: 'x', entradas: [{ id: bad, total: 1 }] } });
assert.equal(r.ok, false, 'id raro dentro de una entrada');
assert.equal(D.d.gastos.length, 0, 'deshecho');

r = GOps.apply({ v: 1, accion: 'crear', entidad: 'gasto', entidadId: 'g2', payload: { nombre: 'x', entradas: {} } });
assert.equal(r.ok, false, 'entradas que no es lista');

r = GOps.apply({ v: 1, accion: 'crear', entidad: 'gasto', entidadId: 'g3', payload: { nombre: 'ok', entradas: [{ id: 'e1', total: 5 }] } });
assert.equal(r.ok, true);
assert.equal(D.d.gastos.length, 1);
console.log('gestor-ops.mjs: ok');
