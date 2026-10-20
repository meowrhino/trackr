// Check de Acc.resume(): quién manda al entrar (local vs nube). Sin red: fetch y CA simulados.
// Uso: node test/sync-resume.mjs
import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import vm from 'node:vm';

const src = readFileSync(new URL('../js/account.js', import.meta.url), 'utf8');

function setup({ meta, cloudVersion, local, lastSaved }) {
  const store = { trackr_acct: meta ? JSON.stringify(meta) : null };
  const calls = [];
  const cloud = { projects: [{ id: 'c1' }], clientes: [], gastos: [] };
  let srvVersion = cloudVersion;
  const pushed = {}; // version -> datos subidos (para restaurar)
  const D = { d: local, lastSaved, load(j) { this.d = j; this.lastSaved = ++clock; } };
  let clock = lastSaved + 1000;
  const res = (status, data) => ({ status, json: async () => data });
  const fetch = async (url, opt = {}) => {
    const path = url.replace(/^https?:\/\/[^/]+/, '').split('?')[0];
    const m = opt.method || 'GET';
    calls.push(m + ' ' + path);
    const body = opt.body ? JSON.parse(opt.body) : {};
    if (path === '/v1/prelogin') return res(200, { kdfMem: 1, kdfTime: 1, kdfPar: 1, kdfSalt: 's', loginNonce: 'n' });
    if (path === '/v1/login') return res(200, { token: 't', credEpoch: 1, currentVersion: srvVersion, active: true, role: 'persona' });
    if (path === '/v1/blob/meta') return res(200, { currentVersion: srvVersion, updatedAt: 1700000000 });
    if (path === '/v1/blob' && m === 'GET') {
      const v = Number(new URL(url).searchParams.get('version')) || srvVersion;
      return res(200, { blob: pushed[v] || null, version: v });
    }
    if (path === '/v1/blob' && m === 'PUT') {
      if (body.baseVersion !== srvVersion) return res(409, { currentVersion: srvVersion });
      pushed[++srvVersion] = body.blob;
      return res(200, { version: srvVersion });
    }
    return res(404, {});
  };
  const CA = {
    available: () => true, canonEmail: (e) => e,
    deriveForLogin: async () => ({ authKey: 'a', wrapKeyPwd: 'w' }),
    unwrapLogin: async () => 'dek',
    decryptDownload: async (dek, blob) => blob ? JSON.parse(blob) : structuredClone(cloud),
    encryptForUpload: async (dek, data) => ({ blob: JSON.stringify(data), blobHash: 'h' }),
    _: { b64u: (u8) => Buffer.from(u8).toString('base64url') },
  };
  const ls = { getItem: (k) => store[k] ?? null, setItem: (k, v) => { store[k] = v; }, removeItem: (k) => { delete store[k]; } };
  const ctx = { D, CA, fetch, localStorage: ls, sessionStorage: ls, console, setTimeout, clearTimeout, crypto: globalThis.crypto, TextEncoder };
  vm.createContext(ctx);
  vm.runInContext(src + '\nthis.Acc = Acc;', ctx);
  return { Acc: ctx.Acc, D, calls, store, ctx, get srvVersion() { return srvVersion; }, get puts() { return calls.filter((c) => c === 'PUT /v1/blob').length; } };
}

const withData = { projects: [{ id: 'l1' }], clientes: [], gastos: [] };
const empty = { projects: [], clientes: [], gastos: [] };
const me = (version, syncedAt) => ({ email: 'a@b.c', version, syncedAt });

async function run(name, opts, expectAction, extra) {
  const env = setup(opts);
  assert.equal((await env.Acc.login('a@b.c', 'pw')).ok, true);
  const r = await env.Acc.resume();
  assert.equal(r.action, expectAction, name);
  if (extra) await extra(env, r);
  console.log('ok -', name);
}

// local limpio -> baja la nube
await run('sin cambios locales: pull', { meta: me(5, 100), cloudVersion: 7, local: withData, lastSaved: 100 }, 'pulled',
  (e) => assert.equal(e.D.d.projects[0].id, 'c1'));
