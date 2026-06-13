// Service Worker de "Viva el Amor"
// Permite que el juego funcione sin internet despues de la primera vez.
// Si cambias archivos del juego, sube el numero de version (v1 -> v2)
// para que se actualice la cache.

const CACHE = "viva-el-amor-v1";

const ASSETS = [
  "./",
  "./index.html",
  "./style.css",
  "./script.js",
  "./manifest.json",
  "./icono-192.png",
  "./icono-512.png",
  "./beso.jpg",
  "./personajeA/pupilas.png",
  "./personajeA/cuerpo.png",
  "./personajeA/manzanaLlorando.png",
  "./personajeA/llorandoPorAbandono.png",
  "./personajeB/naranjaNormal.png",
  "./personajeB/naranjaMolesta.png",
  "./personajeB/naranjaTimida.png",
  "./personajeB/naranjaSacadaDePedo.png"
];

// Instalacion: guarda todos los archivos en la cache.
self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE);
      // allSettled: si algun archivo falla, no se cae toda la instalacion.
      await Promise.allSettled(ASSETS.map((url) => cache.add(url)));
      self.skipWaiting();
    })()
  );
});

// Activacion: borra caches viejas de versiones anteriores.
self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))
      );
      await self.clients.claim();
    })()
  );
});

// Peticiones: primero busca en cache, si no esta usa internet.
self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  event.respondWith(
    (async () => {
      const cached = await caches.match(req);
      if (cached) return cached;

      try {
        const res = await fetch(req);
        const cache = await caches.open(CACHE);
        cache.put(req, res.clone());
        return res;
      } catch (err) {
        // Sin internet: si es una navegacion, devuelve la pagina principal.
        if (req.mode === "navigate") {
          const fallback = await caches.match("./index.html");
          if (fallback) return fallback;
        }
        throw err;
      }
    })()
  );
});