/* La clave privada de la gestoría no vive en los datos (D.d): ni en localStorage en claro, ni en
 * las copias, ni en «Exportar». Viaja dentro del blob cifrado de la nube: se quita al bajar y se
 * vuelve a poner al subir. Sin red: fetch y CA simulados (el «cifrado» de aquí es JSON).
 * Ejecutar: node test/gestor-clave.mjs */
import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import vm from 'node:vm';

const src = readFileSync(new URL('../js/account.js', import.meta.url), 'utf8');
const KP = { publicKey: 'PUB', privateJwk: { d: 'PRIVADA' }, fingerprint: 'aa:bb' };

function setup({ cloud, local, role = 'gestor', blobDown = false }) {
  const store = {}; const puts = []; let srvVersion = 3, down = blobDown;
  const blobs = { 3: JSON.stringify(cloud) };
  const D = { d: local, lastSaved: 10, saves: 0, load(j) { this.d = j; }, save() { this.saves++; this.lastSaved++; } };
  const res = (status, data) => ({ status, json: async () => data });
  const fetch = async (url, opt = {}) => {
    const path = url.replace(/^https?:\/\/[^/]+/, '').split('?')[0], m = opt.method || 'GET';
    const body = opt.body ? JSON.parse(opt.body) : {};
    if (path === '/v1/prelogin') return res(200, { kdfMem: 1, kdfTime: 1, kdfPar: 1, kdfSalt: 's', loginNonce: 'n' });
    if (path === '/v1/login') return res(200, { token: 't', credEpoch: 1, currentVersion: srvVersion, active: true, role });
    if (path === '/v1/blob/meta') return res(200, { currentVersion: srvVersion, updatedAt: 1700000000 });
    if (path === '/v1/blob' && m === 'GET') return down ? res(503, {}) : res(200, { blob: blobs[srvVersion], version: srvVersion });
    if (path === '/v1/blob' && m === 'PUT') {
      if (body.baseVersion !== srvVersion) return res(409, { currentVersion: srvVersion });
      blobs[++srvVersion] = body.blob; puts.push(JSON.parse(body.blob));
      return res(200, { version: srvVersion });
    }
    return res(404, {});
  };
  const CA = {
    available: () => true, canonEmail: (e) => e,
    deriveForLogin: async () => ({ authKey: 'a', wrapKeyPwd: 'w' }), unwrapLogin: async () => 'dek',
    decryptDownload: async (dek, blob) => JSON.parse(blob),
    encryptForUpload: async (dek, data) => ({ blob: JSON.stringify(data), blobHash: 'h' }),
    _: { b64u: (u8) => Buffer.from(u8).toString('base64url') },
  };
  const ls = { getItem: (k) => store[k] ?? null, setItem: (k, v) => { store[k] = v; }, removeItem: (k) => { delete store[k]; } };
  const ctx = { D, CA, fetch, localStorage: ls, sessionStorage: ls, console, setTimeout, clearTimeout, crypto: globalThis.crypto, TextEncoder };
  vm.createContext(ctx);
  vm.runInContext(src + '\nthis.Acc = Acc;', ctx);
  return { Acc: ctx.Acc, D, puts, store, setDown: (v) => { down = v; } };
}
const META = JSON.stringify({ email: 'g@b.c', version: 3, syncedAt: 1 });
const datos = (kp) => ({ version: 4, projects: [], clientes: [], gastos: [], settings: { idioma: 'es', ...(kp && { gestorKeypair: kp }) } });

// Dispositivo nuevo: baja el blob, la clave no entra en los datos y al subir vuelve a ir dentro
{
  const e = setup({ cloud: datos(KP), local: datos() });
  await e.Acc.login('g@b.c', 'pw');
  assert.equal((await e.Acc.pull()).ok, true);
  assert.equal(e.D.d.settings.gestorKeypair, undefined, 'los datos locales no llevan la clave');
  assert.ok(!JSON.stringify(e.D.d).includes('PRIVADA'));
  assert.equal(e.Acc.gestorFingerprint(), 'aa:bb', 'la huella pública sí se puede enseñar');
  assert.equal(JSON.stringify(Object.keys(e.Acc).filter((k) => /kp|keypair|private/i.test(k))), '[]', 'ninguna función de fuera devuelve la privada');
  e.D.d.clientes.push({ id: 'c1' });
  assert.equal((await e.Acc.push()).ok, true);
  assert.equal(e.puts.at(-1).settings.gestorKeypair.privateJwk.d, 'PRIVADA', 'el blob de la nube la sigue llevando');
  assert.equal(e.D.d.settings.gestorKeypair, undefined, 'y subir no la devuelve a los datos');
  await e.Acc.logout();
  assert.equal(e.store.trackr_gkp, undefined, 'cerrar sesión la quita de este navegador');
  console.log('ok - la clave se quita al bajar y se pone al subir');
}

// Datos locales de antes de este cambio (clave dentro de settings): se saca sola al subir
{
  const e = setup({ cloud: datos(KP), local: datos(KP) });
  await e.Acc.login('g@b.c', 'pw');
  e.D.d.clientes.push({ id: 'c1' });
  assert.equal((await e.Acc.push()).ok, true);
  assert.equal(e.D.d.settings.gestorKeypair, undefined);
  assert.ok(e.D.saves > 0, 'y se guarda ya sin ella');
  assert.equal(e.puts.at(-1).settings.gestorKeypair.privateJwk.d, 'PRIVADA');
  console.log('ok - migración de datos locales viejos');
}

// Tras recargar (memoria vacía) la recupera de su copia local cifrada, sin red
{
  const e = setup({ cloud: datos(KP), local: datos() });
  await e.Acc.login('g@b.c', 'pw'); await e.Acc.pull();
  const guardada = e.store.trackr_gkp;
  const e2 = setup({ cloud: datos(KP), local: datos(), blobDown: true });
  e2.store.trackr_gkp = guardada;
  e2.store.trackr_acct = META; // este navegador ya iba por la versión 3
  await e2.Acc.login('g@b.c', 'pw');
  e2.D.d.clientes.push({ id: 'c1' });
  const r = await e2.Acc.push();
  assert.equal(r.ok, true);
  assert.equal(e2.puts.at(-1).settings.gestorKeypair.privateJwk.d, 'PRIVADA');
  console.log('ok - copia local cifrada');
}

// Sin la clave a mano y sin poder mirar la nube: no se sube (subir sin ella la borraría)
{
  const e = setup({ cloud: datos(KP), local: datos(), blobDown: true });
  e.store.trackr_acct = META; // versión local > 0: hay un blob en la nube que podría llevar la clave
  await e.Acc.login('g@b.c', 'pw');
  e.D.d.clientes.push({ id: 'c1' });
  const r = await e.Acc.push();
  assert.equal(r.ok, false);
  assert.equal(e.puts.length, 0, 'no se ha subido nada');
  e.setDown(false);
  assert.equal((await e.Acc.push()).ok, true, 'con red, la recoge de la nube y sube');
  assert.equal(e.puts.at(-1).settings.gestorKeypair.privateJwk.d, 'PRIVADA');
  console.log('ok - sin la clave no se sube');
}

// Una cuenta normal no cambia nada
{
  const e = setup({ cloud: datos(), local: datos(), role: 'persona' });
  await e.Acc.login('p@b.c', 'pw'); await e.Acc.pull();
  e.D.d.clientes.push({ id: 'c1' });
  assert.equal((await e.Acc.push()).ok, true);
  assert.equal(e.puts.at(-1).settings.gestorKeypair, undefined);
  console.log('ok - cuenta persona');
}