// local sucio, nube quieta -> sube
await run('cambios locales, nube igual: push', { meta: me(5, 100), cloudVersion: 5, local: withData, lastSaved: 200 }, 'pushed',
  (e) => { assert.equal(e.srvVersion, 6); assert.equal(e.D.d.projects[0].id, 'l1'); });
// los dos cambiaron -> pregunta, sin tocar nada
await run('ambos cambiaron: conflicto', { meta: me(5, 100), cloudVersion: 7, local: withData, lastSaved: 200 }, 'conflict',
  (e, r) => { assert.equal(r.cloudVersion, 7); assert.ok(!e.calls.includes('PUT /v1/blob')); assert.equal(e.D.d.projects[0].id, 'l1'); });
// primera vez en este navegador con datos -> pregunta
await run('primera vez aquí con datos: conflicto', { meta: null, cloudVersion: 3, local: withData, lastSaved: 50 }, 'conflict');
// copia local vacía -> nunca sucia
await run('local vacío: pull', { meta: null, cloudVersion: 3, local: empty, lastSaved: 50 }, 'pulled');
// nube vacía -> sube lo local
await run('nube vacía: push', { meta: null, cloudVersion: 0, local: withData, lastSaved: 50 }, 'pushed',
  (e) => assert.equal(e.srvVersion, 1));

// resolve
for (const [choice, ids] of [['cloud', ['c1']], ['local', ['l1']], ['merge', ['c1', 'l1']]]) {
  await run('resolve ' + choice, { meta: me(5, 100), cloudVersion: 7, local: withData, lastSaved: 200 }, 'conflict', async (e, r) => {
    const out = await e.Acc.resolve(choice, r.cloudVersion);
    assert.equal(out.ok, true, choice);
    assert.equal(JSON.stringify(e.D.d.projects.map((p) => p.id).sort()), JSON.stringify(ids));
    if (choice !== 'cloud') assert.equal(e.srvVersion, 8);
    // tras resolver, la copia queda limpia: el siguiente resume solo baja
    const meta = JSON.parse(e.store.trackr_acct);
    assert.equal(meta.version, choice === 'cloud' ? 7 : 8);
    assert.ok(meta.syncedAt >= e.D.lastSaved);
  });
}
// logout conserva la meta (la base de esta copia) y deja role a su valor por defecto
{
  const e = setup({ meta: me(5, 100), cloudVersion: 5, local: withData, lastSaved: 100 });
  await e.Acc.login('a@b.c', 'pw'); await e.Acc.logout();
  assert.equal(e.Acc.status().role, 'persona');
  assert.equal(JSON.parse(e.store.trackr_acct).version, 5);
  console.log('ok - logout: meta y role');
}

// mergeData: la auditoria se une y hace de reloj: borrados que se propagan, edicion mas reciente gana
{
  const { Acc } = setup({ meta: null, cloudVersion: 1, local: empty, lastSaved: 1 });
  const local = {
    projects: [{ id: 'p1', nombre: 'viejo' }, { id: 'p3', nombre: 'solo local' }],
    gastos: [{ id: 'g1', nombre: 'borrado en la nube pero editado aqui despues' }],
    audit: [{ ts: 2, accion: 'crear', entidad: 'cliente', entidadId: 'x' }, { ts: 10, accion: 'editar', entidad: 'proyecto', entidadId: 'p1' },
            { ts: 50, accion: 'editar', entidad: 'gasto', entidadId: 'g1' }]
  };
  const cloud = {
    projects: [{ id: 'p1', nombre: 'nuevo' }, { id: 'p2', nombre: 'borrado en local' }],
    gastos: [],
    audit: [{ ts: 1, accion: 'crear', entidad: 'gasto', entidadId: 'y' }, { ts: 20, accion: 'editar', entidad: 'proyecto', entidadId: 'p1' },
            { ts: 40, accion: 'borrar', entidad: 'gasto', entidadId: 'g1' }]
  };
  local.audit.push({ ts: 30, accion: 'borrar', entidad: 'proyecto', entidadId: 'p2' });
  const m = Acc._mergeData(local, cloud);
  assert.equal(m.projects.find((p) => p.id === 'p1').nombre, 'nuevo');        // edicion mas reciente (nube) gana
  assert.equal(m.projects.some((p) => p.id === 'p2'), false);                 // borrado local se propaga
  assert.equal(m.projects.some((p) => p.id === 'p3'), true);                  // lo nuevo de cada lado se queda
  assert.equal(m.gastos.length, 1);                                           // borrado viejo no mata una edicion posterior
  assert.equal(m.journey, undefined);
  assert.equal(JSON.stringify(m.audit.map((e) => e.ts)), '[1,2,10,20,30,40,50]');
  console.log('ok - merge: reloj por registro y borrados');
}

