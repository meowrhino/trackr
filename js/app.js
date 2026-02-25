/* ================================================
 * TRACKR — App principal
 * Navegación, vistas, modals, export/import
 * Globales: App
 * Dependencias: colors.js, utils.js, store.js, billing.js
 * ================================================ */

const App={
  cv:'info',  // vista actual
  cp:null,    // proyecto actual (en detalle)
  pf:'todos', // filtro de proyectos
  ps:'recientes', // orden de proyectos
  calY:null,  // año del calendario (null = inicializar al actual)
  calM:null,  // mes del calendario 0-11
  calView:'month', // 'month' | 'week'
  calWeekStart:null, // Date del lunes de la semana (null = inicializar)

  /* ── Inicialización ── */
  init(){if(!D.init())D.create();this.enter()},
  createNew(){D.create();this.go('info')},
  enter(){this.go('info')},

  /* ── Navegación ── */
  go(v,d){
    this.cv=v;
    document.querySelectorAll('.vw').forEach(e=>e.classList.remove('on'));
    document.querySelectorAll('.ni').forEach(e=>e.classList.remove('on'));
    const map={info:'vInfo',dash:'vDash',cal:'vCal',proj:'vProj',det:'vDet',hrs:'vHrs',rep:'vRep'};
    const el=document.getElementById(map[v]);if(el)el.classList.add('on');
    const nav=document.querySelector(`.ni[data-v="${v}"]`);if(nav)nav.classList.add('on');
    if(v==='dash')this.rDash();else if(v==='info')this.rInfo();else if(v==='proj')this.rProj();else if(v==='det')this.rDet(d);
    else if(v==='hrs')this.rHrs();else if(v==='rep')this.rRep();
    else if(v==='cal')this.rCal();
  },

  /* ══════════════════════════════════════════════
   *  INFO — Usuario
   * ══════════════════════════════════════════════ */
  rInfo(){
    const st=D.d.settings;
    const name=st.usuario||'';
    const ps=D.ps();
    const hasProjects=ps.length>0;
    const statusEl=document.getElementById('infoStatus');
    if(hasProjects){
      const activos=ps.filter(p=>p.status==='activo').length;
      statusEl.innerHTML=
        `<div class="info-status">`
        +`<div class="info-status-text"><span class="info-status-num">${ps.length}</span> proyecto${ps.length!==1?'s':''}`
        +`${activos?` · <strong>${activos} activo${activos!==1?'s':''}</strong>`:''}`
        +`</div>`
        +`<div class="info-status-actions">`
        +`<button class="bt bt-p" onclick="App.go('dash')">Ir al Dashboard</button>`
        +`<button class="bt" onclick="App.pModal()">+ Nuevo proyecto</button>`
        +`</div>`
        +`</div>`;
    }else{
      statusEl.innerHTML=
        `<div class="info-cta">`
        +`<p class="info-cta-text">No tienes proyectos todavía. Crea uno nuevo o importa tus datos desde un JSON.</p>`
        +`<div class="info-cta-actions">`
        +`<button class="bt bt-p" onclick="App.pModal()">+ Nuevo proyecto</button>`
        +`<button class="bt" onclick="document.getElementById('impA').click()">Cargar JSON</button>`
        +`</div>`
        +`</div>`;
    }
    document.getElementById('infoUser').innerHTML=
      `<div class="info-user-row">`
      +`<input type="text" id="iuName" value="${esc(name)}" placeholder="Tu nombre o empresa">`
      +`<button class="bt bt-p" onclick="App.saveUser()">Guardar</button>`
      +`</div>`
      +`<p class="info-user-hint">Este nombre se usará para resaltar tus proyectos en el dashboard.</p>`;
  },
  saveUser(){
    const name=document.getElementById('iuName').value.trim();
    D.d.settings.usuario=name;
    D.save();
    this.rInfo();
  },

  /* ══════════════════════════════════════════════
   *  DASHBOARD
   * ══════════════════════════════════════════════ */
  rDash(){
    const ps=D.ps();
    ps.forEach(p=>B.calc(p));

    /* Alertas */
    const als=[];
    ps.forEach(p=>{
      if(p.estado==='facturado'&&!p.facturacion.pagado)als.push({t:`${p.nombre} — pendiente de pago`,id:p.id});
      /* COMENTADO: alerta pendiente de facturar
      if(p.estado==='completado')als.push({t:`${p.nombre} — pendiente de facturar`,id:p.id});
      FIN COMENTADO */
    });
    document.getElementById('dAl').innerHTML=als.map(a=>
      `<div class="al" onclick="App.go('det','${a.id}')"><span style="color:var(--warn)">!</span><span style="flex:1">${a.t}</span><span style="color:var(--t3)">→</span></div>`
    ).join('');

    /* Agrupar proyectos por estado */
    const order=['en_progreso','pendiente','completado','recurrente','facturado','pagado'];
    const labels={en_progreso:'En progreso',pendiente:'Pendientes',completado:'Completados',recurrente:'Recurrentes',facturado:'Facturados',pagado:'Pagados'};
    const groups={};
    ps.forEach(p=>{if(!groups[p.estado])groups[p.estado]=[];groups[p.estado].push(p)});

    /* Ordenar cada grupo: proyectos del usuario primero, luego por horas desc */
    const usr=(D.d.settings.usuario||'').toLowerCase();
    Object.keys(groups).forEach(st=>{
      groups[st].sort((a,b)=>{
        const aU=usr&&(a.cliente||'').toLowerCase()===usr?0:1;
        const bU=usr&&(b.cliente||'').toLowerCase()===usr?0:1;
        if(aU!==bU)return aU-bU;
        return b.horas.reduce((s,h)=>s+h.cantidad,0)-a.horas.reduce((s,h)=>s+h.cantidad,0);
      });
    });

    const c=document.getElementById('dPr');
    if(!ps.length){c.innerHTML='<div class="es"><div class="tx">Sin proyectos</div></div>';return}

    let html='';
    order.forEach(st=>{
      const g=groups[st];
      if(!g||!g.length)return;
      html+=`<div class="dash-group"><div class="dash-group-title">${labels[st]}</div><div class="pg">${g.map(p=>this.card(p,true)).join('')}</div></div>`;
    });
    c.innerHTML=html;
  },

  /* ══════════════════════════════════════════════
   *  PROYECTOS (vista lista)
   * ══════════════════════════════════════════════ */
  rProj(){
    let ps=D.ps();ps.forEach(p=>B.calc(p));
    document.getElementById('pTb').innerHTML=`
      ${['todos','pendiente','en_progreso','completado','facturado','pagado'].map(f=>
        `<button class="fb ${this.pf===f?'on':''}" onclick="App.sf('${f}')">${f==='todos'?'Todos':EST[f]}</button>`
      ).join('')}
      <span class="tbs"></span>
      <select onchange="App.ss(this.value)" style="width:auto">
        <option value="recientes" ${this.ps==='recientes'?'selected':''}>Recientes</option>
        <option value="nombre" ${this.ps==='nombre'?'selected':''}>Nombre</option>
        <option value="horas" ${this.ps==='horas'?'selected':''}>Horas</option>
        <option value="rentabilidad" ${this.ps==='rentabilidad'?'selected':''}>€/h</option>
      </select>`;
    if(this.pf!=='todos')ps=ps.filter(p=>p.estado===this.pf);
    if(this.ps==='recientes')ps.sort((a,b)=>(b.fechas.inicio||'').localeCompare(a.fechas.inicio||''));
    else if(this.ps==='nombre')ps.sort((a,b)=>a.nombre.localeCompare(b.nombre));
    else if(this.ps==='horas')ps.sort((a,b)=>b.horas.reduce((s,h)=>s+h.cantidad,0)-a.horas.reduce((s,h)=>s+h.cantidad,0));
    else if(this.ps==='rentabilidad')ps.sort((a,b)=>(B.eph(b)||0)-(B.eph(a)||0));
    const c=document.getElementById('pLs'),em=document.getElementById('pEm');
    if(!ps.length){c.innerHTML='';em.style.display='block'}else{em.style.display='none';c.innerHTML=ps.map(p=>this.card(p)).join('')}
  },

  /* Genera HTML de card de proyecto (usado en dashboard y lista) */
  card(p,noBadge){
    const th=p.horas.reduce((s,h)=>s+h.cantidad,0),eph=B.eph(p),hex=colorHex(p.color);
    const usr=(D.d.settings.usuario||'').toLowerCase();
    const isMR=usr&&(p.cliente||'').toLowerCase()===usr;
    return `<div class="pc${isMR?' pc-mr':''}" style="--project-color:${hex}" onclick="App.go('det','${p.id}')">
      <div class="pc-h"><div><div class="pc-n">${esc(p.nombre)}</div><div class="pc-c">${esc(p.cliente)}</div></div>${noBadge?'':` <span class="bd bd-${p.estado}">${EST[p.estado]}</span>`}</div>
      <div class="pc-s">
        <span><span class="m">${th.toFixed(1)}h</span></span>
        ${p.facturacion.modo!=='gratis'?`<span><span class="m">${(p.facturacion.totalFactura||0).toFixed(2)} €</span></span>`:'<span style="color:var(--t3)">gratis</span>'}
        ${eph!==null&&p.facturacion.modo!=='gratis'?`<span style="color:${eph>=30?'var(--ok)':eph>=15?'var(--warn)':'var(--bad)'}">${eph.toFixed(2)} €/h</span>`:''}
      </div></div>`;
  },

  sf(f){this.pf=f;this.rProj()},
  ss(s){this.ps=s;this.rProj()},

  /* ══════════════════════════════════════════════
   *  DETALLE DE PROYECTO
   * ══════════════════════════════════════════════ */
  rDet(idOr){
    const id=typeof idOr==='string'?idOr:this.cp;this.cp=id;const p=D.p(id);
    if(!p){this.go('dash');return}
    B.calc(p);
    const th=p.horas.reduce((s,h)=>s+h.cantidad,0),
      wh=p.horas.filter(h=>h.tipo==='trabajo').reduce((s,h)=>s+h.cantidad,0),
      mh=p.horas.filter(h=>h.tipo==='reunion').reduce((s,h)=>s+h.cantidad,0),
      eph=B.eph(p),hex=colorHex(p.color);

    const hHtml=!p.horas.length?'<div class="es"><div class="tx">Sin horas</div></div>'
      :`<div class="hl">${p.horas.map(h=>`<div class="hr hr-click" style="border-left-color:${hex}" onclick="App.eHour('${p.id}','${h.id}')">
        <span class="hr-t">${h.tipo==='trabajo'?'💻':'👥'}</span>
        <span class="hr-d">${fmtDate(h.fecha)}${h.horaInicio?' '+h.horaInicio:''}</span>
        <span class="hr-a m">${h.cantidad}h</span>
        <span class="hr-n">${esc(h.nota||'')}</span>
        <span class="hr-x" onclick="event.stopPropagation();App.xHour('${p.id}','${h.id}')" title="Eliminar">×</span>
      </div>`).join('')}</div>`;

    const bHtml=p.facturacion.modo==='gratis'?'<div style="color:var(--t3);font-size:.85rem">Proyecto gratuito</div>'
      :`<div class="bb">
        <div class="br"><span class="la">Base imponible</span><span class="va">${(p.facturacion.baseImponible||0).toFixed(2)} €</span></div>
        ${p.facturacion.iva?`<div class="br"><span class="la">+ IVA (${p.facturacion.iva}%)</span><span class="va">${(p.facturacion.importeIva||0).toFixed(2)} €</span></div>`:''}
        ${p.facturacion.irpf?`<div class="br"><span class="la">- IRPF (${p.facturacion.irpf}%)</span><span class="va">${(p.facturacion.importeIrpf||0).toFixed(2)} €</span></div>`:''}
        <div class="br tot"><span class="la">Total factura</span><span class="va">${(p.facturacion.totalFactura||0).toFixed(2)} €</span></div>
        <div class="br"><span class="la">Neto a recibir</span><span class="va" style="color:var(--ok)">${(p.facturacion.netoRecibido||0).toFixed(2)} €</span></div>
        ${p.facturacion.gastos?`<div class="br"><span class="la">Gastos</span><span class="va" style="color:var(--bad)">-${p.facturacion.gastos.toFixed(2)} €</span></div>`:''}
        ${eph!==null?`<div class="br"><span class="la">Rentabilidad</span><span class="va" style="color:${eph>=30?'var(--ok)':eph>=15?'var(--warn)':'var(--bad)'}">${eph.toFixed(2)} €/h</span></div>`:''}
      </div>`;

    document.getElementById('detC').innerHTML=`
      <div class="db" onclick="App.go('dash')">← dashboard</div>
      <div class="dh"><div><div class="dt" style="color:${hex}">${esc(p.nombre)}</div><div class="dc">${esc(p.cliente)}</div></div>
        <div class="bg"><span class="bd bd-${p.estado}">${EST[p.estado]}</span><button class="bt bt-s" onclick="App.pModal('${p.id}')">Editar</button><button class="bt bt-s bt-d" onclick="App.xProj('${p.id}')">Eliminar</button></div></div>
      <div class="ds"><div class="dst">Info</div><div class="dg">
        <div><div class="dfl">Inicio</div><div class="dfv">${fmtDate(p.fechas.inicio)}</div></div>
        <div><div class="dfl">Fin estimada</div><div class="dfv">${fmtDate(p.fechas.finEstimada)}</div></div>
        <div><div class="dfl">Fin real</div><div class="dfv">${fmtDate(p.fechas.finReal)}</div></div>
        <div><div class="dfl">Horas</div><div class="dfv">${th.toFixed(1)}h <span style="color:var(--t3);font-size:.72rem">💻${wh.toFixed(1)} 👥${mh.toFixed(1)}</span></div></div>
      </div>${p.notas?`<div style="margin-top:.75rem"><div class="dfl">Notas</div><div style="color:var(--t3);font-size:.85rem">${esc(p.notas)}</div></div>`:''}</div>
      <div class="ds"><div style="display:flex;justify-content:space-between;align-items:center"><div class="dst" style="border:none;margin:0;padding:0">Horas</div><button class="bt bt-add" onclick="App.hModal('${p.id}')">+ Añadir</button></div>${hHtml}</div>
      <div class="ds"><div class="dst">Facturación</div>${bHtml}${p.facturacion.pagado?`<div style="margin-top:.5rem;font-size:.82rem;color:var(--ok)">Pagado${p.facturacion.fechaPago?' el '+fmtDate(p.facturacion.fechaPago):''}</div>`:''}</div>`;
  },

  /* Editar una entrada de hora */
  eHour(pid,hid){
    const p=D.p(pid);if(!p)return;
    const h=p.horas.find(x=>x.id===hid);if(!h)return;
    const noDate=!h.fecha;
    this.om(`<div class="mt">Editar hora</div>
      <label>Tipo</label>
      <div class="ts2">
        <div class="to ${h.tipo==='trabajo'?'on':''}" data-type="trabajo" onclick="App.selT(this)"><span class="ic">💻</span><span class="la">Trabajo</span></div>
        <div class="to ${h.tipo==='reunion'?'on':''}" data-type="reunion" onclick="App.selT(this)"><span class="ic">👥</span><span class="la">Reunión</span></div>
      </div>
      <div class="fr"><div class="fg"><label>Horas</label><input type="number" id="ehA" min="0.25" step="0.25" value="${h.cantidad}"></div>
        <div class="fg"><label>Fecha</label><input type="date" id="ehD" value="${h.fecha||''}" ${noDate?'disabled':''}><label style="margin-top:.35rem;display:flex;align-items:center;gap:.4rem;cursor:pointer;text-transform:none;letter-spacing:0"><input type="checkbox" id="ehNd" ${noDate?'checked':''} onchange="document.getElementById('ehD').disabled=this.checked;if(this.checked)document.getElementById('ehD').value=''" style="width:auto;accent-color:var(--t2)"> Sin fecha</label></div></div>
      <div class="fr"><div class="fg"><label>Hora inicio</label><input type="time" id="ehHI" value="${h.horaInicio||''}"></div><div class="fg"></div></div>
      <div class="fg"><label>Nota</label><input type="text" id="ehN" value="${esc(h.nota||'')}"></div>
      <div class="ma"><button class="bt" onclick="App.cm()">Cancelar</button><button class="bt bt-p" onclick="App.saveEH('${pid}','${hid}')">Guardar</button></div>`);
  },

  /* Guardar hora editada */
  saveEH(pid,hid){
    const p=D.p(pid);if(!p)return;
    const h=p.horas.find(x=>x.id===hid);if(!h)return;
    const tipo=document.querySelector('#mC .to.on')?.dataset.type||h.tipo;
    const cant=parseFloat(document.getElementById('ehA').value)||h.cantidad;
    const sinFecha=document.getElementById('ehNd')?.checked;
    const fecha=sinFecha?null:(document.getElementById('ehD').value||null);
    const horaInicio=document.getElementById('ehHI').value||null;
    const nota=document.getElementById('ehN').value.trim();
    h.tipo=tipo;h.cantidad=cant;h.fecha=fecha;h.horaInicio=horaInicio;h.nota=nota;
    sortHoras(p.horas);D.up(pid,{horas:p.horas});this.cm();
    if(this.cv==='cal')this.rCal();else this.rDet(pid);
  },

  /* Eliminar una hora */
  xHour(pid,hid){const p=D.p(pid);if(!p)return;if(!confirm('¿Eliminar esta entrada de horas?'))return;p.horas=p.horas.filter(h=>h.id!==hid);D.up(pid,{horas:p.horas});this.rDet(pid)},

  /* Eliminar un proyecto */
  xProj(id){const p=D.p(id);if(!p)return;if(confirm(`¿Eliminar "${p.nombre}"?`)){D.del(id);this.go('dash')}},

  /* ══════════════════════════════════════════════
   *  QUICK HOURS (registro rápido)
   * ══════════════════════════════════════════════ */
  rHrs(){
    const ps=D.ps().filter(p=>p.estado!=='pagado');
    if(!ps.length){document.getElementById('qhF').innerHTML='<div class="es"><div class="tx">Crea un proyecto primero</div></div>';return}
    document.getElementById('qhF').innerHTML=`
      <div class="fg"><label>Proyecto</label><select id="qP">${ps.map(p=>`<option value="${p.id}">${esc(p.nombre)} — ${esc(p.cliente)}</option>`).join('')}</select></div>
      <label>Tipo</label>
      <div class="ts2"><div class="to on" data-type="trabajo" onclick="App.selT(this)"><span class="ic">💻</span><span class="la">Trabajo</span></div>
        <div class="to" data-type="reunion" onclick="App.selT(this)"><span class="ic">👥</span><span class="la">Reunión</span></div></div>
      <div class="fr"><div class="fg"><label>Horas</label><input type="number" id="qA" min="0.25" step="0.25" value="1"></div>
        <div class="fg"><label>Fecha</label><input type="date" id="qD" value="${new Date().toISOString().slice(0,10)}"><label style="margin-top:.35rem;display:flex;align-items:center;gap:.4rem;cursor:pointer;text-transform:none;letter-spacing:0"><input type="checkbox" id="qNd" onchange="document.getElementById('qD').disabled=this.checked;if(this.checked)document.getElementById('qD').value=''" style="width:auto;accent-color:var(--t2)"> Sin fecha</label></div></div>
      <div class="fg"><label>Nota</label><input type="text" id="qN" placeholder="¿Qué hiciste?"></div>
      <button class="bt bt-p" onclick="App.saveQH()">Guardar</button>
      <div id="qOk" style="display:none;margin-top:.75rem;color:var(--ok);font-size:.82rem"></div>`;
  },

  /* Toggle tipo trabajo/reunión */
  selT(el){el.parentElement.querySelectorAll('.to').forEach(o=>o.classList.remove('on'));el.classList.add('on')},

  /* Guardar hora rápida */
  saveQH(){
    const pid=document.getElementById('qP').value,
      tipo=document.querySelector('#qhF .to.on')?.dataset.type||'trabajo',
      cant=parseFloat(document.getElementById('qA').value)||0,
      sinF=document.getElementById('qNd')?.checked,
      fecha=sinF?null:(document.getElementById('qD').value||null),
      nota=document.getElementById('qN').value.trim();
    if(!pid||cant<=0)return;
    const p=D.p(pid);if(!p)return;
    p.horas.push({id:uid(),fecha,tipo,cantidad:cant,nota,horaInicio:null});
    sortHoras(p.horas);D.up(pid,{horas:p.horas});
    const m=document.getElementById('qOk');m.textContent=`${cant}h → ${p.nombre}`;m.style.display='block';
    setTimeout(()=>m.style.display='none',2500);
    document.getElementById('qA').value='1';document.getElementById('qN').value='';
  },

  /* ══════════════════════════════════════════════
   *  INFORMES
   * ══════════════════════════════════════════════ */
  rRep(){
    const ps=D.ps();ps.forEach(p=>B.calc(p));
    let th=0,tb=0,tn=0,tg=0,tp=0;
    ps.forEach(p=>{
      th+=p.horas.reduce((s,h)=>s+h.cantidad,0);
      if(p.facturacion.modo!=='gratis'){tb+=p.facturacion.totalFactura||0;tn+=p.facturacion.netoRecibido||0;tg+=p.facturacion.gastos||0}
      if(p.facturacion.pagado)tp+=p.facturacion.totalFactura||0;
    });
    const avg=th>0?((tn-tg)/th):0;
    document.getElementById('rSt').innerHTML=`
      <div class="sc"><div class="sc-l">Facturado</div><div class="sc-v m">${tb.toFixed(2)} €</div></div>
      <div class="sc"><div class="sc-l">Cobrado</div><div class="sc-v m" style="color:var(--ok)">${tp.toFixed(2)} €</div></div>
      <div class="sc"><div class="sc-l">Horas</div><div class="sc-v m">${th.toFixed(1)}h</div></div>
      <div class="sc"><div class="sc-l">Media €/h</div><div class="sc-v m">${avg.toFixed(2)} €/h</div></div>`;

    const rk=ps.map(p=>({...p,eph:B.eph(p)})).filter(p=>p.eph!==null&&p.facturacion.modo!=='gratis').sort((a,b)=>b.eph-a.eph);
    document.getElementById('rRk').innerHTML=!rk.length?'<div class="es"><div class="tx">Añade horas y facturación</div></div>'
      :rk.map((p,i)=>`<div class="ri" onclick="App.go('det','${p.id}')"><span class="ri-p">${i+1}</span><div class="ri-c" style="background:${colorHex(p.color)}"></div><div class="ri-i"><div class="ri-n">${esc(p.nombre)}</div><div class="ri-cl">${esc(p.cliente)}</div></div><div class="ri-r" style="color:${p.eph>=30?'var(--ok)':p.eph>=15?'var(--warn)':'var(--bad)'}">${p.eph.toFixed(2)} €/h</div></div>`).join('');

    const cls={};
    ps.forEach(p=>{
      const c=p.cliente||'Sin cliente';
      if(!cls[c])cls[c]={pr:0,h:0,b:0,n:0};
      cls[c].pr++;cls[c].h+=p.horas.reduce((s,h)=>s+h.cantidad,0);
      if(p.facturacion.modo!=='gratis'){cls[c].b+=p.facturacion.totalFactura||0;cls[c].n+=p.facturacion.netoRecibido||0}
    });
    document.getElementById('rCl').innerHTML=!Object.keys(cls).length?'<div class="es"><div class="tx">Sin datos</div></div>'
      :Object.entries(cls).map(([n,d])=>`<div class="cc"><div class="cn">${esc(n)}</div><div class="cs"><span class="la">Proyectos</span><span class="va">${d.pr}</span></div><div class="cs"><span class="la">Horas</span><span class="va">${d.h.toFixed(1)}h</span></div><div class="cs"><span class="la">Facturado</span><span class="va">${d.b.toFixed(2)} €</span></div><div class="cs"><span class="la">Neto</span><span class="va">${d.n.toFixed(2)} €</span></div></div>`).join('');
  },

  /* ══════════════════════════════════════════════
   *  CALENDARIO
   * ══════════════════════════════════════════════ */
  rCal(){
    if(this.calView==='week'){this.rCalWeek();return}
    this.rCalMonth();
  },

  /* ── Vista mensual ── */
  rCalMonth(){
    /* Inicializar al mes actual si es la primera vez */
    if(this.calY===null){const n=new Date();this.calY=n.getFullYear();this.calM=n.getMonth()}
    const year=this.calY, month=this.calM;

    /* Calcular grid de días */
    const first=new Date(year,month,1);
    const daysIn=new Date(year,month+1,0).getDate();
    const startDow=(first.getDay()+6)%7; // Lun=0, Dom=6
    const totalCells=Math.ceil((startDow+daysIn)/7)*7;
    const n=new Date();
    const todayStr=`${n.getFullYear()}-${String(n.getMonth()+1).padStart(2,'0')}-${String(n.getDate()).padStart(2,'0')}`;
    const mKey=`${year}-${String(month+1).padStart(2,'0')}`;

    /* Recopilar horas de todos los proyectos en un mapa por fecha */
    const ps=D.ps();
    const hm={};let mt=0;
    const pStats={}; /* pid → {pn,pc,h} para stats del periodo */
    ps.forEach(p=>{
      const hex=colorHex(p.color);
      p.horas.forEach(h=>{
        if(!h.fecha)return;
        if(!hm[h.fecha])hm[h.fecha]=[];
        hm[h.fecha].push({pid:p.id,pn:p.nombre,pc:hex,tipo:h.tipo,cant:h.cantidad,nota:h.nota});
        if(h.fecha.startsWith(mKey)){
          mt+=h.cantidad;
          if(!pStats[p.id])pStats[p.id]={pn:p.nombre,pc:hex,h:0};
          pStats[p.id].h+=h.cantidad;
        }
      });
    });

    /* Construir celdas (fechas locales, no UTC) */
    const cells=[];
    for(let i=0;i<totalCells;i++){
      const d=new Date(year,month,1+(i-startDow));
      const ds=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
      cells.push({date:ds,num:d.getDate(),in:d.getMonth()===month&&d.getFullYear()===year,today:ds===todayStr});
    }

    /* Generar HTML */
    let g=DIAS_SEM.map(d=>`<div class="cal-dow">${d}</div>`).join('');
    cells.forEach(c=>{
      const cl=['cal-day'];
      if(!c.in)cl.push('out');
      if(c.today)cl.push('today');
      const es=(hm[c.date]||[]).map(e=>
        `<div class="cal-entry" style="border-left-color:${e.pc}"><span class="cal-e-ico">${e.tipo==='trabajo'?'💻':'👥'}</span><span class="cal-e-h m">${e.cant}h</span><span class="cal-e-p">${esc(e.pn)}</span></div>`
      ).join('');
      g+=`<div class="${cl.join(' ')}" onclick="App.calDetail('${c.date}')"><div class="cal-num">${c.num}</div>${es}</div>`;
    });

    document.getElementById('calC').innerHTML=
      this._calHeader(`${MESES[month]} ${year}`,`Total mes: <span class="m">${mt.toFixed(1)}h</span>`)
      +`<div class="cal-grid">${g}</div>`
      +this._calProjStats(pStats);
  },

  /* ── Vista semanal ── */
  rCalWeek(){
    /* Inicializar al lunes de la semana actual */
    if(!this.calWeekStart){
      const n=new Date();const dow=(n.getDay()+6)%7;
      this.calWeekStart=new Date(n.getFullYear(),n.getMonth(),n.getDate()-dow);
    }
    const ws=this.calWeekStart;
    const n=new Date();
    const todayStr=`${n.getFullYear()}-${String(n.getMonth()+1).padStart(2,'0')}-${String(n.getDate()).padStart(2,'0')}`;

    /* 7 días de la semana */
    const days=[];
    for(let i=0;i<7;i++){
      const d=new Date(ws.getFullYear(),ws.getMonth(),ws.getDate()+i);
      const ds=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
      days.push({date:ds,num:d.getDate(),dow:DIAS_SEM[i],today:ds===todayStr,d});
    }

    /* Título: rango de la semana */
    const d0=days[0].d,d6=days[6].d;
    const title=d0.getMonth()===d6.getMonth()
      ?`${days[0].num}–${days[6].num} ${MESES[d0.getMonth()]} ${d0.getFullYear()}`
      :`${days[0].num} ${MESES[d0.getMonth()]} – ${days[6].num} ${MESES[d6.getMonth()]} ${d6.getFullYear()}`;

    /* Recopilar horas */
    const ps=D.ps();
    const hm={};let wt=0;
    const pStats={}; /* pid → {pn,pc,h} */
    const dateSet=new Set(days.map(d=>d.date));
    ps.forEach(p=>{
      const hex=colorHex(p.color);
      p.horas.forEach(h=>{
        if(!h.fecha||!dateSet.has(h.fecha))return;
        if(!hm[h.fecha])hm[h.fecha]=[];
        hm[h.fecha].push({pid:p.id,hid:h.id,pn:p.nombre,pc:hex,tipo:h.tipo,cant:h.cantidad,nota:h.nota,hi:h.horaInicio});
        wt+=h.cantidad;
        if(!pStats[p.id])pStats[p.id]={pn:p.nombre,pc:hex,h:0};
        pStats[p.id].h+=h.cantidad;
      });
    });

    /* Horas visibles: 07:00–22:00 */
    const hStart=7,hEnd=22,slotH=60;

    /* Header días */
    let hdr='<div class="cal-wc"></div>';
    days.forEach(d=>{
      hdr+=`<div class="cal-wh${d.today?' today':''}"><span class="cal-wh-dow">${d.dow}</span><span class="cal-wh-num">${d.num}</span></div>`;
    });

    /* Recopilar eventos por columna (día) */
    const noTimeEntries=[];
    const colEvts=days.map(d=>{
      const es=(hm[d.date]||[]);
      const timed=[];
      es.forEach(e=>{
        if(!e.hi){noTimeEntries.push({...e,fecha:d.date});return}
        timed.push(e);
      });
      return timed;
    });

    /* Generar columnas: etiqueta hora + 7 columnas de día */
    /* Cada columna contiene los slots (fondo) + eventos (absolutos) */
    let timeLbl='';
    for(let hr=hStart;hr<hEnd;hr++){
      timeLbl+=`<div class="cal-tl">${String(hr).padStart(2,'0')}:00</div>`;
    }

    let cols='';
    days.forEach((d,di)=>{
      let slots='';
      for(let hr=hStart;hr<hEnd;hr++){
        slots+=`<div class="cal-slot" data-date="${d.date}" data-hr="${hr}" data-min="0" data-col="${di}"></div>`;
        slots+=`<div class="cal-slot" data-date="${d.date}" data-hr="${hr}" data-min="30" data-col="${di}"></div>`;
      }
      let evts='';
      colEvts[di].forEach(e=>{
        const parts=e.hi.split(':');
        const mins=parseInt(parts[0])*60+parseInt(parts[1]);
        const top=((mins-hStart*60)/60)*slotH;
        const height=e.cant*slotH;
        evts+=`<div class="cal-evt" style="top:${top}px;height:${Math.max(height,20)}px;--ec:${e.pc}" onclick="event.stopPropagation();App.eHour('${e.pid}','${e.hid}')"><span class="cal-evt-t">${e.tipo==='trabajo'?'💻':'👥'} ${e.cant}h</span><span class="cal-evt-n">${esc(e.pn)}</span></div>`;
      });
      cols+=`<div class="cal-wcol" data-col="${di}">${slots}${evts}</div>`;
    });

    /* Sin hora asignada */
    let ntHtml='';
    if(noTimeEntries.length){
      ntHtml=`<div class="cal-nt"><div class="cal-nt-title">Sin hora asignada</div><div class="hl">${noTimeEntries.map(e=>
        `<div class="hr" style="border-left-color:${e.pc}"><span class="hr-t">${e.tipo==='trabajo'?'💻':'👥'}</span><span class="hr-a m">${e.cant}h</span><span style="color:var(--t1);font-size:.82rem;flex:1">${esc(e.pn)}</span><span class="hr-n">${esc(e.nota||'')}</span><span class="hr-e" onclick="App.eHour('${e.pid}','${e.hid}')" title="Editar">✎</span></div>`
      ).join('')}</div></div>`;
    }

    document.getElementById('calC').innerHTML=
      this._calHeader(title,`Total semana: <span class="m">${wt.toFixed(1)}h</span>`)
      +`<div class="cal-week" style="--slot-h:${slotH}px">`
      +`<div class="cal-week-hdr">${hdr}</div>`
      +`<div class="cal-week-body"><div class="cal-week-tl">${timeLbl}</div>${cols}</div>`
      +`</div>`+ntHtml+this._calProjStats(pStats);

    /* ── Drag-to-create en slots vacíos ── */
    const wkBody=document.querySelector('.cal-week-body');
    if(!wkBody)return;
    let drag=null; // {startHr,startMin,date,preview,wcol,endMin}

    const minFromY=(y,wcol)=>{
      const rect=wcol.getBoundingClientRect();
      const relY=Math.max(0,y-rect.top);
      return hStart*60+Math.floor(relY/slotH*60);
    };

    const snap30=m=>Math.floor(m/30)*30;

    const updatePreview=endMin=>{
      if(!drag)return;
      const startTotal=drag.startHr*60+drag.startMin;
      let endTotal=snap30(endMin)+30;
      if(endTotal<=startTotal)endTotal=startTotal+30;
      if(endTotal>hEnd*60)endTotal=hEnd*60;
      const topPx=((startTotal-hStart*60)/60)*slotH;
      const hPx=((endTotal-startTotal)/60)*slotH;
      drag.preview.style.top=topPx+'px';
      drag.preview.style.height=Math.max(hPx,15)+'px';
      drag.endMin=endTotal;
    };

    wkBody.addEventListener('mousedown',ev=>{
      const slot=ev.target.closest('.cal-slot');
      if(!slot)return;
      ev.preventDefault();
      const wcol=slot.closest('.cal-wcol');
      const date=slot.dataset.date;
      const startHr=parseInt(slot.dataset.hr);
      const startMin=parseInt(slot.dataset.min);

      /* Crear preview */
      const pv=document.createElement('div');
      pv.className='cal-drag-pv';
      wcol.appendChild(pv);

      drag={startHr,startMin,date,preview:pv,wcol,endMin:startHr*60+startMin+30};
      updatePreview(startHr*60+startMin);
    });

    wkBody.addEventListener('mousemove',ev=>{
      if(!drag)return;
      ev.preventDefault();
      const rawMin=minFromY(ev.clientY,drag.wcol);
      updatePreview(rawMin);
    });

    const endDrag=()=>{
      if(!drag)return;
      const d=drag;drag=null;
      if(d.preview.parentNode)d.preview.remove();
      const startTotal=d.startHr*60+d.startMin;
      const dur=(d.endMin-startTotal)/60;
      const hh=String(d.startHr).padStart(2,'0');
      const mm=String(d.startMin).padStart(2,'0');
      App.calAddHour(d.date,`${hh}:${mm}`,dur>0?dur:0.5);
    };
    wkBody.addEventListener('mouseup',endDrag);
    wkBody.addEventListener('mouseleave',()=>{
      if(drag){drag.preview.remove();drag=null}
    });
  },

  /* Header compartido mes/semana */
  _calHeader(title,stat){
    const isM=this.calView==='month';
    return `<div class="cal-hd"><button class="bt bt-s" onclick="App.calPrev()">&larr;</button>`
      +`<span class="cal-title">${title}</span>`
      +`<button class="bt bt-s" onclick="App.calNext()">&rarr;</button>`
      +`<button class="bt bt-s" onclick="App.calToday()">Hoy</button>`
      +`<div class="cal-vt"><button class="cal-vb${isM?' on':''}" onclick="App.calSetView('month')">Mes</button><button class="cal-vb${!isM?' on':''}" onclick="App.calSetView('week')">Semana</button></div></div>`
      +`<div class="cal-stat"><span class="cal-stat-l">${stat}</span></div>`;
  },

  /* Stats de proyectos trabajados en el periodo */
  _calProjStats(pStats){
    const list=Object.entries(pStats).map(([id,v])=>({id,...v})).sort((a,b)=>b.h-a.h);
    if(!list.length)return '';
    return `<div class="cal-ps"><div class="cal-ps-title">Proyectos en este periodo</div><div class="cal-ps-list">${
      list.map(p=>`<div class="cal-ps-item cal-ps-click" onclick="App.pModal('${p.id}')"><span class="cal-ps-dot" style="background:${p.pc}"></span><span class="cal-ps-name">${esc(p.pn)}</span><span class="cal-ps-h m">${p.h.toFixed(1)}h</span></div>`).join('')
    }</div></div>`;
  },

  calSetView(v){this.calView=v;this.rCal()},

  calPrev(){
    if(this.calView==='week'){
      const ws=this.calWeekStart;
      this.calWeekStart=new Date(ws.getFullYear(),ws.getMonth(),ws.getDate()-7);
    }else{this.calM--;if(this.calM<0){this.calM=11;this.calY--}}
    this.rCal();
  },
  calNext(){
    if(this.calView==='week'){
      const ws=this.calWeekStart;
      this.calWeekStart=new Date(ws.getFullYear(),ws.getMonth(),ws.getDate()+7);
    }else{this.calM++;if(this.calM>11){this.calM=0;this.calY++}}
    this.rCal();
  },
  calToday(){
    const n=new Date();
    this.calY=n.getFullYear();this.calM=n.getMonth();
    const dow=(n.getDay()+6)%7;
    this.calWeekStart=new Date(n.getFullYear(),n.getMonth(),n.getDate()-dow);
    this.rCal();
  },

  /* Detalle de un día: modal con lista de horas por timeline */
  calDetail(ds){
    const ps=D.ps(),es=[];
    ps.forEach(p=>{
      const hex=colorHex(p.color);
      p.horas.forEach(h=>{
        if(h.fecha===ds)es.push({...h,pn:p.nombre,pc:hex,pid:p.id});
      });
    });
    const tot=es.reduce((s,e)=>s+e.cantidad,0);

    /* Separar con hora / sin hora */
    const withTime=es.filter(e=>e.horaInicio).sort((a,b)=>a.horaInicio.localeCompare(b.horaInicio));
    const noTime=es.filter(e=>!e.horaInicio);

    let body='';
    if(withTime.length){
      body+=`<div class="hl">${withTime.map(e=>
        `<div class="hr" style="border-left-color:${e.pc}">`
        +`<span class="hr-d m" style="min-width:45px">${e.horaInicio}</span>`
        +`<span class="hr-t">${e.tipo==='trabajo'?'💻':'👥'}</span>`
        +`<span class="hr-a m">${e.cantidad}h</span>`
        +`<span style="color:var(--t1);font-size:.82rem;flex:1">${esc(e.pn)}</span>`
        +`<span class="hr-n">${esc(e.nota||'')}</span>`
        +`<span class="hr-e" onclick="App.cm();App.eHour('${e.pid}','${e.id}')" title="Editar">✎</span>`
        +`<span class="hr-e" onclick="App.cm();App.go('det','${e.pid}')" title="Ver proyecto">&rarr;</span>`
        +`</div>`).join('')}</div>`;
    }
    if(noTime.length){
      body+=`<div style="margin-top:.75rem;font-size:.72rem;color:var(--t3);text-transform:uppercase;letter-spacing:.04em;margin-bottom:.4rem">Sin hora asignada</div>`
        +`<div class="hl">${noTime.map(e=>
        `<div class="hr" style="border-left-color:${e.pc}">`
        +`<span class="hr-t">${e.tipo==='trabajo'?'💻':'👥'}</span>`
        +`<span class="hr-a m">${e.cantidad}h</span>`
        +`<span style="color:var(--t1);font-size:.82rem;flex:1">${esc(e.pn)}</span>`
        +`<span class="hr-n">${esc(e.nota||'')}</span>`
        +`<span class="hr-e" onclick="App.cm();App.eHour('${e.pid}','${e.id}')" title="Editar">✎</span>`
        +`<span class="hr-e" onclick="App.cm();App.go('det','${e.pid}')" title="Ver proyecto">&rarr;</span>`
        +`</div>`).join('')}</div>`;
    }
    if(!es.length){
      body+=`<div class="es"><div class="tx">Sin horas este día</div></div>`;
    }

    this.om(
      `<div class="mt">${fmtDate(ds)}</div>`
      +`<div style="margin-bottom:.75rem;font-size:.82rem;color:var(--t3)">Total: <span class="m">${tot.toFixed(1)}h</span></div>`
      +body
      +`<div class="ma"><button class="bt bt-p" onclick="App.cm();App.calAddHour('${ds}','')">+ Añadir hora</button><button class="bt" onclick="App.cm()">Cerrar</button></div>`
    );
  },

  /* Modal añadir hora desde calendario (con selector de proyecto) */
  calAddHour(fecha,hora,duracion){
    const ps=D.ps().filter(p=>p.estado!=='pagado');
    if(!ps.length){this.om(`<div class="mt">Añadir hora</div><div class="es"><div class="tx">Crea un proyecto primero</div></div><div class="ma"><button class="bt" onclick="App.cm()">Cerrar</button></div>`);return}
    const dur=duracion||1;
    this.om(`<div class="mt">Añadir hora</div>
      <div class="fg"><label>Proyecto</label><select id="chP">${ps.map(p=>`<option value="${p.id}">${esc(p.nombre)} — ${esc(p.cliente)}</option>`).join('')}</select></div>
      <label>Tipo</label>
      <div class="ts2"><div class="to on" data-type="trabajo" onclick="App.selT(this)"><span class="ic">💻</span><span class="la">Trabajo</span></div>
        <div class="to" data-type="reunion" onclick="App.selT(this)"><span class="ic">👥</span><span class="la">Reunión</span></div></div>
      <div class="fr"><div class="fg"><label>Horas</label><input type="number" id="chA" min="0.25" step="0.25" value="${dur}"></div>
        <div class="fg"><label>Fecha</label><input type="date" id="chD" value="${fecha||new Date().toISOString().slice(0,10)}"></div></div>
      <div class="fr"><div class="fg"><label>Hora inicio</label><input type="time" id="chHI" value="${hora||''}"></div><div class="fg"></div></div>
      <div class="fg"><label>Nota</label><input type="text" id="chN" placeholder="¿Qué hiciste?"></div>
      <div class="ma"><button class="bt" onclick="App.cm()">Cancelar</button><button class="bt bt-p" onclick="App.saveCalH()">Guardar</button></div>`);
  },

  /* Guardar hora desde calendario */
  saveCalH(){
    const pid=document.getElementById('chP').value;
    const tipo=document.querySelector('#mC .to.on')?.dataset.type||'trabajo';
    const cant=parseFloat(document.getElementById('chA').value)||0;
    const fecha=document.getElementById('chD').value||null;
    const horaInicio=document.getElementById('chHI').value||null;
    const nota=document.getElementById('chN').value.trim();
    if(cant<=0||!pid)return;
    const p=D.p(pid);if(!p)return;
    p.horas.push({id:uid(),fecha,tipo,cantidad:cant,nota,horaInicio});
    sortHoras(p.horas);D.up(pid,{horas:p.horas});this.cm();this.rCal();
  },

  /* ══════════════════════════════════════════════
   *  MODALS
   * ══════════════════════════════════════════════ */
  om(h){document.getElementById('mC').innerHTML=h;document.getElementById('mO').classList.add('on')},
  cm(){document.getElementById('mO').classList.remove('on')},

  /* Selector de color W3C — grid de swatches */
  colorSelect(currentName){
    const curHex=colorHex(currentName);
    let html=`<div class="cs-wrap"><div class="cs-hd"><div id="mpColorDot" class="cs-dot" style="background:${curHex}"></div><span id="mpColorLbl" class="cs-lbl">${currentName}</span></div>`;
    html+=`<input type="hidden" id="mpColor" value="${currentName}">`;
    html+=`<div class="cs-grid" onmouseleave="App._csReset()">`;
    for(const[group,colors] of Object.entries(W3C_COLORS)){
      colors.forEach(([name,hex])=>{
        html+=`<div class="cs-sw${name===currentName?' on':''}" style="background:${hex}" data-name="${name}" data-hex="${hex}" title="${name}" onmouseenter="App._csHover(this)" onclick="App._csPick(this)"></div>`;
      });
    }
    html+=`</div></div>`;
    return html;
  },
  _csHover(el){
    document.getElementById('mpColorDot').style.background=el.dataset.hex;
    document.getElementById('mpColorLbl').textContent=el.dataset.name;
  },
  _csReset(){
    const sel=document.getElementById('mpColor');
    if(!sel)return;
    const name=sel.value;
    document.getElementById('mpColorDot').style.background=colorHex(name);
    document.getElementById('mpColorLbl').textContent=name;
  },
  _csPick(el){
    document.querySelectorAll('.cs-sw.on').forEach(s=>s.classList.remove('on'));
    el.classList.add('on');
    document.getElementById('mpColor').value=el.dataset.name;
    document.getElementById('mpColorDot').style.background=el.dataset.hex;
    document.getElementById('mpColorLbl').textContent=el.dataset.name;
  },

  /* Modal crear/editar proyecto */
  pModal(eid){
    const isE=!!eid,p=isE?D.p(eid):null,st=D.d.settings;
    const df={
      nombre:p?.nombre||'',cliente:p?.cliente||'',color:p?.color||'CornflowerBlue',estado:p?.estado||'pendiente',
      inicio:p?.fechas?.inicio||'',finEst:p?.fechas?.finEstimada||'',finR:p?.fechas?.finReal||'',
      modo:p?.facturacion?.modo||'desde_base',base:p?.facturacion?.baseImponible||'',total:p?.facturacion?.total||'',
      iva:p?.facturacion?.iva??st.defaultIva,irpf:p?.facturacion?.irpf??st.defaultIrpf,
      ivaOn:p?(p.facturacion.iva>0):true,irpfOn:p?(p.facturacion.irpf>0):true,
      pagado:p?.facturacion?.pagado||false,fechaPago:p?.facturacion?.fechaPago||'',gastos:p?.facturacion?.gastos||'',notas:p?.notas||''
    };
    this.om(`<div class="mt">${isE?'Editar':'Nuevo proyecto'}</div>
      <div class="fr"><div class="fg"><label>Nombre</label><input type="text" id="mpN" value="${esc(df.nombre)}" placeholder="Web Conor"></div>
        <div class="fg"><label>Cliente</label><input type="text" id="mpCl" value="${esc(df.cliente)}" placeholder="Conor"></div></div>
      <div class="fg"><label>Color</label>${this.colorSelect(df.color)}</div>
      <div class="fg"><label>Estado</label><select id="mpSt">${Object.entries(EST).map(([k,v])=>`<option value="${k}" ${k===df.estado?'selected':''}>${v}</option>`).join('')}</select></div>
      <div class="fr"><div class="fg"><label>Inicio</label><input type="date" id="mpI" value="${df.inicio}"></div><div class="fg"><label>Fin estimada</label><input type="date" id="mpFE" value="${df.finEst}"></div></div>
      <div class="fg"><label>Fin real</label><input type="date" id="mpFR" value="${df.finR}" style="max-width:50%"></div>
      <div class="dst" style="margin-top:1.25rem">Facturación</div>
      <div class="bms">
        <button class="bm ${df.modo==='desde_base'?'on':''}" onclick="App.sBM('desde_base')">Desde base</button>
        <button class="bm ${df.modo==='desde_total'?'on':''}" onclick="App.sBM('desde_total')">Desde total</button>
        <button class="bm ${df.modo==='gratis'?'on':''}" onclick="App.sBM('gratis')">Gratis</button>
      </div><input type="hidden" id="mpBM" value="${df.modo}">
      <div id="bF" style="${df.modo==='gratis'?'display:none':''}">
        <div class="fr">
          <div class="fg" id="bfBase" style="${df.modo==='desde_total'?'display:none':''}"><label>Base (€)</label><input type="number" id="mpBa" value="${df.base}" step="0.01" placeholder="0.00" oninput="App.cPrev()"></div>
          <div class="fg" id="bfTot" style="${df.modo==='desde_base'?'display:none':''}"><label>Total (€)</label><input type="number" id="mpTo" value="${df.total}" step="0.01" placeholder="0.00" oninput="App.cPrev()"></div>
          <div class="fg"><label>Gastos (€)</label><input type="number" id="mpGa" value="${df.gastos}" step="0.01" placeholder="0.00"></div>
        </div>
        <div class="tr"><span class="tl">IVA (${df.iva}%)</span><label class="tg"><input type="checkbox" id="mpIva" ${df.ivaOn?'checked':''} onchange="App.cPrev()"><span class="ts"></span></label></div>
        <div class="tr"><span class="tl">IRPF (${df.irpf}%)</span><label class="tg"><input type="checkbox" id="mpIrpf" ${df.irpfOn?'checked':''} onchange="App.cPrev()"><span class="ts"></span></label></div>
        <div id="bPrev" class="bb" style="margin-top:.4rem"></div>
        <div class="tr" style="margin-top:.75rem"><span class="tl">Pagado</span><label class="tg"><input type="checkbox" id="mpPg" ${df.pagado?'checked':''} onchange="document.getElementById('mpFPw').style.display=this.checked?'block':'none'"><span class="ts"></span></label></div>
        <div id="mpFPw" style="${df.pagado?'':'display:none'}"><div class="fg"><label>Fecha pago</label><input type="date" id="mpFP" value="${df.fechaPago}"></div></div>
      </div>
      <div class="fg" style="margin-top:.75rem"><label>Notas</label><textarea id="mpNo" placeholder="...">${esc(df.notas)}</textarea></div>
      <div class="ma"><button class="bt" onclick="App.cm()">Cancelar</button><button class="bt bt-p" onclick="App.saveP('${eid||''}')">${isE?'Guardar':'Crear'}</button></div>`);
    this.cPrev();
  },

  /* Cambiar modo de facturación */
  sBM(m){
    document.getElementById('mpBM').value=m;
    document.querySelectorAll('.bm').forEach(b=>b.classList.remove('on'));
    document.querySelector(`.bm:nth-child(${m==='desde_base'?1:m==='desde_total'?2:3})`).classList.add('on');
    const f=document.getElementById('bF'),bf=document.getElementById('bfBase'),tf=document.getElementById('bfTot');
    if(m==='gratis')f.style.display='none';
    else{f.style.display='';bf.style.display=m==='desde_total'?'none':'';tf.style.display=m==='desde_base'?'none':''}
    this.cPrev();
  },

  /* Preview de facturación en tiempo real */
  cPrev(){
    const m=document.getElementById('mpBM')?.value;if(!m||m==='gratis')return;
    const ivaOn=document.getElementById('mpIva')?.checked,irpfOn=document.getElementById('mpIrpf')?.checked;
    const ivR=ivaOn?(D.d.settings.defaultIva||21):0,irR=irpfOn?(D.d.settings.defaultIrpf||15):0;
    let base,importeIva,importeIrpf,totalF,neto;
    if(m==='desde_base'){
      base=parseFloat(document.getElementById('mpBa')?.value)||0;
      importeIva=Math.round(base*ivR/100*100)/100;importeIrpf=Math.round(base*irR/100*100)/100;
      totalF=Math.round((base+importeIva-importeIrpf)*100)/100;neto=Math.round((base-importeIrpf)*100)/100;
    } else {
      const t=parseFloat(document.getElementById('mpTo')?.value)||0;
      const fac=1+ivR/100-irR/100;base=fac?Math.round(t/fac*100)/100:0;
      importeIva=Math.round(base*ivR/100*100)/100;importeIrpf=Math.round(base*irR/100*100)/100;
      totalF=t;neto=Math.round((base-importeIrpf)*100)/100;
    }
    const el=document.getElementById('bPrev');
    if(el)el.innerHTML=`<div class="br"><span class="la">Base</span><span class="va">${base.toFixed(2)} €</span></div>
      ${ivR?`<div class="br"><span class="la">+ IVA ${ivR}%</span><span class="va">${importeIva.toFixed(2)} €</span></div>`:''}
      ${irR?`<div class="br"><span class="la">- IRPF ${irR}%</span><span class="va">${importeIrpf.toFixed(2)} €</span></div>`:''}
      <div class="br tot"><span class="la">Total</span><span class="va">${totalF.toFixed(2)} €</span></div>
      <div class="br"><span class="la">Neto</span><span class="va" style="color:var(--ok)">${neto.toFixed(2)} €</span></div>`;
  },

  /* Guardar proyecto (crear o editar) */
  saveP(eid){
    const nombre=document.getElementById('mpN').value.trim(),cliente=document.getElementById('mpCl').value.trim();
    if(!nombre){alert('Nombre obligatorio');return}
    const color=document.getElementById('mpColor').value;
    const estado=document.getElementById('mpSt').value,modo=document.getElementById('mpBM').value;
    const ivaOn=document.getElementById('mpIva')?.checked,irpfOn=document.getElementById('mpIrpf')?.checked;
    const proj={id:eid||uid(),nombre,cliente,color,estado,
      fechas:{inicio:document.getElementById('mpI').value||null,finEstimada:document.getElementById('mpFE').value||null,finReal:document.getElementById('mpFR').value||null},
      facturacion:{modo,baseImponible:parseFloat(document.getElementById('mpBa')?.value)||0,total:parseFloat(document.getElementById('mpTo')?.value)||0,
        iva:ivaOn?(D.d.settings.defaultIva||21):0,irpf:irpfOn?(D.d.settings.defaultIrpf||15):0,
        importeIva:0,importeIrpf:0,totalFactura:0,netoRecibido:0,
        pagado:document.getElementById('mpPg')?.checked||false,fechaPago:document.getElementById('mpFP')?.value||null,
        gastos:parseFloat(document.getElementById('mpGa')?.value)||0},
      horas:eid?(D.p(eid)?.horas||[]):[],notas:document.getElementById('mpNo').value.trim()};
    B.calc(proj);
    if(eid)D.up(eid,proj);else D.add(proj);
    this.cm();
    if(this.cv==='det')this.rDet(proj.id);else this.go(this.cv);
  },

  /* Modal añadir horas (desde detalle) */
  hModal(pid){
    this.om(`<div class="mt">Añadir horas</div>
      <label>Tipo</label>
      <div class="ts2"><div class="to on" data-type="trabajo" onclick="App.selT(this)"><span class="ic">💻</span><span class="la">Trabajo</span></div>
        <div class="to" data-type="reunion" onclick="App.selT(this)"><span class="ic">👥</span><span class="la">Reunión</span></div></div>
      <div class="fr"><div class="fg"><label>Horas</label><input type="number" id="mhA" min="0.25" step="0.25" value="1"></div>
        <div class="fg"><label>Fecha</label><input type="date" id="mhD" value="${new Date().toISOString().slice(0,10)}"><label style="margin-top:.35rem;display:flex;align-items:center;gap:.4rem;cursor:pointer;text-transform:none;letter-spacing:0"><input type="checkbox" id="mhNd" onchange="document.getElementById('mhD').disabled=this.checked;if(this.checked)document.getElementById('mhD').value=''" style="width:auto;accent-color:var(--t2)"> Sin fecha</label></div></div>
      <div class="fr"><div class="fg"><label>Hora inicio</label><input type="time" id="mhHI" value=""></div><div class="fg"></div></div>
      <div class="fg"><label>Nota</label><input type="text" id="mhN" placeholder="¿Qué hiciste?"></div>
      <div class="ma"><button class="bt" onclick="App.cm()">Cancelar</button><button class="bt bt-p" onclick="App.saveHM('${pid}')">Guardar</button></div>`);
  },

  /* Guardar hora desde modal */
  saveHM(pid){
    const tipo=document.querySelector('#mC .to.on')?.dataset.type||'trabajo',
      cant=parseFloat(document.getElementById('mhA').value)||0,
      sinF=document.getElementById('mhNd')?.checked,
      fecha=sinF?null:(document.getElementById('mhD').value||null),
      horaInicio=document.getElementById('mhHI').value||null,
      nota=document.getElementById('mhN').value.trim();
    if(cant<=0)return;const p=D.p(pid);if(!p)return;
    p.horas.push({id:uid(),fecha,tipo,cantidad:cant,nota,horaInicio});
    sortHoras(p.horas);D.up(pid,{horas:p.horas});this.cm();this.rDet(pid);
  },

  /* ══════════════════════════════════════════════
   *  EXPORT / IMPORT
   * ══════════════════════════════════════════════ */
  exp(){
    const d=JSON.stringify(D.d,null,2),b=new Blob([d],{type:'application/json'}),u=URL.createObjectURL(b),a=document.createElement('a');
    const now=new Date();
    const ts=`${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}_${String(now.getHours()).padStart(2,'0')}-${String(now.getMinutes()).padStart(2,'0')}`;
    a.href=u;a.download=`trackr_backup_${ts}.json`;a.click();URL.revokeObjectURL(u);
  },

  imp(ev){
    const f=ev.target.files[0];if(!f)return;const r=new FileReader();
    r.onload=e=>{try{
      const d=JSON.parse(e.target.result);
      if(!d.projects||!Array.isArray(d.projects)){alert('JSON no válido');return}
      if(!d.settings)d.settings={defaultIva:21,defaultIrpf:15};
      D.load(d);this.go(this.cv);
    }catch(err){alert('Error: '+err.message)}};
    r.readAsText(f);ev.target.value='';
  }
};

/* ── Arranque ── */
document.addEventListener('DOMContentLoaded',()=>App.init());
