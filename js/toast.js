/* ================================================
 * TRACKR — Toast notifications
 * Notificaciones no-bloqueantes tipo toast
 * Globales: Toast
 * Dependencias: ninguna (usa CSS variables del tema)
 * ================================================ */

const Toast = {
  show(msg, type = 'info', duration = 3000) {
    const el = document.createElement('div');
    el.className = `toast toast-${type}`;
    el.textContent = msg;
    document.getElementById('toasts').appendChild(el);
    requestAnimationFrame(() => el.classList.add('on'));
    if (duration > 0) setTimeout(() => this.dismiss(el), duration);
    return el;
  },
  dismiss(el) {
    el.classList.remove('on');
    el.addEventListener('transitionend', () => el.remove());
  },
  ok(msg)    { return this.show(msg, 'ok'); },
  warn(msg)  { return this.show(msg, 'warn', 4000); },
  error(msg) { return this.show(msg, 'error', 5000); },
  info(msg)  { return this.show(msg, 'info'); }
};
