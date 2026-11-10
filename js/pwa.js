/* ================================================
 * TRACKR — Invitación a instalar la PWA.
 * La app YA es instalable (manifest + service worker); esto solo lo hace
 * descubrible: banner descartable + botón en Configuración + instrucciones
 * para iOS (Safari/iPhone no dispara `beforeinstallprompt`).
 * Global: PWA. Textos en lang.js (prefijo pwa.).
 * ================================================ */
(() => {
  const L = () => (typeof _lang !== 'undefined' ? _lang : 'es');
  const t = (k) => window.t('pwa.' + k); /* textos en lang.js, prefijo pwa. */
  const DKEY = 'trackr_pwa_dismissed';

  let deferred = null; // el evento beforeinstallprompt diferido (Chrome/Edge/Brave en Android/desktop)

  function isStandalone() {
    return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
  }
  function isIOS() {
    return /iphone|ipad|ipod/i.test(navigator.userAgent)
      || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1); // iPad iOS 13+ se hace pasar por Mac
  }
  function dismissed() { try { return localStorage.getItem(DKEY) === '1'; } catch (e) { return false; } }
  // ¿Tiene sentido ofrecer instalar? No si ya está instalada; sí si hay prompt nativo o es iOS (instalación manual).
  function offerable() { return !isStandalone() && (deferred !== null || isIOS()); }

  function renderBanner() {
    const el = document.getElementById('pwaBanner');
    if (!el) return;
    if (!offerable() || dismissed()) { el.style.display = 'none'; el.innerHTML = ''; return; }
    el.style.display = '';
    el.innerHTML = `<span class="pwa-ico">⤓</span>`
      + `<span class="pwa-txt">${t('banner')}</span>`
      + `<button class="bt bt-p bt-s" onclick="PWA.install()">${deferred ? t('install') : t('how')}</button>`
      + `<button class="pwa-x" onclick="PWA.dismiss()" aria-label="${t('later')}" title="${t('later')}">&times;</button>`;
  }

  // Sección para Configuración: siempre accesible, aunque se haya descartado el banner.
  function cfgSection() {
    if (isStandalone()) {
      return `<div class="cfg-section"><div class="cfg-section-title">${t('cfgTitle')}</div>`
        + `<div class="acc-status ok">${t('installed')}</div></div>`;
    }
    if (!offerable()) return '';
    return `<div class="cfg-section"><div class="cfg-section-title">${t('cfgTitle')}</div>`
      + `<div style="color:var(--t3);font-size:.82rem;margin-bottom:.75rem">${t('cfgDesc')}</div>`
      + `<button class="bt bt-p" onclick="PWA.install()">${deferred ? t('install') : t('how')}</button></div>`;
  }

  async function install() {
    if (deferred) {
      try { deferred.prompt(); await deferred.userChoice; } catch (e) { /* */ }
      deferred = null; // un beforeinstallprompt solo se puede usar una vez
      render();
    } else {
      showIosModal();
    }
  }

  function showIosModal() {
    if (typeof App === 'undefined' || !App.om) return;
    const steps = t('iosSteps').map((s) => `<li style="margin-bottom:.5rem">${s}</li>`).join('');
    App.om(`<div class="mt">${t('iosTitle')}</div>`
      + `<ol style="line-height:1.5;color:var(--t1);margin:0 0 .85rem 1.15rem;padding:0;font-size:.9rem">${steps}</ol>`
      + `<div style="color:var(--t3);font-size:.8rem">${t('iosNote')}</div>`
      + `<div class="ma"><button class="bt bt-p" onclick="App.cm()">${t('ok')}</button></div>`);
  }

  function dismiss() { try { localStorage.setItem(DKEY, '1'); } catch (e) { /* */ } renderBanner(); }

  // Re-renderiza banner + (si estamos en Configuración) la sección de instalar.
  function render() { renderBanner(); if (typeof App !== 'undefined' && App.cv === 'cfg' && App.rCfg) App.rCfg(); }

  window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); deferred = e; render(); });
  window.addEventListener('appinstalled', () => {
    deferred = null;
    try { localStorage.setItem(DKEY, '1'); } catch (e) { /* */ }
    if (typeof Toast !== 'undefined') Toast.ok(t('done'));
    render();
  });

  document.addEventListener('DOMContentLoaded', renderBanner);

  window.PWA = { install, dismiss, render, renderBanner, cfgSection, offerable, isStandalone };
})();
