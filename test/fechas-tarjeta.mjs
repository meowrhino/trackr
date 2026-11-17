/* Fechas de la tarjeta de proyecto (B.fechasProyecto): inicio y cierre, y de dónde salen si faltan.
 * Ejecutar: node test/fechas-tarjeta.mjs */
import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import vm from 'node:vm';

const read = f => readFileSync(new URL('../js/' + f, import.meta.url), 'utf8');
const ctx = { console, localStorage: { getItem: () => null, setItem() {}, removeItem() {} }, navigator: { language: 'es' }, window: {}, document: undefined };
vm.createContext(ctx);
for (const f of ['utils.js', 'billing.js']) vm.runInContext(read(f), ctx, { filename: f });
const { B } = vm.runInContext('({ B })', ctx);

const h = (...fs) => fs.map(fecha => ({ fecha, cantidad: 1 }));
const f = (p) => ({ ...B.fechasProyecto({ horas: [], facturacion: {}, fechas: {}, ...p }) });

/* Completado con todo: manda lo apuntado */
assert.deepEqual(f({ estado: 'completado', fechas: { inicio: '2026-09-02', finReal: '2026-10-20' }, horas: h('2026-08-01', '2026-11-01'), facturacion: { facturaFecha: '2026-10-25' } }),
  { ini: '2026-09-02', fin: '2026-10-20' });
/* Sin finReal: fecha de factura */
assert.deepEqual(f({ estado: 'completado', fechas: { inicio: '2026-09-02' }, horas: h('2026-11-01'), facturacion: { facturaFecha: '2026-10-25' } }),
  { ini: '2026-09-02', fin: '2026-10-25' });
/* Sin inicio, finReal ni factura: primera y última hora (aunque vengan desordenadas) */
assert.deepEqual(f({ estado: 'abandonado', horas: h('2026-05-10', '2026-03-01', '2026-04-15') }),
  { ini: '2026-03-01', fin: '2026-05-10' });
/* Nada de nada */
assert.deepEqual(f({ estado: 'completado' }), { ini: null, fin: null });
/* Activo: solo inicio, nunca cierre aunque tenga factura */
assert.deepEqual(f({ estado: 'activo', horas: h('2026-06-03'), facturacion: { facturaFecha: '2026-07-01' } }), { ini: '2026-06-03', fin: null });
/* Proyecto viejo sin bloque fechas ni facturacion */
assert.deepEqual({ ...B.fechasProyecto({ estado: 'completado', horas: h('2025-12-01') }) }, { ini: '2025-12-01', fin: '2025-12-01' });

console.log('fechas-tarjeta: ok');
