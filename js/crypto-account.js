/* ================================================
 * TRACKR — Cripto de cuenta (zero-knowledge, client-side)  ·  global: CA
 *
 * Todo el cifrado ocurre AQUI, en el navegador. El servidor solo ve verificadores
 * y blobs cifrados opacos. Spec: trackr-api/docs/PROTOCOL.md (§1-§4).
 *
 * Dependencias: window.hashwasm (vendor/hash-wasm/argon2.umd.min.js, con SRI) para Argon2id.
 *               WebCrypto (HKDF, AES-GCM, SHA), CompressionStream (gzip). Sin red.
 *
 * DECISIONES (desviaciones justificadas del blueprint; revisar en auditoria):
 *  D1) AAD ata el envelope al EMAIL (identidad inmutable de la cuenta), no al userId.
 *      Motivo: el userId lo asigna el servidor, pero el cliente necesita el AAD para
 *      envolver la DEK en el signup (antes de conocer userId). El email lo tiene siempre.
 *      Mismo efecto anti-swap; cero cambios de servidor (los envelopes son opacos).
 *  D2) El AAD de la rama RECOVERY no incluye credEpoch (solo email). Motivo: al cambiar
 *      contrasena no se puede re-envolver el recovery (no hay codigo -> no hay wrapKeyRec).
 *      La rama rec solo cambia en signup/rotacion. La rama PWD si lleva credEpoch.
 *
 * Primitivas (PROTOCOL §1): Argon2id m=65536,t=3,p=1,out=32 · HKDF-SHA256 (salt vacio,
 * info etiquetada) · AES-256-GCM (nonce 12B random, tag 128) · gzip-antes-de-cifrar.
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

  /* ── Argon2id (hash-wasm). NUNCA degradar a PBKDF2 si no carga. ── */
  async function argon2(passwordBytes, saltBytes) {
    if (typeof hashwasm === 'undefined' || !hashwasm.argon2id) {
      throw new Error('crypto_unavailable'); // el navegador no cargo el WASM requerido
    }
    return await hashwasm.argon2id({
      password: passwordBytes, salt: saltBytes,
      parallelism: 1, iterations: 3, memorySize: 65536, hashLength: 32, outputType: 'binary',
    }); // Uint8Array(32)
  }

  /* ── HKDF-SHA256: separa masterKey en ramas etiquetadas independientes ── */
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
    return new Uint8Array(ct); // ciphertext || tag(16)
  }
  async function aesDec(keyBytes, iv, ctWithTag, aadStr) {
    const key = await crypto.subtle.importKey('raw', keyBytes, 'AES-GCM', false, ['decrypt']);
    const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv, additionalData: enc.encode(aadStr), tagLength: 128 }, key, ctWithTag);
    return new Uint8Array(pt);
  }

  /* ── gzip (comprimir-antes-de-cifrar; seguro: almacenamiento, no canal con secreto) ── */
  async function gzip(bytes) {
    const cs = new CompressionStream('gzip');
    return new Uint8Array(await new Response(new Blob([bytes]).stream().pipeThrough(cs)).arrayBuffer());
  }
  async function gunzip(bytes) {
    const ds = new DecompressionStream('gzip');
    return new Uint8Array(await new Response(new Blob([bytes]).stream().pipeThrough(ds)).arrayBuffer());
  }

  /* ── AAD (D1: email; D2: rec sin epoch) ── */
  const aadPwd = (email, epoch) => `trackr|v1|dek|pwd|${email}|${epoch}`;
  const aadRec = (email) => `trackr|v1|dek|rec|${email}`;
  const aadBlob = (email, version) => `trackr|v1|blob|${email}|${version}`;

  /* ── Envelope de la DEK: magic "TKw"(3) + ver(1) + iv(12) + ct+tag(48) = 64B (§3.2) ── */
  async function wrapDEK(wrapKey, dek, aadStr) {
    const iv = randBytes(12);
    const ct = await aesEnc(wrapKey, iv, dek, aadStr); // 32 + 16 = 48
    const out = new Uint8Array(64);
    out[0] = 0x54; out[1] = 0x4B; out[2] = 0x77; out[3] = 0x01; // "TKw" v1
    out.set(iv, 4); out.set(ct, 16);
    return out;
  }
  async function unwrapDEK(wrapKey, envBytes, aadStr) {
    if (envBytes.length !== 64 || envBytes[0] !== 0x54 || envBytes[1] !== 0x4B || envBytes[2] !== 0x77 || envBytes[3] !== 0x01) {
      throw new Error('bad_envelope');
    }
    return await aesDec(wrapKey, envBytes.slice(4, 16), envBytes.slice(16, 64), aadStr); // DEK 32B (tag invalido -> throw)
  }

  /* ── Blob: magic "TKb"(3) + ver(1) + flags(1) + iv(12) + ct+tag (§3.3) ── */
  async function encryptBlob(dek, obj, email, version) {
    const gz = await gzip(enc.encode(JSON.stringify(obj)));
    const iv = randBytes(12);
    const ct = await aesEnc(dek, iv, gz, aadBlob(email, version));
    const out = new Uint8Array(5 + 12 + ct.length);
    out[0] = 0x54; out[1] = 0x4B; out[2] = 0x62; out[3] = 0x01; out[4] = 0x01; // "TKb" v1, flags=gzip
    out.set(iv, 5); out.set(ct, 17);
    return out;
  }
  async function decryptBlob(dek, blob, email, version) {
    if (blob.length < 18 || blob[0] !== 0x54 || blob[1] !== 0x4B || blob[2] !== 0x62 || blob[3] !== 0x01) {
      throw new Error('bad_blob');
    }
    const flags = blob[4];
    const gz = await aesDec(dek, blob.slice(5, 17), blob.slice(17), aadBlob(email, version));
    const json = (flags & 1) ? await gunzip(gz) : gz;
    return JSON.parse(dec.decode(json));
  }

  /* ── Derivaciones ── */
  async function deriveMaster(password, kdfSalt) {
    const master = await argon2(nfkc(password), kdfSalt);
    return { authKey: await hkdf(master, 'trackr|v1|authKey'), wrapKeyPwd: await hkdf(master, 'trackr|v1|wrapKeyPwd') };
  }
  async function deriveRecovery(recoveryCodeCanon, recSalt) {
    const wrapKeyRec = await argon2(enc.encode(recoveryCodeCanon), recSalt);
    return { wrapKeyRec, recProof: await hkdf(wrapKeyRec, 'trackr|v1|recProof') };
  }

  /* ── Codigo de recuperacion: 16B random -> 26 chars Base32 Crockford = 128 bits exactos ── */
  const CROCK = '0123456789ABCDEFGHJKMNPQRSTVWXYZ'; // sin I L O U
  function encode16(bytes) {
    let bits = 0, val = 0, out = '';
    for (let i = 0; i < bytes.length; i++) { val = (val << 8) | bytes[i]; bits += 8; while (bits >= 5) { out += CROCK[(val >>> (bits - 5)) & 31]; bits -= 5; } }
    if (bits > 0) out += CROCK[(val << (5 - bits)) & 31];
    return out; // 26 chars para 16 bytes
  }
  function genRecoveryCode() {
    return 'TRKR-' + encode16(randBytes(16)).match(/.{1,4}/g).join('-'); // TRKR-XXXX-XXXX-...
  }
  // Normaliza la entrada del usuario al string canonico de 26 chars (para Argon2id).
  function canonRecovery(input) {
    let c = String(input || '').toUpperCase().replace(/[ILO]/g, (m) => (m === 'O' ? '0' : '1')).replace(/[^0-9A-Z]/g, '');
    if (c.length === 30 && c.startsWith('TRKR')) c = c.slice(4); // quitar etiqueta TRKR (entropia siempre 26)
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

  function emptyData() {
    return { version: 2, clientes: [], projects: [], gastos: [], settings: {} };
  }

  /* ════════════════ Flujos de alto nivel ════════════════ */

  // SIGNUP: genera todo el material. Devuelve el payload para POST /v1/signup,
  // el recoveryCode (mostrar UNA vez) y la DEK (mantener en memoria para la sesion).
  async function buildSignup(email, password, dataObj) {
    const kdfSalt = randBytes(16), recSalt = randBytes(16), credEpoch = 1;
    const recoveryCode = genRecoveryCode();
    const { authKey, wrapKeyPwd } = await deriveMaster(password, kdfSalt);
    const { wrapKeyRec, recProof } = await deriveRecovery(canonRecovery(recoveryCode), recSalt);
    const dek = randBytes(32);
    const wrappedDEK_pwd = await wrapDEK(wrapKeyPwd, dek, aadPwd(email, credEpoch));
    const wrappedDEK_rec = await wrapDEK(wrapKeyRec, dek, aadRec(email));
    const initialBlob = await encryptBlob(dek, dataObj || emptyData(), email, 1);
    return {
      payload: {
        email, authKey: b64u(authKey), kdfSalt: b64u(kdfSalt), kdfAlgo: 1, kdfMem: 65536, kdfTime: 3, kdfPar: 1,
        recSalt: b64u(recSalt), recProof: b64u(recProof),
        wrappedDEK_pwd: b64u(wrappedDEK_pwd), wrappedDEK_rec: b64u(wrappedDEK_rec),
        initialBlob: b64u(initialBlob),
      },
      recoveryCode, dek, credEpoch,
    };
  }

  // LOGIN paso A: deriva authKey (para enviar) + wrapKeyPwd (para desenvolver despues).
  async function deriveForLogin(password, kdfSaltB64) {
    const { authKey, wrapKeyPwd } = await deriveMaster(password, b64uDec(kdfSaltB64));
    return { authKey: b64u(authKey), wrapKeyPwd };
  }
  // LOGIN paso B: con la respuesta del servidor, desenvuelve la DEK.
  async function unwrapLogin(wrapKeyPwd, wrappedDEK_pwdB64, email, credEpoch) {
    return await unwrapDEK(wrapKeyPwd, b64uDec(wrappedDEK_pwdB64), aadPwd(email, credEpoch));
  }

  // CAMBIO DE CONTRASENA (§4.1): re-envuelve solo la rama pwd con nuevo epoch.
  // Requiere la DEK en memoria. Devuelve {currentAuthKey, newAuthKey, newKdfSalt, newWrappedDEK_pwd, newCredEpoch}.
  async function buildPasswordChange(email, currentPassword, newPassword, dek, currentKdfSaltB64, credEpoch) {
    const cur = await deriveMaster(currentPassword, b64uDec(currentKdfSaltB64));
    const newKdfSalt = randBytes(16);
    const next = await deriveMaster(newPassword, newKdfSalt);
    const newEpoch = credEpoch + 1;
    const newWrappedDEK_pwd = await wrapDEK(next.wrapKeyPwd, dek, aadPwd(email, newEpoch));
    return {
      currentAuthKey: b64u(cur.authKey), newAuthKey: b64u(next.authKey),
      newKdfSalt: b64u(newKdfSalt), newWrappedDEK_pwd: b64u(newWrappedDEK_pwd), newCredEpoch: newEpoch,
    };
  }

  // RECUPERACION fase material (§4.2): deriva recProof para probar posesion del codigo.
  async function buildRecoverProof(recoveryCode, recSaltB64) {
    const { wrapKeyRec, recProof } = await deriveRecovery(canonRecovery(recoveryCode), b64uDec(recSaltB64));
    return { recProof: b64u(recProof), wrapKeyRec };
  }
  // RECUPERACION fase commit: con wrapKeyRec (de la fase material) desenvuelve la DEK y
  // re-envuelve la rama pwd con la nueva contrasena. La rama rec NO cambia (mismo codigo).
  async function buildRecoverCommit(email, newPassword, wrapKeyRec, wrappedDEK_recB64, credEpoch) {
    const dek = await unwrapDEK(wrapKeyRec, b64uDec(wrappedDEK_recB64), aadRec(email));
    const newKdfSalt = randBytes(16);
    const next = await deriveMaster(newPassword, newKdfSalt);
    const newEpoch = credEpoch + 1;
    const newWrappedDEK_pwd = await wrapDEK(next.wrapKeyPwd, dek, aadPwd(email, newEpoch));
    return {
      dek, // queda en memoria para la sesion recuperada
      commit: {
        newAuthKey: b64u(next.authKey), newKdfSalt: b64u(newKdfSalt),
        newWrappedDEK_pwd: b64u(newWrappedDEK_pwd), newCredEpoch: newEpoch,
      },
    };
  }

  // SYNC: cifra los datos locales para PUT /v1/blob (devuelve {blob, blobHash}).
  async function encryptForUpload(dek, dataObj, email, version) {
    const blob = await encryptBlob(dek, dataObj, email, version);
    const hash = new Uint8Array(await crypto.subtle.digest('SHA-256', blob));
    return { blob: b64u(blob), blobHash: b64u(hash) };
  }
  async function decryptDownload(dek, blobB64, email, version) {
    return await decryptBlob(dek, b64uDec(blobB64), email, version);
  }

  function available() { return typeof hashwasm !== 'undefined' && !!(hashwasm && hashwasm.argon2id); }

  return {
    // alto nivel
    buildSignup, deriveForLogin, unwrapLogin, buildPasswordChange,
    buildRecoverProof, buildRecoverCommit, encryptForUpload, decryptDownload,
    // utilidades UI
    genRecoveryCode, canonRecovery, isValidRecovery, checkPassword, available, emptyData,
    // primitivas (para tests / usos avanzados)
    _: { argon2, hkdf, wrapDEK, unwrapDEK, encryptBlob, decryptBlob, deriveMaster, deriveRecovery, encode16, b64u, b64uDec, aadPwd, aadRec, aadBlob },
  };
})();
if (typeof window !== 'undefined') window.CA = CA;
