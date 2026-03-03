/* ================================================
 * TRACKR — App: Vista Gastos
 * Globales: extiende App
 * Dependencias: app.js (App base), utils.js, store.js, lang.js
 * ================================================ */

Object.assign(App, {

  rGas() {
    const gastos = D.gs();
    const c = document.getElementById('gasC');
    if (!gastos.length) { c.innerHTML = `<div class="es"><div class="tx">${t('gas.noExpenses')}</div></div>`; return; }

    const now = new Date();
    const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const thisYear = now.getFullYear();
    let totalMes = 0, totalAnio = 0;
    gastos.forEach(g => { (g.entradas || []).forEach(e => { if (!e.fecha) return; if (e.fecha.startsWith(thisMonth)) totalMes += e.cantidad || 0; if (e.fecha.startsWith(String(thisYear))) totalAnio += e.cantidad || 0; }); });

    let html = `<div class="gas-summary"><div class="sc"><div class="sc-l">${t('gas.thisMonth')}</div><div class="sc-v m">${fmtMoney(totalMes)}</div></div><div class="sc"><div class="sc-l">${t('gas.thisYear')}</div><div class="sc-v m">${fmtMoney(totalAnio)}</div></div></div>`;
    html += '<div class="gas-list">';
    gastos.forEach(g => {
      const total = (g.entradas || []).reduce((s, e) => s + (e.cantidad || 0), 0);
      const count = (g.entradas || []).length;
      const catLabel = GASTO_CAT[g.categoria] || g.categoria || 'Otro';
      const gHex = colorHex(g.color || 'Salmon');
      html += `<div class="gas-card" style="border-left:3px solid ${gHex}"><div class="gas-header" onclick="this.nextElementSibling.classList.toggle('open')">`
        + `<span class="gas-name">${esc(g.nombre)}</span><span class="gas-cat">${catLabel}</span>`
        + `${g.recurrente && g.recurrente !== 'no' ? `<span class="gas-rec">${RECURRENCIA[g.recurrente]}</span>` : ''}`
        + `<span class="gas-total m">${fmtMoney(total)}</span><span class="gas-count">${count} ${t('gas.entries')}</span>`
        + `<div class="gas-actions"><button class="cl-btn" onclick="event.stopPropagation();App.gModal('${g.id}')" title="${t('btn.edit')}">&#9998;</button><button class="cl-btn cl-btn-del" onclick="event.stopPropagation();App.delG('${g.id}')" title="${t('btn.delete')}">&times;</button></div>`
        + `</div><div class="gas-body">`;
      if (count) {
        (g.entradas || []).sort((a, b) => (b.fecha || '').localeCompare(a.fecha || '')).forEach(e => {
          html += `<div class="gas-entry"><span class="gas-e-date">${fmtDate(e.fecha)}</span><span class="gas-e-amount m">${fmtMoney(e.cantidad || 0)}</span><span class="gas-e-nota">${esc(e.nota || '')}</span><button class="gas-e-del" onclick="App.delGE('${g.id}','${e.id}')" title="${t('btn.delete')}">&times;</button></div>`;
        });
      }
      html += `<button class="bt bt-add" style="margin-top:.5rem" onclick="App.geModal('${g.id}')">${t('btn.addEntry')}</button></div></div>`;
    });
    html += '</div>';
    c.innerHTML = html;
  },

  gModal(gid) {
    const isE = !!gid, g = isE ? D.g(gid) : null;
    const gColor = g?.color || 'Salmon';
    this.om(`<div class="mt">${isE ? t('gas.editExpense') : t('gas.newExpense')}</div>`
      + `<div class="fg"><label>${t('field.name')}</label><input type="text" id="gN" value="${esc(g?.nombre || '')}" placeholder="${t('ph.expenseName')}"></div>`
      + `<div class="fr"><div class="fg"><label>${t('field.category')}</label><select id="gCat">${Object.entries(GASTO_CAT).map(([k, v]) => `<option value="${k}" ${g?.categoria === k ? 'selected' : ''}>${v}</option>`).join('')}</select></div>`
      + `<div class="fg"><label>${t('field.recurrence')}</label><select id="gRec">${Object.entries(RECURRENCIA).map(([k, v]) => `<option value="${k}" ${g?.recurrente === k ? 'selected' : ''}>${v}</option>`).join('')}</select></div></div>`
      + `<div class="fg"><label>${t('field.color')}</label>${this.colorSelect(gColor)}</div>`
      + `<div class="fg"><label>${t('field.notes')}</label><textarea id="gNo" placeholder="${t('ph.notes')}">${esc(g?.notas || '')}</textarea></div>`
      + `<div class="ma"><button class="bt" onclick="App.cm()">${t('btn.cancel')}</button><button class="bt bt-p" onclick="App.saveG('${gid || ''}')">${isE ? t('btn.save') : t('btn.create')}</button></div>`);
  },

  saveG(gid) {
    const nombre = document.getElementById('gN').value.trim();
    if (!nombre) { Toast.warn(t('msg.nameRequired')); return; }
    const color = document.getElementById('mpColor')?.value || 'Salmon';
    const data = { nombre, categoria: document.getElementById('gCat').value, recurrente: document.getElementById('gRec').value, color, notas: document.getElementById('gNo').value.trim() };
    if (gid) D.upG(gid, data); else { data.id = uid(); data.entradas = []; D.addG(data); }
    this.cm(); this.rGas();
  },

  delG(gid) { const g = D.g(gid); if (!g) return; if (!confirm(t('gas.deleteConfirm', g.nombre))) return; D.delG(gid); this.rGas(); },

  geModal(gid) {
    this.om(`<div class="mt">${t('gas.addEntry')}</div>`
      + `<div class="fr"><div class="fg"><label>${t('field.amountEntry')}</label><input type="number" id="geA" min="0.01" step="0.01" value="" placeholder="0,00"></div>`
      + `<div class="fg"><label>${t('field.date')}</label><input type="date" id="geD" value="${todayStr()}"></div></div>`
      + `<div class="fg"><label>${t('field.note')}</label><input type="text" id="geN" placeholder="${t('ph.detail')}"></div>`
      + `<div class="ma"><button class="bt" onclick="App.cm()">${t('btn.cancel')}</button><button class="bt bt-p" onclick="App.saveGE('${gid}')">${t('btn.add')}</button></div>`);
  },

  saveGE(gid) {
    const cant = parseFloat(document.getElementById('geA').value) || 0;
    if (cant <= 0) return;
    const g = D.g(gid); if (!g) return;
    if (!g.entradas) g.entradas = [];
    g.entradas.push({ id: uid(), fecha: document.getElementById('geD').value || null, cantidad: cant, nota: document.getElementById('geN').value.trim() });
    D.upG(gid, { entradas: g.entradas }); this.cm(); this.rGas();
  },

  delGE(gid, eid) {
    const g = D.g(gid); if (!g) return;
    g.entradas = (g.entradas || []).filter(e => e.id !== eid);
    D.upG(gid, { entradas: g.entradas }); this.rGas();
  }

});
