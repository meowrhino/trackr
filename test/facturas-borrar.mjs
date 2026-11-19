/* Borrar del todo una factura no enviada (D.facturaBorrable / D.borrarFactura).
 * Solo la última de su año, sin registro VeriFactu, sin cobros ni rectificativas; anulada o no.
 * Al borrarla, el proyecto queda sin facturar y su número vuelve a estar libre.
 * Ejecutar: node test/facturas-borrar.mjs */
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

const proj = (id, num, fecha, extra = {}) => ({ id, nombre: id, estado: 'activo', fechas: {}, horas: [],
  facturacion: { modo: 'desde_base', baseImponible: 100, iva: 21, irpf: 15, facturaNum: num, facturaFecha: fecha, cobros: [], rectificativas: [], ...extra } });
D.load({
  version: 4, clientes: [], gastos: [], deducibles: [], facturas: [],
  settings: { emisor: {}, defaultIva: 21, defaultIrpf: 15, nextFacturaNum: 4, nextFacturaYear: '2026' },
  projects: [
    proj('viejo', 9, '2025-12-20'),               /* de otro año: no cuenta para «la última» */
    proj('a', 1, '2026-01-10'),
    proj('b', 2, '2026-02-10', { cobros: [{ id: 'c', fecha: '2026-02-20', cantidad: 50 }] }),
    proj('c', 3, '2026-03-10', { anulada: { fecha: '2026-03-11' } }),
    proj('sin', null, null)
  ]
});

assert.equal(D.facturaBorrable('a'), 'fac.delNotLast', 'una de en medio deja hueco');
assert.equal(D.facturaBorrable('b'), 'fac.delCobros');
assert.equal(D.facturaBorrable('sin'), 'fac.delNone');
assert.equal(D.facturaBorrable('viejo'), '', 'la última de 2025 sí');
assert.equal(D.facturaBorrable('c'), '', 'la última de 2026, aunque esté anulada');

/* Borrar la 3/26 anulada: el proyecto queda sin facturar y el siguiente número vuelve a ser el 3 */
assert.equal(D.borrarFactura('c'), true);
const fc = D.p('c').facturacion;
assert.equal(fc.facturaNum, null); assert.equal(fc.facturaFecha, null); assert.equal(fc.anulada, null);
assert.equal(fc.baseImponible, 100, 'el resto de la facturación se conserva');
assert.equal(D.nextFacturaNum('2026-11-19'), 3);
assert.equal(D.borrarFactura('a'), false, 'una no borrable no se toca');
assert.equal(D.p('a').facturacion.facturaNum, 1);

/* Firmada en VeriFactu: no se borra */
D.d.facturas.push({ id: 'r1', tipoRegistro: 'alta', proyectoId: 'viejo', eventos: [] });
assert.equal(D.facturaBorrable('viejo'), 'fac.delVerifactu');

console.log('facturas-borrar: ok');
