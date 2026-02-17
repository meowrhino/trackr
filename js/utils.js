/* ================================================
 * TRACKR — Utilidades
 * Constantes de estado, calendario, generador de IDs, escape HTML, formato fecha
 * Globales: EST, MESES, DIAS_SEM, uid(), esc(), fmtDate()
 * Dependencias: ninguna
 * ================================================ */

/* Mapa de estados internos → etiquetas visibles */
const EST = {
  pendiente:'Pendiente',
  en_progreso:'En progreso',
  completado:'Completado',
  recurrente:'Recurrente',
  facturado:'Facturado',
  pagado:'Pagado'
};

/* Meses y días de la semana en español (para calendario) */
const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio',
               'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
const DIAS_SEM = ['Lun','Mar','Mié','Jue','Vie','Sáb','Dom'];

/* Genera un ID único tipo xxxx-xxxx-xxxx */
function uid(){
  return 'xxxx-xxxx-xxxx'.replace(/x/g,()=>((Math.random()*16)|0).toString(16));
}

/* Escapa HTML para prevenir XSS */
function esc(s){
  const d=document.createElement('div');
  d.textContent=s;
  return d.innerHTML;
}

/* Formatea fecha YYYY-MM-DD → DD-MM-YYYY */
function fmtDate(s){
  if(!s) return '—';
  const p=s.split('-');
  return p.length===3 ? `${p[2]}-${p[1]}-${p[0]}` : s;
}

/* Ordena array de horas por fecha (antiguas→recientes) y luego por horaInicio.
   Sin fecha van al final. Modifica el array in-place y lo devuelve. */
function sortHoras(arr){
  return arr.sort((a,b)=>{
    if(!a.fecha&&!b.fecha)return 0;
    if(!a.fecha)return 1;
    if(!b.fecha)return -1;
    const cf=a.fecha.localeCompare(b.fecha);
    if(cf!==0)return cf;
    if(!a.horaInicio&&!b.horaInicio)return 0;
    if(!a.horaInicio)return 1;
    if(!b.horaInicio)return -1;
    return a.horaInicio.localeCompare(b.horaInicio);
  });
}
