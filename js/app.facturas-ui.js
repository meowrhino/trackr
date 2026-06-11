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
Object.assign(App, {

  /* ══════════════════════════════════════════════
   *  FACTURAS
   * ══════════════════════════════════════════════ */

  facModal(pid) {
    const p = D.p(pid); if (!p) return;
    B.calc(p);
    const f = p.facturacion, s = D.d.settings;
    const cl = p.clienteId ? D.cl(p.clienteId) : null;

    /* Si venimos de clModal con valores tecleados, restaurarlos */
    const r = (this._facRestore && this._facRestore.pid === pid) ? this._facRestore : null;
    this._facRestore = null;

    const num = r?.num || f.facturaNum || s.nextFacturaNum || 1;
    const date = r?.date || f.facturaFecha || todayStr();
    const asunto = r?.asunto != null ? r.asunto : defaultAsunto(p);

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
      + (f.irpf ? `<div class="br"><span class="la">${t('billing.minusIrpf', f.irpf)}</span><span class="va">${fmtMoney(f.importeIrpf || 0)}</span></div>` : '')
      + `<div class="br tot"><span class="la">${t('billing.total')}</span><span class="va">${fmtMoney(f.totalFactura || 0)}</span></div></div>`;

    this.om(`<div class="mt">${t('fac.generate')}</div>`
      + `<div class="fr"><div class="fg"><label>${t('field.invoiceNum')}</label><input type="text" id="facNum" value="${String(num)}" style="font-family:'DM Mono',monospace"></div>`
      + `<div class="fg"><label>${t('field.date')}</label><input type="date" id="facDate" value="${date}"></div></div>`
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
      asunto: document.getElementById('facAsunto')?.value
    };
    this._facReturn = { pid };
    this.clModal(p.clienteId || null);
  },

  async genFactura(pid) {
    const fecha = document.getElementById('facDate').value;
    const asunto = document.getElementById('facAsunto').value.trim();
    const num = parseInt(document.getElementById('facNum').value) || null;
    const p = D.p(pid);
    if (!p) return;

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
    // Guard: la rama Verifactu solo corre si verifactu.js (global V) esta cargado. En main NO
    // lo esta (Verifactu aparcado), asi se evita el warning "no se pudo firmar" en cada factura.
    const verifactuOn = typeof V !== 'undefined' && vCfg.habilitado !== false && s.emisor?.nif;

    let verifactu = null;
    if (verifactuOn) {
      const numStr = String(num || f.facturaNum || s.nextFacturaNum || 1);
      const cl = p.clienteId ? D.cl(p.clienteId) : null;
      const hashPrev = D.lastHashFor(s.emisor.nif);
      try {
        const hash = await V.signInvoice({
          nifEmisor: s.emisor.nif,
          numSerie: numStr,
          fechaISO: fecha,
          baseImponible: f.baseImponible || 0,
          totalFactura: f.totalFactura || 0
        }, hashPrev);
        const qrPayload = V.buildQRPayload(
          s.emisor.nif, numStr, fecha, f.totalFactura || 0, vCfg.env === 'test'
        );
        verifactu = {
          sifId: V.SIF_ID,
          softwareVersion: V.SOFTWARE_VERSION,
          qrPayload,
          hash,
          publicUrl: 'tr4ckr.com/verifactu'
        };
        /* Persistir factura firmada en el registro inmutable */
        D.addFact({
          id: uid(),
          numero: numStr,
          fecha,
          emisorNif: s.emisor.nif,
          emisorNombre: s.emisor.nombre || '',
          clienteNif: cl?.nif || '',
          clienteNombre: cl?.nombreCompleto || cl?.nombre || '',
          baseImponible: f.baseImponible || 0,
          iva: f.iva || 0,
          importeIva: f.importeIva || 0,
          irpf: f.irpf || 0,
          importeIrpf: f.importeIrpf || 0,
          totalFactura: f.totalFactura || 0,
          proyectoId: pid,
          hash,
          hashPrev: hashPrev || null,
          timestamp: new Date().toISOString(),
          qrPayload,
          sifId: V.SIF_ID,
          softwareVersion: V.SOFTWARE_VERSION,
          tipoFactura: 'ordinaria',
          eventos: []
        });
      } catch (err) {
        console.warn('Verifactu signing failed:', err);
        Toast.warn('Verifactu: no se pudo firmar (PDF sin QR)');
      }
    }

    Fac.download(pid, { fecha, asunto: asunto || defaultAsunto(p), num, verifactu });
    T.ev('action', 'invoice_generate');
    this.cm(); this.rDet(pid);
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
      + `<div class="fg"><label>${t('field.date')}</label><input type="date" id="mcD" value="${defDate}"></div></div>`
      + (isEdit ? '' : `<div style="font-size:.78rem;color:var(--t3);margin-bottom:.75rem">${t('billing.remaining', fmtMoney(pend))}</div>`)
      + `<div class="ma"><button class="bt" onclick="App.cm()">${t('btn.cancel')}</button><button class="bt bt-p" onclick="App.saveCobro('${pid}'${isEdit ? `,'${cid}'` : ''})">${t('btn.save')}</button></div>`
    );
  },

  saveCobro(pid, cid) {
    let cant = parseFloat(document.getElementById('mcA').value) || 0;
    const fecha = document.getElementById('mcD').value || todayStr();
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
      existing.fecha = fecha; existing.cantidad = cant;
    } else {
      p.facturacion.cobros.push({ id: uid(), fecha, cantidad: cant });
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
    B.calc(p);
    D.up(pid, { facturacion: p.facturacion });
    if (this.cv === 'det') this.rDet(pid); else this.rDash();
  },

});
