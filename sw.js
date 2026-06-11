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
      const res = await fetch(req);
      if (res && res.ok) { const c = await caches.open(CACHE); c.put(req, res.clone()); }
      return res;
    } catch (err) {
      const cached = await caches.match(req);
      if (cached) return cached;
      if (req.mode === 'navigate') return (await caches.match('/index.html')) || (await caches.match('/')) || Response.error();
      return Response.error();
    }
  })());
});
