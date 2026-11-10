/* Las calculadoras públicas /130 y /303 usan las fórmulas de la app (F.casillas130,
 * F.compensar303). Aquí se comparan, con miles de entradas al azar, contra las fórmulas
 * que tenían escritas a mano antes de unificarlas: tienen que dar lo mismo.
 * Ejecutar: node test/calculadoras.mjs */
import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import vm from 'node:vm';

const ctx = { console, navigator: { language: 'es' }, window: {}, document: undefined, localStorage: { getItem: () => null, setItem() {}, removeItem() {} } };
vm.createContext(ctx);
for (const f of ['utils.js', 'fiscal.js']) vm.runInContext(readFileSync(new URL('../js/' + f, import.meta.url), 'utf8'), ctx);
const F = vm.runInContext('F', ctx);
const r2 = v => Math.round(v * 100) / 100;

/* Copia literal de la calculadora 130 anterior (130.html, nov 2026) */
function old130(c01, gasReal, eds, c05, c06, rn, neg) {
  const dj = eds ? r2(Math.min(0.05 * Math.max(c01 - gasReal, 0), 2000)) : 0;
  const c02 = r2(gasReal + dj), c03 = r2(c01 - c02), c04 = c03 > 0 ? r2(c03 * 0.20) : 0;
  const c07 = r2(c04 - c05 - c06), c12 = Math.max(c07, 0);
  const c13 = rn == null ? 0 : rn <= 9000 ? 100 : rn <= 10000 ? 75 : rn <= 11000 ? 50 : rn <= 12000 ? 25 : 0;
  const c14 = r2(c12 - c13), c15 = c14 > 0 ? r2(Math.min(neg, c14)) : 0, c17 = r2(c14 - c15);
  return { dj, c02, c03, c04, c07, c12, c13, c14, c15, c17, c19: c17 };
}
let seed = 7; const rnd = (max) => { seed = (seed * 16807) % 2147483647; return r2((seed / 2147483647) * max); };
for (let i = 0; i < 5000; i++) {
  const a = [rnd(60000), rnd(30000), i % 2 === 0, rnd(3000), rnd(5000), i % 3 ? rnd(15000) : null, rnd(500)];
  const o = old130(...a);
  const n = F.casillas130({ c01: a[0], gas: a[1], eds: a[2], c05: a[3], c06: a[4], rn: a[5], neg: a[6] });
  for (const k of Object.keys(o)) assert.equal(n[k], o[k], `130 ${k} con ${JSON.stringify(a)}`);
}
/* 303: compensación (antes: c78 = min si c46>0; c87 = c110 − c78; c71 = c46 − c78) */
for (let i = 0; i < 5000; i++) {
  const c46 = rnd(4000) - 2000, c110 = rnd(3000);
  const c78 = c46 > 0 ? Math.min(c110, c46) : 0;
  const n = F.compensar303(c46, c110);
  assert.equal(n.c78, c78); assert.equal(r2(n.c87), r2(c110 - c78)); assert.equal(r2(n.c69), r2(c46 - c78));
}
console.log('calculadoras.mjs: ok');
