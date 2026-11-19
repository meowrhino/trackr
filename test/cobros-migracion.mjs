/* La migración v3 de cobros (neto → total) solo toca datos de antes de la v4.
 * Antes corría en cada carga: un cobro parcial sin la marca _cobrosV3 (proyecto nuevo o
 * recién editado) crecía un 24,7 % en cada recarga (500 → 623,53 → 777,58…).
 * Ejecutar: node test/cobros-migracion.mjs */
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

/* Factura de 1.000 € de base (IVA 21, IRPF 15): total 1.060, neto 850. Cobro parcial de 500. */
const datos = version => ({
  version,
  clientes: [], gastos: [], deducibles: [], facturas: [],
  settings: { emisor: {}, defaultIva: 21, defaultIrpf: 15 },
  projects: [{
    id: 'p1', nombre: 'Web', estado: 'activo', fechas: {}, horas: [],
    facturacion: { modo: 'desde_base', baseImponible: 1000, iva: 21, irpf: 15, totalFactura: 1060, netoRecibido: 850,
      facturaNum: 1, facturaFecha: '2026-03-01', cobros: [{ id: 'c1', fecha: '2026-03-10', cantidad: 500 }] }
  }]
});
const cobro = () => D.d.projects[0].facturacion.cobros[0].cantidad;

/* v4 sin la marca: el cobro no se toca, ni al cargar ni al volver a pasar ensure (recargas) */
D.load(datos(4));
assert.equal(cobro(), 500);
delete D.d.projects[0].facturacion._cobrosV3; /* como tras editar el proyecto (saveP rehace facturacion) */
D.ensure(); D.ensure();
assert.equal(cobro(), 500, 'un cobro parcial no crece al recargar');

/* Datos de antes de la v4 (o sin versión): se escala una sola vez, como siempre */
for (const v of [3, undefined]) {
  D.load(datos(v));
  assert.equal(cobro(), 623.53, `v${v}: neto → total (500 × 1060/850)`);
  D.ensure();
  assert.equal(cobro(), 623.53, `v${v}: no se vuelve a escalar`);
}

console.log('cobros-migracion: ok');