// alcance fiscal de la gestoría: las notas del cliente no viajan
{
  const { Acc, D } = setup({ meta: null, cloudVersion: 1, local: empty, lastSaved: 1 });
  D.d = { version: 4, clientes: [{ id: 'c', nombre: 'X', nif: '1', notas: 'privado' }], projects: [], gastos: [], deducibles: [], facturas: [], settings: {} };
  const sh = Acc._buildShareData('fiscal');
  assert.equal(sh.clientes[0].notas, undefined);
  assert.equal(sh.clientes[0].nif, '1');
  assert.equal(D.d.clientes[0].notas, 'privado'); // el original intacto
  console.log('ok - fiscal: sin notas de cliente');
}

// no se sube lo que no ha cambiado (cada subida = una versión en el servidor)
{
  const e = setup({ meta: me(5, 100), cloudVersion: 5, local: withData, lastSaved: 200 });
  await e.Acc.login('a@b.c', 'pw');
  await e.Acc.resume();                      // sube (había cambios)
  const v = e.srvVersion, n = e.puts;
  const r = await e.Acc.push();              // nada cambió
  assert.equal(r.unchanged, true); assert.equal(e.srvVersion, v); assert.equal(e.puts, n);
  e.D.d.clientes.push({ id: 'nuevo' });
  await e.Acc.push();                        // ahora sí
  assert.equal(e.srvVersion, v + 1);
  console.log('ok - sin cambios no se sube');
}

// restaurar una versión vieja = versión nueva con ese contenido (base = la actual, sin merge)
{
  const e = setup({ meta: me(5, 100), cloudVersion: 5, local: withData, lastSaved: 200 });
  await e.Acc.login('a@b.c', 'pw');
  await e.Acc.resume();                      // v6: solo l1
  e.D.d.projects.push({ id: 'l2' }); await e.Acc.push();   // v7: l1 + l2
  const r = await e.Acc.restoreVersion(6, 7);
  assert.equal(r.ok, true); assert.equal(e.srvVersion, 8);
  assert.equal(JSON.stringify(e.D.d.projects.map((p) => p.id)), '["l1"]');
  console.log('ok - restaurar versión');
}

// token caducado (401 en el PUT): la copia pasa a bloqueada y no se reintenta en silencio
{
  const e = setup({ meta: me(5, 100), cloudVersion: 5, local: withData, lastSaved: 200 });
  await e.Acc.login('a@b.c', 'pw');
  await e.Acc.resume();
  const real = e.ctx.fetch;
  e.ctx.fetch = async (url, opt = {}) => (opt.method === 'PUT' ? { status: 401, json: async () => ({ error: 'invalid_token' }) } : real(url, opt));
  e.D.d.clientes.push({ id: 'nuevo' });
  const r = await e.Acc.push();
  assert.equal(r.error, 'session_expired');
  assert.equal(e.Acc.status().state, 'locked');
  assert.equal((await e.Acc.push()).error, 'not_ready');   // bloqueada: no vuelve a intentarlo solo
  console.log('ok - 401 bloquea la sesión');
}
