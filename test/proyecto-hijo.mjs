/* Proyecto hijo: un subproyecto convertido en proyecto aparte (parentId) para facturarlo por
 * separado. Lo importante: nada se cuenta dos veces (ni en el 303, ni en el 130, ni las horas),
 * el presupuesto sigue apuntando a la madre, y sobrevive a importar y a fusionar dispositivos.
 * Ejecutar: node test/proyecto-hijo.mjs */
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
const { D, B, F, badIds } = vm.runInContext('({ D, B, F, badIds })', ctx);

const datos = () => ({ version: 4, clientes: [{ id: 'c1', nombre: 'Can Mas' }], gastos: [], deducibles: [], facturas: [], audit: [],
  settings: { emisor: { nombre: 'Yo', nif: '12345678Z' }, defaultIva: 21, defaultIrpf: 15 },
  projects: [{ id: 'web', nombre: 'Tienda online', clienteId: 'c1', color: 'Teal', estado: 'activo', fechas: { inicio: '2026-09-01' }, notas: '',
    facturacion: { modo: 'desde_base', baseImponible: 0, iva: 21, irpf: 15, ivaExcepcion: '', cobros: [] },
    subproyectos: [{ id: 's1', nombre: 'Diseño', base: 2800, descripcion: 'logo y maqueta' }, { id: 's2', nombre: 'Desarrollo', base: 6400 }],
    horas: [{ id: 'h1', cantidad: 10, subId: 's1', fecha: '2026-10-01', tipo: 'trabajo' }, { id: 'h2', cantidad: 4, subId: 's2', fecha: '2026-10-02', tipo: 'trabajo' }, { id: 'h3', cantidad: 1, fecha: '2026-10-03', tipo: 'reunion' }],
    presupuesto: { num: 'P1', fecha: '2026-08-20' } }],
  presupuestos: [{ id: 'b1', num: 'P1', fecha: '2026-08-20', clienteId: 'c1', estado: 'enviado', total: 0, descripcion: '',
    lineas: [{ pid: 'web', subId: 's1', concepto: 'Diseño', base: 3000 }, { pid: 'web', subId: 's2', concepto: 'Desarrollo', base: 6400 }] }] });
const emitir = (id, num) => { const f = D.p(id).facturacion; f.facturaNum = num; f.facturaFecha = '2026-11-10'; D.up(id, { facturacion: f }); };
const t4 = () => { const q = F.quarter(2026, 3); return { ingresos: q.ingresos, base21: q.ivaRep[21]?.base || 0, cuota21: q.ivaRep[21]?.cuota || 0, ret: q.retenciones }; };

/* ── Referencia: la madre entera en una sola factura ── */
D.load(datos()); B.calc(D.p('web'));
assert.equal(D.p('web').facturacion.baseImponible, 9200);
emitir('web', 1);
const entero = t4();
assert.equal(entero.ingresos, 9200); assert.equal(entero.base21, 9200);

/* ── Convertir «Diseño» en proyecto hijo ── */
D.load(datos());
assert.equal(D.subConvertible('web', 's1'), '');
const hid = D.convertirSub('web', 's1');
const m = D.p('web'), h = D.p(hid);
assert.ok(h, 'el hijo existe');
assert.equal(h.parentId, 'web'); assert.equal(h.subOrigen, 's1');
assert.equal(h.nombre, 'Tienda online · Diseño'); assert.equal(h.clienteId, 'c1'); assert.equal(h.notas, 'logo y maqueta');
assert.equal(h.facturacion.baseImponible, 2800); assert.equal(h.facturacion.iva, 21); assert.equal(h.facturacion.irpf, 15);
assert.equal(h.presupuesto.num, 'P1', 'lleva la marca del presupuesto de la madre');
assert.equal(JSON.stringify(m.subproyectos.map(x => x.id)), '["s2"]');
B.calc(m); B.calc(h);
assert.equal(m.facturacion.baseImponible, 6400, 'la base de la madre baja en el importe del hijo');
assert.equal(m.facturacion.baseImponible + h.facturacion.baseImponible, 9200, 'entre los dos, lo mismo que antes');
/* Horas: las del subproyecto se van con él; ninguna se cuenta dos veces */
assert.equal(h.horas.length, 1); assert.equal(h.horas[0].cantidad, 10); assert.equal(h.horas[0].subId, undefined); assert.notEqual(h.horas[0].id, 'h1');
assert.equal(JSON.stringify(m.horas.map(x => x.id)), '["h2","h3"]');
assert.equal(B.totalHoras(m) + B.totalHoras(h), 15);
assert.equal(badIds(D.d).length, 0);

/* ── 303 y 130: madre e hijo facturados por separado = la madre entera ── */
emitir('web', 1); emitir(hid, 2);
assert.equal(JSON.stringify(t4()), JSON.stringify(entero), 'ni el 303 ni el 130 cuentan nada dos veces');
assert.notEqual(D.p(hid).facturacion.facturaNum, D.p('web').facturacion.facturaNum, 'cada uno con su número');

/* ── La madre enseña la suma de la familia ── */
D.p(hid).facturacion.cobros = [{ id: 'k1', fecha: '2026-11-15', cantidad: 1000 }];
const fam = B.familia(D.p('web'));
assert.equal(fam.hijos.length, 1); assert.equal(fam.horas, 15); assert.equal(fam.base, 9200);
assert.equal(fam.facturado, 9752, '6400 y 2800 con su IVA y su IRPF: 6784 + 2968');
assert.equal(fam.cobrado, 1000);
assert.equal(B.familia(D.p(hid)), null, 'un hijo no tiene familia propia');

