/* Facturas emitidas: la anulada no cuenta en el 303/130 ni en los libros; las horas
 * apuntadas después de facturar no cambian la base; cobros que suman el total exacto
 * la marcan pagada (100,10 + 200,20 + 300,30 suma 600,5999… en coma flotante); el IVA
 * de cada entrada de gasto se respeta aunque cambie el del gasto.
 * Ejecutar: node test/facturas-estado.mjs */
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
for (const f of ['utils.js', 'billing.js', 'store.js', 'fiscal.js', 'libros.js']) vm.runInContext(read(f), ctx, { filename: f });
const { D, F, B, LR } = vm.runInContext('({ D, F, B, LR: typeof LR !== "undefined" ? LR : null })', ctx);

const fac = (id, fecha, base, extra = {}) => ({ id, nombre: id, clienteId: 'c1', estado: 'completado', fechas: { inicio: fecha }, horas: [],
  facturacion: { modo: 'desde_base', baseImponible: base, iva: 21, irpf: 15, facturaFecha: fecha, facturaNum: id === 'vig' ? 1 : 2, cobros: [], ...extra } });
D.load({
  version: 4, clientes: [{ id: 'c1', nombre: 'Cliente', nif: 'B12345678' }], deducibles: [], presupuestos: [],
  settings: { emisor: { nombre: 'Yo', nif: '12345678Z' }, defaultIva: 21, defaultIrpf: 15, fiscal: {} },
  projects: [fac('vig', '2026-02-10', 1000), fac('anu', '2026-02-20', 500)],
  facturas: [{ proyectoId: 'anu', tipoRegistro: 'alta', eventos: [{ tipo: 'anulada' }] }],
  gastos: [{ id: 'g', nombre: 'g', categoria: 'otro', desgravable: true, tipoIva: 21, zonaFiscal: 'es',
    entradas: [{ id: 'e', fecha: '2026-01-15', base: 100, iva: 10, irpf: 0, total: 110, tipoIva: 10 }] }]
});

/* 1. La anulada no cuenta */
const q = F.quarter(2026, 0);
assert.equal(q.ingresos, 1000, 'solo la factura vigente');
if (LR && LR.buildRows) {
  const rows = LR.buildRows(2026, 0);
  const exp = rows.expedidas || rows.exp || [];
  assert.equal(exp.length, 1, 'la anulada no sale en el libro de expedidas');
}

/* 2. Por horas: emitida, la base se congela */
const ph = { id: 'ph', nombre: 'ph', estado: 'activo', horas: [{ id: 'h1', cantidad: 10 }],
  facturacion: { modo: 'por_hora', precioHora: 50, iva: 21, irpf: 15, cobros: [] } };
B.calc(ph); assert.equal(ph.facturacion.baseImponible, 500);
ph.facturacion.facturaNum = 3; ph.facturacion.facturaFecha = '2026-02-15';
ph.horas.push({ id: 'h2', cantidad: 4 });
B.calc(ph); assert.equal(ph.facturacion.baseImponible, 500, 'horas posteriores no cambian la factura');

/* 3. Cobros que suman exacto */
const pc = { id: 'pc', nombre: 'pc', estado: 'completado', horas: [],
  facturacion: { modo: 'desde_total', total: 600.6, iva: 0, irpf: 0, facturaNum: 4, facturaFecha: '2026-02-01',
    cobros: [{ id: 'a', cantidad: 100.1 }, { id: 'b', cantidad: 200.2 }, { id: 'c', cantidad: 300.3 }] } };
B.calc(pc);
assert.equal(pc.facturacion.pagado, true);
assert.equal(B.pendiente(pc), 0);

/* 4. El IVA de la entrada manda aunque el gasto cambie de tipo */
D.d.gastos[0].tipoIva = 21;
assert.equal(gastoLineasIvaTipo(), 10);
function gastoLineasIvaTipo() { return vm.runInContext('gastoLineasIva(D.d.gastos[0], D.d.gastos[0].entradas[0])[0].tipoIva', ctx); }

console.log('facturas-estado.mjs: ok');
