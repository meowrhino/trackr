/* ================================================
 * TRACKR — Analytics (tracking anónimo de uso)
 * Envía eventos agregados a un Cloudflare Worker
 * No recoge datos personales, IPs ni cookies
 * Globales: T
 * Dependencias: ninguna
 * ================================================ */

const T={
  endpoint:null, // URL del Worker, se configura con T.init('https://...')
  queue:[],
  sid:Math.random().toString(36).slice(2,10), // sesión anónima (no persiste)

  /* Inicializa con la URL del Worker */
  init(url){
    if(!url)return;
    this.endpoint=url;
    /* Enviar al cerrar/cambiar de pestaña */
    document.addEventListener('visibilitychange',()=>{
      if(document.visibilityState==='hidden')this.flush();
    });
    /* Flush periódico cada 30s */
    setInterval(()=>this.flush(),30000);
  },

  /* Registra un evento */
  ev(category,action,label){
    if(!this.endpoint)return;
    this.queue.push({c:category,a:action,l:label||null,t:Date.now()});
    /* Flush si hay muchos eventos acumulados */
    if(this.queue.length>=20)this.flush();
  },

  /* Envía la cola al Worker */
  flush(){
    if(!this.endpoint||!this.queue.length)return;
    const payload=JSON.stringify({sid:this.sid,events:this.queue});
    this.queue=[];
    /* sendBeacon es no-bloqueante y sobrevive al cierre de página */
    if(navigator.sendBeacon){
      navigator.sendBeacon(this.endpoint,payload);
    }else{
      fetch(this.endpoint,{method:'POST',body:payload,keepalive:true}).catch(()=>{});
    }
  }
};
