/* ================================================
 * TRACKR — App: Facturas, Verifactu y Cobros (UI)
 *
 * Extiende el objeto global App (definido en app.js, cargado antes).
 * facModal/genFactura (PDF) + editClFromFac + cobros (cobroModal/saveCobro/delCobro).
 * Verifactu esta APARCADO: genFactura usa el guard "typeof V !== undefined";
 * en main el global V no existe -> sin QR ni warning (ver memoria del pivot).
 * Deps globales: Fac (facturas.js), V (verifactu.js, opcional), D, B, T, t, esc...
 * cm() (cierre de modal con _facReturn) queda en el core app.js.
 * ================================================ */
/** Cómo llegó el dinero de un cobro. Solo informativo: no cambia ningún cálculo fiscal. */
const COBRO_METODOS = ['transferencia', 'efectivo', 'bizum', 'tarjeta', 'otro'];

Object.assign(App, {

  /* ══════════════════════════════════════════════
   *  FACTURAS
   * ══════════════════════════════════════════════ */

  facModal(pid) {
    const p = D.p(pid); if (!p) return;
    if (p.facturacion?.anulada) {
      /* La última y sin enviar a VeriFactu: se puede borrar y volver a emitir con el mismo número */
      if (D.facturaBorrable(pid)) { Toast.warn(t('fac.isVoided')); return; }
      if (!confirm(t('fac.voidedDeleteConfirm', this._facNumStr(p)))) return;
      D.borrarFactura(pid);
    }
    B.calc(p);
    const f = p.facturacion, s = D.d.settings;
    const cl = p.clienteId ? D.cl(p.clienteId) : null;

    /* Si venimos de clModal con valores tecleados, restaurarlos */
    const r = (this._facRestore && this._facRestore.pid === pid) ? this._facRestore : null;
    this._facRestore = null;

    const date = r?.date || f.facturaFecha || todayStr();
    const num = r?.num || f.facturaNum || D.nextFacturaNum(date);
    const asunto = r?.asunto != null ? r.asunto : defaultAsunto(p);
    /* Días para pagar: los de esta factura; una ya emitida no los cambia */
    const dias = r?.dias || (Number.isFinite(f.diasPago) ? f.diasPago : (s.diasVencimiento ?? 30));

    const editBtn = `<button class="bt bt-s" style="padding:.15rem .45rem;font-size:.72rem;margin-left:.4rem" title="${t('btn.edit')}" onclick="App.editClFromFac('${pid}')">&#9998;</button>`;
    const addBtn = `<button class="bt bt-s bt-add" style="padding:.15rem .45rem;font-size:.72rem;margin-left:.4rem" onclick="App.editClFromFac('${pid}')">+ ${t('btn.newClient').replace('+ ','')}</button>`;
    const clRow = cl
      ? `<div class="br"><span class="la">${t('fac.client')}</span><span class="va" style="display:flex;align-items:center;justify-content:flex-end;gap:.2rem">${esc(cl.nombre)}${editBtn}</span></div>`
      : `<div class="br"><span class="la">${t('fac.client')}</span><span class="va" style="display:flex;align-items:center;justify-content:flex-end;gap:.2rem"><span style="color:var(--t3)">${t('fac.noClient')}</span>${addBtn}</span></div>`;

    const missing = [];
    if (cl) {
      if (!cl.nif) missing.push(t('fac.missingNif'));
      if (!cl.direccion1 && !cl.direccion2) missing.push(t('fac.missingAddress'));
    }
    const warnRow = missing.length
      ? `<div style="margin:-.35rem .25rem .5rem;font-size:.72rem;color:var(--warn);text-align:right">&#9888; ${missing.join(' &middot; ')}</div>`
      : '';

    const summary = `<div class="bb" style="margin-top:.75rem">`
      + `<div class="br"><span class="la">${t('fac.issuer')}</span><span class="va">${esc(s.emisor.nombre || t('fac.configure'))}</span></div>`
      + clRow
      + `<div class="br"><span class="la">${t('billing.base')}</span><span class="va">${fmtMoney(f.baseImponible || 0)}</span></div>`
      + (f.iva ? `<div class="br"><span class="la">${t('billing.plusIva', f.iva)}</span><span class="va">${fmtMoney(f.importeIva || 0)}</span></div>` : '')
      + (f.irpf ? `<div class="br"><span class="la">${t('billing.minusIrpf', esc(f.irpf))}</span><span class="va">${fmtMoney(f.importeIrpf || 0)}</span></div>` : '')
      + `<div class="br tot"><span class="la">${t('billing.total')}</span><span class="va">${fmtMoney(f.totalFactura || 0)}</span></div></div>`;

    this.om(`<div class="mt">${t('fac.generate')}</div>`
      + `<div class="fr"><div class="fg"><label>${t('field.invoiceNum')}${itip('tip.facNum')}</label><input type="text" id="facNum" value="${String(num)}" style="font-family:'DM Mono',monospace"></div>`
      + `<div class="fg"><label>${t('field.date')}${itip('tip.devengo')}</label><input type="date" id="facDate" value="${date}"></div>`
      + `<div class="fg"><label>${t('fac.payDays')}</label><input type="number" id="facDias" min="0" max="365" step="1" value="${dias}" ${f.facturaNum ? 'disabled' : ''} style="font-family:'DM Mono',monospace"></div></div>`
      + `<div class="fg"><label>${t('field.subject')}</label><input type="text" id="facAsunto" value="${esc(asunto)}"></div>`
      + summary
      + warnRow
      + `<div class="ma"><button class="bt" onclick="App.cm()">${t('btn.cancel')}</button><button class="bt bt-p" onclick="App.genFactura('${pid}')">${t('btn.downloadPdf')}</button></div>`);
  },

  /** Abre clModal del cliente del proyecto desde el flujo de generar factura */
  editClFromFac(pid) {
    const p = D.p(pid); if (!p) return;
    /* Preservar valores tecleados en facModal y marcar para retorno */
    this._facRestore = {
      pid,
      num: document.getElementById('facNum')?.value,
      date: document.getElementById('facDate')?.value,
      asunto: document.getElementById('facAsunto')?.value,
      dias: document.getElementById('facDias')?.value
    };
    this._facReturn = { pid, dirty: this._mDirty };
    this.clModal(p.clienteId || null);
  },

  /* ── Rectificar una factura emitida (por diferencias: la original no se toca) ── */
  rectModal(pid) {
    const p = D.p(pid); if (!p) return;
    B.calc(p);
    const f = p.facturacion;
    const actual = roundMoney((f.baseImponible || 0) + (f.rectificativas || []).reduce((s, r) => s + (r.base || 0), 0));
    this.om(`<div class="mt">${t('rect.title', `${esc(f.facturaNum)}/${yearShort(f.facturaFecha)}`)}</div>`
      + `<p style="font-size:.82rem;color:var(--t2);line-height:1.5;margin-bottom:.8rem">${t('rect.help')}</p>`
      + `<div class="fr"><div class="fg"><label>${t('rect.newBase', fmtMoney(actual))}</label><input type="number" id="rcBase" step="0.01" value="${actual}" oninput="App._rectPrev('${pid}')"></div>`
      + `<div class="fg"><label>${t('field.date')}${itip('tip.devengo')}</label><input type="date" id="rcDate" value="${todayStr()}"></div></div>`
      + `<div class="fg"><label>${t('rect.reason')}</label><input type="text" id="rcMot" placeholder="${t('rect.reasonPh')}"></div>`
      + `<div id="rcPrev" class="bb" style="margin-top:.5rem"></div>`
      + `<div class="ma"><button class="bt" onclick="App.cm()">${t('btn.cancel')}</button><button class="bt bt-p" onclick="App.saveRect('${pid}')">${t('rect.save')}</button></div>`);
    this._rectPrev(pid);
  },
  _rectPrev(pid) {
    const p = D.p(pid), el = document.getElementById('rcPrev'); if (!p || !el) return;
    const d = B.rectDiff(p.facturacion, parseFloat(document.getElementById('rcBase').value) || 0);
    const sg = n => (n > 0 ? '+' : '') + fmtMoney(n);
    el.innerHTML = `<div class="br"><span class="la">${t('billing.taxableBase')}</span><span class="va">${sg(d.base)}</span></div>`
      + (p.facturacion.iva ? `<div class="br"><span class="la">${t('billing.plusIvaAmt', esc(p.facturacion.iva))}</span><span class="va">${sg(d.importeIva)}</span></div>` : '')
      + (p.facturacion.irpf ? `<div class="br"><span class="la">${t('billing.minusIrpfAmt', esc(p.facturacion.irpf))}</span><span class="va">${sg(-d.importeIrpf)}</span></div>` : '')
      + `<div class="br tot"><span class="la">${t('rect.diffTotal')}</span><span class="va">${sg(d.total)}</span></div>`;
  },
  saveRect(pid) {
    const p = D.p(pid); if (!p) return;
    const f = p.facturacion;
    const fecha = document.getElementById('rcDate').value || todayStr();
    if (fecha < f.facturaFecha) { Toast.warn(t('rect.dateBefore')); return; }
    const d = B.rectDiff(f, parseFloat(document.getElementById('rcBase').value) || 0);
    if (!d.base) { Toast.warn(t('rect.noChange')); return; }
    const r = { id: uid(), num: D.nextRectNum(fecha), fecha, motivo: document.getElementById('rcMot').value.trim(), ...d };
    const rectificativas = [...(f.rectificativas || []), r];
    D.up(pid, { facturacion: { ...f, rectificativas } });
    if (D.d.settings.verifactu?.habilitado) Toast.warn(t('rect.noVerifactu'));
    this.cm();
    Fac.downloadRect(pid, r.id);
    Toast.ok(t('rect.done', `${r.num}/${yearShort(fecha)}`));
    this.go(this.cv, this.cp);
  },

  async genFactura(pid) {
    /* Normalizar la fecha aquí para que el PDF, el QR y el registro Verifactu usen
       EXACTAMENTE la misma (Fac.download también cae a todayStr() si va vacía). */
    const fecha = document.getElementById('facDate').value || todayStr();
    const asunto = document.getElementById('facAsunto').value.trim();
    const num = parseInt(document.getElementById('facNum').value) || null;
    const diasPago = parseInt(document.getElementById('facDias').value, 10);
    const p = D.p(pid);
    if (!p) return;
    /* Anulada: su número no se reutiliza y una factura nueva desde aquí quedaría fuera de impuestos */
    if (p.facturacion.anulada) { Toast.warn(t('fac.isVoided')); return; }
    /* Una factura de prueba a 0 € o sin emisor numera el proyecto y lo bloquea: avisar antes. */
    if (!(p.facturacion.totalFactura > 0)) { Toast.warn(t('msg.facZero')); return; }
    if (!D.d.settings.emisor?.nombre || !D.d.settings.emisor?.nif) { Toast.warn(t('msg.facNoEmisor')); return; }
    const numEf = num || p.facturacion.facturaNum || D.nextFacturaNum(fecha);
    const otro = D.facturaNumTaken(numEf, pid, fecha);
    if (otro) { Toast.error(t('fac.numTaken', numEf, otro.nombre)); return; }

    /* Guardar asunto en el proyecto si difiere del default; borrar si vacío o igual al default */
    const def = defaultAsunto(Object.assign({}, p, { facturacion: Object.assign({}, p.facturacion, { asuntoFactura: '' }) }));
    if (!asunto || asunto === def) {
      p.facturacion.asuntoFactura = '';
    } else {
      p.facturacion.asuntoFactura = asunto;
    }

    const s = D.d.settings;
    const f = p.facturacion;
    const vCfg = s.verifactu || {};
    // Guard: la rama Verifactu solo corre si verifactu.js (global V) esta cargado,
    // asi un deploy parcial no rompe la generacion de facturas.
    const verifactuOn = typeof V !== 'undefined' && vCfg.habilitado === true && s.emisor?.nif;

    let verifactu = null;
    if (verifactuOn) {
      const numStr = String(num || f.facturaNum || D.nextFacturaNum(fecha));
      /* NumSerieFactura = numero tal cual se imprime en el PDF: NNNN/YY (yearShort, como el PDF) */
      const numSerie = `${numStr}/${yearShort(fecha)}`;
      const cl = p.clienteId ? D.cl(p.clienteId) : null;
      const emisorNif = s.emisor.nif.replace(/[\s-]/g, '').toUpperCase();
      const hashPrev = D.lastHashFor(emisorNif);
      const fechaHoraHuso = V.nowHuso();
      /* F1 completa (destinatario con NIF) / F2 simplificada (sin identificar) */
      const tipoFactura = cl?.nif ? 'F1' : 'F2';
      const cuotaTotal = f.importeIva || 0;
      /* ImporteTotal AEAT = base + cuota IVA, SIN restar la retencion de IRPF
         (criterio SII/VeriFactu); el total a pagar (totalFactura) es otro campo. */
      const importeTotal = (f.baseImponible || 0) + (f.importeIva || 0);
      try {
        const hash = await V.huellaAlta({
          emisorNif,
          numSerie,
          fecha,
          tipoFactura,
          cuotaTotal,
          importeTotal,
          huellaPrev: hashPrev || '',
          fechaHoraHuso
        });
        const qrPayload = V.buildQRPayload(emisorNif, numSerie, fecha, importeTotal, vCfg.env === 'test');
        verifactu = {
          sifId: V.SIF_ID,
          softwareVersion: V.SOFTWARE_VERSION,
          qrPayload,
          hash,
          publicUrl: V.PUBLIC_URL
        };
        /* Persistir el registro de alta en el registro inmutable. seq = epoch ms
           monótono para ordenar la cadena sin ambigüedad de huso (ver D.fsBy).
           sifId/softwareVersion no se guardan por registro: son constantes de V y
           congelarlas mentiría sobre la versión con la que se firmó. */
        D.addFact({
          id: uid(),
          tipoRegistro: 'alta',
          numero: numSerie,
          fecha,
          emisorNif,
          emisorNombre: s.emisor.nombre || '',
          clienteNif: cl?.nif || '',
          clienteNombre: cl?.nombreCompleto || cl?.nombre || '',
          tipoFactura,
          baseImponible: f.baseImponible || 0,
          iva: f.iva || 0,
          importeIva: f.importeIva || 0,
          irpf: f.irpf || 0,
          importeIrpf: f.importeIrpf || 0,
          cuotaTotal,
          importeTotal,
          totalFactura: f.totalFactura || 0,
          desglose: [{ impuesto: 'IVA', tipoImpositivo: f.iva || 0, base: f.baseImponible || 0, cuota: f.importeIva || 0 }],
          proyectoId: pid,
          hash,
          hashPrev: hashPrev || null,
          timestamp: fechaHoraHuso,
          seq: Date.now(),
          qrPayload,
          eventos: []
        });
      } catch (err) {
        console.warn('Verifactu signing failed:', err);
        Toast.warn('Verifactu: no se pudo firmar (PDF sin QR)');
      }
    }

    Fac.download(pid, { fecha, asunto: asunto || defaultAsunto(p), num, verifactu, diasPago: diasPago >= 0 ? diasPago : undefined });
    T.ev('action', 'invoice_generate');
    this.cm(); this.rDet(pid);
    this._firstInvoice();
  },

  /** La primera factura: el momento de más confianza. Una sola vez: poner los datos a salvo. */
  _firstInvoice() {
    let seen = false;
    try { seen = localStorage.getItem('trackr_first_invoice') === '1'; } catch (e) { /* noop */ }
    if (seen || D.ps().filter(p => p.facturacion?.facturaNum).length !== 1) return;
    try { localStorage.setItem('trackr_first_invoice', '1'); } catch (e) { /* noop */ }
    T.ev('action', 'first_invoice');
    const pwa = typeof PWA !== 'undefined' && PWA.offerable && PWA.offerable();
    this.om(`<div class="mt">${t('first.title')}</div>`
      + `<p style="font-size:.9rem;color:var(--t2);line-height:1.5;margin-bottom:1rem">${t('first.body')}</p>`
      + `<div style="display:flex;flex-direction:column;gap:.5rem">`
      + `<button class="bt bt-p" onclick="App.expJson()">${t('first.export')}</button>`
      + (pwa ? `<button class="bt" onclick="App.cm();PWA.install()">${t('first.install')}</button>` : '')
      + `<button class="bt" onclick="App.cm();App.accModal()">${t('first.account')}</button>`
      + `</div>`
      + `<div class="ma"><button class="bt" onclick="App.cm()">${t('first.later')}</button></div>`);
  },


  /* ══════════════════════════════════════════════
   *  PRESUPUESTOS (por cliente, varias líneas)
   * ══════════════════════════════════════════════ */

  /**
   * Modal de presupuesto. Se abre desde la lista de clientes (cid) o desde un proyecto
   * (cid de su cliente + pid premarcado). Cada proyecto del cliente marcado = una línea;
   * si tiene subproyectos, una por subproyecto ({ pid, subId, concepto, base }).
   */
  budModal(cid, pid) {
    const cls = D.cls();
    if (!cid) cid = cls[0]?.id;
    /* Premarcado: el proyecto desde el que se abre; desde el cliente, los potenciales */
    const rows = this._budRows(cid, [], p => pid ? p.id === pid : p.estado === 'potencial');
    const hoy = todayStr();
    this.om(`<div class="mt">${t('bud.generate')}</div>`
      + `<div class="fg"><label>${t('fac.client')}</label><select id="budCl" onchange="App.budModal(this.value)">`
      +   cls.map(c => `<option value="${c.id}" ${c.id === cid ? 'selected' : ''}>${esc(c.nombre)}</option>`).join('')
      + `</select></div>`
      + `<div class="fr"><div class="fg"><label>${t('bud.num')}</label><input type="text" id="budNum" value="${D.nextBudNum(hoy)}" style="font-family:'DM Mono',monospace"></div>`
      /* La serie P vuelve a 1 cada año: al cambiar de año, el número que toca */
      + `<div class="fg"><label>${t('field.date')}</label><input type="date" id="budDate" value="${hoy}" onchange="document.getElementById('budNum').value=D.nextBudNum(this.value)"></div>`
      + `<div class="fg"><label>${t('bud.validez')}</label><input type="number" id="budVal" min="0" step="1" value="30" style="font-family:'DM Mono',monospace"></div></div>`
      + `<div class="fg"><label>${t('bud.projects')}</label>`
      +   (rows ? `<div class="cl-list">${rows}</div>` : `<div style="color:var(--t3);font-size:.85rem">${t(cid ? 'bud.noProjects' : 'bud.noClient')}</div>`)
      + `</div>`
      + `<div class="fg"><label>${t('bud.desc')}</label><textarea id="budDesc" placeholder="${t('bud.descPh')}"></textarea></div>`
      + `<div class="ma"><button class="bt" onclick="App.cm()">${t('btn.cancel')}</button>`
      + (rows ? `<button class="bt bt-p" onclick="App.budGen('${cid}')">${t('btn.downloadPdf')}</button>` : '')
      + `</div>`);
  },

  /** Filas del modal: primero las líneas ya elegidas (en su orden), luego el resto de proyectos del cliente. */
  _budRows(cid, lineas, pre) {
    const ps = D.ps().filter(p => p.clienteId === cid && p.estado !== 'abandonado');
    const rows = lineas.map(l => ({ pid: l.pid, sub: l.subId, on: true, concepto: l.concepto, base: l.base }));
    ps.forEach(p => {
      const mias = lineas.filter(l => l.pid === p.id), subs = B.subs(p);
      /* Con subproyectos: una línea por cada uno que falte. Si el presupuesto ya trae líneas del
         proyecto sin subproyecto (un desglose hecho a mano), no se ofrecen: saldrían repetidas. */
      if (subs.length) {
        if (!mias.some(l => !l.subId)) subs.filter(x => !mias.some(l => l.subId === x.id))
          .forEach(x => rows.push({ pid: p.id, sub: x.id, on: pre(p), concepto: B.subConcepto(x), base: x.base || '' }));
      } else if (!mias.length) rows.push({
        pid: p.id, on: pre(p), concepto: p.nombre,
        base: p.facturacion?.modo === 'gratis' ? '' : (p.facturacion?.baseImponible || '')
      });
    });
    /* Los subproyectos van bajo el nombre de su proyecto y metidos hacia dentro: sin eso no se distinguen de un proyecto */
    return rows.map((r, i) => (r.sub && !(rows[i - 1]?.sub && rows[i - 1].pid === r.pid)
        ? `<div class="cl-item" style="cursor:default;color:var(--t2);font-size:.78rem;padding-bottom:.2rem">${esc(D.p(r.pid)?.nombre || '')}</div>` : '')
      + `<div class="cl-item bud-line" data-pid="${r.pid}"${r.sub ? ` data-sub="${esc(r.sub)}"` : ''} style="gap:.5rem${r.sub ? ';padding-left:1.75rem' : ''}">`
      + `<input type="checkbox" ${r.on ? 'checked' : ''} style="width:auto">`
      + `<input type="text" class="bud-c" value="${esc(r.concepto)}" style="flex:1">`
      + `<input type="number" class="bud-b" step="0.01" min="0" value="${r.base}" placeholder="0" style="width:7rem;font-family:'DM Mono',monospace">`
      + `</div>`).join('');
  },

  /** Líneas marcadas del modal, y la validez en días (vacío = sin validez) */
  _budRead() {
    const lineas = [...document.querySelectorAll('.bud-line')]
      .filter(el => el.querySelector('input[type=checkbox]').checked)
      .map(el => ({
        pid: el.dataset.pid,
        concepto: el.querySelector('.bud-c').value.trim(),
        base: roundMoney(parseFloat(el.querySelector('.bud-b').value) || 0),
        ...(el.dataset.sub && { subId: el.dataset.sub })
      }));
    const v = parseInt(document.getElementById('budVal').value, 10);
    return { lineas, validez: Number.isFinite(v) && v >= 0 ? v : undefined };
  },

  /** Editar un presupuesto guardado: número, fecha, validez, estado, descripción y líneas. También se borra desde aquí. El cliente no cambia. */
  budEditModal(id) {
    const b = D.bud(id); if (!b) return;
    this.om(`<div class="mt">${t('bud.edit')} · ${esc(b.num)}/${yearShort(b.fecha)}</div>`
      + `<div class="fg"><label>${t('fac.client')}</label><div style="font-size:.9rem">${esc(D.cl(b.clienteId)?.nombre || '')}</div></div>`
      + `<div class="fr"><div class="fg"><label>${t('bud.num')}</label><input type="text" id="budNum" value="${esc(b.num)}" style="font-family:'DM Mono',monospace"></div>`
      + `<div class="fg"><label>${t('field.date')}</label><input type="date" id="budDate" value="${b.fecha}"></div>`
      + `<div class="fg"><label>${t('bud.validez')}</label><input type="number" id="budVal" min="0" step="1" value="${b.validez ?? ''}" style="font-family:'DM Mono',monospace"></div></div>`
      + `<div class="fg"><label>${t('field.status')}</label><select id="budSt">${['enviado', 'aceptado', 'rechazado'].map(k => `<option value="${k}" ${k === b.estado ? 'selected' : ''}>${t('bud.st.' + k)}</option>`).join('')}</select></div>`
      + `<div class="fg"><label>${t('bud.projects')}</label><div class="cl-list">${this._budRows(b.clienteId, b.lineas, () => false)}</div></div>`
      + `<div class="fg"><label>${t('bud.desc')}</label><textarea id="budDesc" placeholder="${t('bud.descPh')}">${esc(b.descripcion || '')}</textarea></div>`
      + `<div class="ma" style="justify-content:space-between"><button class="bt bt-d" onclick="App.budDel('${b.id}')">${t('btn.delete')}</button>`
      + `<div style="display:flex;gap:.5rem"><button class="bt" onclick="App.cm()">${t('btn.cancel')}</button>`
      + `<button class="bt bt-p" onclick="App.budSaveEdit('${b.id}')">${t('btn.save')}</button></div></div>`);
  },

  /** Borrar un presupuesto (desde la lista o desde su ventana). Pregunta antes: no se puede deshacer. */
  budDel(id) {
    const b = D.bud(id); if (!b) return;
    if (!confirm(t('bud.deleteConfirm', `${b.num}/${yearShort(b.fecha)}`))) return;
    D.delBud(id);
    this._mDirty = false; /* la ventana, si está abierta, se cierra sin preguntar por lo escrito */
    this.cm();
    this.rBud();
  },

  budSaveEdit(id) {
    const b = D.bud(id); if (!b) return;
    const { lineas, validez } = this._budRead();
    if (!lineas.length) return Toast.error(t('bud.none'));
    const fecha = document.getElementById('budDate').value || b.fecha;
    const descripcion = document.getElementById('budDesc').value.trim();
    /* Número: si no se toca se queda como estaba (los antiguos son un número, no un texto) */
    const tecleado = document.getElementById('budNum').value.trim(), antes = b.num;
    const num = !tecleado || tecleado === String(antes) ? antes : tecleado;
    if (D.budNumTaken(num, fecha, id)) return Toast.error(t('bud.numTaken', num + '/' + yearShort(fecha)));
    const estado = document.getElementById('budSt').value;
    const total = Fac._budData(b.clienteId, lineas, { num, fecha, descripcion, validez }).data.calculos.total;
    /* Marca del proyecto: los quitados la pierden; los que siguen o entran llevan el número y la fecha nuevos */
    b.lineas.forEach(l => { if (!lineas.some(x => x.pid === l.pid) && D.p(l.pid)?.presupuesto?.num === antes) D.up(l.pid, { presupuesto: null }); });
    lineas.forEach(l => { const p = D.p(l.pid); if (p && (!p.presupuesto || p.presupuesto.num === antes)) D.up(l.pid, { presupuesto: { num, fecha } }); });
    D.upBud(id, { num, lineas, fecha, descripcion, validez, total });
    Toast.ok(t('bud.saved', num));
    this._mDirty = false;
    this.cm();
    /* Aceptarlo desde aquí hace lo mismo que el ✓ de la lista (activa los proyectos potenciales) */
    if (estado !== b.estado) this.budEstado(id, estado); else this.rBud();
  },

  budGen(cid) {
    const { lineas, validez } = this._budRead();
    if (!lineas.length) return Toast.error(t('bud.none'));
    const fecha = document.getElementById('budDate').value || todayStr();
    const num = document.getElementById('budNum').value.trim() || D.nextBudNum(fecha);
    if (D.budNumTaken(num, fecha)) return Toast.error(t('bud.numTaken', num + '/' + yearShort(fecha)));
    const r = Fac.presupuesto(cid, lineas, { num, fecha, validez, descripcion: document.getElementById('budDesc').value.trim() });
    T.ev('action', 'budget_generate');
    Toast.ok(`${t('bud.btn')} ${num} · ${fmtMoney(r.total)}`);
    this.cm();
    if (this.cv === 'det' && this.cp) this.rDet(this.cp); else this.go(this.cv);
  },


  /* ══════════════════════════════════════════════
   *  COBROS PARCIALES (Partial Payments)
   * ══════════════════════════════════════════════ */

  cobroModal(pid, cid) {
    const p = D.p(pid); if (!p) return;
    B.calc(p);
    const isEdit = !!cid;
    const existing = isEdit ? (p.facturacion.cobros || []).find(c => c.id === cid) : null;
    if (isEdit && !existing) return;
    const pend = B.pendiente(p);
    if (!isEdit && pend <= 0) { Toast.ok(t('billing.alreadyPaid')); return; }
    const defAmount = isEdit ? existing.cantidad : pend.toFixed(2);
    const defDate = isEdit ? (existing.fecha || todayStr()) : todayStr();
    const title = isEdit ? t('billing.editPayment') : t('billing.addPayment');
    this.om(
      `<div class="mt">${title}</div>`
      + `<div class="fr"><div class="fg"><label>${t('billing.paymentAmount')}</label><input type="number" id="mcA" min="0.01" step="0.01" value="${defAmount}"></div>`
      + `<div class="fg"><label>${t('field.date')}${itip('tip.cobroFecha')}</label><input type="date" id="mcD" value="${defDate}"></div></div>`
      + `<div class="fg"><label>${t('billing.method')}</label><select id="mcM">${COBRO_METODOS.map(m => `<option value="${m}" ${(existing?.metodo || 'transferencia') === m ? 'selected' : ''}>${t('billing.m.' + m)}</option>`).join('')}</select></div>`
      + (isEdit ? '' : `<div style="font-size:.78rem;color:var(--t3);margin-bottom:.75rem">${t('billing.remaining', fmtMoney(pend))}</div>`)
      + `<div class="ma"><button class="bt" onclick="App.cm()">${t('btn.cancel')}</button><button class="bt bt-p" onclick="App.saveCobro('${pid}'${isEdit ? `,'${cid}'` : ''})">${t('btn.save')}</button></div>`
    );
  },

  saveCobro(pid, cid) {
    let cant = parseFloat(document.getElementById('mcA').value) || 0;
    const fecha = document.getElementById('mcD').value || todayStr();
    const metodo = document.getElementById('mcM').value;
    if (cant <= 0) return;
    const p = D.p(pid); if (!p) return;
    if (!p.facturacion.cobros) p.facturacion.cobros = [];
    B.calc(p);
    const existing = cid ? p.facturacion.cobros.find(x => x.id === cid) : null;
    // Tope: el total cobrado no puede superar el total de la factura (solo si hay un total > 0).
    const total = p.facturacion.totalFactura || 0;
    if (total > 0) {
      const room = B.pendiente(p) + (existing ? existing.cantidad : 0);
      if (cant > room + 0.005) { cant = Math.max(room, 0); Toast.warn(t('billing.capped', fmtMoney(roundMoney(cant)))); }
    }
    cant = roundMoney(cant);
    if (existing) {
      existing.fecha = fecha; existing.cantidad = cant; existing.metodo = metodo;
    } else {
      p.facturacion.cobros.push({ id: uid(), fecha, cantidad: cant, metodo });
    }
    B.calc(p);
    D.up(pid, { facturacion: p.facturacion });
    Toast.ok((cid ? t('billing.editPayment') : t('billing.addPayment')) + ' ✓');
    this.cm();
    if (this.cv === 'det') this.rDet(pid); else this.rDash();
  },

  delCobro(pid, cid) {
    const p = D.p(pid); if (!p) return;
    const c = (p.facturacion.cobros || []).find(x => x.id === cid);
    if (!c) return;
    if (!confirm(t('billing.deletePayment', fmtMoney(c.cantidad)))) return;
    p.facturacion.cobros = p.facturacion.cobros.filter(x => x.id !== cid);
    D._tomb('cobro', cid); /* lápida para la fusión entre dispositivos */
    B.calc(p);
    D.up(pid, { facturacion: p.facturacion });
    if (this.cv === 'det') this.rDet(pid); else this.rDash();
  },

});
