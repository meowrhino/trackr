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

/* 5. Cuota con tipo 0: el tipo sale de los importes (303 y libros coinciden) */
assert.equal(vm.runInContext("gastoLineasIva({ tipoIva: 0 }, { base: 100, iva: 10 })[0].tipoIva", ctx), 10);
assert.equal(vm.runInContext("gastoLineasIva({ tipoIva: 0 }, { base: 100, iva: 0 })[0].tipoIva", ctx), 0, 'sin cuota sigue a 0');

/* 6. Numeración por año: en enero vuelve a 1; el número repetido se mira dentro del año */
D.d.settings.nextFacturaNum = 14; delete D.d.settings.nextFacturaYear;
assert.equal(D.nextFacturaNum('2026-11-10'), 14, 'en el año en curso, el contador');
assert.equal(D.nextFacturaNum('2027-01-05'), 1, 'año nuevo: 1');
assert.ok(D.facturaNumTaken(1, 'otro', '2026-05-01'), '1/26 ya existe');
assert.equal(D.facturaNumTaken(1, 'otro', '2027-01-05'), undefined, '1/27 está libre');
assert.equal(D.facturaNumTaken('1', 'otro', '2026-05-01')?.id, 'vig', 'número guardado como texto también cuenta');

/* 7. Rectificativa a la baja: cuenta en el trimestre de su fecha, con signo; pendiente y pagado la tienen en cuenta */
const vig = D.p('vig');
const rd = B.rectDiff(vig.facturacion, 800);              // de 1000 a 800
assert.equal(rd.base, -200); assert.equal(rd.importeIva, -42); assert.equal(rd.importeIrpf, -30); assert.equal(rd.total, -212);
vig.facturacion.rectificativas = [{ id: 'r1', num: D.nextRectNum('2026-04-10'), fecha: '2026-04-10', ...rd }];
assert.equal(vig.facturacion.rectificativas[0].num, 'R1');
assert.equal(F.quarter(2026, 0).ingresos, 1000, 'el 1T no cambia');
assert.equal(F.quarter(2026, 1).ingresos, -200, 'la rectificativa va al 2T');
B.calc(vig);
assert.equal(vig.facturacion.totalConRect, 848);          // 1000 + 210 − 150 − 212
vig.facturacion.cobros = [{ id: 'k', cantidad: 848 }]; B.calc(vig);
assert.equal(vig.facturacion.pagado, true);
assert.equal(B.rectDiff(vig.facturacion, 800).base, 0, 'otra a la misma base: nada');
assert.equal(D.nextRectNum('2026-05-01'), 'R2');

/* 8. Anular sin VeriFactu (marca en el proyecto): sale de impuestos y el número sigue gastado */
D.p('vig').facturacion.anulada = { fecha: '2026-05-01' };
assert.equal(D.facturaVigente('vig'), false);
assert.equal(F.quarter(2026, 0).ingresos, 0, 'anulada: fuera del 1T');
assert.ok(D.facturaNumTaken(1, 'otro', '2026-05-01'), 'su número no se reutiliza');
assert.match(readFileSync(new URL('../js/app.project.js', import.meta.url), 'utf8'), /anulada: prev\?\.facturacion\?\.anulada/, 'editar el proyecto conserva la anulación');

/* 9. Rectificativa de un año distinto al de su factura: sale en el libro de su año */
const dic = { id: 'dic', nombre: 'dic', clienteId: 'c1', estado: 'completado', horas: [],
  facturacion: { modo: 'desde_base', baseImponible: 1000, iva: 21, irpf: 15, facturaFecha: '2026-12-10', facturaNum: 9, cobros: [] } };
D.d.projects.push(dic); B.calc(dic);
dic.facturacion.rectificativas = [{ id: 'r9', num: 'R1', fecha: '2027-01-15', ...B.rectDiff(dic.facturacion, 800) }];
assert.equal(F.quarter(2027, 0).ingresos, -200);
if (LR && LR.buildRows) {
  const rows = LR.buildRows(2027, 0);
  assert.equal(rows.exp.length, 1, 'la R1/27 sale en el libro de 2027');
  assert.equal(rows.exp[0].L, 'R1/27');
}

/* 10. Contador: una factura antigua (importada o vuelta a descargar) no lo mueve */
D.d.settings.nextFacturaNum = 14; delete D.d.settings.nextFacturaYear;
const yNow = vm.runInContext('todayStr()', ctx).slice(0, 4);
assert.equal(D.bumpFacturaNum(40, (+yNow - 1) + '-06-01'), false, 'factura del año pasado: no toca');
assert.equal(D.d.settings.nextFacturaNum, 14);
assert.equal(D.bumpFacturaNum(14, yNow + '-11-10'), true);
assert.equal(D.d.settings.nextFacturaNum, 15); assert.equal(D.d.settings.nextFacturaYear, yNow);

console.log('facturas-estado.mjs: ok');
