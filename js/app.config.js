/* ================================================
 * TRACKR — App: Vista Configuración + Clientes
 * Globales: extiende App
 * Dependencias: app.js (App base), utils.js, store.js,
 *               themes.js, colors.js
 * ================================================ */

Object.assign(App, {

  rCfg() {
    const s = D.d.settings, em = s.emisor, t = s.targets, cls = D.cls();

    document.getElementById('cfgC').innerHTML =
      `<div class="cfg-section"><div class="cfg-section-title">Datos del emisor (para facturas)</div><div class="cfg-grid">`
      + `<div class="cfg-full fg"><label>Nombre / Empresa</label><input type="text" id="cfgEN" value="${esc(em.nombre)}" placeholder="Tu nombre o empresa"></div>`
      + `<div class="fg"><label>Dirección línea 1</label><input type="text" id="cfgED1" value="${esc(em.direccion1)}" placeholder="Calle, número"></div>`
      + `<div class="fg"><label>Dirección línea 2</label><input type="text" id="cfgED2" value="${esc(em.direccion2)}" placeholder="CP, Ciudad, País"></div>`
      + `<div class="fg"><label>NIF / CIF</label><input type="text" id="cfgENif" value="${esc(em.nif)}" placeholder="12345678A"></div>`
      + `</div></div>`
      + `<div class="cfg-section"><div class="cfg-section-title">Valores por defecto</div><div class="cfg-grid">`
      + `<div class="fg"><label>IVA %</label><input type="number" id="cfgIva" value="${s.defaultIva}" min="0" max="100" step="1"></div>`
      + `<div class="fg"><label>IRPF %</label><input type="number" id="cfgIrpf" value="${s.defaultIrpf}" min="0" max="100" step="1"></div>`
      + `</div></div>`
      + `<div class="cfg-section"><div class="cfg-section-title">Objetivos</div><div class="cfg-grid">`
      + `<div class="fg"><label>Horas / mes</label><input type="number" id="cfgTHm" value="${t.horasMes || ''}" min="0" step="1" placeholder="Ej: 160"></div>`
      + `<div class="fg"><label>Ingresos / mes (&euro;)</label><input type="number" id="cfgTIm" value="${t.ingresosMes || ''}" min="0" step="100" placeholder="Ej: 3000"></div>`
      + `<div class="fg"><label>Horas / semana</label><input type="number" id="cfgTHs" value="${t.horasSemana || ''}" min="0" step="1" placeholder="Ej: 40"></div>`
      + `</div></div>`
      + `<div class="cfg-section"><div class="cfg-section-title">Tema</div>`
      + `<div class="theme-grid">${THEME_ORDER.map(id => {
          const th = THEMES[id];
          return `<button class="theme-btn${s.tema === id ? ' on' : ''}" onclick="App.setTheme('${id}')">`
            + `<div class="theme-preview" style="background:${th.vars.bg};border-color:${th.vars.b2}">`
            + `<div style="background:${th.vars.bg2};border:1px solid ${th.vars.b1};border-radius:2px;padding:3px 5px;margin-bottom:2px"><span style="color:${th.vars.t1};font-size:8px">Aa</span></div>`
            + `<div style="display:flex;gap:2px"><span style="width:8px;height:4px;border-radius:1px;background:${th.vars.ok}"></span><span style="width:8px;height:4px;border-radius:1px;background:${th.vars.warn}"></span><span style="width:8px;height:4px;border-radius:1px;background:${th.vars.bad}"></span></div>`
            + `</div><span class="theme-name">${th.label}</span></button>`;
        }).join('')}</div></div>`
      + `<div class="cfg-save"><button class="bt bt-p" onclick="App.saveCfg()">Guardar configuración</button></div>`
      + `<div class="cfg-section" style="margin-top:2.5rem"><div class="cfg-section-title">Clientes</div>`
      + (cls.length
        ? `<div class="cl-list">${cls.map(c => `<div class="cl-item"><span class="cl-dot" style="background:${colorHex(c.color || 'CornflowerBlue')}"></span><span class="cl-name">${esc(c.nombre)}</span>${c.nif ? `<span class="cl-nif">${esc(c.nif)}</span>` : ''}<div class="cl-actions"><button class="cl-btn" onclick="App.clModal('${c.id}')" title="Editar">&#9998;</button><button class="cl-btn cl-btn-del" onclick="App.delCl('${c.id}')" title="Eliminar">&times;</button></div></div>`).join('')}</div>`
        : '<div style="color:var(--t3);font-size:.82rem">Sin clientes. Se crearán al añadir proyectos.</div>')
      + `<button class="bt bt-add" style="margin-top:.75rem" onclick="App.clModal()">+ Nuevo cliente</button></div>`;
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
    Toast.ok('Configuración guardada');
  },

  clModal(cid) {
    const isE = !!cid, c = isE ? D.cl(cid) : null;
    const clColor = c?.color || 'CornflowerBlue';
    this.om(`<div class="mt">${isE ? 'Editar' : 'Nuevo'} cliente</div>`
      + `<div class="fg"><label>Nombre</label><input type="text" id="clN" value="${esc(c?.nombre || '')}" placeholder="Nombre o empresa"></div>`
      + `<div class="fr"><div class="fg"><label>Dirección línea 1</label><input type="text" id="clD1" value="${esc(c?.direccion1 || '')}" placeholder="Calle, número"></div><div class="fg"><label>Dirección línea 2</label><input type="text" id="clD2" value="${esc(c?.direccion2 || '')}" placeholder="CP, Ciudad"></div></div>`
      + `<div class="fr"><div class="fg"><label>NIF / CIF</label><input type="text" id="clNif" value="${esc(c?.nif || '')}" placeholder="12345678A"></div><div class="fg"><label>Color</label>${this.colorSelect(clColor)}</div></div>`
      + `<div class="ma"><button class="bt" onclick="App.cm()">Cancelar</button><button class="bt bt-p" onclick="App.saveCl('${cid || ''}')">${isE ? 'Guardar' : 'Crear'}</button></div>`);
  },

  saveCl(cid) {
    const nombre = document.getElementById('clN').value.trim();
    if (!nombre) { Toast.warn('Nombre obligatorio'); return; }
    const color = document.getElementById('mpColor')?.value || 'CornflowerBlue';
    const data = { nombre, direccion1: document.getElementById('clD1').value.trim(), direccion2: document.getElementById('clD2').value.trim(), nif: document.getElementById('clNif').value.trim(), color };
    if (cid) D.upCl(cid, data); else { data.id = uid(); D.addCl(data); }
    this.cm(); this.rCfg();
  },

  delCl(cid) {
    const c = D.cl(cid); if (!c) return;
    if (!confirm(`¿Eliminar cliente "${c.nombre}"?`)) return;
    D.delCl(cid); this.rCfg();
  }

});
