/* Copias locales (js/history.js): las redes de seguridad seguidas no llenan el historial,
 * y al sobrar se va primero la red de seguridad más vieja, no la del día ni las manuales.
 * Ejecutar: node test/historial.mjs */
import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import vm from 'node:vm';

const mem = {};
const ctx = { console, navigator: { language: 'es' }, window: {}, document: undefined,
  localStorage: { getItem: k => (k in mem ? mem[k] : null), setItem: (k, v) => { mem[k] = String(v); }, removeItem: k => { delete mem[k]; } },
  LZString: { compressToUTF16: s => s, decompressFromUTF16: s => s } };
vm.createContext(ctx);
for (const f of ['utils.js', 'billing.js', 'store.js', 'history.js']) vm.runInContext(readFileSync(new URL('../js/' + f, import.meta.url), 'utf8'), ctx);
const { D, H } = vm.runInContext('({ D, H })', ctx);
D.load({ version: 4, projects: [{ id: 'p', nombre: 'p', horas: [], facturacion: { modo: 'gratis' } }], clientes: [], gastos: [], deducibles: [], facturas: [], settings: {} });

H.snapshot({ auto: true });                              // la del día
H.snapshot();                                            // una manual
for (let i = 0; i < 20; i++) H.snapshot({ safety: true }); // 20 fusiones seguidas
let l = H.list();
assert.equal(l.length, 3, 'las 20 redes de seguridad seguidas ocupan una sola plaza');

/* Sobran: se van las redes de seguridad viejas, la del día se queda */
const arr = JSON.parse(mem.trackr_history);
for (let i = 0; i < 12; i++) arr.splice(1, 0, { id: 'old' + i, ts: new Date(Date.now() - (i + 1) * 3600e3).toISOString(), safety: true, data: '{}' });
mem.trackr_history = JSON.stringify(arr);
H.snapshot();
const after = JSON.parse(mem.trackr_history);
assert.equal(after.length, 10);
assert.ok(after.some(s => s.auto), 'la del día sigue');
assert.equal(after.filter(s => !s.safety && !s.auto).length, 2, 'las dos manuales siguen');
console.log('historial.mjs: ok');
