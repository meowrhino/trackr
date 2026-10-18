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

  // estado en memoria. `version` = version de la nube en la que se basa la copia LOCAL;
  // `syncedAt` = D.lastSaved en el momento en que local y nube coincidian (tras pull/push OK).
  // Si D.lastSaved > syncedAt, este navegador tiene cambios que la nube no ha visto.
  const fresh = () => ({ state: 'out', token: null, email: null, dek: null, credEpoch: 1, kdf: { mem: 65536, time: 3, par: 1 },
            version: 0, syncedAt: 0, metaToken: null, active: false, isAdmin: false, role: 'persona', userId: null });
  let S = fresh();

  /* ── persistencia ── */
  function saveMeta() {
    try {
      localStorage.setItem(MKEY, JSON.stringify({ email: S.email, kdf: S.kdf, credEpoch: S.credEpoch, version: S.version, syncedAt: S.syncedAt, metaToken: S.metaToken, active: S.active, isAdmin: S.isAdmin, role: S.role, userId: S.userId }));
    } catch (e) { /* ignore */ }
  }
  function loadMeta() { try { return JSON.parse(localStorage.getItem(MKEY) || 'null'); } catch (e) { return null; } }
  function setToken(t) { try { sessionStorage.setItem(TKEY, t); } catch (e) { /* */ } S.token = t; }
  function getToken() { try { return sessionStorage.getItem(TKEY); } catch (e) { return null; } }
  function wipe() {
    try { sessionStorage.removeItem(TKEY); } catch (e) { /* */ }
    S = fresh(); // la meta en localStorage se queda: recuerda en que version estaba esta copia local
  }

  // Lo que este navegador sabe de su copia local para `email` (de la meta guardada).
  // Otra cuenta, o nunca sincronizado aqui: base 0 y syncedAt 0 (= sin referencia).
  function localBase(email) {
    const m = loadMeta();
    return (m && m.email === email) ? { version: m.version || 0, syncedAt: m.syncedAt || 0, metaToken: m.metaToken || null } : { version: 0, syncedAt: 0, metaToken: null };
  }
  const hasData = (d) => !!d && ['projects', 'clientes', 'gastos'].some(k => (d[k] || []).length);
  // Cambios locales que la nube no ha visto. Sin referencia (primera vez aqui) cuenta como
  // sucio si hay datos: no sabemos si estan en la nube. Una copia vacia nunca esta sucia.
  function localDirty() {
    const d = typeof D !== 'undefined' ? D.d : null;
    if (!hasData(d)) return false;
    return !S.syncedAt || (D.lastSaved || 0) > S.syncedAt;
  }
  // Cuenta recordada en este navegador (aunque no haya sesion): para la pantalla de inicio.
  function remembered() {
    const m = loadMeta();
    if (!m || !m.email) return null;
    const d = typeof D !== 'undefined' ? D.d : null;
    const dirty = hasData(d) && (!m.syncedAt || (D.lastSaved || 0) > m.syncedAt);
    return { email: m.email, version: m.version || 0, syncedAt: m.syncedAt || 0, dirty, hasPass: !!m.metaToken };
  }
  // Ultima subida a la nube desde CUALQUIER dispositivo, sin sesion (pase de solo
  // metadatos que da el login, ver backend handleDeviceMeta). null si no hay pase o falla.
  async function cloudMeta() {
    const m = loadMeta();
    if (!m || !m.metaToken) return null;
    const r = await api('/v1/device/meta', { method: 'POST', body: { token: m.metaToken } });
    if (r.status !== 200 || !r.data) return null;
    return { currentVersion: r.data.currentVersion || 0, updatedAt: (r.data.updatedAt || 0) * 1000 };
  }
  // Huella del texto plano de los datos: si no cambio desde la ultima vez que local y nube
  // coincidieron, no hay nada que subir (cada subida cifra con IV nuevo, asi que el servidor
  // no puede detectarlo y crearia una version identica).
  let _lastPlainHash = null;
  async function plainHash(data) {
    const b = new TextEncoder().encode(JSON.stringify(data));
    return CA._.b64u(new Uint8Array(await crypto.subtle.digest('SHA-256', b)));
  }
  function markSynced() { S.syncedAt = (typeof D !== 'undefined' && D.lastSaved) || Date.now(); saveMeta(); }

  /* ── fetch helper ── */
  async function api(path, { method = 'GET', body, auth = false, keepalive = false } = {}) {
    const headers = {};
    if (body !== undefined) headers['Content-Type'] = 'application/json';
    if (auth && S.token) headers['Authorization'] = 'Bearer ' + S.token;
    const payload = body !== undefined ? JSON.stringify(body) : undefined;
    // keepalive deja terminar la peticion aunque se cierre la pestana, pero el navegador
    // la rechaza por encima de 64 KB: solo se pide si cabe.
    keepalive = keepalive && (!payload || payload.length < 60000);
    let res;
    try { res = await fetch(API_BASE + path, { method, headers, body: payload, keepalive }); }
    catch (e) { return { status: 0, data: null, netErr: true }; }
    let data = null; try { data = await res.json(); } catch (e) { /* 204 etc */ }
    return { status: res.status, data };
  }

  /* Codigo de error para una respuesta fallida. Distingue el fallo de red REAL
     (fetch caido: sin conexion, o CORS bloqueando el origen) del 429 del rate limiter
     y del error que mande el servidor — todos acababan saliendo como 'network' o,
     peor, como 'invalid_credentials', y el usuario no podia saber que le pasaba. */
  function failOf(r, fallback) {
    if (r.netErr) return 'network';
    if (r.status === 429) return 'rate_limited';
    return r.data?.error || fallback;
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
      setToken(r.data.token); markSynced(); // el blob inicial ES la copia local
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
    if (pre.status !== 200 || !pre.data) return { ok: false, error: failOf(pre, 'server_error') };
    const kdf = { mem: pre.data.kdfMem, time: pre.data.kdfTime, par: pre.data.kdfPar };
    const { authKey, wrapKeyPwd } = await CA.deriveForLogin(password, pre.data.kdfSalt, kdf);
    const lg = await api('/v1/login', { method: 'POST', body: { email, loginNonce: pre.data.loginNonce, authKey } });
    if (lg.status !== 200 || !lg.data) return { ok: false, error: failOf(lg, 'invalid_credentials') };
    let dek;
    try { dek = await CA.unwrapLogin(wrapKeyPwd, lg.data.wrappedDEK_pwd, email, lg.data.credEpoch); }
    catch (e) { return { ok: false, error: 'unwrap_failed' }; } // contrasena ok pero envelope no abre (no deberia pasar)
    const base = localBase(email); // NO la version del servidor: la copia local puede ir por detras (ver resume)
    S = { state: 'in', token: lg.data.token, email, dek, credEpoch: lg.data.credEpoch, kdf, version: base.version, syncedAt: base.syncedAt, metaToken: lg.data.metaToken || base.metaToken, active: !!lg.data.active, isAdmin: !!lg.data.isAdmin, role: lg.data.role || 'persona', userId: lg.data.userId };
    setToken(lg.data.token); saveMeta();
    return { ok: true, active: S.active, isAdmin: S.isAdmin, role: S.role };
  }

  // Al recargar: si hay token+meta pero no DEK -> bloqueado. unlock() = re-login (re-deriva DEK).
  function detectLocked() {
    const t = getToken(); const m = loadMeta();
    if (t && m && m.email && !S.dek) {
      S = { ...S, state: 'locked', token: t, email: m.email, kdf: m.kdf || S.kdf, credEpoch: m.credEpoch || 1, version: m.version || 0, syncedAt: m.syncedAt || 0, metaToken: m.metaToken || null, active: !!m.active, isAdmin: !!m.isAdmin, role: m.role || 'persona', userId: m.userId || null };
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
    if (pre.status !== 200) return { ok: false, error: failOf(pre, 'server_error') };
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
    if (start.status !== 200) return { ok: false, error: failOf(start, 'server_error') };
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
    const base = localBase(email);
    S = { ...fresh(), state: 'in', token: com.data.token, email, dek: built.dek, credEpoch: built.commit.newCredEpoch, kdf, version: base.version, syncedAt: base.syncedAt, metaToken: base.metaToken, active: true, userId: mat.data.userId };
    setToken(com.data.token); saveMeta();
    return { ok: true };
  }

  /* ── SYNC ── */
  // Baja el blob actual del servidor, lo descifra y lo carga en D.
  async function pull() {
    if (!isUnlocked() || !S.active) return { ok: false, error: 'not_ready' };
    const meta = await api('/v1/blob/meta', { method: 'GET', auth: true });
    if (meta.status !== 200) return { ok: false, error: meta.data?.error || 'meta_failed' };
    if (!meta.data.currentVersion) { S.version = 0; saveMeta(); return { ok: true, empty: true }; }
    const g = await api('/v1/blob', { method: 'GET', auth: true });
    if (g.status === 503) return { ok: false, error: 'kv_unavailable_retry' };
    if (g.status !== 200) return { ok: false, error: g.data?.error || 'get_failed' };
    let data;
    try { data = await CA.decryptDownload(S.dek, g.data.blob, S.email, g.data.version); }
    catch (e) { return { ok: false, error: 'decrypt_failed' }; }
    S.version = g.data.version;
    _applyRemote(data);
    markSynced();
    _lastPlainHash = await plainHash(D.d);
    // El blob bajado puede traer un grant que otro dispositivo ya revoco (o un canEdit viejo)
    reconcileGrant(true).catch(() => {});
    return { ok: true, version: g.data.version };
  }

  // Merge de conflicto (multi-dispositivo): union por id (local gana en colisiones).
  // LIMITACION CONOCIDA (revision Etapa2): sin tombstones, un registro borrado en un dispositivo y
  // aun presente en la nube REAPARECE (los borrados no se propagan), y una edicion concurrente del
  // mismo id la pisa el local. Borrado/edicion fiables multi-dispositivo necesitan tombstones + reloj
  // por registro (futuro). Para 1 dispositivo (caso comun ahora) no aplica. El 409 hace H.snapshot.
  // Union de dos listas por clave; en colision gana la local.
  function unionBy(cloudArr, localArr, key) {
    const m = new Map();
    for (const x of [...(cloudArr || []), ...(localArr || [])]) { const k = x && key(x); if (k != null) m.set(k, x); }
    return [...m.values()];
  }
  function mergeData(local, cloud) {
    local = local || {}; cloud = cloud || {};
    const out = {};
    for (const k of Object.keys(cloud)) out[k] = cloud[k];
    for (const key of ['projects', 'clientes', 'gastos', 'deducibles', 'facturas']) {
      if (local[key] || cloud[key]) out[key] = unionBy(cloud[key], local[key], (x) => x.id);
    }
    // Journey: estadios del local (es lo que se ve aqui), tarjetas de los dos. Antes la
    // nube pisaba el objeto entero y se perdian las tarjetas creadas en este dispositivo.
    if (local.journey || cloud.journey) {
      out.journey = { ...(cloud.journey || {}), ...(local.journey || {}),
        cards: unionBy(cloud.journey?.cards, local.journey?.cards, (c) => c.id) };
    }
    // Auditoria: los eventos de los dos, en orden, con el mismo tope que D._auditAs.
    if (local.audit || cloud.audit) {
      out.audit = unionBy(cloud.audit, local.audit, (e) => `${e.ts}|${e.accion}|${e.entidad}|${e.entidadId}`)
        .sort((a, b) => a.ts - b.ts).slice(-((typeof D !== 'undefined' && D.AUDIT_MAX) || 500));
    }
    // Settings: UI local gana, pero conservamos campos solo-nube y NO retrocedemos contadores monotonos
    // (p.ej. numeracion de facturas) para no romper la cadena/correlativo.
    out.settings = Object.assign({}, cloud.settings || {}, local.settings || {});
    const lc = local.settings || {}, cc = cloud.settings || {};
    for (const numKey of ['nextFacturaNum', 'nextPresupuestoNum', 'nextNum', 'facturaCounter', 'numFactura']) {
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
      const savedAt = typeof D !== 'undefined' ? D.lastSaved : null; // lo que se edite durante el PUT sigue sucio
      const ph = await plainHash(data);
      if (!_retry && ph === _lastPlainHash && S.version) { S.syncedAt = savedAt || Date.now(); saveMeta(); return { ok: true, version: S.version, unchanged: true }; }
      const { blob, blobHash } = await CA.encryptForUpload(S.dek, data, S.email, S.version + 1);
      const r = await api('/v1/blob', { method: 'PUT', auth: true, keepalive: true, body: { blob, blobHash, baseVersion: S.version } });
      if (r.status === 200) { S.version = r.data.version; S.syncedAt = savedAt || Date.now(); _lastPlainHash = ph; saveMeta(); return { ok: true, version: r.data.version }; }
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
      // Token caducado (24 h sin uso / 7 dias). Antes salia como 'Error de sync' y se reintentaba cada
      // minuto para siempre; ahora la copia pasa a bloqueada y el indicador pide volver a entrar.
      if (r.status === 401) { S.state = 'locked'; S.dek = null; return { ok: false, error: 'session_expired' }; }
      return { ok: false, error: failOf(r, 'put_failed') };
    } finally {
      if (!_retry) {
        _pushing = false;
        if (_dirty) { _dirty = false; setTimeout(() => { syncPush().catch(() => {}); }, 50); }
      }
    }
  }

  /* ── Al entrar (login/desbloqueo/recuperacion): decidir quien manda ──
     Antes se bajaba la nube SIEMPRE y pisaba lo editado aqui estando fuera/bloqueado
     (quedaba solo en el historial local, sin aviso). Ahora:
       nube vacia            -> se sube lo local
       local sin cambios     -> se baja la nube
       local con cambios y la nube no se ha movido desde su base -> se sube lo local
       los dos han cambiado  -> conflict: decide la persona (resolve) */
  async function resume() {
    if (!isUnlocked() || !S.active) return { ok: false, error: 'not_ready' };
    const meta = await api('/v1/blob/meta', { method: 'GET', auth: true });
    if (meta.status !== 200) return { ok: false, error: failOf(meta, 'meta_failed') };
    const cloudVersion = meta.data.currentVersion || 0;
    const dirty = localDirty();
    if (!cloudVersion) {
      if (!hasData(D.d)) return { ok: true, action: 'none' };
      S.version = 0;
      const r = await syncPush();
      return { ...r, action: 'pushed' };
    }
    if (!dirty) { const r = await pull(); return { ...r, action: 'pulled' }; }
    if (cloudVersion === S.version) { const r = await syncPush(); return { ...r, action: 'pushed' }; }
    return { ok: true, action: 'conflict', cloudVersion, cloudAt: (meta.data.updatedAt || 0) * 1000, localAt: D.lastSaved || 0 };
  }

  // Resuelve el conflicto de resume(). 'cloud' baja y descarta lo local (el llamante hace
  // H.snapshot antes); 'local' sube y la nube pasa a ser esta copia; 'merge' empuja con la
  // base vieja -> el 409 de push() baja la nube y fusiona por id (mergeData), sin duplicar logica.
  async function resolve(choice, cloudVersion) {
    if (choice === 'cloud') return await pull();
    if (choice === 'local') S.version = cloudVersion;
    return await syncPush();
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
    // Tras un push OK: espejo para la gestoria y, si nos dejo editar, recoger sus cambios.
    // pullOps aplica -> D.save -> notifyChange -> otro push; converge porque la segunda
    // vuelta ya no encuentra ops. Los dos son best-effort: no rompen el sync normal.
    if (!res || (!res.ok && !['busy', 'not_ready', 'inactive', 'session_expired'].includes(res.error))) scheduleSync(RETRY_MS); // red caida, 429...: reintentar sin esperar a otro cambio
    if (res && res.ok) { emitSync('synced', res); reconcileGrant().catch(() => {}); pushShadow().catch(() => {}); pullOps().catch(() => {}); pushVerifactu().catch(() => {}); }
    else if (!res || res.error !== 'busy') emitSync('error', res || {}); // 'busy' = coalescado, el push en curso ya emitira
    return res;
  }
  // Carga datos remotos en D SIN disparar un push de vuelta (evita la reentrada del auto-sync).
  function _applyRemote(data) {
    _applyingRemote = true;
    try { if (typeof D !== 'undefined' && D.load) D.load(data); } finally { _applyingRemote = false; }
  }
  /* Cuanto esperar tras el ultimo cambio antes de subir. Cada cambio queda guardado AL
     MOMENTO en el navegador; esto solo agrupa subidas (antes 2,5 s = una version por cada
     entrada del calendario). Al ocultar la pestana se sube ya; lo que no llegue a subir
     lo recoge resume() en el siguiente inicio de sesion. */
  const SYNC_DEBOUNCE_MS = 30000, RETRY_MS = 60000;
  function scheduleSync(ms) {
    if (!_enabled || !isUnlocked() || !S.active) return;
    if (_timer) clearTimeout(_timer);
    _timer = setTimeout(() => { _timer = null; syncPush().catch(() => {}); }, ms);
  }
  function notifyChange() {
    if (!_enabled || _applyingRemote || !isUnlocked() || !S.active) return;
    scheduleSync(SYNC_DEBOUNCE_MS);
    emitSync('pending');
  }
  function flushSync() {
    if (!_timer) return;
    clearTimeout(_timer); _timer = null;
    syncPush().catch(() => {});
  }
  if (typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') flushSync(); });
    window.addEventListener('pagehide', flushSync);
  }

  /* ── Versiones en la nube (retencion escalonada en el servidor) ── */
  async function versions() {
    if (!isUnlocked() || !S.active) return { ok: false, error: 'not_ready' };
    const r = await api('/v1/versions', { auth: true });
    if (r.status !== 200) return { ok: false, error: failOf(r, 'list_failed') };
    return { ok: true, current: r.data.current, versions: (r.data.versions || []).map(v => ({ version: v.version, createdAt: v.createdAt * 1000, sizeBytes: v.sizeBytes })) };
  }
  // Restaurar = subir el contenido de una version vieja como version NUEVA. Nada se borra:
  // la que habia sigue en el historial. `current` sale del listado; se usa como base para
  // que el push no dispare el merge del 409 (que volveria a meter lo que se quiere quitar).
  async function restoreVersion(v, current) {
    if (!isUnlocked() || !S.active) return { ok: false, error: 'not_ready' };
    const g = await api('/v1/blob?version=' + encodeURIComponent(v), { auth: true });
    if (g.status !== 200) return { ok: false, error: failOf(g, 'get_failed') };
    let data;
    try { data = await CA.decryptDownload(S.dek, g.data.blob, S.email, g.data.version); }
    catch (e) { return { ok: false, error: 'decrypt_failed' }; }
    _applyRemote(data);
    S.version = current;
    return await syncPush();
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
  async function grantCreate(code, gestorPub, gestorEmail, scope, canEdit) {
    if (!isUnlocked() || !S.active) return { ok: false, error: 'not_ready' };
    const shareKey = CA.genShareKey();
    const wrappedKey = await CA.wrapShareKey(gestorPub, shareKey);
    const r = await api('/v1/grants', { method: 'POST', auth: true, body: { code, wrappedKey, scope, canEdit: !!canEdit } });
    if (r.status !== 201) return { ok: false, error: r.data?.error || 'grant_failed' };
    D.d.settings.gestorGrant = {
      grantId: r.data.grantId, shareKey: CA._.b64u(shareKey), scope, canEdit: !!canEdit,
      gestorEmail, fingerprint: await CA.fingerprintOf(gestorPub),
      lastOpSeq: 0,   // hasta donde se han APLICADO ops de este gestor (Etapa B)
      ackedSeq: 0,    // hasta donde se ha CONFIRMADO al server (puede ir por detras si un ack fallo)
    };
    D.save();
    pushShadow().catch(() => {}); // primera foto sin esperar al proximo cambio
    return { ok: true, grantId: r.data.grantId };
  }

  /* ── Etapa B: permiso de edicion (opt-in de la persona) ── */
  async function grantSetCanEdit(canEdit) {
    const g = D.d?.settings?.gestorGrant;
    if (!g) return { ok: false, error: 'no_grant' };
    const r = await api('/v1/grants/' + encodeURIComponent(g.grantId), { method: 'PATCH', auth: true, body: { canEdit: !!canEdit } });
    if (r.status !== 200) return { ok: false, error: r.data?.error || 'patch_failed' };
    g.canEdit = !!r.data.canEdit;
    D.save();
    return { ok: true, canEdit: g.canEdit };
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

  // El gestor baja y descifra el blob sombra de un cliente. Devuelve tambien la shareKey:
  // la necesita GOps para cifrar las ops si la persona le dejo editar (Etapa B).
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
      return { ok: true, data, scope: r.data.scope, canEdit: !!r.data.canEdit, shareKey, updatedAt: r.data.updatedAt };
    } catch (e) { return { ok: false, error: 'decrypt_failed' }; }
  }

  /* ── Etapa B: cola de ops ── */

  // El gestor sube ops cifradas (las cifra GOps; aqui solo viajan).
  async function opsPush(grantId, ops) {
    if (!isUnlocked() || !S.active || S.role !== 'gestor') return { ok: false, error: 'not_ready' };
    const r = await api('/v1/grants/' + encodeURIComponent(grantId) + '/ops', { method: 'POST', auth: true, body: { ops } });
    if (r.status === 201) return { ok: true, accepted: r.data.accepted };
    return { ok: false, error: r.data?.error || 'ops_failed' };
  }

  // La persona baja, VALIDA, aplica y confirma las ops de su gestoria.
  // Best-effort: si algo falla, sus datos se quedan como estaban y se reintenta al proximo sync.
  let _pullingOps = false;
  async function pullOps() {
    const g = D.d?.settings?.gestorGrant;
    if (!g || !g.canEdit || !isUnlocked() || !S.active || S.role !== 'persona') return { ok: false, error: 'not_ready' };
    if (typeof D !== 'undefined' && D._readOnly) return { ok: false, error: 'readonly' };
    if (_pullingOps) return { ok: false, error: 'busy' };
    _pullingOps = true;
    try {
      const since = g.lastOpSeq || 0;
      const r = await api(`/v1/grants/${encodeURIComponent(g.grantId)}/ops?since=${since}`, { method: 'GET', auth: true });
      if (r.status === 404) { delete D.d.settings.gestorGrant; D.save(); return { ok: false, error: 'not_found' }; } // revocado
      if (r.status !== 200) return { ok: false, error: r.data?.error || 'get_failed' };
      const rows = r.data.ops || [];
      if (!rows.length) {
        // Ack de recuperacion: si el ack de una pasada anterior fallo, esas ops ya aplicadas
        // siguen en el server (nunca se re-piden: since ya las salta) y acumulan contra el
        // tope hasta bloquear la escritura del gestor con 409. Reintentar aqui las purga.
        if ((g.ackedSeq || 0) < since) await _ackOps(g, since);
        return { ok: true, applied: 0 };
      }

      if (typeof H !== 'undefined' && H.snapshot) H.snapshot(); // red de seguridad antes de tocar datos ajenos a la sesion
      const shareKey = CA._.b64uDec(g.shareKey);
      // Descifrado en paralelo (independiente por fila); aplicar, en cambio, es secuencial
      // y en orden de seq — el orden de las ops es parte del contrato.
      const opened = await Promise.all(rows.map(row =>
        CA.decryptOp(shareKey, row.payload, g.grantId).catch(() => null)
      ));
      let applied = 0, rejected = 0, maxSeq = since;
      rows.forEach((row, i) => {
        if (row.seq > maxSeq) maxSeq = row.seq;
        const op = opened[i];
        if (!op) { rejected++; console.warn('op ilegible, descartada (seq ' + row.seq + ')'); return; }
        const res = GOps.apply(op);
        if (!res.ok) { rejected++; console.warn('op rechazada (seq ' + row.seq + '):', res.why); return; }
        /* El actor sale del GRANT LOCAL, no de la op: quien la escribio podria haber puesto
           cualquier email dentro. El grant es 1:1 con una gestoria, asi que aqui esta la verdad. */
        const actor = { email: g.gestorEmail, role: 'gestor' };
        D._auditAs(actor, op.accion, op.entidad, op.entidadId, GOps.undoFits(res.undo) ? res.undo : null);
        applied++;
      });
      g.lastOpSeq = maxSeq;
      D.save();  // dispara el auto-sync: lo aplicado sube en el proximo push
      await _ackOps(g, maxSeq); // confirmar (el server las borra); si falla, el ack de recuperacion lo reintenta
      if (applied && _onOps) { try { _onOps({ applied, gestorEmail: g.gestorEmail }); } catch (e) { /* */ } }
      return { ok: true, applied, rejected };
    } finally { _pullingOps = false; }
  }

  // Confirma ops hasta `upTo` y apunta hasta donde se confirmo (ackedSeq), para que el
  // ack de recuperacion sepa si quedo trabajo pendiente. Best-effort: un fallo no rompe nada.
  async function _ackOps(g, upTo) {
    const r = await api(`/v1/grants/${encodeURIComponent(g.grantId)}/ops/ack`, { method: 'POST', auth: true, body: { upTo } });
    if (r.status === 200) { g.ackedSeq = upTo; D.save(); }
  }

  // Aviso a la UI de que la gestoria ha hecho cambios (para refrescar la vista + toast).
  let _onOps = null;
  function setOpsListener(fn) { _onOps = fn; }

  // Construye la copia a compartir segun el alcance. 'fiscal' excluye lo personal:
  // horas y notas de los proyectos, y el journey completo. Para 'todo' se devuelve D.d
  // directamente (encryptShare ya lo serializa; clonar seria trabajo tirado).
  function buildShareData(scope) {
    const d = D.d;
    if (scope === 'todo') return d;
    /* Guard de deriva de esquema: si el store gana un campo raiz nuevo, que quedar fuera
       del alcance fiscal sea una decision y no una omision (ya paso con audit[] en la
       Etapa A). Lo desconocido NO se comparte (privado por defecto), pero se avisa para
       que el proximo cambio de esquema pase por aqui conscientemente. */
    const KNOWN = ['version', 'clientes', 'projects', 'gastos', 'deducibles', 'facturas', 'settings', 'audit', 'journey'];
    const unknown = Object.keys(d).filter(k => !KNOWN.includes(k));
    if (unknown.length) console.warn('buildShareData: campos del store fuera de la whitelist fiscal (no se comparten):', unknown);
    const s = d.settings || {};
    /* `audit` queda FUERA del alcance fiscal a proposito: el log lleva la actividad completa
       de la persona (incluidas entidades fuera del alcance) y el gestor no lo necesita para
       lo fiscal. En scope 'todo' viaja entero, que es donde tiene sentido. */
    return {
      version: d.version,
      /* Las notas del cliente son de la persona (como las de los proyectos): fuera */
      clientes: (d.clientes || []).map(({ notas, ...c }) => c),
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

  /* ── VeriFactu Fase 3 (frontend): vaciar la cola local contra el backend ──
     Los registros firmados (D.d.facturas[]) se encolan en el servidor para su futura
     remision a AEAT. Viajan EN CLARO a proposito (TODO/15, "canal en claro"): van a la
     AEAT igualmente y el remitente necesita leerlos. Best-effort tras cada sync OK,
     como pushShadow. El servidor es idempotente por huella: reintentar no duplica.
     `f.remitida` = aceptado en la cola del servidor (el estado AEAT real llegara con
     el remitente SOAP de la parte 2); viaja en el blob, asi que vale entre dispositivos. */
  async function pushVerifactu() {
    if (typeof D === 'undefined' || !isUnlocked() || !S.active || S.role === 'gestor') return;
    if (D.d?.settings?.verifactu?.habilitado !== true) return;
    const pend = (D.d.facturas || []).filter(f => !f.remitida && f.hash).sort((a, b) => (a.seq || 0) - (b.seq || 0));
    if (!pend.length) return;
    try {
      /* Lotes de 100 (tope del endpoint), en orden de cadena: si un lote falla se corta
         aqui — encolar los siguientes dejaria un hueco en el encadenamiento del emisor. */
      /* Para localizar el registro anterior de la cadena (el XML de remision referencia
         su NumSerie y fecha ademas de la huella) */
      const porHash = new Map((D.d.facturas || []).map(x => [x.hash, x]));
      for (let i = 0; i < pend.length; i += 100) {
        const lote = pend.slice(i, i + 100);
        const registros = lote.map(f => {
          const prev = f.hashPrev ? porHash.get(f.hashPrev) : null;
          return {
            tipoRegistro: f.tipoRegistro === 'anulacion' ? 'anulacion' : 'alta',
            emisorNif: f.emisorNif, numSerie: f.numero, fecha: f.fecha,
            tipoFactura: f.tipoFactura, cuotaTotal: f.cuotaTotal, importeTotal: f.importeTotal,
            huella: f.hash, huellaPrev: f.hashPrev || '', fechaHoraHuso: f.timestamp,
            desglose: (f.desglose || []).map(d => ({ tipo: d.tipoImpositivo, base: d.base, cuota: d.cuota })),
            nombreEmisor: f.emisorNombre || undefined,
            destinatario: f.clienteNif ? { nombre: f.clienteNombre || '', nif: f.clienteNif } : undefined,
            prevNumSerie: prev ? prev.numero : undefined,
            prevFecha: prev ? prev.fecha : undefined,
          };
        });
        const r = await api('/v1/verifactu/registros', { method: 'POST', auth: true, body: { registros } });
        if (r.status !== 201) { console.warn('pushVerifactu: lote rechazado', r.status, r.data); return; }
        lote.forEach(f => { f.remitida = true; });
        D.save();
      }
    } catch (e) { console.warn('pushVerifactu failed:', e); }
  }

  // Reconcilia el gestorGrant local contra el servidor (que es la fuente de verdad del
  // vinculo). Cierra el hueco del merge multidispositivo: settings se funde con "local
  // gana" y sin tombstones, asi que un grant revocado desde otro dispositivo podia
  // resucitar aqui al resolver un 409. Si el grant local ya no esta vivo en el servidor
  // se descarta; si difiere el canEdit (cambiado desde otro dispositivo), manda el server.
  // El caso inverso (el servidor tiene un grant vivo que este blob no conoce) no es
  // recuperable desde aqui: la shareKey solo viaja dentro del blob — lo trae el proximo
  // push del dispositivo que creo el vinculo. Throttle de 60s: corre tras cada sync.
  let _lastReconcile = 0;
  async function reconcileGrant(force) {
    const g = typeof D !== 'undefined' ? D.d?.settings?.gestorGrant : null;
    if (!g || !isUnlocked() || !S.active || S.role === 'gestor') return;
    const now = Date.now();
    if (!force && now - _lastReconcile < 60000) return;
    _lastReconcile = now;
    try {
      const r = await api('/v1/grants', { method: 'GET', auth: true });
      if (r.status !== 200 || !Array.isArray(r.data?.grants)) return; // red/500: no tocar nada
      const srv = r.data.grants.find(x => x.grantId === g.grantId);
      if (!srv) { delete D.d.settings.gestorGrant; _lastShadowHash = null; D.save(); return; }
      if (typeof srv.canEdit === 'boolean' && srv.canEdit !== g.canEdit) { g.canEdit = srv.canEdit; D.save(); }
    } catch (e) { console.warn('reconcileGrant failed:', e); }
  }

  /* ── Admin (solo is_admin; el servidor reverifica) ── */
  async function adminListUsers() { const r = await api('/v1/admin/users', { auth: true }); return r.status === 200 ? r.data.users : null; }
  async function adminSetActive(id, active) { const r = await api(`/v1/admin/users/${encodeURIComponent(id)}/active`, { method: 'POST', auth: true, body: { active } }); return r.status === 200; }
  async function adminSetPaid(id, paid) { const r = await api(`/v1/admin/users/${encodeURIComponent(id)}/paid`, { method: 'POST', auth: true, body: { paid } }); return r.status === 200; }
  async function adminDelete(id) { const r = await api(`/v1/admin/users/${encodeURIComponent(id)}`, { method: 'DELETE', auth: true }); return r.status === 204; }
  async function adminGetConfig() { const r = await api('/v1/admin/config', { auth: true }); return r.status === 200 ? r.data : null; }
  async function adminSetConfig(signupsOpen) { const r = await api('/v1/admin/config', { method: 'POST', auth: true, body: { signupsOpen: !!signupsOpen } }); return r.status === 200; }

  return {
    signup, login, unlock, logout, changePassword, recover, pull, push: syncPush, resume, resolve, remembered, cloudMeta, versions, restoreVersion,
    gestorEnsureKey, gestorResolve, grantCreate, grantRevoke, gestorClients, gestorOpenClient, pushShadow, _buildShareData: buildShareData,
    grantSetCanEdit, opsPush, pullOps, setOpsListener, reconcileGrant, pushVerifactu,
    adminListUsers, adminSetActive, adminSetPaid, adminDelete, adminGetConfig, adminSetConfig, _mergeData: mergeData,
    status, isUnlocked, detectLocked, setAutoSync, setSyncListener, notifyChange, setApiBase: (u) => { API_BASE = u; },
    get email() { return S.email; }, get version() { return S.version; }, get state() { return S.state; },
  };
})();
if (typeof window !== 'undefined') window.Acc = Acc;
