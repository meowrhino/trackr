/* ================================================
 * TRACKR — App: Vista Detalle de Proyecto + Horas
 * Globales: extiende App
 * Dependencias: app.js (App base), utils.js, store.js,
 *               billing.js, colors.js
 * ================================================ */

Object.assign(App, {

  rDet(idOr) {
    const id = typeof idOr === 'string' ? idOr : this.cp;
    this.cp = id;
    const p = D.p(id);
    if (!p) { this.go('dash'); return; }
    B.calc(p);

    const th = p.horas.reduce((s, h) => s + h.cantidad, 0);
    const wh = p.horas.filter(h => h.tipo === 'trabajo').reduce((s, h) => s + h.cantidad, 0);
    const mh = p.horas.filter(h => h.tipo === 'reunion').reduce((s, h) => s + h.cantidad, 0);
    const eph = B.eph(p);
    const hex = colorHex(p.color);
    const cn = clienteName(p);
    const f = p.facturacion;

    const hHtml = !p.horas.length
      ? '<div class="es"><div class="tx">Sin horas</div></div>'
      : `<div class="hl">${p.horas.map(h =>
          `<div class="hr hr-click" style="border-left-color:${hex}" onclick="App.eHour('${p.id}','${h.id}')">
            <span class="hr-t">${h.tipo === 'trabajo' ? '💻' : '👥'}</span>
            <span class="hr-d">${fmtDate(h.fecha)}${h.horaInicio ? ' ' + h.horaInicio : ''}</span>
            <span class="hr-a m">${h.cantidad}h</span>
            <span class="hr-n">${esc(h.nota || '')}</span>
            <span class="hr-x" onclick="event.stopPropagation();App.xHour('${p.id}','${h.id}')" title="Eliminar">&times;</span>
          </div>`).join('')}</div>`;

    const bHtml = f.modo === 'gratis'
      ? '<div style="color:var(--t3);font-size:.85rem">Proyecto gratuito</div>'
      : `<div class="bb">
          <div class="br"><span class="la">Base imponible</span><span class="va">${fmtMoney(f.baseImponible || 0)}</span></div>
          ${f.iva ? `<div class="br"><span class="la">+ IVA (${f.iva}%)</span><span class="va">${fmtMoney(f.importeIva || 0)}</span></div>` : ''}
          ${f.irpf ? `<div class="br"><span class="la">- IRPF (${f.irpf}%)</span><span class="va">${fmtMoney(f.importeIrpf || 0)}</span></div>` : ''}
          <div class="br tot"><span class="la">Total factura</span><span class="va">${fmtMoney(f.totalFactura || 0)}</span></div>
          <div class="br"><span class="la">Neto a recibir</span><span class="va" style="color:var(--ok)">${fmtMoney(f.netoRecibido || 0)}</span></div>
          ${f.gastos ? `<div class="br"><span class="la">Gastos</span><span class="va" style="color:var(--bad)">-${fmtMoney(f.gastos)}</span></div>` : ''}
          ${eph !== null ? `<div class="br"><span class="la">Rentabilidad</span><span class="va" style="color:${eph >= 30 ? 'var(--ok)' : eph >= 15 ? 'var(--warn)' : 'var(--bad)'}">${eph.toFixed(2)} &euro;/h</span></div>` : ''}
        </div>`;

    let flagsHtml = '';
    if (p.interno) flagsHtml += ' <span class="pc-flag pc-flag-int">interno</span>';
    if (p.recurrente) flagsHtml += ' <span class="pc-flag pc-flag-rec">recurrente</span>';

    document.getElementById('detC').innerHTML =
      `<div class="db" onclick="App.go('dash')">&larr; proyectos</div>`
      + `<div class="dh"><div><div class="dt" style="color:${hex}">${esc(p.nombre)}</div><div class="dc">${esc(cn)}${flagsHtml}</div></div>`
      + `<div class="bg"><span class="bd bd-${p.estado}">${EST[p.estado] || p.estado}</span>`
      +   `<button class="bt bt-s" onclick="App.pModal('${p.id}')">Editar</button>`
      +   `${f.modo !== 'gratis' ? `<button class="bt bt-s" onclick="App.facModal('${p.id}')">Factura</button>` : ''}`
      +   `<button class="bt bt-s bt-d" onclick="App.xProj('${p.id}')">Eliminar</button></div></div>`
      + `<div class="ds"><div class="dst">Info</div><div class="dg">`
      +   `<div><div class="dfl">Inicio</div><div class="dfv">${fmtDate(p.fechas.inicio)}</div></div>`
      +   `<div><div class="dfl">Fin estimada</div><div class="dfv">${fmtDate(p.fechas.finEstimada)}</div></div>`
      +   `<div><div class="dfl">Fin real</div><div class="dfv">${fmtDate(p.fechas.finReal)}</div></div>`
      +   `<div><div class="dfl">Horas</div><div class="dfv">${th.toFixed(1)}h <span style="color:var(--t3);font-size:.72rem">💻${wh.toFixed(1)} 👥${mh.toFixed(1)}</span></div></div>`
      + `</div>${p.notas ? `<div style="margin-top:.75rem"><div class="dfl">Notas</div><div style="color:var(--t3);font-size:.85rem">${esc(p.notas)}</div></div>` : ''}</div>`
      + `<div class="ds"><div style="display:flex;justify-content:space-between;align-items:center"><div class="dst" style="border:none;margin:0;padding:0">Horas</div><button class="bt bt-add" onclick="App.hModal('${p.id}')">+ Añadir</button></div>${hHtml}</div>`
      + `<div class="ds"><div class="dst">Facturación</div>${bHtml}`
      + `${f.pagado ? `<div style="margin-top:.5rem;font-size:.82rem;color:var(--ok)">Pagado${f.fechaPago ? ' el ' + fmtDate(f.fechaPago) : ''}</div>` : ''}`
      + `${f.facturaFecha ? `<div style="margin-top:.3rem;font-size:.78rem;color:var(--t3)">Factura n.º ${String(f.facturaNum).padStart(4, '0')} — ${fmtDate(f.facturaFecha)}</div>` : ''}`
      + `</div>`;
  },

  eHour(pid, hid) {
    const p = D.p(pid); if (!p) return;
    const h = p.horas.find(x => x.id === hid); if (!h) return;
    const noDate = !h.fecha;

    this.om(
      `<div class="mt">Editar hora</div>`
      + `<label>Tipo</label>`
      + `<div class="ts2">`
      +   `<div class="to ${h.tipo === 'trabajo' ? 'on' : ''}" data-type="trabajo" onclick="App.selT(this)"><span class="ic">💻</span><span class="la">Trabajo</span></div>`
      +   `<div class="to ${h.tipo === 'reunion' ? 'on' : ''}" data-type="reunion" onclick="App.selT(this)"><span class="ic">👥</span><span class="la">Reunión</span></div>`
      + `</div>`
      + `<div class="fr"><div class="fg"><label>Horas</label><input type="number" id="ehA" min="0.25" step="0.25" value="${h.cantidad}"></div>`
      +   `<div class="fg"><label>Fecha</label><input type="date" id="ehD" value="${h.fecha || ''}" ${noDate ? 'disabled' : ''}>`
      +   `<label style="margin-top:.35rem;display:flex;align-items:center;gap:.4rem;cursor:pointer;text-transform:none;letter-spacing:0"><input type="checkbox" id="ehNd" ${noDate ? 'checked' : ''} onchange="document.getElementById('ehD').disabled=this.checked;if(this.checked)document.getElementById('ehD').value=''" style="width:auto;accent-color:var(--t2)"> Sin fecha</label></div></div>`
      + `<div class="fr"><div class="fg"><label>Hora inicio</label><input type="time" id="ehHI" value="${h.horaInicio || ''}"></div><div class="fg"></div></div>`
      + `<div class="fg"><label>Nota</label><input type="text" id="ehN" value="${esc(h.nota || '')}"></div>`
      + `<div class="ma"><button class="bt" onclick="App.cm()">Cancelar</button><button class="bt bt-p" onclick="App.saveEH('${pid}','${hid}')">Guardar</button></div>`
    );
  },

  saveEH(pid, hid) {
    const p = D.p(pid); if (!p) return;
    const h = p.horas.find(x => x.id === hid); if (!h) return;
    h.tipo = document.querySelector('#mC .to.on')?.dataset.type || h.tipo;
    h.cantidad = parseFloat(document.getElementById('ehA').value) || h.cantidad;
    const sinFecha = document.getElementById('ehNd')?.checked;
    h.fecha = sinFecha ? null : (document.getElementById('ehD').value || null);
    h.horaInicio = document.getElementById('ehHI').value || null;
    h.nota = document.getElementById('ehN').value.trim();
    sortHoras(p.horas);
    D.up(pid, { horas: p.horas });
    this.cm();
    if (this.cv === 'cal') this.rCal(); else this.rDet(pid);
  },

  xHour(pid, hid) {
    const p = D.p(pid); if (!p) return;
    if (!confirm('¿Eliminar esta entrada de horas?')) return;
    p.horas = p.horas.filter(h => h.id !== hid);
    D.up(pid, { horas: p.horas });
    this.rDet(pid);
  },

  xProj(id) {
    const p = D.p(id); if (!p) return;
    if (confirm(`¿Eliminar "${p.nombre}"?`)) { D.del(id); this.go('dash'); }
  },

  hModal(pid) {
    this.om(`<div class="mt">Añadir horas</div><label>Tipo</label>`
      + `<div class="ts2"><div class="to on" data-type="trabajo" onclick="App.selT(this)"><span class="ic">💻</span><span class="la">Trabajo</span></div><div class="to" data-type="reunion" onclick="App.selT(this)"><span class="ic">👥</span><span class="la">Reunión</span></div></div>`
      + `<div class="fr"><div class="fg"><label>Horas</label><input type="number" id="mhA" min="0.25" step="0.25" value="1"></div>`
      + `<div class="fg"><label>Fecha</label><input type="date" id="mhD" value="${todayStr()}"><label style="margin-top:.35rem;display:flex;align-items:center;gap:.4rem;cursor:pointer;text-transform:none;letter-spacing:0"><input type="checkbox" id="mhNd" onchange="document.getElementById('mhD').disabled=this.checked;if(this.checked)document.getElementById('mhD').value=''" style="width:auto;accent-color:var(--t2)"> Sin fecha</label></div></div>`
      + `<div class="fr"><div class="fg"><label>Hora inicio</label><input type="time" id="mhHI" value=""></div><div class="fg"></div></div>`
      + `<div class="fg"><label>Nota</label><input type="text" id="mhN" placeholder="¿Qué hiciste?"></div>`
      + `<div class="ma"><button class="bt" onclick="App.cm()">Cancelar</button><button class="bt bt-p" onclick="App.saveHM('${pid}')">Guardar</button></div>`);
  },

  saveHM(pid) {
    const tipo = document.querySelector('#mC .to.on')?.dataset.type || 'trabajo';
    const cant = parseFloat(document.getElementById('mhA').value) || 0;
    const sinF = document.getElementById('mhNd')?.checked;
    const fecha = sinF ? null : (document.getElementById('mhD').value || null);
    const horaInicio = document.getElementById('mhHI').value || null;
    const nota = document.getElementById('mhN').value.trim();
    if (cant <= 0) return;
    const p = D.p(pid); if (!p) return;
    p.horas.push({ id: uid(), fecha, tipo, cantidad: cant, nota, horaInicio });
    T.ev('action', 'hours_add', 'modal');
    sortHoras(p.horas); D.up(pid, { horas: p.horas }); this.cm(); this.rDet(pid);
  }

});
