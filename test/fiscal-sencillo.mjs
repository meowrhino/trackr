/* Fiscal sencillo:
 *  - redondeo al céntimo (medio céntimo sube; el negativo es el espejo)
 *  - el coste de una entrada de gasto (lo que pintan el calendario e Info) sale de base + IVA
 *  - aceptar un presupuesto pasa sus importes al proyecto
 *  - guardar el proyecto no borra los días para pagar; cliente de la UE → IVA 0, IRPF 0 y mención
 *  - fecha por defecto de una entrada de gasto mensual
 * Ejecutar: node test/fiscal-sencillo.mjs */
import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import vm from 'node:vm';

const read = f => readFileSync(new URL('../js/' + f, import.meta.url), 'utf8');
const mem = {};
/* DOM mínimo: los formularios de la app leen document.getElementById(id).value */
const campos = {};
const el = id => (campos[id] = campos[id] || { value: '', checked: false, style: {}, classList: { add() {}, remove() {} }, closest: () => null });
const ctx = { console, navigator: { language: 'es' }, window: { addEventListener() {} },
  localStorage: { getItem: k => (k in mem ? mem[k] : null), setItem: (k, v) => { mem[k] = String(v); }, removeItem: k => { delete mem[k]; } },
  document: { getElementById: id => (id in campos ? campos[id] : null), querySelectorAll: () => [], querySelector: () => null, addEventListener() {} } };
vm.createContext(ctx);
vm.runInContext('var App = { cm() {}, go() {}, rDet() {}, cPrev() {}, _subRead: () => [] }, T = { ev() {} }, Toast = { ok() {}, warn() {}, error() {}, show() {} };', ctx);
for (const f of ['utils.js', 'lang.js', 'billing.js', 'store.js', 'app.project.js', 'app.gastos.modals.js']) vm.runInContext(read(f), ctx, { filename: f });
const { D, B, App, roundMoney, gastoCoste, LANGS } = vm.runInContext('({ D, B, App, roundMoney, gastoCoste, LANGS })', ctx);

/* ── Redondeo ── */
assert.equal(roundMoney(306.5 * 21 / 100), 64.37, '64,365 → 64,37 (antes 64,36)');
assert.equal(roundMoney(1.005), 1.01);
assert.equal(roundMoney(0.125), 0.13);
assert.equal(roundMoney(-0.125), -0.13, 'una rectificativa es el espejo de su factura');
assert.equal(roundMoney(-306.5 * 21 / 100), -64.37);
assert.equal(roundMoney(64.364999), 64.36, 'lo que no llega al medio céntimo no sube');
assert.equal(roundMoney(0.1 + 0.2), 0.3);
assert.ok(Object.is(roundMoney(-0.001), 0), 'sin −0');
/* Todas las bases de 0 a 5.000 € al 21 % y al 10 %, contra la cuenta exacta en céntimos enteros */
for (const tipo of [21, 10, 4]) {
  let mal = 0;
  for (let c = 0; c <= 500000; c++) if (Math.round(roundMoney(c / 100 * tipo / 100) * 100) !== Math.floor((c * tipo + 50) / 100)) mal++;
  assert.equal(mal, 0, `ninguna base falla al ${tipo} %`);
}
assert.equal(B.calcTax(306.5, 21, 15).importeIva, 64.37);

/* ── Coste de una entrada de gasto ── */
assert.equal(gastoCoste({ base: 53.72, iva: 11.28, total: 65 }), 65, 'las entradas nuevas no llevan «cantidad»');
assert.equal(gastoCoste({ cantidad: 20 }), 20, 'las de antes de la v4, sí');

/* ── Aceptar un presupuesto ── */
const fac = (o = {}) => ({ modo: 'desde_base', baseImponible: 0, iva: 21, irpf: 15, cobros: [], ...o });
D.load({ version: 4, clientes: [{ id: 'c1', nombre: 'Cliente' }, { id: 'ue', nombre: 'Weber GmbH', zonaFiscal: 'ue' }], gastos: [], deducibles: [], facturas: [],
  settings: { emisor: {}, defaultIva: 21, defaultIrpf: 15, idioma: 'es' },
  projects: [
    { id: 'simple', nombre: 'Logo', clienteId: 'c1', estado: 'potencial', fechas: {}, horas: [], facturacion: fac({ baseImponible: 500 }) },
    { id: 'subs', nombre: 'Web', clienteId: 'c1', estado: 'potencial', fechas: {}, horas: [], facturacion: fac({ baseImponible: 3000 }),
      subproyectos: [{ id: 's1', nombre: 'Diseño', base: 1000 }, { id: 's2', nombre: 'Tienda', base: 2000 }] },
    { id: 'horas', nombre: 'Mantenimiento', clienteId: 'c1', estado: 'activo', fechas: {}, horas: [{ id: 'h', cantidad: 2 }], facturacion: fac({ modo: 'por_hora', precioHora: 40 }) },
    { id: 'emitida', nombre: 'Ya facturado', clienteId: 'c1', estado: 'completado', fechas: {}, horas: [], facturacion: fac({ baseImponible: 700, facturaNum: 3, facturaFecha: '2026-10-01', diasPago: 0 }) }
  ],
  presupuestos: [{ id: 'b1', num: 'P1', fecha: '2026-11-10', clienteId: 'c1', estado: 'aceptado', total: 0, descripcion: '', lineas: [
    { pid: 'simple', concepto: 'Logo', base: 800 }, { pid: 'subs', subId: 's1', concepto: 'Diseño', base: 1200.5 },
    { pid: 'horas', concepto: 'Bolsa', base: 999 }, { pid: 'emitida', concepto: 'x', base: 1 }] }] });
