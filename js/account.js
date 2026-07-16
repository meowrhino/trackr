/* ================================================
 * TRACKR — Cuenta: cliente API + estado de sesion + sync.  Global: Acc.
 *
 * Orquesta CA (cripto zero-knowledge) + el backend (trackr-api). El token vive en
 * sessionStorage; la DEK SOLO en memoria (al recargar -> "bloqueado", re-login para
 * desbloquear). Local-first: el sync cifra D.d y lo sube; al bajar, descifra y D.load.
 *
 * Estados: 'out' (sin sesion) · 'locked' (token pero sin DEK, p.ej. tras recargar) · 'in'.
 * ================================================ */
const Acc = (() => {
  let API_BASE = 'https://trackr-api.manuellatourf.workers.dev';
  const TKEY = 'trackr_token';     // token en sessionStorage
  const MKEY = 'trackr_acct';      // metadatos no secretos en localStorage (email, kdf, version...)

  // estado en memoria
  let S = { state: 'out', token: null, email: null, dek: null, credEpoch: 1, kdf: { mem: 65536, time: 3, par: 1 },
            version: 0, active: false, isAdmin: false, role: 'persona', userId: null };

  /* ── persistencia ── */
  function saveMeta() {
    try {
      localStorage.setItem(MKEY, JSON.stringify({ email: S.email, kdf: S.kdf, credEpoch: S.credEpoch, version: S.version, active: S.active, isAdmin: S.isAdmin, role: S.role, userId: S.userId }));
    } catch (e) { /* ignore */ }
  }
  function loadMeta() { try { return JSON.parse(localStorage.getItem(MKEY) || 'null'); } catch (e) { return null; } }
  function setToken(t) { try { sessionStorage.setItem(TKEY, t); } catch (e) { /* */ } S.token = t; }
  function getToken() { try { return sessionStorage.getItem(TKEY); } catch (e) { return null; } }
  function wipe() {
    try { sessionStorage.removeItem(TKEY); } catch (e) { /* */ }
    S = { state: 'out', token: null, email: null, dek: null, credEpoch: 1, kdf: { mem: 65536, time: 3, par: 1 }, version: 0, active: false, isAdmin: false, userId: null };
  }

  /* ── fetch helper ── */
  async function api(path, { method = 'GET', body, auth = false } = {}) {
    const headers = {};
    if (body !== undefined) headers['Content-Type'] = 'application/json';
    if (auth && S.token) headers['Authorization'] = 'Bearer ' + S.token;
    let res;
    try { res = await fetch(API_BASE + path, { method, headers, body: body !== undefined ? JSON.stringify(body) : undefined }); }
    catch (e) { return { status: 0, data: null, netErr: true }; }
    let data = null; try { data = await res.json(); } catch (e) { /* 204 etc */ }
    return { status: res.status, data };
  }

  function status() { return { state: S.state, email: S.email, active: S.active, isAdmin: S.isAdmin, role: S.role, version: S.version }; }
  function isUnlocked() { return S.state === 'in' && !!S.dek; }

  /* ── SIGNUP ── */
  async function signup(emailRaw, password, dataObj, role) {
    if (!CA.available()) throw new Error('crypto_unavailable');
    role = role === 'gestor' ? 'gestor' : 'persona';
    /* Cuenta gestor: genera su par ECDH aqui; la privada viaja DENTRO del blob inicial
       (cifrado con su DEK). La publica se publica al primer login activo (gestorEnsureKey). */
    if (role === 'gestor') {
      dataObj = dataObj || CA.emptyData();
      if (!dataObj.settings) dataObj.settings = {};
      dataObj.settings.gestorKeypair = await CA.genShareKeypair();
    }
    const su = await CA.buildSignup(emailRaw, password, dataObj);
    su.payload.role = role;
    const r = await api('/v1/signup', { method: 'POST', body: su.payload });
    if (r.status === 201) {
      S = { state: 'in', token: r.data.token, email: su.email, dek: su.dek, credEpoch: su.credEpoch, kdf: { mem: 65536, time: 3, par: 1 }, version: r.data.currentVersion || 1, active: !!r.data.active, isAdmin: !!r.data.isAdmin, role, userId: r.data.userId };
      setToken(r.data.token); saveMeta();
      return { ok: true, recoveryCode: su.recoveryCode, active: S.active, isAdmin: S.isAdmin };
    }
    if (r.status === 202) return { ok: true, pending: true, recoveryCode: su.recoveryCode }; // cuenta creada (active=0) o email ya existente (anti-enum)
    if (r.status === 403) return { ok: false, error: 'signups_closed' };
    if (r.status === 400) return { ok: false, error: r.data?.error || 'bad_request' };
    return { ok: false, error: r.data?.error || 'signup_failed' };
  }

  /* ── LOGIN ── */
  async function login(emailRaw, password) {
    if (!CA.available()) throw new Error('crypto_unavailable');
    const email = CA.canonEmail(emailRaw);
    if (!email) return { ok: false, error: 'invalid_email' };
    const pre = await api('/v1/prelogin', { method: 'POST', body: { email } });
    if (pre.status !== 200 || !pre.data) return { ok: false, error: 'network' };
    const kdf = { mem: pre.data.kdfMem, time: pre.data.kdfTime, par: pre.data.kdfPar };
    const { authKey, wrapKeyPwd } = await CA.deriveForLogin(password, pre.data.kdfSalt, kdf);
    const lg = await api('/v1/login', { method: 'POST', body: { email, loginNonce: pre.data.loginNonce, authKey } });
    if (lg.status !== 200 || !lg.data) return { ok: false, error: lg.data?.error || 'invalid_credentials' };
    let dek;
    try { dek = await CA.unwrapLogin(wrapKeyPwd, lg.data.wrappedDEK_pwd, email, lg.data.credEpoch); }
    catch (e) { return { ok: false, error: 'unwrap_failed' }; } // contrasena ok pero envelope no abre (no deberia pasar)
    S = { state: 'in', token: lg.data.token, email, dek, credEpoch: lg.data.credEpoch, kdf, version: lg.data.currentVersion || 0, active: !!lg.data.active, isAdmin: !!lg.data.isAdmin, role: lg.data.role || 'persona', userId: lg.data.userId };
    setToken(lg.data.token); saveMeta();
    return { ok: true, active: S.active, isAdmin: S.isAdmin, role: S.role };
  }

  // Al recargar: si hay token+meta pero no DEK -> bloqueado. unlock() = re-login (re-deriva DEK).
  function detectLocked() {
    const t = getToken(); const m = loadMeta();
    if (t && m && m.email && !S.dek) {
      S = { ...S, state: 'locked', token: t, email: m.email, kdf: m.kdf || S.kdf, credEpoch: m.credEpoch || 1, version: m.version || 0, active: !!m.active, isAdmin: !!m.isAdmin, role: m.role || 'persona', userId: m.userId || null };
      return true;
    }
    return false;
  }
  async function unlock(password) { return await login(S.email, password); }

  /* ── LOGOUT ── */
  async function logout() {
    if (S.token) await api('/v1/logout', { method: 'POST', auth: true });
    wipe();
    return { ok: true };
  }

  /* ── CAMBIO DE CONTRASENA ── */
  async function changePassword(currentPassword, newPassword) {
    if (!isUnlocked()) return { ok: false, error: 'locked' };
    // necesitamos el kdfSalt actual: lo pedimos via prelogin (timing-equalizado, no filtra)
    const pre = await api('/v1/prelogin', { method: 'POST', body: { email: S.email } });
    if (pre.status !== 200) return { ok: false, error: 'network' };
    let pc;
    try { pc = await CA.buildPasswordChange(S.email, currentPassword, newPassword, S.dek, pre.data.kdfSalt, S.credEpoch, S.kdf); }
    catch (e) { return { ok: false, error: e.message }; }
    const r = await api('/v1/account/password', { method: 'POST', auth: true, body: pc });
    if (r.status !== 200) return { ok: false, error: r.data?.error || 'change_failed' };
    S.credEpoch = pc.newCredEpoch; setToken(r.data.token); saveMeta();
    return { ok: true };
  }

  /* ── RECUPERACION (2 fases) ── */
  async function recover(emailRaw, recoveryCode, newPassword) {
    if (!CA.available()) throw new Error('crypto_unavailable');
    const email = CA.canonEmail(emailRaw);
    if (!email) return { ok: false, error: 'invalid_email' };
    if (!CA.isValidRecovery(recoveryCode)) return { ok: false, error: 'invalid_recovery_format' };
    const start = await api('/v1/recover/start', { method: 'POST', body: { email } });
    if (start.status !== 200) return { ok: false, error: 'network' };
    const kdf = { mem: start.data.kdfMem, time: start.data.kdfTime, par: start.data.kdfPar };
    const { recProof, wrapKeyRec } = await CA.buildRecoverProof(recoveryCode, start.data.recSalt, kdf);
    // fase material
    const mat = await api('/v1/recover/redeem?phase=material', { method: 'POST', body: { email, recNonce: start.data.recNonce, recProof: recProof } });
    if (mat.status !== 200 || !mat.data?.wrappedDEK_rec) return { ok: false, error: mat.data?.error || 'invalid_recovery' };
    let built;
    try { built = await CA.buildRecoverCommit(email, newPassword, wrapKeyRec, mat.data.wrappedDEK_rec, mat.data.credEpoch, kdf); }
    catch (e) { return { ok: false, error: e.message }; }
    // fase commit (con el recNonce fresco que devolvio material)
    const com = await api('/v1/recover/redeem?phase=commit', { method: 'POST', body: { email, recNonce: mat.data.recNonce, recProof: recProof, ...built.commit } });
    if (com.status !== 200) return { ok: false, error: com.data?.error || 'recovery_failed' };
    S = { state: 'in', token: com.data.token, email, dek: built.dek, credEpoch: built.commit.newCredEpoch, kdf, version: 0, active: true, isAdmin: false, userId: mat.data.userId };
    setToken(com.data.token); saveMeta();
    return { ok: true };
  }

  /* ── SYNC ── */
  // Baja el blob actual del servidor, lo descifra y lo carga en D.
  async function pull() {
    if (!isUnlocked() || !S.active) return { ok: false, error: 'not_ready' };
    const meta = await api('/v1/blob/meta', { method: 'GET', auth: true });
    if (meta.status !== 200) return { ok: false, error: meta.data?.error || 'meta_failed' };
    if (!meta.data.currentVersion) { S.version = 0; return { ok: true, empty: true }; }
    const g = await api('/v1/blob', { method: 'GET', auth: true });
    if (g.status === 503) return { ok: false, error: 'kv_unavailable_retry' };
    if (g.status !== 200) return { ok: false, error: g.data?.error || 'get_failed' };
    let data;
    try { data = await CA.decryptDownload(S.dek, g.data.blob, S.email, g.data.version); }
    catch (e) { return { ok: false, error: 'decrypt_failed' }; }
    S.version = g.data.version;
    _applyRemote(data);
    return { ok: true, version: g.data.version };
  }

  // Merge de conflicto (multi-dispositivo): union por id (local gana en colisiones).
  // LIMITACION CONOCIDA (revision Etapa2): sin tombstones, un registro borrado en un dispositivo y
  // aun presente en la nube REAPARECE (los borrados no se propagan), y una edicion concurrente del
  // mismo id la pisa el local. Borrado/edicion fiables multi-dispositivo necesitan tombstones + reloj
  // por registro (futuro). Para 1 dispositivo (caso comun ahora) no aplica. El 409 hace H.snapshot.
  function mergeData(local, cloud) {
    local = local || {}; cloud = cloud || {};
    const out = {};
    for (const k of Object.keys(cloud)) out[k] = cloud[k];
    for (const key of ['projects', 'clientes', 'gastos', 'deducibles', 'facturas']) {
      if (!(local[key] || cloud[key])) continue;
      const byId = {};
      (cloud[key] || []).forEach((x) => { if (x && x.id != null) byId[x.id] = x; });
      (local[key] || []).forEach((x) => { if (x && x.id != null) byId[x.id] = x; }); // local gana
      out[key] = Object.values(byId);
    }
    // Settings: UI local gana, pero conservamos campos solo-nube y NO retrocedemos contadores monotonos
    // (p.ej. numeracion de facturas) para no romper la cadena/correlativo.
    out.settings = Object.assign({}, cloud.settings || {}, local.settings || {});
    const lc = local.settings || {}, cc = cloud.settings || {};
    for (const numKey of ['nextFacturaNum', 'nextNum', 'facturaCounter', 'numFactura']) {
      if (lc[numKey] != null || cc[numKey] != null) out.settings[numKey] = Math.max(Number(lc[numKey]) || 0, Number(cc[numKey]) || 0);
    }
    if (local.version != null) out.version = local.version;
    return out;
  }

  // Cifra D.d y lo sube. Concurrencia optimista: en 409 baja la nube, MERGEA y reintenta una vez.
  // Guard _pushing: evita pushes solapados (auto-sync + manual); si llega otro mientras, marca _dirty y relanza al acabar.
  async function push(dataObj, _retry) {
    if (!isUnlocked() || !S.active) return { ok: false, error: 'not_ready' };
    if (!_retry) {
      if (_pushing) { _dirty = true; return { ok: false, error: 'busy' }; }
      _pushing = true;
    }
    try {
      const data = dataObj || (typeof D !== 'undefined' ? D.d : null);
      if (!data) return { ok: false, error: 'no_data' };
      const { blob, blobHash } = await CA.encryptForUpload(S.dek, data, S.email, S.version + 1);
      const r = await api('/v1/blob', { method: 'PUT', auth: true, body: { blob, blobHash, baseVersion: S.version } });
      if (r.status === 200) { S.version = r.data.version; saveMeta(); return { ok: true, version: r.data.version }; }
      if (r.status === 409 && !_retry) {
        S.version = r.data.currentVersion;
        const g = await api('/v1/blob', { method: 'GET', auth: true });
        if (g.status === 200 && g.data) {
          let cloud = null;
          try { cloud = await CA.decryptDownload(S.dek, g.data.blob, S.email, g.data.version); } catch (e) { /* */ }
          if (cloud) {
            S.version = g.data.version;
            const merged = mergeData(data, cloud);
            if (typeof H !== 'undefined' && H.snapshot) H.snapshot(); // red de seguridad antes del merge
            _applyRemote(merged);
            return await push(merged, true);
          }
        }
        return { ok: false, error: 'version_conflict', currentVersion: r.data.currentVersion };
      }
      if (r.status === 403) return { ok: false, error: 'inactive' };
      return { ok: false, error: r.data?.error || 'put_failed' };
    } finally {
      if (!_retry) {
        _pushing = false;
        if (_dirty) { _dirty = false; setTimeout(() => { syncPush().catch(() => {}); }, 50); }
      }
    }
  }

  /* ── auto-sync (debounce) + guards de concurrencia/reentrada ── */
  let _timer = null, _enabled = false, _pushing = false, _dirty = false, _applyingRemote = false;
  function setAutoSync(on) { _enabled = !!on; }

  /* ── Notificacion de estado de sync a la UI (indicador en la barra) ── */
  let _onSync = null;
  function setSyncListener(fn) { _onSync = fn; }
  function emitSync(state, info) { if (_onSync) { try { _onSync(state, info || {}); } catch (e) { /* */ } } }
  // Envuelve push() para emitir 'syncing'/'synced'/'error' a la UI (manual + auto).
  // La recursion interna del 409 llama a push() directamente, asi que NO re-emite.
  async function syncPush(dataObj) {
    emitSync('syncing');
    let res;
    try { res = await push(dataObj); }
    catch (e) { emitSync('error', { error: String(e && e.message || e) }); throw e; } // no dejar el indicador atascado en 'syncing'
    if (res && res.ok) { emitSync('synced', res); pushShadow().catch(() => {}); } // blob sombra tras cada push OK (best-effort)
    else if (!res || res.error !== 'busy') emitSync('error', res || {}); // 'busy' = coalescado, el push en curso ya emitira
    return res;
  }
  // Carga datos remotos en D SIN disparar un push de vuelta (evita la reentrada del auto-sync).
  function _applyRemote(data) {
    _applyingRemote = true;
    try { if (typeof D !== 'undefined' && D.load) D.load(data); } finally { _applyingRemote = false; }
  }
  function notifyChange() {
    if (!_enabled || _applyingRemote || !isUnlocked() || !S.active) return;
    if (_timer) clearTimeout(_timer);
    _timer = setTimeout(() => { _timer = null; syncPush().catch(() => {}); }, 2500);
  }

  /* ── Gestores (comparticion E2E, PROTOCOL §15) ── */

  // Publica la clave publica del gestor si aun no lo esta (idempotente) y devuelve su codigo.
  // Se llama al entrar una cuenta gestor activa. El par vive en D.d.settings.gestorKeypair.
  async function gestorEnsureKey() {
    if (!isUnlocked() || !S.active || S.role !== 'gestor') return { ok: false, error: 'not_ready' };
    const kp = typeof D !== 'undefined' ? D.d?.settings?.gestorKeypair : null;
    if (!kp || !kp.publicKey) return { ok: false, error: 'no_keypair' };
    const r = await api('/v1/gestor/keys', { method: 'POST', auth: true, body: { publicKey: kp.publicKey } });
    if (r.status === 201 || r.status === 200) return { ok: true, code: r.data.code, fingerprint: r.data.fingerprint };
    return { ok: false, error: r.data?.error || 'publish_failed' };
  }

  async function gestorResolve(code) {
    const r = await api('/v1/gestor/resolve?code=' + encodeURIComponent(code), { method: 'GET', auth: true });
    return r.status === 200 ? { ok: true, ...r.data } : { ok: false, error: r.data?.error || 'not_found' };
  }

  // La persona crea el vinculo: genera shareKey, la envuelve hacia la publica del gestor
  // y guarda el grant en settings (dentro del blob principal cifrado, como todo).
  async function grantCreate(code, gestorPub, gestorEmail, scope) {
    if (!isUnlocked() || !S.active) return { ok: false, error: 'not_ready' };
    const shareKey = CA.genShareKey();
    const wrappedKey = await CA.wrapShareKey(gestorPub, shareKey);
    const r = await api('/v1/grants', { method: 'POST', auth: true, body: { code, wrappedKey, scope } });
    if (r.status !== 201) return { ok: false, error: r.data?.error || 'grant_failed' };
    D.d.settings.gestorGrant = {
      grantId: r.data.grantId, shareKey: CA._.b64u(shareKey), scope,
      gestorEmail, fingerprint: await CA.fingerprintOf(gestorPub),
    };
    D.save();
    pushShadow().catch(() => {}); // primera foto sin esperar al proximo cambio
    return { ok: true, grantId: r.data.grantId };
  }

  async function grantRevoke() {
    const g = D.d?.settings?.gestorGrant;
    if (!g) return { ok: true };
    const r = await api('/v1/grants/' + encodeURIComponent(g.grantId), { method: 'DELETE', auth: true });
    if (r.status === 204 || r.status === 404) { delete D.d.settings.gestorGrant; D.save(); return { ok: true }; }
    return { ok: false, error: r.data?.error || 'revoke_failed' };
  }

  async function gestorClients() {
    const r = await api('/v1/gestor/clients', { method: 'GET', auth: true });
    return r.status === 200 ? { ok: true, clients: r.data.clients } : { ok: false, error: r.data?.error || 'list_failed' };
  }

  // El gestor baja y descifra el blob sombra de un cliente.
  async function gestorOpenClient(grantId) {
    if (!isUnlocked() || S.role !== 'gestor') return { ok: false, error: 'not_ready' };
    const kp = D.d?.settings?.gestorKeypair;
    if (!kp) return { ok: false, error: 'no_keypair' };
    const r = await api('/v1/gestor/clients/' + encodeURIComponent(grantId) + '/blob', { method: 'GET', auth: true });
    if (r.status === 404) return { ok: false, error: r.data?.error || 'no_blob' };
    if (r.status !== 200) return { ok: false, error: r.data?.error || 'get_failed' };
    try {
      const shareKey = await CA.unwrapShareKey(kp.privateJwk, r.data.wrappedKey, kp.publicKey);
      const data = await CA.decryptShare(shareKey, r.data.blob, grantId);
      return { ok: true, data, scope: r.data.scope, updatedAt: r.data.updatedAt };
    } catch (e) { return { ok: false, error: 'decrypt_failed' }; }
  }

  // Construye la copia a compartir segun el alcance. 'fiscal' excluye lo personal:
  // horas y notas de los proyectos, y el journey completo. Para 'todo' se devuelve D.d
  // directamente (encryptShare ya lo serializa; clonar seria trabajo tirado).
  function buildShareData(scope) {
    const d = D.d;
    if (scope === 'todo') return d;
    const s = d.settings || {};
    return {
      version: d.version,
      clientes: d.clientes || [],
      gastos: d.gastos || [],
      deducibles: d.deducibles || [],
      facturas: d.facturas || [],
      projects: (d.projects || []).map(p => ({
        id: p.id, nombre: p.nombre, estado: p.estado, clienteId: p.clienteId,
        interno: p.interno, fechas: p.fechas, recurrente: p.recurrente, facturacion: p.facturacion,
      })),
      settings: { emisor: s.emisor, fiscal: s.fiscal, verifactu: s.verifactu, nextFacturaNum: s.nextFacturaNum, idioma: s.idioma },
    };
  }

  // Sube el blob sombra si hay grant activo. Best-effort: un fallo no rompe el sync normal.
  // Dirty-check por hash del texto plano: como encryptShare usa IV aleatorio, el ciphertext
  // cambia siempre y la idempotencia por content-hash del servidor nunca dispararia; comparar
  // el plano evita re-cifrar y re-subir cuando el subconjunto compartido no ha cambiado.
  let _lastShadowHash = null;
  async function pushShadow() {
    const g = typeof D !== 'undefined' ? D.d?.settings?.gestorGrant : null;
    if (!g || !isUnlocked() || !S.active) return;
    try {
      const plain = JSON.stringify(buildShareData(g.scope));
      const planoHash = CA._.b64u(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(g.grantId + '|' + plain))));
      if (planoHash === _lastShadowHash) return; // subconjunto compartido sin cambios
      const shareKey = CA._.b64uDec(g.shareKey);
      const { blob, blobHash } = await CA.encryptShare(shareKey, JSON.parse(plain), g.grantId);
      const r = await api('/v1/grants/' + encodeURIComponent(g.grantId) + '/blob', { method: 'PUT', auth: true, body: { blob, blobHash } });
      if (r.status === 404) { delete D.d.settings.gestorGrant; _lastShadowHash = null; D.save(); } // revocado por el gestor
      else if (r.status === 200) _lastShadowHash = planoHash;
    } catch (e) { console.warn('pushShadow failed:', e); }
  }

  /* ── Admin (solo is_admin; el servidor reverifica) ── */
  async function adminListUsers() { const r = await api('/v1/admin/users', { auth: true }); return r.status === 200 ? r.data.users : null; }
  async function adminSetActive(id, active) { const r = await api(`/v1/admin/users/${encodeURIComponent(id)}/active`, { method: 'POST', auth: true, body: { active } }); return r.status === 200; }
  async function adminSetPaid(id, paid) { const r = await api(`/v1/admin/users/${encodeURIComponent(id)}/paid`, { method: 'POST', auth: true, body: { paid } }); return r.status === 200; }
  async function adminDelete(id) { const r = await api(`/v1/admin/users/${encodeURIComponent(id)}`, { method: 'DELETE', auth: true }); return r.status === 204; }

  return {
    signup, login, unlock, logout, changePassword, recover, pull, push: syncPush,
    gestorEnsureKey, gestorResolve, grantCreate, grantRevoke, gestorClients, gestorOpenClient, pushShadow, _buildShareData: buildShareData,
    adminListUsers, adminSetActive, adminSetPaid, adminDelete, _mergeData: mergeData,
    status, isUnlocked, detectLocked, setAutoSync, setSyncListener, notifyChange, setApiBase: (u) => { API_BASE = u; },
    get email() { return S.email; }, get version() { return S.version; }, get state() { return S.state; },
  };
})();
if (typeof window !== 'undefined') window.Acc = Acc;
