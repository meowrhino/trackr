/* «Desde total»: el total es el precio con IVA. Primero se quita el IVA para sacar la
 * base y luego el IRPF sale de esa base (la gestoría, 2026-11-18). Las facturas emitidas
 * antes, que dividían entre (1 + IVA − IRPF), se quedan como estaban.
 * Ejecutar: node test/desde-total.mjs */
import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import vm from 'node:vm';

const ctx = { console, window: {}, navigator: { language: 'es' } };
vm.createContext(ctx);
for (const f of ['utils.js', 'billing.js']) vm.runInContext(readFileSync(new URL('../js/' + f, import.meta.url), 'utf8'), ctx, { filename: f });
const B = vm.runInContext('B', ctx);
const proj = extra => ({ id: 'p', horas: [], facturacion: { modo: 'desde_total', total: 1210, iva: 21, irpf: 15, cobros: [], ...extra } });

/* 1. Sin emitir: 1.210 € con IVA → base 1.000, IVA 210, IRPF 150, cobras 1.060 */
const n = proj(); B.calc(n); const f = n.facturacion;
assert.deepEqual([f.baseImponible, f.importeIva, f.importeIrpf, f.totalFactura, f.netoRecibido], [1000, 210, 150, 1060, 850]);
assert.equal(f.totalConIva, true, 'queda marcada antes de emitirse');

/* 2. Al emitirla no cambia */
f.facturaNum = 1; f.facturaFecha = '2026-11-18'; B.calc(n);
assert.equal(n.facturacion.baseImponible, 1000);

/* 3. Una emitida antes del arreglo (sin marca) sigue con su base de entonces */
const v = proj({ facturaNum: 2, facturaFecha: '2026-03-01' }); B.calc(v);
assert.equal(v.facturacion.baseImponible, 1141.51);
assert.equal(v.facturacion.totalFactura, 1210);
assert.equal(v.facturacion.totalConIva, undefined);

/* 4. Céntimos: base + IVA da justo el total tecleado */
const c = proj({ total: 100 }); B.calc(c);
assert.equal(c.facturacion.baseImponible, 82.64);
assert.equal(Math.round((c.facturacion.baseImponible + c.facturacion.importeIva) * 100), 10000);

console.log('desde-total: ok');