/* ── Límites ── */
assert.equal(D.subConvertible('web', 's2'), 'hijo.madreFacturada', 'con la madre ya facturada, su importe va en esa factura');
assert.equal(D.hijoReversible(hid), 'hijo.facturado', 'un hijo con factura no vuelve a subproyecto');
D.load(datos()); const h2 = D.convertirSub('web', 's1');
D.up(h2, { subproyectos: [{ id: 'n1', nombre: 'Nieto', base: 100 }] });
assert.equal(D.subConvertible(h2, 'n1'), 'hijo.nested', 'un solo nivel');
assert.equal(D.convertirSub(h2, 'n1'), null);
assert.equal(D.subConvertible('web', 'no-existe'), 'hijo.noSub');

/* ── El presupuesto sigue apuntando a la madre: al aceptarlo, la línea de «Diseño» va al hijo ── */
D.load(datos()); const h3 = D.convertirSub('web', 's1');
assert.equal(D.bud('b1').lineas[0].pid, 'web', 'las líneas no se tocan al convertir');
D.d.presupuestos[0].lineas[1].base = 7000;
assert.equal(D.aplicarPresupuesto('b1'), 2);
assert.equal(D.p(h3).facturacion.baseImponible, 3000, 'el importe aceptado de «Diseño» va al hijo');
assert.equal(D.p('web').subproyectos[0].base, 7000);
B.calc(D.p('web')); assert.equal(D.p('web').facturacion.baseImponible, 7000, 'y no se suma también a la madre');

/* ── Volver a subproyecto ── */
assert.equal(D.hijoReversible(h3), '');
assert.equal(D.revertirHijo(h3), true);
assert.equal(D.p(h3), undefined);
const m3 = D.p('web'), vuelto = m3.subproyectos.find(x => x.nombre === 'Diseño');
assert.ok(vuelto); assert.equal(vuelto.base, 3000); assert.equal(vuelto.descripcion, 'logo y maqueta');
assert.equal(m3.horas.length, 3); assert.equal(m3.horas.filter(x => x.subId === vuelto.id).length, 1, 'sus horas vuelven con él');
B.calc(m3); assert.equal(m3.facturacion.baseImponible, 10000);
assert.equal(D.bud('b1').lineas[0].subId, vuelto.id, 'y el presupuesto vuelve a señalar al subproyecto');
assert.equal((D.d.papelera || []).length, 0, 'no pasa por la papelera');

/* ── Único subproyecto: la madre se queda a 0, no con la suma vieja ── */
D.load(datos()); D.d.projects[0].subproyectos.pop(); D.d.projects[0].facturacion.baseImponible = 2800;
D.convertirSub('web', 's1'); B.calc(D.p('web'));
assert.equal(D.p('web').facturacion.baseImponible, 0);

/* ── Importar / recargar: sobrevive; y los enlaces rotos se limpian ── */
D.load(datos()); const h4 = D.convertirSub('web', 's1');
const json = JSON.parse(JSON.stringify(D.d));
D.load(JSON.parse(JSON.stringify(json)));
assert.equal(D.p(h4).parentId, 'web'); assert.equal(D.hijos('web').length, 1);
const roto = JSON.parse(JSON.stringify(json)); roto.projects = roto.projects.filter(p => p.id !== 'web');
D.load(roto);
assert.equal(D.p(h4).parentId, undefined, 'sin madre, es un proyecto más');
const bucle = JSON.parse(JSON.stringify(json)); bucle.projects[0].parentId = h4;   /* madre hija de su hija */
D.load(bucle);
assert.ok(D.d.projects.filter(p => p.parentId).length <= 1, 'nunca dos niveles');
D.load(JSON.parse(JSON.stringify(json))); D.del('web');
assert.equal(D.p(h4).parentId, undefined, 'borrar la madre deja al hijo como proyecto normal');

/* ── Fusión: se convierte en el portátil; el móvil, sin enterarse, apunta otra hora en la madre ── */
{
  D.load(datos());
  const antes = JSON.parse(JSON.stringify(D.d));
  const hx = D.convertirSub('web', 's1');
  const portatil = JSON.parse(JSON.stringify(D.d));
  const movil = JSON.parse(JSON.stringify(antes));
  movil.projects[0].horas.push({ id: 'h9', cantidad: 2, subId: 's2', fecha: '2026-10-05', tipo: 'trabajo' });
  movil.audit = [{ ts: Date.now() + 5000, actor: 'local', accion: 'editar', entidad: 'proyecto', entidadId: 'web' }];
  for (const r of [ctx.Acc._mergeData(movil, portatil), ctx.Acc._mergeData(portatil, movil)]) {
    D.load(JSON.parse(JSON.stringify(r)));
    assert.ok(D.p(hx), 'el hijo está');
    assert.equal(JSON.stringify(D.p('web').subproyectos.map(x => x.id)), '["s2"]', 'el subproyecto convertido no vuelve a la madre');
    assert.equal(JSON.stringify(D.p('web').horas.map(x => x.id).sort()), '["h2","h3","h9"]', 'sus horas tampoco; la del móvil se conserva');
    B.calc(D.p('web')); B.calc(D.p(hx));
    assert.equal(D.p('web').facturacion.baseImponible + D.p(hx).facturacion.baseImponible, 9200, 'y el importe sigue sin contarse dos veces');
    assert.equal(B.totalHoras(D.p('web')) + B.totalHoras(D.p(hx)), 17);
  }
}

console.log('proyecto-hijo: ok');
