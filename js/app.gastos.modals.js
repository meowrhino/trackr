/* ================================================
 * TRACKR — App: Modales de Gastos (crear/editar gasto y entradas)
 *
 * Extiende el objeto global App (definido en app.js, cargado antes).
 * Modales: gModal/saveG/delG (gasto), geModal/saveGE/delGE (entrada),
 * quickAddRecurring, _gCalc, _toggleGasRec. Comparte App.rGas() (render,
 * en app.gastos.js) en runtime -> separacion segura.
 * Deps globales: D, B, T, Toast, t, roundMoney, todayStr, uid, ...
 * ================================================ */
Object.assign(App, {
  /* ══════════════════════════════════════
   *  MODALES GASTOS
   * ══════════════════════════════════════ */

  /* Auto-calc base↔total en modales de gasto (prefijos: g = gasto puntual, ge = entrada).
     Si el proveedor practica retención, el total de la factura es base + IVA − IRPF
     (mismo criterio que las facturas emitidas). */
  _gCalc(from, prefix = 'g') {
    const bEl = document.getElementById(prefix + 'EB');
    const iEl = document.getElementById(prefix + 'EI');
    const rEl = document.getElementById(prefix + 'ER');
    const tEl = document.getElementById(prefix + 'EA');
    const ivaSelEl = document.getElementById(prefix === 'g' ? 'gIva' : 'geIva');
    const irpfEl = document.getElementById(prefix === 'g' ? 'gIrpf' : 'geIrpf');
    const ivaPct = ivaSelEl ? (parseInt(ivaSelEl.value) || 0) : 21;
    const irpfPct = irpfEl ? (parseFloat(irpfEl.value) || 0) : 0;
    let base;
    if (from === 'total') {
      base = B.desglosarTotal(parseFloat(tEl.value) || 0, ivaPct, irpfPct).base;
      bEl.value = base || '';
    } else {
      base = parseFloat(bEl.value) || 0;
    }
    const { importeIva, importeIrpf, totalFactura } = B.calcTax(base, ivaPct, irpfPct);
    iEl.value = importeIva || '';
    if (rEl) rEl.value = importeIrpf || '';
    if (from !== 'total') tEl.value = totalFactura || '';
    this._gDesgCalc(prefix);
  },

  /* ── Desglose por tipos de IVA (ticket mixto 21 % + 4 % en una sola entrada) ──
     Arriba, Base e IVA son los TOTALES (lo que va al 303). El checkbox «Varios tipos
     de IVA» abre debajo una fila por tipo; con él activo, los totales se calculan
     desde las filas y no se editan a mano. */
  _gDesgHtml(prefix, lines) {
    const on = !!(lines && lines.length);
    return `<div class="fg"><label style="display:flex;align-items:center;gap:.5rem;cursor:pointer"><input type="checkbox" id="${prefix}DesgOn" ${on ? 'checked' : ''} onchange="App._gDesgToggle('${prefix}', this.checked)"> ${t('gas.ivaMixed')}</label></div>`
      + `<div id="${prefix}DesgBox" style="${on ? '' : 'display:none;'}margin:-.3rem 0 .75rem;padding:.6rem .75rem;border:1px solid var(--b1);border-radius:8px">`
      +   `<div id="${prefix}Desg">${(lines || []).map(l => this._gDesgRow(prefix, l)).join('')}</div>`
      +   `<button type="button" class="bt bt-s" onclick="App._gDesgAdd('${prefix}')">+ ${t('gas.addIvaRate')}</button>`
      + `</div>`;
  },
  _gDesgRow(prefix, l) {
    const opts = Object.entries(TIPOS_IVA).map(([k, v]) => `<option value="${k}" ${l.tipoIva == k ? 'selected' : ''}>${v}</option>`).join('');
    return `<div class="fr fr-3 gdesg-row"><div class="fg"><label>${t('field.ivaRate')}</label><select class="dT" onchange="App._gDesgCalc('${prefix}', this)">${opts}</select></div>`
      + `<div class="fg"><label>${t('field.base')}</label><input type="number" class="dB" min="0" step="0.01" value="${l.base ?? ''}" placeholder="0,00" onchange="App._gDesgCalc('${prefix}', this)"></div>`
      + `<div class="fg"><label>${t('field.ivaAmount')}</label><div style="display:flex;gap:.4rem"><input type="number" class="dI" min="0" step="0.01" value="${l.iva ?? ''}" placeholder="0,00" onchange="App._gDesgCalc('${prefix}')">`
      + `<button type="button" class="bt bt-s" title="${t('btn.delete')}" onclick="this.closest('.gdesg-row').remove();App._gDesgCalc('${prefix}')">×</button></div></div></div>`;
  },
  _gDesgOn(prefix) { return !!document.getElementById(prefix + 'DesgOn')?.checked; },
  _gMainTipo(prefix) { return parseInt(document.getElementById(prefix === 'g' ? 'gIva' : 'geIva')?.value) || 0; },
  /** Activar: la base/IVA de arriba pasan a ser la primera fila y se añade otra vacía.
   *  Desactivar: se vacían las filas y los totales vuelven a editarse a mano. */
  _gDesgToggle(prefix, on) {
    const box = document.getElementById(prefix + 'DesgBox'), rows = document.getElementById(prefix + 'Desg');
    if (!box || !rows) return;
    box.style.display = on ? '' : 'none';
    const n = id => parseFloat(document.getElementById(prefix + id)?.value) || 0;
    if (on && !rows.children.length) {
      const tipo = this._gMainTipo(prefix);
      rows.insertAdjacentHTML('beforeend', this._gDesgRow(prefix, { tipoIva: tipo, base: n('EB') || '', iva: n('EI') || '' })
        + this._gDesgRow(prefix, { tipoIva: tipo === 10 ? 21 : 10, base: '', iva: '' }));
    }
    if (!on) rows.innerHTML = '';
    this._gDesgCalc(prefix);
  },
  _gDesgAdd(prefix) {
    const rows = document.getElementById(prefix + 'Desg'); if (!rows) return;
    rows.insertAdjacentHTML('beforeend', this._gDesgRow(prefix, { tipoIva: this._gMainTipo(prefix) === 10 ? 21 : 10, base: '', iva: '' }));
    this._gDesgCalc(prefix);
  },
  /** Recalcula el IVA de la fila tocada (base × tipo) y, con desglose activo, los totales. */
  _gDesgCalc(prefix, changed) {
    if (changed) {
      const row = changed.closest('.gdesg-row');
      const b = parseFloat(row.querySelector('.dB').value) || 0;
      row.querySelector('.dI').value = roundMoney(b * (parseInt(row.querySelector('.dT').value) || 0) / 100) || '';
    }
    const bEl = document.getElementById(prefix + 'EB'), iEl = document.getElementById(prefix + 'EI'), tEl = document.getElementById(prefix + 'EA');
    if (!bEl || !iEl || !tEl) return;
    const on = this._gDesgOn(prefix);
    bEl.readOnly = on; iEl.readOnly = on; tEl.readOnly = on;
    if (!on) return;
    const lines = this._gDesgRead(prefix);
    const base = roundMoney(lines.reduce((s, l) => s + l.base, 0)), iva = roundMoney(lines.reduce((s, l) => s + l.iva, 0));
    bEl.value = base || ''; iEl.value = iva || '';
    tEl.value = roundMoney(base + iva - (parseFloat(document.getElementById(prefix + 'ER')?.value) || 0)) || '';
  },
  _gDesgRead(prefix) {
    if (!this._gDesgOn(prefix)) return [];
    return [...document.querySelectorAll(`#${prefix}Desg .gdesg-row`)].map(row => ({
      tipoIva: parseInt(row.querySelector('.dT').value) || 0,
      base: parseFloat(row.querySelector('.dB').value) || 0,
      iva: parseFloat(row.querySelector('.dI').value) || 0
    })).filter(l => l.base > 0 || l.iva > 0);
  },
  /** Lee los importes de la ficha (prefijo g = gasto puntual, ge = entrada) y
   *  devuelve los campos de la entrada; con desglose (2+ filas), base/iva son la
   *  suma y `desglose` guarda cada tipo. Una sola fila no es desglose. */
  _gReadEntry(prefix, tipoIva, tipoIrpf) {
    const n = id => parseFloat(document.getElementById(prefix + id)?.value) || 0;
    let base = n('EB'), iva = n('EI'), total = n('EA');
    const irpf = n('ER');
    const lines = this._gDesgRead(prefix);
    let desglose;
    if (lines.length > 1) {
      desglose = lines;
      base = roundMoney(desglose.reduce((s, l) => s + l.base, 0));
      iva = roundMoney(desglose.reduce((s, l) => s + l.iva, 0));
      total = roundMoney(base + iva - irpf);
    }
    return { base, iva, irpf, total, tipoIva, tipoIrpf, desglose };
  },

  /** Al cambiar un tipo (IVA/IRPF) recalcula desde donde haya datos: si hay base
      se recalculan impuestos y total; si solo hay total, se desglosa hacia atrás. */
  _gCalcAuto(prefix = 'g') {
    const base = parseFloat(document.getElementById(prefix + 'EB')?.value) || 0;
    this._gCalc(base > 0 ? 'base' : 'total', prefix);
  },
  gModal(gid) {
    const isE = !!gid, g = isE ? D.g(gid) : null;
    const gColor = g?.color || 'Salmon';
    const isPuntual = !isE || !g?.recurrente || g.recurrente === 'no';
    const e0 = isPuntual && isE ? (g.entradas || [])[0] : null;
    const lines = e0?.desglose || [], ro = lines.length ? 'readonly' : '';
    const entryFields = `<div id="gEntryRow"${isPuntual ? '' : ' style="display:none"'}>`
      + `<div class="fr fr-3"><div class="fg"><label>${t('field.base')}</label><input type="number" id="gEB" min="0" step="0.01" value="${e0?.base ?? ''}" placeholder="0,00" ${ro} onchange="App._gCalc('base')"></div>`
      + `<div class="fg"><label>${t('field.ivaAmount')}</label><input type="number" id="gEI" min="0" step="0.01" value="${e0?.iva ?? ''}" placeholder="0,00" ${ro} onchange="App._gDesgCalc('g')"></div>`
      + `<div class="fg"><label>${t('field.irpfAmount')}</label><input type="number" id="gER" min="0" step="0.01" value="${e0?.irpf ?? ''}" placeholder="0,00" onchange="App._gDesgCalc('g')"></div></div>`
      + this._gDesgHtml('g', lines)
      + `<div class="fr"><div class="fg"><label>${t('field.totalAmount')}</label><input type="number" id="gEA" min="0.01" step="0.01" value="${e0?.total ?? e0?.cantidad ?? ''}" placeholder="0,00" ${ro} onchange="App._gCalc('total')"></div>`
      + `<div class="fg"><label>${t('field.date')}</label><input type="date" id="gED" value="${e0?.fecha || todayStr()}"></div></div>`
      + `<div class="fr"><div class="fg"><label>${t('field.numFactura')}</label><input type="text" id="gENF" value="${esc(e0?.numFactura || '')}" placeholder="${t('ph.optional')}"></div></div></div>`;
    const recurringFields = `<div id="gRecFields"${isPuntual ? ' style="display:none"' : ''}>`
      + `<div class="fr"><div class="fg"><label>${t('gas.baseAmount')}</label><input type="number" id="gIB" min="0" step="0.01" value="${g?.importeBase ?? ''}" placeholder="0,00"></div>`
      + `<div class="fg"><label>${t('gas.recurringDay')}</label><input type="number" id="gDR" min="1" max="31" value="${g?.diaRecurrente ?? ''}" placeholder="1-31"></div></div>`
      + `<p class="small" style="margin-top:-.4rem;color:var(--t3)">${t('gas.baseAmountHelp')}</p></div>`;
    this.om(`<div class="mt">${isE ? t('gas.editExpense') : t('gas.newExpense')}</div>`
      + `<div class="fg"><label>${t('field.name')}</label><input type="text" id="gN" value="${esc(g?.nombre || '')}" placeholder="${t('ph.expenseName')}"></div>`
      + `<div class="fr fr-3"><div class="fg"><label>${t('field.category')}</label><select id="gCat">${Object.entries(GASTO_CAT).map(([k, v]) => `<option value="${k}" ${g?.categoria === k ? 'selected' : ''}>${v}</option>`).join('')}</select></div>`
      + `<div class="fg"><label>${t('field.ivaRate')}</label><select id="gIva" onchange="App._gCalcAuto()">${Object.entries(TIPOS_IVA).map(([k, v]) => `<option value="${k}" ${(g?.tipoIva ?? 21) == k ? 'selected' : ''}>${v}</option>`).join('')}</select></div>`
      + `<div class="fg"><label>${t('field.irpfRate')}</label><input type="number" id="gIrpf" min="0" max="100" step="1" value="${g?.tipoIrpf || ''}" placeholder="0" onchange="App._gCalcAuto()"></div></div>`
      + `<div class="fr"><div class="fg"><label>${t('field.recurrence')}</label><select id="gRec" onchange="App._toggleGasRec(this.value)">${Object.entries(RECURRENCIA).map(([k, v]) => `<option value="${k}" ${g?.recurrente === k ? 'selected' : ''}>${v}</option>`).join('')}</select></div>`
      + `<div class="fg" style="display:flex;align-items:end"><label style="display:flex;align-items:center;gap:.5rem;cursor:pointer;padding:.45rem 0"><input type="checkbox" id="gDes" ${g?.desgravable ? 'checked' : ''}> ${t('gas.deductibleBadge')}</label></div></div>`
      + `<div class="fr"><div class="fg"><label>${t('gas.zonaProveedor')}</label><select id="gZona" onchange="document.getElementById('gZonaHelp').style.display = this.value === 'es' ? 'none' : ''">${Object.entries(ZONA_FISCAL).map(([k, v]) => `<option value="${k}" ${(g?.zonaFiscal || 'es') === k ? 'selected' : ''}>${v}</option>`).join('')}</select></div>`
      + `<div class="fg"><label>${t('field.nifProveedor')}</label><input type="text" id="gNif" value="${esc(g?.nifProveedor || '')}" placeholder="${t('ph.optional')}"></div></div>`
      + `<p class="small" id="gZonaHelp" style="color:var(--t3);margin:-.4rem 0 .6rem${(g?.zonaFiscal || 'es') === 'es' ? ';display:none' : ''}">${t('gas.zonaHelp')}</p>`
      + recurringFields
      + entryFields
      + (isE && g?.finHasta ? `<div class="fg"><label style="display:flex;align-items:center;gap:.5rem;cursor:pointer"><input type="checkbox" id="gReact"> ${t('gas.reactivate')}</label></div>` : '')
      + `<div class="fg"><label>${t('field.color')}</label>${this.colorSelect(gColor)}</div>`
      + `<div class="fg"><label>${t('field.notes')}</label><textarea id="gNo" placeholder="${t('ph.notes')}">${esc(g?.notas || '')}</textarea></div>`
      + `<div class="ma"><button class="bt" onclick="App.cm()">${t('btn.cancel')}</button><button class="bt bt-p" onclick="App.saveG('${gid || ''}')">${isE ? t('btn.save') : t('btn.create')}</button></div>`);
  },

  /** Toggle de campos recurrentes/puntuales en gModal según el select de recurrencia */
  _toggleGasRec(val) {
    const isPunt = val === 'no';
    const recF = document.getElementById('gRecFields');
    const entF = document.getElementById('gEntryRow');
    if (recF) recF.style.display = isPunt ? 'none' : '';
    if (entF) entF.style.display = isPunt ? '' : 'none';
  },

  saveG(gid) {
    const nombre = document.getElementById('gN').value.trim();
    if (!nombre) { Toast.warn(t('msg.nameRequired')); return; }
    const color = document.getElementById('mpColor')?.value || 'Salmon';
    const recurrente = document.getElementById('gRec').value;
    const importeBase = parseFloat(document.getElementById('gIB')?.value);
    const diaRecurrente = parseInt(document.getElementById('gDR')?.value);
    const data = { nombre, categoria: document.getElementById('gCat').value, recurrente, color, notas: document.getElementById('gNo').value.trim(), desgravable: document.getElementById('gDes').checked, tipoIva: ((v) => isNaN(v) ? 21 : v)(parseInt(document.getElementById('gIva').value)), tipoIrpf: ((v) => isNaN(v) || v < 0 ? 0 : v)(parseFloat(document.getElementById('gIrpf')?.value)), zonaFiscal: document.getElementById('gZona').value, nifProveedor: document.getElementById('gNif').value.trim() };
    if (recurrente !== 'no') {
      if (!isNaN(importeBase) && importeBase > 0) data.importeBase = roundMoney(importeBase);
      else data.importeBase = null;
      if (!isNaN(diaRecurrente) && diaRecurrente >= 1 && diaRecurrente <= 31) data.diaRecurrente = diaRecurrente;
      else data.diaRecurrente = null;
    }
    if (gid) {
      const g = D.g(gid);
      const wasPuntual = !g?.recurrente || g.recurrente === 'no';
      if (data.recurrente === 'no' && wasPuntual) {
        const imp = this._gReadEntry('g', data.tipoIva, data.tipoIrpf);
        const fecha = document.getElementById('gED')?.value || todayStr();
        const numFactura = document.getElementById('gENF')?.value.trim() || '';
        const entradas = g?.entradas ? [...g.entradas] : [];
        if (imp.total > 0) {
          if (entradas[0]) { Object.assign(entradas[0], imp, { fecha, numFactura }); }
          else entradas.push({ id: uid(), fecha, ...imp, nota: '', numFactura });
        }
        data.entradas = entradas;
      }
      if (document.getElementById('gReact')?.checked) data.finHasta = null;
      D.upG(gid, data);
    } else {
      data.id = uid(); data.entradas = [];
      const imp = this._gReadEntry('g', data.tipoIva, data.tipoIrpf);
      if (imp.total > 0) {
        data.entradas.push({ id: uid(), fecha: document.getElementById('gED')?.value || todayStr(), ...imp, nota: '', numFactura: document.getElementById('gENF')?.value.trim() || '' });
      }
      D.addG(data);
    }
    this.cm(); this.rGas();
  },

  delG(gid) { const g = D.g(gid); if (!g) return; if (!confirm(t('gas.deleteConfirm', g.nombre))) return; D.delG(gid); this.rGas(); },

  geModal(gid, eid) {
    const isE = !!eid;
    const e = isE ? (D.g(gid)?.entradas || []).find(x => x.id === eid) : null;
    const gasto = D.g(gid);
    const isRecurrente = gasto && gasto.recurrente && gasto.recurrente !== 'no';
    const tipoIva = gasto?.tipoIva ?? 21;
    const tipoIrpf = gasto?.tipoIrpf || 0;
    /* Pre-rellenar con importeBase si es entrada nueva en gasto recurrente
       (importeBase = total de la factura, ya con la retención descontada) */
    let prefillBase = '', prefillIva = '', prefillIrpf = '', prefillTotal = '';
    if (!isE && isRecurrente && gasto.importeBase) {
      prefillTotal = roundMoney(gasto.importeBase);
      const d = B.desglosarTotal(prefillTotal, tipoIva, tipoIrpf);
      prefillBase = d.base; prefillIva = d.importeIva; prefillIrpf = d.importeIrpf;
    }
    const lines = e?.desglose || [], ro = lines.length ? 'readonly' : '';
    const valBase = e?.base ?? prefillBase;
    const valIva = e?.iva ?? prefillIva;
    const valIrpf = e?.irpf ?? prefillIrpf;
    const valTotal = e?.total ?? e?.cantidad ?? prefillTotal;
    this.om(`<div class="mt">${isE ? t('gas.editEntry') : t('gas.addEntry')}</div>`
      + `<div class="fr fr-3"><div class="fg"><label>${t('field.base')}</label><input type="number" id="geEB" min="0" step="0.01" value="${valBase}" placeholder="0,00" ${ro} onchange="App._gCalc('base','ge')"></div>`
      + `<div class="fg"><label>${t('field.ivaAmount')}</label><input type="number" id="geEI" min="0" step="0.01" value="${valIva}" placeholder="0,00" ${ro} onchange="App._gDesgCalc('ge')"></div>`
      + `<div class="fg"><label>${t('field.irpfAmount')}</label><input type="number" id="geER" min="0" step="0.01" value="${valIrpf}" placeholder="0,00" onchange="App._gDesgCalc('ge')"></div></div>`
      + `<input type="hidden" id="geIva" value="${tipoIva}"><input type="hidden" id="geIrpf" value="${tipoIrpf}">`
      + this._gDesgHtml('ge', lines)
      + `<div class="fr"><div class="fg"><label>${t('field.totalAmount')}</label><input type="number" id="geEA" min="0.01" step="0.01" value="${valTotal}" placeholder="0,00" ${ro} onchange="App._gCalc('total','ge')"></div>`
      + `<div class="fg"><label>${t('field.date')}</label><input type="date" id="geD" value="${e?.fecha || todayStr()}"></div></div>`
      + `<div class="fr"><div class="fg"><label>${t('field.note')}</label><input type="text" id="geN" value="${esc(e?.nota || '')}" placeholder="${t('ph.detail')}"></div>`
      + `<div class="fg"><label>${t('field.numFactura')}</label><input type="text" id="geNF" value="${esc(e?.numFactura || '')}" placeholder="${t('ph.optional')}"></div></div>`
      + (isRecurrente && !isE ? `<div class="fg"><label style="display:flex;align-items:center;gap:.5rem;cursor:pointer"><input type="checkbox" id="geUlt"> ${t('gas.lastMonth')}</label></div>` : '')
      + `<div class="ma"><button class="bt" onclick="App.cm()">${t('btn.cancel')}</button><button class="bt bt-p" onclick="App.saveGE('${gid}','${eid || ''}')">${isE ? t('btn.save') : t('btn.add')}</button></div>`);
  },

  saveGE(gid, eid) {
    const g = D.g(gid); if (!g) return;
    const imp = this._gReadEntry('ge', g.tipoIva || 0, g.tipoIrpf || 0);
    if (imp.total <= 0) return;
    if (!g.entradas) g.entradas = [];
    const fecha = document.getElementById('geD').value || todayStr();
    const nota = document.getElementById('geN').value.trim();
    const numFactura = document.getElementById('geNF').value.trim();
    if (eid) {
      const e = g.entradas.find(x => x.id === eid);
      if (e) { Object.assign(e, imp, { fecha, nota, numFactura }); }
    } else {
      g.entradas.push({ id: uid(), fecha, ...imp, nota, numFactura });
    }
    const update = { entradas: g.entradas };
    const ultCheck = document.getElementById('geUlt');
    if (ultCheck?.checked) update.finHasta = fecha.substring(0, 7);
    D.upG(gid, update); this.cm(); this.rGas();
  },

  delGE(gid, eid) {
    const g = D.g(gid); if (!g) return;
    g.entradas = (g.entradas || []).filter(e => e.id !== eid);
    D.upG(gid, { entradas: g.entradas }); this.rGas();
  },

  /** Añade una entrada del mes actual a un gasto recurrente usando importeBase como semilla */
  quickAddRecurring(gid) {
    const g = D.g(gid); if (!g) return;
    if (!g.importeBase || g.importeBase <= 0) {
      /* Si no hay importeBase configurado, abrir geModal normal */
      this.geModal(gid);
      return;
    }
    const tipoIva = g.tipoIva || 0;
    const tipoIrpf = g.tipoIrpf || 0;
    const total = roundMoney(g.importeBase);
    const { base, importeIva: iva, importeIrpf: irpf } = B.desglosarTotal(total, tipoIva, tipoIrpf);
    const fecha = todayStr();
    if (!g.entradas) g.entradas = [];
    g.entradas.push({ id: uid(), fecha, base, iva, irpf, total, tipoIva, tipoIrpf, nota: '' });
    D.upG(gid, { entradas: g.entradas });
    Toast.ok(t('gas.entryAdded'));
    this.rGas();
  }

});
