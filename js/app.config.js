/* ================================================
 * TRACKR — App: Vista Configuración + Clientes
 * Globales: extiende App
 * Dependencias: app.js (App base), utils.js, store.js,
 *               themes.js, colors.js, lang.js
 * ================================================ */

Object.assign(App, {

  rCfg() {
    const s = D.d.settings, em = s.emisor, tg = s.targets, cls = D.cls(), fis = s.fiscal || {};

    document.getElementById('cfgC').innerHTML =
      this._cfgAccountSection()
      + (typeof PWA !== 'undefined' ? PWA.cfgSection() : '')
      + `<div class="cfg-section"><div class="cfg-section-title">${t('lang.label')}</div>`
      + `<div class="lang-toggle">${['es', 'en', 'ca'].map(code =>
          `<button class="lang-btn${_lang === code ? ' on' : ''}" onclick="App.setLanguage('${code}')">${t('lang.' + code)}</button>`
        ).join('')}</div></div>`
      + `<div class="cfg-section"><div class="cfg-section-title">${t('cfg.issuerTitle')}</div><div class="cfg-grid">`
      + `<div class="cfg-full fg"><label>${t('cfg.nameCompany')}</label><input type="text" id="cfgEN" value="${esc(em.nombre)}" placeholder="${t('ph.nameOrCompany')}"></div>`
      + `<div class="fg"><label>${t('cfg.address1')}</label><input type="text" id="cfgED1" value="${esc(em.direccion1)}" placeholder="${t('ph.street')}"></div>`
      + `<div class="fg"><label>${t('cfg.address2')}</label><input type="text" id="cfgED2" value="${esc(em.direccion2)}" placeholder="${t('ph.cityZip')}"></div>`
      + `<div class="fg"><label>${t('cfg.nif')}</label><input type="text" id="cfgENif" value="${esc(em.nif)}" placeholder="${t('ph.nif')}"></div>`
      + `</div><div class="cfg-save"><button class="bt bt-p" onclick="App.saveEmisor()">${t('btn.save')}</button></div></div>`
      + `<div class="cfg-section"><div class="cfg-section-title">${t('cfg.defaults')}</div><div class="cfg-grid">`
      + `<div class="fg"><label>${t('cfg.ivaPercent')}</label><input type="number" id="cfgIva" value="${s.defaultIva}" min="0" max="100" step="1"></div>`
      + `<div class="fg"><label>${t('cfg.irpfPercent')}</label><input type="number" id="cfgIrpf" value="${s.defaultIrpf}" min="0" max="100" step="1"></div>`
      + `<div class="cfg-full fg"><label>${t('cfg.beneficiary')}</label><input type="text" id="cfgBenef" placeholder="${t('ph.beneficiary')}" value="${esc(em.beneficiarioPago || '')}"></div>`
      + `<div class="cfg-full fg"><label>${t('cfg.bankAccount')}</label><input type="text" id="cfgPago" placeholder="${t('ph.bankAccount')}" value="${esc(em.instruccionesPago || '')}"></div>`
      + `<div class="cfg-full fg"><label>${t('cfg.defaultSubject')}</label><input type="text" id="cfgConcepto" value="${esc(s.conceptoDefault || '')}" placeholder="${t('ph.defaultSubject')}"><label style="font-size:.82rem;display:flex;align-items:center;gap:.4rem;cursor:pointer;margin-top:.45rem;text-transform:none;letter-spacing:0;color:var(--t2);white-space:nowrap"><input type="checkbox" id="cfgConceptoCl" style="margin:0;width:14px;height:14px;accent-color:var(--ac)" ${s.conceptoAppendCliente ? 'checked' : ''}>${t('cfg.appendClientName')}</label></div>`
      + `</div><div class="cfg-save"><button class="bt bt-p" onclick="App.saveDefaults()">${t('btn.save')}</button></div></div>`
      + `<div class="cfg-section"><div class="cfg-section-title">${t('cfg.fiscalTitle')}</div><div class="cfg-grid">`
      + `<div class="fg"><label>${t('cfg.rendAnterior')}</label><input type="number" id="cfgFRend" value="${fis.rendAnterior ?? ''}" min="0" step="100" placeholder="—"><div style="font-size:.72rem;color:var(--t3);margin-top:.35rem">${t('cfg.rendAnteriorHelp')}</div></div>`
      + `<div class="fg"><label>${t('cfg.saldoIva')}</label><input type="number" id="cfgFSaldo" value="${fis.saldoIvaInicial || ''}" min="0" step="0.01" placeholder="0"><div style="font-size:.72rem;color:var(--t3);margin-top:.35rem">${t('cfg.saldoIvaHelp')}</div></div>`
      + `<div class="cfg-full fg"><label style="font-size:.82rem;display:flex;align-items:center;gap:.4rem;cursor:pointer;text-transform:none;letter-spacing:0;color:var(--t2)"><input type="checkbox" id="cfgFEds" style="margin:0;width:14px;height:14px;accent-color:var(--ac)" ${fis.eds !== false ? 'checked' : ''}>${t('cfg.eds')}</label></div>`
      + `<div class="fg"><label>${t('cfg.actTipo')}</label><select id="cfgFActT">${[['A', t('cfg.actTipoA')], ['B', t('cfg.actTipoB')]].map(([k, v]) => `<option value="${k}" ${(fis.actTipo || 'A') === k ? 'selected' : ''}>${v}</option>`).join('')}</select></div>`
      + `<div class="fg"><label>${t('cfg.actCodigo')}</label><select id="cfgFActC">${[['05', t('cfg.act05')], ['04', t('cfg.act04')], ['03', t('cfg.act03')], ['01', t('cfg.act01')]].map(([k, v]) => `<option value="${k}" ${(fis.actCodigo || '05') === k ? 'selected' : ''}>${k} — ${v}</option>`).join('')}</select></div>`
      + `<div class="cfg-full fg"><label>${t('cfg.actIAE')}</label><input type="text" id="cfgFActE" value="${esc(fis.actIAE || '')}" placeholder="763"><div style="font-size:.72rem;color:var(--t3);margin-top:.35rem">${t('cfg.actHelp')}</div></div>`
      + `</div><div class="cfg-save"><button class="bt bt-p" onclick="App.saveFiscal()">${t('btn.save')}</button></div></div>`
      + `<div class="cfg-section"><div class="cfg-section-title">${t('cfg.goals')}</div><div class="cfg-grid">`
      + `<div class="fg"><label>${t('cfg.hoursMonth')}</label><input type="number" id="cfgTHm" value="${tg.horasMes || ''}" min="0" step="1" placeholder="${t('ph.hoursMonth')}"></div>`
      + `<div class="fg"><label>${t('cfg.incomeMonth')}</label><input type="number" id="cfgTIm" value="${tg.ingresosMes || ''}" min="0" step="100" placeholder="${t('ph.incomeMonth')}"></div>`
      + `<div class="fg"><label>${t('cfg.hoursWeek')}</label><input type="number" id="cfgTHs" value="${tg.horasSemana || ''}" min="0" step="1" placeholder="${t('ph.hoursWeek')}"></div>`
      + `</div><div class="cfg-save"><button class="bt bt-p" onclick="App.saveGoals()">${t('btn.save')}</button></div></div>`
      + `<div class="cfg-section"><div class="cfg-section-title">${t('cfg.calendar')}</div><div class="cfg-grid">`
      + `<div class="fg"><label>${t('cfg.calStartHour')}</label><select id="cfgCalStart">`
      +   [0, 6, 8, 22].map(h => `<option value="${h}" ${(s.calStartHour || 0) === h ? 'selected' : ''}>${String(h).padStart(2, '0')}:00</option>`).join('')
      + `</select><div style="font-size:.72rem;color:var(--t3);margin-top:.35rem">${t('cfg.calStartHourHelp')}</div></div>`
      + `</div><div class="cfg-save"><button class="bt bt-p" onclick="App.saveCalSettings()">${t('btn.save')}</button></div></div>`
      + `<div class="cfg-section"><div class="cfg-section-title">${t('cfg.theme')}</div>`
      + `<div class="theme-grid">${THEME_ORDER.map(id => {
          const th = THEMES[id];
          return `<button class="theme-btn${s.tema === id ? ' on' : ''}" onclick="App.setTheme('${id}')">`
            + `<div class="theme-preview" style="background:${th.vars.bg};border-color:${th.vars.b2}">`
            + `<div style="background:${th.vars.bg2};border:1px solid ${th.vars.b1};border-radius:2px;padding:3px 5px;margin-bottom:2px"><span style="color:${th.vars.t1};font-size:8px">Aa</span></div>`
            + `<div style="display:flex;gap:2px"><span style="width:8px;height:4px;border-radius:1px;background:${th.vars.ok}"></span><span style="width:8px;height:4px;border-radius:1px;background:${th.vars.warn}"></span><span style="width:8px;height:4px;border-radius:1px;background:${th.vars.bad}"></span></div>`
            + `<div style="width:100%;height:3px;border-radius:1px;background:${th.vars.ac || th.vars.ok};margin-top:3px"></div>`
            + `</div><span class="theme-name">${t('theme.' + id)}</span></button>`;
        }).join('')}</div></div>`
      + `<div class="cfg-section" style="margin-top:2.5rem"><div class="cfg-section-title">${t('cfg.clients')}</div>`
      + (cls.length
        ? `<div class="cl-list">${cls.map(c => `<div class="cl-item"><span class="cl-dot" style="background:${colorHex(c.color || 'CornflowerBlue')}"></span><span class="cl-name">${esc(c.nombre)}</span>${c.nif ? `<span class="cl-nif">${esc(c.nif)}</span>` : ''}<div class="cl-actions"><button class="cl-btn" onclick="App.clModal('${c.id}')" title="${t('btn.edit')}">&#9998;</button><button class="cl-btn cl-btn-del" onclick="App.delCl('${c.id}')" title="${t('btn.delete')}">&times;</button></div></div>`).join('')}</div>`
        : `<div style="color:var(--t3);font-size:.82rem">${t('cfg.noClients')}</div>`)
      + `<button class="bt bt-add" style="margin-top:.75rem" onclick="App.clModal()">${t('btn.newClient')}</button></div>`
      + `<div class="cfg-section" style="margin-top:2.5rem"><div class="cfg-section-title">${t('cfg.importOldInvoices')}</div>`
      + `<div style="color:var(--t3);font-size:.82rem;margin-bottom:.75rem">${t('cfg.importOldDesc')}</div>`
      + `<button class="bt bt-add" onclick="App.importOldInvoicesClick()">${t('cfg.importOldInvoices')}</button></div>`
      + this._cfgVerifactuSection()
      + (this._cfgGestoresSection ? this._cfgGestoresSection() : '')
      + this._cfgAuditSection()
      + this._cfgHistorySection();
  },

  /** Sección Historial de cambios: quién tocó qué y cuándo (TODO/21, Etapa A).
   *  Textos i18n inline (es/en/ca), como _cfgHistorySection. */
  _cfgAuditSection() {
    const lang = (typeof _lang !== 'undefined' ? _lang : 'es');
    const TX = ({
      es: {
        title: 'Historial de cambios', desc: 'Quién ha cambiado qué y cuándo. Se guardan los últimos 500 cambios junto a tus datos, cifrados como el resto.',
        none: 'Todavía no hay cambios registrados.', local: 'este dispositivo', showing: 'Mostrando los últimos {0} de {1} cambios.',
        undo: 'Deshacer', undone: 'deshecho',
        crear: 'creó', editar: 'editó', borrar: 'borró',
        proyecto: 'proyecto', cliente: 'cliente', gasto: 'gasto', deducible: 'deducible', factura: 'factura', settings: 'la configuración',
        persona: 'persona', gestor: 'gestoría'
      },
      en: {
        title: 'Change history', desc: 'Who changed what, and when. The last 500 changes are stored alongside your data, encrypted like everything else.',
        none: 'No changes recorded yet.', local: 'this device', showing: 'Showing the last {0} of {1} changes.',
        undo: 'Undo', undone: 'undone',
        crear: 'created', editar: 'edited', borrar: 'deleted',
        proyecto: 'project', cliente: 'client', gasto: 'expense', deducible: 'deductible', factura: 'invoice', settings: 'the settings',
        persona: 'person', gestor: 'advisor'
      },
      ca: {
        title: 'Historial de canvis', desc: 'Qui ha canviat què i quan. Es desen els últims 500 canvis al costat de les teves dades, xifrats com la resta.',
        none: 'Encara no hi ha canvis registrats.', local: 'aquest dispositiu', showing: 'Mostrant els últims {0} de {1} canvis.',
        undo: 'Desfer', undone: 'desfet',
        crear: 'va crear', editar: 'va editar', borrar: 'va esborrar',
        proyecto: 'projecte', cliente: 'client', gasto: 'despesa', deducible: 'deduïble', factura: 'factura', settings: 'la configuració',
        persona: 'persona', gestor: 'gestoria'
      }
    })[lang] || {};
    const tx = k => TX[k] || k;
    const fmtTs = ts => {
      try { return new Date(ts).toLocaleString(currentLocale(), { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }); }
      catch { return String(ts); }
    };
    const actorTxt = a => {
      if (!a || a === 'local') return tx('local');
      const role = a.role ? ` · ${tx(a.role)}` : '';
      return `${a.email || tx('local')}${role}`;
    };
    /* El nombre solo se resuelve si la entidad sigue viva: en un borrado ya no existe
       (y el id no le dice nada a nadie), así que ahí se muestra solo el tipo. */
    const nameOf = (entidad, id) => {
      if (!id) return '';
      const o = entidad === 'proyecto' ? D.p(id)
        : entidad === 'cliente' ? D.cl(id)
        : entidad === 'gasto' ? D.g(id)
        : entidad === 'deducible' ? D.ded(id)
        : entidad === 'factura' ? (D.fs() || []).find(f => f.id === id)
        : null;
      if (!o) return '';
      return o.nombre || o.numero || o.concepto || '';
    };

    const N = 30;
    const audit = D.d.audit || [];
    const total = audit.length;
    const log = D.auditLog(N);
    let listHtml;
    if (log.length) {
      listHtml = `<div class="cl-list" style="margin-top:.75rem">` + log.map((e, i) => {
        const idx = total - 1 - i;   // índice real en D.d.audit (auditLog va del más nuevo al más viejo)
        const nombre = nameOf(e.entidad, e.entidadId);
        const accion = `${tx(e.accion)} ${tx(e.entidad)}${nombre ? ` <strong>${esc(nombre)}</strong>` : ''}`;
        /* Deshacer solo donde hay inverso guardado: hoy, los cambios que vinieron de la
           gestoría (los propios ya tienen las copias de seguridad y el propio hacer). */
        const undoBtn = e.undo ? `<button class="cl-btn" onclick="App.auditUndo(${idx},${e.ts})" title="${tx('undo')}">&#8630;</button>` : '';
        return `<div class="cl-item"${e.undone ? ' style="opacity:.55"' : ''}>`
          + `<span class="cl-name" style="font-size:.82rem">${esc(actorTxt(e.actor))} ${accion}${e.undone ? ` <em style="color:var(--t3);font-style:normal">· ${tx('undone')}</em>` : ''}</span>`
          + `<span class="cl-nif" style="font-size:.72rem;color:var(--t3)">${fmtTs(e.ts)}</span>`
          + (undoBtn ? `<div class="cl-actions">${undoBtn}</div>` : '')
          + `</div>`;
      }).join('') + `</div>`;
      if (total > N) {
        listHtml += `<p class="small" style="margin-top:.5rem;color:var(--t3)">${tx('showing').replace('{0}', N).replace('{1}', total)}</p>`;
      }
    } else {
      listHtml = `<div style="color:var(--t3);font-size:.82rem;margin-top:.5rem">${tx('none')}</div>`;
    }
    return `<div class="cfg-section" style="margin-top:2.5rem"><div class="cfg-section-title">${tx('title')}</div>`
      + `<div style="color:var(--t3);font-size:.82rem">${tx('desc')}</div>`
      + listHtml
      + `</div>`;
  },

  /** Sección Historial: copias locales (saves) — crear / restaurar / descargar.
   *  Textos i18n inline (es/en/ca) — migrar a lang.js cuando se valide la UX. */
  _cfgHistorySection() {
    const TX = ({
      es: { title: 'Copias de seguridad', desc: 'TRACKR guarda hasta 10 copias locales de tus datos (una al día, más las que crees tú). Son tu red de seguridad: descárgalas o restáuralas cuando quieras. Nada de esto sale de tu navegador.', saveNow: 'Guardar copia ahora', none: 'Aún no hay copias. Se creará una automáticamente al usar la app.', current: 'ACTUAL', auto: 'auto', load: 'Cargar', download: 'Descargar' },
      en: { title: 'Backups', desc: 'TRACKR keeps up to 10 local copies of your data (one a day, plus the ones you make). They are your safety net: download or restore them anytime. None of this leaves your browser.', saveNow: 'Save a copy now', none: 'No copies yet. One will be created automatically as you use the app.', current: 'CURRENT', auto: 'auto', load: 'Load', download: 'Download' },
      ca: { title: 'Còpies de seguretat', desc: 'TRACKR desa fins a 10 còpies locals de les teves dades (una al dia, més les que creïs tu). Són la teva xarxa de seguretat: descarrega-les o restaura-les quan vulguis. Res d\'això surt del teu navegador.', saveNow: 'Desar còpia ara', none: 'Encara no hi ha còpies. Se\'n crearà una automàticament en fer servir l\'app.', current: 'ACTUAL', auto: 'auto', load: 'Carregar', download: 'Descarregar' }
    })[typeof _lang !== 'undefined' ? _lang : 'es'] || {};
    const tx = k => TX[k] || k;
    const fmtTs = iso => {
      if (!iso) return '—';
      try { return new Date(iso).toLocaleString(currentLocale(), { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }); }
      catch { return iso.slice(0, 16).replace('T', ' '); }
    };
    const saves = (typeof H !== 'undefined') ? H.list() : [];
    let listHtml;
    if (saves.length) {
      listHtml = `<div class="cl-list" style="margin-top:.75rem">` + saves.map((s, i) =>
        `<div class="cl-item">`
        + `<span class="cl-name" style="font-size:.82rem">${i === 0 ? `<strong style="color:var(--ok)">${tx('current')}</strong> · ` : ''}${fmtTs(s.ts)}</span>`
        + `<span class="cl-nif" style="font-size:.72rem;color:var(--t3)">${s.auto ? tx('auto') + ' · ' : ''}${s.sizeKB} KB</span>`
        + `<div class="cl-actions">`
        +   `<button class="cl-btn" onclick="App.histDownload('${s.id}')" title="${tx('download')}">&#8595;</button>`
        +   `<button class="cl-btn" onclick="App.histRestore('${s.id}')" title="${tx('load')}">&#8635;</button>`
        + `</div>`
        + `</div>`
      ).join('') + `</div>`;
    } else {
      listHtml = `<div style="color:var(--t3);font-size:.82rem;margin-top:.5rem">${tx('none')}</div>`;
    }
    return `<div class="cfg-section" style="margin-top:2.5rem"><div class="cfg-section-title">${tx('title')}</div>`
      + `<div style="color:var(--t3);font-size:.82rem;margin-bottom:.75rem">${tx('desc')}</div>`
      + `<button class="bt bt-add" onclick="App.histSnapshot()">${tx('saveNow')}</button>`
      + listHtml
      + `</div>`;
  },

  /** Deshace un cambio del historial aplicando su inverso (hoy: ops de la gestoría).
   *  El idx se horneó en el onclick al renderizar y el anillo puede haberse desplazado
   *  desde entonces (splice del frente al llegar a AUDIT_MAX): el ts desambigua. */
  auditUndo(idx, ts) {
    const a = D.d.audit || [];
    let e = a[idx];
    if (ts != null && (!e || e.ts !== ts)) e = a.find(x => x.ts === ts && x.undo);
    if (!e || !e.undo || typeof GOps === 'undefined') { this.rCfg(); return; }
    const r = GOps.undo(e);
    if (!r.ok) { Toast.error(_lang === 'en' ? 'Could not undo' : (_lang === 'ca' ? 'No s\'ha pogut desfer' : 'No se pudo deshacer')); return; }
    Toast.ok(_lang === 'en' ? 'Change undone' : (_lang === 'ca' ? 'Canvi desfet' : 'Cambio deshecho'));
    this.rCfg();
  },

  histSnapshot() {
    if (typeof H === 'undefined') return;
    const id = H.snapshot();
    if (id) {
      Toast.ok(_lang === 'en' ? 'Copy saved' : (_lang === 'ca' ? 'Còpia desada' : 'Copia guardada'));
      this.rCfg();
    } else {
      Toast.error(_lang === 'en' ? 'Could not save the copy (storage full?)' : (_lang === 'ca' ? 'No s\'ha pogut desar la còpia' : 'No se pudo guardar la copia (¿almacenamiento lleno?)'));
    }
  },

  histDownload(id) {
    if (typeof H !== 'undefined') H.download(id);
  },

  histRestore(id) {
    const msg = _lang === 'en'
      ? 'This will overwrite your current data with this copy. We recommend downloading a copy of the current state first. Continue?'
      : (_lang === 'ca'
        ? 'Això sobreescriurà les teves dades actuals amb aquesta còpia. Et recomanem descarregar abans una còpia de l\'estat actual. Continuar?'
        : 'Esto sobreescribirá tus datos actuales con esta copia. Te recomendamos descargar antes una copia del estado actual. ¿Continuar?');
    if (!confirm(msg)) return;
    if (typeof H === 'undefined') return;
    H.snapshot(); // red de seguridad: guarda el estado ACTUAL antes de sobreescribirlo (se puede deshacer)
    if (H.restore(id)) {
      this._applyPrefs();
      Toast.ok(_lang === 'en' ? 'Copy restored' : (_lang === 'ca' ? 'Còpia restaurada' : 'Copia restaurada'));
      this.go(this.cv);
    }
  },

  /** Sección Verifactu: identidad SIF + lista de facturas firmadas + verificar cadena */
  _cfgVerifactuSection() {
    /* Si verifactu.js no se ha cargado (p.ej. deploy parcial), omitir la sección
       en vez de romper toda la vista de Configuración. */
    if (typeof V === 'undefined') return '';
    const v = D.d.settings.verifactu || {};
    const facts = D.fs() || [];
    const emisor = D.d.settings.emisor?.nif || '';
    const lastH = v.lastInvoiceHash ? v.lastInvoiceHash.slice(0, 24) + '…' : '—';
    let listHtml = '';
    if (facts.length) {
      const sorted = [...facts].sort((a, b) => (b.timestamp || '').localeCompare(a.timestamp || ''));
      listHtml = `<div class="cl-list" style="margin-top:.5rem">`
        + sorted.slice(0, 50).map(f => {
          const hashShort = (f.hash || '').slice(0, 14) + '…';
          const fechaShort = (f.fecha || '').slice(0, 10);
          const esAnul = f.tipoRegistro === 'anulacion';
          const anulada = !esAnul && (f.eventos || []).some(e => e.tipo === 'anulada');
          let estado = '';
          if (esAnul) estado = `<span class="cl-nif" style="font-size:.68rem;color:var(--t3)">${t('cfg.vfTipoAnulacion')}</span>`;
          else if (anulada) estado = `<span class="cl-nif" style="font-size:.68rem;color:var(--red,#e5476d)">${t('cfg.vfAnulada')}</span>`;
          else estado = `<button class="bt" style="font-size:.68rem;padding:.15rem .5rem" onclick="App.anularFactura('${f.id}')">${t('cfg.vfAnular')}</button>`;
          return `<div class="cl-item">`
            + `<span class="cl-name" style="font-family:'DM Mono',monospace;font-size:.78rem${esAnul || anulada ? ';text-decoration:line-through;opacity:.6' : ''}">${esc(f.numero)}</span>`
            + `<span class="cl-nif" style="font-size:.72rem">${fechaShort}</span>`
            + `<span class="cl-nif" style="font-size:.72rem">${esAnul ? '—' : fmtMoney(f.totalFactura || 0)}</span>`
            + `<span class="cl-nif" style="font-family:'DM Mono',monospace;font-size:.7rem;color:var(--t3)">${hashShort}</span>`
            + estado
            + `</div>`;
        }).join('')
        + `</div>`;
      if (facts.length > 50) {
        listHtml += `<p class="small" style="margin-top:.5rem;color:var(--t3)">${t('cfg.vfShowingFirst', 50, facts.length)}</p>`;
      }
    } else {
      listHtml = `<div style="color:var(--t3);font-size:.82rem">${t('cfg.vfNoneYet')}</div>`;
    }
    return `<div class="cfg-section" style="margin-top:2.5rem"><div class="cfg-section-title">${t('cfg.vfTitle')}</div>`
      + `<p style="color:var(--t3);font-size:.82rem;margin-bottom:.75rem">${t('cfg.vfDesc')}</p>`
      + `<div style="background:var(--bg2);border:1px solid var(--b1);border-radius:var(--r);padding:.7rem 1rem;margin-bottom:.75rem;font-size:.82rem">`
      +   `<div><strong>${t('cfg.vfSifId')}:</strong> <code class="mono">${esc(V.SIF_ID)}</code> &middot; <strong>${t('cfg.vfVersion')}:</strong> <code class="mono">${esc(V.SOFTWARE_VERSION)}</code></div>`
      +   `<div style="color:var(--t3);font-size:.72rem;margin-top:.25rem">${t('cfg.vfFixedNote')}</div>`
      + `</div>`
      + `<div class="cfg-grid">`
      + `<div class="fg"><label>${t('cfg.vfEnv')}</label><select id="cfgVfEnv"><option value="prod" ${v.env !== 'test' ? 'selected' : ''}>${t('cfg.vfEnvProd')}</option><option value="test" ${v.env === 'test' ? 'selected' : ''}>${t('cfg.vfEnvTest')}</option></select></div>`
      + `<div class="fg"><label style="display:flex;align-items:center;gap:.5rem;cursor:pointer"><input type="checkbox" id="cfgVfEnabled" ${v.habilitado === true ? 'checked' : ''}> ${t('cfg.vfEnabled')}</label></div>`
      + `</div>`
      + `<p class="small" style="color:var(--t3);margin-top:.5rem">${t('cfg.vfLastHash')}: <code class="mono" style="font-size:.72rem">${esc(lastH)}</code> · ${t('cfg.vfTotalSigned', facts.length)} · ${t('cfg.vfEmisor')}: ${esc(emisor || t('cfg.vfNoEmisor'))}</p>`
      + this._vfRemisionLine(facts, v)
      + `<div class="cfg-save" style="gap:.5rem;display:flex"><button class="bt bt-p" onclick="App.saveVerifactu()">${t('btn.save')}</button>`
      + `<button class="bt" onclick="App.verifyChain()">&#128274; ${t('cfg.vfVerifyChain')}</button>`
      + `<button class="bt" onclick="App.vfSelfTest()">${t('cfg.vfSelfTest')}</button></div>`
      + `<div style="margin-top:1.25rem"><div class="cfg-section-title" style="font-size:.85rem;margin-bottom:.5rem">${t('cfg.vfRegistry')}</div>`
      + listHtml
      + `</div>`
      + `</div>`;
  },

  /* Estado de la remisión (Fase 3): cuántos registros esperan en la cola del servidor
     y cuántos ni siquiera se han encolado. Solo con VeriFactu activado. */
  _vfRemisionLine(facts, v) {
    if (v.habilitado !== true || !facts.length) return '';
    const enCola = facts.filter(f => f.remitida).length;
    const pend = facts.length - enCola;
    const hasSession = typeof Acc !== 'undefined' && Acc.status().state === 'in' && Acc.status().active;
    let inner = `${t('cfg.vfRemisionState', enCola, pend)}`;
    if (pend > 0) {
      inner += hasSession
        ? ` <button class="bt" style="font-size:.68rem;padding:.15rem .5rem" onclick="App.vfPushNow()">${t('cfg.vfPushNow')}</button>`
        : ` · ${t('cfg.vfNeedsAccount')}`;
    }
    return `<p class="small" style="color:var(--t3);margin-top:.35rem">${t('cfg.vfRemision')}: ${inner}<br><span style="font-size:.7rem">${t('cfg.vfRemisionNote')}</span></p>`;
  },

  async vfPushNow() {
    await Acc.pushVerifactu();
    this.rCfg();
    Toast.ok(t('cfg.vfPushed'));
  },

  saveVerifactu() {
    const v = D.d.settings.verifactu || {};
    /* sifId y softwareVersion son constantes en js/verifactu.js, no aquí */
    v.env = document.getElementById('cfgVfEnv').value === 'test' ? 'test' : 'prod';
    v.habilitado = document.getElementById('cfgVfEnabled').checked;
    v.userSet = true; /* elección explícita: la migración de defaults ya no la pisa */
    D.d.settings.verifactu = v;
    D._audit('editar', 'settings', null);
    D.save();
    Toast.ok(t('cfg.saved'));
  },

  async verifyChain() {
    const emisor = D.d.settings.emisor?.nif;
    if (!emisor) { Toast.warn(t('cfg.vfNoEmisor')); return; }
    const facts = D.fsBy(emisor);
    if (!facts.length) { Toast.ok(t('cfg.vfNothingToVerify')); return; }
    const res = await V.verifyChain(facts);
    if (res.ok) {
      Toast.ok(t('cfg.vfChainOk', res.total));
    } else {
      Toast.error(t('cfg.vfChainBroken', res.broken.length, res.total));
      console.warn('Verifactu cadena rota:', res.broken);
    }
  },

  /** Anula una factura: registro de anulacion encadenado + evento en la original. */
  async anularFactura(id) {
    const f = (D.fs() || []).find(x => x.id === id);
    if (!f || typeof V === 'undefined') return;
    if (!confirm(t('cfg.vfAnularConfirm', f.numero))) return;
    const hashPrev = D.lastHashFor(f.emisorNif);
    const fechaHoraHuso = V.nowHuso();
    try {
      const hash = await V.huellaAnulacion({
        emisorNif: f.emisorNif,
        numSerie: f.numero,
        fecha: f.fecha,
        huellaPrev: hashPrev || '',
        fechaHoraHuso
      });
      D.addFact({
        id: uid(),
        tipoRegistro: 'anulacion',
        numero: f.numero,
        fecha: f.fecha,
        emisorNif: f.emisorNif,
        refFactura: f.id,
        hash,
        hashPrev: hashPrev || null,
        timestamp: fechaHoraHuso,
        seq: Date.now(),
        eventos: []
      });
      D.addFactEvent(f.id, { tipo: 'anulada', fecha: fechaHoraHuso });
      Toast.ok(t('cfg.vfAnulacionOk', f.numero));
      this.rCfg();
    } catch (err) {
      console.warn('Verifactu anulacion failed:', err);
      Toast.error(t('cfg.vfChainBroken', 1, 1));
    }
  },

  /** Valida el algoritmo de huella contra los vectores oficiales AEAT (doc v0.1.2 §6). */
  async vfSelfTest() {
    if (typeof V === 'undefined') return;
    const r = await V.selfTest();
    if (r.ok) Toast.ok(t('cfg.vfSelfTestOk', r.casos));
    else { Toast.error(t('cfg.vfSelfTestBad')); console.warn('Verifactu self-test:', r); }
  },

  setLanguage(code) {
    T.ev('action', 'lang_change', code);
    setLang(code);
    if (typeof PWA !== 'undefined') PWA.renderBanner(); // el banner vive fuera de cfgC
    D.d.settings.idioma = code;
    D.save();
    this.rCfg();
  },

  setTheme(id) {
    if (!THEMES[id]) return;
    applyTheme(id);
    D.d.settings.tema = id;
    D.save();
    this.rCfg();
  },

  saveEmisor() {
    const em = D.d.settings.emisor;
    em.nombre = document.getElementById('cfgEN').value.trim();
    em.direccion1 = document.getElementById('cfgED1').value.trim();
    em.direccion2 = document.getElementById('cfgED2').value.trim();
    em.nif = document.getElementById('cfgENif').value.trim();
    D._audit('editar', 'settings', null);
    D.save();
    Toast.ok(t('cfg.saved'));
  },

  saveDefaults() {
    const s = D.d.settings;
    s.emisor.beneficiarioPago = document.getElementById('cfgBenef').value.trim();
    s.emisor.instruccionesPago = document.getElementById('cfgPago').value.trim();
    s.conceptoDefault = document.getElementById('cfgConcepto').value.trim();
    s.conceptoAppendCliente = document.getElementById('cfgConceptoCl').checked;

    const oldIva = s.defaultIva;
    const oldIrpf = s.defaultIrpf;
    const newIva = parseInt(document.getElementById('cfgIva').value) || 0;
    const newIrpf = parseInt(document.getElementById('cfgIrpf').value) || 0;
    s.defaultIva = newIva;
    s.defaultIrpf = newIrpf;

    if (oldIva !== newIva || oldIrpf !== newIrpf) {
      D.d.projects.forEach(p => {
        const f = p.facturacion;
        if (!f || f.modo === 'gratis') return;
        if (f.iva === oldIva) f.iva = newIva;
        if (f.irpf === oldIrpf) f.irpf = newIrpf;
        B.calc(p);
      });
    }
    D._audit('editar', 'settings', null);
    D.save();
    Toast.ok(t('cfg.saved'));
  },

  saveFiscal() {
    const s = D.d.settings;
    if (!s.fiscal) s.fiscal = {};
    const rend = document.getElementById('cfgFRend').value;
    s.fiscal.rendAnterior = rend === '' ? null : (parseFloat(rend) || 0);
    s.fiscal.saldoIvaInicial = parseFloat(document.getElementById('cfgFSaldo').value) || 0;
    s.fiscal.eds = document.getElementById('cfgFEds').checked;
    s.fiscal.actTipo = document.getElementById('cfgFActT').value;
    s.fiscal.actCodigo = document.getElementById('cfgFActC').value;
    s.fiscal.actIAE = document.getElementById('cfgFActE').value.trim();
    /* Payload SOLO aquí: fiscal es lo único de settings que el gestor puede editar
       (GOps.WRITABLE), y sin el payload la op no puede construirse (hallazgo #1 de la
       revisión: la capacidad anunciada era inalcanzable). Los demás save* de settings
       no lo pasan a propósito — el gestor no puede tocarlos. */
    D._audit('editar', 'settings', null, { fiscal: { eds: s.fiscal.eds, rendAnterior: s.fiscal.rendAnterior, saldoIvaInicial: s.fiscal.saldoIvaInicial } });
    D.save();
    Toast.ok(t('cfg.saved'));
  },

  saveGoals() {
    const tg = D.d.settings.targets;
    tg.horasMes = parseFloat(document.getElementById('cfgTHm').value) || null;
    tg.ingresosMes = parseFloat(document.getElementById('cfgTIm').value) || null;
    tg.horasSemana = parseFloat(document.getElementById('cfgTHs').value) || null;
    D._audit('editar', 'settings', null);
    D.save();
    Toast.ok(t('cfg.saved'));
  },

  saveCalSettings() {
    const v = parseInt(document.getElementById('cfgCalStart').value, 10);
    D.d.settings.calStartHour = (v >= 0 && v <= 23) ? v : 0;
    D._audit('editar', 'settings', null);
    D.save();
    Toast.ok(t('cfg.saved'));
    if (this.cv === 'cal') this.rCal();
  },

  clModal(cid) {
    const isE = !!cid, c = isE ? D.cl(cid) : null;
    const clColor = c?.color || 'CornflowerBlue';
    this.om(`<div class="mt">${isE ? t('cfg.editClient') : t('cfg.newClient')}</div>`
      + `<div class="fr"><div class="fg"><label>${t('field.nickname')}</label><input type="text" id="clN" value="${esc(c?.nombre || '')}" placeholder="${t('ph.clientNameOrCompany')}"></div><div class="fg"><label>${t('field.fullName')}</label><input type="text" id="clNC" value="${esc(c?.nombreCompleto || '')}" placeholder="${t('ph.fullName')}"></div></div>`
      + `<div class="fr"><div class="fg"><label>${t('cfg.address1')}</label><input type="text" id="clD1" value="${esc(c?.direccion1 || '')}" placeholder="${t('ph.street')}"></div><div class="fg"><label>${t('cfg.address2')}</label><input type="text" id="clD2" value="${esc(c?.direccion2 || '')}" placeholder="${t('ph.clientCity')}"></div></div>`
      + `<div class="fr"><div class="fg"><label>${t('cfg.nif')}</label><input type="text" id="clNif" value="${esc(c?.nif || '')}" placeholder="${t('ph.nif')}"></div><div class="fg"><label>${t('field.color')}</label>${this.colorSelect(clColor)}</div></div>`
      + `<div class="fr"><div class="fg"><label>${t('field.zonaFiscal')}</label><select id="clZona">${Object.entries(ZONA_FISCAL).map(([k, v]) => `<option value="${k}" ${(c?.zonaFiscal || 'es') === k ? 'selected' : ''}>${v}</option>`).join('')}</select></div>`
      + `<div class="fg" style="align-self:end"><p class="small" style="color:var(--t3);margin:0">${t('cfg.zonaClientHelp')}</p></div></div>`
      + `<div class="ma"><button class="bt" onclick="App.cm()">${t('btn.cancel')}</button><button class="bt bt-p" onclick="App.saveCl('${cid || ''}')">${isE ? t('btn.save') : t('btn.create')}</button></div>`);
  },

  saveCl(cid) {
    const nombre = document.getElementById('clN').value.trim();
    if (!nombre) { Toast.warn(t('msg.nameRequired')); return; }
    const color = document.getElementById('mpColor')?.value || 'CornflowerBlue';
    const nombreCompleto = document.getElementById('clNC').value.trim();
    const data = { nombre, nombreCompleto, direccion1: document.getElementById('clD1').value.trim(), direccion2: document.getElementById('clD2').value.trim(), nif: document.getElementById('clNif').value.trim(), zonaFiscal: document.getElementById('clZona').value, color };
    let savedId;
    if (cid) { D.upCl(cid, data); savedId = cid; }
    else { data.id = uid(); D.addCl(data); savedId = data.id; }
    /* Si venimos de facModal/pModal, no rCfg — cm() retorna al modal de origen */
    const fromFac = !!this._facReturn;
    const fromProj = !!this._projReturn;
    if (fromFac) {
      const p = D.p(this._facReturn.pid);
      if (p && !p.clienteId) D.up(this._facReturn.pid, { clienteId: savedId });
    }
    this.cm();
    if (!fromFac && !fromProj) this.rCfg();
  },

  delCl(cid) {
    const c = D.cl(cid); if (!c) return;
    if (!confirm(t('cfg.deleteClientConfirm', c.nombre))) return;
    D.delCl(cid); this.rCfg();
  },

  /* ══════════════════════════════════════════════
   *  IMPORT OLD INVOICES (generadorFacturas)
   * ══════════════════════════════════════════════ */

  importOldInvoicesClick() {
    const inp = document.createElement('input');
    inp.type = 'file';
    inp.multiple = true;
    inp.accept = '.json';
    inp.onchange = (e) => this.importOldInvoices(e.target.files);
    inp.click();
  },

  async importOldInvoices(files) {
    if (!files || !files.length) return;

    let imported = 0, created = 0;

    for (const file of files) {
      try {
        const text = await file.text();
        const data = JSON.parse(text);

        /* Validate generadorFacturas format */
        if (!data.factura || !data.calculos) continue;

        /* ── Find or create client ── */
        let clienteId = null;
        if (data.cliente && data.cliente.nombre) {
          const name = data.cliente.nombre.trim();
          const existing = D.d.clientes.find(c =>
            c.nombre.toLowerCase() === name.toLowerCase()
            || (c.nombreCompleto && c.nombreCompleto.toLowerCase() === name.toLowerCase())
          );
          if (existing) {
            clienteId = existing.id;
            /* Enrich client data if fields are empty */
            if (data.cliente.direccion1 && !existing.direccion1) existing.direccion1 = data.cliente.direccion1;
            if (data.cliente.direccion2 && !existing.direccion2) existing.direccion2 = data.cliente.direccion2;
            if (data.cliente.nif && !existing.nif) existing.nif = data.cliente.nif;
            if (name && !existing.nombreCompleto) existing.nombreCompleto = name;
          } else {
            const c = {
              id: uid(), nombre: name, nombreCompleto: name,
              direccion1: data.cliente.direccion1 || '',
              direccion2: data.cliente.direccion2 || '',
              nif: data.cliente.nif || '',
              color: 'CornflowerBlue'
            };
            D.addCl(c);
            clienteId = c.id;
          }
        }

        /* ── Calculate billing amounts ── */
        const base = data.calculos.base || 0;
        const ivaRate = data.calculos.ivaEnabled ? (data.calculos.ivaRate || 0) : 0;
        const irpfRate = data.calculos.irpfEnabled ? (data.calculos.irpfRate || 0) : 0;
        const { importeIva, importeIrpf, totalFactura, netoRecibido } = B.calcTax(base, ivaRate, irpfRate);

        /* Parse invoice number */
        const numStr = data.factura.numero || '0001';
        const num = parseInt(numStr) || 1;

        /* ── Find existing project by name or create ── */
        const asunto = (data.factura.asunto || '').trim();
        let project = D.d.projects.find(p =>
          p.nombre.toLowerCase() === asunto.toLowerCase()
        );

        if (project) {
          /* Update existing project with invoice data */
          const f = project.facturacion;
          f.facturaNum = num;
          f.facturaFecha = data.factura.fecha;
          f.baseImponible = base;
          f.iva = ivaRate;
          f.irpf = irpfRate;
          f.importeIva = importeIva;
          f.importeIrpf = importeIrpf;
          f.totalFactura = totalFactura;
          f.netoRecibido = netoRecibido;
          f.ivaExcepcion = data.calculos.ivaException || '';
          if (f.modo === 'gratis') f.modo = 'desde_base';
          if (clienteId && !project.clienteId) project.clienteId = clienteId;
        } else {
          /* Create new project as completed */
          project = {
            id: uid(),
            nombre: asunto || file.name.replace('.json', ''),
            estado: 'completado',
            color: 'CornflowerBlue',
            interno: false,
            recurrente: false,
            clienteId: clienteId,
            horas: [],
            fechas: { inicio: data.factura.fecha, finEstimada: null, finReal: data.factura.fecha },
            notas: '',
            facturacion: {
              modo: 'desde_base',
              baseImponible: base,
              total: totalFactura,
              iva: ivaRate,
              irpf: irpfRate,
              importeIva: importeIva,
              importeIrpf: importeIrpf,
              totalFactura: totalFactura,
              netoRecibido: netoRecibido,
              gastos: 0,
              ivaExcepcion: data.calculos.ivaException || '',
              pagado: true,
              facturaNum: num,
              facturaFecha: data.factura.fecha,
              precioHora: 0,
              idiomaFactura: null
            }
          };
          D.add(project);
          created++;
        }

        /* Update nextFacturaNum if needed */
        if (num >= (D.d.settings.nextFacturaNum || 1)) {
          D.d.settings.nextFacturaNum = num + 1;
        }

        /* Update emisor if empty */
        if (data.emisor) {
          const em = D.d.settings.emisor;
          if (!em.nombre && data.emisor.nombre) em.nombre = data.emisor.nombre;
          if (!em.direccion1 && data.emisor.direccion1) em.direccion1 = data.emisor.direccion1;
          if (!em.direccion2 && data.emisor.direccion2) em.direccion2 = data.emisor.direccion2;
          if (!em.nif && data.emisor.nif) em.nif = data.emisor.nif;
        }

        imported++;
      } catch (e) {
        console.warn('Import error:', file.name, e);
      }
    }

    D.save();

    if (imported > 0) {
      Toast.ok(t('msg.invoicesImported', imported, created));
      this.rCfg();
    } else {
      Toast.warn(t('msg.noValidInvoices'));
    }
  }

});
