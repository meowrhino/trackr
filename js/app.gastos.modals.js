/* ================================================
 * TRACKR — App: Modales de Gastos (crear/editar gasto y entradas)
 *
 * Extiende el objeto global App (definido en app.js, cargado antes).
 * Modales: gModal/saveG/delG (gasto), geModal/saveGE/delGE (entrada),
 * quickAddRecurring, _gCalc, _toggleGasRec. Comparte App.rGas() (render,
 * en app.gastos.js) en runtime -> separacion segura.
 * Deps globales: D, T, Toast, t, roundMoney, todayStr, uid, ...
 * ================================================ */
Object.assign(App, {
  /* ══════════════════════════════════════
   *  MODALES GASTOS
   * ══════════════════════════════════════ */

  /* Auto-calc base↔total en modales de gasto (prefijos: g = gasto puntual, ge = entrada) */
  _gCalc(from, prefix = 'g') {
    const bEl = document.getElementById(prefix + 'EB');
    const iEl = document.getElementById(prefix + 'EI');
    const tEl = document.getElementById(prefix + 'EA');
    const ivaSelEl = document.getElementById(prefix === 'g' ? 'gIva' : 'geIva');
    const rate = ivaSelEl ? (parseInt(ivaSelEl.value) || 0) / 100 : 0.21;
    if (from === 'total') {
      const total = parseFloat(tEl.value) || 0;
      const iva = roundMoney(total * rate / (1 + rate));
      bEl.value = roundMoney(total - iva) || '';
      iEl.value = iva || '';
    } else {
      const base = parseFloat(bEl.value) || 0;
      const iva = roundMoney(base * rate);
      iEl.value = iva || '';
      tEl.value = roundMoney(base + iva) || '';
    }
  },
  gModal(gid) {
    const isE = !!gid, g = isE ? D.g(gid) : null;
    const gColor = g?.color || 'Salmon';
    const isPuntual = !isE || !g?.recurrente || g.recurrente === 'no';
    const e0 = isPuntual && isE ? (g.entradas || [])[0] : null;
    const entryFields = `<div id="gEntryRow"${isPuntual ? '' : ' style="display:none"'}>`
      + `<div class="fr"><div class="fg"><label>${t('field.base')}</label><input type="number" id="gEB" min="0" step="0.01" value="${e0?.base ?? ''}" placeholder="0,00" onchange="App._gCalc('base')"></div>`
      + `<div class="fg"><label>${t('field.ivaAmount')}</label><input type="number" id="gEI" min="0" step="0.01" value="${e0?.iva ?? ''}" placeholder="0,00"></div></div>`
      + `<div class="fr"><div class="fg"><label>${t('field.totalAmount')}</label><input type="number" id="gEA" min="0.01" step="0.01" value="${e0?.total ?? e0?.cantidad ?? ''}" placeholder="0,00" onchange="App._gCalc('total')"></div>`
      + `<div class="fg"><label>${t('field.date')}</label><input type="date" id="gED" value="${e0?.fecha || todayStr()}"></div></div></div>`;
    const recurringFields = `<div id="gRecFields"${isPuntual ? ' style="display:none"' : ''}>`
      + `<div class="fr"><div class="fg"><label>${t('gas.baseAmount')}</label><input type="number" id="gIB" min="0" step="0.01" value="${g?.importeBase ?? ''}" placeholder="0,00"></div>`
      + `<div class="fg"><label>${t('gas.recurringDay')}</label><input type="number" id="gDR" min="1" max="31" value="${g?.diaRecurrente ?? ''}" placeholder="1-31"></div></div>`
      + `<p class="small" style="margin-top:-.4rem;color:var(--t3)">${t('gas.baseAmountHelp')}</p></div>`;
    this.om(`<div class="mt">${isE ? t('gas.editExpense') : t('gas.newExpense')}</div>`
      + `<div class="fg"><label>${t('field.name')}</label><input type="text" id="gN" value="${esc(g?.nombre || '')}" placeholder="${t('ph.expenseName')}"></div>`
      + `<div class="fr"><div class="fg"><label>${t('field.category')}</label><select id="gCat">${Object.entries(GASTO_CAT).map(([k, v]) => `<option value="${k}" ${g?.categoria === k ? 'selected' : ''}>${v}</option>`).join('')}</select></div>`
      + `<div class="fg"><label>${t('field.ivaRate')}</label><select id="gIva" onchange="App._gCalc('total')">${Object.entries(TIPOS_IVA).map(([k, v]) => `<option value="${k}" ${(g?.tipoIva ?? 21) == k ? 'selected' : ''}>${v}</option>`).join('')}</select></div></div>`
      + `<div class="fr"><div class="fg"><label>${t('field.recurrence')}</label><select id="gRec" onchange="App._toggleGasRec(this.value)">${Object.entries(RECURRENCIA).map(([k, v]) => `<option value="${k}" ${g?.recurrente === k ? 'selected' : ''}>${v}</option>`).join('')}</select></div>`
      + `<div class="fg" style="display:flex;align-items:end"><label style="display:flex;align-items:center;gap:.5rem;cursor:pointer;padding:.45rem 0"><input type="checkbox" id="gDes" ${g?.desgravable ? 'checked' : ''}> ${t('gas.deductibleBadge')}</label></div></div>`
      + `<div class="fr"><div class="fg"><label>${t('gas.zonaProveedor')}</label><select id="gZona" onchange="document.getElementById('gZonaHelp').style.display = this.value === 'es' ? 'none' : ''">${Object.entries(ZONA_FISCAL).map(([k, v]) => `<option value="${k}" ${(g?.zonaFiscal || 'es') === k ? 'selected' : ''}>${v}</option>`).join('')}</select></div>`
      + `<div class="fg" style="align-self:end"><p class="small" id="gZonaHelp" style="color:var(--t3);margin:0${(g?.zonaFiscal || 'es') === 'es' ? ';display:none' : ''}">${t('gas.zonaHelp')}</p></div></div>`
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
    const data = { nombre, categoria: document.getElementById('gCat').value, recurrente, color, notas: document.getElementById('gNo').value.trim(), desgravable: document.getElementById('gDes').checked, tipoIva: ((v) => isNaN(v) ? 21 : v)(parseInt(document.getElementById('gIva').value)), zonaFiscal: document.getElementById('gZona').value };
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
        const total = parseFloat(document.getElementById('gEA')?.value) || 0;
        const base = parseFloat(document.getElementById('gEB')?.value) || 0;
        const iva = parseFloat(document.getElementById('gEI')?.value) || 0;
        const fecha = document.getElementById('gED')?.value || todayStr();
        const entradas = g?.entradas ? [...g.entradas] : [];
        if (total > 0) {
          if (entradas[0]) { Object.assign(entradas[0], { base, iva, total, cantidad: total, tipoIva: data.tipoIva, fecha }); }
          else entradas.push({ id: uid(), fecha, base, iva, total, cantidad: total, tipoIva: data.tipoIva, nota: '' });
        }
        data.entradas = entradas;
      }
      if (document.getElementById('gReact')?.checked) data.finHasta = null;
      D.upG(gid, data);
    } else {
      data.id = uid(); data.entradas = [];
      const initTotal = parseFloat(document.getElementById('gEA')?.value) || 0;
      if (initTotal > 0) {
        const initBase = parseFloat(document.getElementById('gEB')?.value) || 0;
        const initIva = parseFloat(document.getElementById('gEI')?.value) || 0;
        data.entradas.push({ id: uid(), fecha: document.getElementById('gED')?.value || todayStr(), base: initBase, iva: initIva, total: initTotal, cantidad: initTotal, tipoIva: data.tipoIva, nota: '' });
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
    /* Pre-rellenar con importeBase si es entrada nueva en gasto recurrente */
    let prefillBase = '', prefillIva = '', prefillTotal = '';
    if (!isE && isRecurrente && gasto.importeBase) {
      const rate = (tipoIva || 0) / 100;
      prefillTotal = roundMoney(gasto.importeBase);
      prefillIva = rate > 0 ? roundMoney(prefillTotal * rate / (1 + rate)) : 0;
      prefillBase = roundMoney(prefillTotal - prefillIva);
    }
    const valBase = e?.base ?? prefillBase;
    const valIva = e?.iva ?? prefillIva;
    const valTotal = e?.total ?? e?.cantidad ?? prefillTotal;
    this.om(`<div class="mt">${isE ? t('gas.editEntry') : t('gas.addEntry')}</div>`
      + `<div class="fr"><div class="fg"><label>${t('field.base')}</label><input type="number" id="geEB" min="0" step="0.01" value="${valBase}" placeholder="0,00" onchange="App._gCalc('base','ge')"></div>`
      + `<div class="fg"><label>${t('field.ivaAmount')}</label><input type="number" id="geEI" min="0" step="0.01" value="${valIva}" placeholder="0,00"></div></div>`
      + `<input type="hidden" id="geIva" value="${tipoIva}">`
      + `<div class="fr"><div class="fg"><label>${t('field.totalAmount')}</label><input type="number" id="geEA" min="0.01" step="0.01" value="${valTotal}" placeholder="0,00" onchange="App._gCalc('total','ge')"></div>`
      + `<div class="fg"><label>${t('field.date')}</label><input type="date" id="geD" value="${e?.fecha || todayStr()}"></div></div>`
      + `<div class="fg"><label>${t('field.note')}</label><input type="text" id="geN" value="${esc(e?.nota || '')}" placeholder="${t('ph.detail')}"></div>`
      + (isRecurrente && !isE ? `<div class="fg"><label style="display:flex;align-items:center;gap:.5rem;cursor:pointer"><input type="checkbox" id="geUlt"> ${t('gas.lastMonth')}</label></div>` : '')
      + `<div class="ma"><button class="bt" onclick="App.cm()">${t('btn.cancel')}</button><button class="bt bt-p" onclick="App.saveGE('${gid}','${eid || ''}')">${isE ? t('btn.save') : t('btn.add')}</button></div>`);
  },

  saveGE(gid, eid) {
    const total = parseFloat(document.getElementById('geEA').value) || 0;
    if (total <= 0) return;
    const g = D.g(gid); if (!g) return;
    if (!g.entradas) g.entradas = [];
    const base = parseFloat(document.getElementById('geEB').value) || 0;
    const iva = parseFloat(document.getElementById('geEI').value) || 0;
    const fecha = document.getElementById('geD').value || todayStr();
    const nota = document.getElementById('geN').value.trim();
    const tipoIva = g.tipoIva || 0;
    if (eid) {
      const e = g.entradas.find(x => x.id === eid);
      if (e) { Object.assign(e, { fecha, base, iva, total, cantidad: total, tipoIva, nota }); }
    } else {
      g.entradas.push({ id: uid(), fecha, base, iva, total, cantidad: total, tipoIva, nota });
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
    const rate = tipoIva / 100;
    const total = roundMoney(g.importeBase);
    const iva = rate > 0 ? roundMoney(total * rate / (1 + rate)) : 0;
    const base = roundMoney(total - iva);
    const fecha = todayStr();
    if (!g.entradas) g.entradas = [];
    g.entradas.push({ id: uid(), fecha, base, iva, total, cantidad: total, tipoIva, nota: '' });
    D.upG(gid, { entradas: g.entradas });
    Toast.ok(t('gas.entryAdded'));
    this.rGas();
  }

});
