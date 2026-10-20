/* badIds: ids no seguros en datos que vienen de fuera (se interpolan en onclick).
 * Ejecutar: node test/ids.mjs */
import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import vm from 'node:vm';

const ctx = { console, localStorage: { getItem: () => null, setItem() {}, removeItem() {} }, navigator: { language: 'es' }, window: {}, document: undefined };
vm.createContext(ctx);
vm.runInContext(readFileSync(new URL('../js/utils.js', import.meta.url), 'utf8'), ctx, { filename: 'utils.js' });
const { badIds, uid } = vm.runInContext('({ badIds, uid })', ctx);

const evil = "x'); alert(1); ('";
const ok = () => ({
  projects: [{ id: uid(), nombre: 'P', horas: [{ id: uid() }, {}], facturacion: { cobros: [{ id: uid() }] } }],
  clientes: [{ id: uid() }], gastos: [{ id: uid(), entradas: [{ id: uid() }] }], deducibles: [{ id: uid() }],
  facturas: [{ id: uid() }], presupuestos: [{ id: uid(), lineas: [{ id: uid() }, {}] }]
});

assert.deepEqual([...badIds(ok())], []);
assert.deepEqual([...badIds({})], []);
assert.deepEqual([...badIds({ projects: [{ nombre: 'sin id' }] })], []);
assert.deepEqual([...badIds({ projects: [{ id: evil }] })], [evil]);

/* cada nivel anidado */
for (const mut of [
  d => { d.projects[0].horas[0].id = evil; },
  d => { d.projects[0].facturacion.cobros[0].id = evil; },
  d => { d.gastos[0].entradas[0].id = evil; },
  d => { d.presupuestos[0].lineas[0].id = evil; },
  d => { d.clientes[0].id = evil; },
  d => { d.deducibles[0].id = evil; },
  d => { d.facturas[0].id = evil; },
  d => { d.projects[0].id = 'a'.repeat(65); }
]) { const d = ok(); mut(d); assert.equal(badIds(d).length, 1); }

console.log('ids OK');
