/* ================================================
 * TRACKR — App: UI del panel "Cuenta" (Etapa 2 C-UI)
 *
 * Extiende App. Renderiza una seccion en Configuracion segun Acc.state
 * (out / locked / in) y cablea los flujos de Acc (signup/login/unlock/logout/
 * cambio de contrasena/recuperacion) + sync. Auto-sync: engancha D.save().
 * Textos i18n inline (es/en/ca) — migrar a lang.js cuando se valide la UX.
 * Globales usados: Acc, CA, D, H, Toast.
 * ================================================ */
(() => {
  const L = () => (typeof _lang !== 'undefined' ? _lang : 'es');
  const TXT = {
    es: {
      title: 'Cuenta y sincronización', zk: 'Tus datos se cifran en tu navegador antes de subirse. Ni nosotros ni el servidor podemos leerlos (cifrado de conocimiento cero).',
      login: 'Iniciar sesión', signup: 'Crear cuenta', recover: '¿Olvidaste tu contraseña?',
      email: 'Email', password: 'Contraseña', password2: 'Repite la contraseña', newPassword: 'Contraseña nueva', currentPassword: 'Contraseña actual',
      recoveryCode: 'Código de recuperación', enter: 'Entrar', create: 'Crear cuenta', unlock: 'Desbloquear', logout: 'Cerrar sesión', syncNow: 'Sincronizar ahora', changePw: 'Cambiar contraseña', save: 'Guardar', cancel: 'Cancelar', doRecover: 'Recuperar acceso',
      legal: 'He leído que TRACKR cifra mis datos en mi navegador y que soy responsable de guardar mi contraseña y mi código de recuperación (no se pueden recuperar si los pierdo).',
      backLogin: '← Volver a iniciar sesión', haveCode: 'Tengo un código de recuperación',
      locked: 'Sesión bloqueada tras recargar. Introduce tu contraseña para desbloquear y descifrar tus datos.',
      pending: 'Cuenta creada. Pendiente de activación por el administrador antes de poder sincronizar.',
      activeOk: 'Sincronización activa', notActive: 'Pendiente de activación', version: 'versión en la nube', autoSync: 'Sincronizar automáticamente al cambiar',
      pwWeak: 'La contraseña debe tener al menos 12 caracteres.', pwMismatch: 'Las contraseñas no coinciden.', legalReq: 'Debes aceptar para continuar.', emailBad: 'Email no válido.',
      recTitle: 'Tu código de recuperación', recDesc: 'Apúntalo y guárdalo OFFLINE (no en este dispositivo). Es la ÚNICA forma de recuperar tus datos si olvidas la contraseña. NO se vuelve a mostrar.', copy: 'Copiar', download: 'Descargar .txt', saved: 'Lo he guardado, continuar', copied: 'Copiado', copyErr: 'No se pudo copiar. Usa "Descargar .txt".',
      welcome: 'Sesión iniciada', loggedOut: 'Sesión cerrada', synced: 'Sincronizado', syncErr: 'No se pudo sincronizar', pwChanged: 'Contraseña cambiada', recovered: 'Acceso recuperado',
      confirmLogout: '¿Cerrar sesión? Tus datos locales se mantienen en este navegador.', adminBadge: 'admin',
      cfgPrompt: 'Inicia sesión o crea una cuenta para sincronizar tus datos cifrados en la nube y usarlos en varios dispositivos.',
      syncing: 'Sincronizando…', syncErrShort: 'Error de sync', pendingShort: 'Pendiente', locked2: 'Bloqueado',
      roleLabel: 'Tipo de cuenta', rolePersona: 'Persona', rolePersonaDesc: 'Para llevar tu actividad: proyectos, horas, gastos, facturas.',
      roleGestor: 'Gestoría', roleGestorDesc: 'Para ver los datos de tus clientes de TRACKR (con su consentimiento). La cuenta empieza vacía.',
      gestorBadge: 'gestoría',
    },
    en: {
      title: 'Account & sync', zk: 'Your data is encrypted in your browser before upload. Neither we nor the server can read it (zero-knowledge).',
      login: 'Log in', signup: 'Create account', recover: 'Forgot your password?',
      email: 'Email', password: 'Password', password2: 'Repeat password', newPassword: 'New password', currentPassword: 'Current password',
      recoveryCode: 'Recovery code', enter: 'Log in', create: 'Create account', unlock: 'Unlock', logout: 'Log out', syncNow: 'Sync now', changePw: 'Change password', save: 'Save', cancel: 'Cancel', doRecover: 'Recover access',
      legal: 'I understand TRACKR encrypts my data in my browser and that I am responsible for keeping my password and recovery code (they cannot be recovered if lost).',
      backLogin: '← Back to log in', haveCode: 'I have a recovery code',
      locked: 'Session locked after reload. Enter your password to unlock and decrypt your data.',
      pending: 'Account created. Pending admin activation before you can sync.',
      activeOk: 'Sync active', notActive: 'Pending activation', version: 'cloud version', autoSync: 'Auto-sync on change',
      pwWeak: 'Password must be at least 12 characters.', pwMismatch: 'Passwords do not match.', legalReq: 'You must accept to continue.', emailBad: 'Invalid email.',
      recTitle: 'Your recovery code', recDesc: 'Write it down and keep it OFFLINE (not on this device). It is the ONLY way to recover your data if you forget your password. It will NOT be shown again.', copy: 'Copy', download: 'Download .txt', saved: 'I saved it, continue', copied: 'Copied', copyErr: 'Could not copy. Use "Download .txt".',
      welcome: 'Logged in', loggedOut: 'Logged out', synced: 'Synced', syncErr: 'Could not sync', pwChanged: 'Password changed', recovered: 'Access recovered',
      confirmLogout: 'Log out? Your local data stays in this browser.', adminBadge: 'admin',
      cfgPrompt: 'Log in or create an account to sync your encrypted data to the cloud and use it across devices.',
      syncing: 'Syncing…', syncErrShort: 'Sync error', pendingShort: 'Pending', locked2: 'Locked',
      roleLabel: 'Account type', rolePersona: 'Person', rolePersonaDesc: 'To run your business: projects, hours, expenses, invoices.',
      roleGestor: 'Advisor', roleGestorDesc: 'To view your TRACKR clients\' data (with their consent). The account starts empty.',
      gestorBadge: 'advisor',
    },
    ca: {
      title: 'Compte i sincronització', zk: 'Les teves dades es xifren al navegador abans de pujar-se. Ni nosaltres ni el servidor podem llegir-les (coneixement zero).',
      login: 'Iniciar sessió', signup: 'Crear compte', recover: 'Has oblidat la contrasenya?',
      email: 'Email', password: 'Contrasenya', password2: 'Repeteix la contrasenya', newPassword: 'Contrasenya nova', currentPassword: 'Contrasenya actual',
      recoveryCode: 'Codi de recuperació', enter: 'Entrar', create: 'Crear compte', unlock: 'Desbloquejar', logout: 'Tancar sessió', syncNow: 'Sincronitzar ara', changePw: 'Canviar contrasenya', save: 'Desar', cancel: 'Cancel·lar', doRecover: 'Recuperar accés',
      legal: 'Entenc que TRACKR xifra les meves dades al navegador i que soc responsable de guardar la contrasenya i el codi de recuperació (no es poden recuperar si els perdo).',
      backLogin: '← Tornar a iniciar sessió', haveCode: 'Tinc un codi de recuperació',
      locked: 'Sessió bloquejada després de recarregar. Introdueix la contrasenya per desbloquejar i desxifrar les dades.',
      pending: 'Compte creat. Pendent d\'activació per l\'administrador abans de sincronitzar.',
      activeOk: 'Sincronització activa', notActive: 'Pendent d\'activació', version: 'versió al núvol', autoSync: 'Sincronitzar automàticament en canviar',
      pwWeak: 'La contrasenya ha de tenir almenys 12 caràcters.', pwMismatch: 'Les contrasenyes no coincideixen.', legalReq: 'Has d\'acceptar per continuar.', emailBad: 'Email no vàlid.',
      recTitle: 'El teu codi de recuperació', recDesc: 'Apunta\'l i guarda\'l OFFLINE (no en aquest dispositiu). És l\'ÚNICA manera de recuperar les dades si oblides la contrasenya. NO es tornarà a mostrar.', copy: 'Copiar', download: 'Descarregar .txt', saved: 'L\'he guardat, continuar', copied: 'Copiat', copyErr: 'No s\'ha pogut copiar. Usa "Descarregar .txt".',
      welcome: 'Sessió iniciada', loggedOut: 'Sessió tancada', synced: 'Sincronitzat', syncErr: 'No s\'ha pogut sincronitzar', pwChanged: 'Contrasenya canviada', recovered: 'Accés recuperat',
      confirmLogout: 'Tancar sessió? Les dades locals es mantenen en aquest navegador.', adminBadge: 'admin',
      cfgPrompt: 'Inicia sessió o crea un compte per sincronitzar les teves dades xifrades al núvol i fer-les servir en diversos dispositius.',
      syncing: 'Sincronitzant…', syncErrShort: 'Error de sync', pendingShort: 'Pendent', locked2: 'Bloquejat',
      roleLabel: 'Tipus de compte', rolePersona: 'Persona', rolePersonaDesc: 'Per portar la teva activitat: projectes, hores, despeses, factures.',
      roleGestor: 'Gestoria', roleGestorDesc: 'Per veure les dades dels teus clients de TRACKR (amb el seu consentiment). El compte comença buit.',
      gestorBadge: 'gestoria',
    },
  };
  const t = (k) => (TXT[L()] || TXT.es)[k] || k;
  const val = (id) => { const el = document.getElementById(id); return el ? el.value : ''; };
  const esc2 = (s) => (typeof esc === 'function' ? esc(s) : String(s));

  let mode = 'login'; // out-state: login | signup | recover

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
          + (st.active ? `<button class="bt bt-s" onclick="App.accSyncNow()">${t('syncNow')}</button>` : '')
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

    // Indicador de sync en la barra lateral. syncState: 'syncing' | 'synced' | 'error' | undefined (lee estado actual).
    _renderSyncStatus(syncState) {
      const el = document.getElementById('syncStatus');
      if (!el || typeof Acc === 'undefined') return;
      const st = Acc.status();
      if (st.state !== 'in') { el.style.display = 'none'; el.innerHTML = ''; return; }
      let cls, txt;
      if (syncState === 'syncing') { cls = 'syncing'; txt = t('syncing'); }
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
          this._accShowRecovery(r.recoveryCode, () => { if (Acc.state === 'in' && Acc.status().active) Acc.setAutoSync(true); this._accInModal = false; this.refreshAccountNav(); this.go(this.cv); });
          if (r.pending) Toast.ok(t('pending'));
        } else { Toast.error(r.error === 'signups_closed' ? t('pending') : (r.error || 'error')); }
      } catch (e) { Toast.error(String(e.message || e)); }
    },

    async accLogin() {
      const email = val('accEmail'), pw = val('accPw');
      if (!email) return Toast.error(t('emailBad'));
      if (this._gstForceExit) this._gstForceExit(); // un re-login no debe reactivar sync sobre datos de un cliente en visor
      try {
        const r = await Acc.login(email, pw);
        if (!r.ok) return Toast.error(r.error === 'inactive' ? t('pending') : (r.error || 'error'));
        Toast.ok(t('welcome'));
        if (r.active) { if (typeof H !== 'undefined') H.snapshot(); await this._accPull(); Acc.setAutoSync(true); if (this._gestorPostLogin) await this._gestorPostLogin(); }
        this._accDone();
      } catch (e) { Toast.error(String(e.message || e)); }
    },

    async accUnlock() {
      const pw = val('accPw'); if (!pw) return;
      if (this._gstForceExit) this._gstForceExit(); // idem: desbloquear en visor no debe subir datos del cliente
      try {
        const r = await Acc.unlock(pw);
        if (!r.ok) return Toast.error(r.error || 'error');
        Toast.ok(t('welcome'));
        if (r.active) { if (typeof H !== 'undefined') H.snapshot(); await this._accPull(); Acc.setAutoSync(true); if (this._gestorPostLogin) await this._gestorPostLogin(); }
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
      else if (r.error === 'version_conflict') { await this._accPull(); Toast.warn(`${t('synced')} (${t('version')} ${r.currentVersion})`); }
      else Toast.error(t('syncErr') + (r.error ? ` (${r.error})` : ''));
      this.rCfg();
    },

    async _accPull() {
      const r = await Acc.pull();
      if (r.ok && !r.empty) { this._applyPrefs && this._applyPrefs(); this.go(this.cv); }
      return r;
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
      else Toast.error(r.error === 'invalid_credentials' ? t('currentPassword') + ' ✗' : (r.error || 'error'));
    },

    async accRecover() {
      const email = val('accEmail'), code = val('accRec'), pw = val('accPw');
      if (!CA.canonEmail(email)) return Toast.error(t('emailBad'));
      if (!CA.isValidRecovery(code)) return Toast.error(t('recoveryCode') + ' ✗');
      if (!CA.checkPassword(pw).ok) return Toast.error(t('pwWeak'));
      try {
        const r = await Acc.recover(email, code, pw);
        if (!r.ok) return Toast.error(r.error || 'error');
        Toast.ok(t('recovered'));
        if (typeof H !== 'undefined') H.snapshot(); await this._accPull(); Acc.setAutoSync(true);
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

    /* ── Admin: lista de usuarios + activar/pagar/borrar ── */
    _accAdminBlock() {
      return `<div style="margin-top:1.5rem"><div class="cfg-section-title" style="font-size:.95rem">Usuarios (admin)</div>`
        + `<button class="bt bt-s" onclick="App.accAdminLoad()">Ver / refrescar usuarios</button>`
        + `<div id="accAdminList"></div></div>`;
    },
    async accAdminLoad() {
      const el = document.getElementById('accAdminList'); if (!el) return;
      el.innerHTML = `<div style="color:var(--t3);font-size:.8rem;margin-top:.5rem">…</div>`;
      const users = await Acc.adminListUsers();
      if (!users) { el.innerHTML = `<div class="acc-warn" style="margin-top:.5rem">No se pudieron cargar los usuarios.</div>`; return; }
      el.innerHTML = `<div class="cl-list" style="margin-top:.6rem">` + users.map(u =>
        `<div class="cl-item">`
        + `<span class="cl-name" style="font-size:.82rem">${esc2(u.email)}${u.isAdmin ? ' <span class="acc-badge">admin</span>' : ''}${u.paid ? ' <span class="acc-badge">pago</span>' : ''}</span>`
        + `<span class="cl-nif" style="font-size:.72rem;color:var(--t3)">${u.active ? '<span style="color:var(--ok)">activo</span>' : '<span style="color:var(--warn)">pendiente</span>'} · v${u.currentVersion} · ${Math.round((u.totalBytes || 0) / 1024)}KB</span>`
        + `<div class="cl-actions">`
        + `<button class="cl-btn" title="${u.active ? 'Desactivar' : 'Activar'}" onclick="App.accAdminActive('${u.userId}',${u.active ? 0 : 1})">${u.active ? '✓' : '○'}</button>`
        + `<button class="cl-btn" title="${u.paid ? 'Quitar pago' : 'Marcar pagado'}" onclick="App.accAdminPaid('${u.userId}',${u.paid ? 0 : 1})">&euro;</button>`
        + `<button class="cl-btn cl-btn-del" title="Borrar (soft)" onclick="App.accAdminDelete('${u.userId}')">&times;</button>`
        + `</div></div>`
      ).join('') + `</div>`;
    },
    async accAdminActive(id, active) { if (await Acc.adminSetActive(id, !!active)) { Toast.ok(active ? 'Activado' : 'Desactivado'); this.accAdminLoad(); } else Toast.error('Error'); },
    async accAdminPaid(id, paid) { if (await Acc.adminSetPaid(id, !!paid)) { Toast.ok('OK'); this.accAdminLoad(); } else Toast.error('Error'); },
    async accAdminDelete(id) { if (!confirm('¿Borrar esta cuenta? (soft-delete, reversible 30 días). Mira el email en su fila.')) return; if (await Acc.adminDelete(id)) { Toast.ok('Borrada'); this.accAdminLoad(); } else Toast.error('Error'); },
  });

  // ── Auto-sync: engancha D.save() (todos los mutadores pasan por ahi) ──
  if (typeof D !== 'undefined' && typeof D.save === 'function' && !D._accHooked) {
    const orig = D.save.bind(D);
    D.save = function () { orig(); try { if (typeof Acc !== 'undefined') Acc.notifyChange(); } catch (e) { /* */ } };
    D._accHooked = true;
  }

  // ── Indicador de sync: la cuenta avisa al cambiar de estado (sincronizando/ok/error) ──
  if (typeof Acc !== 'undefined' && Acc.setSyncListener) {
    Acc.setSyncListener((state) => { try { App._renderSyncStatus(state); } catch (e) { /* */ } });
  }
})();
