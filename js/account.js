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
            version: 0, active: false, isAdmin: false, userId: null };

  /* ── persistencia ── */
  function saveMeta() {
    try {
      localStorage.setItem(MKEY, JSON.stringify({ email: S.email, kdf: S.kdf, credEpoch: S.credEpoch, version: S.version, active: S.active, isAdmin: S.isAdmin, userId: S.userId }));
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

  function status() { return { state: S.state, email: S.email, active: S.active, isAdmin: S.isAdmin, version: S.version }; }
  function isUnlocked() { return S.state === 'in' && !!S.dek; }

  /* ── SIGNUP ── */
  async function signup(emailRaw, password, dataObj) {
    if (!CA.available()) throw new Error('crypto_unavailable');
    const su = await CA.buildSignup(emailRaw, password, dataObj);
    const r = await api('/v1/signup', { method: 'POST', body: su.payload });
    if (r.status === 201) {
      S = { state: 'in', token: r.data.token, email: su.email, dek: su.dek, credEpoch: su.credEpoch, kdf: { mem: 65536, time: 3, par: 1 }, version: r.data.currentVersion || 1, active: !!r.data.active, isAdmin: !!r.data.isAdmin, userId: r.data.userId };
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
    S = { state: 'in', token: lg.data.token, email, dek, credEpoch: lg.data.credEpoch, kdf, version: lg.data.currentVersion || 0, active: !!lg.data.active, isAdmin: !!lg.data.isAdmin, userId: lg.data.userId };
    setToken(lg.data.token); saveMeta();
    return { ok: true, active: S.active, isAdmin: S.isAdmin };
  }

  // Al recargar: si hay token+meta pero no DEK -> bloqueado. unlock() = re-login (re-deriva DEK).
  function detectLocked() {
    const t = getToken(); const m = loadMeta();
    if (t && m && m.email && !S.dek) {
      S = { ...S, state: 'locked', token: t, email: m.email, kdf: m.kdf || S.kdf, credEpoch: m.credEpoch || 1, version: m.version || 0, active: !!m.active, isAdmin: !!m.isAdmin, userId: m.userId || null };
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
    if (typeof D !== 'undefined' && D.load) D.load(data);
    return { ok: true, version: g.data.version };
  }

  // Cifra D.d y lo sube. Concurrencia optimista: en 409 baja, recarga y reintenta una vez.
  async function push(dataObj, _retry) {
    if (!isUnlocked() || !S.active) return { ok: false, error: 'not_ready' };
    const data = dataObj || (typeof D !== 'undefined' ? D.d : null);
    if (!data) return { ok: false, error: 'no_data' };
    const { blob, blobHash } = await CA.encryptForUpload(S.dek, data, S.email, S.version + 1);
    const r = await api('/v1/blob', { method: 'PUT', auth: true, body: { blob, blobHash, baseVersion: S.version } });
    if (r.status === 200) { S.version = r.data.version; saveMeta(); return { ok: true, version: r.data.version }; }
    if (r.status === 409 && !_retry) {
      // conflicto: alguien subio otra version. Baja la actual (local-first: el usuario mergeara) y reintenta.
      S.version = r.data.currentVersion;
      return { ok: false, error: 'version_conflict', currentVersion: r.data.currentVersion };
    }
    if (r.status === 403) return { ok: false, error: 'inactive' };
    return { ok: false, error: r.data?.error || 'put_failed' };
  }

  /* ── auto-sync (debounce) ── */
  let _timer = null, _enabled = false;
  function setAutoSync(on) { _enabled = !!on; }
  function notifyChange() {
    if (!_enabled || !isUnlocked() || !S.active) return;
    if (_timer) clearTimeout(_timer);
    _timer = setTimeout(() => { _timer = null; push().catch(() => {}); }, 2500);
  }

  /* ── Admin (solo is_admin; el servidor reverifica) ── */
  async function adminListUsers() { const r = await api('/v1/admin/users', { auth: true }); return r.status === 200 ? r.data.users : null; }
  async function adminSetActive(id, active) { const r = await api(`/v1/admin/users/${encodeURIComponent(id)}/active`, { method: 'POST', auth: true, body: { active } }); return r.status === 200; }
  async function adminSetPaid(id, paid) { const r = await api(`/v1/admin/users/${encodeURIComponent(id)}/paid`, { method: 'POST', auth: true, body: { paid } }); return r.status === 200; }
  async function adminDelete(id) { const r = await api(`/v1/admin/users/${encodeURIComponent(id)}`, { method: 'DELETE', auth: true }); return r.status === 204; }

  return {
    signup, login, unlock, logout, changePassword, recover, pull, push,
    adminListUsers, adminSetActive, adminSetPaid, adminDelete,
    status, isUnlocked, detectLocked, setAutoSync, notifyChange, setApiBase: (u) => { API_BASE = u; },
    get email() { return S.email; }, get version() { return S.version; }, get state() { return S.state; },
  };
})();
if (typeof window !== 'undefined') window.Acc = Acc;
