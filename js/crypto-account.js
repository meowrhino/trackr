/* ================================================
 * TRACKR — Cripto de cuenta (zero-knowledge, client-side)  ·  global: CA
 *
 * Todo el cifrado ocurre AQUI, en el navegador. El servidor solo ve verificadores
 * y blobs cifrados opacos. Spec: trackr-api/docs/PROTOCOL.md (§1-§4).
 *
 * Dependencias: window.hashwasm (vendor/hash-wasm/argon2.umd.min.js, con SRI) para Argon2id.
 *               WebCrypto (HKDF, AES-GCM, SHA), CompressionStream (gzip). Sin red.
 *
 * DECISIONES (desviaciones justificadas del blueprint; auditadas):
 *  D1) AAD ata el envelope al EMAIL CANONICO (no al userId). El cliente canonicaliza el
 *      email IGUAL que el servidor (trim+lowercase+NFKC+ASCII) ANTES de cualquier AAD, asi
 *      el binding es a la identidad inmutable real y wrap/unwrap casan byte a byte.
 *  D2) AAD de la rama RECOVERY sin credEpoch (solo email): el cambio de contrasena no puede
 *      re-envolver rec (no hay codigo). La rama rec solo cambia en signup/rotacion.
 *
 * Primitivas (§1): Argon2id m>=65536,t>=3,p>=1,out=32 (params del servidor, clamp a minimo)
 * · HKDF-SHA256 (salt vacio, info etiquetada) · AES-256-GCM (nonce 12B random, tag 128).
 * ================================================ */
