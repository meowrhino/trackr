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
      codePh: 'Código de tu gestoría (TRK-G-…)', link: 'Vincular', badCode: 'Código no válido', notFound: 'No se encontró esa gestoría',
      confirmTitle: 'Confirmar gestoría', confirmDesc: 'Vas a compartir tus datos con:', fingerprint: 'Huella de clave',
      scope: 'Qué compartir', scopeFiscal: 'Solo lo fiscal (facturas, gastos, clientes, proyectos sin horas ni notas)', scopeTodo: 'Todo (incluye horas y notas)',
      confirmBtn: 'Compartir', cancel: 'Cancelar', linked: 'Vinculado con', revoke: 'Revocar acceso', revokeConfirm: '¿Revocar el acceso de tu gestoría? Dejará de ver tus datos inmediatamente.', revoked: 'Acceso revocado', lastShared: 'última copia',
      gestTitle: 'Cartera de gestoría', gestDesc: 'Comparte tu código con tus clientes de TRACKR: ellos lo introducen en su Configuración para darte acceso cifrado a sus datos.',
      yourCode: 'Tu código', copy: 'Copiar', copied: 'Copiado', clients: 'Clientes vinculados', noClients: 'Ningún cliente vinculado todavía.', refresh: 'Refrescar', open: 'Ver datos', noBlob: 'sin datos aún', updated: 'actualizado',
      viewing: 'Viendo los datos de', viewingRO: '(solo lectura: los cambios NO se guardan ni se suben)', back: '← Volver a mis datos', backOk: 'De vuelta a tus datos', openErr: 'No se pudieron descifrar los datos',
      keyPublished: 'Clave de gestoría publicada', keyErr: 'No se pudo publicar la clave de gestoría',
    },
    en: {
      miTitle: 'My advisor', miDesc: 'Share your data with your advisor, encrypted end-to-end. Only your advisor can read it (not TRACKR, not the server). You can revoke access anytime.',
      codePh: 'Your advisor\'s code (TRK-G-…)', link: 'Link', badCode: 'Invalid code', notFound: 'Advisor not found',
      confirmTitle: 'Confirm advisor', confirmDesc: 'You are about to share your data with:', fingerprint: 'Key fingerprint',
      scope: 'What to share', scopeFiscal: 'Fiscal only (invoices, expenses, clients, projects without hours or notes)', scopeTodo: 'Everything (includes hours and notes)',
      confirmBtn: 'Share', cancel: 'Cancel', linked: 'Linked with', revoke: 'Revoke access', revokeConfirm: 'Revoke your advisor\'s access? They will stop seeing your data immediately.', revoked: 'Access revoked', lastShared: 'last copy',
      gestTitle: 'Advisor portfolio', gestDesc: 'Share your code with your TRACKR clients: they enter it in their Settings to give you encrypted access to their data.',
      yourCode: 'Your code', copy: 'Copy', copied: 'Copied', clients: 'Linked clients', noClients: 'No linked clients yet.', refresh: 'Refresh', open: 'View data', noBlob: 'no data yet', updated: 'updated',
      viewing: 'Viewing data of', viewingRO: '(read-only: changes are NOT saved or uploaded)', back: '← Back to my data', backOk: 'Back to your data', openErr: 'Could not decrypt the data',
      keyPublished: 'Advisor key published', keyErr: 'Could not publish advisor key',
    },
    ca: {
      miTitle: 'La meva gestoria', miDesc: 'Comparteix les teves dades amb la teva gestoria de forma xifrada. Només la teva gestoria pot llegir-les (ni TRACKR ni el servidor). Pots revocar l\'accés quan vulguis.',
      codePh: 'Codi de la teva gestoria (TRK-G-…)', link: 'Vincular', badCode: 'Codi no vàlid', notFound: 'No s\'ha trobat aquesta gestoria',
      confirmTitle: 'Confirmar gestoria', confirmDesc: 'Compartiràs les teves dades amb:', fingerprint: 'Empremta de clau',
      scope: 'Què compartir', scopeFiscal: 'Només el fiscal (factures, despeses, clients, projectes sense hores ni notes)', scopeTodo: 'Tot (inclou hores i notes)',
      confirmBtn: 'Compartir', cancel: 'Cancel·lar', linked: 'Vinculat amb', revoke: 'Revocar accés', revokeConfirm: 'Revocar l\'accés de la teva gestoria? Deixarà de veure les teves dades immediatament.', revoked: 'Accés revocat', lastShared: 'última còpia',
      gestTitle: 'Cartera de gestoria', gestDesc: 'Comparteix el teu codi amb els teus clients de TRACKR: ells l\'introdueixen a la seva Configuració per donar-te accés xifrat a les seves dades.',
      yourCode: 'El teu codi', copy: 'Copiar', copied: 'Copiat', clients: 'Clients vinculats', noClients: 'Cap client vinculat encara.', refresh: 'Refrescar', open: 'Veure dades', noBlob: 'sense dades encara', updated: 'actualitzat',
      viewing: 'Veient les dades de', viewingRO: '(només lectura: els canvis NO es desen ni es pugen)', back: '← Tornar a les meves dades', backOk: 'De tornada a les teves dades', openErr: 'No s\'han pogut desxifrar les dades',
      keyPublished: 'Clau de gestoria publicada', keyErr: 'No s\'ha pogut publicar la clau de gestoria',
    },
  };
  const t = (k) => (TXT[L()] || TXT.es)[k] || k;
  const esc2 = (s) => (typeof esc === 'function' ? esc(s) : String(s));
  const fpShort = (fp) => (fp || '').slice(0, 12);
  const VIEW_KEY = 'trackr_gestor_view';   // flag {clientEmail, grantId} — modo visor activo
  const OWN_KEY = 'trackr_gestor_own';     // copia JSON de los datos propios del gestor

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
          + `<div class="acc-row"><span class="acc-email">${t('linked')} <strong>${esc2(g.gestorEmail)}</strong></span></div>`
          + `<div style="color:var(--t3);font-size:.74rem;margin-top:.3rem">${t('fingerprint')}: <code class="mono">${esc2(fpShort(g.fingerprint))}</code> · ${esc2(g.scope)}</div>`
          + `</div>`
          + `<div class="cfg-save" style="margin-top:.75rem"><button class="bt" style="border-color:var(--bad);color:var(--bad)" onclick="App.gstRevoke()">${t('revoke')}</button></div>`;
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
      if (!/^TRK-G-[A-Z2-9]{10}$/.test(code)) return Toast.error(t('badCode'));
      const r = await Acc.gestorResolve(code);
      if (!r.ok) return Toast.error(r.error === 'not_found' ? t('notFound') : (r.error || 'error'));
      this._gstPending = { code, publicKey: r.publicKey, email: r.gestorEmail, fingerprint: r.fingerprint };
      this.om(`<div class="mt">${t('confirmTitle')}</div>`
        + `<p style="font-size:.86rem">${t('confirmDesc')}</p>`
        + `<div class="acc-card" style="margin:.6rem 0"><div class="acc-row"><span class="acc-email"><strong>${esc2(r.gestorEmail)}</strong></span></div>`
        + `<div style="color:var(--t3);font-size:.74rem;margin-top:.3rem">${t('fingerprint')}: <code class="mono">${esc2(fpShort(r.fingerprint))}</code></div></div>`
        + `<div class="fg" style="margin-top:.6rem"><label>${t('scope')}</label>`
        + `<label style="display:flex;align-items:flex-start;gap:.5rem;cursor:pointer;text-transform:none;letter-spacing:0;margin-top:.3rem"><input type="radio" name="gstScope" value="fiscal" checked style="width:auto;margin-top:.2rem"><span style="font-size:.82rem">${t('scopeFiscal')}</span></label>`
        + `<label style="display:flex;align-items:flex-start;gap:.5rem;cursor:pointer;text-transform:none;letter-spacing:0;margin-top:.35rem"><input type="radio" name="gstScope" value="todo" style="width:auto;margin-top:.2rem"><span style="font-size:.82rem">${t('scopeTodo')}</span></label>`
        + `</div>`
        + `<div class="ma"><button class="bt" onclick="App.cm()">${t('cancel')}</button><button class="bt bt-p" onclick="App.gstConfirmLink()">${t('confirmBtn')}</button></div>`);
    },

    async gstConfirmLink() {
      const p = this._gstPending;
      if (!p) return;
      const scope = document.querySelector('input[name="gstScope"]:checked')?.value === 'todo' ? 'todo' : 'fiscal';
      const r = await Acc.grantCreate(p.code, p.publicKey, p.email, scope);
      if (!r.ok) return Toast.error(r.error || 'error');
      this._gstPending = null;
      Toast.ok(`${t('linked')} ${p.email}`);
      this.cm(); this.rCfg();
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
      if (Acc.status().role !== 'gestor') return;
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
      el.innerHTML = `<div class="cl-list">` + r.clients.map(c => {
        const upd = c.blobUpdatedAt ? new Date(c.blobUpdatedAt * 1000).toLocaleDateString() : null;
        return `<div class="cl-item">`
          + `<span class="cl-name" style="font-size:.84rem">${esc2(c.personaEmail)}</span>`
          + `<span class="cl-nif" style="font-size:.72rem">${esc2(c.scope)}</span>`
          + `<span class="cl-nif" style="font-size:.72rem;color:var(--t3)">${upd ? `${t('updated')} ${upd}` : t('noBlob')}</span>`
          + (c.blobHash ? `<button class="bt" style="font-size:.72rem;padding:.2rem .6rem" onclick="App.gstOpenClient('${c.grantId}','${esc2(c.personaEmail)}')">${t('open')}</button>` : '')
          + `</div>`;
      }).join('') + `</div>`;
    },

    async gstOpenClient(grantId, email) {
      const r = await Acc.gestorOpenClient(grantId);
      if (!r.ok) return Toast.error(`${t('openErr')} (${r.error || '?'})`);
      // Snapshot de los datos PROPIOS + pausa total del sync antes de cargar al cliente.
      try { localStorage.setItem(OWN_KEY, JSON.stringify(D.d)); } catch (e) { return Toast.error('storage'); }
      localStorage.setItem(VIEW_KEY, JSON.stringify({ clientEmail: email, grantId }));
      Acc.setAutoSync(false);
      if (typeof H !== 'undefined' && H.snapshot) H.snapshot();
      D.load(r.data);
      this._gstShowBanner(email);
      this.go('info');
    },

    gstExitView() {
      const own = localStorage.getItem(OWN_KEY);
      localStorage.removeItem(VIEW_KEY);
      localStorage.removeItem(OWN_KEY);
      if (own) { try { D.load(JSON.parse(own)); } catch (e) { /* la copia H.snapshot sigue ahi */ } }
      const b = document.getElementById('gstBanner'); if (b) b.remove();
      document.body.style.paddingTop = '';
      Acc.setAutoSync(true);
      Toast.ok(t('backOk'));
      this.go('cfg');
    },

    _gstShowBanner(email) {
      let b = document.getElementById('gstBanner');
      if (!b) { b = document.createElement('div'); b.id = 'gstBanner'; document.body.appendChild(b); }
      b.style.cssText = 'position:fixed;top:0;left:0;right:0;z-index:9999;background:var(--warn,#c90);color:#111;'
        + 'padding:.5rem .9rem;font-size:.82rem;display:flex;align-items:center;gap:.75rem;flex-wrap:wrap';
      b.innerHTML = `<strong>${t('viewing')} ${esc2(email)}</strong> <span>${t('viewingRO')}</span>`
        + `<button class="bt" style="margin-left:auto;font-size:.78rem;padding:.2rem .7rem;background:#111;color:#fff;border-color:#111" onclick="App.gstExitView()">${t('back')}</button>`;
      document.body.style.paddingTop = (b.offsetHeight || 40) + 'px';
    },
  });

  // ── Arranque: si la pestaña se cerró en modo visor, re-mostrar el banner (los datos
  // del cliente siguen en localStorage; los propios están a salvo en OWN_KEY y en la nube).
  try {
    const v = JSON.parse(localStorage.getItem(VIEW_KEY) || 'null');
    if (v && v.clientEmail) {
      if (typeof Acc !== 'undefined') Acc.setAutoSync(false);
      setTimeout(() => { try { App._gstShowBanner(v.clientEmail); } catch (e) { /* */ } }, 200);
    }
  } catch (e) { /* */ }
})();
