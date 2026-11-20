/* Revisión general (nov 2026): un caso por cada fallo que encontraron los revisores.
 * Ejecutar: node test/revision.mjs */
import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import vm from 'node:vm';

const read = f => readFileSync(new URL('../js/' + f, import.meta.url), 'utf8');
const mem = {};
const ls = { getItem: k => (k in mem ? mem[k] : null), setItem: (k, v) => { mem[k] = String(v); }, removeItem: k => { delete mem[k]; } };
const ctx = { console, localStorage: ls, sessionStorage: ls, navigator: { language: 'es' }, window: { addEventListener() {} }, document: undefined,
  setTimeout, clearTimeout, crypto: globalThis.crypto, TextEncoder, fetch: async () => ({ status: 500, json: async () => ({}) }), CA: { available: () => true } };
vm.createContext(ctx);
for (const f of ['utils.js', 'billing.js', 'store.js', 'fiscal.js']) vm.runInContext(read(f), ctx, { filename: f });
vm.runInContext(read('account.js') + '\nthis.Acc = Acc;', ctx, { filename: 'account.js' });
const { D, B, badIds, parseNum } = vm.runInContext('({ D, B, badIds, parseNum })', ctx);
const merge = ctx.Acc._mergeData;
const base = () => ({ version: 4, clientes: [{ id: 'c1', nombre: 'C' }], gastos: [], deducibles: [], facturas: [], presupuestos: [], audit: [], settings: {}, projects: [] });
const proj = (id, fx = {}, extra = {}) => ({ id, nombre: id, estado: 'activo', fechas: {}, horas: [], facturacion: { modo: 'desde_base', baseImponible: 1000, iva: 21, irpf: 15, cobros: [], ...fx }, ...extra });
const ev = (ts, accion, id, entidad = 'proyecto') => ({ ts, actor: 'local', accion, entidad, entidadId: id });
const MALO = `x');alert(1);('`;

/* ── Ids con comillas o HTML: se rehacen, y las referencias rotas se quitan ── */
{
  const d = base();
  d.projects = [proj(MALO, {}, { clienteId: MALO, horas: [{ id: '"><img>', cantidad: 1, subId: MALO }] }), proj('bueno', {}, { parentId: MALO })];
  d.presupuestos = [{ id: 'b1', num: 'P1', fecha: '2026-01-01', clienteId: MALO, lineas: [{ pid: MALO, subId: MALO, base: 1 }] }];
  d.facturas = [{ id: 'f1', proyectoId: MALO }];
  D.load(d);
  assert.equal(badIds(D.d).length, 0, 'tras cargar no queda ningún id que pueda romper un onclick');
  const sinNombres = JSON.stringify(D.d, (k, v) => (k === 'nombre' ? undefined : v)); /* el nombre es texto: se escapa al pintar */
  assert.ok(!sinNombres.includes('alert'), 'ni en las referencias');
  assert.equal(D.p('bueno').parentId, undefined);
  assert.equal(D.d.projects[0].horas[0].subId, undefined);
}

/* ── Papelera: id raro fuera, proyecto distinto fuera, y lo recuperado pasa por la frontera de tipos ── */
{
  const d = base(); const ahora = Date.now();
  d.papelera = [{ id: MALO, ts: ahora, proyecto: proj(MALO) }, { id: 'otro', ts: ahora, proyecto: proj('distinto') },
    { id: 'ok', ts: ahora, proyecto: proj('ok', {}, { estado: '<img src=x onerror=alert(1)>', horas: 'no', color: 'red;background:url(x)' }) }];
  assert.ok(badIds(d).length > 0, 'importar un JSON así se rechaza');
  D.load(d);
  assert.equal(JSON.stringify(D.trash().map(x => x.id)), '["ok"]');
  assert.equal(D.restoreP('ok'), true);
  const p = D.p('ok');
  assert.equal(p.estado, 'activo'); assert.ok(Array.isArray(p.horas)); assert.equal(p.color, 'CornflowerBlue');
}

/* ── Números de presupuesto escritos a mano: se conservan ── */
{
  const d = base();
  d.presupuestos = ['P-3', '2026/04', 'PRE7', 'P1', 12, '<b>x</b>'].map((num, i) => ({ id: 'b' + i, num, fecha: '2026-01-0' + (i + 1), clienteId: 'c1', lineas: [] }));
  d.projects = [proj('p', {}, { presupuesto: { num: '2026/04', fecha: '2026-01-02' } })];
  D.load(d);
  assert.equal(JSON.stringify(D.d.presupuestos.map(b => b.num)), '["P-3","2026/04","PRE7","P1",12,"bx/b"]');
  assert.equal(D.p('p').presupuesto.num, '2026/04', 'la marca del proyecto no se pierde');
}

/* ── Fusión: borrar una factura y volver a emitirla con el mismo número ── */
{
  const portatil = { ...base(), projects: [proj('p1', { facturaNum: 7, facturaFecha: '2026-05-20' })],
    audit: [ev(100, 'borrar', 'fac-p1-7', 'facturaEmitida'), ev(200, 'editar', 'p1')] };
  const movil = { ...base(), projects: [proj('p1', {}, { horas: [{ id: 'h', cantidad: 1 }] })], audit: [ev(300, 'editar', 'p1')] };
  for (const m of [merge(movil, portatil), merge(portatil, movil)]) assert.equal(m.projects[0].facturacion.facturaNum, 7, 'la factura re-emitida se queda');
  /* Y si la lápida es posterior a la factura, no vuelve */
  const borrada = { ...base(), projects: [proj('p1')], audit: [ev(400, 'borrar', 'fac-p1-7', 'facturaEmitida'), ev(400, 'editar', 'p1')] };
  assert.equal(merge(borrada, portatil).projects[0].facturacion.facturaNum, undefined);
}

