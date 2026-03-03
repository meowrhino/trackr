/* ================================================
 * TRACKR — App: Vista Configuración + Clientes
 * Globales: extiende App
 * Dependencias: app.js (App base), utils.js, store.js,
 *               themes.js, colors.js, lang.js
 * ================================================ */

Object.assign(App, {

  rCfg() {
    const s = D.d.settings, em = s.emisor, tg = s.targets, cls = D.cls();

    document.getElementById('cfgC').innerHTML =
      `<div class="cfg-section"><div class="cfg-section-title">${t('lang.label')}</div>`
      + `<div class="lang-toggle">${['es', 'en'].map(code =>
          `<button class="lang-btn${_lang === code ? ' on' : ''}" onclick="App.setLanguage('${code}')">${t('lang.' + code)}</button>`
        ).join('')}</div></div>`
      + `<div class="cfg-section"><div class="cfg-section-title">${t('cfg.issuerTitle')}</div><div class="cfg-grid">`
      + `<div class="cfg-full fg"><label>${t('cfg.nameCompany')}</label><input type="text" id="cfgEN" value="${esc(em.nombre)}" placeholder="${t('ph.nameOrCompany')}"></div>`
      + `<div class="fg"><label>${t('cfg.address1')}</label><input type="text" id="cfgED1" value="${esc(em.direccion1)}" placeholder="${t('ph.street')}"></div>`
      + `<div class="fg"><label>${t('cfg.address2')}</label><input type="text" id="cfgED2" value="${esc(em.direccion2)}" placeholder="${t('ph.cityZip')}"></div>`
      + `<div class="fg"><label>${t('cfg.nif')}</label><input type="text" id="cfgENif" value="${esc(em.nif)}" placeholder="${t('ph.nif')}"></div>`
      + `</div></div>`
      + `<div class="cfg-section"><div class="cfg-section-title">${t('cfg.defaults')}</div><div class="cfg-grid">`
      + `<div class="fg"><label>${t('cfg.ivaPercent')}</label><input type="number" id="cfgIva" value="${s.defaultIva}" min="0" max="100" step="1"></div>`
      + `<div class="fg"><label>${t('cfg.irpfPercent')}</label><input type="number" id="cfgIrpf" value="${s.defaultIrpf}" min="0" max="100" step="1"></div>`
      + `</div></div>`
      + `<div class="cfg-section"><div class="cfg-section-title">${t('cfg.goals')}</div><div class="cfg-grid">`
      + `<div class="fg"><label>${t('cfg.hoursMonth')}</label><input type="number" id="cfgTHm" value="${tg.horasMes || ''}" min="0" step="1" placeholder="${t('ph.hoursMonth')}"></div>`
      + `<div class="fg"><label>${t('cfg.incomeMonth')}</label><input type="number" id="cfgTIm" value="${tg.ingresosMes || ''}" min="0" step="100" placeholder="${t('ph.incomeMonth')}"></div>`
      + `<div class="fg"><label>${t('cfg.hoursWeek')}</label><input type="number" id="cfgTHs" value="${tg.horasSemana || ''}" min="0" step="1" placeholder="${t('ph.hoursWeek')}"></div>`
      + `</div></div>`
      + `<div class="cfg-section"><div class="cfg-section-title">${t('cfg.theme')}</div>`
      + `<div class="theme-grid">${THEME_ORDER.map(id => {
          const th = THEMES[id];
          return `<button class="theme-btn${s.tema === id ? ' on' : ''}" onclick="App.setTheme('${id}')">`
            + `<div class="theme-preview" style="background:${th.vars.bg};border-color:${th.vars.b2}">`
            + `<div style="background:${th.vars.bg2};border:1px solid ${th.vars.b1};border-radius:2px;padding:3px 5px;margin-bottom:2px"><span style="color:${th.vars.t1};font-size:8px">Aa</span></div>`
            + `<div style="display:flex;gap:2px"><span style="width:8px;height:4px;border-radius:1px;background:${th.vars.ok}"></span><span style="width:8px;height:4px;border-radius:1px;background:${th.vars.warn}"></span><span style="width:8px;height:4px;border-radius:1px;background:${th.vars.bad}"></span></div>`
            + `</div><span class="theme-name">${t('theme.' + id)}</span></button>`;
        }).join('')}</div></div>`
      + `<div class="cfg-save"><button class="bt bt-p" onclick="App.saveCfg()">${t('btn.saveCfg')}</button></div>`
      + `<div class="cfg-section" style="margin-top:2.5rem"><div class="cfg-section-title">${t('cfg.clients')}</div>`
      + (cls.length
        ? `<div class="cl-list">${cls.map(c => `<div class="cl-item"><span class="cl-dot" style="background:${colorHex(c.color || 'CornflowerBlue')}"></span><span class="cl-name">${esc(c.nombre)}</span>${c.nif ? `<span class="cl-nif">${esc(c.nif)}</span>` : ''}<div class="cl-actions"><button class="cl-btn" onclick="App.clModal('${c.id}')" title="${t('btn.edit')}">&#9998;</button><button class="cl-btn cl-btn-del" onclick="App.delCl('${c.id}')" title="${t('btn.delete')}">&times;</button></div></div>`).join('')}</div>`
        : `<div style="color:var(--t3);font-size:.82rem">${t('cfg.noClients')}</div>`)
      + `<button class="bt bt-add" style="margin-top:.75rem" onclick="App.clModal()">${t('btn.newClient')}</button></div>`
      + `<div class="cfg-section" style="margin-top:2.5rem"><div class="cfg-section-title">${t('cfg.importOldInvoices')}</div>`
      + `<div style="color:var(--t3);font-size:.82rem;margin-bottom:.75rem">${t('cfg.importOldDesc')}</div>`
      + `<button class="bt bt-add" onclick="App.importOldInvoicesClick()">${t('cfg.importOldInvoices')}</button></div>`;
  },

  setLanguage(code) {
    setLang(code);
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

  saveCfg() {
    const s = D.d.settings;
    s.emisor.nombre = document.getElementById('cfgEN').value.trim();
    s.emisor.direccion1 = document.getElementById('cfgED1').value.trim();
    s.emisor.direccion2 = document.getElementById('cfgED2').value.trim();
    s.emisor.nif = document.getElementById('cfgENif').value.trim();
    s.defaultIva = parseInt(document.getElementById('cfgIva').value) || 0;
    s.defaultIrpf = parseInt(document.getElementById('cfgIrpf').value) || 0;
    s.targets.horasMes = parseFloat(document.getElementById('cfgTHm').value) || null;
    s.targets.ingresosMes = parseFloat(document.getElementById('cfgTIm').value) || null;
    s.targets.horasSemana = parseFloat(document.getElementById('cfgTHs').value) || null;
    D.save();
    Toast.ok(t('cfg.saved'));
  },

  clModal(cid) {
    const isE = !!cid, c = isE ? D.cl(cid) : null;
    const clColor = c?.color || 'CornflowerBlue';
    this.om(`<div class="mt">${isE ? t('cfg.editClient') : t('cfg.newClient')}</div>`
      + `<div class="fr"><div class="fg"><label>${t('field.nickname')}</label><input type="text" id="clN" value="${esc(c?.nombre || '')}" placeholder="${t('ph.clientNameOrCompany')}"></div><div class="fg"><label>${t('field.fullName')}</label><input type="text" id="clNC" value="${esc(c?.nombreCompleto || '')}" placeholder="${t('ph.fullName')}"></div></div>`
      + `<div class="fr"><div class="fg"><label>${t('cfg.address1')}</label><input type="text" id="clD1" value="${esc(c?.direccion1 || '')}" placeholder="${t('ph.street')}"></div><div class="fg"><label>${t('cfg.address2')}</label><input type="text" id="clD2" value="${esc(c?.direccion2 || '')}" placeholder="${t('ph.clientCity')}"></div></div>`
      + `<div class="fr"><div class="fg"><label>${t('cfg.nif')}</label><input type="text" id="clNif" value="${esc(c?.nif || '')}" placeholder="${t('ph.nif')}"></div><div class="fg"><label>${t('field.color')}</label>${this.colorSelect(clColor)}</div></div>`
      + `<div class="ma"><button class="bt" onclick="App.cm()">${t('btn.cancel')}</button><button class="bt bt-p" onclick="App.saveCl('${cid || ''}')">${isE ? t('btn.save') : t('btn.create')}</button></div>`);
  },

  saveCl(cid) {
    const nombre = document.getElementById('clN').value.trim();
    if (!nombre) { Toast.warn(t('msg.nameRequired')); return; }
    const color = document.getElementById('mpColor')?.value || 'CornflowerBlue';
    const nombreCompleto = document.getElementById('clNC').value.trim();
    const data = { nombre, nombreCompleto, direccion1: document.getElementById('clD1').value.trim(), direccion2: document.getElementById('clD2').value.trim(), nif: document.getElementById('clNif').value.trim(), color };
    if (cid) D.upCl(cid, data); else { data.id = uid(); D.addCl(data); }
    this.cm(); this.rCfg();
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
        const importeIva = Math.round(base * ivaRate / 100 * 100) / 100;
        const importeIrpf = Math.round(base * irpfRate / 100 * 100) / 100;
        const totalFactura = Math.round((base + importeIva - importeIrpf) * 100) / 100;
        const netoRecibido = Math.round((base - importeIrpf) * 100) / 100;

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
