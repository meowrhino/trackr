/* TRACKR — Service Worker (PWA, offline).
 * Estrategia: NETWORK-FIRST con fallback a cache (evita quedar atrapado en versiones
 * viejas durante desarrollo; siempre fresco online, funciona offline).
 * NO toca el API (trackr-api, otro origen): solo cachea assets del propio origen.
 */
const CACHE = 'trackr-v1';

self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  if (new URL(req.url).origin !== self.location.origin) return; // el API y CDNs se dejan pasar tal cual
  e.respondWith((async () => {
    try {
      /* no-cache en los archivos: se pregunta siempre al servidor si han cambiado (un 304 si no).
         Sin esto, justo después de publicar, la caché HTTP podía dar un app.js nuevo con un utils.js
         viejo. Las navegaciones van tal cual: rehacerlas sigue las redirecciones por su cuenta
         (/303.html → /303) y el navegador rechaza esa respuesta: página de error. */
      const res = await fetch(req.mode === 'navigate' ? req : new Request(req, { cache: 'no-cache' }));
      if (res && res.ok && !res.redirected && res.type === 'basic') { const c = await caches.open(CACHE); c.put(req, res.clone()); }
      return res;
    } catch (err) {
      const cached = await caches.match(req);
      if (cached) return cached;
      if (req.mode === 'navigate') return (await caches.match('/')) || (await caches.match('/index.html')) || Response.error();
      return Response.error();
    }
  })());
});

/* Primera visita: cuando la página pidió sus archivos este service worker aún no la controlaba,
   así que no guardó ninguno y, sin red, la app instalada no abría hasta la segunda visita.
   La página (js/pwa.js) manda la lista de lo que ha cargado y aquí se guarda lo que falte. */
self.addEventListener('message', (e) => {
  if (!e.data || e.data.type !== 'precache' || !Array.isArray(e.data.urls)) return;
  const urls = e.data.urls.filter((u) => { try { return new URL(u, self.location.origin).origin === self.location.origin; } catch (err) { return false; } }).slice(0, 200);
  e.waitUntil((async () => {
    const c = await caches.open(CACHE);
    await Promise.all(urls.map(async (u) => {
      try {
        if (await c.match(u)) return;
        const res = await fetch(u, { cache: 'no-cache' });
        if (res && res.ok && !res.redirected) await c.put(u, res); /* una redirección guardada daría error sin red */
      } catch (err) { /* sin red: la próxima vez */ }
    }));
  })());
});
