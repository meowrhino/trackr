/* ================================================
 * TRACKR — Toast notifications
 * Notificaciones no-bloqueantes tipo toast
 * Globales: Toast
 * Dependencias: ninguna (usa CSS variables del tema)
 * ================================================ */

const Toast = {
  /** actions: [{ label, fn }] opcional; cada botón ejecuta fn y cierra el toast. */
  show(msg, type = 'info', duration = 3000, actions) {
    const el = document.createElement('div');
    el.className = `toast toast-${type}`;
    el.textContent = msg;
    if (actions && actions.length) {
      const row = document.createElement('div');
      row.className = 'toast-acts';
      actions.forEach(a => {
        const b = document.createElement('button');
        b.type = 'button';
        b.textContent = a.label;
        b.onclick = () => { this.dismiss(el); a.fn(); };
        row.appendChild(b);
      });
      el.appendChild(row);
    }
    document.getElementById('toasts').appendChild(el);
    requestAnimationFrame(() => el.classList.add('on'));
    if (duration > 0) setTimeout(() => this.dismiss(el), duration);
    return el;
  },
  dismiss(el) {
    el.dataset.gone = '1'; // ya se está yendo aunque siga en el DOM hasta acabar la transición
    el.classList.remove('on');
    el.addEventListener('transitionend', () => el.remove());
  },
  ok(msg)    { return this.show(msg, 'ok'); },
  warn(msg)  { return this.show(msg, 'warn', 4000); },
  error(msg) { return this.show(msg, 'error', 5000); },
  info(msg)  { return this.show(msg, 'info'); }
};
