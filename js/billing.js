/* ================================================
 * TRACKR — Billing (cálculos de facturación)
 * IVA, IRPF, neto, rentabilidad por hora
 * Globales: B
 * Dependencias: ninguna
 * ================================================ */

const B={
  /**
   * Calcula todos los importes de facturación de un proyecto.
   * Modos: 'gratis', 'desde_base', 'desde_total', 'por_hora'.
   * En modo 'por_hora', base = horas × precioHora.
   */
  calc(p){
    const f=p.facturacion;

    /* Proyecto gratuito: todo a cero */
    if(f.modo==='gratis'){
      f.importeIva=0;f.importeIrpf=0;f.totalFactura=0;f.netoRecibido=0;f.baseImponible=0;f.total=0;
      return f;
    }

    const iv=f.iva||0, ir=f.irpf||0;

    if(f.modo==='por_hora'){
      /* Base = total horas × precio por hora */
      const th=p.horas.reduce((s,h)=>s+h.cantidad,0);
      const b=Math.round(th*(f.precioHora||0)*100)/100;
      f.baseImponible=b;
      f.importeIva=Math.round(b*iv/100*100)/100;
      f.importeIrpf=Math.round(b*ir/100*100)/100;
      f.totalFactura=Math.round((b+f.importeIva-f.importeIrpf)*100)/100;
      f.netoRecibido=Math.round((b-f.importeIrpf)*100)/100;
      f.total=f.totalFactura;
    } else if(f.modo==='desde_base'){
      /* Calcula total a partir de la base imponible */
      const b=f.baseImponible||0;
      f.importeIva=Math.round(b*iv/100*100)/100;
      f.importeIrpf=Math.round(b*ir/100*100)/100;
      f.totalFactura=Math.round((b+f.importeIva-f.importeIrpf)*100)/100;
      f.netoRecibido=Math.round((b-f.importeIrpf)*100)/100;
      f.total=f.totalFactura;
    } else {
      /* Calcula base a partir del total (desde_total) */
      const t=f.total||0, fac=1+iv/100-ir/100;
      const b=fac?Math.round(t/fac*100)/100:0;
      f.baseImponible=b;
      f.importeIva=Math.round(b*iv/100*100)/100;
      f.importeIrpf=Math.round(b*ir/100*100)/100;
      f.totalFactura=t;
      f.netoRecibido=Math.round((b-f.importeIrpf)*100)/100;
    }

    return f;
  },

  /* Calcula €/hora (rentabilidad) */
  eph(p){
    const h=p.horas.reduce((s,x)=>s+x.cantidad,0);
    if(!h) return null;
    return Math.round(((p.facturacion.netoRecibido||0)-(p.facturacion.gastos||0))/h*100)/100;
  }
};