const CA = (() => {
  const enc = new TextEncoder();
  const dec = new TextDecoder();

  /* ── util binario ── */
  const randBytes = (n) => { const b = new Uint8Array(n); crypto.getRandomValues(b); return b; };
  const nfkc = (s) => enc.encode((s == null ? '' : String(s)).normalize('NFKC'));
  function b64u(bytes) {
    let bin = '';
    for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
    return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }
  function b64uDec(str) {
    let s = String(str).replace(/-/g, '+').replace(/_/g, '/');
    while (s.length % 4) s += '=';
    const bin = atob(s); const out = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out;
  }

  /* ── Canonicalizacion de email: IDENTICA al servidor (src/crypto.js canonEmail) ── */
  const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
  function canonEmail(e) {
    const s = (e == null ? '' : String(e)).trim().toLowerCase().normalize('NFKC');
    if (s.length < 3 || s.length > 254) return null;
    if (!/^[\x00-\x7F]+$/.test(s)) return null;       // solo ASCII (anti homoglyph/IDN)
    if (!EMAIL_RE.test(s)) return null;
    return s;
  }
  function reqEmail(e) { const c = canonEmail(e); if (!c) throw new Error('invalid_email'); return c; }

  /* ── Capacidades del navegador. NUNCA degradar si falta algo. ── */
  function available() {
    return typeof hashwasm !== 'undefined' && !!(hashwasm && hashwasm.argon2id)
      && typeof CompressionStream !== 'undefined' && typeof DecompressionStream !== 'undefined'
      && !!(crypto && crypto.subtle);
  }
  function assertAvailable() { if (!available()) throw new Error('crypto_unavailable'); }

  /* ── Argon2id (hash-wasm). Params del servidor, clamp a minimo seguro (anti-downgrade). ── */
  const MIN_KDF = { mem: 65536, time: 3, par: 1 };
  function clampKdf(p) {
    p = p || {};
    return {
      mem: Math.min(262144, Math.max(MIN_KDF.mem, Number(p.mem) || MIN_KDF.mem)),
      time: Math.min(10, Math.max(MIN_KDF.time, Number(p.time) || MIN_KDF.time)),
      par: Math.min(4, Math.max(MIN_KDF.par, Number(p.par) || MIN_KDF.par)),
    };
  }
  async function argon2(passwordBytes, saltBytes, kdf) {
    assertAvailable();
    const p = clampKdf(kdf);
    return await hashwasm.argon2id({
      password: passwordBytes, salt: saltBytes,
      parallelism: p.par, iterations: p.time, memorySize: p.mem, hashLength: 32, outputType: 'binary',
    });
  }

  /* ── HKDF-SHA256 ── */
  async function hkdf(masterKey, infoStr) {
    const k = await crypto.subtle.importKey('raw', masterKey, 'HKDF', false, ['deriveBits']);
    const bits = await crypto.subtle.deriveBits(
      { name: 'HKDF', hash: 'SHA-256', salt: new Uint8Array(0), info: enc.encode(infoStr) }, k, 256);
    return new Uint8Array(bits);
  }

  /* ── AES-256-GCM con AAD ── */
  async function aesEnc(keyBytes, iv, plaintext, aadStr) {
    const key = await crypto.subtle.importKey('raw', keyBytes, 'AES-GCM', false, ['encrypt']);
    const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv, additionalData: enc.encode(aadStr), tagLength: 128 }, key, plaintext);
    return new Uint8Array(ct);
  }
  async function aesDec(keyBytes, iv, ctWithTag, aadStr) {
    const key = await crypto.subtle.importKey('raw', keyBytes, 'AES-GCM', false, ['decrypt']);
    const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv, additionalData: enc.encode(aadStr), tagLength: 128 }, key, ctWithTag);
    return new Uint8Array(pt);
  }

  /* ── gzip ── */
  async function gzip(bytes) {
    const cs = new CompressionStream('gzip');
    return new Uint8Array(await new Response(new Blob([bytes]).stream().pipeThrough(cs)).arrayBuffer());
  }
  async function gunzip(bytes) {
    const ds = new DecompressionStream('gzip');
    return new Uint8Array(await new Response(new Blob([bytes]).stream().pipeThrough(ds)).arrayBuffer());
  }

  /* ── AAD (D1: email canonico; D2: rec sin epoch) ── */
  const aadPwd = (email, epoch) => `trackr|v1|dek|pwd|${email}|${epoch}`;
  const aadRec = (email) => `trackr|v1|dek|rec|${email}`;
  const aadBlob = (email, version) => `trackr|v1|blob|${email}|${version}`;

  /* ── Envelope de la DEK: "TKw"(3)+ver(1)+iv(12)+ct+tag(48)=64B (§3.2) ── */
  async function wrapDEK(wrapKey, dek, aadStr) {
    const iv = randBytes(12);
    const ct = await aesEnc(wrapKey, iv, dek, aadStr);
    const out = new Uint8Array(64);
    out[0] = 0x54; out[1] = 0x4B; out[2] = 0x77; out[3] = 0x01;
    out.set(iv, 4); out.set(ct, 16);
    return out;
  }
  async function unwrapDEK(wrapKey, envBytes, aadStr) {
    if (envBytes.length !== 64 || envBytes[0] !== 0x54 || envBytes[1] !== 0x4B || envBytes[2] !== 0x77 || envBytes[3] !== 0x01) {
      throw new Error('bad_envelope');
    }
    return await aesDec(wrapKey, envBytes.slice(4, 16), envBytes.slice(16, 64), aadStr);
  }

  /* ── Contenedor "TKb"(3)+ver(1)+flags(1)+iv(12)+ct+tag (§3.3) ──
   * Formato común del blob principal (clave DEK) y del blob sombra de gestoría
   * (clave de compartición). Solo cambian la clave y el AAD; el marco es idéntico,
   * así que vive en un único par pack/unpack para no divergir. */
  async function packContainer(key, obj, aadStr) {
    const gz = await gzip(enc.encode(JSON.stringify(obj)));
    const iv = randBytes(12);
    const ct = await aesEnc(key, iv, gz, aadStr);
    const out = new Uint8Array(5 + 12 + ct.length);
    out[0] = 0x54; out[1] = 0x4B; out[2] = 0x62; out[3] = 0x01; out[4] = 0x01;
    out.set(iv, 5); out.set(ct, 17);
    return out;
  }
  async function unpackContainer(key, bytes, aadStr) {
    if (bytes.length < 18 || bytes[0] !== 0x54 || bytes[1] !== 0x4B || bytes[2] !== 0x62 || bytes[3] !== 0x01) {
      throw new Error('bad_blob');
    }
    const flags = bytes[4];
    const gz = await aesDec(key, bytes.slice(5, 17), bytes.slice(17), aadStr);
    return JSON.parse(dec.decode((flags & 1) ? await gunzip(gz) : gz));
  }
  const encryptBlob = (dek, obj, email, version) => packContainer(dek, obj, aadBlob(email, version));
  const decryptBlob = (dek, blob, email, version) => unpackContainer(dek, blob, aadBlob(email, version));

  /* ── Derivaciones ── */
  async function deriveMaster(password, kdfSalt, kdf) {
    const master = await argon2(nfkc(password), kdfSalt, kdf);
    return { authKey: await hkdf(master, 'trackr|v1|authKey'), wrapKeyPwd: await hkdf(master, 'trackr|v1|wrapKeyPwd') };
  }
  async function deriveRecovery(recoveryCodeCanon, recSalt, kdf) {
    const wrapKeyRec = await argon2(enc.encode(recoveryCodeCanon), recSalt, kdf);
    return { wrapKeyRec, recProof: await hkdf(wrapKeyRec, 'trackr|v1|recProof') };
  }

  /* ── Codigo de recuperacion: 16B -> 26 chars Base32 Crockford = 128 bits ── */
  const CROCK = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
  function encode16(bytes) {
    let bits = 0, val = 0, out = '';
    for (let i = 0; i < bytes.length; i++) { val = (val << 8) | bytes[i]; bits += 8; while (bits >= 5) { out += CROCK[(val >>> (bits - 5)) & 31]; bits -= 5; } }
    if (bits > 0) out += CROCK[(val << (5 - bits)) & 31];
    return out;
  }
  function genRecoveryCode() {
    return 'TRKR-' + encode16(randBytes(16)).match(/.{1,4}/g).join('-');
  }
  function canonRecovery(input) {
    let c = String(input || '').toUpperCase().replace(/[ILO]/g, (m) => (m === 'O' ? '0' : '1')).replace(/[^0-9A-Z]/g, '');
    if (c.length === 30 && c.startsWith('TRKR')) c = c.slice(4);
    return c;
  }
  function isValidRecovery(input) {
    const c = canonRecovery(input);
    return c.length === 26 && [...c].every((ch) => CROCK.includes(ch));
  }

  /* ── Politica de contrasena (≥12 + medidor simple; zxcvbn diferido) ── */
  function checkPassword(pw) {
    pw = pw || '';
    if (pw.length < 12) return { ok: false, score: Math.min(2, Math.floor(pw.length / 6)), reason: 'min12' };
    let variety = 0;
    if (/[a-z]/.test(pw)) variety++; if (/[A-Z]/.test(pw)) variety++;
    if (/[0-9]/.test(pw)) variety++; if (/[^a-zA-Z0-9]/.test(pw)) variety++;
    const score = Math.max(1, Math.min(4, Math.floor(pw.length / 8) + variety - 1));
    return { ok: true, score, reason: '' };
  }
  function requirePassword(pw) { if (!checkPassword(pw).ok) throw new Error('weak_password'); }

  function emptyData() { return { version: 2, clientes: [], projects: [], gastos: [], settings: {} }; }

  /* ════════════════ Flujos de alto nivel ════════════════ */

  // SIGNUP. Devuelve {payload (para POST /v1/signup), recoveryCode (mostrar 1 vez), dek, credEpoch, email}.
  async function buildSignup(emailRaw, password, dataObj) {
    const email = reqEmail(emailRaw);
    requirePassword(password);
    const kdfSalt = randBytes(16), recSalt = randBytes(16), credEpoch = 1;
    const recoveryCode = genRecoveryCode();
    const { authKey, wrapKeyPwd } = await deriveMaster(password, kdfSalt, MIN_KDF);
    const { wrapKeyRec, recProof } = await deriveRecovery(canonRecovery(recoveryCode), recSalt, MIN_KDF);
    const dek = randBytes(32);
    const wrappedDEK_pwd = await wrapDEK(wrapKeyPwd, dek, aadPwd(email, credEpoch));
    const wrappedDEK_rec = await wrapDEK(wrapKeyRec, dek, aadRec(email));
    const initialBlob = await encryptBlob(dek, dataObj || emptyData(), email, 1);
    return {
      payload: {
        email, authKey: b64u(authKey), kdfSalt: b64u(kdfSalt), kdfAlgo: 1, kdfMem: MIN_KDF.mem, kdfTime: MIN_KDF.time, kdfPar: MIN_KDF.par,
        recSalt: b64u(recSalt), recProof: b64u(recProof),
        wrappedDEK_pwd: b64u(wrappedDEK_pwd), wrappedDEK_rec: b64u(wrappedDEK_rec),
        initialBlob: b64u(initialBlob),
      },
      recoveryCode, dek, credEpoch, email,
    };
  }

  // LOGIN paso A: deriva authKey (enviar) + wrapKeyPwd. `kdf` = params del prelogin (clamp a min).
  async function deriveForLogin(password, kdfSaltB64, kdf) {
    const { authKey, wrapKeyPwd } = await deriveMaster(password, b64uDec(kdfSaltB64), kdf);
    return { authKey: b64u(authKey), wrapKeyPwd };
  }
  // LOGIN paso B: desenvuelve la DEK.
  async function unwrapLogin(wrapKeyPwd, wrappedDEK_pwdB64, emailRaw, credEpoch) {
    return await unwrapDEK(wrapKeyPwd, b64uDec(wrappedDEK_pwdB64), aadPwd(reqEmail(emailRaw), credEpoch));
  }

  // CAMBIO DE CONTRASENA (§4.1): re-envuelve solo la rama pwd. `kdf` = params actuales de la cuenta.
  async function buildPasswordChange(emailRaw, currentPassword, newPassword, dek, currentKdfSaltB64, credEpoch, kdf) {
    const email = reqEmail(emailRaw);
    requirePassword(newPassword);
    const cur = await deriveMaster(currentPassword, b64uDec(currentKdfSaltB64), kdf);
    const newKdfSalt = randBytes(16);
    const next = await deriveMaster(newPassword, newKdfSalt, kdf);
    const newEpoch = credEpoch + 1;
    const newWrappedDEK_pwd = await wrapDEK(next.wrapKeyPwd, dek, aadPwd(email, newEpoch));
    return {
      currentAuthKey: b64u(cur.authKey), newAuthKey: b64u(next.authKey),
      newKdfSalt: b64u(newKdfSalt), newWrappedDEK_pwd: b64u(newWrappedDEK_pwd), newCredEpoch: newEpoch,
    };
  }

  // RECUPERACION fase material: deriva recProof (probar posesion). `kdf` = params del recover/start.
  async function buildRecoverProof(recoveryCode, recSaltB64, kdf) {
    const { wrapKeyRec, recProof } = await deriveRecovery(canonRecovery(recoveryCode), b64uDec(recSaltB64), kdf);
    return { recProof: b64u(recProof), wrapKeyRec };
  }
  // RECUPERACION fase commit: desenvuelve la DEK con wrapKeyRec y re-envuelve la rama pwd nueva.
  async function buildRecoverCommit(emailRaw, newPassword, wrapKeyRec, wrappedDEK_recB64, credEpoch, kdf) {
    const email = reqEmail(emailRaw);
    requirePassword(newPassword);
    const dek = await unwrapDEK(wrapKeyRec, b64uDec(wrappedDEK_recB64), aadRec(email));
    const newKdfSalt = randBytes(16);
    const next = await deriveMaster(newPassword, newKdfSalt, kdf);
    const newEpoch = credEpoch + 1;
    const newWrappedDEK_pwd = await wrapDEK(next.wrapKeyPwd, dek, aadPwd(email, newEpoch));
    return {
      dek,
      commit: {
        newAuthKey: b64u(next.authKey), newKdfSalt: b64u(newKdfSalt),
        newWrappedDEK_pwd: b64u(newWrappedDEK_pwd), newCredEpoch: newEpoch,
      },
    };
  }

  /* ════════════════ Compartición E2E persona → gestor (PROTOCOL §15) ════════════════
   * El gestor tiene un par ECDH P-256 (privada dentro de su blob, pública publicada).
   * La persona genera una shareKey AES-256, la envuelve hacia la pública del gestor
   * (efímera + HKDF + AES-GCM) y cifra con ella el blob sombra. El servidor solo ve
   * el envelope (wrapped_key) y el blob sombra, ambos opacos. */

  const aadShareKey = (fingerprint) => `trackr|v1|sharekey|${fingerprint}`;
  const aadShareBlob = (grantId) => `trackr|v1|shareblob|${grantId}`;
  /* Dominio propio para las ops (Etapa B): comparten clave y grant con el blob sombra,
     asi que sin separar la AAD un blob sombra descifraria como op (y al reves). No es
     un ataque grave — la validacion de la op lo tiraria — pero cada cosa a lo suyo. */
  const aadShareOp = (grantId) => `trackr|v1|shareop|${grantId}`;

  async function fingerprintOf(pubSpkiB64) {
    return b64u(new Uint8Array(await crypto.subtle.digest('SHA-256', b64uDec(pubSpkiB64))));
  }

  // Par de claves del gestor. La privada se exporta como JWK para viajar DENTRO de su
  // blob de cuenta (cifrado con su DEK); la pública como SPKI b64url para publicarse.
  async function genShareKeypair() {
    const kp = await crypto.subtle.generateKey({ name: 'ECDH', namedCurve: 'P-256' }, true, ['deriveBits']);
    const pub = b64u(new Uint8Array(await crypto.subtle.exportKey('spki', kp.publicKey)));
    const privateJwk = await crypto.subtle.exportKey('jwk', kp.privateKey);
    return { publicKey: pub, privateJwk, fingerprint: await fingerprintOf(pub) };
  }

  function genShareKey() { return randBytes(32); }

  async function _ecdhWrapKey(privKey, pubKey) {
    const secret = new Uint8Array(await crypto.subtle.deriveBits({ name: 'ECDH', public: pubKey }, privKey, 256));
    return await hkdf(secret, 'trackr|v1|shareWrap');
  }

  // Envelope: ver(1) | ephLen(1) | ephSPKI | iv(12) | ct(shareKey+tag = 48). b64url.
  async function wrapShareKey(gestorPubB64, shareKey) {
    const gestorPub = await crypto.subtle.importKey('spki', b64uDec(gestorPubB64), { name: 'ECDH', namedCurve: 'P-256' }, false, []);
    const eph = await crypto.subtle.generateKey({ name: 'ECDH', namedCurve: 'P-256' }, true, ['deriveBits']);
    const ephPub = new Uint8Array(await crypto.subtle.exportKey('spki', eph.publicKey));
    const wrapKey = await _ecdhWrapKey(eph.privateKey, gestorPub);
    const iv = randBytes(12);
    const ct = await aesEnc(wrapKey, iv, shareKey, aadShareKey(await fingerprintOf(gestorPubB64)));
    const out = new Uint8Array(2 + ephPub.length + 12 + ct.length);
    out[0] = 0x01; out[1] = ephPub.length;
    out.set(ephPub, 2); out.set(iv, 2 + ephPub.length); out.set(ct, 2 + ephPub.length + 12);
    return b64u(out);
  }

  async function unwrapShareKey(privateJwk, envelopeB64, ownPubB64) {
    const env = b64uDec(envelopeB64);
    if (env[0] !== 0x01) throw new Error('bad_share_envelope');
    const ephLen = env[1];
    const ephPub = await crypto.subtle.importKey('spki', env.slice(2, 2 + ephLen), { name: 'ECDH', namedCurve: 'P-256' }, false, []);
    const priv = await crypto.subtle.importKey('jwk', privateJwk, { name: 'ECDH', namedCurve: 'P-256' }, false, ['deriveBits']);
    const wrapKey = await _ecdhWrapKey(priv, ephPub);
    const iv = env.slice(2 + ephLen, 2 + ephLen + 12);
    const ct = env.slice(2 + ephLen + 12);
    return await aesDec(wrapKey, iv, ct, aadShareKey(await fingerprintOf(ownPubB64)));
  }

  // Blob sombra: mismo contenedor TKb que el blob principal, con AAD por grantId.
  async function encryptShare(shareKey, obj, grantId) {
    const out = await packContainer(shareKey, obj, aadShareBlob(grantId));
    const hash = new Uint8Array(await crypto.subtle.digest('SHA-256', out));
    return { blob: b64u(out), blobHash: b64u(hash) };
  }
  async function decryptShare(shareKey, blobB64, grantId) {
    return await unpackContainer(shareKey, b64uDec(blobB64), aadShareBlob(grantId));
  }

  // Op del gestor (Etapa B): mismo contenedor y misma shareKey, AAD propia.
  async function encryptOp(shareKey, op, grantId) {
    return b64u(await packContainer(shareKey, op, aadShareOp(grantId)));
  }
  async function decryptOp(shareKey, payloadB64, grantId) {
    return await unpackContainer(shareKey, b64uDec(payloadB64), aadShareOp(grantId));
  }

  // SYNC
  async function encryptForUpload(dek, dataObj, emailRaw, version) {
    const blob = await encryptBlob(dek, dataObj, reqEmail(emailRaw), version);
    const hash = new Uint8Array(await crypto.subtle.digest('SHA-256', blob));
    return { blob: b64u(blob), blobHash: b64u(hash) };
  }
  async function decryptDownload(dek, blobB64, emailRaw, version) {
    return await decryptBlob(dek, b64uDec(blobB64), reqEmail(emailRaw), version);
  }

  return {
    buildSignup, deriveForLogin, unwrapLogin, buildPasswordChange,
    buildRecoverProof, buildRecoverCommit, encryptForUpload, decryptDownload,
    genShareKeypair, genShareKey, wrapShareKey, unwrapShareKey, encryptShare, decryptShare, encryptOp, decryptOp, fingerprintOf,
    genRecoveryCode, canonRecovery, isValidRecovery, checkPassword, canonEmail, available, emptyData,
    _: { argon2, hkdf, wrapDEK, unwrapDEK, encryptBlob, decryptBlob, deriveMaster, deriveRecovery, encode16, b64u, b64uDec, aadPwd, aadRec, aadBlob, clampKdf, MIN_KDF },
  };
})();
if (typeof window !== 'undefined') window.CA = CA;
