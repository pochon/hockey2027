/* ============================================================
   Hockey Santa Fe 2027 — service-worker.js
   Cachea el "app shell" para que el sitio funcione sin conexión.
   Estrategia: network-first para navegación, cache-first para
   recursos estáticos.
   ============================================================ */
'use strict';

const CACHE_NAME = 'hockey2027-v16';

const RECURSOS = [
  './',
  './index.html',
  './manifest.json',
  './img/banner.jpg',
  './assets/img/eventos/costanera-01.jpg',
  './assets/img/eventos/liverpool-01.jpg',
  './assets/img/eventos/union-progreso-01.jpg',
  './assets/img/eventos/encuentro-regional-01.jpg',
  './assets/img/eventos/rosario-02.jpg',
  './img/Costanera/c.jpg',
  './img/Costanera/d.jpg',
  './img/Costanera/e.jpg',
  './assets/css/styles.css',
  './assets/js/app.js',
  './assets/js/gallery.js',
  './assets/js/animations.js',
  './assets/js/mapa.js',
  './assets/js/lightbox.js',
  './assets/js/contacto.js',
  './assets/vendor/photoswipe/photoswipe.css',
  './assets/vendor/photoswipe/photoswipe.esm.min.js',
  './assets/vendor/photoswipe/photoswipe-lightbox.esm.min.js',
  './assets/vendor/leaflet/leaflet.css',
  './assets/vendor/leaflet/leaflet.js',
  './data/contenido.json',
];

/* ---------- Instalación ---------- */
self.addEventListener('install', (evento) => {
  evento.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) =>
        /* addAll falla entero si un recurso no existe: agregar uno por uno */
        Promise.all(
          RECURSOS.map((recurso) =>
            cache.add(recurso).catch((error) => {
              console.warn('[SW] No se pudo cachear:', recurso, error);
            })
          )
        )
      )
      .then(() => self.skipWaiting())
  );
});

/* ---------- Activación ---------- */
self.addEventListener('activate', (evento) => {
  evento.waitUntil(
    caches
      .keys()
      .then((claves) =>
        Promise.all(
          claves
            .filter((clave) => clave !== CACHE_NAME)
            .map((clave) => caches.delete(clave))
        )
      )
      .then(() => self.clients.claim())
  );
});

/* ---------- Fetch ---------- */
self.addEventListener('fetch', (evento) => {
  const peticion = evento.request;

  /* Solo GET del mismo origen */
  if (peticion.method !== 'GET') return;

  const url = new URL(peticion.url);
  if (url.origin !== self.location.origin) return;

  /* Navegación: red primero, cache como respaldo */
  if (peticion.mode === 'navigate') {
    evento.respondWith(
      fetch(peticion)
        .then((respuesta) => {
          const copia = respuesta.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(peticion, copia));
          return respuesta;
        })
        .catch(() =>
          caches
            .match(peticion)
            .then((respuesta) => respuesta || caches.match('./index.html'))
        )
    );
    return;
  }

  /* Estáticos: red primero (para no servir versiones viejas),
     cache como respaldo cuando no hay conexión */
  evento.respondWith(
    fetch(peticion)
      .then((redRespuesta) => {
        if (redRespuesta && redRespuesta.ok) {
          const copia = redRespuesta.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(peticion, copia));
        }
        return redRespuesta;
      })
      .catch(() =>
        caches.match(peticion).then(
          (respuesta) =>
            respuesta ||
            new Response('', {
              status: 504,
              statusText: 'Sin conexión',
            })
        )
      )
  );
});