assert.equal(D.aplicarPresupuesto('b1'), 2, 'cambia el simple y el de subproyectos');
assert.equal(D.p('simple').facturacion.baseImponible, 800);
assert.equal(D.p('subs').subproyectos[0].base, 1200.5, 'la línea de un subproyecto fija ese subproyecto');
assert.equal(D.p('subs').subproyectos[1].base, 2000, 'el que no iba en el presupuesto no se toca');
B.calc(D.p('subs'));
assert.equal(D.p('subs').facturacion.baseImponible, 3200.5, 'y la base del proyecto es la suma');
assert.equal(D.p('horas').facturacion.modo, 'por_hora', 'por horas: la base sale de las horas');
assert.equal(D.p('emitida').facturacion.baseImponible, 700, 'una factura emitida no cambia');
assert.equal(D.aplicarPresupuesto('b1'), 0, 'aceptarlo otra vez no cambia nada');

/* ── Guardar el proyecto conserva los días para pagar ── */
const pon = (o) => { for (const k in campos) delete campos[k]; Object.entries(o).forEach(([k, v]) => { el(k).value = v; }); };
pon({ mpN: 'Ya facturado', mpCl: 'c1', mpColor: 'Teal', mpSt: 'completado', mpBM: 'desde_base', mpBa: '700', mpIva: '21', mpIrpf: '15', mpI: '', mpFE: '', mpFR: '', mpNo: '', mpIvaExc: '', mpAsunto: '', mpTo: '', mpPH: '' });
App.saveP('emitida');
assert.equal(D.p('emitida').facturacion.diasPago, 0, 'una factura al contado sigue al contado');
assert.equal(D.p('emitida').facturacion.facturaNum, 3);

/* ── Cliente de la UE: IVA 0, IRPF 0 y la mención ── */
pon({ mpIva: '21', mpIrpf: '15', mpIvaExc: '', mpFacLang: '', mpCl: 'ue', mpClNew: '' });
App._zonaAuto = false;
App._onClientChange('ue', true);
assert.equal(String(campos.mpIva.value), '0'); assert.equal(String(campos.mpIrpf.value), '0');
assert.match(campos.mpIvaExc.value, /art\. 69.*Inversión del sujeto pasivo/);
assert.doesNotMatch(JSON.stringify(Object.keys(LANGS).map(l => [LANGS[l]['fac.mention.ue'], LANGS[l]['fac.mention.noue']])), /art\. ?25/, 'el art. 25 es de entregas de bienes');
App._onClientChange('c1', true);   /* se vuelve a un cliente de España */
assert.equal(String(campos.mpIva.value), '21'); assert.equal(String(campos.mpIrpf.value), '15'); assert.equal(campos.mpIvaExc.value, '');
campos.mpIvaExc.value = 'Exenta art. 20 LIVA'; campos.mpFacLang.value = 'en';
App._onClientChange('ue', true);
assert.equal(campos.mpIvaExc.value, 'Exenta art. 20 LIVA', 'una mención escrita a mano no se pisa');
campos.mpIvaExc.value = '';
App._onClientChange('ue', true);
assert.match(campos.mpIvaExc.value, /Reverse charge/, 'factura en inglés → mención en inglés');
campos.mpIva.value = '21';
App._onClientChange('ue');         /* sin que el usuario cambie el desplegable (al reabrir la ventana): no toca nada */
assert.equal(String(campos.mpIva.value), '21');
for (const f of readdirEj()) assert.doesNotMatch(f, /art\. ?25|alquiler_oficina/, 'los ejemplos ya no enseñan el art. 25 ni la categoría que no existe');
function readdirEj() { return ['marina_traductora', 'ana_musica', 'dani_formador'].map(n => readFileSync(new URL(`../examples/${n}.json`, import.meta.url), 'utf8')); }

/* ── Fecha por defecto de una entrada de gasto ── */
const hoy = new Date(), iso = (y, m, d) => `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
const mensual = { recurrente: 'mensual', diaRecurrente: 31 }, puntual = { recurrente: 'no' };
Object.assign(App, { cv: 'gas', dinPeriod: 'mes', dinY: hoy.getFullYear(), dinM: hoy.getMonth() });
assert.equal(App._gasFecha(puntual), iso(hoy.getFullYear(), hoy.getMonth(), hoy.getDate()), 'este mes, gasto puntual: hoy');
assert.equal(App._gasFecha({ recurrente: 'mensual', diaRecurrente: 1 }), iso(hoy.getFullYear(), hoy.getMonth(), 1), '«+ Este mes»: el día configurado');
Object.assign(App, { dinY: 2026, dinM: 9 });   /* mirando octubre de 2026 */
assert.equal(App._gasFecha(mensual), '2026-10-31');
assert.equal(App._gasFecha(puntual), '2026-10-01', 'otro mes: ese mes, no hoy');
Object.assign(App, { dinY: 2026, dinM: 1 });   /* febrero: no hay día 31 */
assert.equal(App._gasFecha(mensual), '2026-02-28');
Object.assign(App, { dinPeriod: 'año' });
assert.equal(App._gasFecha(puntual), iso(hoy.getFullYear(), hoy.getMonth(), hoy.getDate()), 'vista de año: hoy');

console.log('fiscal-sencillo: ok');
