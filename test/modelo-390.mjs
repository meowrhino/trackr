/* Modelo 390: casillas anuales a partir de los cuatro 303.
 * Año con 1T negativo (a compensar), 2T positivo que lo absorbe, saldo inicial de
 * años anteriores, y una factura intracomunitaria. Ejecutar: node test/modelo-390.mjs */
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
for (const f of ['utils.js', 'billing.js', 'store.js', 'fiscal.js']) vm.runInContext(read(f), ctx, { filename: f });
const { D, F } = vm.runInContext('({ D, F })', ctx);

const fac = (id, fecha, base, iva = 21) => ({ id, nombre: id, clienteId: 'c1', estado: 'completado', fechas: { inicio: fecha }, horas: [],
  facturacion: { modo: 'desde_base', baseImponible: base, iva, irpf: 0, facturaFecha: fecha, facturaNum: 1 } });
D.load({
  version: 4, clientes: [{ id: 'c1', nombre: 'Cliente' }, { id: 'c2', nombre: 'UE', zonaFiscal: 'ue' }],
  deducibles: [], facturas: [],
  settings: { emisor: {}, defaultIva: 21, defaultIrpf: 0, fiscal: { saldoIvaInicial: 5 } },
  projects: [
    fac('p1', '2026-02-10', 100),                       /* 1T: 21 devengado */
    fac('p2', '2026-05-10', 1000),                      /* 2T: 210 devengado */
    { ...fac('p3', '2026-08-10', 300), clienteId: 'c2', facturacion: { modo: 'desde_base', baseImponible: 300, iva: 0, irpf: 0, facturaFecha: '2026-08-10', facturaNum: 2 } } /* 3T: UE sin IVA */
  ],
  gastos: [
    { id: 'g1', nombre: 'Equipo', categoria: 'herramientas', desgravable: true, tipoIva: 21, zonaFiscal: 'es',
      entradas: [{ id: 'e1', fecha: '2026-01-15', base: 200, iva: 42, irpf: 0, total: 242, tipoIva: 21 }] },   /* 1T: 42 soportado → −21 */
    { id: 'g2', nombre: 'Libros', categoria: 'formacion', desgravable: true, tipoIva: 4, zonaFiscal: 'es',
      entradas: [{ id: 'e2', fecha: '2026-04-15', base: 50, iva: 2, irpf: 0, total: 52, tipoIva: 4 }] },
    { id: 'g3', nombre: 'SaaS UE', categoria: 'software', desgravable: true, tipoIva: 21, zonaFiscal: 'ue',
      entradas: [{ id: 'e3', fecha: '2026-07-15', base: 100, iva: 0, irpf: 0, total: 100, tipoIva: 21 }] }       /* ISP UE: 21 devengado y deducido */
  ]
});

const r = F.calc390(2026);
assert.equal(r.rep[21].base, 1100); assert.equal(r.rep[21].cuota, 231);
assert.equal(r.ispUE[21].base, 100); assert.equal(r.ispUE[21].cuota, 21);
assert.equal(r.c33, 1200); assert.equal(r.c47, 252);
assert.equal(r.sop[21].base, 200); assert.equal(r.sop[4].cuota, 2);
assert.equal(r.c48, 250); assert.equal(r.c49, 44);
assert.equal(r.c597, 100); assert.equal(r.c598, 21);
assert.equal(r.c64, 65); assert.equal(r.c65, 187);
/* 1T: 21−42 = −21 a compensar · 2T: 210−2 = 208, compensa 5 (anterior) + 21 (1T) → 182 a ingresar */
assert.equal(r.c85, 5, 'solo lo que venía de años anteriores');
assert.equal(r.c86, 182);
assert.equal(r.c95, 182, 'ingresado en los 303 del año');
assert.equal(r.c97, 0); assert.equal(r.c662, 0);
assert.equal(r.c99, 1100); assert.equal(r.c103, 300); assert.equal(r.c108, 1400);
/* los 303 trimestrales no cambian con la separación de bolsas */
const q2 = F.calc303(2026, 1);
assert.equal(q2.c110, 26); assert.equal(q2.c78, 26); assert.equal(q2.c71, 182); assert.equal(q2.c78Prev, 5);
console.log('modelo-390.mjs: ok');
