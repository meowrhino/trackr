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
    if (path === '/v1/blob' && m === 'GET') return res(200, { blob: 'b', version: srvVersion });
    if (path === '/v1/blob' && m === 'PUT') {
      if (body.baseVersion !== srvVersion) return res(409, { currentVersion: srvVersion });
      return res(200, { version: ++srvVersion });
    }
    return res(404, {});
  };
  const CA = {
    available: () => true, canonEmail: (e) => e,
    deriveForLogin: async () => ({ authKey: 'a', wrapKeyPwd: 'w' }),
    unwrapLogin: async () => 'dek',
    decryptDownload: async () => structuredClone(cloud),
    encryptForUpload: async () => ({ blob: 'b', blobHash: 'h' }),
  };
  const ls = { getItem: (k) => store[k] ?? null, setItem: (k, v) => { store[k] = v; }, removeItem: (k) => { delete store[k]; } };
  const ctx = { D, CA, fetch, localStorage: ls, sessionStorage: ls, console, setTimeout, clearTimeout };
  vm.createContext(ctx);
  vm.runInContext(src + '\nthis.Acc = Acc;', ctx);
  return { Acc: ctx.Acc, D, calls, store, get srvVersion() { return srvVersion; } };
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

// mergeData: journey y audit ya no los pisa la nube
{
  const { Acc } = setup({ meta: null, cloudVersion: 1, local: empty, lastSaved: 1 });
  const local = { projects: [], journey: { stages: [{ id: 's1' }], cards: [{ id: 'jl' }] }, audit: [{ ts: 2, accion: 'crear', entidad: 'cliente', entidadId: 'x' }] };
  const cloud = { projects: [], journey: { stages: [{ id: 's1' }, { id: 's2' }], cards: [{ id: 'jc' }] }, audit: [{ ts: 1, accion: 'crear', entidad: 'gasto', entidadId: 'y' }] };
  const m = Acc._mergeData(local, cloud);
  assert.equal(JSON.stringify(m.journey.cards.map((c) => c.id).sort()), '["jc","jl"]');
  assert.equal(m.journey.stages.length, 1); // estadios: gana el local
  assert.equal(JSON.stringify(m.audit.map((e) => e.ts)), '[1,2]');
  console.log('ok - merge: journey y audit');
}
