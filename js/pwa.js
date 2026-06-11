/* ================================================
 * TRACKR — Invitación a instalar la PWA.
 * La app YA es instalable (manifest + service worker); esto solo lo hace
 * descubrible: banner descartable + botón en Configuración + instrucciones
 * para iOS (Safari/iPhone no dispara `beforeinstallprompt`).
 * Global: PWA. Textos i18n inline (es/en/ca) — migrar a lang.js si se valida.
 * ================================================ */
(() => {
  const L = () => (typeof _lang !== 'undefined' ? _lang : 'es');
  const TXT = {
    es: {
      banner: 'Instala TRACKR en tu dispositivo: se abre como una app y funciona sin conexión.',
      install: 'Instalar', how: 'Cómo instalar', later: 'Ahora no',
      cfgTitle: 'Instalar como app', cfgDesc: 'Añade TRACKR a tu pantalla de inicio para abrirla como una app, también sin conexión.',
      installed: '✓ TRACKR ya está instalada en este dispositivo.',
      iosTitle: 'Instalar en iPhone o iPad',
      iosSteps: ['Pulsa el botón <strong>Compartir</strong> (el cuadrado con una flecha hacia arriba).', 'Desplázate y elige <strong>«Añadir a pantalla de inicio»</strong>.', 'Confirma con <strong>«Añadir»</strong>.'],
      iosNote: 'En iPhone/iPad la instalación funciona mejor desde Safari.',
      ok: 'Entendido', done: '¡Instalada! Ábrela desde tu pantalla de inicio.',
    },
    en: {
      banner: 'Install TRACKR on your device: it opens like an app and works offline.',
      install: 'Install', how: 'How to install', later: 'Not now',
      cfgTitle: 'Install as an app', cfgDesc: 'Add TRACKR to your home screen to open it like an app, also offline.',
      installed: '✓ TRACKR is already installed on this device.',
      iosTitle: 'Install on iPhone or iPad',
      iosSteps: ['Tap the <strong>Share</strong> button (the square with an up arrow).', 'Scroll and choose <strong>“Add to Home Screen”</strong>.', 'Confirm with <strong>“Add”</strong>.'],
      iosNote: 'On iPhone/iPad, installing works best from Safari.',
      ok: 'Got it', done: 'Installed! Open it from your home screen.',
    },
    ca: {
      banner: 'Instal·la TRACKR al teu dispositiu: s\'obre com una app i funciona sense connexió.',
      install: 'Instal·lar', how: 'Com instal·lar', later: 'Ara no',
      cfgTitle: 'Instal·lar com a app', cfgDesc: 'Afegeix TRACKR a la teva pantalla d\'inici per obrir-la com una app, també sense connexió.',
      installed: '✓ TRACKR ja està instal·lada en aquest dispositiu.',
      iosTitle: 'Instal·lar a l\'iPhone o iPad',
      iosSteps: ['Prem el botó <strong>Comparteix</strong> (el quadrat amb una fletxa cap amunt).', 'Desplaça\'t i tria <strong>«Afegeix a la pantalla d\'inici»</strong>.', 'Confirma amb <strong>«Afegeix»</strong>.'],
      iosNote: 'A l\'iPhone/iPad la instal·lació funciona millor des de Safari.',
      ok: 'Entesos', done: 'Instal·lada! Obre-la des de la teva pantalla d\'inici.',
    },
  };
  const t = (k) => (TXT[L()] || TXT.es)[k] || k;
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
