/* ================================================
 * TRACKR — App: UI de gestores (compartición E2E, TODO/21)
 *
 * Dos caras:
 *  - PERSONA con sesión activa: sección "Mi gestoría" en Configuración —
 *    vincular con un código TRK-G- (resolver → confirmar huella → alcance),
 *    ver el vínculo activo y revocarlo.
 *  - GESTOR con sesión activa: sección "Cartera" — su código para repartir
 *    y la lista de clientes; abrir uno carga sus datos en MODO VISOR.
 *
 * Modo visor: snapshot de los datos propios en localStorage + flag; el
 * auto-sync del gestor se pausa (Acc.setAutoSync(false)) para que los datos
 * del cliente JAMÁS se suban a la cuenta del gestor. Banner fijo con "volver".
 * Si se cierra la pestaña en modo visor, al recargar se restaura solo.
 *
 * Textos i18n inline (es/en/ca), como app.account-ui.js.
 * Globales usados: Acc, CA, D, H, Toast, App, esc.
 * ================================================ */
(() => {
  const L = () => (typeof _lang !== 'undefined' ? _lang : 'es');
  const TXT = {
    es: {
      miTitle: 'Mi gestoría', miDesc: 'Comparte tus datos con tu gestoría de forma cifrada. Solo tu gestoría puede leerlos (ni TRACKR ni el servidor). Puedes revocar el acceso cuando quieras.',
      codePh: 'Código de tu gestoría (TRK-G-…)', link: 'Vincular', badCode: 'Código no válido', notFound: 'No se encontró esa gestoría', rateLimited: 'Demasiados intentos, espera unos minutos',
      confirmTitle: 'Confirmar gestoría', confirmDesc: 'Vas a compartir tus datos con:', fingerprint: 'Huella de clave',
      scope: 'Qué compartir', scopeFiscal: 'Solo lo fiscal (facturas, gastos, clientes, proyectos sin horas ni notas)', scopeTodo: 'Todo (incluye horas y notas)',
      confirmBtn: 'Compartir', cancel: 'Cancelar', linked: 'Vinculado con', revoke: 'Revocar acceso', revokeConfirm: '¿Revocar el acceso de tu gestoría? Dejará de ver tus datos inmediatamente.', revoked: 'Acceso revocado', lastShared: 'última copia',
      gestTitle: 'Cartera de gestoría', gestDesc: 'Comparte tu código con tus clientes de TRACKR: ellos lo introducen en su Configuración para darte acceso cifrado a sus datos.',
      yourCode: 'Tu código', copy: 'Copiar', copied: 'Copiado', clients: 'Clientes vinculados', noClients: 'Ningún cliente vinculado todavía.', refresh: 'Refrescar', open: 'Ver datos', noBlob: 'sin datos aún', updated: 'actualizado',
      viewing: 'Viendo los datos de', viewingRO: '(solo lectura: los cambios NO se guardan ni se suben)', back: '← Volver a mis datos', backOk: 'De vuelta a tus datos', openErr: 'No se pudieron descifrar los datos',
      keyPublished: 'Clave de gestoría publicada', keyErr: 'No se pudo publicar la clave de gestoría',
      /* Etapa B */
      canEdit: 'Dejar que edite mis datos', canEditHelp: 'Podrá corregir gastos, clientes, proyectos, deducibles y tus casillas fiscales. No puede tocar tus horas ni tus facturas. Cada cambio queda firmado con su nombre en el historial y lo puedes deshacer.',
      editOn: 'Puede editar', editOff: 'Solo lectura', allowEdit: 'Permitir edición', denyEdit: 'Quitar edición', permSaved: 'Permiso actualizado',
      edit: 'Editar', editing: 'EDITANDO', stopEdit: 'Dejar de editar', editNotAllowed: 'Esta persona no te ha dado permiso de edición',
      pendingOps: (n) => `${n} cambio${n === 1 ? '' : 's'} sin enviar`, allSent: 'Cambios enviados', sendErr: 'No se pudieron enviar los cambios',
      leaveWarn: 'Tienes cambios sin enviar. Si sales ahora se pierden.',
      opsApplied: (n, who) => `${who} ha hecho ${n} cambio${n === 1 ? '' : 's'} en tus datos`,
      undo: 'Deshacer', undone: 'deshecho', undoOk: 'Cambio deshecho', undoErr: 'No se pudo deshacer',
    },
    en: {
      miTitle: 'My advisor', miDesc: 'Share your data with your advisor, encrypted end-to-end. Only your advisor can read it (not TRACKR, not the server). You can revoke access anytime.',
      codePh: 'Your advisor\'s code (TRK-G-…)', link: 'Link', badCode: 'Invalid code', notFound: 'Advisor not found', rateLimited: 'Too many attempts, wait a few minutes',
      confirmTitle: 'Confirm advisor', confirmDesc: 'You are about to share your data with:', fingerprint: 'Key fingerprint',
      scope: 'What to share', scopeFiscal: 'Fiscal only (invoices, expenses, clients, projects without hours or notes)', scopeTodo: 'Everything (includes hours and notes)',
      confirmBtn: 'Share', cancel: 'Cancel', linked: 'Linked with', revoke: 'Revoke access', revokeConfirm: 'Revoke your advisor\'s access? They will stop seeing your data immediately.', revoked: 'Access revoked', lastShared: 'last copy',
      gestTitle: 'Advisor portfolio', gestDesc: 'Share your code with your TRACKR clients: they enter it in their Settings to give you encrypted access to their data.',
      yourCode: 'Your code', copy: 'Copy', copied: 'Copied', clients: 'Linked clients', noClients: 'No linked clients yet.', refresh: 'Refresh', open: 'View data', noBlob: 'no data yet', updated: 'updated',
      viewing: 'Viewing data of', viewingRO: '(read-only: changes are NOT saved or uploaded)', back: '← Back to my data', backOk: 'Back to your data', openErr: 'Could not decrypt the data',
      keyPublished: 'Advisor key published', keyErr: 'Could not publish advisor key',
      /* Etapa B */
      canEdit: 'Let them edit my data', canEditHelp: 'They will be able to fix expenses, clients, projects, deductibles and your tax fields. They cannot touch your hours or your invoices. Every change is signed with their name in the history and you can undo it.',
      editOn: 'Can edit', editOff: 'Read-only', allowEdit: 'Allow editing', denyEdit: 'Remove editing', permSaved: 'Permission updated',
      edit: 'Edit', editing: 'EDITING', stopEdit: 'Stop editing', editNotAllowed: 'This person has not given you edit permission',
      pendingOps: (n) => `${n} change${n === 1 ? '' : 's'} not sent`, allSent: 'Changes sent', sendErr: 'Could not send the changes',
      leaveWarn: 'You have unsent changes. Leaving now loses them.',
      opsApplied: (n, who) => `${who} made ${n} change${n === 1 ? '' : 's'} to your data`,
      undo: 'Undo', undone: 'undone', undoOk: 'Change undone', undoErr: 'Could not undo',
    },
    ca: {
      miTitle: 'La meva gestoria', miDesc: 'Comparteix les teves dades amb la teva gestoria de forma xifrada. Només la teva gestoria pot llegir-les (ni TRACKR ni el servidor). Pots revocar l\'accés quan vulguis.',
      codePh: 'Codi de la teva gestoria (TRK-G-…)', link: 'Vincular', badCode: 'Codi no vàlid', notFound: 'No s\'ha trobat aquesta gestoria', rateLimited: 'Massa intents, espera uns minuts',
      confirmTitle: 'Confirmar gestoria', confirmDesc: 'Compartiràs les teves dades amb:', fingerprint: 'Empremta de clau',
      scope: 'Què compartir', scopeFiscal: 'Només el fiscal (factures, despeses, clients, projectes sense hores ni notes)', scopeTodo: 'Tot (inclou hores i notes)',
      confirmBtn: 'Compartir', cancel: 'Cancel·lar', linked: 'Vinculat amb', revoke: 'Revocar accés', revokeConfirm: 'Revocar l\'accés de la teva gestoria? Deixarà de veure les teves dades immediatament.', revoked: 'Accés revocat', lastShared: 'última còpia',
      gestTitle: 'Cartera de gestoria', gestDesc: 'Comparteix el teu codi amb els teus clients de TRACKR: ells l\'introdueixen a la seva Configuració per donar-te accés xifrat a les seves dades.',
      yourCode: 'El teu codi', copy: 'Copiar', copied: 'Copiat', clients: 'Clients vinculats', noClients: 'Cap client vinculat encara.', refresh: 'Refrescar', open: 'Veure dades', noBlob: 'sense dades encara', updated: 'actualitzat',
      viewing: 'Veient les dades de', viewingRO: '(només lectura: els canvis NO es desen ni es pugen)', back: '← Tornar a les meves dades', backOk: 'De tornada a les teves dades', openErr: 'No s\'han pogut desxifrar les dades',
      keyPublished: 'Clau de gestoria publicada', keyErr: 'No s\'ha pogut publicar la clau de gestoria',
      /* Etapa B */
      canEdit: 'Deixar que editi les meves dades', canEditHelp: 'Podrà corregir despeses, clients, projectes, deduïbles i les teves caselles fiscals. No pot tocar les teves hores ni les teves factures. Cada canvi queda signat amb el seu nom a l\'historial i el pots desfer.',
      editOn: 'Pot editar', editOff: 'Només lectura', allowEdit: 'Permetre edició', denyEdit: 'Treure edició', permSaved: 'Permís actualitzat',
      edit: 'Editar', editing: 'EDITANT', stopEdit: 'Deixar d\'editar', editNotAllowed: 'Aquesta persona no t\'ha donat permís d\'edició',
      pendingOps: (n) => `${n} canvi${n === 1 ? '' : 's'} sense enviar`, allSent: 'Canvis enviats', sendErr: 'No s\'han pogut enviar els canvis',
      leaveWarn: 'Tens canvis sense enviar. Si surts ara es perden.',
      opsApplied: (n, who) => `${who} ha fet ${n} canvi${n === 1 ? '' : 's'} a les teves dades`,
      undo: 'Desfer', undone: 'desfet', undoOk: 'Canvi desfet', undoErr: 'No s\'ha pogut desfer',
    },
  };
  const t = (k) => (TXT[L()] || TXT.es)[k] || k;
  const esc2 = (s) => (typeof esc === 'function' ? esc(s) : String(s));
  const fpShort = (fp) => (fp || '').slice(0, 12);
  const VIEW_KEY = 'trackr_gestor_view';   // marca {clientEmail, grantId} — solo para el banner al recargar

  Object.assign(App, {

    /* ── sección de Configuración (persona o gestor, según el rol de la sesión) ── */
    _cfgGestoresSection() {
      if (typeof Acc === 'undefined' || typeof CA === 'undefined' || !CA.available()) return '';
      const st = Acc.status();
      if (st.state !== 'in' || !st.active) return '';
      if (st.role === 'gestor') return this._cfgGestorCartera();
      return this._cfgMiGestor();
    },

    _cfgMiGestor() {
      const g = D.d.settings.gestorGrant;
      let body;
      if (g) {
        body = `<div class="acc-card">`
          + `<div class="acc-row"><span class="acc-email">${t('linked')} <strong>${esc2(g.gestorEmail)}</strong></span>`
          + `<span class="cl-nif" style="font-size:.72rem;color:${g.canEdit ? 'var(--warn,#c90)' : 'var(--t3)'}">${g.canEdit ? t('editOn') : t('editOff')}</span></div>`
          + `<div style="color:var(--t3);font-size:.74rem;margin-top:.3rem">${t('fingerprint')}: <code class="mono">${esc2(fpShort(g.fingerprint))}</code> · ${esc2(g.scope)}</div>`
          + `</div>`
          + `<div class="cfg-save" style="margin-top:.75rem;display:flex;gap:.5rem;flex-wrap:wrap">`
          +   `<button class="bt" onclick="App.gstToggleCanEdit(${g.canEdit ? 'false' : 'true'})">${g.canEdit ? t('denyEdit') : t('allowEdit')}</button>`
          +   `<button class="bt" style="border-color:var(--bad);color:var(--bad)" onclick="App.gstRevoke()">${t('revoke')}</button>`
          + `</div>`;
      } else {
        body = `<form style="display:flex;gap:.5rem;flex-wrap:wrap" onsubmit="App.gstLink();return false">`
          + `<input type="text" id="gstCode" placeholder="${t('codePh')}" style="flex:1;min-width:220px;text-transform:uppercase" autocomplete="off">`
          + `<button type="submit" class="bt bt-p">${t('link')}</button>`
          + `</form>`;
      }
      return `<div class="cfg-section" style="margin-top:2.5rem"><div class="cfg-section-title">${t('miTitle')}</div>`
        + `<p style="color:var(--t3);font-size:.82rem;margin-bottom:.75rem">${t('miDesc')}</p>`
        + body
        + `</div>`;
    },

    _cfgGestorCartera() {
      const code = D.d.settings.gestorCode || '…';
      const kp = D.d.settings.gestorKeypair || {};
      return `<div class="cfg-section" style="margin-top:2.5rem"><div class="cfg-section-title">${t('gestTitle')}</div>`
        + `<p style="color:var(--t3);font-size:.82rem;margin-bottom:.75rem">${t('gestDesc')}</p>`
        + `<div class="acc-card"><div class="acc-row"><span>${t('yourCode')}: <code class="mono" id="gstOwnCode" style="font-size:.95rem">${esc2(code)}</code></span>`
        + `<button class="bt" style="font-size:.72rem;padding:.2rem .6rem" onclick="App.gstCopyCode()">${t('copy')}</button></div>`
        + `<div style="color:var(--t3);font-size:.72rem;margin-top:.3rem">${t('fingerprint')}: <code class="mono">${esc2(fpShort(kp.fingerprint))}</code></div></div>`
        + `<div style="margin-top:1.1rem"><div class="cfg-section-title" style="font-size:.85rem;margin-bottom:.5rem">${t('clients')}</div>`
        + `<button class="bt" onclick="App.gstLoadClients()">${t('refresh')}</button>`
        + `<div id="gstClients" style="margin-top:.6rem"></div></div>`
        + `</div>`;
    },

    /* ── flujo persona: vincular ── */
    async gstLink() {
      const code = (document.getElementById('gstCode')?.value || '').trim().toUpperCase();
      // Mismo alfabeto que el servidor (sin I/L/O ambiguos): así una I tecleada se rechaza
      // aquí con mensaje claro en vez de llegar al backend y volver como 'bad_request' crudo.
      if (!/^TRK-G-[A-HJ-NP-Z2-9]{10}$/.test(code)) return Toast.error(t('badCode'));
      const r = await Acc.gestorResolve(code);
      if (!r.ok) {
        const msg = r.error === 'not_found' ? t('notFound')
          : r.error === 'rate_limited' ? t('rateLimited')
          : r.error === 'bad_request' ? t('badCode') : (r.error || 'error');
        return Toast.error(msg);
      }
      this._gstPending = { code, publicKey: r.publicKey, email: r.gestorEmail, fingerprint: r.fingerprint };
      this.om(`<div class="mt">${t('confirmTitle')}</div>`
        + `<p style="font-size:.86rem">${t('confirmDesc')}</p>`
        + `<div class="acc-card" style="margin:.6rem 0"><div class="acc-row"><span class="acc-email"><strong>${esc2(r.gestorEmail)}</strong></span></div>`
        + `<div style="color:var(--t3);font-size:.74rem;margin-top:.3rem">${t('fingerprint')}: <code class="mono">${esc2(fpShort(r.fingerprint))}</code></div></div>`
        + `<div class="fg" style="margin-top:.6rem"><label>${t('scope')}</label>`
        + `<label style="display:flex;align-items:flex-start;gap:.5rem;cursor:pointer;text-transform:none;letter-spacing:0;margin-top:.3rem"><input type="radio" name="gstScope" value="fiscal" checked style="width:auto;margin-top:.2rem"><span style="font-size:.82rem">${t('scopeFiscal')}</span></label>`
        + `<label style="display:flex;align-items:flex-start;gap:.5rem;cursor:pointer;text-transform:none;letter-spacing:0;margin-top:.35rem"><input type="radio" name="gstScope" value="todo" style="width:auto;margin-top:.2rem"><span style="font-size:.82rem">${t('scopeTodo')}</span></label>`
        + `</div>`
        /* Edición: opt-in explícito y apagada de fábrica. Vincular sigue significando
           "que lo vea", como hasta ahora; dejar que escriba es otra decisión aparte. */
        + `<div class="fg" style="margin-top:.7rem"><label style="display:flex;align-items:flex-start;gap:.5rem;cursor:pointer;text-transform:none;letter-spacing:0">`
        +   `<input type="checkbox" id="gstCanEdit" style="width:auto;margin-top:.2rem"><span style="font-size:.82rem">${t('canEdit')}</span></label>`
        +   `<div style="font-size:.72rem;color:var(--t3);margin-top:.3rem">${t('canEditHelp')}</div></div>`
        + `<div class="ma"><button class="bt" onclick="App.cm()">${t('cancel')}</button><button class="bt bt-p" onclick="App.gstConfirmLink()">${t('confirmBtn')}</button></div>`);
    },

    async gstConfirmLink() {
      const p = this._gstPending;
      if (!p) return;
      const scope = document.querySelector('input[name="gstScope"]:checked')?.value === 'todo' ? 'todo' : 'fiscal';
      const canEdit = !!document.getElementById('gstCanEdit')?.checked;
      const r = await Acc.grantCreate(p.code, p.publicKey, p.email, scope, canEdit);
      if (!r.ok) return Toast.error(r.error || 'error');
      this._gstPending = null;
      Toast.ok(`${t('linked')} ${p.email}`);
      this.cm(); this.rCfg();
    },

    /** Conceder o retirar el permiso de edición. Retirarlo tira las ops que el gestor
     *  hubiera dejado pendientes (lo hace el servidor), así que no se aplican después. */
    async gstToggleCanEdit(on) {
      if (on && !confirm(t('canEditHelp'))) return;
      const r = await Acc.grantSetCanEdit(on);
      if (!r.ok) return Toast.error(r.error || 'error');
      Toast.ok(t('permSaved'));
      this.rCfg();
    },

    async gstRevoke() {
      if (!confirm(t('revokeConfirm'))) return;
      const r = await Acc.grantRevoke();
      if (!r.ok) return Toast.error(r.error || 'error');
      Toast.ok(t('revoked'));
      this.rCfg();
    },

    /* ── flujo gestor: código, cartera y visor ── */

    // Tras login/desbloqueo de una cuenta gestor activa: publica la clave si hace falta
    // y guarda el código en settings (viaja en su propio blob cifrado).
    async _gestorPostLogin() {
      /* Persona: recoger de entrada lo que su gestoría haya cambiado, sin esperar al
         primer push (si no, no vería nada nuevo hasta tocar algo). */
      if (Acc.status().role !== 'gestor') {
        Acc.setOpsListener((info) => this._gstOnOpsApplied(info));
        Acc.pullOps().catch(() => { /* best-effort: se reintenta en cada sync */ });
        return;
      }
      const r = await Acc.gestorEnsureKey();
      if (r.ok && D.d.settings.gestorCode !== r.code) { D.d.settings.gestorCode = r.code; D.save(); }
      else if (!r.ok && r.error !== 'not_ready') console.warn('gestorEnsureKey:', r.error);
    },

    gstCopyCode() {
      const code = D.d.settings.gestorCode || '';
      try {
        const p = navigator.clipboard && navigator.clipboard.writeText(code);
        if (p && p.then) p.then(() => Toast.ok(t('copied'))).catch(() => Toast.error('✗'));
      } catch (e) { Toast.error('✗'); }
    },

    async gstLoadClients() {
      const el = document.getElementById('gstClients'); if (!el) return;
      el.innerHTML = `<div style="color:var(--t3);font-size:.8rem">…</div>`;
      const r = await Acc.gestorClients();
      if (!r.ok) { el.innerHTML = `<div class="acc-warn">${esc2(r.error || 'error')}</div>`; return; }
      if (!r.clients.length) { el.innerHTML = `<div style="color:var(--t3);font-size:.82rem">${t('noClients')}</div>`; return; }
      /* Cache por grantId: el email (dato de usuario) NUNCA se interpola en un onclick.
         En un atributo, el navegador decodifica las entidades de esc() antes de que el
         parser JS lea la cadena, así que un email con comilla escaparía del literal (XSS).
         Solo el grantId (UUID de formato fijo) viaja en el onclick; el email se busca aquí. */
      this._gstClients = {};
      el.innerHTML = `<div class="cl-list">` + r.clients.map(c => {
        this._gstClients[c.grantId] = c;
        const upd = c.blobUpdatedAt ? new Date(c.blobUpdatedAt * 1000).toLocaleDateString() : null;
        return `<div class="cl-item">`
          + `<span class="cl-name" style="font-size:.84rem">${esc2(c.personaEmail)}</span>`
          + `<span class="cl-nif" style="font-size:.72rem">${esc2(c.scope)}</span>`
          + `<span class="cl-nif" style="font-size:.72rem;color:var(--t3)">${upd ? `${t('updated')} ${upd}` : t('noBlob')}</span>`
          + (c.blobHash ? `<button class="bt" style="font-size:.72rem;padding:.2rem .6rem" onclick="App.gstOpenClient('${esc2(c.grantId)}')">${t('open')}</button>` : '')
          + `</div>`;
      }).join('') + `</div>`;
    },

    async gstOpenClient(grantId) {
      const email = this._gstClients?.[grantId]?.personaEmail || '';
      // Guard de reentrada: si ya se está viendo un cliente, salir primero para no
      // machacar el estado propio (D.exitView recupera los datos reales del gestor).
      if (D._readOnly) this._gstForceExit();
      const r = await Acc.gestorOpenClient(grantId);
      if (!r.ok) return Toast.error(`${t('openErr')} (${r.error || '?'})`);
      // Marca de visor solo para re-mostrar el banner si se recarga la pestaña. NO guarda
      // datos: D.loadView carga en memoria sin persistir, así el localStorage/nube del
      // gestor conservan SUS datos y una recarga los muestra sin más (D.save bloqueado).
      localStorage.setItem(VIEW_KEY, JSON.stringify({ clientEmail: email, grantId }));
      Acc.setAutoSync(false);
      D.loadView(r.data);
      // El permiso y la shareKey se guardan en memoria para poder emitir ops si se
      // activa la edición. Nunca en localStorage: es material del cliente (ver GOps).
      this._gstView = { grantId, email, canEdit: !!r.canEdit, shareKey: r.shareKey };
      this._gstShowBanner(email);
      this.go('info');
    },

    /* ── Etapa B: edición desde el visor ──
     * Empieza apagada aunque haya permiso: el gestor entra a mirar, y editar es un gesto
     * explícito. Cada mutación sale como op (D._audit -> GOps.emit); nada se guarda aquí. */
    gstStartEditing() {
      const v = this._gstView;
      if (!v) return;
      if (!v.canEdit) return Toast.warn(t('editNotAllowed'));
      GOps.startEditing({ grantId: v.grantId, shareKey: v.shareKey });
      // El banner es el único sitio que dice la verdad sobre lo que pasa con los cambios
      // (pendientes, edición cortada por el servidor...), así que se repinta con cada aviso.
      GOps.onChange(() => this._gstShowBanner(v.email));
      this._gstShowBanner(v.email);
    },

    async gstStopEditing() {
      await GOps.flush().catch(() => {});
      if (GOps.pending() && !confirm(t('leaveWarn'))) return;
      GOps.stopEditing();
      this._gstShowBanner(this._gstView?.email || '');
    },

    // Desmonta el modo visor sin efectos de navegación. Idempotente y seguro de llamar
    // desde cualquier flujo de auth (logout/login/unlock) para no dejar el visor colgado.
    _gstForceExit() {
      const wasView = !!(typeof D !== 'undefined' && D._readOnly) || !!localStorage.getItem(VIEW_KEY);
      localStorage.removeItem(VIEW_KEY);
      if (typeof GOps !== 'undefined') GOps.stopEditing();   // tira la cola en memoria y corta la emisión
      this._gstView = null;
      if (typeof D !== 'undefined' && D._readOnly) D.exitView();
      const b = document.getElementById('gstBanner'); if (b) b.remove();
      document.body.style.paddingTop = '';
      return wasView;
    },

    async gstExitView() {
      // Intentar enviar lo pendiente antes de irse; la cola vive en memoria, así que
      // salir con ops sin enviar las pierde y hay que decirlo (no tragárselo).
      if (typeof GOps !== 'undefined' && GOps.pending()) {
        await GOps.flush().catch(() => {});
        if (GOps.pending() && !confirm(t('leaveWarn'))) return;
      }
      this._gstForceExit();
      Acc.setAutoSync(true);
      Toast.ok(t('backOk'));
      this.go('cfg');
    },

    _gstShowBanner(email) {
      let b = document.getElementById('gstBanner');
      if (!b) { b = document.createElement('div'); b.id = 'gstBanner'; document.body.appendChild(b); }
      const v = this._gstView || {};
      const editing = typeof GOps !== 'undefined' && GOps.emitting();
      const pend = typeof GOps !== 'undefined' ? GOps.pending() : 0;
      b.style.cssText = 'position:fixed;top:0;left:0;right:0;z-index:9999;background:' + (editing ? 'var(--ok,#4a4)' : 'var(--warn,#c90)') + ';color:#111;'
        + 'padding:.5rem .9rem;font-size:.82rem;display:flex;align-items:center;gap:.75rem;flex-wrap:wrap';
      let state;
      if (editing) state = `<span><strong>${t('editing')}</strong>${pend ? ' · ' + t('pendingOps')(pend) : ''}</span>`;
      else state = `<span>${t('viewingRO')}</span>`;
      const editBtn = !v.canEdit ? ''
        : editing
          ? `<button class="bt" style="font-size:.78rem;padding:.2rem .7rem" onclick="App.gstStopEditing()">${t('stopEdit')}</button>`
          : `<button class="bt" style="font-size:.78rem;padding:.2rem .7rem" onclick="App.gstStartEditing()">&#9998; ${t('edit')}</button>`;
      b.innerHTML = `<strong>${t('viewing')} ${esc2(email)}</strong> ${state}`
        + `<span style="margin-left:auto;display:flex;gap:.5rem">${editBtn}`
        + `<button class="bt" style="font-size:.78rem;padding:.2rem .7rem;background:#111;color:#fff;border-color:#111" onclick="App.gstExitView()">${t('back')}</button></span>`;
      document.body.style.paddingTop = (b.offsetHeight || 40) + 'px';
    },

    /** Aviso de la persona: su gestoría le ha cambiado cosas. Refresca la vista actual. */
    _gstOnOpsApplied(info) {
      Toast.ok(t('opsApplied')(info.applied, info.gestorEmail));
      try { this.go(this.cv); } catch (e) { /* la vista se refrescará sola al navegar */ }
    },
  });

  // Cerrar la pestaña con ops sin enviar las pierde (la cola es solo memoria, a propósito:
  // ver la cabecera de gestor-ops.js). Avisar es lo único honesto que se puede hacer.
  window.addEventListener('beforeunload', (e) => {
    if (typeof GOps !== 'undefined' && GOps.pending()) { e.preventDefault(); e.returnValue = ''; return ''; }
  });

  // ── Arranque: si la pestaña se cerró en modo visor, la marca VIEW_KEY quedó, pero los
  // datos del cliente NUNCA se persistieron (D.loadView no guarda), así que localStorage ya
  // tiene los datos propios del gestor. Basta limpiar la marca: se recupera solo, sin fugas.
  try { localStorage.removeItem(VIEW_KEY); } catch (e) { /* */ }
})();
