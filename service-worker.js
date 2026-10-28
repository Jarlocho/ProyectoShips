// Service Worker de "Viva el Amor"
// Hace que el juego funcione sin internet después de abrirlo una vez.
// Usa "primero internet, si no hay, la copia guardada", así que cuando
// cambies el arte se actualiza solo (no hay que cambiar versiones).

importScripts('./config.js'); // para saber qué imágenes guardar

const CACHE = 'viva-el-amor';

const ASSETS = [
  './',
  './index.html',
  './style.css',
  './config.js',
  './script.js',
  './manifest.json',
  './icono-192.png',
  './icono-512.png',
  ...Object.values(CONFIG.arte.centro),
  ...Object.values(CONFIG.arte.movible),
  CONFIG.arte.final
].map((p) => (p.startsWith('./') ? p : './' + p));

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    await Promise.allSettled(ASSETS.map((url) => cache.add(new Request(url, { cache: 'reload' }))));
    self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET' || !req.url.startsWith(self.location.origin)) return;

  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    try {
      const res = await fetch(req, { cache: 'no-cache' });
      if (res.ok) cache.put(req, res.clone());
      return res;
    } catch (err) {
      const cached = await cache.match(req, { ignoreSearch: true });
      if (cached) return cached;
      if (req.mode === 'navigate') {
        const pagina = await cache.match('./index.html');
        if (pagina) return pagina;
      }
      throw err;
    }
  })());
});