/* ── Fusión: el único subproyecto se convirtió en hijo en A; B tocó la madre después ── */
{
  const antes = { ...base(), projects: [proj('web', { baseImponible: 500 }, { subproyectos: [{ id: 's1', nombre: 'Diseño', base: 500 }] })] };
  D.load(structuredClone(antes));
  const hid = D.convertirSub('web', 's1');
  const a = JSON.parse(JSON.stringify(D.d));
  const b = structuredClone(antes); b.projects[0].nombre = 'Web (B)'; b.audit = [ev(Date.now() + 9000, 'editar', 'web')];
  for (const m of [merge(b, a), merge(a, b)]) {
    D.load(JSON.parse(JSON.stringify(m)));
    B.calc(D.p('web')); B.calc(D.p(hid));
    assert.equal(D.p('web').facturacion.baseImponible + D.p(hid).facturacion.baseImponible, 500, 'el importe no se cuenta dos veces');
  }
}

/* ── Aceptar un presupuesto: honesto con los subproyectos y nada con número de factura ── */
{
  const d = base();
  d.projects = [proj('mano', { baseImponible: 100 }, { subproyectos: [{ id: 's1', nombre: 'A', base: 100 }] }),
    proj('mixto', { baseImponible: 300 }, { subproyectos: [{ id: 'm1', nombre: 'A', base: 300 }] }),
    proj('anulada', { baseImponible: 700, facturaNum: 4, facturaFecha: '2026-03-01', anulada: { fecha: '2026-03-05' } })];
  d.presupuestos = [{ id: 'b1', num: 'P1', fecha: '2026-01-01', clienteId: 'c1', estado: 'aceptado', lineas: [
    { pid: 'mano', concepto: 'a mano', base: 900 }, { pid: 'mixto', subId: 'm1', base: 400 }, { pid: 'mixto', concepto: 'suelta', base: 700 }, { pid: 'anulada', base: 1 }] }];
  D.load(d);
  assert.equal(D.aplicarPresupuesto('b1'), 1, 'solo cuenta lo que de verdad cambia');
  B.calc(D.p('mano')); assert.equal(D.p('mano').facturacion.baseImponible, 100, 'líneas sueltas en un proyecto con subproyectos: no se toca');
  B.calc(D.p('mixto')); assert.equal(D.p('mixto').facturacion.baseImponible, 400, 'la línea del subproyecto, sí');
  assert.equal(D.p('anulada').facturacion.baseImponible, 700, 'una anulada sigue con sus importes');
}

/* ── Volver a subproyecto: un hijo gratis no mete dinero; una madre gratis no acepta ── */
{
  const d = base();
  d.projects = [proj('m', { baseImponible: 0 }, { subproyectos: [{ id: 'x', nombre: 'X', base: 200 }] }),
    proj('h', { modo: 'gratis' }, { parentId: 'm', subproyectos: [{ id: 'y', nombre: 'Y', base: 999 }] }),
    proj('mg', { modo: 'gratis' }), proj('hg', { baseImponible: 50 }, { parentId: 'mg' })];
  D.load(d);
  assert.equal(D.revertirHijo('h'), true);
  B.calc(D.p('m')); assert.equal(D.p('m').facturacion.baseImponible, 200, 'el hijo gratis vuelve a 0 €');
  assert.equal(D.hijoReversible('hg'), 'hijo.modo', 'una madre gratis no se convierte en desde_base');
}

/* ── Papelera vaciada en un dispositivo: no vuelve con la fusión ── */
{
  const d = base(); d.projects = [proj('p')];
  D.load(d); D.del('p');
  const conPapelera = JSON.parse(JSON.stringify(D.d));
  D.emptyTrash();
  const vaciada = JSON.parse(JSON.stringify(D.d));
  assert.equal((merge(vaciada, conPapelera).papelera || []).length, 0);
  assert.equal((merge(conPapelera, vaciada).papelera || []).length, 0);
}

/* ── Números: miles y decimales ── */
assert.equal(parseNum('1,234.50'), 1234.5);
assert.equal(parseNum('1.234,50'), 1234.5);
assert.equal(parseNum('1.234.567'), 1234567);
assert.equal(parseNum('1,234,567'), 1234567);
assert.equal(parseNum('1,500'), 1.5, 'en castellano, la coma es decimal');
vm.runInContext("var _lang = 'en';", ctx);
assert.equal(parseNum('1,500'), 1500, 'con la app en inglés, «1,500» son mil quinientos');
assert.equal(parseNum('12,50'), 12.5, 'y «12,50» sigue siendo doce con cincuenta');
vm.runInContext("_lang = 'es';", ctx);
assert.ok(Number.isNaN(parseNum('1.2.3'))); assert.ok(Number.isNaN(parseNum('1,2,3')));

console.log('revision: ok');
