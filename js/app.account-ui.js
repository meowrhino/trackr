/* ================================================
 * TRACKR — App: UI del panel "Cuenta" (Etapa 2 C-UI)
 *
 * Extiende App. Renderiza una seccion en Configuracion segun Acc.state
 * (out / locked / in) y cablea los flujos de Acc (signup/login/unlock/logout/
 * cambio de contrasena/recuperacion) + sync. Auto-sync: engancha D.save().
 * Textos en lang.js (prefijo acc.).
 * Globales usados: Acc, CA, D, H, Toast.
 * ================================================ */
(() => {
  const L = () => (typeof _lang !== 'undefined' ? _lang : 'es');
  /* Textos en lang.js con prefijo 'acc.' */
  const t = (k, ...a) => window.t('acc.' + k, ...a);
  /* "hace 3 días (12 oct 2026, 18:40)" en el idioma activo */
  const when = (ts) => {
    if (!ts) return '—';
    const s = (ts - Date.now()) / 1000, a = Math.abs(s);
    const rtf = new Intl.RelativeTimeFormat(L(), { numeric: 'auto' });
    const rel = a < 60 ? rtf.format(Math.round(s), 'second') : a < 3600 ? rtf.format(Math.round(s / 60), 'minute')
      : a < 86400 ? rtf.format(Math.round(s / 3600), 'hour') : rtf.format(Math.round(s / 86400), 'day');
    return `${rel} <span style="color:var(--t3)">(${new Date(ts).toLocaleString(L(), { dateStyle: 'medium', timeStyle: 'short' })})</span>`;
  };
  // Codigo de error (Acc o servidor) -> texto traducido. Lo no mapeado sale crudo:
  // mejor un codigo raro que un "error" a secas cuando toca depurar con alguien al telefono.
  const ERRTXT = {
    network: 'netErr', server_error: 'serverErr', rate_limited: 'rateLimited',
    invalid_credentials: 'badCreds', signups_closed: 'signupsClosed', inactive: 'pending',
  };
  const errMsg = (e) => (ERRTXT[e] ? t(ERRTXT[e]) : (e || 'error'));
  const val = (id) => { const el = document.getElementById(id); return el ? el.value : ''; };
  const esc2 = (s) => (typeof esc === 'function' ? esc(s) : String(s));

  let mode = 'login'; // out-state: login | signup | recover
  let lastSync = null; // ultimo estado de sync pintado (ver _renderSyncStatus)

  function fieldsFor(m) {
    if (m === 'signup') {
      return `<form style="display:contents" onsubmit="App.accSignup();return false">`
        + `<div class="fg"><label>${t('roleLabel')}</label>`
        + `<label style="display:flex;align-items:flex-start;gap:.5rem;cursor:pointer;text-transform:none;letter-spacing:0;margin-top:.35rem"><input type="radio" name="accRole" value="persona" checked style="width:auto;margin-top:.2rem"><span><strong>${t('rolePersona')}</strong> <span style="color:var(--t3);font-size:.78rem;display:block">${t('rolePersonaDesc')}</span></span></label>`
        + `<label style="display:flex;align-items:flex-start;gap:.5rem;cursor:pointer;text-transform:none;letter-spacing:0;margin-top:.45rem"><input type="radio" name="accRole" value="gestor" style="width:auto;margin-top:.2rem"><span><strong>${t('roleGestor')}</strong> <span style="color:var(--t3);font-size:.78rem;display:block">${t('roleGestorDesc')}</span></span></label>`
        + `</div>`
        + `<div class="fg"><label>${t('email')}</label><input id="accEmail" name="email" type="email" autocomplete="username"></div>`
        + `<div class="fg"><label>${t('password')}</label><input id="accPw" name="password" type="password" autocomplete="new-password" oninput="App.accPwMeter(this.value)"><div id="accMeter" class="acc-meter"><span></span><span></span><span></span><span></span></div></div>`
        + `<div class="fg"><label>${t('password2')}</label><input id="accPw2" name="password2" type="password" autocomplete="new-password"></div>`
        + `<label class="acc-legal"><input id="accLegal" type="checkbox" style="width:auto;margin-right:.5rem">${t('legal')}</label>`
        + `<button type="submit" class="bt bt-p" style="margin-top:.85rem">${t('create')}</button>`
        + `</form>`
        + `<div class="acc-links"><a onclick="App.accMode('login')">${t('backLogin')}</a></div>`;
    }
    if (m === 'recover') {
      return `<form style="display:contents" onsubmit="App.accRecover();return false">`
        + `<div class="fg"><label>${t('email')}</label><input id="accEmail" name="email" type="email" autocomplete="username"></div>`
        + `<div class="fg"><label>${t('recoveryCode')}</label><input id="accRec" name="recovery-code" type="text" autocomplete="one-time-code" placeholder="TRKR-XXXX-XXXX-..."></div>`
        + `<div class="fg"><label>${t('newPassword')}</label><input id="accPw" name="password" type="password" autocomplete="new-password" oninput="App.accPwMeter(this.value)"><div id="accMeter" class="acc-meter"><span></span><span></span><span></span><span></span></div></div>`
        + `<button type="submit" class="bt bt-p" style="margin-top:.5rem">${t('doRecover')}</button>`
        + `</form>`
        + `<div class="acc-links"><a onclick="App.accMode('login')">${t('backLogin')}</a></div>`;
    }
    // login
    return `<form style="display:contents" onsubmit="App.accLogin();return false">`
      + `<div class="fg"><label>${t('email')}</label><input id="accEmail" name="email" type="email" autocomplete="username"></div>`
      + `<div class="fg"><label>${t('password')}</label><input id="accPw" name="password" type="password" autocomplete="current-password"></div>`
      + `<button type="submit" class="bt bt-p" style="margin-top:.25rem">${t('enter')}</button>`
      + `</form>`
      + `<div class="acc-links"><a onclick="App.accMode('signup')">${t('signup')}</a> · <a onclick="App.accMode('recover')">${t('recover')}</a></div>`;
  }

  Object.assign(App, {
    _cfgAccountSection() {
      if (typeof Acc === 'undefined') return '';
      if (Acc.state === 'out') Acc.detectLocked();
      const cryptoOff = (typeof CA === 'undefined' || !CA.available());
      let body;
      if (cryptoOff) {
        body = `<div class="acc-warn">⚠️ Tu navegador no soporta el cifrado requerido (WebAssembly/WebCrypto). No es posible crear ni abrir cuentas aquí.</div>`;
      } else if (Acc.state === 'in') {
        const st = Acc.status();
        const tabs = ['es', 'en', 'ca'];
        body = `<div class="acc-card">`
          + `<div class="acc-row"><span class="acc-email">${esc2(st.email)}</span>${st.isAdmin ? `<span class="acc-badge">${t('adminBadge')}</span>` : ''}</div>`
          + `<div class="acc-status ${st.active ? 'ok' : 'warn'}">${st.active ? `● ${t('activeOk')} · ${t('version')} ${st.version}` : `● ${t('notActive')}`}</div>`
          + `</div>`
          + (st.active ? `<label class="acc-legal" style="margin-top:.6rem"><input type="checkbox" id="accAuto" style="width:auto;margin-right:.5rem" onchange="App.accToggleAuto(this.checked)">${t('autoSync')}</label>` : `<div class="acc-warn" style="margin-top:.6rem">${t('pending')}</div>`)
          + `<div class="acc-actions">`
          + (st.active ? `<button class="bt bt-s" onclick="App.accSyncNow()">${t('syncNow')}</button><button class="bt bt-s" onclick="App.accVersions()">${t('verBtn')}</button>` : '')
          + `<button class="bt bt-s" onclick="App.accChangePwModal()">${t('changePw')}</button>`
          + `<button class="bt bt-s" onclick="App.accLogout()">${t('logout')}</button>`
          + `</div>`
          + (st.isAdmin ? this._accAdminBlock() : '');
      } else {
        // Fuera o bloqueado: el formulario vive en un modal dedicado (App.accModal).
        const isLocked = Acc.state === 'locked';
        body = `<div style="color:var(--t2);font-size:.86rem;margin-bottom:.95rem;line-height:1.5">${isLocked ? t('locked') : t('cfgPrompt')}</div>`
          + `<button class="bt bt-p" onclick="App.accModal()">${isLocked ? t('unlock') : t('login')}</button>`;
      }
      return `<div class="cfg-section"><div class="cfg-section-title">${t('title')}</div>`
        + `<div style="color:var(--t3);font-size:.82rem;margin-bottom:.9rem">${t('zk')}</div>`
        + body
        + `<div style="margin-top:1.5rem;padding-top:1rem;border-top:1px solid var(--b1)"><button class="bt bt-s" style="border-color:var(--bad);color:var(--bad)" onclick="App.logoutModal()">${L() === 'en' ? 'Clear this browser\'s data' : (L() === 'ca' ? 'Esborrar dades d\'aquest navegador' : 'Borrar datos de este navegador')}</button> <span style="color:var(--t3);font-size:.74rem">${L() === 'en' ? '(does not touch your cloud account)' : (L() === 'ca' ? '(no toca el teu compte al núvol)' : '(no toca tu cuenta en la nube)')}</span></div>`
        + `</div>`;
    },

    accMode(m) { mode = m; if (this._accInModal) this._accRenderModal(); else this.rCfg(); },

    // Abre el modal de inicio de sesión / registro / desbloqueo (la via principal desde la barra).
    accModal() {
      if (typeof Acc === 'undefined') return;
      if (Acc.state === 'in') return this.go('cfg'); // ya dentro: gestionar en Configuración
      Acc.detectLocked();
      if (Acc.state !== 'locked') mode = 'login';
      this._accInModal = true;
      this._accRenderModal();
    },

    _accRenderModal() {
      const cryptoOff = (typeof CA === 'undefined' || !CA.available());
      let title, body;
      if (cryptoOff) {
        title = t('login');
        body = `<div class="acc-warn">⚠️ ${L() === 'en' ? 'Your browser does not support the required encryption (WebAssembly/WebCrypto). Accounts cannot be created or opened here.' : (L() === 'ca' ? 'El teu navegador no suporta el xifrat requerit (WebAssembly/WebCrypto). No es poden crear ni obrir comptes aquí.' : 'Tu navegador no soporta el cifrado requerido (WebAssembly/WebCrypto). No es posible crear ni abrir cuentas aquí.')}</div>`;
      } else if (Acc.state === 'locked') {
        title = t('unlock');
        const lockedEmail = (Acc.status && Acc.status() && Acc.status().email) ? Acc.status().email : '';
        body = `<div class="acc-warn">${t('locked')}</div>`
          + `<form style="display:contents" onsubmit="App.accUnlock();return false">`
          + (lockedEmail ? `<input type="email" name="email" autocomplete="username" value="${esc2(lockedEmail)}" readonly tabindex="-1" aria-hidden="true" style="position:absolute;width:1px;height:1px;opacity:0;pointer-events:none">` : '')
          + `<div class="fg" style="margin-top:.85rem"><label>${t('password')}</label><input id="accPw" name="password" type="password" autocomplete="current-password"></div>`
          + `<button type="submit" class="bt bt-p">${t('unlock')}</button>`
          + `</form>`
          + `<div class="acc-links"><a onclick="App.accLogout()">${t('logout')}</a></div>`;
      } else {
        title = mode === 'signup' ? t('signup') : (mode === 'recover' ? t('doRecover') : t('login'));
        body = fieldsFor(mode);
      }
      this.om(`<div class="mt">${title}</div>`
        + `<div class="acc-modal-body">`
        + `<div style="color:var(--t3);font-size:.8rem;margin-bottom:1.1rem;line-height:1.45">${t('zk')}</div>`
        + body
        + `</div>`);
      setTimeout(() => { const f = document.getElementById('accEmail') || document.getElementById('accPw'); if (f) f.focus(); }, 30);
    },

    /**
     * Pantalla de bienvenida: este navegador recuerda una cuenta pero no hay sesion.
     * Dice cuando se guardo aqui, cuando se subio desde aqui, cuando fue la ultima subida
     * desde CUALQUIER dispositivo (pase de metadatos, sin contrasena) y si conviene entrar
     * antes de trabajar. Una vez por pestana salvo que se pida (force: clic en el indicador).
     */
    _accWelcomeBack(force) {
      if (typeof Acc === 'undefined' || Acc.state === 'in' || D._readOnly) return;
      const rm = Acc.remembered();
      if (!rm) return;
      if (!force) {
        try { if (sessionStorage.getItem('trackr_wb_skip')) return; } catch (e) { /* */ }
        if (document.getElementById('mO').classList.contains('on')) return; // otro modal (bienvenida, etc.)
      }
      const row = (label, val, id) => `<div class="br"><span class="la">${label}</span><span class="va"${id ? ` id="${id}"` : ''}>${val}</span></div>`;
      this._accInModal = true;
      this.om(`<div class="mt">${t('wbTitle')}</div>`
        + `<div class="acc-email" style="margin-bottom:.9rem">${esc2(rm.email)}</div>`
        + `<div class="bb">`
        + row(t('wbHere'), when(D.lastSaved))
        + row(t('wbSyncedHere'), rm.syncedAt ? `${when(rm.syncedAt)} · v${rm.version}` : t('wbNever'))
        + row(t('wbCloud'), rm.hasPass ? '…' : t('wbCloudNeedsLogin'), 'wbCloud')
        + `</div>`
        + (rm.dirty ? `<div class="acc-warn" style="margin-top:.75rem">${t('wbDirty')}</div>` : '')
        + `<div id="wbNewer"></div>`
        + `<form style="display:contents" onsubmit="App.accLogin();return false">`
        + `<input id="accEmail" type="email" name="email" autocomplete="username" value="${esc2(rm.email)}" readonly tabindex="-1" aria-hidden="true" style="position:absolute;width:1px;height:1px;opacity:0;pointer-events:none">`
        + `<div class="fg" style="margin-top:.85rem"><label>${t('password')}</label><input id="accPw" name="password" type="password" autocomplete="current-password"></div>`
        + `<button type="submit" class="bt bt-p">${t('enter')}</button>`
        + `</form>`
        + `<div class="acc-links"><a onclick="App._accWbSkip()">${t('wbSkip')}</a> · <a onclick="App.accModal()">${t('wbOther')}</a></div>`);
      setTimeout(() => document.getElementById('accPw')?.focus(), 30);
      if (rm.hasPass) Acc.cloudMeta().then((cm) => {
        const el = document.getElementById('wbCloud');
        if (!el) return; // el modal ya se cerro
        if (!cm) { el.textContent = t('wbCloudErr'); return; }
        el.innerHTML = cm.updatedAt ? `${when(cm.updatedAt)} · v${cm.currentVersion}` : t('wbNever');
        if (cm.currentVersion > rm.version) document.getElementById('wbNewer').innerHTML = `<div class="acc-warn" style="margin-top:.75rem">${t('wbNewer', cm.currentVersion, rm.version)}</div>`;
      });
    },

    _accWbSkip() {
      try { sessionStorage.setItem('trackr_wb_skip', '1'); } catch (e) { /* */ }
      this._accInModal = false;
      this.cm();
    },

    // Cierra el modal de cuenta y refresca la vista actual + la barra.
    _accDone() { this._accInModal = false; this.cm(); this.go(this.cv); },

    // El boton de la barra lateral (#navLogout) refleja el estado de CUENTA y es la via para hacer login.
    refreshAccountNav() {
      const el = document.getElementById('navLogout');
      if (!el || typeof Acc === 'undefined') return;
      const nt = el.querySelector('.nt') || el;
      const L = (typeof _lang !== 'undefined' ? _lang : 'es');
      const T2 = {
        in: { es: 'Cerrar sesión', en: 'Log out', ca: 'Tancar sessió' },
        out: { es: 'Iniciar sesión', en: 'Log in', ca: 'Iniciar sessió' },
        locked: { es: 'Desbloquear', en: 'Unlock', ca: 'Desbloquejar' },
      };
      const key = Acc.state === 'in' ? 'in' : (Acc.state === 'locked' ? 'locked' : 'out');
      nt.textContent = T2[key][L] || T2[key].es;
      el.setAttribute('onclick', Acc.state === 'in' ? 'App.accLogout()' : 'App.accModal()');
      el.setAttribute('title', key === 'out' ? 'Iniciar sesión / crear cuenta' : (key === 'locked' ? 'Desbloquear' : 'Cerrar sesión'));
      el.setAttribute('aria-label', nt.textContent); // a11y: en movil el .nt se oculta
      // Icono coherente con el estado: entrar (→) / bloqueado (⊘) / salir (←). Antes era ↺ (recargar), confuso.
      const ic = el.querySelector('.ic');
      if (ic) ic.textContent = key === 'in' ? '←' : (key === 'locked' ? '⊘' : '→');
      this._renderSyncStatus();
    },

    // Indicador de sync en la barra lateral. syncState: 'pending' | 'syncing' | 'synced' | 'error' |
    // undefined (repinta el ultimo conocido: navegar no debe tapar un "por subir" o un error).
    _renderSyncStatus(syncState) {
      if (syncState) lastSync = syncState; else syncState = lastSync;
      const el = document.getElementById('syncStatus');
      if (!el || typeof Acc === 'undefined') return;
      const st = Acc.status();
      if (st.state !== 'in') {
        /* Sin sesion con cuenta recordada: los cambios se quedan solo aqui. Que se vea. */
        const rm = Acc.remembered && Acc.remembered();
        if (!rm) { el.style.display = 'none'; el.innerHTML = ''; el.onclick = null; return; }
        el.style.display = '';
        el.className = 'sync-status warn';
        el.title = t('noSession');
        el.style.cursor = 'pointer';
        el.onclick = () => App._accWelcomeBack(true);
        el.innerHTML = `<span class="sync-dot"></span><span class="nt">${esc2(t('noSession'))}</span>`;
        return;
      }
      el.onclick = null; el.style.cursor = '';
      let cls, txt;
      if (syncState === 'syncing') { cls = 'syncing'; txt = t('syncing'); }
      else if (syncState === 'pending') { cls = 'warn'; txt = t('pendingSync'); }
      else if (syncState === 'error') { cls = 'err'; txt = t('syncErrShort'); }
      else if (!st.active) { cls = 'warn'; txt = t('pendingShort'); }
      else { cls = 'ok'; txt = `${t('synced')} · v${st.version}`; }
      el.style.display = '';
      el.className = 'sync-status ' + cls;
      el.title = txt;
      el.innerHTML = `<span class="sync-dot"></span><span class="nt">${esc2(txt)}</span>`;
    },

    accPwMeter(v) {
      const m = document.getElementById('accMeter'); if (!m) return;
      const score = (typeof CA !== 'undefined') ? CA.checkPassword(v).score : 0;
      [...m.children].forEach((seg, i) => { seg.className = i < score ? (score >= 3 ? 'on ok' : 'on') : ''; });
    },

    async accSignup() {
      const email = val('accEmail'), pw = val('accPw'), pw2 = val('accPw2');
      if (!CA.canonEmail(email)) return Toast.error(t('emailBad'));
      if (!CA.checkPassword(pw).ok) return Toast.error(t('pwWeak'));
      if (pw !== pw2) return Toast.error(t('pwMismatch'));
      if (!document.getElementById('accLegal')?.checked) return Toast.error(t('legalReq'));
      const role = document.querySelector('input[name="accRole"]:checked')?.value === 'gestor' ? 'gestor' : 'persona';
      try {
        // Cuenta gestor: empieza VACIA (no arrastra los datos locales de este navegador).
        const r = await Acc.signup(email, pw, role === 'gestor' ? CA.emptyData() : D.d, role);
        if (r.ok && r.recoveryCode) {
          /* 202 no dice si la cuenta es nueva (anti-enumeración). Se intenta entrar: si el servidor
             activa al momento, ya estamos dentro; si está en manual, sale «pendiente»; si el email
             ya tenía cuenta, la contraseña no coincide y se avisa. */
          let msg = null;
          if (r.pending) {
            const lg = await Acc.login(email, pw);
            msg = lg.ok ? (lg.active ? t('createdIn') : t('pending')) : lg.error === 'invalid_credentials' ? t('createdDup') : t('pending');
          }
          this._accShowRecovery(r.recoveryCode, () => { if (Acc.state === 'in' && Acc.status().active) Acc.setAutoSync(true); this._accInModal = false; this.refreshAccountNav(); this.go(this.cv); });
          if (msg) Toast.ok(msg);
        } else {
          Toast.error(errMsg(r.error));
        }
      } catch (e) { Toast.error(String(e.message || e)); }
    },

    async accLogin() {
      const email = val('accEmail'), pw = val('accPw');
      if (!email) return Toast.error(t('emailBad'));
      if (this._gstForceExit) this._gstForceExit(); // un re-login no debe reactivar sync sobre datos de un cliente en visor
      try {
        const r = await Acc.login(email, pw);
        if (!r.ok) return Toast.error(errMsg(r.error));
        Toast.ok(t('welcome'));
        if (r.active) await this._accAfterAuth();
        this._accDone();
      } catch (e) { Toast.error(String(e.message || e)); }
    },

    async accUnlock() {
      const pw = val('accPw'); if (!pw) return;
      if (this._gstForceExit) this._gstForceExit(); // idem: desbloquear en visor no debe subir datos del cliente
      try {
        const r = await Acc.unlock(pw);
        if (!r.ok) return Toast.error(errMsg(r.error));
        Toast.ok(t('welcome'));
        if (r.active) await this._accAfterAuth();
        this._accDone();
      } catch (e) { Toast.error(String(e.message || e)); }
    },

    async accLogout() {
      if (!confirm(t('confirmLogout'))) return;
      if (this._gstForceExit) this._gstForceExit(); // no dejar el modo visor colgado al salir
      Acc.setAutoSync(false);
      await Acc.logout();
      Toast.ok(t('loggedOut'));
      mode = 'login';
      this.refreshAccountNav();
      // Desde el modal de "bloqueado": vuelve al formulario de login en el mismo modal.
      if (this._accInModal) this._accRenderModal(); else this.rCfg();
    },

    async accSyncNow() {
      const r = await Acc.push();
      if (r.ok) Toast.ok(`${t('synced')} · v${r.version}`);
      else if (r.error === 'version_conflict') { if (typeof H !== 'undefined') H.snapshot(); await this._accPull(); Toast.warn(`${t('synced')} (${t('version')} ${r.currentVersion})`); }
      else Toast.error(t('syncErr') + (r.error ? ` (${r.error})` : ''));
      this.rCfg();
    },

    // Tras login/desbloqueo/recuperacion con cuenta activa: reconciliar local <-> nube
    // (Acc.resume decide; si ambos cambiaron, pregunta), y luego auto-sync + gestoria.
    async _accAfterAuth() {
      if (typeof H !== 'undefined') H.snapshot(); // red de seguridad: pase lo que pase, lo local queda en el historial
      let r = await Acc.resume();
      if (r.action === 'conflict') {
        const choice = await this._accAskConflict(r);
        r = await Acc.resolve(choice, r.cloudVersion);
      }
      if (!r.ok && r.error !== 'busy') Toast.error(t('syncErr') + (r.error ? ` (${errMsg(r.error)})` : ''));
      else if (r.action !== 'pulled' && r.action !== 'none') Toast.ok(`${t('synced')} · v${Acc.version}`);
      this._applyPrefs && this._applyPrefs();
      this.go(this.cv);
      Acc.setAutoSync(true);
      if (this._gestorPostLogin) await this._gestorPostLogin();
    },

    // Modal obligatorio (cm() lo ignora mientras _accChoose este pendiente): no hay
    // respuesta por defecto segura, cualquiera de las tres descarta o mezcla algo.
    _accAskConflict(c) {
      const when = (ts) => ts ? new Date(ts).toLocaleString(L()) : '—';
      return new Promise((res) => {
        this._accChoose = (v) => { this._accChoose = null; res(v); };
        this.om(`<div class="mt">${t('cfTitle')}</div>`
          + `<p style="font-size:.88rem;color:var(--t2);line-height:1.5;margin-bottom:1rem">${t('cfBody')}</p>`
          + `<div class="acc-actions" style="flex-direction:column;align-items:stretch">`
          + `<button class="bt bt-p" style="display:block;text-align:left" onclick="App._accChoose('merge')">${t('cfMerge')}<div class="small" style="opacity:.8">${t('cfMergeDesc')}</div></button>`
          + `<button class="bt" style="display:block;text-align:left" onclick="App._accChoose('cloud')">${t('cfCloud')} · v${c.cloudVersion}<div class="small" style="opacity:.8">${when(c.cloudAt)}</div></button>`
          + `<button class="bt" style="display:block;text-align:left" onclick="App._accChoose('local')">${t('cfLocal')}<div class="small" style="opacity:.8">${when(c.localAt)}</div></button>`
          + `</div>`
          + `<p class="small" style="color:var(--t3);margin-top:.85rem">${t('cfSafety')}</p>`);
      });
    },

    async _accPull() {
      const r = await Acc.pull();
      if (r.ok && !r.empty) { this._applyPrefs && this._applyPrefs(); this.go(this.cv); }
      return r;
    },

    /* ── Versiones en la nube: listar y restaurar (retencion escalonada en el servidor) ── */
    async accVersions() {
      const r = await Acc.versions();
      if (!r.ok) return Toast.error(t('syncErr') + ` (${errMsg(r.error)})`);
      const rows = r.versions.map(v => `<div class="cl-item">`
        + `<span class="cl-name" style="font-size:.82rem"><span class="m">v${v.version}</span> · ${when(v.createdAt)}${v.version === r.current ? ` · <strong style="color:var(--ok)">${t('verCurrent')}</strong>` : ''}</span>`
        + `<span class="cl-nif" style="font-size:.72rem;color:var(--t3)">${Math.max(1, Math.round(v.sizeBytes / 1024))} KB</span>`
        + (v.version === r.current ? '' : `<div class="cl-actions"><button class="bt bt-s" onclick="App.accRestore(${v.version},${r.current},${v.createdAt})">${t('verRestore')}</button></div>`)
        + `</div>`).join('');
      this.om(`<div class="mt">${t('verTitle')}</div>`
        + `<p style="font-size:.84rem;color:var(--t2);line-height:1.5;margin-bottom:.9rem">${t('verDesc')}</p>`
        + (rows ? `<div class="cl-list" style="max-height:55vh;overflow:auto">${rows}</div>` : `<div style="color:var(--t3)">${t('verEmpty')}</div>`)
        + `<div class="ma"><button class="bt" onclick="App.cm()">${window.t('btn.close')}</button></div>`);
    },

    async accRestore(v, current, ts) {
      if (!confirm(t('verConfirm', v, new Date(ts).toLocaleString(L(), { dateStyle: 'medium', timeStyle: 'short' })))) return;
      if (typeof H !== 'undefined') H.snapshot(); // lo de ahora, a salvo en este navegador
      const r = await Acc.restoreVersion(v, current);
      if (!r.ok) return Toast.error(t('syncErr') + ` (${errMsg(r.error)})`);
      Toast.ok(t('verDone', v, r.version));
      this.cm();
      this._applyPrefs && this._applyPrefs();
      this.go(this.cv);
    },

    accToggleAuto(on) { Acc.setAutoSync(on); if (on) this.accSyncNow(); },

    accChangePwModal() {
      // Username oculto (email de la cuenta) para que el gestor asocie la actualización
      // a la credencial guardada y ofrezca actualizarla (mismo patrón que el desbloqueo).
      const email = (Acc.status && Acc.status() && Acc.status().email) ? Acc.status().email : '';
      this.om(`<div class="mt">${t('changePw')}</div>`
        + `<form style="display:contents" onsubmit="App.accChangePwSave();return false">`
        + (email ? `<input type="email" name="email" autocomplete="username" value="${esc2(email)}" readonly tabindex="-1" aria-hidden="true" style="position:absolute;width:1px;height:1px;opacity:0;pointer-events:none">` : '')
        + `<div class="fg"><label>${t('currentPassword')}</label><input id="accCur" name="current-password" type="password" autocomplete="current-password"></div>`
        + `<div class="fg"><label>${t('newPassword')}</label><input id="accNew" name="new-password" type="password" autocomplete="new-password" oninput="App.accPwMeter(this.value)"><div id="accMeter" class="acc-meter"><span></span><span></span><span></span><span></span></div></div>`
        + `<div class="fg"><label>${t('password2')}</label><input id="accNew2" name="new-password2" type="password" autocomplete="new-password"></div>`
        + `<div class="ma"><button type="button" class="bt" onclick="App.cm()">${t('cancel')}</button><button type="submit" class="bt bt-p">${t('save')}</button></div>`
        + `</form>`);
    },

    async accChangePwSave() {
      const cur = val('accCur'), nw = val('accNew'), nw2 = val('accNew2');
      if (!CA.checkPassword(nw).ok) return Toast.error(t('pwWeak'));
      if (nw !== nw2) return Toast.error(t('pwMismatch'));
      const r = await Acc.changePassword(cur, nw);
      if (r.ok) { Toast.ok(t('pwChanged')); this.cm(); this.rCfg(); }
      else Toast.error(r.error === 'invalid_credentials' ? t('currentPassword') + ' ✗' : errMsg(r.error));
    },

    async accRecover() {
      const email = val('accEmail'), code = val('accRec'), pw = val('accPw');
      if (!CA.canonEmail(email)) return Toast.error(t('emailBad'));
      if (!CA.isValidRecovery(code)) return Toast.error(t('recoveryCode') + ' ✗');
      if (!CA.checkPassword(pw).ok) return Toast.error(t('pwWeak'));
      try {
        const r = await Acc.recover(email, code, pw);
        if (!r.ok) return Toast.error(errMsg(r.error));
        Toast.ok(t('recovered'));
        await this._accAfterAuth();
        this._accDone();
      } catch (e) { Toast.error(String(e.message || e)); }
    },

    _accShowRecovery(code, onDone) {
      this._recCode = code;
      this.om(`<div class="mt">${t('recTitle')}</div>`
        + `<div style="color:var(--warn);font-size:.82rem;margin-bottom:.85rem">${t('recDesc')}</div>`
        + `<div class="acc-reccode" id="accRecCode">${esc2(code)}</div>`
        + `<div class="acc-actions" style="margin-top:.85rem">`
        + `<button class="bt bt-s" onclick="App.accCopyRec()">${t('copy')}</button>`
        + `<button class="bt bt-s" onclick="App.accDownloadRec()">${t('download')}</button>`
        + `</div>`
        + `<div class="ma"><button class="bt bt-p" onclick="App.accDoneRecovery()">${t('saved')}</button></div>`);
      this._recDone = onDone;
    },
    accCopyRec() {
      // Solo confirmar si la copia REALMENTE tuvo éxito (el código es irrecuperable; un falso "Copiado" = pérdida de acceso).
      try {
        const p = navigator.clipboard && navigator.clipboard.writeText(this._recCode || '');
        if (p && p.then) p.then(() => Toast.ok(t('copied'))).catch(() => Toast.error(t('copyErr')));
        else Toast.error(t('copyErr'));
      } catch (e) { Toast.error(t('copyErr')); }
    },
    accDownloadRec() {
      const blob = new Blob([`TRACKR recovery code\n${this._recCode}\n\nGuárdalo offline. Es la única forma de recuperar tus datos si olvidas la contraseña.`], { type: 'text/plain' });
      const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'trackr-recovery-code.txt'; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    },
    accDoneRecovery() { const cb = this._recDone; this._recCode = null; this._recDone = null; this.cm(); if (cb) cb(); },

    /* ── Admin: la gestión de usuarios vive en su propia página (admin.html).
     * Aquí solo el enlace: el panel no pinta nada en la app personal de manu.
     * Misma pestaña a propósito — el token está en sessionStorage y así /admin
     * reutiliza la sesión sin pedir contraseña. ── */
    _accAdminBlock() {
      return `<div style="margin-top:1.5rem"><a class="bt" href="admin" style="text-decoration:none;display:inline-block">Panel de administración →</a></div>`;
    },
  });

  // ── Auto-sync: engancha D.save() (todos los mutadores pasan por ahi) ──
  if (typeof D !== 'undefined' && typeof D.save === 'function' && !D._accHooked) {
    const orig = D.save.bind(D);
    D.save = function () { orig(); try { if (typeof Acc !== 'undefined') Acc.notifyChange(); } catch (e) { /* */ } };
    D._accHooked = true;
  }

  // ── Indicador de sync: la cuenta avisa al cambiar de estado (sincronizando/ok/error) ──
  if (typeof Acc !== 'undefined' && Acc.setSyncListener) {
    // Si el push descubre que la sesion caduco (401), el boton de cuenta tambien pasa a «Desbloquear».
    Acc.setSyncListener((state) => { try { if (Acc.state !== 'in') App.refreshAccountNav(); else App._renderSyncStatus(state); } catch (e) { /* */ } });
  }
})();
