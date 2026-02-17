/* ================================================
 * TRACKR — Store (capa de datos)
 * Persistencia en localStorage, CRUD de proyectos
 * Globales: D
 * Dependencias: ninguna
 * ================================================ */

const D={
  d:null,

  /* Intenta cargar datos existentes de localStorage */
  init(){
    const s=localStorage.getItem('trackr_data');
    if(s){try{this.d=JSON.parse(s);return true}catch{}}
    return false;
  },

  /* Crea estructura de datos vacía */
  create(){
    this.d={projects:[],settings:{defaultIva:21,defaultIrpf:15,usuario:''}};
    this.save();
  },

  /* Persiste en localStorage */
  save(){localStorage.setItem('trackr_data',JSON.stringify(this.d))},

  /* Obtiene todos los proyectos */
  ps(){return this.d.projects},

  /* Obtiene un proyecto por ID */
  p(id){return this.d.projects.find(p=>p.id===id)},

  /* Añade un proyecto */
  add(p){this.d.projects.push(p);this.save()},

  /* Actualiza un proyecto por ID */
  up(id,u){
    const i=this.d.projects.findIndex(p=>p.id===id);
    if(i!==-1){Object.assign(this.d.projects[i],u);this.save()}
  },

  /* Elimina un proyecto por ID */
  del(id){this.d.projects=this.d.projects.filter(p=>p.id!==id);this.save()},

  /* Carga datos importados (reemplaza todo) */
  load(j){this.d=j;this.save()}
};
